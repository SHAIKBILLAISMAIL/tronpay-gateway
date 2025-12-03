'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { getRiskAssessmentForTransaction, TransactionWithRisk } from './actions';
import { AssessTransactionRiskOutput } from '@/ai/ai-risk-assessment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, collectionGroup } from 'firebase/firestore';


const getRiskScoreColor = (score: number) => {
  if (score > 80) return 'text-red-500';
  if (score > 60) return 'text-yellow-500';
  return 'text-green-500';
};

const RiskAssessmentPage = () => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = React.useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = React.useState<
    AssessTransactionRiskOutput & { transactionId: string } | null
  >(null);
  const auth = useAuth();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return query(
        collection(firestore, 'users', auth.currentUser.uid, 'all_transactions'),
        orderBy('amount', 'desc')
    );
  }, [firestore, auth.currentUser]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  const highRiskTransactions = useMemo(() => {
    return (transactions || [])
    .filter(tx => tx.amount > 500) // Filter on the client side
    .map(tx => ({...tx, id: tx.id, initialRiskScore: Math.floor(Math.random() * 40) + 60, reason: 'High amount or unusual activity'}));
  }, [transactions]);


  const handleScan = async (transaction: TransactionWithRisk) => {
    setIsScanning(transaction.id);
    const result = await getRiskAssessmentForTransaction(transaction);
    setIsScanning(null);

    if (result.success && result.data) {
      setSelectedAlert({ ...result.data, transactionId: transaction.id });
    } else {
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description:
          result.error || 'The AI risk assessment could not be completed.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="p-0">
        <CardTitle>AI-Powered Risk Assessment</CardTitle>
        <CardDescription>
          Monitor transactions for suspicious activities and potential risks.
        </CardDescription>
      </CardHeader>
      <Card>
        <CardContent className="pt-6">
            {isLoading && <p>Loading high-risk transactions...</p>}
            {!isLoading && highRiskTransactions.length === 0 && <p>No high-risk transactions detected.</p>}
            {!isLoading && highRiskTransactions.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="hidden md:table-cell">Timestamp</TableHead>
                <TableHead>Initial Risk</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highRiskTransactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs font-medium max-w-[100px] truncate">
                      {tx.transactionHash}
                    </TableCell>
                    <TableCell>
                       {tx.amount.toLocaleString()} {tx.currencyType}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tx.reason}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {tx.timestamp.toDate().toLocaleString()}
                    </TableCell>
                     <TableCell>
                      <div
                        className={`font-bold ${getRiskScoreColor(
                          tx.initialRiskScore
                        )}`}
                      >
                        {tx.initialRiskScore}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="sm" onClick={() => handleScan(tx)} disabled={isScanning === tx.id}>
                        <ScanLine className="mr-2 h-4 w-4" />
                        {isScanning === tx.id ? 'Scanning...' : 'Re-Scan'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
            )}
        </CardContent>
      </Card>
      
      {selectedAlert && (
        <AlertDialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>AI Risk Assessment Result</AlertDialogTitle>
              <AlertDialogDescription>
                Transaction ID: <span className="font-mono">{selectedAlert.transactionId}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
               <div>
                <h3 className="font-semibold">Risk Score: <span className={getRiskScoreColor(selectedAlert.riskScore)}>{selectedAlert.riskScore} ({selectedAlert.riskLevel})</span></h3>
              </div>
               <div>
                <h3 className="font-semibold">Risk Factors:</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {selectedAlert.riskFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Recommendations:</h3>
                <p className="text-sm text-muted-foreground">{selectedAlert.recommendations}</p>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setSelectedAlert(null)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
};

export default RiskAssessmentPage;

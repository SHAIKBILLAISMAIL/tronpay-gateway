
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  EllipsisVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import React, { useMemo } from 'react';

const statusIcons: { [key: string]: React.ReactNode } = {
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  confirmed: <CheckCircle className="h-4 w-4 text-green-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const statusColors: { [key: string]: string } = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};


const TransactionsPage = () => {
    
  const auth = useAuth();
  const firestore = useFirestore();
  
  const transactionsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return query(
        collection(firestore, 'users', auth.currentUser.uid, 'all_transactions'),
        orderBy('timestamp', 'desc')
    );
  }, [firestore, auth.currentUser]);

  const { data: allTransactions, isLoading } = useCollection(transactionsQuery);


  const renderTransactions = (filterType?: 'p2p_sent' | 'p2p_received' | 'card' | 'ip') => {
    const filteredTransactions = allTransactions
    ? allTransactions.filter((tx: any) => {
        if (!filterType) return true; // 'all' tab
        if (filterType === 'p2p_sent' && tx.type === 'p2p_sent') return true;
        if (filterType === 'p2p_received' && tx.type === 'p2p_received') return true;
        if (filterType === 'card' && tx.type === 'card') return true;
        if (filterType === 'ip' && tx.type === 'ip') return true;
        return false;
      })
    : [];

    if (isLoading) {
        return <p className="p-4 text-center text-muted-foreground">Loading transactions...</p>
    }

    if (!filteredTransactions || filteredTransactions.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No transactions found.</p>
    }

    return (
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">From</TableHead>
                <TableHead className="hidden sm:table-cell">To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx: any) => {
                 const isSent = tx.type === 'p2p_sent' || tx.type === 'card' || tx.type === 'ip';
                 return (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${isSent ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}
                      >
                        {isSent ? (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1.5 ${statusColors[tx.status]}`}
                    >
                      {statusIcons[tx.status]}
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tx.timestamp?.toDate().toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {tx.amount.toLocaleString('en-US', { style: 'currency', currency: tx.currencyType })}{' '}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-xs max-w-[120px] truncate">
                    {tx.senderWalletId}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-xs max-w-[120px] truncate">
                    {tx.receiverWalletId}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                          <span className="sr-only">Transaction actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Repeat Transaction</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="p-0">
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          View and manage all transactions on the TronPay Gateway.
        </CardDescription>
      </CardHeader>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="p2p_sent">Sent</TabsTrigger>
          <TabsTrigger value="p2p_received">Received</TabsTrigger>
          <TabsTrigger value="card">Card</TabsTrigger>
          <TabsTrigger value="ip">IP</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderTransactions()}</TabsContent>
        <TabsContent value="p2p_sent">{renderTransactions('p2p_sent')}</TabsContent>
        <TabsContent value="p2p_received">
          {renderTransactions('p2p_received')}
        </TabsContent>
        <TabsContent value="card">{renderTransactions('card')}</TabsContent>
        <TabsContent value="ip">{renderTransactions('ip')}</TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage;

    
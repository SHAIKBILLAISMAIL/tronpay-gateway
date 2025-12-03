
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const IPTransferPage = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const walletsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
  }, [firestore, auth.currentUser]);

  const { data: wallets, isLoading: isLoadingWallets } = useCollection(walletsQuery);

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to perform a transfer.',
      });
      setIsProcessing(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const sendingServerIp = formData.get('sending-server-ip') as string;
    const recipientWalletId = formData.get('recipient-wallet') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const currencyType = formData.get('currency-type') as string;

    const serverDetails = {
      hostName: formData.get('host-name') as string,
      commonAccount: formData.get('common-account') as string,
      logonServerIp: formData.get('logon-server-ip') as string,
      globalServerIp: formData.get('global-server-ip') as string,
      globalServerId: formData.get('global-server-id') as string,
      receivingServerIp: formData.get('receiving-server-ip') as string,
      receivingServerId: formData.get('receiving-server-id') as string,
      commonServerIp: formData.get('common-server-ip') as string,
    };
    
    if (!sendingServerIp || !recipientWalletId || !amount || !currencyType) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'All required fields must be filled out.',
      });
      setIsProcessing(false);
      return;
    }

    const batch = writeBatch(firestore);

    try {
      const recipientWalletRef = doc(firestore, `users/${userId}/wallets/${recipientWalletId}`);
      const recipientWalletSnap = await getDoc(recipientWalletRef);

      if (!recipientWalletSnap.exists()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Recipient wallet not found.' });
        setIsProcessing(false);
        return;
      }

      const recipientWalletData = recipientWalletSnap.data();

      if (recipientWalletData.currencyType !== currencyType) {
        toast({ variant: 'destructive', title: 'Error', description: `Deposit currency (${currencyType}) does not match wallet currency (${recipientWalletData.currencyType}).` });
        setIsProcessing(false);
        return;
      }

      const newRecipientBalance = recipientWalletData.balance + amount;
      batch.update(recipientWalletRef, { balance: newRecipientBalance });

      const transactionsRef = collection(firestore, `users/${userId}/all_transactions`);
      const newTransactionRef = doc(transactionsRef);
      const transactionData = {
          initiatorUserId: userId,
          senderWalletId: sendingServerIp,
          receiverWalletId: recipientWalletData.walletAddress,
          transactionHash: `mock_ip_tx_${new Date().getTime()}`,
          amount: amount,
          currencyType: currencyType,
          timestamp: serverTimestamp(),
          status: 'completed',
          memo: 'IP to Wallet Deposit',
          fee: 0.05,
          type: 'ip',
          serverDetails: serverDetails,
      };
      batch.set(newTransactionRef, transactionData);
      
      await batch.commit();
      
      toast({
        title: 'Transfer Successful!',
        description: `Successfully deposited ${amount.toLocaleString('en-US', { style: 'currency', currency: currencyType })} to ${recipientWalletData.name}.`,
      });
      (e.target as HTMLFormElement).reset();

    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: `users/${userId}/wallets/${recipientWalletId}`,
        operation: 'write',
        requestResourceData: { amount: amount, serverDetails: serverDetails },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: 'An unexpected error occurred. Check permissions.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="p-0">
        <CardTitle>Advanced IP Transfer</CardTitle>
        <CardDescription>
          Simulate a deposit from an external server to one of your wallets.
        </CardDescription>
      </CardHeader>
      <Card className="mx-auto w-full max-w-2xl">
        <form onSubmit={handleTransfer}>
          <CardHeader>
            <CardTitle>Initiate Deposit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="host-name">Host Name</Label>
                    <Input id="host-name" name="host-name" placeholder="e.g., server.example.com" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="common-account">Common Account</Label>
                    <Input id="common-account" name="common-account" placeholder="e.g., global_pool_01" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="sending-server-ip">Sending Server IP</Label>
                    <Input id="sending-server-ip" name="sending-server-ip" placeholder="e.g., 192.168.1.1" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="logon-server-ip">Logon Server IP</Label>
                    <Input id="logon-server-ip" name="logon-server-ip" placeholder="e.g., 192.168.1.2" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="global-server-ip">Global Server IP</Label>
                    <Input id="global-server-ip" name="global-server-ip" placeholder="e.g., 10.0.0.1" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="global-server-id">Global Server ID</Label>
                    <Input id="global-server-id" name="global-server-id" placeholder="e.g., GBL-SVR-001" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="receiving-server-ip">Receiving Server IP</Label>
                    <Input id="receiving-server-ip" name="receiving-server-ip" placeholder="e.g., 10.0.0.2" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="receiving-server-id">Receiving Server ID</Label>
                    <Input id="receiving-server-id" name="receiving-server-id" placeholder="e.g., RCV-SVR-002" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="common-server-ip">Common Server IP</Label>
                <Input id="common-server-ip" name="common-server-ip" placeholder="e.g., 10.0.0.3" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="recipient-wallet">Recipient Wallet</Label>
                <Select name="recipient-wallet" required>
                    <SelectTrigger id="recipient-wallet" disabled={isLoadingWallets || !wallets}>
                        <SelectValue placeholder={isLoadingWallets ? "Loading wallets..." : "Select a wallet"} />
                    </SelectTrigger>
                    <SelectContent>
                        {wallets?.map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                                <span className="font-medium">{wallet.name}</span>
                                <span className="text-muted-foreground ml-2 truncate">{wallet.walletAddress}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" type="number" placeholder="0.00" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="currency-type">Currency</Label>
                    <Select name="currency-type" defaultValue="USD" required>
                        <SelectTrigger id="currency-type">
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                            <SelectItem value="CHF">CHF (Fr)</SelectItem>
                            <SelectItem value="CNY">CNY (¥)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full group" disabled={isProcessing}>
               {isProcessing ? (
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                ) : (
                    <>
                        Send Transfer
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default IPTransferPage;

    
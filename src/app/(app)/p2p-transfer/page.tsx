
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
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, writeBatch, doc, collectionGroup, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const P2PTransferPage = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const auth = useAuth();
  const searchParams = useSearchParams();
  const fromAddressParam = searchParams.get('from');
  
  const firestore = useFirestore();

  const walletsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
  }, [firestore, auth.currentUser]);

  const { data: wallets, isLoading: isLoadingWallets } = useCollection(walletsQuery);
  
  const [fromAddress, setFromAddress] = useState('');

  useEffect(() => {
    if (fromAddressParam) {
      setFromAddress(fromAddressParam);
    }
  }, [fromAddressParam]);

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
    const fromWalletAddress = formData.get('from-address') as string;
    const recipientWalletAddress = formData.get('recipient-address') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const memo = formData.get('memo') as string;

    if (!fromWalletAddress || !recipientWalletAddress || !amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Missing or invalid required fields.' });
      setIsProcessing(false);
      return;
    }

    if (fromWalletAddress === recipientWalletAddress) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sender and receiver wallets cannot be the same.' });
      setIsProcessing(false);
      return;
    }

    const batch = writeBatch(firestore);

    try {
      const senderWalletsRef = collection(firestore, `users/${userId}/wallets`);
      const senderQuery = query(senderWalletsRef, where('walletAddress', '==', fromWalletAddress));
      const senderSnapshot = await getDocs(senderQuery);

      if (senderSnapshot.empty) {
        toast({ variant: 'destructive', title: 'Error', description: 'Sender wallet not found.' });
        setIsProcessing(false);
        return;
      }
      const senderWalletDoc = senderSnapshot.docs[0];
      const senderWalletData = senderWalletDoc.data();

      if (senderWalletData.balance < amount) {
        toast({ variant: 'destructive', title: 'Error', description: 'Insufficient funds.' });
        setIsProcessing(false);
        return;
      }
      
      const currencyType = senderWalletData.currencyType;

      const allWalletsQuery = query(collectionGroup(firestore, 'wallets'), where('walletAddress', '==', recipientWalletAddress));
      const recipientSnapshot = await getDocs(allWalletsQuery);

      if (recipientSnapshot.empty) {
        toast({ variant: 'destructive', title: 'Error', description: 'Recipient wallet not found.' });
        setIsProcessing(false);
        return;
      }
      const recipientWalletDoc = recipientSnapshot.docs[0];
      const recipientWalletData = recipientWalletDoc.data();
      
      if (recipientWalletData.currencyType !== currencyType) {
        toast({ variant: 'destructive', title: 'Error', description: `Recipient wallet is for ${recipientWalletData.currencyType}, but you are sending ${currencyType}.` });
        setIsProcessing(false);
        return;
      }

      const newSenderBalance = senderWalletData.balance - amount;
      batch.update(senderWalletDoc.ref, { balance: newSenderBalance });

      const newRecipientBalance = recipientWalletData.balance + amount;
      batch.update(recipientWalletDoc.ref, { balance: newRecipientBalance });
      
      const transactionHash = `mock_tx_${new Date().getTime()}`;

      const senderTransactionData = {
          initiatorUserId: userId,
          senderWalletId: fromWalletAddress,
          receiverWalletId: recipientWalletAddress,
          transactionHash: transactionHash,
          amount: amount,
          currencyType: currencyType,
          timestamp: serverTimestamp(),
          status: 'completed',
          memo: memo,
          fee: 0.1,
          type: 'p2p_sent',
      };
      const senderTransactionsRef = collection(firestore, `users/${userId}/all_transactions`);
      batch.set(doc(senderTransactionsRef), senderTransactionData);

      const receiverTransactionData = {
          initiatorUserId: userId,
          senderWalletId: fromWalletAddress,
          receiverWalletId: recipientWalletAddress,
          transactionHash: transactionHash,
          amount: amount,
          currencyType: currencyType,
          timestamp: serverTimestamp(),
          status: 'completed',
          memo: memo,
          fee: 0,
          type: 'p2p_received',
      };
      const receiverTransactionsRef = collection(firestore, `users/${recipientWalletData.userId}/all_transactions`);
      batch.set(doc(receiverTransactionsRef), receiverTransactionData);
      
      await batch.commit();

      toast({
        title: 'Transfer Successful!',
        description: `Successfully transferred ${amount} ${currencyType} to ${recipientWalletAddress}.`,
      });
      (e.target as HTMLFormElement).reset();
      setFromAddress(fromAddressParam || '');

    } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: `users/${userId}/wallets`,
            operation: 'write',
            requestResourceData: { from: fromWalletAddress, to: recipientWalletAddress, amount: amount }
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
        <CardTitle>Address-to-Address Transfer</CardTitle>
        <CardDescription>
          Send tokens directly from any wallet address to another.
        </CardDescription>
      </CardHeader>
      <Card className="mx-auto w-full max-w-lg">
        <form onSubmit={handleTransfer}>
          <CardHeader>
            <CardTitle>Initiate Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from-address">From Wallet</Label>
               <Select name="from-address" required value={fromAddress} onValueChange={setFromAddress}>
                    <SelectTrigger id="from-address" disabled={isLoadingWallets || !wallets}>
                        <SelectValue placeholder={isLoadingWallets ? "Loading wallets..." : "Select a wallet"} />
                    </SelectTrigger>
                    <SelectContent>
                        {wallets?.map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.walletAddress}>
                                <span className="font-medium">{wallet.name}</span>
                                <span className="text-muted-foreground ml-2">({wallet.balance.toLocaleString('en-US', { style: 'currency', currency: wallet.currencyType })})</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient-address">Recipient Address</Label>
              <Input
                id="recipient-address"
                name="recipient-address"
                placeholder="Enter recipient's wallet address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memo">Memo (Optional)</Label>
              <Textarea id="memo" name="memo" placeholder="Enter a short message" />
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

export default P2PTransferPage;

    
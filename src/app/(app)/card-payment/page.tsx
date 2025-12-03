
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
import { CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const CardPaymentPage = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);

    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to process a payment.',
      });
      setIsProcessing(false);
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const recipientAddress = formData.get('recipient-address') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const currencyType = formData.get('currency-type') as string;
    const cardHolder = formData.get('card-holder');

    if (!recipientAddress || !amount || !cardHolder || !currencyType) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'All required fields must be filled out.',
        });
      setIsProcessing(false);
      return;
    }

    const transactionsRef = collection(firestore, 'users', userId, 'all_transactions');
    const transactionData = {
        initiatorUserId: userId,
        senderWalletId: 'Credit/Debit Card',
        receiverWalletId: recipientAddress,
        transactionHash: `mock_card_tx_${new Date().getTime()}`,
        amount: amount,
        currencyType: currencyType,
        timestamp: serverTimestamp(),
        status: 'completed', // 2D gateways often appear as 'completed' immediately
        fee: amount * 0.02, // Simulate a 2% fee
        type: 'card',
    };
    
    addDoc(transactionsRef, transactionData)
        .then(() => {
            setIsSuccess(true);
            toast({
                title: 'Payment Successful!',
                description: 'Your transaction has been processed successfully.',
            });
        })
        .catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: transactionsRef.path,
                operation: 'create',
                requestResourceData: transactionData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Payment Failed',
                description: 'An unexpected error occurred. Check permissions.',
            });
        })
        .finally(() => {
            setIsProcessing(false);
        });
  };

  const handleNewPayment = () => {
    setIsSuccess(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="p-0">
        <CardTitle>Send Payment via Card</CardTitle>
        <CardDescription>
          Use a credit or debit card to send funds to any wallet address.
        </CardDescription>
      </CardHeader>
      <Card className="mx-auto w-full max-w-lg">
        {isSuccess ? (
             <CardContent className="flex flex-col items-center justify-center p-10 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                <CardDescription>Your transaction has been processed successfully.</CardDescription>
                <Button onClick={handleNewPayment}>Make Another Payment</Button>
            </CardContent>
        ) : (
        <form onSubmit={handlePayment}>
          <CardHeader>
            <CardTitle>Enter Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="recipient-address">Recipient Address</Label>
                <Input id="recipient-address" name="recipient-address" placeholder="Enter wallet address or account details" required />
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
            <div className="space-y-2">
              <Label htmlFor="card-holder">Cardholder Name</Label>
              <Input id="card-holder" name="card-holder" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <div className="relative">
                <Input
                  id="card-number"
                  name="card-number"
                  placeholder="**** **** **** ****"
                  required
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input id="expiry-date" name="expiry-date" placeholder="MM/YY" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" name="cvc" placeholder="123" required />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full group" disabled={isProcessing}>
                {isProcessing ? (
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                ) : (
                    <>
                        <Lock className="mr-2 h-4 w-4" />
                        Send Payment
                    </>
                )}
            </Button>
          </CardFooter>
        </form>
        )}
      </Card>
    </div>
  );
};

export default CardPaymentPage;

    
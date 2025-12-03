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
import { ArrowDownToLine, Wallet, Landmark } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const WithdrawToBankPage = () => {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<any>(null);
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const auth = useAuth();
    const firestore = useFirestore();

    const walletsQuery = useMemoFirebase(() => {
        if (!auth.currentUser) return null;
        return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
    }, [firestore, auth.currentUser]);

    const bankAccountsQuery = useMemoFirebase(() => {
        if (!auth.currentUser) return null;
        return collection(firestore, 'users', auth.currentUser.uid, 'bankAccounts');
    }, [firestore, auth.currentUser]);

    const { data: wallets, isLoading: isLoadingWallets } = useCollection(walletsQuery);
    const { data: bankAccounts, isLoading: isLoadingBanks } = useCollection(bankAccountsQuery);

    const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsProcessing(true);

        const userId = auth.currentUser?.uid;
        if (!userId) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'You must be logged in to withdraw.',
            });
            setIsProcessing(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const walletId = formData.get('wallet') as string;
        const bankAccountId = formData.get('bank-account') as string;
        const amount = parseFloat(formData.get('amount') as string);

        if (!walletId || !bankAccountId || !amount || amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: 'Please fill all fields with valid values.',
            });
            setIsProcessing(false);
            return;
        }

        const batch = writeBatch(firestore);

        try {
            // Get wallet data
            const walletRef = doc(firestore, `users/${userId}/wallets/${walletId}`);
            const walletSnap = await getDoc(walletRef);

            if (!walletSnap.exists()) {
                toast({ variant: 'destructive', title: 'Error', description: 'Wallet not found.' });
                setIsProcessing(false);
                return;
            }

            const walletData = walletSnap.data();

            // Check sufficient balance
            if (walletData.balance < amount) {
                toast({
                    variant: 'destructive',
                    title: 'Insufficient Funds',
                    description: `Wallet only has ${walletData.balance.toLocaleString('en-US', {
                        style: 'currency',
                        currency: walletData.currencyType || 'USD',
                    })}`,
                });
                setIsProcessing(false);
                return;
            }

            // Get bank account data
            const bankRef = doc(firestore, `users/${userId}/bankAccounts/${bankAccountId}`);
            const bankSnap = await getDoc(bankRef);

            if (!bankSnap.exists()) {
                toast({ variant: 'destructive', title: 'Error', description: 'Bank account not found.' });
                setIsProcessing(false);
                return;
            }

            const bankData = bankSnap.data();

            // Update wallet balance (deduct)
            const newWalletBalance = walletData.balance - amount;
            batch.update(walletRef, { balance: newWalletBalance });

            // Update bank account balance (credit)
            const newBankBalance = (bankData.balance || 0) + amount;
            batch.update(bankRef, { balance: newBankBalance });

            // Record transaction
            const transactionsRef = collection(firestore, `users/${userId}/all_transactions`);
            const newTransactionRef = doc(transactionsRef);
            const transactionData = {
                initiatorUserId: userId,
                senderWalletId: walletData.walletAddress,
                receiverWalletId: bankData.accountNumber,
                transactionHash: `settlement_${new Date().getTime()}`,
                amount: amount,
                currencyType: walletData.currencyType || 'USD',
                timestamp: serverTimestamp(),
                status: 'completed',
                memo: `Withdrawal to ${bankData.bankName}`,
                fee: 0,
                type: 'withdrawal',
                bankDetails: {
                    bankName: bankData.bankName,
                    accountNumber: bankData.accountNumber,
                    beneficiaryName: bankData.beneficiaryName,
                },
            };
            batch.set(newTransactionRef, transactionData);

            await batch.commit();

            toast({
                title: 'Withdrawal Successful!',
                description: `${amount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: walletData.currencyType || 'USD',
                })} transferred to ${bankData.bankName}`,
            });

            (e.target as HTMLFormElement).reset();
            setSelectedWallet(null);
            setSelectedBank(null);
        } catch (error: any) {
            console.error('Withdrawal error:', error);
            toast({
                variant: 'destructive',
                title: 'Withdrawal Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Withdraw to Bank</h1>
                <p className="text-muted-foreground">
                    Transfer funds from your wallet to your linked bank accounts.
                </p>
            </div>

            <Card className="mx-auto w-full max-w-2xl">
                <form onSubmit={handleWithdraw}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowDownToLine className="h-5 w-5" />
                            Initiate Withdrawal
                        </CardTitle>
                        <CardDescription>
                            Select source wallet and destination bank account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="wallet" className="flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Source Wallet
                            </Label>
                            <Select
                                name="wallet"
                                required
                                onValueChange={(value) => {
                                    const wallet = wallets?.find((w) => w.id === value);
                                    setSelectedWallet(wallet);
                                }}
                            >
                                <SelectTrigger id="wallet" disabled={isLoadingWallets || !wallets}>
                                    <SelectValue
                                        placeholder={isLoadingWallets ? 'Loading wallets...' : 'Select wallet'}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets?.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id}>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-medium">{wallet.name}</span>
                                                <span className="text-muted-foreground ml-4">
                                                    {wallet.balance?.toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: wallet.currencyType || 'USD',
                                                    })}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedWallet && (
                                <p className="text-sm text-muted-foreground">
                                    Available: {selectedWallet.balance?.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: selectedWallet.currencyType || 'USD',
                                    })}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank-account" className="flex items-center gap-2">
                                <Landmark className="h-4 w-4" />
                                Destination Bank Account
                            </Label>
                            <Select
                                name="bank-account"
                                required
                                onValueChange={(value) => {
                                    const bank = bankAccounts?.find((b) => b.id === value);
                                    setSelectedBank(bank);
                                }}
                            >
                                <SelectTrigger id="bank-account" disabled={isLoadingBanks || !bankAccounts}>
                                    <SelectValue
                                        placeholder={isLoadingBanks ? 'Loading accounts...' : 'Select bank account'}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts?.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{account.bankName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {account.accountNumber} • {account.beneficiaryName}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedBank && (
                                <p className="text-sm text-muted-foreground">
                                    Current Balance: {(selectedBank.balance || 0).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: selectedBank.currency || 'USD',
                                    })}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isProcessing}>
                            {isProcessing ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                            ) : (
                                <>
                                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                                    Withdraw to Bank
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default WithdrawToBankPage;


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
import { Landmark, PlusCircle, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const BankAccountsPage = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const auth = useAuth();
  const firestore = useFirestore();

  const bankAccountsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return collection(firestore, 'users', auth.currentUser.uid, 'bankAccounts');
  }, [firestore, auth.currentUser]);

  const { data: bankAccounts, isLoading } = useCollection(bankAccountsQuery);


  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a bank account.',
      });
      setIsProcessing(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const bankName = formData.get('bank-name') as string;
    const bankAddress = formData.get('bank-address') as string;
    const routingNumber = formData.get('routing-number') as string;
    const swiftCode = formData.get('swift-code') as string;
    const accountNumber = formData.get('account-number') as string;
    const confirmAccountNumber = formData.get('confirm-account-number') as string;
    const currency = formData.get('currency') as string;
    const accountType = formData.get('account-type') as string;
    const beneficiaryName = formData.get('beneficiary-name') as string;
    const userId = auth.currentUser.uid;

    if (
      !bankName ||
      !bankAddress ||
      !routingNumber ||
      !swiftCode ||
      !accountNumber ||
      !confirmAccountNumber ||
      !currency ||
      !accountType ||
      !beneficiaryName
    ) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'All fields are required.',
      });
      setIsProcessing(false);
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      toast({
        variant: 'destructive',
        title: 'Mismatch Error',
        description: 'Account numbers do not match.',
      });
      setIsProcessing(false);
      return;
    }
    const bankAccountsRef = collection(
      firestore,
      'users',
      userId,
      'bankAccounts'
    );

    const maskedAccountNumber = `**** **** **** ${accountNumber.slice(-4)}`;
    const accountData = {
      userId: userId,
      bankName,
      bankAddress,
      routingNumber,
      swiftCode,
      accountNumber: maskedAccountNumber,
      fullAccountNumberEncrypted: accountNumber,
      accountType,
      beneficiaryName,
      currency,
    };

    try {
      if (editingAccount) {
        const accountRef = doc(firestore, 'users', userId, 'bankAccounts', editingAccount.id);
        await updateDoc(accountRef, {
          ...accountData,
          updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Account Updated!',
          description: 'Bank account details updated successfully.',
        });
      } else {
        await addDoc(bankAccountsRef, {
          ...accountData,
          balance: 0,
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'Account Linked!',
          description: `The account with ${bankName} has been successfully linked.`,
        });
      }
      setIsDialogOpen(false);
      setEditingAccount(null);
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error.message || 'Could not save bank account.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = (account: any) => {
    setEditingAccount(account);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage your linked bank accounts for transfers.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingAccount(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAccount(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddAccount}>
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</DialogTitle>
                <DialogDescription>
                  {editingAccount ? 'Update account details.' : 'Link a new bank account to your TronPay gateway.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bank-name" className="text-right">
                    Bank Name
                  </Label>
                  <Input
                    id="bank-name"
                    name="bank-name"
                    className="col-span-3"
                    defaultValue={editingAccount?.bankName}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bank-address" className="text-right">
                    Bank Address
                  </Label>
                  <Input
                    id="bank-address"
                    name="bank-address"
                    className="col-span-3"
                    defaultValue={editingAccount?.bankAddress}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="routing-number" className="text-right">
                    Routing Number
                  </Label>
                  <Input
                    id="routing-number"
                    name="routing-number"
                    className="col-span-3"
                    defaultValue={editingAccount?.routingNumber}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="swift-code" className="text-right">
                    SWIFT Code
                  </Label>
                  <Input
                    id="swift-code"
                    name="swift-code"
                    className="col-span-3"
                    defaultValue={editingAccount?.swiftCode}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="account-number" className="text-right">
                    Account Number
                  </Label>
                  <Input
                    id="account-number"
                    name="account-number"
                    type="text"
                    className="col-span-3"
                    defaultValue={editingAccount?.fullAccountNumberEncrypted}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirm-account-number" className="text-right">
                    Confirm Account
                  </Label>
                  <Input
                    id="confirm-account-number"
                    name="confirm-account-number"
                    type="text"
                    className="col-span-3"
                    defaultValue={editingAccount?.fullAccountNumberEncrypted}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    Currency
                  </Label>
                  <Select name="currency" defaultValue={editingAccount?.currency || 'USD'} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                      <SelectItem value="CHF">CHF - Swiss Franc (Fr)</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan (¥)</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                      <SelectItem value="MXN">MXN - Mexican Peso ($)</SelectItem>
                      <SelectItem value="BRL">BRL - Brazilian Real (R$)</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand (R)</SelectItem>
                      <SelectItem value="SGD">SGD - Singapore Dollar (S$)</SelectItem>
                      <SelectItem value="HKD">HKD - Hong Kong Dollar (HK$)</SelectItem>
                      <SelectItem value="NZD">NZD - New Zealand Dollar (NZ$)</SelectItem>
                      <SelectItem value="SEK">SEK - Swedish Krona (kr)</SelectItem>
                      <SelectItem value="NOK">NOK - Norwegian Krone (kr)</SelectItem>
                      <SelectItem value="DKK">DKK - Danish Krone (kr)</SelectItem>
                      <SelectItem value="PLN">PLN - Polish Zloty (zł)</SelectItem>
                      <SelectItem value="THB">THB - Thai Baht (฿)</SelectItem>
                      <SelectItem value="MYR">MYR - Malaysian Ringgit (RM)</SelectItem>
                      <SelectItem value="IDR">IDR - Indonesian Rupiah (Rp)</SelectItem>
                      <SelectItem value="PHP">PHP - Philippine Peso (₱)</SelectItem>
                      <SelectItem value="KRW">KRW - South Korean Won (₩)</SelectItem>
                      <SelectItem value="TRY">TRY - Turkish Lira (₺)</SelectItem>
                      <SelectItem value="RUB">RUB - Russian Ruble (₽)</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham (د.إ)</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal (﷼)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="account-type" className="text-right">
                    Account Type
                  </Label>
                  <Select name="account-type" defaultValue={editingAccount?.accountType} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Checking">Checking</SelectItem>
                      <SelectItem value="Savings">Savings</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="beneficiary-name" className="text-right">
                    Beneficiary Name
                  </Label>
                  <Input
                    id="beneficiary-name"
                    name="beneficiary-name"
                    className="col-span-3"
                    defaultValue={editingAccount?.beneficiaryName}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  ) : (
                    editingAccount ? 'Update Account' : 'Link Account'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading && <p>Loading accounts...</p>}
      <div className="grid gap-6 md:grid-cols-2">
        {bankAccounts?.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{account.bankName}</CardTitle>
                <CardDescription>{account.beneficiaryName} - {account.accountType}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Account Number</div>
                  <div className="font-mono font-semibold text-sm truncate" title={account.accountNumber}>
                    {account.accountNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Routing / Sort</div>
                  <div className="font-mono font-semibold text-sm truncate" title={account.routingNumber}>
                    {account.routingNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">SWIFT / BIC</div>
                  <div className="font-mono font-semibold text-sm truncate" title={account.swiftCode}>
                    {account.swiftCode}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Currency</div>
                  <div className="font-mono font-semibold text-sm">
                    {account.currency || 'USD'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Bank Address</div>
                <div className="text-sm text-muted-foreground line-clamp-2" title={account.bankAddress}>
                  {account.bankAddress}
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Balance</div>
                <div className="text-2xl font-bold">
                  {(account.balance || 0).toLocaleString('en-US', {
                    style: 'currency',
                    currency: account.currency || 'USD',
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline" size="icon" onClick={() => handleEditClick(account)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove Account</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BankAccountsPage;


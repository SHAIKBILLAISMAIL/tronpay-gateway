
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
import { ArrowUpRight, PlusCircle, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReceiveFundsDialog } from '@/components/receive-funds-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { TronWalletService } from '@/lib/tron-wallet-service';

const WalletsPage = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const walletsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
  }, [firestore, auth.currentUser]);

  const { data: wallets, isLoading } = useCollection(walletsQuery);

  const handleCreateWallet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a wallet.',
      });
      return;
    }
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const walletName = formData.get('wallet-name') as string;
    const currencyType = formData.get('currency-type') as string;

    try {
      // Generate REAL TRON wallet
      const newWallet = await TronWalletService.generateWallet();

      const walletData = {
        userId: auth.currentUser.uid,
        name: walletName,
        walletAddress: newWallet.address, // Real address!
        privateKeyEncrypted: newWallet.privateKey, // TODO: Encrypt this in production!
        publicKey: newWallet.publicKey,
        currencyType: currencyType,
        balance: 0,
        createdAt: serverTimestamp(),
      };

      const walletsRef = collection(firestore, 'users', auth.currentUser.uid, 'wallets');
      await addDoc(walletsRef, walletData);

      toast({
        title: 'Wallet Created!',
        description: `New ${currencyType} wallet created: ${newWallet.address}`,
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Wallet creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error.message || 'Could not create a new wallet.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWallet = async () => {
    if (!walletToDelete || !auth.currentUser) return;

    const walletRef = doc(firestore, 'users', auth.currentUser.uid, 'wallets', walletToDelete);
    deleteDoc(walletRef)
      .then(() => {
        toast({
          title: 'Wallet Deleted',
          description: 'The wallet has been successfully deleted.',
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: walletRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: 'Could not delete the wallet. Check permissions.',
        });
      })
      .finally(() => {
        setWalletToDelete(null);
      });
  };

  const handleCopy = async (address: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(address);
        toast({
          title: 'Copied!',
          description: 'Wallet address copied to clipboard.',
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: 'Copied!',
            description: 'Wallet address copied to clipboard.',
          });
        } catch (err) {
          toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Please copy manually: ' + address,
          });
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Please copy manually: ' + address,
      });
    }
  };

  const handleSend = (fromAddress: string) => {
    router.push(`/p2p-transfer?from=${encodeURIComponent(fromAddress)}`);
  };

  return (
    <AlertDialog open={!!walletToDelete} onOpenChange={(open) => !open && setWalletToDelete(null)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wallets</h1>
            <p className="text-muted-foreground">
              Manage your token wallets.
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateWallet}>
                <DialogHeader>
                  <DialogTitle>Create New Wallet</DialogTitle>
                  <DialogDescription>
                    Create a new wallet for your tokens.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wallet-name" className="text-right">
                      Wallet Name
                    </Label>
                    <Input
                      id="wallet-name"
                      name="wallet-name"
                      defaultValue="My New Wallet"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency-type" className="text-right">
                      Currency
                    </Label>
                    <Select name="currency-type" defaultValue="USD" required>
                      <SelectTrigger className="col-span-3">
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
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Wallet'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading && <p>Loading wallets...</p>}
        {!isLoading && wallets && wallets.length === 0 && (
          <Card className="flex flex-col items-center justify-center p-10 text-center">
            <CardHeader>
              <CardTitle>No Wallets Found</CardTitle>
              <CardDescription>
                Get started by creating your first wallet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleCreateWallet}>
                    <DialogHeader>
                      <DialogTitle>Create New Wallet</DialogTitle>
                      <DialogDescription>
                        Create a new wallet for your tokens.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="wallet-name" className="text-right">
                          Wallet Name
                        </Label>
                        <Input
                          id="wallet-name"
                          name="wallet-name"
                          defaultValue="My New Wallet"
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currency-type" className="text-right">
                          Currency
                        </Label>
                        <Select name="currency-type" defaultValue="USD" required>
                          <SelectTrigger className="col-span-3">
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
                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create Wallet'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wallets?.map((wallet) => (
            <Card key={wallet.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{wallet.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 font-mono text-xs">
                  <span className="truncate">{wallet.walletAddress}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleCopy(wallet.walletAddress)}
                  >
                    <Copy className="h-3 w-3" />
                    <span className="sr-only">Copy address</span>
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{wallet.currencyType} Balance</p>
                  <p className="text-2xl font-semibold">
                    {(wallet.balance ?? 0).toLocaleString('en-US', {
                      style: 'currency',
                      currency: wallet.currencyType,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleSend(wallet.walletAddress)}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <ReceiveFundsDialog walletAddress={wallet.walletAddress} />
              </CardFooter>
              <CardFooter>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" onClick={() => setWalletToDelete(wallet.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            wallet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setWalletToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteWallet}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WalletsPage;


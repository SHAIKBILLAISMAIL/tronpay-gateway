
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Wifi } from 'lucide-react';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ReceiveInfoPage = () => {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [userIp, setUserIp] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(true);

  const walletsQuery = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return collection(firestore, 'users', auth.currentUser.uid, 'wallets');
  }, [firestore, auth.currentUser]);

  const { data: wallets, isLoading: isLoadingWallets } = useCollection(walletsQuery);

  useEffect(() => {
    const fetchIp = async () => {
      setIsLoadingIp(true);
      try {
        const response = await fetch('/api/ip');
        const data = await response.json();
        setUserIp(data.ip);
      } catch (error) {
        console.error('Failed to fetch IP address:', error);
        setUserIp('Unavailable');
      } finally {
        setIsLoadingIp(false);
      }
    };

    fetchIp();
  }, []);

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast({
          title: `${label} Copied!`,
          description: 'The information has been copied to your clipboard.',
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: `${label} Copied!`,
            description: 'The information has been copied to your clipboard.',
          });
        } catch (err) {
          toast({
            variant: 'destructive',
            title: 'Copy Failed',
            description: 'Please copy manually.',
          });
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Please copy manually.',
      });
    }
  };

  const ipTransferDetails = [
    { label: 'HOST NAME', value: 'tronpay.gateway.net' },
    { label: 'COMMON ACCOUNT', value: 'global_asset_pool_01' },
    { label: 'LOGON SERVER IP', value: userIp || 'Loading...', dynamic: true },
    { label: 'GLOBAL SERVER IP', value: userIp || 'Loading...', dynamic: true },
    { label: 'GLOBAL SERVER ID', value: 'GBL-SVR-TRN-01' },
    { label: 'RECEIVING SERVER IP', value: userIp || 'Loading...', dynamic: true },
    { label: 'RECEIVING SERVER ID', value: 'RCV-SVR-TRN-04' },
    { label: 'COMMON SERVER IP', value: '203.0.113.11' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="p-0">
        <CardTitle>My Receiving Information</CardTitle>
        <CardDescription>
          Share these details with the sender to receive funds.
        </CardDescription>
      </CardHeader>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Wallets</CardTitle>
            <CardDescription>
              Provide one of these wallet addresses to the sender.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingWallets && <p>Loading your wallets...</p>}
            {wallets?.map((wallet) => (
              <div key={wallet.id}>
                <Label
                  htmlFor={`wallet-address-${wallet.id}`}
                  className="mb-2 block text-sm font-medium"
                >
                  {wallet.name} ({wallet.currencyType})
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id={`wallet-address-${wallet.id}`}
                    value={wallet.walletAddress}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleCopy(wallet.walletAddress, 'Wallet Address')
                    }
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy Wallet Address</span>
                  </Button>
                </div>
              </div>
            ))}
            {!isLoadingWallets && wallets?.length === 0 && (
              <p className="text-muted-foreground">You have no wallets yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Advanced IP Transfer Details</CardTitle>
            <CardDescription>
              For simulated server transfers, the sender will also need these
              details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ipTransferDetails.map((detail) => (
              <div key={detail.label}>
                <Label
                  htmlFor={detail.label}
                  className="mb-2 block text-xs font-semibold uppercase text-muted-foreground"
                >
                  {detail.label}
                </Label>
                <div className="flex items-center space-x-2">
                  {isLoadingIp && detail.dynamic ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id={detail.label}
                      value={detail.value}
                      readOnly
                      className="font-mono text-sm"
                    />
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(detail.value, detail.label)}
                    disabled={isLoadingIp && detail.dynamic}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy {detail.label}</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceiveInfoPage;

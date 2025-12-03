
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

interface ReceiveFundsDialogProps {
  walletAddress: string;
}

export function ReceiveFundsDialog({ walletAddress }: ReceiveFundsDialogProps) {
  const { toast } = useToast();
  const [userIp, setUserIp] = useState<string | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(true);

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


  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast({
          title: 'Copied!',
          description: 'Information copied to clipboard.',
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
            title: 'Copied!',
            description: 'Information copied to clipboard.',
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
    { label: 'Your Wallet Address', value: walletAddress },
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
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <ArrowDownLeft className="mr-2 h-4 w-4" />
          Receive
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Funds</DialogTitle>
          <DialogDescription>
            Share these details to receive funds to your wallet.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="address">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address">Wallet Address</TabsTrigger>
            <TabsTrigger value="ip_transfer">Advanced IP Transfer</TabsTrigger>
          </TabsList>
          <TabsContent value="address" className="mt-4">
            <p className="text-sm text-muted-foreground">
              For P2P transfers, share your unique wallet address.
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="wallet-address"
                defaultValue={walletAddress}
                readOnly
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(walletAddress)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="ip_transfer" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              For simulated IP transfers, provide the sender with the following details.
            </p>
            <div className="space-y-3">
              {ipTransferDetails.map(detail => (
                <div key={detail.label} className="grid grid-cols-3 items-center gap-2">
                  <Label htmlFor={detail.label} className="text-xs text-muted-foreground col-span-1">{detail.label}</Label>
                  {isLoadingIp && detail.dynamic ? (
                    <Skeleton className="h-8 col-span-2" />
                  ) : (
                    <Input id={detail.label} defaultValue={detail.value} readOnly className="col-span-2 h-8 text-xs" />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

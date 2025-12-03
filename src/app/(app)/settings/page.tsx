
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateEmail, updateProfile } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const SettingsPage = () => {
  const { toast } = useToast();
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!auth.currentUser) return null;
    return doc(firestore, 'users', auth.currentUser.uid);
  }, [firestore, auth.currentUser]);

  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [publicKey, setPublicKey] = useState('pk_live_************************');
  const [secretKey, setSecretKey] = useState('sk_live_************************');

  useEffect(() => {
      if(userData) {
          setName(userData.username);
          setEmail(userData.email);
      }
  }, [userData]);


  const handleAccountSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !userDocRef) return;
    setIsSavingAccount(true);

    const formData = new FormData(e.currentTarget);
    const newName = formData.get('name') as string;
    const newEmail = formData.get('email') as string;

    if (!newName || !newEmail) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Name and email are required.',
        });
        setIsSavingAccount(false);
        return;
    }
    
    const updatePromises = [];

    // Update Firestore
    const firestoreUpdate = updateDoc(userDocRef, {
      username: newName,
      email: newEmail,
    });
    updatePromises.push(firestoreUpdate);

    // Update Auth profile display name
    if(user.displayName !== newName) {
        const authProfileUpdate = updateProfile(user, { displayName: newName });
        updatePromises.push(authProfileUpdate);
    }
    
    // Update Auth email
    if(user.email !== newEmail) {
        const authEmailUpdate = updateEmail(user, newEmail);
        updatePromises.push(authEmailUpdate);
    }

    try {
        await Promise.all(updatePromises);
        toast({
            title: 'Success!',
            description: 'Your account information has been updated.',
        });
    } catch(error: any) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: { username: newName, email: newEmail },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          title: 'Error',
          description: 'Failed to update account information. Check permissions.',
          variant: 'destructive',
        });
    } finally {
        setIsSavingAccount(false);
    }
  };

  const handleSecurityChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser || !userDocRef) return;
    setIsSavingSecurity(true);

    const formData = new FormData(e.currentTarget);
    const highRiskAlerts = formData.get('high-risk-alerts') === 'on';
    const largeTransferApprovals = formData.get('large-transfer-approvals') === 'on';

    const settingsData = {
        'securitySettings.highRiskAlerts': highRiskAlerts,
        'securitySettings.largeTransferApprovals': largeTransferApprovals,
    };

    updateDoc(userDocRef, settingsData)
        .then(() => {
            toast({
                title: 'Settings Updated',
                description: 'Security settings have been saved.',
            });
        })
        .catch((error: any) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: settingsData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: 'Error',
                description: 'Failed to save security settings. Check permissions.',
                variant: 'destructive',
            });
        })
        .finally(() => {
            setIsSavingSecurity(false);
        });
  };

  const generateRandomKey = (prefix: string, length = 24) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${prefix}_${result}`;
  };

  const handleRegenerateKeys = () => {
    setPublicKey(generateRandomKey('pk_live'));
    setSecretKey('sk_live_************************'); // Keep secret key masked
    toast({
        title: 'API Keys Regenerated',
        description: 'A new public key has been generated.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and gateway settings.
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold">General</h2>
          <p className="text-sm text-muted-foreground">
            Update your basic account information.
          </p>
        </div>
        <div className="lg:col-span-2">
          <form onSubmit={handleAccountSave}>
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isUserLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isUserLoading} />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSavingAccount || isUserLoading}>
                  {isSavingAccount ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold">API Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your API keys and webhook configurations.
          </p>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Your secret keys are not displayed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-public">Public Key</Label>
                <Input
                  id="api-public"
                  readOnly
                  value={publicKey}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-secret">Secret Key</Label>
                <Input
                  id="api-secret"
                  readOnly
                  value={secretKey}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={handleRegenerateKeys}>Regenerate Keys</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="text-sm text-muted-foreground">
            Adjust your security preferences.
          </p>
        </div>
        <div className="lg:col-span-2">
          <form onSubmit={handleSecurityChange}>
            <Card>
              <CardHeader>
                <CardTitle>Notifications & Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">
                      High-Risk Transaction Alerts
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Receive an email when a transaction is flagged by the AI.
                    </p>
                  </div>
                  <Switch name="high-risk-alerts" defaultChecked={userData?.securitySettings?.highRiskAlerts ?? true} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">Large Transfer Approvals</h3>
                    <p className="text-sm text-muted-foreground">
                      Require manual approval for transfers over $10,000.
                    </p>
                  </div>
                  <Switch name="large-transfer-approvals" defaultChecked={userData?.securitySettings?.largeTransferApprovals ?? false} />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSavingSecurity || isUserLoading}>
                  {isSavingSecurity
                    ? 'Saving...'
                    : 'Save Security Settings'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

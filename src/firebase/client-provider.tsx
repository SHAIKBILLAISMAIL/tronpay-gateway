
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []);

  if (!firebaseServices.firebaseApp) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center">
        <div className="max-w-md rounded-lg border-2 border-dashed border-destructive p-8">
          <h1 className="text-2xl font-bold text-destructive">Firebase Not Configured</h1>
          <p className="mt-2 text-muted-foreground">
            There seems to be an issue with the Firebase configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp!}
      auth={firebaseServices.auth!}
      firestore={firebaseServices.firestore!}
    >
      {children}
    </FirebaseProvider>
  );
}

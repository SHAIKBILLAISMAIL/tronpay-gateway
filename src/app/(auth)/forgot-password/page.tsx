
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
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Request Failed',
        description: error.message || 'Could not send password reset email. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <Card className="w-full max-w-md shadow-2xl">
        {isSubmitted ? (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-3xl">Check Your Email</CardTitle>
              <CardDescription>
                We have sent a password reset link to the email address you provided.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-4">
              <Link href="/" className="w-full">
                <Button className="w-full">Back to Sign In</Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          <form onSubmit={handleResetPassword}>
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                    <Mail className="h-8 w-8 text-primary-foreground" />
                </div>
              <CardTitle className="text-3xl">Forgot Password?</CardTitle>
              <CardDescription>
                No worries, we'll send you reset instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@tronpay.com"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <div className="text-sm text-muted-foreground">
                <Link href="/" className="font-semibold text-primary hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}


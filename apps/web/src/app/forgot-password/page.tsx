'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useErrorState } from '@/hooks/useErrorsState';
import { authErrorHandler } from '@/lib/errors/handlers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { toNamespacedPath } from 'path';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
  });

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [emailSent, setEmailSent] = useState(false);
    const { isLoading, error, executeAction } = useErrorState();
  
    const form = useForm<ForgotPasswordFormData>({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: {
        email: '',
      },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        const result = await executeAction(
            async () => {
                const response = await authClient.forgetPassword({
                    email: data.email,
                    redirectTo: '/reset-password',
                });

                if ('error' in response && response.error) {
                    throw response.error;
                }

                return response;
            },
            authErrorHandler
        );

        if (result) {
            setEmailSent(true);
            // toast({
            //     title: "Reset email sent",
            //     description: "Please check your email for password reset instructions.",
            // });
        }
    };

    if (emailSent) {
        return (
            <div className="container mx-auto py-8 max-w-md">
              <Card>
                <CardHeader className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <CardTitle>Check Your Email</CardTitle>
                  <CardDescription>
                    We've sent password reset instructions to your email address.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setEmailSent(false)}
                    >
                      Try Again
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sign In
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
    }

    return (
        <div className="container mx-auto py-8 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}
    
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...form.register('email')}
                    aria-invalid={!!form.formState.errors.email}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
    
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Email...
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>
    
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      );
}

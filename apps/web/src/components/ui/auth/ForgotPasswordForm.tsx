'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { getAppUrl  } from '@/lib/config';
import { useErrorState } from '@/hooks/useErrorsState';
import { authErrorHandler } from '@/lib/errors/handlers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
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
                    redirectTo: `${getAppUrl()}/reset-password`,
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
        }
    };

    if (emailSent) {
        return (
            <Card className="w-full max-w-md">
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
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setEmailSent(false)}
                        className="flex-1"
                      >
                        Try Again
                      </Button>
                      <Link href="/login" className="flex-1">
                        <Button className="w-full">
                          Back to Login
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...form.register('email')}
                  aria-invalid={!!form.formState.errors.email}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
  
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
  
            <div className="mt-4 text-center">
              <Link 
                href="/login" 
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
    );
}
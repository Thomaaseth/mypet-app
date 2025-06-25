'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useErrorState } from '@/hooks/useErrorsState';
import { authErrorHandler } from '@/lib/errors/handlers';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

const resetPasswordSchema = z.object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
      .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
      .regex(/(?=.*\d)/, 'Password must contain at least one number')
      .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
  
  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
  
  export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { isLoading, error, executeAction } = useErrorState();
  
    const form = useForm<ResetPasswordFormData>({
      resolver: zodResolver(resetPasswordSchema),
      defaultValues: {
        newPassword: '',
        confirmPassword: '',
      },
    });
  
    useEffect(() => {
      const tokenFromUrl = searchParams.get('token');
      if (!tokenFromUrl) {
        console.log("Invalid reset link")
        // toast({
        //   title: "Invalid reset link",
        //   description: "This reset link is invalid or has expired.",
        //   variant: "destructive",
        // });
        router.push('/forgot-password');
        return;
      }
      setToken(tokenFromUrl);
    }, [searchParams, router]);
  
    const onSubmit = async (data: ResetPasswordFormData) => {
      if (!token) return;
  
      const result = await executeAction(
        async () => {
          const response = await authClient.resetPassword({
            newPassword: data.newPassword,
            token: token,
          });
  
          if ('error' in response && response.error) {
            throw response.error;
          }
  
          return response;
        },
        authErrorHandler
      );
  
      if (result) {
        // toast({
        //   title: "Password reset successful",
        //   description: "Your password has been reset. You can now sign in with your new password.",
        // });
        router.push('/login');
      }
    };
  
    if (!token) {
      return (
        <div className="container mx-auto py-8 max-w-md">
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating reset link...
          </div>
        </div>
      );
    }
  
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below.
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
  
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    {...form.register('newPassword')}
                    aria-invalid={!!form.formState.errors.newPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {form.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
  
              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    {...form.register('confirmPassword')}
                    aria-invalid={!!form.formState.errors.confirmPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
  
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
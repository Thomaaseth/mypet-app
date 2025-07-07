'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { useErrorState } from '@/hooks/useErrorsState';
import { authErrorHandler } from '@/lib/errors/handlers';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toastService } from '@/lib/toast';
import { Loader2, AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { passwordChangeSchema } from '@/lib/validations/password';
import { User } from '@/types/auth';
import { 
  // ProfilePageSkeleton, 
  AccountInfoSkeleton, 
  EmailFormSkeleton, 
  PasswordFormSkeleton 
} from '@/components/ui/skeletons/ProfileSkeleton';

// Schema for email update
const emailUpdateSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
});

type EmailUpdateFormData = z.infer<typeof emailUpdateSchema>;
type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export default function MyProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email update form
  const emailUpdateState = useErrorState();
  const emailForm = useForm<EmailUpdateFormData>({
    resolver: zodResolver(emailUpdateSchema),
    defaultValues: {
      newEmail: '',
    },
  });

  // Password change form
  const passwordChangeState = useErrorState();
  const passwordForm = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Load current user session
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        console.log('🔍 Starting session check...');

        const sessionResponse = await authClient.getSession();
        
        if ('data' in sessionResponse && sessionResponse.data?.user) {
          console.log('Has data property:', sessionResponse.data);
          console.log('Data keys:', Object.keys(sessionResponse.data || {}));
          console.log('Data content:', JSON.stringify(sessionResponse.data, null, 2));
          const user = sessionResponse.data.user;

          setCurrentUser({
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            image: user.image,
          });
          console.log('✅ User found:', sessionResponse.data.user);

          emailForm.setValue('newEmail', user.email);
        } else {
          console.log('❌ No user in data');
          console.log('🔄 About to redirect to /login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
        router.push('/login');
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserSession();
  }, [emailForm, router]);

  // Handle email update using Better Auth's native changeEmail
  const onEmailUpdate = async (data: EmailUpdateFormData) => {
    const result = await emailUpdateState.executeAction(
      async () => {
        const response = await authClient.changeEmail({
          newEmail: data.newEmail,
          callbackURL: '/profile',
        });

        if ('error' in response && response.error) {
          throw response.error;
        }

        return response;
      },
      authErrorHandler
    );

    if (result) {
      toastService.auth.emailUpdated(currentUser?.emailVerified || false);

      // If current email is not verified, the change happens immediately
      if (!currentUser?.emailVerified) {
        try {
          const sessionResponse = await authClient.getSession();
          if ('data' in sessionResponse && sessionResponse.data?.user) {
            setCurrentUser(prev => prev ? {
              ...prev, 
              email: data.newEmail 
            } : null);
          }
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      }
    }

    return result;
  };

  // Handle password change using Better Auth's native changePassword
  const onPasswordChange = async (data: PasswordChangeFormData) => {
    const result = await passwordChangeState.executeAction(
      async () => {
        const response = await authClient.changePassword({
          newPassword: data.newPassword,
          currentPassword: data.currentPassword,
          revokeOtherSessions: false,
        });

        if ('error' in response && response.error) {
          throw response.error;
        }

        return response;
      },
      authErrorHandler
    );

    if (result) {
      passwordForm.reset();
      toastService.auth.passwordChanged();
    }

    return result;
  };

    console.log('🔄 RENDER DEBUG:', {
    isLoadingUser,
    hasCurrentUser: !!currentUser,
    currentUserEmail: currentUser?.email
  });

  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <AccountInfoSkeleton />
          <EmailFormSkeleton />
          <PasswordFormSkeleton />
        </div>
      </div>
    );
  }


  // If no user found after loading, this should not happen as we redirect to login
  // but keeping it as a fallback
  if (!currentUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your current account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">{currentUser.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  {currentUser.emailVerified ? (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Member since</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Update Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Update Email
            </CardTitle>
            <CardDescription>
              Change the email address associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={emailForm.handleSubmit(onEmailUpdate)} 
              className="space-y-4"
            >
              {emailUpdateState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    {emailUpdateState.error.message}
                    <button 
                      type="button" 
                      onClick={emailUpdateState.clearError}
                      className="text-xs hover:underline ml-4"
                    >
                      Dismiss
                    </button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Enter new email"
                  {...emailForm.register('newEmail')}
                  aria-invalid={!!emailForm.formState.errors.newEmail}
                />
                {emailForm.formState.errors.newEmail && (
                  <p className="text-sm text-destructive">
                    {emailForm.formState.errors.newEmail.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={emailUpdateState.isLoading}
                size="sm"
              >
                {emailUpdateState.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {emailUpdateState.isLoading ? 'Updating...' : 'Update Email'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={passwordForm.handleSubmit(onPasswordChange)} 
              className="space-y-4"
            >
              {passwordChangeState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    {passwordChangeState.error.message}
                    <button 
                      type="button" 
                      onClick={passwordChangeState.clearError}
                      className="text-xs hover:underline ml-4"
                    >
                      Dismiss
                    </button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      {...passwordForm.register('currentPassword')}
                      aria-invalid={!!passwordForm.formState.errors.currentPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...passwordForm.register('newPassword')}
                      aria-invalid={!!passwordForm.formState.errors.newPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      {...passwordForm.register('confirmPassword')}
                      aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={passwordChangeState.isLoading}
                size="sm"
              >
                {passwordChangeState.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {passwordChangeState.isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
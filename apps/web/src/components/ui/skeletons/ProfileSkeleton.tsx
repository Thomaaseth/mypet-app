import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" /> {/* Title */}
          <Skeleton className="h-5 w-80" /> {/* Description */}
        </div>

        {/* Account Information Card Skeleton */}
        <AccountInfoSkeleton />

        {/* Email Update Card Skeleton */}
        <EmailFormSkeleton />

        {/* Password Change Card Skeleton */}
        <PasswordFormSkeleton />
      </div>
    </div>
  );
}

export function AccountInfoSkeleton() {
  return (
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
            <Skeleton className="h-5 w-40 mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <div className="flex items-center gap-2 mt-1">
              <Skeleton className="h-5 w-60" />
              <Skeleton className="h-5 w-20" /> {/* Verification status */}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Member since</Label>
            <Skeleton className="h-5 w-32 mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmailFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Email</CardTitle>
        <CardDescription>
          Change the email address associated with your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newEmail">New Email</Label>
          <Skeleton className="h-10 w-full" /> {/* Input field */}
        </div>
        <Skeleton className="h-10 w-32" /> {/* Update button */}
      </CardContent>
    </Card>
  );
}

export function PasswordFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-40" /> {/* Change Password button */}
      </CardContent>
    </Card>
  );
}
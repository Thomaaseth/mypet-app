'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useErrorState } from '@/hooks/useErrorsState';
import { authErrorHandler } from '@/lib/errors/handlers';
import { User } from '@/types/auth';
import { toastService } from '@/lib/toast';

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: isLoggingOut, executeAction } = useErrorState();

  // Load user session on mount and when pathname changes (to detect logout)
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        console.log('🔍 Navbar: Checking user session...');
        const sessionResponse = await authClient.getSession();
        
        if ('data' in sessionResponse && sessionResponse.data?.user) {
          console.log('✅ Navbar: User found:', sessionResponse.data.user);
          setUser({
            id: sessionResponse.data.user.id,
            email: sessionResponse.data.user.email,
            name: sessionResponse.data.user.name,
            emailVerified: sessionResponse.data.user.emailVerified,
            createdAt: sessionResponse.data.user.createdAt,
            updatedAt: sessionResponse.data.user.updatedAt,
            image: sessionResponse.data.user.image,
          });
        } else {
          console.log('❌ Navbar: No user found, setting to null');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Navbar: Failed to load user session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSession();
  }, [pathname]); // Re-run when pathname changes to detect logout redirects

  // Handle logout with proper state management
  const handleLogout = async () => {
    console.log('🔄 Navbar: Starting logout process...');
    toastService.auth.signOutSuccess();

    const result = await executeAction(
      async () => {
        const { error } = await authClient.signOut({});

        if (error) {
          throw error;
        }

        console.log('✅ Navbar: Logout successful, clearing user state');
        setUser(null); // Immediately clear user state
        return { success: true };
      },
      authErrorHandler
    );

    if (result) {
      console.log('✅ Navbar: Redirecting to home page');
      router.push('/');
      router.refresh(); // Refresh to update any server-side state
    }
  };

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { href: '/', label: 'Home' },
    { href: '/pets', label: 'My Pets' },
    { href: '/vets', label: 'My Vets' },
    { href: '/profile', label: 'Profile' },
  ];

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { href: '/', label: 'Home' },
  ];

  // Check if current path is active
  const isActivePath = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Show loading state
  if (isLoading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold">Pettr</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">Pettr</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {user ? (
              // Authenticated navigation
              <>
                {authenticatedNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={isActivePath(item.href) ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                
                {/* Logout button */}
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200 hover:scale-105"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    {isLoggingOut ? 'Signing out...' : 'Logout'}
                  </Button>
                </div>
              </>
            ) : (
              // Public navigation
              <>
                {publicNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={isActivePath(item.href) ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                
                {/* Auth buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    variant={isActivePath('/login') ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button 
                    variant={isActivePath('/signup') ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


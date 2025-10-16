import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useErrorState } from '@/hooks/useErrorsState';
import { authErrorHandler } from '@/lib/errors/handlers';
import { useSessionContext } from '@/contexts/SessionContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use session context
  const { user, isLoading, clearSession } = useSessionContext();
  
  const { isLoading: isLoggingOut, executeAction } = useErrorState();

  // Use clearSession from hook
  const handleLogout = async () => {
    console.log('🔄 Navbar: Starting logout process...');

    const result = await executeAction(
      async () => {
        const { error } = await authClient.signOut({});

        if (error) {
          throw error;
        }

        console.log('✅ Navbar: Logout successful, clearing user state');
        clearSession(); // Use hook method
        return { success: true };
      },
      authErrorHandler
    );

    if (result) {
      console.log('✅ Navbar: Redirecting to home page');
      navigate({ to: '/' });
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
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" search={{}} className="flex items-center space-x-2">
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
            <Link to="/" search={{}} className="flex items-center space-x-2">
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
                    <Link to={item.href} search={{}}>{item.label}</Link>
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
                    <Link to={item.href} search={{}}>{item.label}</Link>
                  </Button>
                ))}
                
                {/* Auth buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    variant={isActivePath('/login') ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <Link to="/login" search={{}}>Login</Link>
                    </Button>
                  <Button 
                    variant={isActivePath('/signup') ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <Link to="/signup" search={{}}>Sign Up</Link>
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
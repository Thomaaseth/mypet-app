import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Menu } from 'lucide-react';
import { useSessionContext } from '@/contexts/SessionContext';
import { useLogout } from '@/queries/session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageTitle } from './ui/typography';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use session context
  const { user, isLoading } = useSessionContext();

  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate({ to: '/' });
    } catch (error) {
      // Error already logged in mutation
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
                <img 
                  src="/brand/Full-Logo-Color/SVG/Pettr_Logo_Full-Color_Wine-Ginger.svg" 
                  alt="Pettr" 
                  className="h-10 w-auto"
                />
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
              <img 
                src="/brand/Full-Logo-Color/SVG/Pettr_Logo_Full-Color_Wine-Ginger.svg" 
                alt="Pettr" 
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation — hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
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
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-200 hover:scale-105"
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Logout
                  </Button>
                </div>
              </>
            ) : (
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
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant={isActivePath('/login') ? "default" : "ghost"} size="sm" asChild>
                    <Link to="/login" search={{}}>Login</Link>
                  </Button>
                  <Button variant={isActivePath('/signup') ? "default" : "ghost"} size="sm" asChild>
                    <Link to="/signup" search={{}}>Sign Up</Link>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Navigation — hidden on desktop */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    {authenticatedNavItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          to={item.href}
                          search={{}}
                          className={isActivePath(item.href) ? "font-semibold" : ""}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="text-destructive focus:text-destructive"
                    >
                      {logoutMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {publicNavItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link to={item.href} search={{}}>
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/login" search={{}}>Login</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/signup" search={{}}>Sign Up</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
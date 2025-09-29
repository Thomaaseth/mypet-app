import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// protected routes that require authentication
const PROTECTED_ROUTES = [
  '/pets',
  '/profile',
  '/vets',
];

// public routes (allowed without auth)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

/**
 * Check if a path matches any of the protected routes
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a path is explicitly public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

/**
 * Middleware to protect routes requiring authentication
 * Runs on the server before the page loads
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // Check if route needs protection
  const needsAuth = isProtectedRoute(pathname);
  
  if (!needsAuth) {
    return NextResponse.next();
  }

  // Check for session better-auth in cookies
  // Check name in console, common 'better-auth.session_token'
  // Name set to: pettr-auth.session_token
  const sessionToken = request.cookies.get('pettr-auth.session_token');
  
  // If no session token, redirect to login
  if (!sessionToken) {
    console.log(`🔒 Middleware: Blocking access to ${pathname} - No session`);
    const loginUrl = new URL('/login', request.url);
    // Add redirect parameter to return user after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists, allow access
  console.log(`✅ Middleware: Allowing access to ${pathname}`);
  return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
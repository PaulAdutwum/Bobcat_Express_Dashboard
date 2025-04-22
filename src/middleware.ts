import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a simplified middleware for development purposes
export function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;
  
  // Check if this is an admin route
  const isAdminRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/analytics') || 
    path.startsWith('/ride-management') ||
    path.startsWith('/driver-status');
  
  // Check if this is a student route
  const isStudentRoute = path.startsWith('/student');
  
  // Get auth cookie
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie?.value ? true : false;
  
  // Admin check - more permissive for development
  const emailCookie = request.cookies.get('user_email');
  const adminCookie = request.cookies.get('admin');
  
  // During development, allow more flexible admin access
  const isAdmin = 
    adminCookie?.value === 'true' || 
    authCookie?.value?.includes('admin') || 
    emailCookie?.value === 'padutwum@bates.edu' ||
    emailCookie?.value?.endsWith('@bates.edu'); // For development, treat all Bates emails as admin
  
  // For development: bypass most auth checks if hitting issues
  const isDevelopmentMode = process.env.NODE_ENV === 'development';

  // Special development bypass - uncommenting this line allows full access during development
  // if (isDevelopmentMode) return NextResponse.next();
  
  // Simple rules with development flexibility
  if (!isAuthenticated && (isAdminRoute || isStudentRoute)) {
    // Allow development access in certain cases
    if (isDevelopmentMode && emailCookie?.value) {
      return NextResponse.next();
    }
    
    // Redirect to home if trying to access protected routes without auth
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (isAuthenticated && !isAdmin && isAdminRoute) {
    // For development, just log instead of redirecting
    if (isDevelopmentMode) {
      console.log("Warning: Non-admin accessing admin route, but allowing in development mode");
      return NextResponse.next();
    }
    
    // Redirect students to student home if they try to access admin routes
    return NextResponse.redirect(new URL('/student', request.url));
  }
  
  // Continue for all other cases
  return NextResponse.next();
}

// Only run middleware on specified paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/analytics/:path*',
    '/ride-management/:path*',
    '/driver-status/:path*',
    '/shuttle-location/:path*',
    '/student/:path*',
  ],
}; 
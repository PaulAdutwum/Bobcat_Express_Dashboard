import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware controls access to admin and student routes
export function middleware(request: NextRequest) {
  // Get the path
  const path = request.nextUrl.pathname;
  
  // Check if this is an admin route
  const isAdminRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/analytics') || 
    path.startsWith('/ride-management') ||
    path.startsWith('/driver-status') ||
    path.startsWith('/shuttle-tracking') ||
    path.startsWith('/user-logs');
  
  // Check if this is a student route
  const isStudentRoute = path.startsWith('/student');
  
  // Get auth cookie
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie?.value === 'true';
  
  // Get email and admin cookies
  const emailCookie = request.cookies.get('user_email');
  const adminCookie = request.cookies.get('admin');
  
  // Log cookies in development mode for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware processing path:', path);
    console.log('Auth cookie:', authCookie?.value);
    console.log('Email cookie:', emailCookie?.value);
    console.log('Admin cookie:', adminCookie?.value);
  }
  
  // Only padutwum@bates.edu has admin access, regardless of development mode
  const isAdmin = emailCookie?.value === 'padutwum@bates.edu';
  
  // Authentication checks - these apply in all environments
  
  // If not authenticated, redirect to home page
  if (!isAuthenticated && (isAdminRoute || isStudentRoute)) {
    console.log('Not authenticated, redirecting to home');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If authenticated but not admin, and trying to access admin routes, redirect to student dashboard
  if (isAuthenticated && !isAdmin && isAdminRoute) {
    console.log('Not admin, redirecting to student dashboard');
    return NextResponse.redirect(new URL('/student', request.url));
  }
  
  // If authenticated with an email that's not padutwum@bates.edu, 
  // set a cookie to indicate they're a student account
  if (isAuthenticated && !isAdmin && !isStudentRoute) {
    // Create a response that continues the request
    const response = NextResponse.next();
    
    // Set the admin cookie to false for non-padutwum@bates.edu emails
    response.cookies.set('admin', 'false', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict'
    });
    
    return response;
  }
  
  // Continue for all other cases (authenticated and accessing appropriate routes)
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
    '/shuttle-tracking/:path*',
    '/user-logs/:path*',
    '/student/:path*',
  ],
}; 
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that don't require authentication
const publicPaths = ['/login', '/register', '/reset-password'];

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // If no session cookie and trying to access protected route, redirect to login
  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If has session cookie and trying to access public route, redirect to dashboard
  if (sessionCookie && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 
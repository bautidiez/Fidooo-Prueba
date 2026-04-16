import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/chat'];
const AUTH_PATHS = ['/login'];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session');
  const isAuthenticated = Boolean(sessionCookie?.value);

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  const isAuthRoute = AUTH_PATHS.some((path) => pathname.startsWith(path));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/login/:path*'],
};

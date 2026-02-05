import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n for admin routes and resume page
  if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname === '/resume') {
    // JWT authentication check
    const authHeader = request.headers.get('authorization');
    const hasAuthHeader = authHeader?.startsWith('Bearer ');

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Proxy] ${pathname} - Auth Header: ${hasAuthHeader ? 'YES' : 'NO'}`);
    }

    return NextResponse.next();
  }

  // Skip i18n for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply i18n middleware for public routes
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Next.js internals
  // - Static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

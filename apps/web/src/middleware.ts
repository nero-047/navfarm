import { NextRequest, NextResponse } from 'next/server';

// Presence-only gate: blocks direct/unauthenticated navigation to protected
// areas before any protected UI is served. It does not verify the session is
// still valid (middleware can't read localStorage, and doesn't decode the
// JWT) — that's still enforced by the API on every request, and by the
// per-role checks in console/layout.tsx and admin/layout.tsx. This only
// closes the gap where a signed-out browser could momentarily render a
// protected layout before the client-side redirect kicked in.
const PROTECTED_PREFIXES = ['/console', '/admin'];
const SESSION_COOKIE = 'navfarm_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/console/:path*', '/admin/:path*'],
};

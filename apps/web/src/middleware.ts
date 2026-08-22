import { NextRequest, NextResponse } from 'next/server';

// Presence-only gate: blocks direct/unauthenticated navigation to protected
// areas before any protected UI is served. It does not verify the session is
// still valid (middleware can't read localStorage, and doesn't decode the
// JWT) — that's still enforced by the API on every request, and by the
// per-role checks in (app)/layout.tsx and admin/layout.tsx. This only
// closes the gap where a signed-out browser could momentarily render a
// protected layout before the client-side redirect kicked in.
//
// Default-deny rather than an allowlist of protected prefixes: the app's
// pages used to all live under one /console prefix, so a single entry
// covered everything. Now that each section has its own top-level route
// (/dashboard, /production, /inventory, ...), a prefix allowlist would
// silently leave a new page unprotected until someone remembered to add it
// here. Listing the PUBLIC routes instead means a forgotten page defaults
// to protected, not open.
const PUBLIC_PREFIXES = ['/login', '/signup', '/reset-password', '/privacy', '/terms', '/organization', '/dev'];
const SESSION_COOKIE = 'navfarm_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/') {
    return NextResponse.next();
  }
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isPublic) {
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
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};

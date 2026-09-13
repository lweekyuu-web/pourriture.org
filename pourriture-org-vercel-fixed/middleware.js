import { NextResponse } from 'next/server';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Keep the maintenance status endpoint, Next internals and the maintenance
  // screen itself reachable while the rest of the site is closed.
  if (
    pathname === '/maintenance' ||
    pathname === '/api/maintenance' ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  try {
    const statusUrl = new URL('/api/maintenance', req.url);
    const status = await fetch(statusUrl, {
      headers: { cookie: req.headers.get('cookie') || '' },
      cache: 'no-store',
    });

    if (status.ok) {
      const data = await status.json();
      if (data.enabled && !data.isAdmin) {
        const url = req.nextUrl.clone();
        url.pathname = '/maintenance';
        url.search = '';
        return NextResponse.rewrite(url);
      }
    }
  } catch (_) {
    // If the status check fails, do not accidentally lock the whole site.
    // The application remains available rather than treating an outage as maintenance.
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

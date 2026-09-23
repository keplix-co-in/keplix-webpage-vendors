import { NextResponse } from 'next/server';

/**
 * Makes /dev/* a real 404 in production.
 *
 * app/dev/layout.js already calls notFound() there, but the response still went
 * out as HTTP 200: the root app/loading.js Suspense shell is flushed before the
 * layout throws, so the 404 UI streams into an already-committed 200. The page
 * showed no dev content, yet crawlers and uptime checks saw a success status.
 *
 * Answering here instead means the route is never rendered at all, so the
 * status is correct and the dev screen tester cannot be reached on the public
 * domain. The layout's notFound() stays as the second line of defence.
 *
 * `next dev` and preview builds are unaffected, which is the point of the tool.
 */
export function proxy() {
  // Local `next dev` keeps the screen tester; only built/deployed apps hide it.
  if (process.env.NODE_ENV !== 'production') return NextResponse.next();

  return new NextResponse('Not Found', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // Belt and braces: the page is unreachable, so nothing should be indexed.
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

export const config = {
  // Scoped to /dev so no other request pays for a proxy invocation.
  matcher: '/dev/:path*',
};

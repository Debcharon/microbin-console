import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow login page and API routes
    if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Allow static files (Next.js assets, favicon, and public images)
    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || 
        /\.(webp|png|jpg|jpeg|gif|svg|ico)$/i.test(pathname)) {
        return NextResponse.next();
    }

    // Check for session cookie
    const session = request.cookies.get('session');

    if (!session || session.value !== 'authenticated') {
        // Redirect to login page
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pattern to match root-level static image files from /public directory
const PUBLIC_IMAGE_PATTERN = /^\/[^/]+\.(webp|png|jpg|jpeg|gif|svg|ico|webmanifest)$/i;

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow login page and API routes
    if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Allow static files (Next.js assets, favicon, and public images)
    // Only allow image files at root level (from /public directory)
    if (pathname.startsWith('/_next') || 
        pathname.startsWith('/favicon.ico') || 
        PUBLIC_IMAGE_PATTERN.test(pathname)) {
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

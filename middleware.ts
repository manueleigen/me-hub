import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

	const sessionToken =
		request.cookies.get('better-auth.session_token') ??
		request.cookies.get('__Secure-better-auth.session_token');

	if (!sessionToken && !isPublic) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}

	if (sessionToken && isPublic) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

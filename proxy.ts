import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/workspace-invite'];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// MCP clients (mcp-remote) probe OAuth metadata — must not redirect to /login HTML
	if (pathname.startsWith("/.well-known/")) {
		return NextResponse.next();
	}

	const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

	const sessionToken =
		request.cookies.get('better-auth.session_token') ??
		request.cookies.get('__Secure-better-auth.session_token');

	if (!sessionToken && !isPublic) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Allow invite flows while logged in (accept workspace) or during OAuth callback
	const isInviteFlow =
		pathname.startsWith('/workspace-invite/') || pathname.startsWith('/register');

	if (sessionToken && isPublic && !isInviteFlow) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-pathname', pathname);
	return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

import { getOAuthState } from "better-auth/api";

export type InviteTokensFromOAuth = {
	workspaceInviteToken?: string;
	appInviteToken?: string;
};

/** Extract invite tokens from Better Auth OAuth callbackURL (no cookies). */
export function parseInviteTokensFromCallbackUrl(callbackURL: string): InviteTokensFromOAuth {
	try {
		const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
		const url = new URL(callbackURL, base);

		const workspaceMatch = url.pathname.match(/^\/workspace-invite\/([^/]+)\/?$/);
		if (workspaceMatch?.[1]) {
			return { workspaceInviteToken: decodeURIComponent(workspaceMatch[1]) };
		}

		if (url.pathname === "/register" || url.pathname.startsWith("/register/")) {
			const token = url.searchParams.get("token")?.trim();
			if (token) return { appInviteToken: token };
		}
	} catch {
		// fallback for malformed URLs
	}

	const workspaceMatch = callbackURL.match(/\/workspace-invite\/([^/?#]+)/);
	if (workspaceMatch?.[1]) {
		return { workspaceInviteToken: decodeURIComponent(workspaceMatch[1]) };
	}

	const registerMatch = callbackURL.match(/[?&]token=([^&]+)/);
	if (registerMatch?.[1] && callbackURL.includes("/register")) {
		return { appInviteToken: decodeURIComponent(registerMatch[1]) };
	}

	return {};
}

/** Read invite context during GitHub OAuth callback (databaseHooks). */
export async function getInviteTokensFromOAuthState(): Promise<InviteTokensFromOAuth> {
	const state = await getOAuthState();
	if (!state?.callbackURL) return {};
	return parseInviteTokensFromCallbackUrl(state.callbackURL);
}

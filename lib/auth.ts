import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
import { generateWorkspaceSlug } from "./workspace-defaults";
import { seedWorkspaceNavAndPages } from "./workspace-seed";
import type { VaultSessionUser } from "@/types/vault-session-user";
import { fulfillWorkspaceInvitationForUser } from "@/lib/invitations/fulfill-workspace-invitation";
import { acceptAppInvitationByToken } from "@/lib/invitations/accept-app-invitation-by-token";
import {
	resolveAppInvitationForNewUser,
	resolveWorkspaceInvitationForNewUser,
} from "@/lib/invitations/resolve-invitations-for-new-user";
import { getInviteTokensFromOAuthState } from "./invite-oauth";
import {
	ensurePlatformRoles,
	getAdminRoleId,
	getDefaultUserRoleId,
} from "@/lib/platform-roles";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	user: {
		additionalFields: {
			appRoleId: { type: "string", required: false, input: false },
			darkMode: { type: "boolean", required: false, defaultValue: true, input: false },
			autoSave: { type: "boolean", required: false, defaultValue: true, input: false },
		},
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			/** Explicit minimal classic scopes: identity + repo API for vault when no workspace PAT. */
			scopes: ["read:user", "user:email", "repo"],
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user, ctx) => {
					await ensurePlatformRoles();
					const count = await prisma.user.count();

					if (count === 0) {
						const adminRoleId = await getAdminRoleId();
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { emailVerified, ...rest } = user;
						return {
							data: {
								...rest,
								role: "admin",
								appRoleId: adminRoleId,
							},
						};
					}

					const isOAuthCallback =
						typeof ctx?.path === "string" && ctx.path.includes("/callback/");
					const inviteTokens = isOAuthCallback ? await getInviteTokensFromOAuthState() : {};

					const workspaceInvite = inviteTokens.workspaceInviteToken
						? await resolveWorkspaceInvitationForNewUser(inviteTokens.workspaceInviteToken)
						: null;

					const appInvitation = workspaceInvite
						? null
						: await resolveAppInvitationForNewUser(
								user.email,
								inviteTokens.appInviteToken,
							);

					if (!workspaceInvite && !appInvitation) {
						throw new APIError("FORBIDDEN", {
							message:
								"Registrierung nur mit gültigem Einladungslink. Bitte den Link aus der Einladung verwenden.",
						});
					}

					const defaultRoleId = await getDefaultUserRoleId();
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { emailVerified, ...rest } = user;
					return {
						data: {
							...rest,
							role: "user",
							appRoleId: defaultRoleId,
						},
					};
				},

				after: async (user, ctx) => {
					const slug = await generateWorkspaceSlug(user.name ?? user.email ?? user.id);
					const workspace = await prisma.$transaction(async (tx) => {
						const ws = await tx.workspace.create({
							data: {
								slug,
								name: user.name ? `${user.name}s Space` : "My Space",
								type: "PERSONAL",
								ownerId: user.id,
								members: {
									create: { userId: user.id, role: "OWNER" },
								},
							},
						});
						await seedWorkspaceNavAndPages(ws.id, tx);
						return ws;
					});
					await prisma.userWorkspacePreference.create({
						data: { userId: user.id, activeWorkspaceId: workspace.id },
					});

					const isOAuthCallback =
						typeof ctx?.path === "string" && ctx.path.includes("/callback/");
					if (!isOAuthCallback) return;

					const inviteTokens = await getInviteTokensFromOAuthState();

					if (inviteTokens.appInviteToken) {
						await acceptAppInvitationByToken(inviteTokens.appInviteToken);
					}
					if (inviteTokens.workspaceInviteToken) {
						await fulfillWorkspaceInvitationForUser(
							inviteTokens.workspaceInviteToken,
							user.id,
						);
					}
				},
			},
		},
	},
	plugins: [
		admin(),
		nextCookies(),
	],
});

/** Deduped per RSC request — Session + User (Better Auth). */
export const getAuthSession = cache(async () => {
	return auth.api.getSession({
		headers: await headers(),
	});
});

export type AuthSession = NonNullable<Awaited<ReturnType<typeof getAuthSession>>>;

/** Session user including vault fields when Better Auth returns the full DB row. */
export type AuthSessionUser = AuthSession["user"] & Partial<VaultSessionUser>;

import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { prisma } from "./prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const count = await prisma.user.count();
					if (count > 0) {
						throw new APIError("FORBIDDEN", {
							message: "Diese Plattform ist geschlossen. Nur ein Admin ist erlaubt.",
						});
					}
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { emailVerified, ...rest } = user;
					return {
						data: {
							...rest,
							role: "admin",
						},
					};
				},
			},
		},
	},
	plugins: [
		admin(),
		nextCookies(),
	],
});

export async function getAuthSession() {
	return auth.api.getSession({
		headers: await headers(),
	});
}

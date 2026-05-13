import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVaultService } from "./index";

export async function getUserVaultService() {
	const session = await getAuthSession();
	const user = session?.user
		? await prisma.user.findUnique({
				where: { id: session.user.id },
				select: { githubSync: true },
			})
		: null;
	return createVaultService({ githubSync: user?.githubSync ?? false });
}

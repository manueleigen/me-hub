import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getVaultConfig() {
	const session = await getAuthSession();
	const user = session?.user
		? await prisma.user.findUnique({
				where: { id: session.user.id },
				select: {
					vaultGithubOwner: true,
					vaultGithubRepo: true,
					vaultGithubBranch: true,
				},
			})
		: null;

	const owner = (user?.vaultGithubOwner ?? "").trim();
	const repo = (user?.vaultGithubRepo ?? "").trim();
	const branch = (user?.vaultGithubBranch ?? "main").trim() || "main";

	return { owner, repo, branch };
}

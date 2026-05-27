import { getGitHubTokenForWorkspace, workspaceHasStoredGithubToken } from "@/lib/github/token";

export class VaultGitHubWriteAccessError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "VaultGitHubWriteAccessError";
	}
}

const PAT_REQUIRED_MESSAGE =
	"Kein Workspace-PAT hinterlegt. Unter Einstellungen → GitHub Sync ein fein abgestuftes PAT mit Zugriff auf dieses Repository speichern (Contents: Read and write).";

/**
 * Returns the workspace PAT for vault writes. OAuth login tokens are not accepted.
 */
export async function ensureVaultGitHubWriteToken(workspaceId: string): Promise<string> {
	if (!(await workspaceHasStoredGithubToken(workspaceId))) {
		throw new VaultGitHubWriteAccessError(PAT_REQUIRED_MESSAGE);
	}

	const token = await getGitHubTokenForWorkspace(workspaceId);
	if (!token) {
		throw new VaultGitHubWriteAccessError(PAT_REQUIRED_MESSAGE);
	}

	return token;
}

/** Maps GitHub REST errors from contents API into actionable messages. */
export function formatGitHubVaultWriteError(error: unknown): Error {
	if (error instanceof VaultGitHubWriteAccessError) return error;

	const status =
		error && typeof error === "object" && "status" in error
			? Number((error as { status: number }).status)
			: 0;

	if (status === 404) {
		return new VaultGitHubWriteAccessError(
			"GitHub hat die Anfrage abgelehnt (404). Prüfe Owner/Repo/Branch, Vault-Pfad und ob das PAT Contents-Schreibzugriff auf dieses Repository hat.",
		);
	}

	if (status === 403 || status === 401) {
		return new VaultGitHubWriteAccessError(
			"GitHub hat den Zugriff verweigert. PAT-Berechtigungen oder Repository-Sichtbarkeit prüfen.",
		);
	}

	if (error instanceof Error) return error;
	return new Error("GitHub-Anfrage fehlgeschlagen.");
}

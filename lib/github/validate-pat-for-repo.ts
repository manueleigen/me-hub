import { getOctokitClient } from "@/lib/github/octokit";

export type PatValidationResult =
	| { ok: true }
	| { ok: false; message: string };

/** Classic PAT scopes beyond normal repo contents access — refuse. */
const DISALLOWED_OAUTH_SCOPES = new Set([
	"delete_repo",
	"admin:org",
	"admin:public_key",
	"admin:repo_hook",
	"admin:enterprise",
]);

/**
 * Verifies the token can access the given repo and rejects egregiously over-scoped classic PATs.
 * Fine-grained PATs often omit x-oauth-scopes — then we only check repo access.
 */
export async function validateGithubPatForVaultRepo(
	token: string,
	owner: string,
	repo: string,
): Promise<PatValidationResult> {
	const o = owner.trim();
	const r = repo.trim();
	if (!o || !r) {
		return {
			ok: false,
			message:
				"GitHub Owner und Repository müssen gesetzt sein, bevor ein PAT geprüft werden kann.",
		};
	}

	const octokit = getOctokitClient(token);
	try {
		const { headers } = await octokit.request("GET /repos/{owner}/{repo}", {
			owner: o,
			repo: r,
			request: { signal: AbortSignal.timeout(20_000) },
		});

		const rawScopes = headers["x-oauth-scopes"];
		if (typeof rawScopes === "string" && rawScopes.trim()) {
			if (rawScopes.trim() === "*") {
				return {
					ok: false,
					message:
						"Vollzugriff-Token ist nicht erlaubt. Bitte ein PAT mit minimalem Umfang (idealerweise fein abgestuft nur für dieses Repository) verwenden.",
				};
			}
			const list = rawScopes.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
			for (const s of list) {
				if (DISALLOWED_OAUTH_SCOPES.has(s)) {
					return {
						ok: false,
						message: `Der Token enthält den übermäßigen Scope „${s}“. Bitte ein eingeschränktes PAT nur für Repository-Inhalte verwenden.`,
					};
				}
			}
		}

		return { ok: true };
	} catch (e: unknown) {
		const status =
			e && typeof e === "object" && "status" in e
				? Number((e as { status: number }).status)
				: 0;
		if (status === 401 || status === 403) {
			return {
				ok: false,
				message:
					"GitHub hat den Token abgelehnt (kein Zugriff). Prüfe Berechtigungen für dieses Repository.",
			};
		}
		if (status === 404) {
			return {
				ok: false,
				message:
					"Repository nicht gefunden oder mit diesem Token nicht sichtbar (private Repo?).",
			};
		}
		return {
			ok: false,
			message: "GitHub-Token konnte nicht geprüft werden. Netzwerk oder ungültiges Tokenformat.",
		};
	}
}

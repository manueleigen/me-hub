export class VaultPathExistsError extends Error {
	constructor(
		public readonly entryName: string,
		public readonly kind: "file" | "folder",
	) {
		super(
			kind === "file"
				? `„${entryName}“ existiert in diesem Ordner bereits. Bitte einen anderen Namen wählen.`
				: `Der Ordner „${entryName}“ existiert hier bereits. Bitte einen anderen Namen wählen.`,
		);
		this.name = "VaultPathExistsError";
	}
}

/** GitHub returns 422 when creating a path that already exists without sha. */
export function isGithubPathExistsError(err: unknown): boolean {
	if (!err || typeof err !== "object") return false;
	const status = (err as { status?: number }).status;
	if (status === 422) return true;
	const message = String((err as { message?: string }).message ?? "");
	return /already exists|existiert bereits/i.test(message);
}

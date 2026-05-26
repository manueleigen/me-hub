/** Vault UI label — full stored name (including `.md` and other extensions). */
export function vaultEntryDisplayName(
	name: string,
	title?: string | null,
): string {
	const t = title?.trim();
	return t || name;
}

/** Duplicate filename (matches `vaultService.duplicateFile`). */
export function vaultDuplicateFileName(fileName: string): string {
	const dot = fileName.lastIndexOf(".");
	if (dot > 0) {
		return `${fileName.slice(0, dot)}-kopie${fileName.slice(dot)}`;
	}
	return `${fileName}-kopie.md`;
}

import { shouldMirrorVaultFilePath } from "@/lib/vault/mirrorable-text-files";

type CompareCommitFile = {
	filename: string;
	status: string;
	previous_filename?: string | null;
};

/**
 * Maps GitHub compareCommits file entries to mirror delete/fetch paths.
 */
export function classifyCompareFiles(compareFiles: CompareCommitFile[]): {
	toDelete: string[];
	toFetch: string[];
} {
	const toDelete = new Set<string>();
	const toFetch = new Set<string>();

	for (const file of compareFiles) {
		const { filename, status, previous_filename: previousFilename } = file;

		switch (status) {
			case "removed":
				if (shouldMirrorVaultFilePath(filename)) {
					toDelete.add(filename);
				}
				break;
			case "renamed":
				if (previousFilename && shouldMirrorVaultFilePath(previousFilename)) {
					toDelete.add(previousFilename);
				}
				if (shouldMirrorVaultFilePath(filename)) {
					toFetch.add(filename);
				}
				break;
			case "added":
			case "modified":
			case "copied":
			case "changed":
				if (shouldMirrorVaultFilePath(filename)) {
					toFetch.add(filename);
				}
				break;
			default:
				break;
		}
	}

	return { toDelete: [...toDelete], toFetch: [...toFetch] };
}

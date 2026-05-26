/**
 * Which repo files are mirrored and shown as text in the vault UI.
 * Structured modules (Kunden, Ideen, …) use {@link isVaultModuleEntryFile} (`.md`, `.txt`, no extension).
 */

const SKIP_BASENAMES = new Set([
	".gitkeep",
	".ds_store",
	"thumbs.db",
	"desktop.ini",
]);

/** Known binary / non-text extensions — never mirror. */
const BINARY_EXTENSIONS = new Set([
	"7z",
	"avi",
	"bin",
	"bmp",
	"class",
	"dmg",
	"doc",
	"docx",
	"exe",
	"gif",
	"gz",
	"heic",
	"ico",
	"jar",
	"jpeg",
	"jpg",
	"mov",
	"mp3",
	"mp4",
	"ogg",
	"pdf",
	"png",
	"ppt",
	"pptx",
	"rar",
	"sqlite",
	"tar",
	"wasm",
	"webm",
	"webp",
	"woff",
	"woff2",
	"xls",
	"xlsx",
	"zip",
	"zst",
]);

/** Explicit text-like extensions (lowercase, without dot). */
const TEXT_EXTENSIONS = new Set([
	"bash",
	"bat",
	"cjs",
	"conf",
	"config",
	"css",
	"csv",
	"env",
	"graphql",
	"htm",
	"html",
	"ini",
	"js",
	"json",
	"jsonc",
	"jsonl",
	"jsx",
	"less",
	"log",
	"md",
	"mdx",
	"mjs",
	"php",
	"pl",
	"properties",
	"py",
	"rb",
	"rs",
	"sass",
	"scss",
	"sh",
	"sql",
	"svg",
	"toml",
	"ts",
	"tsx",
	"txt",
	"vue",
	"xml",
	"yaml",
	"yml",
	"zsh",
]);

function basename(path: string): string {
	return path.split("/").pop() ?? path;
}

function fileExtension(name: string): string | null {
	const dot = name.lastIndexOf(".");
	if (dot <= 0) return null;
	return name.slice(dot + 1).toLowerCase();
}

export function shouldMirrorVaultFilePath(path: string): boolean {
	if (!path || path.includes("..")) return false;
	if (path.endsWith("/.gitkeep") || path === ".gitkeep") return false;

	const name = basename(path);
	const lower = name.toLowerCase();
	if (SKIP_BASENAMES.has(lower)) return false;
	if (name.startsWith("_") && name.endsWith(".md")) return false;

	const ext = fileExtension(name);

	if (ext === null) {
		if (name.startsWith(".")) return false;
		return true;
	}

	if (BINARY_EXTENSIONS.has(ext)) return false;
	return TEXT_EXTENSIONS.has(ext);
}

/** Structured modules: frontmatter in `.md`, `.txt`, or extensionless text files. */
export function isVaultModuleEntryFile(path: string): boolean {
	if (!shouldMirrorVaultFilePath(path)) return false;
	const name = basename(path);
	if (name.startsWith("_")) return false;
	const ext = fileExtension(name);
	if (ext === null) return !name.startsWith(".");
	return ext === "md" || ext === "mdx" || ext === "txt";
}

/** Slug from a module entry basename (strips `.md` / `.txt` only). */
export function vaultModuleEntrySlugFromBasename(name: string): string {
	const ext = fileExtension(name);
	if (ext === "md" || ext === "mdx" || ext === "txt") {
		return name.slice(0, name.lastIndexOf("."));
	}
	return name;
}

/** @deprecated Use {@link isVaultModuleEntryFile} */
export function isVaultModuleMarkdownFile(path: string): boolean {
	return isVaultModuleEntryFile(path);
}

/** Use markdown renderer in vault viewer; other text types render as monospace pre. */
export function isVaultMarkdownDisplayPath(path: string): boolean {
	const ext = fileExtension(basename(path));
	return ext === null || ext === "md" || ext === "mdx";
}

/** @deprecated Use {@link shouldMirrorVaultFilePath} */
export const shouldMirrorMarkdownPath = shouldMirrorVaultFilePath;

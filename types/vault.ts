export interface VaultFrontmatter {
	title?: string;
	description?: string;
	tags?: string[];
	date?: string;
	status?: string;
	client?: string;
	project?: string;
	[key: string]: unknown;
}

export interface VaultFile {
	path: string;
	name: string;
	title: string;
	type: "file" | "directory";
	extension?: string;
	content?: string;
	frontmatter?: VaultFrontmatter;
	children?: VaultFile[];
	lastModified?: Date;
	sha?: string;
}

export interface VaultTreeNode {
	path: string;
	name: string;
	type: "file" | "directory";
	children?: VaultTreeNode[];
	isExpanded?: boolean;
}

export interface VaultBreadcrumb {
	name: string;
	path: string;
}

export type VaultViewMode = "view" | "edit";

export interface GitLinks {
	self: string;
	git: string;
	html: string;
}

export interface GitFile {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	/** download_url is null for directories */
	download_url: string | null;
	/** GitHub usually categorizes these as 'file', 'dir', 'symlink', or 'submodule' */
	type: "file" | "dir" | string;
	_links: GitLinks;
}

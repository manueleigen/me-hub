import type { Metadata } from "next";
import { shellLayoutMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = shellLayoutMetadata;

/** Route group for global pages (profil, workspaces, admin). Shell chrome lives in (dashboard)/layout. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
	return children;
}

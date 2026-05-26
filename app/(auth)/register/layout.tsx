import type { Metadata } from "next";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Registrieren");

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
	return children;
}

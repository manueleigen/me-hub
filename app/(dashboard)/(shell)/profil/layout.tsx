import type { Metadata } from "next";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Profil");

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
	return children;
}

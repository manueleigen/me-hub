import type { Metadata } from "next";
import { childPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = childPageMetadata("Anmelden");

export default function LoginLayout({ children }: { children: React.ReactNode }) {
	return children;
}

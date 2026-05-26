import type { Metadata } from "next";
import { authLayoutMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = authLayoutMetadata;

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}

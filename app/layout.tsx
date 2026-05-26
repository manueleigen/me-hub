import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import "../styles/style.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { appConfig } from "@/lib/config";
import { pageTitleTemplate } from "@/lib/page-metadata";

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
	title: {
		template: pageTitleTemplate(),
		default: appConfig.name,
	},
	description: appConfig.description,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${fontSans.variable} ${fontMono.variable} dark bg-background`}
		>
			<body className="antialiased">
				<ThemeProvider>{children}</ThemeProvider>
				<Toaster />
			</body>
		</html>
	);
}

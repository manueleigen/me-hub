import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "MeHub",
	description: "Your personal productivity and knowledge management system",
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
			className={`${fontSans.variable} dark bg-background`}
		>
			<body className="antialiased">
				<ThemeProvider>{children}</ThemeProvider>
				<Toaster />
			</body>
		</html>
	);
}

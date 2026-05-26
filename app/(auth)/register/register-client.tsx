"use client";

import * as React from "react";
import Link from "next/link";
import { Computer as Github, Stone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

type RegisterClientProps = {
	token: string;
	invitedEmail: string | null;
};

export function RegisterClient({ token, invitedEmail }: RegisterClientProps) {
	const [isLoading, setIsLoading] = React.useState(false);

	const handleGitHubRegister = async () => {
		setIsLoading(true);
		await authClient.signIn.social({
			provider: "github",
			callbackURL: `/register?token=${encodeURIComponent(token)}`,
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<div className="flex justify-center mb-4">
						<Stone className="size-20" />
					</div>
					<CardTitle className="text-2xl">MeHub beitreten</CardTitle>
					<CardDescription>
						{invitedEmail
							? `Einladung für ${invitedEmail}. Registriere dich mit dem GitHub-Konto, das diese E-Mail-Adresse verwendet.`
							: "Offener Einladungslink — die erste Person, die sich mit GitHub registriert, erhält Zugang."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="outline"
						className="w-full"
						onClick={handleGitHubRegister}
						disabled={isLoading}
					>
						<Github className="mr-2 size-4" />
						{isLoading ? "Weiterleitung…" : "Mit GitHub registrieren"}
					</Button>
				</CardContent>
				<CardFooter className="flex flex-col space-y-2">
					<div className="text-sm text-muted-foreground text-center">
						Bereits ein Konto?{" "}
						<Link href="/login" className="text-primary hover:underline">
							Anmelden
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

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

type WorkspaceInviteClientProps = {
	token: string;
	workspaceName: string;
	allowsSignup: boolean;
};

export function WorkspaceInviteClient({
	token,
	workspaceName,
	allowsSignup,
}: WorkspaceInviteClientProps) {
	const [isLoading, setIsLoading] = React.useState(false);
	const callbackURL = `/workspace-invite/${token}`;
	const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackURL)}`;

	const handleGitHub = async () => {
		setIsLoading(true);
		await authClient.signIn.social({ provider: "github", callbackURL });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<div className="flex justify-center mb-4">
						<Stone className="size-20" />
					</div>
					<CardTitle className="text-2xl">Workspace-Einladung</CardTitle>
					<CardDescription>
						{allowsSignup ? (
							<>
								Du wurdest zu <strong>{workspaceName}</strong> eingeladen. Registriere dich neu
								oder melde dich an — danach wirst du dem Workspace hinzugefügt.
							</>
						) : (
							<>
								Du wurdest zu <strong>{workspaceName}</strong> eingeladen. Melde dich mit deinem
								bestehenden App-Konto an, um beizutreten.
							</>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{allowsSignup ? (
						<Button
							variant="outline"
							className="w-full"
							onClick={handleGitHub}
							disabled={isLoading}
						>
							<Github className="mr-2 size-4" />
							{isLoading ? "Weiterleitung…" : "Mit GitHub registrieren oder anmelden"}
						</Button>
					) : (
						<Button asChild className="w-full">
							<Link href={loginHref}>Mit bestehendem Konto anmelden</Link>
						</Button>
					)}
				</CardContent>
				{allowsSignup && (
					<CardFooter className="flex flex-col space-y-2">
						<div className="text-sm text-muted-foreground text-center">
							Bereits ein Konto?{" "}
							<Link href={loginHref} className="text-primary hover:underline">
								Anmelden
							</Link>
						</div>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}

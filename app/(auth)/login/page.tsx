"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Computer as Github, Stone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = React.useState(false);
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [errorMsg, setErrorMsg] = React.useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMsg("");
		setIsLoading(true);

		const { error } = await authClient.signIn.email({ email, password });

		if (error) {
			setErrorMsg(error.message ?? "Anmeldung fehlgeschlagen");
			setIsLoading(false);
			return;
		}

		router.push("/");
		router.refresh();
	};

	const handleGitHubLogin = async () => {
		setIsLoading(true);
		await authClient.signIn.social({ provider: "github", callbackURL: "/" });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<div className="flex justify-center mb-4">
						<Stone className="size-20" />
					</div>
					<CardTitle className="text-2xl">Willkommen zurueck</CardTitle>
					<CardDescription>
						Melde dich an, um auf dein MeHub zuzugreifen
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{errorMsg && (
						<Alert variant="destructive">
							<AlertCircle className="size-4" />
							<AlertDescription>{errorMsg}</AlertDescription>
						</Alert>
					)}

					<Button
						variant="outline"
						className="w-full"
						onClick={handleGitHubLogin}
						disabled={isLoading}
					>
						<Github className="mr-2 size-4" />
						Mit GitHub anmelden
					</Button>
					{/*
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator className="w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">Oder</span>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">E-Mail</Label>
							<Input
								id="email"
								type="email"
								placeholder="max@beispiel.de"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isLoading}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Passwort</Label>
								<Link
									href="/forgot-password"
									className="text-xs text-muted-foreground hover:text-primary"
								>
									Passwort vergessen?
								</Link>
							</div>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isLoading}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Wird angemeldet..." : "Anmelden"}
						</Button>
					</form>
					<CardFooter className="flex flex-col space-y-2">
					<div className="text-sm text-muted-foreground text-center">
						Noch kein Konto?{" "}
						<Link href="/register" className="text-primary hover:underline">
							Registrieren
						</Link>
					</div>
				</CardFooter>
					*/}
				</CardContent>
			</Card>
		</div>
	);
}

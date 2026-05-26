import Link from "next/link";
import { redirect } from "next/navigation";
import { validateAppInvitationToken } from "@/app/actions/invitations";
import { getAuthSession } from "@/lib/auth";
import { RegisterClient } from "./register-client";

function InvalidInvitation({ message }: { message: string }) {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="text-center space-y-3 max-w-sm">
				<h1 className="text-xl font-bold">Einladung ungültig</h1>
				<p className="text-muted-foreground text-sm">{message}</p>
				<Link href="/login" className="text-sm underline">
					Zur Anmeldung
				</Link>
			</div>
		</div>
	);
}

export default async function RegisterPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;

	if (!token?.trim()) {
		return (
			<InvalidInvitation message="Kein Einladungstoken angegeben. Bitte den vollständigen Einladungslink verwenden." />
		);
	}

	const trimmed = token.trim();
	const validation = await validateAppInvitationToken(trimmed);
	if (!validation.valid) {
		return <InvalidInvitation message={validation.error} />;
	}

	const session = await getAuthSession();
	if (session?.user?.id) {
		redirect("/");
	}

	return <RegisterClient token={trimmed} invitedEmail={validation.email} />;
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createAppInvitation, revokeAppInvitation } from "@/app/actions/invitations";

type Invitation = {
	id: string;
	token: string;
	email: string | null;
	status: string;
	expiresAt: string;
	createdAt: string;
	createdBy: string | null;
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
	PENDING:  { label: "Ausstehend", variant: "default" },
	ACCEPTED: { label: "Akzeptiert", variant: "secondary" },
	DECLINED: { label: "Widerrufen", variant: "destructive" },
	EXPIRED:  { label: "Abgelaufen", variant: "outline" },
};

export function AdminInvitationsClient({ invitations: initial }: { invitations: Invitation[] }) {
	const [invitations, setInvitations] = useState(initial);
	const [email, setEmail] = useState("");
	const [isPending, startTransition] = useTransition();
	const [copiedToken, setCopiedToken] = useState<string | null>(null);

	const handleCreate = () => {
		startTransition(async () => {
			try {
				const token = await createAppInvitation(email.trim() || undefined);
				const newInv: Invitation = {
					id: token, // temp id for optimistic update
					token,
					email: email.trim() || null,
					status: "PENDING",
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
					createdAt: new Date().toISOString(),
					createdBy: null,
				};
				setInvitations((prev) => [newInv, ...prev]);
				setEmail("");
				toast.success("Einladung erstellt.");
			} catch {
				toast.error("Fehler beim Erstellen.");
			}
		});
	};

	const handleRevoke = (id: string) => {
		startTransition(async () => {
			try {
				await revokeAppInvitation(id);
				setInvitations((prev) =>
					prev.map((i) => (i.id === id ? { ...i, status: "DECLINED" } : i)),
				);
				toast.success("Einladung widerrufen.");
			} catch {
				toast.error("Fehler.");
			}
		});
	};

	const copyLink = (token: string) => {
		const url = `${window.location.origin}/register?token=${token}`;
		navigator.clipboard.writeText(url);
		setCopiedToken(token);
		toast.success("Link kopiert.");
		setTimeout(() => setCopiedToken(null), 2000);
	};

	return (
		<div className="space-y-6">
			{/* Create new invitation */}
			<div className="flex gap-2">
				<Input
					type="email"
					placeholder="E-Mail optional — leer = offener Einmal-Link"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleCreate()}
				/>
				<Button onClick={handleCreate} disabled={isPending}>
					{isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
					Einladung erstellen
				</Button>
			</div>

			{/* Invitation list */}
			<div className="space-y-3">
				{invitations.map((inv) => {
					const status = STATUS_LABELS[inv.status] ?? { label: inv.status, variant: "outline" as const };
					const isPending = inv.status === "PENDING";

					return (
						<Card key={inv.id}>
							<CardContent className="p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 space-y-1">
										<p className="text-sm font-medium">
											{inv.email ?? "Offener Link (erste Registrierung)"}
										</p>
										<p className="text-xs text-muted-foreground">
											Erstellt {new Date(inv.createdAt).toLocaleDateString("de-DE")} ·
											Läuft ab {new Date(inv.expiresAt).toLocaleDateString("de-DE")}
										</p>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<Badge variant={status.variant} className="text-xs">
											{status.label}
										</Badge>
										{isPending && (
											<>
												<Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyLink(inv.token)}>
													{copiedToken === inv.token ? (
														<span className="text-xs">✓</span>
													) : (
														<Copy className="size-4" />
													)}
												</Button>
												<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRevoke(inv.id)}>
													<X className="size-4" />
												</Button>
											</>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
				{invitations.length === 0 && (
					<p className="text-sm text-muted-foreground py-4">Keine Einladungen vorhanden.</p>
				)}
			</div>
		</div>
	);
}

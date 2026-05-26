/** All configurable platform permissions (stored on AppRole.permissions). */
export const PLATFORM_PERMISSION_KEYS = [
	"platform.admin",
	"workspace.create",
	"invitation.create",
	"workspace.invite",
	"user.manage",
	"role.manage",
] as const;

export type PlatformPermission = (typeof PLATFORM_PERMISSION_KEYS)[number];

export const PLATFORM_PERMISSION_META: Record<
	PlatformPermission,
	{ label: string; description: string }
> = {
	"platform.admin": {
		label: "Plattform-Admin",
		description: "Zugriff auf den Admin-Bereich und alle Admin-Funktionen.",
	},
	"workspace.create": {
		label: "Workspaces erstellen",
		description: "Zusätzliche Workspaces über die Workspace-Übersicht anlegen.",
	},
	"invitation.create": {
		label: "Einladungen erstellen",
		description:
			"Plattform-Einladungslinks und Workspace-Links mit Registrierung für neue App-Nutzer.",
	},
	"workspace.invite": {
		label: "Workspace-Einladungen",
		description:
			"Bestehende App-Nutzer per Workspace-Einladungslink in einen Workspace einladen (ohne Registrierung).",
	},
	"user.manage": {
		label: "Nutzer verwalten",
		description: "Nutzerliste einsehen, Rollen zuweisen, sperren und löschen.",
	},
	"role.manage": {
		label: "Rollen verwalten",
		description: "Rollen anlegen, bearbeiten und Berechtigungen konfigurieren.",
	},
};

export function hasPlatformPermission(
	permissions: readonly string[],
	permission: PlatformPermission,
): boolean {
	if (permissions.includes("platform.admin")) return true;
	return permissions.includes(permission);
}

export function parsePermissions(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	return raw.filter((p): p is string => typeof p === "string");
}

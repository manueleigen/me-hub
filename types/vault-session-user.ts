/**
 * User preference fields on session.user when Better Auth loads the full Prisma User row.
 */
export type VaultSessionUser = {
	id: string;
	darkMode: boolean;
	autoSave: boolean;
};

const VAULT_FIELD_KEYS = ["darkMode", "autoSave"] as const;

/** True when session.user already includes preference fields (no extra DB read needed). */
export function sessionUserHasVaultFields(
	user: Record<string, unknown>,
): user is Record<string, unknown> & VaultSessionUser {
	if (typeof user.id !== "string") return false;
	return VAULT_FIELD_KEYS.every((key) => typeof user[key] === "boolean");
}

export function mapSessionUserToVaultRow(
	user: Record<string, unknown> & { id: string },
): VaultSessionUser {
	return {
		id: user.id,
		darkMode: typeof user.darkMode === "boolean" ? user.darkMode : true,
		autoSave: typeof user.autoSave === "boolean" ? user.autoSave : true,
	};
}

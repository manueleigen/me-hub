"use client";

import * as React from "react";
import { getWorkspaceVaultLinkStatus } from "@/app/actions/workspace-settings";

type VaultLinkContextValue = {
	vaultLinked: boolean;
	settingsHref: string;
	refreshVaultLink: () => Promise<void>;
};

const VaultLinkContext = React.createContext<VaultLinkContextValue>({
	vaultLinked: false,
	settingsHref: "/workspaces",
	refreshVaultLink: async () => {},
});

export function VaultLinkProvider({
	vaultLinked: initialVaultLinked,
	settingsHref: initialSettingsHref,
	workspaceId,
	children,
}: {
	vaultLinked: boolean;
	settingsHref: string;
	workspaceId: string | null;
	children: React.ReactNode;
}) {
	const [status, setStatus] = React.useState({
		vaultLinked: initialVaultLinked,
		settingsHref: initialSettingsHref,
	});

	React.useEffect(() => {
		setStatus({
			vaultLinked: initialVaultLinked,
			settingsHref: initialSettingsHref,
		});
	}, [initialVaultLinked, initialSettingsHref]);

	const refreshVaultLink = React.useCallback(async () => {
		if (!workspaceId) return;
		const next = await getWorkspaceVaultLinkStatus(workspaceId);
		if (next) setStatus(next);
	}, [workspaceId]);

	const value = React.useMemo(
		() => ({ ...status, refreshVaultLink }),
		[status, refreshVaultLink],
	);

	return (
		<VaultLinkContext.Provider value={value}>{children}</VaultLinkContext.Provider>
	);
}

export function useVaultLink(): VaultLinkContextValue {
	return React.useContext(VaultLinkContext);
}

export function useVaultWriteEnabled(): boolean {
	return useVaultLink().vaultLinked;
}

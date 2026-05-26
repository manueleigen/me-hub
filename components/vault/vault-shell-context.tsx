"use client";

import * as React from "react";

const VaultShellContext = React.createContext({ gitHubBase: "" });

export function VaultShellProvider({
	gitHubBase,
	children,
}: {
	gitHubBase: string;
	children: React.ReactNode;
}) {
	return (
		<VaultShellContext.Provider value={{ gitHubBase }}>
			{children}
		</VaultShellContext.Provider>
	);
}

export function useVaultShell() {
	return React.useContext(VaultShellContext);
}

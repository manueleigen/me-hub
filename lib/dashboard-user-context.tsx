"use client";

import * as React from "react";

export type DashboardUser = {
	id: string;
	name: string | null;
	email: string;
	image?: string | null;
	role?: string | null;
	isPlatformAdmin?: boolean;
};

const DashboardUserContext = React.createContext<DashboardUser | null>(null);

export function DashboardUserProvider({
	user,
	children,
}: {
	user: DashboardUser | null;
	children: React.ReactNode;
}) {
	return (
		<DashboardUserContext.Provider value={user}>
			{children}
		</DashboardUserContext.Provider>
	);
}

/** Prefer server-hydrated user (no client /api/auth/get-session on dashboard). */
export function useDashboardUser(): DashboardUser | null {
	return React.useContext(DashboardUserContext);
}

"use client";

import { useSession } from "@/lib/auth-client"; // import the auth client

/**
 * @returns The current user from the session or null if not authenticated.
 */
export function useUser() {
	const {
		data: session,
		isPending, //loading state
		error, //error object
		refetch, //refetch the session
	} = useSession();

	return session?.user;
}

"use client";
import { getGitHubDir } from "@/app/actions/github";
import { useEffect } from "react";

export default function VaultList() {
	useEffect(() => {
		const fetchGitFiles = async () => {
			console.log("[Vault] Fetching directory from GitHub (uses Profil repo settings)…");
			const files = await getGitHubDir();
			if (files) {
				console.log("[Vault] Git repository files:", files);
			} else {
				console.log(
					"[Vault] Could not fetch git files. Check GITHUB_TOKEN and repo permissions.",
				);
			}
		};

		fetchGitFiles();
	}, []);
	return <div>vault-list</div>;
}

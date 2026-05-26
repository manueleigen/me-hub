"use client";
import { getGitHubDir } from "@/app/actions/github";
import { useEffect } from "react";

export default function VaultList() {
	useEffect(() => {
		const fetchGitFiles = async () => {
			await getGitHubDir();
		};

		fetchGitFiles();
	}, []);
	return <div>vault-list</div>;
}

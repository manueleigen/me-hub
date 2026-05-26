"use server";

import { getUserVaultService } from "@/lib/vault/server";
import { requireActiveWorkspaceVaultLinked } from "@/lib/vault/require-vault-linked";

export async function saveVaultFile(path: string, content: string) {
	await requireActiveWorkspaceVaultLinked();
	const svc = await getUserVaultService();
	return svc.saveFile(path, content);
}

export async function createVaultFile(parentPath: string, name: string) {
	await requireActiveWorkspaceVaultLinked();
	const svc = await getUserVaultService();
	return svc.createFile(parentPath, name);
}

export async function createVaultFolder(parentPath: string, name: string) {
	await requireActiveWorkspaceVaultLinked();
	const svc = await getUserVaultService();
	return svc.createFolder(parentPath, name);
}

export async function deleteVaultItem(path: string, type: "file" | "directory") {
	await requireActiveWorkspaceVaultLinked();
	const svc = await getUserVaultService();
	if (type === "directory") return svc.deleteFolder(path);
	return svc.deleteFile(path);
}

export async function renameVaultItem(
	oldPath: string,
	newName: string,
	type: "file" | "directory",
) {
	await requireActiveWorkspaceVaultLinked();
	const svc = await getUserVaultService();
	if (type === "directory") return svc.renameFolder(oldPath, newName);
	return svc.renameFile(oldPath, newName);
}

export async function moveVaultFile(sourcePath: string, targetFolderPath: string) {
	await requireActiveWorkspaceVaultLinked();
	const svc = await getUserVaultService();
	return svc.moveFile(sourcePath, targetFolderPath);
}

export async function duplicateVaultFile(path: string) {
	await requireActiveWorkspaceVaultLinked();
	const svc = await getUserVaultService();
	return svc.duplicateFile(path);
}

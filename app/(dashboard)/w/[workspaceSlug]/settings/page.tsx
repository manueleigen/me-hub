import { redirect } from "next/navigation";

export default async function WorkspaceSettingsIndexPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	redirect(`/w/${workspaceSlug}/settings/general`);
}

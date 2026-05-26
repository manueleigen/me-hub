import { redirect } from "next/navigation";

export default async function WorkspaceMembersRedirectPage({
	params,
}: {
	params: Promise<{ workspaceSlug: string }>;
}) {
	const { workspaceSlug } = await params;
	redirect(`/w/${workspaceSlug}/settings/users`);
}

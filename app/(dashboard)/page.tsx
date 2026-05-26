import { redirect } from "next/navigation";
import { getActiveWorkspaceSlug } from "@/app/actions/workspaces";

export default async function DashboardRootPage() {
	const slug = await getActiveWorkspaceSlug();

	if (slug) {
		redirect(`/w/${slug}`);
	}

	// No workspace found — user has no memberships (edge case: show a fallback)
	redirect("/workspaces");
}

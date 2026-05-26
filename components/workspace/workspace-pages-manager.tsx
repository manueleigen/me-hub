"use client";

import type { WorkspaceNavSectionData, WorkspacePageData } from "@/lib/workspace-context";
import { WorkspacePagesBoard } from "@/components/workspace/settings/pages/workspace-pages-board";

export function WorkspacePagesManager({
	workspaceId,
	workspaceSlug: _workspaceSlug,
	pages,
	sections,
	canEdit,
}: {
	workspaceId: string;
	workspaceSlug: string;
	pages: WorkspacePageData[];
	sections: WorkspaceNavSectionData[];
	canEdit: boolean;
}) {
	return (
		<WorkspacePagesBoard
			workspaceId={workspaceId}
			sections={sections}
			pages={pages}
			canEdit={canEdit}
		/>
	);
}

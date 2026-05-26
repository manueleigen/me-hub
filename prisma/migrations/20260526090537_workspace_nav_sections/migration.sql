-- AlterTable
ALTER TABLE "WorkspacePage" ADD COLUMN     "navSectionId" TEXT;

-- CreateTable
CREATE TABLE "WorkspaceNavSection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkspaceNavSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceNavSection_workspaceId_idx" ON "WorkspaceNavSection"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspacePage_navSectionId_idx" ON "WorkspacePage"("navSectionId");

-- AddForeignKey
ALTER TABLE "WorkspaceNavSection" ADD CONSTRAINT "WorkspaceNavSection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePage" ADD CONSTRAINT "WorkspacePage_navSectionId_fkey" FOREIGN KEY ("navSectionId") REFERENCES "WorkspaceNavSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

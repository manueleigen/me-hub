-- AlterTable
ALTER TABLE "VaultFileMirror" ADD COLUMN "frontmatterJson" TEXT;

-- CreateIndex
CREATE INDEX "VaultFileMirror_userId_path_idx" ON "VaultFileMirror"("userId", "path");

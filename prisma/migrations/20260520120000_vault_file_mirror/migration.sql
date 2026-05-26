-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSyncedSha" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "initialSyncCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "syncLockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VaultFileMirror" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "blobSha" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultFileMirror_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VaultFileMirror_userId_path_key" ON "VaultFileMirror"("userId", "path");

-- CreateIndex
CREATE INDEX "VaultFileMirror_userId_idx" ON "VaultFileMirror"("userId");

-- AddForeignKey
ALTER TABLE "VaultFileMirror" ADD CONSTRAINT "VaultFileMirror_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

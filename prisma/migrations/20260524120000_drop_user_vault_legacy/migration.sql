-- Backfill workspace vault config from owner user where workspace fields are empty
UPDATE "Workspace" w
SET
  "githubSync" = COALESCE(NULLIF(w."githubSync", false), u."githubSync"),
  "vaultGithubOwner" = COALESCE(w."vaultGithubOwner", u."vaultGithubOwner"),
  "vaultGithubRepo" = COALESCE(w."vaultGithubRepo", u."vaultGithubRepo"),
  "vaultGithubBranch" = COALESCE(w."vaultGithubBranch", u."vaultGithubBranch"),
  "lastSyncedSha" = COALESCE(w."lastSyncedSha", u."lastSyncedSha"),
  "lastSyncAt" = COALESCE(w."lastSyncAt", u."lastSyncAt"),
  "lastSyncError" = COALESCE(w."lastSyncError", u."lastSyncError"),
  "initialSyncCompleted" = COALESCE(w."initialSyncCompleted", u."initialSyncCompleted"),
  "syncLockedUntil" = COALESCE(w."syncLockedUntil", u."syncLockedUntil")
FROM "User" u
WHERE w."ownerId" = u."id"
  AND w."type" = 'PERSONAL'
  AND (
    w."vaultGithubOwner" IS NULL
    OR w."vaultGithubRepo" IS NULL
    OR w."initialSyncCompleted" = false
  )
  AND (
    u."vaultGithubOwner" IS NOT NULL
    OR u."githubSync" = true
    OR u."initialSyncCompleted" = true
  );

-- Copy any remaining user mirror rows into workspace mirrors (personal workspace per owner)
INSERT INTO "WorkspaceFileMirror" ("id", "workspaceId", "path", "content", "frontmatterJson", "blobSha", "updatedAt")
SELECT
  md5(m."id" || w."id"),
  w."id",
  m."path",
  m."content",
  m."frontmatterJson",
  m."blobSha",
  m."updatedAt"
FROM "VaultFileMirror" m
INNER JOIN "User" u ON u."id" = m."userId"
INNER JOIN "Workspace" w ON w."ownerId" = u."id" AND w."type" = 'PERSONAL'
ON CONFLICT ("workspaceId", "path") DO NOTHING;

DROP TABLE IF EXISTS "VaultFileMirror";

ALTER TABLE "User" DROP COLUMN IF EXISTS "githubSync";
ALTER TABLE "User" DROP COLUMN IF EXISTS "vaultGithubOwner";
ALTER TABLE "User" DROP COLUMN IF EXISTS "vaultGithubRepo";
ALTER TABLE "User" DROP COLUMN IF EXISTS "vaultGithubBranch";
ALTER TABLE "User" DROP COLUMN IF EXISTS "lastSyncedSha";
ALTER TABLE "User" DROP COLUMN IF EXISTS "lastSyncAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "lastSyncError";
ALTER TABLE "User" DROP COLUMN IF EXISTS "initialSyncCompleted";
ALTER TABLE "User" DROP COLUMN IF EXISTS "syncLockedUntil";

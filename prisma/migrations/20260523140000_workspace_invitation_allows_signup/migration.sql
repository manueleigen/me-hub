-- Workspace invite links: distinguish member-only vs signup-enabled
ALTER TABLE "WorkspaceInvitation" ADD COLUMN "allowsSignup" BOOLEAN NOT NULL DEFAULT false;

-- Default user role: may invite existing users to workspaces
UPDATE "AppRole"
SET "permissions" = ARRAY(
  SELECT DISTINCT unnest("permissions" || ARRAY['workspace.invite']::text[])
)
WHERE "key" = 'user';

-- Admin role: include workspace.invite if missing
UPDATE "AppRole"
SET "permissions" = ARRAY(
  SELECT DISTINCT unnest("permissions" || ARRAY['workspace.invite']::text[])
)
WHERE "key" = 'admin';

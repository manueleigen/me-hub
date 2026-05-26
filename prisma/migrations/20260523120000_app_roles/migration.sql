-- CreateTable
CREATE TABLE "AppRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppRole_key_key" ON "AppRole"("key");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "appRoleId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_appRoleId_fkey" FOREIGN KEY ("appRoleId") REFERENCES "AppRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default roles
INSERT INTO "AppRole" ("id", "key", "label", "description", "permissions", "isSystem", "createdAt", "updatedAt")
VALUES
  (
    'role_user',
    'user',
    'Nutzer',
    'Standardrolle: ein persönlicher Workspace bei Registrierung, keine weiteren Workspaces.',
    ARRAY[]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'role_admin',
    'admin',
    'Administrator',
    'Voller Zugriff auf Plattform-Verwaltung.',
    ARRAY['platform.admin', 'workspace.create', 'invitation.create', 'user.manage', 'role.manage']::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

-- Assign roles to existing users
UPDATE "User" SET "appRoleId" = 'role_admin' WHERE "role" = 'admin';
UPDATE "User" SET "appRoleId" = 'role_user' WHERE "appRoleId" IS NULL;

-- Platform settings singleton (if missing)
INSERT INTO "PlatformSettings" ("id", "usersCanCreateWorkspaces", "updatedAt")
VALUES ('singleton', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

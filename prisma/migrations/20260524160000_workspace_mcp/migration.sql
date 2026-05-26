-- Workspace MCP access (API key per workspace)
ALTER TABLE "Workspace" ADD COLUMN "mcpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Workspace" ADD COLUMN "mcpApiKeyHash" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "mcpApiKeyPrefix" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "mcpLastUsedAt" TIMESTAMP(3);

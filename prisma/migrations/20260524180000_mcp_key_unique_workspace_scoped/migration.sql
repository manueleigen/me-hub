-- One API key hash globally; prevents ambiguous lookup across workspaces
CREATE UNIQUE INDEX "Workspace_mcpApiKeyHash_key" ON "Workspace"("mcpApiKeyHash");

/**
 * Forwards GitHub webhooks from smee.io to the local Next.js API route.
 *
 * 1. GitHub webhook Payload URL: https://smee.io/me-hub-vault-git-sync
 * 2. Terminal A: npm run dev
 * 3. Terminal B: npm run dev:smee
 */
import "dotenv/config";
import SmeeClient from "smee-client";

const source =
	process.env.SMEE_SOURCE_URL?.trim() ??
	"https://smee.io/me-hub-vault-git-sync";

const target =
	process.env.SMEE_TARGET_URL?.trim() ??
	"http://localhost:3000/api/webhook/github";

const smee = new SmeeClient({
	source,
	target,
	logger: console,
});

console.info("[smee] Forwarding GitHub webhooks");
console.info(`[smee]   source: ${source}`);
console.info(`[smee]   target: ${target}`);
console.info(
	"[smee] Ensure GITHUB_WEBHOOK_SECRET in .env matches the secret in GitHub → Webhooks",
);

async function main() {
	await smee.start();

	const shutdown = async () => {
		console.info("[smee] Stopping…");
		await smee.stop();
		process.exit(0);
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

void main();

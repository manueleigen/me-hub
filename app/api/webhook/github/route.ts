import { after } from "next/server";
import { NextResponse } from "next/server";
import {
	parseGitHubPushPayload,
	parsePushBranch,
	syncVaultMirrorForGitHubPush,
	verifyGitHubWebhookSignature,
} from "@/lib/sync/github-webhook";
import { isDuplicateGitHubDelivery } from "@/lib/sync/webhook-delivery-dedupe";

export const runtime = "nodejs";

/** Health check — curl http://localhost:3000/api/webhook/github */
export async function GET() {
	return NextResponse.json({
		ok: true,
		hint: "POST push events from GitHub or smee-client (npm run dev:smee)",
	});
}

/**
 * GitHub repository webhook (Push events).
 * Configure in repo: Settings → Webhooks → Payload URL → this route, event "push".
 *
 * Env: GITHUB_WEBHOOK_SECRET (same as webhook secret in GitHub UI)
 */
export async function POST(request: Request) {
	const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
	if (!secret) {
		console.error("[vault-sync] webhook rejected: GITHUB_WEBHOOK_SECRET not set");
		return NextResponse.json(
			{ error: "Webhook secret not configured" },
			{ status: 503 },
		);
	}

	const rawBody = await request.text();
	const signature = request.headers.get("x-hub-signature-256");
	const event = request.headers.get("x-github-event");

	if (!verifyGitHubWebhookSignature(rawBody, signature, secret)) {
		console.warn(
			"[vault-sync] webhook rejected: invalid signature (check GITHUB_WEBHOOK_SECRET matches GitHub webhook secret)",
		);
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	const deliveryId = request.headers.get("x-github-delivery");
	if (isDuplicateGitHubDelivery(deliveryId)) {
		return NextResponse.json(
			{ ok: true, duplicateDelivery: true, skipped: true },
			{ status: 202 },
		);
	}

	if (event !== "push") {
		return NextResponse.json({ ok: true, skipped: `event:${event ?? "unknown"}` });
	}

	let json: unknown;
	try {
		json = JSON.parse(rawBody) as unknown;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const payload = parseGitHubPushPayload(json);
	if (!payload) {
		return NextResponse.json({ error: "Invalid push payload" }, { status: 400 });
	}

	const branch = parsePushBranch(payload.ref);
	if (!branch) {
		return NextResponse.json({ ok: true, skipped: "non-branch-ref" });
	}

	const owner = payload.repository.owner.login;
	const repo = payload.repository.name;

	console.info(
		`[vault-sync] webhook push ${owner}/${repo}@${branch} — scheduling mirror sync`,
	);

	after(() => {
		void (async () => {
			try {
				const outcome = await syncVaultMirrorForGitHubPush(owner, repo, branch);
				console.info(
					`[vault-sync] webhook sync done ${owner}/${repo}@${branch} workspaces=${outcome.workspaceIds.length}`,
				);
				for (const { workspaceId, result } of outcome.results) {
					console.info(`[vault-sync] webhook workspace=${workspaceId.slice(0, 8)}… ${result.status}`);
				}
			} catch (error) {
				console.error("[vault-sync] webhook sync failed:", error);
			}
		})();
	});

	return NextResponse.json(
		{
			ok: true,
			queued: true,
			repository: `${owner}/${repo}`,
			branch,
		},
		{ status: 202 },
	);
}

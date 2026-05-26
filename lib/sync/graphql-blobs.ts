import type { Octokit } from "octokit";
import { fetchNoStore } from "@/lib/github/octokit";

const CHUNK_SIZE = 20;
/** Parallel GraphQL batch requests (stay low to avoid rate limits). */
const GRAPHQL_CONCURRENCY = 3;

function escapeGraphQLString(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export type BlobFetchResult = {
	path: string;
	text: string;
	oid?: string;
};

async function fetchBlobChunk(
	octokit: Octokit,
	owner: string,
	repo: string,
	commitSha: string,
	chunk: string[],
): Promise<BlobFetchResult[]> {
	const fields = chunk
		.map((path, index) => {
			const expr = `${commitSha}:${path}`;
			return `f${index}: object(expression: "${escapeGraphQLString(expr)}") {
          ... on Blob { oid text }
        }`;
		})
		.join("\n");

	const query = `
      query VaultBlobBatch($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          ${fields}
        }
      }
    `;

	const response = (await octokit.graphql(query, {
		owner,
		name: repo,
		request: { fetch: fetchNoStore },
	})) as { repository?: Record<string, { text?: string | null; oid?: string } | null> };

	const repoData = response.repository ?? {};
	const chunkResults: BlobFetchResult[] = [];
	chunk.forEach((path, index) => {
		const blob = repoData[`f${index}`];
		if (!blob) return;
		if (blob.text == null) {
			console.warn(`[sync] Blob text null for ${path}, skipping`);
			return;
		}
		chunkResults.push({ path, text: blob.text, oid: blob.oid });
	});
	return chunkResults;
}

export async function fetchBlobTextsAtCommit(
	octokit: Octokit,
	owner: string,
	repo: string,
	commitSha: string,
	paths: string[],
): Promise<BlobFetchResult[]> {
	if (paths.length === 0) return [];

	const chunks: string[][] = [];
	for (let i = 0; i < paths.length; i += CHUNK_SIZE) {
		chunks.push(paths.slice(i, i + CHUNK_SIZE));
	}

	const results: BlobFetchResult[] = [];
	for (let i = 0; i < chunks.length; i += GRAPHQL_CONCURRENCY) {
		const batch = chunks.slice(i, i + GRAPHQL_CONCURRENCY);
		const batchResults = await Promise.all(
			batch.map((chunk) => fetchBlobChunk(octokit, owner, repo, commitSha, chunk)),
		);
		for (const part of batchResults) {
			results.push(...part);
		}
	}

	return results;
}

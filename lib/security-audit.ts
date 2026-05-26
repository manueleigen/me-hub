/**
 * Structured security events for operator log shipping (no PII beyond ids).
 * Not a full audit DB — stdout JSON for aggregators.
 */
export type SecurityAuditPayload = {
	action: string;
	actorUserId: string;
	workspaceId: string;
	meta?: Record<string, string | number | boolean | null>;
};

export function logSecurityAuditEvent(payload: SecurityAuditPayload): void {
	const line = JSON.stringify({
		type: "mehub_security_audit",
		at: new Date().toISOString(),
		...payload,
	});
	// eslint-disable-next-line no-console -- intentional audit stream
	console.info(line);
}

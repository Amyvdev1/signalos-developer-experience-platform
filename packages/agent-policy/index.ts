import { createHash } from "node:crypto";
import { z } from "zod";
import type { Decision, Policy } from "../shared/types.ts";
export const paymentArgs = z
  .object({ amount: z.number().int().min(1).max(1000000) })
  .strict();
export function fingerprint(args: unknown, policy: Policy): string {
  return createHash("sha256")
    .update(JSON.stringify({ args: paymentArgs.parse(args), policy }))
    .digest("hex");
}
export function evaluate(
  args: unknown,
  role: string,
  scopes: string[],
  policy: Policy,
): Decision {
  const parsed = paymentArgs.safeParse(args),
    fp = parsed.success ? fingerprint(parsed.data, policy) : "invalid";
  const result = (
    decision: Decision["decision"],
    reason: string,
  ): Decision => ({
    decision,
    reason,
    risk: "write",
    policyVersion: policy.version,
    fingerprint: fp,
  });
  if (!parsed.success) return result("denied", "invalid_tool_arguments");
  if (role !== policy.allowedRole) return result("denied", "insufficient_role");
  if (!scopes.includes(policy.requiredScope))
    return result("denied", "insufficient_scope");
  if (parsed.data.amount > policy.maxAmount)
    return result("denied", "amount_exceeds_policy_limit");
  return policy.requiresConfirmation
    ? result("requires_confirmation", "financial_side_effect")
    : result("allowed", "policy_allows_action");
}
export function validateApproval(
  args: unknown,
  policy: Policy,
  expected: string,
  expires: string,
  now = Date.now(),
): void {
  if (!Number.isFinite(Date.parse(expires)) || now >= Date.parse(expires))
    throw new Error("approval_expired");
  if (fingerprint(args, policy) !== expected)
    throw new Error("approval_binding_mismatch");
}

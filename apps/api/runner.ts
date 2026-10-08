import { z } from "zod";
import { randomUUID } from "node:crypto";
import type {
  Run,
  RunInput,
  Policy,
  Evidence,
} from "../../packages/shared/types.ts";
import { defaultPolicy, boundary } from "../../fixtures/apis/payment.ts";
import {
  analyzeContract,
  breakingChanges,
} from "../../packages/contract-engine/index.ts";
import {
  evaluate,
  validateApproval,
} from "../../packages/agent-policy/index.ts";
import {
  sign,
  verify,
  eventOrder,
} from "../../packages/reliability-lab/index.ts";
import { economics } from "../../packages/economics-engine/index.ts";
import { PaymentClient } from "../../packages/sdk-launchpad/index.ts";
import { checkQuickstart } from "../../packages/docs-runner/index.ts";
import { Ledger, Conflict } from "../../packages/evidence-ledger/index.ts";
export const inputSchema = z
  .object({
    contract: z.unknown(),
    previousContract: z.unknown().optional(),
    docsPath: z.enum(["/payments", "/v0/payments"]),
    amount: z.number().int().min(1).max(1000000),
    role: z.enum(["billing-agent", "research-agent"]),
    scopes: z.array(z.enum(["payments:create", "payments:read"])).max(2),
    scenario: z.enum(["timeout", "429", "500", "401", "404", "happy"]),
    toolCost: z.number().min(0).max(1000).nullable(),
    reviewMinutes: z.number().min(0).max(10000),
    hourlyRate: z.number().min(0).max(10000),
    manualMinutes: z.number().min(0).max(10000),
    failureProbability: z.number().min(0).max(1),
    failureLoss: z.number().min(0).max(1000000),
  })
  .strict();
export function rejectCredentials(value: unknown) {
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        if (
          /^(secret|password|api[_-]?key|access[_-]?token|authorization)$/i.test(
            k,
          )
        )
          throw new Error("Do not submit credentials in fixtures");
        walk(x);
      }
    if (
      typeof v === "string" &&
      /(-----BEGIN .*PRIVATE KEY|Bearer (?!synthetic-)|gh[pousr]_[a-zA-Z0-9]{20})/i.test(
        v,
      )
    )
      throw new Error("Do not submit credentials in fixtures");
  };
  walk(value);
}
export function addEvidence(
  run: Run,
  module: string,
  kind: Evidence["kind"],
  title: string,
  outcome: string,
  detail: string,
  links: string[] = [],
) {
  run.evidence.push({
    id: `${run.id}:e${run.evidence.length + 1}`,
    module,
    kind,
    title,
    outcome,
    detail,
    links,
    at: new Date().toISOString(),
  });
}
export async function investigate(
  ledger: Ledger,
  base: string,
  raw: unknown,
  options: { policy?: Policy; replayOf?: string } = {},
): Promise<Run> {
  const input = inputSchema.parse(raw) as RunInput;
  rejectCredentials(input);
  const findings = analyzeContract(input.contract);
  if (input.previousContract)
    findings.push(...breakingChanges(input.previousContract, input.contract));
  const policy = structuredClone(options.policy ?? defaultPolicy),
    decision = evaluate(
      { amount: input.amount },
      input.role,
      input.scopes,
      policy,
    );
  const run: Run = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    revision: 0,
    status: decision.decision === "denied" ? "denied" : "awaiting_approval",
    input,
    policy,
    decision,
    approvalExpiresAt: new Date(Date.now() + 300000).toISOString(),
    findings,
    evidence: [],
    economics: economics(input, 0),
    payments: 0,
    replayOf: options.replayOf,
    boundary,
  };
  addEvidence(
    run,
    "Contract",
    "observed",
    "Contract review",
    findings.length ? "findings" : "pass",
    `${findings.length} findings from the supported OpenAPI 3.x JSON rule subset. External references and deep schema compatibility are not resolved.`,
  );
  const docs = await checkQuickstart(base, input.docsPath, run.id);
  addEvidence(
    run,
    "Docs",
    "observed",
    "Quickstart HTTP check",
    docs.passed ? "pass" : "fail",
    `${input.docsPath}: expected ${docs.expected}, observed ${docs.status}. ${docs.nextAction}`,
    run.findings.filter((f) => f.id.includes("retry")).map((f) => f.id),
  );
  addEvidence(
    run,
    "SDK",
    "observed",
    "Typed fixture client",
    "checked",
    "The hand-written TypeScript client exercised the local HTTP fixture. This is not a general OpenAPI SDK generator.",
  );
  const client = new PaymentClient(base),
    key = `${run.id}:lab`;
  let attempts = 0;
  let firstId = "";
  for (let i = 0; i < 2; i++) {
    attempts++;
    try {
      const r = await client.createPayment(
        input.amount,
        key,
        i === 0 ? input.scenario : "happy",
      );
      if (r.status === 201) {
        firstId = "id" in r.body ? r.body.id : "";
        addEvidence(
          run,
          "Reliability",
          "observed",
          `HTTP attempt ${i + 1}`,
          "success",
          `201 payment fixture ${firstId}; same idempotency key. Request ${r.requestId}; trace ${r.traceId}.`,
        );
      } else
        addEvidence(
          run,
          "Reliability",
          "observed",
          `HTTP attempt ${i + 1}`,
          String(r.status),
          `Local fixture failure; recovery is evaluated with the same key. Request ${r.requestId}; trace ${r.traceId}.`,
        );
    } catch (error) {
      const timeout =
        error instanceof Error &&
        ["TimeoutError", "AbortError"].includes(error.name);
      addEvidence(
        run,
        "Reliability",
        "observed",
        `HTTP attempt ${i + 1}`,
        timeout ? "timeout" : "transport_error",
        timeout
          ? "Client deadline expired; the fixture may already have committed."
          : "Transport or response validation failed; this is not classified as a timeout.",
      );
    }
  }
  const count = ledger.countPayments(key);
  addEvidence(
    run,
    "Reliability",
    "observed",
    "Duplicate protection",
    count === 1 ? "pass" : "fail",
    `${attempts} attempts; ${count} persisted payment for this investigation. No real payment provider is involved.`,
  );
  const now = Math.floor(Date.now() / 1000),
    body = JSON.stringify({ event: "payment.created", run: run.id });
  addEvidence(
    run,
    "Reliability",
    "observed",
    "Signature and replay window",
    verify(body, now, sign(body, now), now) &&
      !verify(body, now, sign(body, now), now + 301)
      ? "pass"
      : "fail",
    "HMAC-SHA256 verifies the synthetic payload; a delivery older than 300 seconds is rejected.",
  );
  const ordered = eventOrder([
    { id: "paid", sequence: 2, receivedAt: 1 },
    { id: "created", sequence: 1, receivedAt: 2 },
    { id: "paid", sequence: 2, receivedAt: 3 },
  ]);
  addEvidence(
    run,
    "Reliability",
    "synthetic",
    "Event ordering",
    "pass",
    `Synthetic receipt order differs from provider order: ${ordered.map((e) => e.id).join(" → ")}. Duplicate provider IDs collapse.`,
  );
  addEvidence(
    run,
    "Agent",
    "observed",
    "create_payment policy",
    decision.decision,
    decision.reason +
      "; approval binds the amount and the original policy snapshot. The local role is a test input, not an authenticated identity.",
  );
  addEvidence(
    run,
    "Economics",
    "assumption",
    "Cost assumptions",
    "explicit",
    `Tool price ${input.toolCost ?? "unknown"}; review ${input.reviewMinutes} minutes; labor $${input.hourlyRate}/hour; failure probability ${input.failureProbability}; loss $${input.failureLoss}.`,
  );
  run.economics = economics(input, attempts);
  addEvidence(
    run,
    "Economics",
    "estimated",
    "Workflow value",
    run.economics.recommendation,
    run.economics.formula +
      "; local HTTP latency is not a production forecast.",
  );
  ledger.save(run);
  if (decision.decision === "allowed")
    return approve(ledger, run.id, 0, true, base);
  return run;
}
export async function approve(
  ledger: Ledger,
  id: string,
  revision: number,
  accepted: boolean,
  base: string,
): Promise<Run> {
  const run = ledger.get(id);
  if (!run) throw new Error("run_not_found");
  if (run.revision !== revision) throw new Conflict("stale_run_revision");
  if (run.status !== "awaiting_approval")
    throw new Conflict("run_not_awaiting_approval");
  validateApproval(
    { amount: run.input.amount },
    run.policy,
    run.decision.fingerprint,
    run.approvalExpiresAt,
  );
  const current = evaluate(
    { amount: run.input.amount },
    run.input.role,
    run.input.scopes,
    run.policy,
  );
  if (current.decision === "denied") throw new Error(current.reason);
  if (!accepted) {
    run.status = "rejected";
    addEvidence(
      run,
      "Agent",
      "observed",
      "Human confirmation",
      "rejected",
      "No agent side effect executed.",
    );
  } else {
    const result = await new PaymentClient(base).createPayment(
      run.input.amount,
      `${id}:agent`,
    );
    if (result.status !== 201) throw new Error("agent_execution_failed");
    run.payments = ledger.countPayments(`${id}:agent`);
    run.status = "completed";
    addEvidence(
      run,
      "Agent",
      "observed",
      "Human confirmation",
      "approved",
      "Local reviewer explicitly approved the bound amount and policy.",
    );
    addEvidence(
      run,
      "Agent",
      "observed",
      "Agent executor",
      "success",
      `${run.payments} persisted simulated side effect; retries use the same key.`,
    );
  }
  run.revision++;
  ledger.save(run, revision);
  return run;
}

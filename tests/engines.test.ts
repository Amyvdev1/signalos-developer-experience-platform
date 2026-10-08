import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeContract,
  breakingChanges,
} from "../packages/contract-engine/index.ts";
import {
  weakContract,
  strongContract,
  defaultPolicy,
  defaultInput,
} from "../fixtures/apis/payment.ts";
import {
  evaluate,
  validateApproval,
  fingerprint,
} from "../packages/agent-policy/index.ts";
import { sign, verify, eventOrder } from "../packages/reliability-lab/index.ts";
import { economics } from "../packages/economics-engine/index.ts";
import { Ledger, Conflict } from "../packages/evidence-ledger/index.ts";
import { PaymentClient } from "../packages/sdk-launchpad/index.ts";
test("weak contract identifies actionable 429, retry, auth and idempotency gaps", () => {
  const f = analyzeContract(weakContract);
  for (const id of ["429-schema", "retry", "auth", "idempotency"])
    assert.ok(f.some((v) => v.id.endsWith(id)));
  assert.ok(f.every((v) => v.nextAction.length > 15));
});
test("repaired contract removes the supported readiness gaps", () =>
  assert.equal(analyzeContract(strongContract).length, 0));
test("invalid contracts are rejected instead of earning a passing score", () =>
  assert.throws(() => analyzeContract({ paths: {} })));
test("version comparison identifies removed operations", () =>
  assert.ok(
    breakingChanges(strongContract, { ...strongContract, paths: {} }).some(
      (f) => f.message === "Operation removed",
    ),
  ));
test("response removal and SDK method rename are breaking changes", () => {
  const changed = structuredClone(strongContract);
  delete (changed.paths["/payments"].post.responses as Record<string, unknown>)[
    "429"
  ];
  changed.paths["/payments"].post.operationId = "pay";
  const f = breakingChanges(strongContract, changed);
  assert.ok(f.some((v) => v.message === "Response 429 removed"));
  assert.ok(f.some((v) => v.message === "SDK operationId changed"));
});
const policyCases: [string, unknown, string, string[], string][] = [
  [
    "financial side effect",
    { amount: 10 },
    "billing-agent",
    ["payments:create"],
    "requires_confirmation",
  ],
  [
    "wrong role",
    { amount: 10 },
    "research-agent",
    ["payments:create"],
    "denied",
  ],
  ["missing scope", { amount: 10 }, "billing-agent", [], "denied"],
  [
    "budget exceeded",
    { amount: 501 },
    "billing-agent",
    ["payments:create"],
    "denied",
  ],
  [
    "invalid amount",
    { amount: -1 },
    "billing-agent",
    ["payments:create"],
    "denied",
  ],
  [
    "unknown argument",
    { amount: 10, deleteAll: true },
    "billing-agent",
    ["payments:create"],
    "denied",
  ],
  ["missing arguments", {}, "billing-agent", ["payments:create"], "denied"],
  [
    "boundary amount",
    { amount: 500 },
    "billing-agent",
    ["payments:create"],
    "requires_confirmation",
  ],
  [
    "non numeric",
    { amount: "10" },
    "billing-agent",
    ["payments:create"],
    "denied",
  ],
  [
    "fractional amount",
    { amount: 1.5 },
    "billing-agent",
    ["payments:create"],
    "denied",
  ],
];
for (const [name, args, role, scopes, expected] of policyCases)
  test(`policy: ${name}`, () => {
    const d = evaluate(args, role, scopes, defaultPolicy);
    assert.equal(d.decision, expected);
    assert.ok(d.reason);
    assert.equal(d.policyVersion, "payments-v1");
    assert.equal(d.risk, "write");
  });
test("explicit no-confirmation policy allows valid fixture action", () =>
  assert.equal(
    evaluate({ amount: 10 }, "billing-agent", ["payments:create"], {
      ...defaultPolicy,
      requiresConfirmation: false,
    }).decision,
    "allowed",
  ));
test("approval expires at exact boundary", () =>
  assert.throws(
    () =>
      validateApproval(
        { amount: 10 },
        defaultPolicy,
        fingerprint({ amount: 10 }, defaultPolicy),
        new Date(1000).toISOString(),
        1000,
      ),
    /approval_expired/,
  ));
test("changed arguments invalidate approval", () =>
  assert.throws(
    () =>
      validateApproval(
        { amount: 11 },
        defaultPolicy,
        fingerprint({ amount: 10 }, defaultPolicy),
        new Date(2000).toISOString(),
        1000,
      ),
    /binding/,
  ));
test("changed policy invalidates approval", () =>
  assert.throws(
    () =>
      validateApproval(
        { amount: 10 },
        { ...defaultPolicy, version: "v2" },
        fingerprint({ amount: 10 }, defaultPolicy),
        new Date(2000).toISOString(),
        1000,
      ),
    /binding/,
  ));
test("HMAC authenticates exact bytes and rejects tampering", () => {
  assert.ok(verify("fixture", 1000, sign("fixture", 1000), 1000));
  assert.ok(!verify("changed", 1000, sign("fixture", 1000), 1000));
  assert.ok(!verify("fixture", 1000, "zz", 1000));
});
test("replay windows reject stale and future deliveries", () => {
  for (const now of [699, 1301])
    assert.ok(!verify("fixture", 1000, sign("fixture", 1000), now));
  assert.ok(verify("fixture", 1000, sign("fixture", 1000), 1300));
});
test("duplicate delivery permutations preserve exactly one logical event", () => {
  for (let count = 1; count < 50; count++) {
    const events = Array.from({ length: count }, (_, i) => ({
      id: "same",
      sequence: 1,
      receivedAt: i,
    }));
    assert.equal(eventOrder(events).length, 1);
  }
});
test("out-of-order receipt is distinct from logical order", () =>
  assert.deepEqual(
    eventOrder([
      { id: "b", sequence: 2, receivedAt: 0 },
      { id: "a", sequence: 1, receivedAt: 1 },
    ]).map((e) => e.id),
    ["a", "b"],
  ));
test("conflicting event IDs are rejected", () =>
  assert.throws(
    () =>
      eventOrder([
        { id: "a", sequence: 1, receivedAt: 0 },
        { id: "a", sequence: 2, receivedAt: 1 },
      ]),
    /conflicting/,
  ));
test("unknown costs remain unknown and block recommendations", () => {
  const r = economics({ ...defaultInput, toolCost: null }, 2);
  assert.equal(r.total, null);
  assert.equal(r.savings, null);
  assert.match(r.recommendation, /missing/);
});
test("risk-adjusted cost includes attempts, review and expected failure loss", () => {
  const r = economics(defaultInput, 2);
  assert.ok(Math.abs(r.total! - (0.04 + (2 * 40) / 60 + 0.03 * 12)) < 1e-10);
});
test("zero manual cost never produces a false savings recommendation", () =>
  assert.equal(
    economics({ ...defaultInput, manualMinutes: 0 }, 2).recommendation,
    "Do not automate yet",
  ));
test("duplicate payment keys are stable and conflicting reuse fails", () => {
  const ledger = new Ledger();
  try {
    const a = ledger.payment("demo", 125);
    for (let i = 0; i < 20; i++)
      assert.equal(ledger.payment("demo", 125).id, a.id);
    assert.equal(ledger.countPayments("demo"), 1);
    assert.throws(() => ledger.payment("demo", 126), Conflict);
  } finally {
    ledger.close();
  }
});
test("SDK cannot contact external or non-HTTP endpoints", () => {
  assert.throws(() => new PaymentClient("https://example.com"));
  assert.throws(() => new PaymentClient("http://192.168.0.1"));
});
test("offline SDK transport validates success and preserves structured failures", async () => {
  const success: typeof fetch = async () =>
    new Response(
      JSON.stringify({ id: "fixture_one", amount: 125, duplicate: false }),
      { status: 201 },
    );
  assert.equal(
    (
      await new PaymentClient("http://127.0.0.1:4320", success).createPayment(
        125,
        "demo",
      )
    ).status,
    201,
  );
  const denied: typeof fetch = async () =>
    new Response(JSON.stringify({ error: { code: "FIXTURE_429" } }), {
      status: 429,
    });
  const result = await new PaymentClient(
    "http://127.0.0.1:4320",
    denied,
  ).createPayment(125, "demo");
  assert.equal(result.status, 429);
  assert.ok("error" in result.body);
});
test("malformed SDK success never becomes a typed successful payment", async () => {
  const malformed: typeof fetch = async () =>
    new Response(JSON.stringify({ id: 123 }), { status: 201 });
  await assert.rejects(
    new PaymentClient("http://127.0.0.1:4320", malformed).createPayment(
      125,
      "demo",
    ),
  );
});
test("malformed approval expiry fails closed", () =>
  assert.throws(
    () =>
      validateApproval(
        { amount: 1 },
        defaultPolicy,
        fingerprint({ amount: 1 }, defaultPolicy),
        "not-a-date",
      ),
    /approval_expired/,
  ));

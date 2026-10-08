import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "../apps/api/main.ts";
import { defaultInput } from "../fixtures/apis/payment.ts";
import { markdown, html, csv } from "../packages/report-renderer/index.ts";
import type { Run } from "../packages/shared/types.ts";
import { rejectCredentials } from "../apps/api/runner.ts";
async function launch(file = ":memory:") {
  const app = createApplication(file);
  await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
  const address = app.server.address();
  if (!address || typeof address === "string") throw new Error("address");
  const base = `http://127.0.0.1:${address.port}`;
  const post = (path: string, body: unknown) =>
    fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  return { ...app, base, post };
}
test("end-to-end timeout, approval, immutable replay and all report formats", async () => {
  const app = await launch();
  try {
    const response = await app.post("/api/runs", defaultInput);
    assert.equal(response.status, 201);
    const run = (await response.json()) as Run;
    assert.equal(run.status, "awaiting_approval");
    assert.equal(run.payments, 0);
    assert.equal(app.ledger.countPayments(`${run.id}:agent`), 0);
    assert.ok(run.evidence.some((e) => e.outcome === "timeout"));
    assert.equal(app.ledger.countPayments(`${run.id}:lab`), 1);
    assert.ok(
      run.evidence.some((e) => e.module === "Docs" && e.outcome === "fail"),
    );
    assert.ok(run.findings.some((f) => f.id.endsWith("429-schema")));
    const approved = await app.post(`/api/runs/${run.id}/approval`, {
      revision: 0,
      accepted: true,
    });
    assert.equal(approved.status, 200);
    const done = (await approved.json()) as Run;
    assert.equal(done.payments, 1);
    assert.equal(done.status, "completed");
    assert.equal(
      (
        await app.post(`/api/runs/${run.id}/approval`, {
          revision: 0,
          accepted: true,
        })
      ).status,
      409,
    );
    assert.equal(app.ledger.countPayments(`${run.id}:agent`), 1);
    const replay = (await (
      await app.post(`/api/runs/${run.id}/replay`, { policyMode: "stricter" })
    ).json()) as Run;
    assert.equal(replay.status, "denied");
    assert.equal(replay.policy.version, "payments-v2-strict");
    assert.equal(replay.replayOf, run.id);
    assert.equal(app.ledger.countPayments(`${replay.id}:agent`), 0);
    assert.equal(app.ledger.get(run.id)?.status, "completed");
    for (const format of ["json", "markdown", "html", "csv"]) {
      const r = await fetch(
        `${app.base}/api/export?id=${run.id}&format=${format}`,
      );
      assert.equal(r.status, 200);
      assert.ok((await r.text()).includes(run.id));
    }
    assert.match(markdown(done), /Local reviewer explicitly approved/);
    assert.match(markdown(done), /assumptions, not measured savings/);
    assert.match(csv(done), /observed/);
    assert.ok(
      !html({ ...done, boundary: "<script>alert(1)</script>" }).includes(
        "<script>",
      ),
    );
    assert.equal(
      (await fetch(app.base + "/api/export?id=missing")).status,
      404,
    );
  } finally {
    await app.close();
  }
});
for (const scenario of ["happy", "429", "500", "401", "404"] as const)
  test(`HTTP fixture scenario ${scenario}: recovery persists one operation`, async () => {
    const app = await launch();
    try {
      const r = await app.post("/api/runs", {
        ...defaultInput,
        scenario,
        docsPath: "/payments",
      });
      assert.equal(r.status, 201);
      const run = (await r.json()) as Run;
      assert.equal(app.ledger.countPayments(`${run.id}:lab`), 1);
      assert.ok(
        run.evidence.some((e) => e.module === "Docs" && e.outcome === "pass"),
      );
      if (scenario !== "happy")
        assert.ok(run.evidence.some((e) => e.outcome === scenario));
    } finally {
      await app.close();
    }
  });
test("denied role and rejected approval never execute agent side effects", async () => {
  const app = await launch();
  try {
    const denied = (await (
      await app.post("/api/runs", { ...defaultInput, role: "research-agent" })
    ).json()) as Run;
    assert.equal(denied.status, "denied");
    assert.equal(app.ledger.countPayments(denied.id + ":agent"), 0);
    const run = (await (
      await app.post("/api/runs", defaultInput)
    ).json()) as Run;
    const rejected = (await (
      await app.post(`/api/runs/${run.id}/approval`, {
        revision: 0,
        accepted: false,
      })
    ).json()) as Run;
    assert.equal(rejected.status, "rejected");
    assert.equal(app.ledger.countPayments(run.id + ":agent"), 0);
  } finally {
    await app.close();
  }
});
test("persistence and migration survive server reopening", async () => {
  const dir = mkdtempSync(join(tmpdir(), "signalos-"));
  const file = join(dir, "ledger.sqlite");
  let app = await launch(file);
  try {
    const run = (await (
      await app.post("/api/runs", defaultInput)
    ).json()) as Run;
    await app.close();
    app = await launch(file);
    assert.equal(app.ledger.get(run.id)?.decision.policyVersion, "payments-v1");
    assert.equal(app.ledger.countPayments(run.id + ":lab"), 1);
    assert.equal(
      app.ledger.db.prepare("SELECT count(*) n FROM migrations").get()?.n,
      1,
    );
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("invalid inputs, credentials and cross-origin mutations fail closed", async () => {
  const app = await launch();
  try {
    assert.equal(
      (await app.post("/api/runs", { ...defaultInput, amount: -1 })).status,
      400,
    );
    assert.equal(
      (
        await app.post("/api/runs", {
          ...defaultInput,
          contract: { secret: "sensitive" },
        })
      ).status,
      400,
    );
    const origin = await fetch(app.base + "/api/runs", {
      method: "POST",
      headers: {
        Origin: "https://example.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(defaultInput),
    });
    assert.equal(origin.status, 403);
    assert.equal(app.ledger.list().length, 0);
    assert.equal(
      (
        await fetch(app.base + "/api/fixture/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"amount":1}',
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await fetch(app.base + "/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        })
      ).status,
      400,
    );
  } finally {
    await app.close();
  }
});
test("report redacts no credentials because known credential fields are rejected at intake", () => {
  for (const key of [
    "secret",
    "password",
    "api_key",
    "accessToken",
    "authorization",
  ])
    assert.throws(() => rejectCredentials({ [key]: "credential" }));
});
test("expired approval fails without executing the pending side effect", async () => {
  const app = await launch();
  try {
    const run = (await (
      await app.post("/api/runs", defaultInput)
    ).json()) as Run;
    run.approvalExpiresAt = "2000-01-01T00:00:00.000Z";
    app.ledger.save(run, 0);
    const result = await app.post(`/api/runs/${run.id}/approval`, {
      revision: 0,
      accepted: true,
    });
    assert.equal(result.status, 400);
    assert.equal(app.ledger.countPayments(run.id + ":agent"), 0);
  } finally {
    await app.close();
  }
});
test("unknown estimates and input snapshot survive export", async () => {
  const app = await launch();
  try {
    const run = (await (
      await app.post("/api/runs", { ...defaultInput, toolCost: null })
    ).json()) as Run;
    assert.equal(run.economics.total, null);
    const report = await (
      await fetch(`${app.base}/api/export?id=${run.id}&format=markdown`)
    ).text();
    assert.match(report, /Total: unknown/);
    assert.match(report, /Tool price unknown/);
    assert.match(report, /\[estimated\]/);
    assert.match(report, /\[assumption\]/);
  } finally {
    await app.close();
  }
});

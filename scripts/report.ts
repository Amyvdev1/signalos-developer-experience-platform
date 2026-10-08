import { createApplication } from "../apps/api/main.ts";
import { defaultInput } from "../fixtures/apis/payment.ts";
import { mkdirSync, writeFileSync } from "node:fs";
import type { Run } from "../packages/shared/types.ts";
const app = createApplication();
await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
const address = app.server.address();
if (!address || typeof address === "string") throw new Error("address");
const base = `http://127.0.0.1:${address.port}`;
try {
  const response = await fetch(base + "/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(defaultInput),
  });
  if (!response.ok) throw new Error("Investigation failed");
  const run = (await response.json()) as Run;
  mkdirSync("output", { recursive: true });
  for (const format of ["json", "markdown", "html", "csv"]) {
    const r = await fetch(`${base}/api/export?id=${run.id}&format=${format}`);
    if (!r.ok) throw new Error("Export failed");
    writeFileSync(
      `output/evidence.${format === "markdown" ? "md" : format}`,
      await r.text(),
    );
  }
  console.log(
    "Reports written to output/. The agent remains awaiting a human approval.",
  );
} finally {
  await app.close();
}

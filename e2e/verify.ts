import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { createApplication } from "../apps/api/main.ts";
const app = createApplication();
await new Promise<void>((r) => app.server.listen(0, "127.0.0.1", r));
const address = app.server.address();
if (!address || typeof address === "string") throw new Error("address");
const base = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();
mkdirSync("docs/screenshots", { recursive: true });
try {
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page
      .getByRole("button", { name: "Run launch investigation" })
      .click();
    await page.getByRole("status").waitFor();
    assert.equal(await page.getByRole("alert").count(), 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `docs/screenshots/${width === 1440 ? "desktop" : "mobile"}.png`,
    });
    assert.ok(
      await page
        .getByRole("button", { name: "Approve fixture action" })
        .count(),
    );
    await page.getByRole("button", { name: "Approve fixture action" }).click();
    await page.getByRole("status").waitFor();
    await page.getByText("completed", { exact: true }).first().waitFor();
    await page.reload();
    await page.getByText("completed", { exact: true }).first().waitFor();
    for (const name of [
      "Contract",
      "Reliability",
      "Agent controls",
      "Economics",
      "Evidence",
    ]) {
      await page
        .getByRole("button", { name: new RegExp(name + "$") })
        .first()
        .click();
      assert.ok(
        !(await page
          .locator("body")
          .evaluate((e) => e.scrollWidth > innerWidth + 2)),
      );
    }
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "MARKDOWN ↓" }).click();
    assert.ok((await download).suggestedFilename().endsWith(".md"));
    await page.getByRole("button", { name: "Compare stricter policy" }).click();
    await page.getByRole("status").waitFor();
    await page.getByText("denied", { exact: true }).first().waitFor();
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.close();
    console.log(
      `PASS browser ${width}: investigation, approval, reload, views, export, policy replay`,
    );
  }
} finally {
  await browser.close();
  await app.close();
}

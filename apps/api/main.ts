import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Ledger, Conflict } from "../../packages/evidence-ledger/index.ts";
import { paymentArgs } from "../../packages/agent-policy/index.ts";
import { investigate, approve } from "./runner.ts";
import { defaultInput, defaultPolicy } from "../../fixtures/apis/payment.ts";
import { markdown, html, csv } from "../../packages/report-renderer/index.ts";
const root = resolve(import.meta.dirname, "../../");
export function createApplication(database = ":memory:") {
  const ledger = new Ledger(database);
  const server = http.createServer(async (req, res) => {
    const requestId = randomUUID();
    const requestedTrace = req.headers["x-trace-id"];
    const traceId =
      typeof requestedTrace === "string" &&
      /^[a-f0-9-]{36}$/.test(requestedTrace)
        ? requestedTrace
        : requestId;
    res.setHeader("X-Request-ID", requestId);
    res.setHeader("X-Trace-ID", traceId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    const send = (status: number, data: unknown) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(data));
    };
    try {
      const host = req.headers.host ?? "";
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host))
        return send(403, { error: { code: "HOST_DENIED" } });
      const base = `http://${host}`;
      if (req.headers.origin && req.headers.origin !== base)
        return send(403, { error: { code: "ORIGIN_DENIED" } });
      const url = new URL(req.url ?? "/", base);
      let body: unknown;
      if (req.method === "POST") {
        if (!req.headers["content-type"]?.startsWith("application/json"))
          return send(415, { error: { code: "JSON_REQUIRED" } });
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 131072)
            return send(413, { error: { code: "BODY_TOO_LARGE" } });
        }
        try {
          body = JSON.parse(raw);
        } catch {
          return send(400, { error: { code: "INVALID_JSON" } });
        }
      }
      if (req.method === "GET" && url.pathname === "/api/health")
        return send(200, { status: "ok", mode: "local-fixture" });
      if (req.method === "GET" && url.pathname === "/api/workspace")
        return send(200, {
          input: defaultInput,
          policy: defaultPolicy,
          runs: ledger.list(),
        });
      if (req.method === "POST" && url.pathname.startsWith("/api/fixture/")) {
        if (req.headers.authorization !== "Bearer synthetic-demo")
          return send(401, { error: { code: "INVALID_DEMO_AUTH" } });
        if (url.pathname !== "/api/fixture/payments")
          return send(404, { error: { code: "ENDPOINT_NOT_FOUND" } });
        const args = paymentArgs.parse(body),
          key = z
            .string()
            .min(1)
            .max(120)
            .parse(req.headers["idempotency-key"]);
        const scenario = req.headers["x-fixture-scenario"];
        const attempt = ledger.attempt(key);
        if (
          attempt === 1 &&
          ["429", "500", "401", "404"].includes(String(scenario))
        ) {
          if (scenario === "429") res.setHeader("Retry-After", "1");
          return send(Number(scenario), {
            error: { code: `FIXTURE_${scenario}` },
          });
        }
        const payment = ledger.payment(key, args.amount);
        if (scenario === "timeout" && attempt === 1)
          await new Promise((r) => setTimeout(r, 600));
        if (!res.destroyed) return send(201, payment);
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/runs")
        return send(201, await investigate(ledger, base, body));
      const action = url.pathname.match(
        /^\/api\/runs\/([a-f0-9-]+)\/(approval|replay)$/,
      );
      if (req.method === "POST" && action) {
        const previous = ledger.get(action[1]);
        if (!previous) return send(404, { error: { code: "RUN_NOT_FOUND" } });
        if (action[2] === "approval") {
          const data = z
            .object({
              revision: z.number().int().min(0),
              accepted: z.boolean(),
            })
            .strict()
            .parse(body);
          return send(
            200,
            await approve(
              ledger,
              action[1],
              data.revision,
              data.accepted,
              base,
            ),
          );
        }
        const data = z
          .object({ policyMode: z.enum(["original", "stricter"]) })
          .strict()
          .parse(body);
        return send(
          201,
          await investigate(ledger, base, previous.input, {
            replayOf: previous.id,
            policy:
              data.policyMode === "original"
                ? previous.policy
                : {
                    ...previous.policy,
                    version: "payments-v2-strict",
                    maxAmount: 50,
                  },
          }),
        );
      }
      if (req.method === "GET" && url.pathname === "/api/export") {
        const run = ledger.get(url.searchParams.get("id") ?? "");
        if (!run) return send(404, { error: { code: "RUN_NOT_FOUND" } });
        const format = url.searchParams.get("format") ?? "json";
        if (!["json", "markdown", "html", "csv"].includes(format))
          return send(400, { error: { code: "FORMAT_NOT_SUPPORTED" } });
        const out =
          format === "markdown"
            ? markdown(run)
            : format === "html"
              ? html(run)
              : format === "csv"
                ? csv(run)
                : JSON.stringify(run, null, 2);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="signalos-${run.id}.${format === "markdown" ? "md" : format}"`,
        );
        res.writeHead(200, {
          "Content-Type":
            format === "json"
              ? "application/json"
              : format === "html"
                ? "text/html; charset=utf-8"
                : format === "csv"
                  ? "text/csv; charset=utf-8"
                  : "text/markdown; charset=utf-8",
        });
        return res.end(out);
      }
      if (url.pathname.startsWith("/api/"))
        return send(404, { error: { code: "NOT_FOUND" } });
      if (req.method !== "GET")
        return send(405, { error: { code: "METHOD_NOT_ALLOWED" } });
      const dist = resolve(root, "dist");
      let file = resolve(dist, "." + decodeURIComponent(url.pathname));
      if (!file.startsWith(dist + sep)) file = resolve(dist, "index.html");
      if (!existsSync(file) || extname(file) === "")
        file = resolve(dist, "index.html");
      if (!existsSync(file))
        return send(503, {
          error: {
            code: "BUILD_REQUIRED",
            message: "Run npm run build first.",
          },
        });
      res.writeHead(200, {
        "Content-Type":
          (
            {
              ".html": "text/html",
              ".js": "application/javascript",
              ".css": "text/css",
              ".png": "image/png",
            } as Record<string, string>
          )[extname(file)] ?? "application/octet-stream",
      });
      res.end(readFileSync(file));
    } catch (error) {
      const status =
        error instanceof Conflict
          ? 409
          : error instanceof z.ZodError
            ? 400
            : error instanceof Error &&
                [
                  "approval_expired",
                  "approval_binding_mismatch",
                  "Do not submit credentials in fixtures",
                ].includes(error.message)
              ? 400
              : 500;
      send(status, {
        error: {
          code:
            status === 500
              ? "INTERNAL_ERROR"
              : error instanceof Error
                ? error.message
                : "INVALID_REQUEST",
        },
      });
    }
  });
  server.requestTimeout = 10000;
  return {
    server,
    ledger,
    async close() {
      await new Promise<void>((r) => server.close(() => r()));
      ledger.close();
    },
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const port = z.coerce
    .number()
    .int()
    .min(1024)
    .max(65535)
    .parse(process.env.PORT ?? 4320);
  const app = createApplication(
    process.env.DATABASE_PATH ?? resolve(root, "data/signalos.sqlite"),
  );
  app.server.listen(port, "127.0.0.1", () =>
    console.log(`SignalOS: http://127.0.0.1:${port}`),
  );
  process.on("SIGINT", () => void app.close());
  process.on("SIGTERM", () => void app.close());
}

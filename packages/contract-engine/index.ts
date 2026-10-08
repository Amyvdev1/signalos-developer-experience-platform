import { z } from "zod";
import type { Finding } from "../shared/types.ts";
const operation = z
  .object({
    operationId: z.string().optional(),
    description: z.string().optional(),
    security: z.array(z.unknown()).optional(),
    parameters: z
      .array(
        z
          .object({
            name: z.string(),
            in: z.string(),
            required: z.boolean().optional(),
          })
          .passthrough(),
      )
      .optional(),
    requestBody: z.unknown().optional(),
    responses: z.record(z.string(), z.unknown()),
  })
  .passthrough();
const contractSchema = z
  .object({
    openapi: z.string().regex(/^3\./),
    info: z.object({ title: z.string(), version: z.string() }),
    security: z.array(z.unknown()).optional(),
    paths: z.record(z.string(), z.record(z.string(), z.unknown())),
  })
  .passthrough();
export function analyzeContract(value: unknown): Finding[] {
  const doc = contractSchema.parse(value),
    findings: Finding[] = [],
    ids = new Set<string>();
  for (const [path, methods] of Object.entries(doc.paths))
    for (const [method, value] of Object.entries(methods)) {
      if (
        !["get", "post", "put", "patch", "delete", "head", "options"].includes(
          method,
        )
      )
        continue;
      const op = operation.parse(value),
        key = `${method.toUpperCase()} ${path}`;
      const add = (
        id: string,
        message: string,
        nextAction: string,
        severity: "high" | "medium" = "high",
      ) =>
        findings.push({
          id: `${key}:${id}`,
          operation: key,
          severity,
          message,
          nextAction,
        });
      if (!op.operationId || ids.has(op.operationId))
        add(
          "operation-id",
          "Missing or duplicate operationId",
          "Assign a stable unique SDK method name.",
        );
      if (op.operationId) ids.add(op.operationId);
      if (!(op.security ?? doc.security)?.length)
        add(
          "auth",
          "No authentication requirement declared",
          "Declare the intended security scheme; public access must be intentional.",
        );
      const limit = op.responses["429"] as
        | { content?: unknown; headers?: Record<string, unknown> }
        | undefined;
      if (!limit?.content)
        add(
          "429-schema",
          "429 response has no response schema",
          "Document a structured rate-limit error response.",
        );
      if (
        !limit?.headers?.["Retry-After"] ||
        !/retry/i.test(op.description ?? "")
      )
        add(
          "retry",
          "Retry behavior is incomplete",
          "Describe Retry-After and when retry is safe.",
        );
      if (
        ["post", "put", "patch", "delete"].includes(method) &&
        !op.parameters?.some(
          (p) =>
            p.in === "header" &&
            p.name.toLowerCase() === "idempotency-key" &&
            p.required,
        )
      )
        add(
          "idempotency",
          "Required idempotency guidance is missing",
          "Require Idempotency-Key and document conflict handling.",
        );
      if (!op.responses["401"] || !op.responses["500"])
        add(
          "error-coverage",
          "Authentication or server failure response is undocumented",
          "Document 401 and 500 response schemas.",
          "medium",
        );
    }
  return findings;
}
export function breakingChanges(before: unknown, after: unknown): Finding[] {
  const old = contractSchema.parse(before),
    next = contractSchema.parse(after),
    findings: Finding[] = [];
  for (const [path, methods] of Object.entries(old.paths))
    for (const [method, value] of Object.entries(methods)) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
      const prior = operation.parse(value),
        candidate = next.paths[path]?.[method];
      const add = (id: string, message: string) =>
        findings.push({
          id: `${path}:${method}:${id}`,
          operation: `${method.toUpperCase()} ${path}`,
          severity: "high",
          message,
          nextAction:
            "Review compatibility before releasing the changed contract.",
        });
      if (!candidate) {
        add("removed", "Operation removed");
        continue;
      }
      const current = operation.parse(candidate);
      for (const code of Object.keys(prior.responses))
        if (!current.responses[code])
          add(`response-${code}`, `Response ${code} removed`);
      if (prior.operationId !== current.operationId)
        add("method-renamed", "SDK operationId changed");
      for (const p of current.parameters ?? [])
        if (
          p.required &&
          !prior.parameters?.some(
            (q) => q.in === p.in && q.name === p.name && q.required,
          )
        )
          add(`required-${p.name}`, `New required parameter ${p.name}`);
    }
  return findings;
}

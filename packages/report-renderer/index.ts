import type { Run } from "../shared/types.ts";
export function markdown(run: Run) {
  return `# SignalOS evidence report\n\nRun: ${run.id}\nStatus: ${run.status}\nPolicy: ${run.policy.version}\nReplay of: ${run.replayOf ?? "none"}\n\n## Evidence boundary\n\n${run.boundary}\n\n## Contract findings\n\n${run.findings.map((f) => `- **${f.severity} / ${f.operation}**: ${f.message} Next: ${f.nextAction}`).join("\n") || "No findings in the supported rule subset."}\n\n## Timeline\n\n${run.evidence.map((e) => `- [${e.kind}] **${e.module}: ${e.title}** — ${e.outcome}. ${e.detail} Evidence: ${e.id}; linked findings: ${e.links.join(", ") || "none"}`).join("\n")}\n\n## Estimated economics\n\nFormula: ${run.economics.formula}\nTotal: ${run.economics.total ?? "unknown"}\nManual baseline: ${run.economics.manual}\nSavings: ${run.economics.savings ?? "unknown"}\nRecommendation: ${run.economics.recommendation}\n\nInputs are assumptions, not measured savings. Human review is an explicit local action; no reviewer identity verification is implemented.\n`;
}
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function html(run: Run) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>SignalOS evidence</title><style>body{background:#101923;color:#e6edf2;font:16px/1.7 system-ui;max-width:1000px;margin:40px auto;padding:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>SignalOS / Evidence report</h1><pre>${escape(markdown(run))}</pre></html>`;
}
export function csv(run: Run) {
  const cell = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  return (
    "id,module,kind,title,outcome,detail\n" +
    run.evidence
      .map((e) =>
        [e.id, e.module, e.kind, e.title, e.outcome, e.detail]
          .map(cell)
          .join(","),
      )
      .join("\n")
  );
}

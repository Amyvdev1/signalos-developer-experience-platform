import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { Run, RunInput, Policy } from "../../packages/shared/types.ts";
import "./style.css";
type Workspace = { input: RunInput; policy: Policy; runs: Run[] };
async function request<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(
    path,
    body === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.code ?? "Request failed");
  return data as T;
}
const money = (v: number | null) =>
  v === null
    ? "Unknown"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 3,
      }).format(v);
function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null),
    [form, setForm] = useState<RunInput | null>(null),
    [contract, setContract] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("Evidence"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const load = async () => {
    const data = await request<Workspace>("/api/workspace");
    setWorkspace(data);
    if (!form) {
      setForm(data.input);
      setContract(JSON.stringify(data.input.contract, null, 2));
    }
    return data;
  };
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, []);
  const run =
    workspace?.runs.find((r) => r.id === selected) ?? workspace?.runs[0];
  const act = async (path: string, body: unknown) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request<Run>(path, body);
      await load();
      setSelected(result.id);
      setNotice("Evidence saved to the local ledger.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  };
  const field = (key: keyof RunInput, value: unknown) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const start = () => {
    try {
      if (form)
        void act("/api/runs", { ...form, contract: JSON.parse(contract) });
    } catch {
      setError("Contract must be valid OpenAPI JSON.");
    }
  };
  if (!workspace || !form)
    return (
      <main className="loading">
        <h1>SignalOS</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              onClick={() => void load().catch((e) => setError(e.message))}
            >
              Retry workspace
            </button>
          </>
        ) : (
          <p role="status">Opening your local evidence workspace…</p>
        )}
      </main>
    );
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="SignalOS home">
          <span className="brand-mark">S</span>Signal<span>OS</span>
        </a>
        <p className="small-label">DEVELOPER EXPERIENCE RELIABILITY</p>
        <div className="workspace-name">
          <span className="dot" /> Payments / launch review
        </div>
        <nav aria-label="Evidence views">
          {[
            "Evidence",
            "Contract",
            "Reliability",
            "Agent controls",
            "Economics",
          ].map((name, i) => (
            <button
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              <span>0{i + 1}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>LOCAL WORKSPACE</p>
          <b>Real checks. Synthetic domain.</b>
          <small>
            Loopback API · SQLite ledger
            <br />
            No money moves. No live AI runs.
          </small>
          <a
            href="https://github.com/Amyvdev1/signalos-developer-experience-platform"
            target="_blank"
            rel="noreferrer"
          >
            Inspect source ↗
          </a>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>WORKSPACE / PAYMENTS</span>
          <span>
            <i className="dot" /> LOCAL · PERSISTENT
          </span>
        </header>
        <section className="hero">
          <div>
            <p className="eyebrow">CONTRACT → RECOVERY → DECISION</p>
            <h1>
              Every action leaves
              <br />
              <em>a signal.</em>
            </h1>
            <p>
              Investigate a payment launch. Follow the contract gaps, reproduce
              the failure, inspect the approval boundary—and carry the evidence
              into one report.
            </p>
          </div>
          <div className="hero-symbol" aria-hidden="true">
            <div className="ring r1" />
            <div className="ring r2" />
            <div className="ring r3" />
            <span>
              DX
              <br />
              <small>INSPECTABLE</small>
            </span>
          </div>
        </section>
        <div className="boundary">
          LOCAL EVIDENCE / HTTP checks and persistence are observed. Agent
          behavior is simulated. Economics are estimated.
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        <div className="workspace-grid">
          <section className="panel configuration">
            <div className="panel-heading">
              <span>01 / LAUNCH CONFIGURATION</span>
              <b>Control the experiment</b>
            </div>
            <label>
              Payment amount (USD)
              <input
                type="number"
                min="1"
                max="1000000"
                value={form.amount}
                onChange={(e) => field("amount", Number(e.target.value))}
              />
            </label>
            <div className="form-row">
              <label>
                Failure scenario
                <select
                  value={form.scenario}
                  onChange={(e) => field("scenario", e.target.value)}
                >
                  {["timeout", "429", "500", "401", "404", "happy"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Quickstart endpoint
                <select
                  value={form.docsPath}
                  onChange={(e) => field("docsPath", e.target.value)}
                >
                  <option value="/v0/payments">/v0/payments (stale)</option>
                  <option value="/payments">/payments (current)</option>
                </select>
              </label>
            </div>
            <label>
              Simulated agent role
              <select
                value={form.role}
                onChange={(e) => field("role", e.target.value)}
              >
                <option>billing-agent</option>
                <option>research-agent</option>
              </select>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.scopes.includes("payments:create")}
                onChange={(e) =>
                  field("scopes", e.target.checked ? ["payments:create"] : [])
                }
              />{" "}
              Grant payments:create fixture scope
            </label>
            <details>
              <summary>Contract JSON · inspect / edit</summary>
              <label>
                OpenAPI contract
                <textarea
                  spellCheck={false}
                  rows={12}
                  value={contract}
                  onChange={(e) => setContract(e.target.value)}
                />
              </label>
              <p className="muted">
                OpenAPI 3.x JSON subset. No external $ref resolution. Do not
                paste credentials.
              </p>
            </details>
            <details>
              <summary>Economic assumptions</summary>
              <div className="form-row">
                {(
                  [
                    "toolCost",
                    "reviewMinutes",
                    "hourlyRate",
                    "manualMinutes",
                    "failureProbability",
                    "failureLoss",
                  ] as const
                ).map((k) => (
                  <label key={k}>
                    {
                      (
                        {
                          toolCost: "Tool cost / attempt",
                          reviewMinutes: "Review minutes",
                          hourlyRate: "Hourly labor rate",
                          manualMinutes: "Manual baseline minutes",
                          failureProbability: "Failure probability (0–1)",
                          failureLoss: "Loss per failure",
                        } as Record<string, string>
                      )[k]
                    }
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={k === "toolCost" && form.toolCost === null}
                      value={form[k] ?? ""}
                      onChange={(e) => field(k, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.toolCost === null}
                  onChange={(e) =>
                    field("toolCost", e.target.checked ? null : 0.02)
                  }
                />{" "}
                Tool cost is unknown
              </label>
            </details>
            <button className="primary" onClick={start} disabled={busy}>
              {busy ? "Running local checks…" : "Run launch investigation"}
              <span>↗</span>
            </button>
            <p className="muted">
              A run creates only fixture records. An agent side effect requires
              a separate approval.
            </p>
          </section>
          <section className="results">
            <div className="result-top">
              <div>
                <p className="eyebrow">02 / {tab.toUpperCase()}</p>
                <h2>
                  {run ? "Follow the evidence." : "Ready for the first signal."}
                </h2>
              </div>
              {run && (
                <span className={`status ${run.status}`}>
                  {run.status.replaceAll("_", " ")}
                </span>
              )}
            </div>
            {!run ? (
              <div className="empty">
                <span>◎</span>
                <h3>One scenario. Connected proof.</h3>
                <p>
                  Run the launch investigation to see contract findings, two
                  HTTP attempts, duplicate prevention, cryptographic checks,
                  agent policy, and estimated value in one timeline.
                </p>
              </div>
            ) : (
              <>
                <div className="metrics">
                  <article>
                    <span>Contract findings</span>
                    <b>{run.findings.length.toString().padStart(2, "0")}</b>
                    <small>Observed rule checks</small>
                  </article>
                  <article>
                    <span>Agent side effects</span>
                    <b>{run.payments}</b>
                    <small>Persisted fixture operations</small>
                  </article>
                  <article>
                    <span>Estimated cost</span>
                    <b>{money(run.economics.total)}</b>
                    <small>Assumptions included</small>
                  </article>
                </div>
                {tab === "Contract" ? (
                  <div className="findings">
                    {run.findings.length ? (
                      run.findings.map((f) => (
                        <article className="finding" key={f.id}>
                          <span>
                            {f.severity} / {f.operation}
                          </span>
                          <h3>{f.message}</h3>
                          <p>{f.nextAction}</p>
                          <small>{f.id}</small>
                        </article>
                      ))
                    ) : (
                      <p>No findings in the supported rule subset.</p>
                    )}
                  </div>
                ) : tab === "Agent controls" ? (
                  <div className="panel decision">
                    <p className="eyebrow">POLICY / {run.policy.version}</p>
                    <h3>{run.decision.decision.replaceAll("_", " ")}</h3>
                    <p>{run.decision.reason}</p>
                    <dl>
                      <dt>Risk</dt>
                      <dd>Write · financial side effect</dd>
                      <dt>Bound amount</dt>
                      <dd>${run.input.amount}</dd>
                      <dt>Allowed role</dt>
                      <dd>{run.policy.allowedRole}</dd>
                      <dt>Limit</dt>
                      <dd>${run.policy.maxAmount}</dd>
                      <dt>Approval expiry</dt>
                      <dd>
                        {new Date(run.approvalExpiresAt).toLocaleTimeString()}
                      </dd>
                    </dl>
                    <p className="muted">
                      Approvals bind arguments and policy. Local review is
                      explicit but does not authenticate a reviewer.
                    </p>
                  </div>
                ) : tab === "Economics" ? (
                  <div className="panel decision">
                    <p className="eyebrow">FORECAST / NOT MEASURED SAVINGS</p>
                    <h3>{run.economics.recommendation}</h3>
                    <p className="formula">{run.economics.formula}</p>
                    <dl>
                      <dt>Manual baseline</dt>
                      <dd>{money(run.economics.manual)}</dd>
                      <dt>Risk-adjusted savings</dt>
                      <dd>{money(run.economics.savings)}</dd>
                    </dl>
                    <pre>
                      {JSON.stringify(
                        {
                          toolCost: run.input.toolCost,
                          reviewMinutes: run.input.reviewMinutes,
                          hourlyRate: run.input.hourlyRate,
                          manualMinutes: run.input.manualMinutes,
                          failureProbability: run.input.failureProbability,
                          failureLoss: run.input.failureLoss,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                ) : (
                  <div className="timeline">
                    {run.evidence
                      .filter(
                        (e) =>
                          tab !== "Reliability" || e.module === "Reliability",
                      )
                      .map((e, i) => (
                        <article key={e.id}>
                          <span className="timeline-number">
                            {(i + 1).toString().padStart(2, "0")}
                          </span>
                          <div>
                            <div className="event-meta">
                              <span>
                                {e.module} / {e.kind}
                              </span>
                              <b>{e.outcome.replaceAll("_", " ")}</b>
                            </div>
                            <h3>{e.title}</h3>
                            <p>{e.detail}</p>
                            <small>{e.id}</small>
                          </div>
                        </article>
                      ))}
                  </div>
                )}
                {run.status === "awaiting_approval" && (
                  <section className="approval">
                    <div>
                      <p className="eyebrow">HUMAN CHECKPOINT</p>
                      <h3>Approve create_payment · ${run.input.amount}?</h3>
                      <p>
                        Policy {run.policy.version}. This creates a simulated
                        local payment only.
                      </p>
                    </div>
                    <div>
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() =>
                          void act(`/api/runs/${run.id}/approval`, {
                            revision: run.revision,
                            accepted: true,
                          })
                        }
                      >
                        Approve fixture action
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(`/api/runs/${run.id}/approval`, {
                            revision: run.revision,
                            accepted: false,
                          })
                        }
                      >
                        Reject action
                      </button>
                    </div>
                  </section>
                )}
                <section className="report-tools">
                  <div>
                    <p className="eyebrow">TAKE THE EVIDENCE WITH YOU</p>
                    <div className="exports">
                      {["markdown", "json", "html", "csv"].map((format) => (
                        <a
                          key={format}
                          href={`/api/export?id=${run.id}&format=${format}`}
                        >
                          {format.toUpperCase()} ↓
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="replay">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(`/api/runs/${run.id}/replay`, {
                          policyMode: "original",
                        })
                      }
                    >
                      Replay original policy
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(`/api/runs/${run.id}/replay`, {
                          policyMode: "stricter",
                        })
                      }
                    >
                      Compare stricter policy
                    </button>
                  </div>
                </section>
                <p className="muted">
                  Replay creates a new investigation with new fixture IDs. The
                  original run and policy remain intact.
                </p>
              </>
            )}
          </section>
        </div>
        <section className="history panel">
          <div className="panel-heading">
            <span>03 / PERSISTENT RUN HISTORY</span>
            <b>{workspace.runs.length} investigations</b>
          </div>
          {workspace.runs.length ? (
            <div className="history-grid">
              {workspace.runs.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  aria-pressed={run?.id === r.id}
                >
                  <span>{r.id.slice(0, 8)}</span>
                  <b>{r.status.replaceAll("_", " ")}</b>
                  <small>
                    {r.policy.version} ·{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">
              Your investigations will appear here after the first run.
            </p>
          )}
        </section>
        <footer>
          SignalOS / Built by Amy Villa{" "}
          <span>Contract · Reliability · Agent controls · Evidence</span>
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

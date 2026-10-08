# SignalOS — The Developer Experience Reliability Platform

## Flagship portfolio project for Amy Villa

### One-line description

> **SignalOS is an inspectable platform that helps API teams design, test, document, secure, observe, and improve the complete developer journey—from the first request to safe AI-agent execution and measurable recovery.**

## Why this is the right mega project

A recruiter usually wants to see several things at once:

- Can you build a real full-stack system?

- Can you work with APIs and SDKs?

- Can you understand failures and recovery?

- Can you write documentation that developers can follow?

- Can you think about AI agents beyond prompting?

- Can you use tests and CI instead of making unsupported claims?

- Can you connect technical decisions to product and business outcomes?

- Can you explain the system to engineers, product people, and users?

- Can you work independently and make good scope decisions?

SignalOS is designed to make all of those capabilities visible in one coherent product.

It should not be presented as “an enterprise production platform.” It should be presented as:

> **A portfolio-scale, locally runnable developer-experience reliability platform with reproducible fixtures, deterministic evaluations, and clearly documented evidence boundaries.**

That description is ambitious but honest.

---

# 1. The product problem

API teams often have separate tools for:

- validating an OpenAPI contract;

- generating an SDK;

- writing documentation;

- monitoring integrations;

- testing webhooks;

- evaluating AI-agent tools;

- collecting developer feedback;

- measuring onboarding;

- estimating automation value.

The problem is that these tools rarely share one evidence model.

A team might know that an API specification is valid, but not whether a developer can recover from a `429`. It might have a generated SDK, but no proof that the examples work. It might have an AI tool schema, but no policy or confirmation boundary. It might have onboarding analytics, but no connection to the documentation version that caused the friction.

SignalOS connects these layers through a single concept:

> **Every developer-facing claim should be linked to a contract, test, fixture, run, decision, or explicit assumption.**

---

# 2. The complete reviewer journey

A recruiter or technical reviewer should be able to clone the repository and follow this path:

1. Start the local platform with one command.

1. Open the sample API workspace.

1. Inspect the API contract scorecard.

1. Compare a good and bad OpenAPI version.

1. Generate a TypeScript client and run its examples.

1. Open the documentation quality report.

1. Run the onboarding journey.

1. Trigger a webhook failure.

1. Inspect signature verification, retry, idempotency, and event ordering.

1. Ask the simulated AI agent to call a read-only tool.

1. Attempt a destructive tool call and observe the confirmation gate.

1. Review the audit timeline and replay the decision.

1. View the synthetic cost and human-review report.

1. Export a Markdown evidence report.

1. Run the same verification through GitHub Actions.

This is the product demo and the interview story.

---

# 3. Product modules

## Module A — Contract Observatory

This is the evolution of DX Orbit.

### Capabilities

- import OpenAPI 3.x JSON or YAML;

- score clarity, recovery, auth, SDK readiness, eventing, and agent readiness;

- detect missing examples and error schemas;

- check operation IDs;

- check pagination and rate-limit documentation;

- check idempotency guidance;

- identify ambiguous side effects;

- compare two contract versions;

- detect breaking changes;

- generate Markdown, JSON, and HTML reports;

- create a GitHub PR comment in CI mode.

### Example finding

```json
{
  "rule": "error-response-contract",
  "severity": "high",
  "operation": "POST /payments",
  "finding": "The 429 response has no documented schema or retry guidance.",
  "next_action": "Document the response body, Retry-After behavior, and safe retry conditions."
}
```

## Module B — SDK Launchpad

This is the evolution of HookForge SDK.

### Capabilities

- generate or load a small TypeScript client;

- show the source OpenAPI commit;

- run offline mock-transport tests;

- run local HTTP checks;

- show generated method examples;

- track contract-to-SDK drift;

- produce a release checklist;

- show breaking changes between SDK versions;

- export cURL, Python, and JavaScript examples.

### Evidence it demonstrates

- API contract literacy;

- TypeScript;

- SDK design;

- versioning;

- compatibility;

- release engineering;

- documentation quality.

## Module C — Documentation Workbench

This is the evolution of DocsTest.

### Capabilities

- import a Markdown tutorial;

- extract code blocks;

- validate referenced files and commands;

- check environment variables;

- verify links;

- execute safe examples against a local mock API;

- compare expected and actual output;

- flag stale or contradictory examples;

- generate a documentation QA report.

### Example report

```
Documentation check: quickstart.md

PASS  Prerequisites are listed
PASS  API key variable appears in .env.example
FAIL  Step 4 calls /v1/events but the fixture exposes /v1/webhooks
WARN  Response example does not include requestId
NEXT  Update the endpoint and add a recovery example
```

## Module D — Reliability Lab

This combines MailTrace and APIReplay Studio.

### Capabilities

- create an integration trace;

- expose request ID, trace ID, and event ID;

- verify HMAC signatures;

- enforce replay windows;

- handle duplicate provider IDs;

- reject conflicting duplicates;

- preserve event order separately from receipt order;

- simulate 401, 404, 429, 500, timeout, and malformed-payload cases;

- display retry safety;

- generate a reproducible incident report;

- show the next recovery action.

### Important evidence boundary

The platform uses deterministic local fixtures. It does not claim real email delivery, real DNS resolution, customer data, production uptime, or enterprise scale.

## Module E — Agent Control Plane

This combines ToolTrust and TrustBoundary.

### Capabilities

- register a tool with JSON Schema;

- classify it as read, write, or destructive;

- define roles and scopes;

- configure approval requirements;

- enforce budgets and call limits;

- require idempotency for side effects;

- simulate malformed output;

- record structured failures;

- replay a previous run;

- compare policy versions;

- export a safety evaluation report.

### Example policy decision

```json
{
  "tool": "create_refund",
  "risk": "financial_side_effect",
  "decision": "requires_confirmation",
  "reason": "amount_exceeds_auto_approval_limit",
  "policy_version": "v3"
}
```

## Module F — Developer Journey Observatory

This is the evolution of DeveloperJourney Observatory.

### Capabilities

- run synthetic onboarding sessions;

- measure time to first successful request;

- record authentication and validation failures;

- track recovery time;

- classify drop-off points;

- compare documentation versions;

- connect a friction finding to an API contract rule;

- generate before/after reports.

### Evidence boundary

All sessions are synthetic. They demonstrate measurement design, not real customer behavior.

## Module G — Economics and Decision Ledger

This combines AgentLedger and WorkflowROI.

### Capabilities

- record model calls;

- record tool calls;

- record retries;

- record human review;

- estimate cost per workflow run;

- calculate cost per successful outcome;

- model the cost of failure;

- compare manual, assisted, and automated modes;

- run sensitivity analysis;

- show assumptions beside results;

- recommend “automate,” “partially automate,” or “do not automate yet.”

### Example output

```
Recommendation: partial automation

Reason:
- low-risk classification is economically favorable;
- human review remains valuable for ambiguous cases;
- full automation has a high estimated recovery cost;
- the result depends on the stated review-time assumption.

Evidence type: synthetic simulation
```

## Module H — Evidence and Feedback Graph

This combines EvidenceGraph and SignalDesk.

### Capabilities

- capture a developer feedback item;

- link it to a documentation page, contract rule, failed run, or feature;

- classify it as bug, friction, missing example, unclear error, or product request;

- track status;

- link a proposed change to before/after evidence;

- export a decision memo;

- distinguish AI suggestions from human-approved decisions.

---

# 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SignalOS Web Console                   │
│ Contract | SDK | Docs | Reliability | Agents | Evidence │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    Application API                      │
│ workspace / report / run / policy / feedback endpoints  │
└───────┬─────────────┬─────────────┬──────────────┬──────┘
        │             │             │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼─────┐ ┌──────▼──────┐
│ Contract     │ │ Docs     │ │ Reliability│ │ Agent       │
│ rule engine  │ │ runner   │ │ simulator  │ │ policy      │
└───────┬──────┘ └────┬─────┘ └─────┬─────┘ └──────┬──────┘
        │             │             │              │
        └─────────────┴──────┬──────┴──────────────┘
                             │
                  ┌──────────▼──────────┐
                  │ Evidence/event ledger│
                  │ SQLite + migrations  │
                  └──────────┬──────────┘
                             │
               ┌─────────────▼─────────────┐
               │ Reports: JSON/MD/HTML/CSV │
               └───────────────────────────┘
```

## Suggested stack

- **Frontend:** Next.js, React, TypeScript.

- **API:** FastAPI or Next.js route handlers; choose one primary runtime rather than duplicating logic unnecessarily.

- **Validation:** Zod on the TypeScript side and Pydantic where Python is used.

- **Persistence:** SQLite for the local portfolio version, with a clear migration path.

- **Testing:** Vitest or pytest, React Testing Library, Playwright.

- **Contracts:** OpenAPI and JSON Schema.

- **CI:** GitHub Actions.

- **Packaging:** pnpm workspace or a clean monorepo.

- **Documentation:** Markdown, generated API reference, and a docs quickstart.

---

# 5. Recommended repository structure

```
signalos/
├── apps/
│   ├── console/
│   └── api/
├── packages/
│   ├── contract-engine/
│   ├── sdk-launchpad/
│   ├── docs-runner/
│   ├── reliability-lab/
│   ├── agent-policy/
│   ├── evidence-ledger/
│   ├── economics-engine/
│   └── report-renderer/
├── fixtures/
│   ├── apis/
│   ├── webhooks/
│   ├── agent-tools/
│   ├── onboarding/
│   └── documentation/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CODE_TOUR.md
│   ├── EVIDENCE_BOUNDARIES.md
│   ├── THREAT_MODEL.md
│   ├── PRODUCT_DECISIONS.md
│   └── DEMO_SCRIPT.md
├── e2e/
├── .github/workflows/
│   ├── verify.yml
│   ├── docs-check.yml
│   ├── contract-pr-check.yml
│   ├── synthetic-replay.yml
│   └── release.yml
├── README.md
├── LICENSE
├── CHANGELOG.md
└── package.json
```

## Why a monorepo is useful here

The modules share fixtures and evidence types. A monorepo lets a reviewer see the connections without opening five unrelated repositories. It also allows one end-to-end scenario to cross the contract, SDK, documentation, reliability, agent, and reporting layers.

Keep module boundaries strict. A mega project becomes impressive when it is organized, not when every feature imports everything else.

---

# 6. The flagship end-to-end scenario

Use one story throughout the README, demo, article, and interview.

## Scenario: an API team launches a payment endpoint

### Step 1 — Contract review

SignalOS finds that the new `POST /payments` endpoint has:

- no documented `429` schema;

- no `Retry-After` guidance;

- an ambiguous idempotency requirement;

- an incomplete error example.

The Contract Observatory creates a report.

### Step 2 — SDK generation

The team generates a TypeScript client. The SDK report identifies the missing response types and flags the incomplete example.

### Step 3 — Documentation test

The quickstart is run in a clean local environment. One example fails because it uses the old endpoint path.

### Step 4 — Reliability test

The Reliability Lab simulates a timeout and a duplicate request. It confirms that the same idempotency key prevents a duplicate payment fixture.

### Step 5 — Agent policy

An AI agent attempts to call `create_payment`. The policy engine requires confirmation because the operation has a financial side effect.

### Step 6 — Developer journey

The onboarding runner compares version 1 and version 2 of the documentation and shows that the recovery example reduces synthetic recovery time.

### Step 7 — Economics

The decision ledger compares a fully manual support workflow with a partially automated workflow and shows the assumptions behind the recommendation.

### Step 8 — Export

SignalOS produces one evidence report containing:

- contract findings;

- SDK verification;

- documentation results;

- reliability traces;

- agent policy decisions;

- synthetic onboarding metrics;

- economic assumptions;

- open limitations.

This one scenario demonstrates more than a list of disconnected features.

---

# 7. Automation that recruiters can inspect

## Pull request automation

When an OpenAPI contract changes:

1. run contract analysis;

1. detect breaking changes;

1. run SDK drift detection;

1. execute docs examples;

1. post a concise PR comment;

1. fail only for configured high-severity findings.

## Scheduled synthetic verification

Run the core scenario daily or weekly:

- contract analysis;

- SDK tests;

- documentation checks;

- webhook replay;

- agent adversarial evaluation;

- report generation.

Label the output clearly as synthetic verification.

## Security automation

Run:

- secret scan;

- dependency review;

- lockfile check;

- unsafe fixture check;

- test proving demo endpoints are disabled by default;

- test proving generated reports contain no credentials.

## Release automation

On a tagged release:

- verify all checks;

- generate changelog;

- build the application;

- attach a report;

- publish a GitHub release;

- record the source commit and fixture versions.

---

# 8. Minimum viable version versus mega version

Do not build all eight modules before showing anything.

## MVP — 10 to 14 days

Build only:

1. Contract Observatory.

1. Reliability Lab.

1. Agent Control Plane.

1. Evidence ledger.

1. One end-to-end scenario.

1. CI verification.

The MVP must include a real UI, local persistence, tests, a README quickstart, and a report export.

## Version 2 — 7 to 10 additional days

Add:

- SDK Launchpad;

- Documentation Workbench;

- generated examples;

- PR comments;

- synthetic onboarding journey.

## Version 3 — optional

Add:

- Economics and Decision Ledger;

- Evidence and Feedback Graph;

- more polished reports;

- optional hosted demo;

- public article and video.

If time runs out, stop after Version 2. A finished MVP is more valuable than a broken mega version.

---

# 9. Tests recruiters should see

Create a visible verification table:

| Layer | What it proves |
| --- | --- |
| Unit tests | Rule engine, policy decisions, cost formulas, idempotency |
| Integration tests | API, persistence, report generation |
| Contract tests | OpenAPI input and output behavior |
| Documentation tests | Examples and commands are executable |
| Browser tests | Reviewer can complete the end-to-end journey |
| Security tests | Secrets, permissions, demo gating, safe fixtures |
| CI workflow | Clean install, verification, build, report artifact |
| Synthetic benchmarks | Reproducible onboarding and recovery fixtures |

Avoid displaying a meaningless coverage percentage as the main proof. Show the scenarios and commands that pass.

---

# 10. README structure

## Opening

> SignalOS is a locally runnable Developer Experience Reliability Platform. It connects API contract analysis, SDK verification, documentation testing, webhook replay, AI-agent policy evaluation, developer onboarding measurement, and evidence-linked decision reports.

## Quickstart

```bash
pnpm install --frozen-lockfile
pnpm db:setup
pnpm demo
```

## Three-minute demo

- open workspace;

- inspect contract findings;

- run docs check;

- trigger webhook failure;

- attempt destructive tool call;

- export evidence report.

## What the project proves

Use a table connecting each module to a skill, not a long list of technologies.

## Evidence boundaries

State clearly that it is:

- local;

- synthetic;

- not production scale;

- not a security certification;

- not real customer telemetry;

- not a real payment or email system.

## Code tour

Link directly to:

- one contract rule;

- one idempotency implementation;

- one policy decision;

- one docs runner;

- one report renderer;

- one Playwright scenario.

## Product decisions

Explain why you chose:

- local fixtures;

- SQLite;

- deterministic evaluation;

- explicit human approval;

- evidence labels;

- separate current state and event history.

---

# 11. What this project proves to different recruiters

| Recruiter / team | What they can inspect |
| --- | --- |
| Developer Relations | Tutorials, examples, failure explanations, demo story, docs quality |
| Developer Experience | Onboarding journey, friction analysis, recovery paths, contract rules |
| API/SDK engineering | OpenAPI, generated client, compatibility, error contracts, drift detection |
| AI infrastructure | Tool schemas, policies, confirmations, replay, structured failures |
| Developer Success | Reproduction path, incident report, request IDs, next actions |
| Technical Content | Executable documentation, evidence-based writing, source boundaries |
| Product engineering | Full-stack architecture, state, UX, persistence, decisions |
| Security-minded teams | Permission boundaries, secret checks, audit trail, threat model |
| Product/business teams | Economics model, assumptions, sensitivity analysis, decision memos |

---

# 12. Interview questions this project prepares you to answer

### “Why did you build this?”

> “I wanted to connect the parts of developer experience that are usually evaluated separately: contract quality, SDK behavior, documentation, failure recovery, agent safety, and onboarding evidence. The project makes those connections reproducible rather than relying on opinion.”

### “What was the hardest design decision?”

> “I had to decide how to keep the project broad without making it vague. I used a shared evidence ledger and one end-to-end scenario, while keeping each module independently testable.”

### “What does it not prove?”

> “It does not prove production scale, real customer behavior, or security certification. Its purpose is to demonstrate architecture, decision quality, reproducibility, and developer-facing judgment through local fixtures.”

### “What would you do next?”

> “I would connect the evidence model to real CI providers and opt-in product telemetry, but only after defining privacy, consent, retention, and measurement boundaries.”

---

# 13. The one thing that makes it exceptional

Do not present SignalOS as a giant feature catalog.

Present it as a thesis:

> **Developer experience becomes more reliable when contract quality, documentation, failure recovery, agent permissions, onboarding behavior, and business assumptions can be inspected through the same evidence model.**

That thesis gives the project coherence.

The portfolio value is not the number of modules. It is your ability to show that you can:

- identify a complicated systems problem;

- define a useful scope;

- build a working vertical slice;

- test it honestly;

- explain the tradeoffs;

- connect technical behavior to human and business outcomes.

## Recommended GitHub repository

`signalos-developer-experience-platform`

## Recommended portfolio tagline

> **SignalOS makes developer experience inspectable—from API contract to SDK, documentation, failure recovery, agent safety, onboarding evidence, and economic decision.**
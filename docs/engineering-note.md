# A successful retry is not enough: preserve the path to the decision

A payment request can time out after its side effect has already committed. Treating that timeout as a simple failure encourages a new request—and potentially a duplicate operation. SignalOS reproduces this with a local HTTP fixture: commit first, delay the response, expire the client deadline, then retry with the same key. The second response points to the original persisted record.

That evidence is useful, but incomplete. The contract must tell a developer how to recover. The quickstart must use the current endpoint. An agent must be allowed to perform the action. A cost forecast must include review and failure assumptions. Each concern has a different evidence boundary, yet all affect one integration.

## Connect the evidence, retain the distinctions

The investigator records contract findings, HTTP outcomes, duplicate counts, signature checks, agent decisions and formula inputs in one ordered ledger. Each record has an ID, module, provenance label, outcome, explanation and links to related findings. The report carries these distinctions rather than collapsing everything into a readiness score.

“Observed” describes a local measurement. It does not turn a fictional payment into production behavior. “Estimated” describes a formula using chosen assumptions. It does not turn a projected labor saving into a customer outcome.

## Approval belongs to the exact action

A confirmation cannot be a reusable boolean. SignalOS binds it to parsed payment arguments and the complete policy snapshot, adds a five-minute expiry, and checks the run revision. A policy comparison creates a new run rather than rewriting the first decision. A rejected or denied action never reaches the agent fixture executor.

The implementation deliberately does not claim authenticated approval. The local reviewer is explicit, not identified. Production controls need an identity system and a separate trusted approval channel.

## Persistent evidence is a product feature

SQLite makes investigation and replay inspectable after a refresh or process restart. Transactional run/evidence writes prevent partial timelines. Payment idempotency is stored independently so an execution can be recovered when the subsequent run update fails. That is a local recovery design, not a distributed transaction guarantee.

## Scope is part of the engineering decision

The finished slice uses a hand-written typed client and one restricted HTTP quickstart check. A general SDK generator and shell-executed documentation need substantially different boundaries. Shipping those names without the corresponding behavior would weaken the evidence model.

The useful outcome is one reproducible investigation whose conclusions can be checked: what failed, what was recovered, what required human confirmation, which assumptions affected value, and what remains outside the implementation.

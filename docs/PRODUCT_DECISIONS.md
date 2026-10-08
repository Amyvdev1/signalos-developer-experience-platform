# Product decisions

**One investigation, one evidence model.** Separate module demos lose the causal path. The console follows a payment launch from contract gap to local failure, recovery, policy decision and report.

**Approval is a state transition.** A requires-confirmation result is not success. An awaiting run has no agent side effect; local acceptance or rejection is an additional explicit action.

**Unknown is not free.** Missing tool prices propagate as null cost and null savings, with a recommendation to measure before deciding.

**Observed does not mean production.** HTTP responses, signature checks and persistence are observed locally. Payment semantics, event arrival and role choices remain fixtures. Values such as review time and failure probability are assumptions.

**An MVP is a completed slice.** Four core modules have an end-to-end flow. Supporting SDK/docs/economics functionality is deliberately narrower than the full roadmap. YAML, deep reference resolution, full SDK generation, authentication, onboarding and feedback graph are not silently implied.

**Visual thesis: a field notebook for reliable systems.** Graphite, mint and restrained brass connect configuration to an ordered evidence rail. Monospace labels carry provenance; a serif opening gives the product a distinct editorial identity. Controls are explicit; reduced-motion users receive the same static experience.

# Evidence boundaries

| Label | Meaning in SignalOS |
|---|---|
| observed | Local HTTP response, Zod/policy/rule result, HMAC check, persisted duplicate count, explicit local approval |
| synthetic | Fictional payment domain, simulated agent, provider event ordering fixture |
| assumption | User-supplied labor price, review time, tool price, manual baseline, failure probability/loss |
| estimated | Formula result derived from the supplied assumptions and local attempt count |

The synthetic domain remains explicit even when its local HTTP execution is observed. A signature test is not evidence of production webhook delivery. A blocked fixture action is not proof of security against a real agent. An economic recommendation is not measured savings. A local reviewer action is not an authenticated human identity.

Known limitations: JSON OpenAPI 3.x subset only; external references and deep schemas are not resolved; SDK is hand-written; docs runner checks one configured HTTP example; ordering uses synthetic events; economics is per-investigation and does not aggregate production success rates. No cloud demo, Docker validation, npm publication, production load or customer research has been performed.

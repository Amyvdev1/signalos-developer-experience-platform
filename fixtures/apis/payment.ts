const response = {
  description: "A structured response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          requestId: { type: "string" },
        },
      },
    },
  },
};
const successResponse = {
  description: "Persisted fixture payment",
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["id", "amount", "duplicate"],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          amount: { type: "integer", minimum: 1 },
          duplicate: { type: "boolean" },
        },
      },
    },
  },
};
const failureResponse = {
  description: "Structured fixture failure",
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code"],
            properties: { code: { type: "string" } },
          },
        },
      },
    },
  },
};
const requestBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["amount"],
        properties: { amount: { type: "integer", minimum: 1 } },
      },
      example: { amount: 125 },
    },
  },
};
export const weakContract = {
  openapi: "3.1.0",
  info: { title: "Synthetic Payments API", version: "1.0.0" },
  paths: {
    "/payments": {
      post: {
        operationId: "createPayment",
        requestBody,
        responses: {
          "201": response,
          "401": response,
          "429": { description: "Too many requests" },
        },
      },
    },
  },
};
export const strongContract = {
  ...structuredClone(weakContract),
  info: { title: "Synthetic Payments API", version: "1.1.0" },
  paths: {
    "/payments": {
      post: {
        ...structuredClone(weakContract.paths["/payments"].post),
        security: [{ demoBearer: [] }],
        parameters: [
          {
            in: "header",
            name: "Idempotency-Key",
            required: true,
            schema: { type: "string" },
          },
        ],
        description:
          "Retry after Retry-After using the same Idempotency-Key. Never reuse a key with changed arguments.",
        responses: {
          "201": successResponse,
          "400": failureResponse,
          "401": failureResponse,
          "409": failureResponse,
          "429": {
            ...failureResponse,
            headers: { "Retry-After": { schema: { type: "integer" } } },
          },
          "500": failureResponse,
        },
      },
    },
  },
  components: {
    securitySchemes: { demoBearer: { type: "http", scheme: "bearer" } },
  },
};
export const defaultPolicy = {
  version: "payments-v1",
  allowedRole: "billing-agent",
  requiredScope: "payments:create",
  maxAmount: 500,
  requiresConfirmation: true,
};
export const boundary =
  "All payments and agents are local fixtures. HTTP status, cryptographic verification, duplicate prevention and database persistence are observed locally. Economic values are estimates; no real money, live AI, customer behavior or production security is claimed.";
export const defaultInput = {
  contract: weakContract,
  previousContract: strongContract,
  docsPath: "/v0/payments",
  amount: 125,
  role: "billing-agent",
  scopes: ["payments:create"],
  scenario: "timeout" as const,
  toolCost: 0.02,
  reviewMinutes: 2,
  hourlyRate: 40,
  manualMinutes: 8,
  failureProbability: 0.03,
  failureLoss: 12,
};

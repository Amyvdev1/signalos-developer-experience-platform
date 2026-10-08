export type Finding = {
  id: string;
  operation: string;
  severity: "high" | "medium";
  message: string;
  nextAction: string;
};
export type Evidence = {
  id: string;
  module: string;
  kind: "observed" | "estimated" | "assumption" | "synthetic";
  title: string;
  outcome: string;
  detail: string;
  links: string[];
  at: string;
};
export type Policy = {
  version: string;
  allowedRole: string;
  requiredScope: string;
  maxAmount: number;
  requiresConfirmation: boolean;
};
export type Decision = {
  decision: "denied" | "requires_confirmation" | "allowed";
  reason: string;
  risk: "write";
  policyVersion: string;
  fingerprint: string;
};
export type RunInput = {
  contract: unknown;
  previousContract?: unknown;
  docsPath: string;
  amount: number;
  role: string;
  scopes: string[];
  scenario: "timeout" | "429" | "500" | "401" | "404" | "happy";
  toolCost: number | null;
  reviewMinutes: number;
  hourlyRate: number;
  manualMinutes: number;
  failureProbability: number;
  failureLoss: number;
};
export type Run = {
  id: string;
  createdAt: string;
  revision: number;
  status: "awaiting_approval" | "completed" | "denied" | "rejected";
  input: RunInput;
  policy: Policy;
  decision: Decision;
  approvalExpiresAt: string;
  findings: Finding[];
  evidence: Evidence[];
  economics: {
    total: number | null;
    manual: number;
    savings: number | null;
    recommendation: string;
    formula: string;
  };
  payments: number;
  replayOf?: string;
  boundary: string;
};

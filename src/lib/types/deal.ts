export type DealStage =
  | "lead"
  | "qualified"
  | "proposal-sent"
  | "negotiation"
  | "won"
  | "lost";

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  "proposal-sent": "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const DEAL_STAGE_ORDER: DealStage[] = [
  "lead",
  "qualified",
  "proposal-sent",
  "negotiation",
  "won",
  "lost",
];

export const PIPELINE_STAGES: DealStage[] = [
  "lead",
  "qualified",
  "proposal-sent",
  "negotiation",
  "won",
];

export type Deal = {
  id: string;
  customerId: string;
  title: string;
  stage: DealStage;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  closedAt?: string;
  nextAction?: string;
  lostReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DealStage =
  | "lead"
  | "qualified"
  | "proposal-sent"
  | "negotiation"
  | "won"
  | "lost";

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead: "リード",
  qualified: "商談化",
  "proposal-sent": "提案中",
  negotiation: "交渉中",
  won: "受注",
  lost: "失注",
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

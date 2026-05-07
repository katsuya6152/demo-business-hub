import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/lib/types/customer";
import type { DealStage } from "@/lib/types/deal";
import type { QuoteStatus } from "@/lib/types/quote";
import type { InvoiceStatus } from "@/lib/types/invoice";
import { CUSTOMER_STATUS_LABELS } from "@/lib/types/customer";
import { DEAL_STAGE_LABELS } from "@/lib/types/deal";
import { QUOTE_STATUS_LABELS } from "@/lib/types/quote";
import { INVOICE_STATUS_LABELS } from "@/lib/types/invoice";

type Tone = "cyan" | "accent" | "amber" | "red" | "ink";

const TONE_CLASSES: Record<Tone, { box: string; dot: string }> = {
  cyan: {
    box: "bg-[var(--color-cyan-50)] text-[var(--color-cyan-700)] border-[var(--color-cyan-200)]",
    dot: "bg-[var(--color-cyan-600)]",
  },
  accent: {
    box: "bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border-[var(--color-accent-200)]",
    dot: "bg-[var(--color-accent-600)]",
  },
  amber: {
    box: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  red: {
    box: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-600",
  },
  ink: {
    box: "bg-[var(--color-ink-100)] text-[var(--color-ink-500)] border-[var(--color-line)]",
    dot: "bg-[var(--color-ink-500)]",
  },
};

function Pill({
  tone,
  label,
}: {
  tone: Tone;
  label: string;
}) {
  const c = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        c.box,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {label}
    </span>
  );
}

const CUSTOMER_TONE: Record<CustomerStatus, Tone> = {
  active: "cyan",
  prospect: "amber",
  inactive: "ink",
};

export function CustomerStatusBadge({
  status,
}: {
  status: CustomerStatus;
}) {
  return (
    <Pill
      tone={CUSTOMER_TONE[status]}
      label={CUSTOMER_STATUS_LABELS[status]}
    />
  );
}

const DEAL_TONE: Record<DealStage, Tone> = {
  lead: "ink",
  qualified: "accent",
  "proposal-sent": "accent",
  negotiation: "accent",
  won: "cyan",
  lost: "red",
};

export function DealStageBadge({ stage }: { stage: DealStage }) {
  return <Pill tone={DEAL_TONE[stage]} label={DEAL_STAGE_LABELS[stage]} />;
}

const QUOTE_TONE: Record<QuoteStatus, Tone> = {
  draft: "ink",
  sent: "accent",
  accepted: "cyan",
  rejected: "red",
  expired: "amber",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Pill tone={QUOTE_TONE[status]} label={QUOTE_STATUS_LABELS[status]} />;
}

const INVOICE_TONE: Record<InvoiceStatus, Tone> = {
  draft: "ink",
  sent: "accent",
  paid: "cyan",
  overdue: "red",
  cancelled: "ink",
};

export function InvoiceStatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  return <Pill tone={INVOICE_TONE[status]} label={INVOICE_STATUS_LABELS[status]} />;
}

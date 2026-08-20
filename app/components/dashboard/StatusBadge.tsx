import type { ApplicabilityStatus } from "@/lib/domain/schemas";
import { statusLabels } from "@/app/components/dashboard/constants";

const statusSymbols: Record<ApplicabilityStatus, string> = {
  APPLIES: "✓",
  DOES_NOT_APPLY: "—",
  POSSIBLY_APPLIES: "△",
  NEEDS_MORE_INFO: "?",
};

export function StatusBadge({ status, compact = false }: { status: ApplicabilityStatus; compact?: boolean }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span aria-hidden="true">{statusSymbols[status]}</span>
      {compact ? <span className="sr-only">{statusLabels[status]}</span> : statusLabels[status]}
    </span>
  );
}

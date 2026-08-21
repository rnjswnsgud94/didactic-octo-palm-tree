import type { ApplicabilityStatus } from "@/lib/domain/schemas";
import { statusLabels } from "@/app/components/dashboard/constants";

const statusSymbols: Record<ApplicabilityStatus, string> = {
  APPLIES: "✓",
  DOES_NOT_APPLY: "—",
  POSSIBLY_APPLIES: "△",
  NEEDS_MORE_INFO: "?",
};

export function StatusBadge({
  status,
  compact = false,
  isDeemed = false,
}: {
  status: ApplicabilityStatus;
  compact?: boolean;
  isDeemed?: boolean;
}) {
  const label = isDeemed ? "일괄처리로 충족" : statusLabels[status];
  return (
    <span className={`status-badge status-${isDeemed ? "deemed" : status.toLowerCase()}`}>
      <span aria-hidden="true">{isDeemed ? "✓" : statusSymbols[status]}</span>
      {compact ? <span className="sr-only">{label}</span> : label}
    </span>
  );
}

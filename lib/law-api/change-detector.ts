import type { ApplicabilityRule, LegalCitation } from "@/lib/domain/schemas";
import type { NormalizedLawDocument } from "@/lib/law-api/types";

export type LawChangeImpact = {
  changedSourceIds: string[];
  impactedCitationIds: string[];
  impactedRuleIds: string[];
  checklist: string[];
};

export function detectLawChanges(
  previous: NormalizedLawDocument[],
  current: NormalizedLawDocument[],
  citations: LegalCitation[],
  rules: ApplicabilityRule[],
): LawChangeImpact {
  const previousBySource = new Map(
    previous.filter((item) => item.sourceId).map((item) => [item.sourceId!, item]),
  );
  const changedSourceIds = current
    .filter((item) => item.sourceId)
    .filter((item) => {
      const before = previousBySource.get(item.sourceId!);
      return (
        !before ||
        before.contentHash !== item.contentHash ||
        before.effectiveDate !== item.effectiveDate ||
        before.proclamationNumber !== item.proclamationNumber
      );
    })
    .map((item) => item.sourceId!)
    .sort();
  const changedSet = new Set(changedSourceIds);
  const impactedCitationIds = citations
    .filter((citation) => changedSet.has(citation.sourceId))
    .map((citation) => citation.id)
    .sort();
  const citationSet = new Set(impactedCitationIds);
  const impactedRuleIds = rules
    .filter((rule) => rule.citationIds.some((id) => citationSet.has(id)))
    .map((rule) => rule.id)
    .sort();
  return {
    changedSourceIds,
    impactedCitationIds,
    impactedRuleIds,
    checklist: changedSourceIds.length
      ? [
          "공포일·시행일과 평가일 기준 버전을 대조합니다.",
          "영향 조문의 문언과 예외·위임 규정을 검토합니다.",
          "관계 citation 요약을 사람이 확인합니다.",
          "영향 rule의 조건·설명·테스트를 검토하되 자동 수정하지 않습니다.",
          "법률전문가 또는 관계기관 확인 후 규칙 상태를 승격합니다.",
        ]
      : [],
  };
}

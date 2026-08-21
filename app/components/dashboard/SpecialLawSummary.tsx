import {
  AI_DATA_CENTER_INDUSTRY_ID,
  AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
  type SpecialLawEffect,
  type SpecialLawEvaluation,
} from "@/lib/data/special-laws";

const effectLabels: Record<SpecialLawEffect, string> = {
  ONE_STOP: "일괄처리",
  EXEMPTION: "특례 면제",
  DEEMED_REPORT: "신고 의제",
  STANDARD_RELAXATION: "규모 산정 특례",
  LOCATION_SPECIAL_CASE: "입지 특례",
  FAST_TRACK: "신속처리",
  INTEGRATED_APPROVAL: "통합승인·의제",
  PLAN_DEEMING: "계획승인 의제",
};

export function SpecialLawSummary({
  industryCategory,
  evaluations,
}: {
  industryCategory: string;
  evaluations: SpecialLawEvaluation[];
}) {
  if (industryCategory !== AI_DATA_CENTER_INDUSTRY_ID && !evaluations.length) {
    return null;
  }

  return (
    <section className="special-law-summary" aria-labelledby="special-law-summary-title">
      <header>
        <div>
          <span>업종·지역·산업단지 특례</span>
          <h2 id="special-law-summary-title">특별법 간소화·면제 점검</h2>
        </div>
      </header>
      {!evaluations.length ? (
        <div className="special-law-empty">
          <strong>선택한 특례가 없습니다.</strong>
          <span>
            AI 데이터센터 특별법은 {AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE} 시행 예정입니다. 적용요건을 확인한 뒤 사업 기본 단계에서 특례를 선택하세요.
          </span>
        </div>
      ) : (
        <div className="special-law-list">
          {evaluations.map((evaluation) => (
            <article className={`special-law-item status-${evaluation.status.toLowerCase()}`} key={evaluation.id}>
              <div>
                <span>{effectLabels[evaluation.effect]}</span>
                <em>{evaluation.statusLabel}</em>
              </div>
              <h3>{evaluation.shortLabel}</h3>
              <p>{evaluation.statusNote}</p>
              <small>{evaluation.lawName ? `${evaluation.lawName} · ` : ""}{evaluation.article} · {evaluation.conditionNote}</small>
              <a href={evaluation.officialUrl} target="_blank" rel="noreferrer">공식 법령 ↗</a>
            </article>
          ))}
        </div>
      )}
      <p className="special-law-disclosure">
        AI 데이터센터 일괄처리는 면제가 아니며, 관계기관 요청 다음 날부터 법정기한을 계산해 거부 통지가 없을 때 기한 종료 다음 날 처리 완료로 봅니다. 다른 신속처리·계획승인 의제도 면제와 구분되며, 요청, 법정기한 경과, 계획·서류 포함과 관계기관 협의 등 각 법률의 요건이 충족되어야 합니다. 확인값만으로 일반 처리기간이나 총 소요기간을 자동 단축하지 않고, 하위법령 미정 항목도 자동 확정하지 않습니다.
        승인·고시번호와 공문번호는 사용자가 확인한 값이며, 이 화면이 해당 문서의 원본·발행기관·의제목록 진위를 대신 검증하지 않습니다. 적용 전 공식 원문과 담당기관 회신을 대조하세요.
      </p>
    </section>
  );
}

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
          <span>업종별 특례</span>
          <h2 id="special-law-summary-title">AI 데이터센터 특별법 적용</h2>
        </div>
        <a
          href="https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=&chrClsCd=010202&efYd=20270310&lsiSeq=286707&urlMode=lsInfoP"
          target="_blank"
          rel="noreferrer"
        >
          공식 법령 ↗
        </a>
      </header>
      {!evaluations.length ? (
        <div className="special-law-empty">
          <strong>선택한 특례가 없습니다.</strong>
          <span>
            특별법은 {AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE} 시행 예정입니다. 적용요건을 확인한 뒤 사업 기본 단계에서 특례를 선택하세요.
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
              <small>{evaluation.article} · {evaluation.conditionNote}</small>
            </article>
          ))}
        </div>
      )}
      <p className="special-law-disclosure">
        일괄처리는 면제가 아니며, 신청만으로 처리 완료되는 제도도 아닙니다. 법정 처리상한은 과기정통부의 관계기관 요청 다음 날부터 계산되며, 그 기한까지 거부 통지가 없으면 기한 종료 다음 날 해당 인허가등의 처리가 완료된 것으로 봅니다. 하위법령 미정 항목은 자동 판정하지 않습니다.
      </p>
    </section>
  );
}

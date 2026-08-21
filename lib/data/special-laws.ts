import type {
  ApplicabilityRule,
  Condition,
  DurationEstimate,
  LegalCitation,
  LegalSource,
  Procedure,
  ProcedureEdge,
} from "@/lib/domain/schemas";

export const AI_DATA_CENTER_INDUSTRY_ID = "AI_DATA_CENTER" as const;
export const AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE = "2027-03-10" as const;

export const specialLawIds = [
  "AIDC_ONE_STOP",
  "AIDC_GRID_IMPACT_EXEMPTION",
  "AIDC_BUILDING_STANDARDS",
  "AIDC_INDUSTRIAL_COMPLEX_LOCATION",
  "AIDC_PORT_HINTERLAND_ENTRY",
] as const;

export type SpecialLawId = (typeof specialLawIds)[number];
export type SpecialLawStatus =
  | "ACTIVE"
  | "FUTURE"
  | "MISMATCH"
  | "UNCONFIRMED";
export type SpecialLawEffect =
  | "ONE_STOP"
  | "EXEMPTION"
  | "DEEMED_REPORT"
  | "STANDARD_RELAXATION"
  | "LOCATION_SPECIAL_CASE";

export type SpecialLawDefinition = {
  id: SpecialLawId;
  shortLabel: string;
  title: string;
  article: string;
  effect: SpecialLawEffect;
  description: string;
  conditionNote: string;
  affectedProcedureIds: readonly string[];
  officialUrl: string;
};

export type SpecialLawEvaluation = SpecialLawDefinition & {
  status: SpecialLawStatus;
  statusLabel: string;
  statusNote: string;
};

export type SpecialLawImpact = {
  lawId: SpecialLawId;
  lawTitle: string;
  article: string;
  effect: SpecialLawEffect;
  effectLabel: string;
  status: SpecialLawStatus;
  statusLabel: string;
  description: string;
  statutoryCap?: string;
  citationIds: string[];
  officialUrl: string;
};

const AIDC_SPECIAL_ACT_URL =
  "https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=&chrClsCd=010202&efYd=20270310&lsiSeq=286707&urlMode=lsInfoP";

export const specialLawDefinitions: readonly SpecialLawDefinition[] = [
  {
    id: "AIDC_ONE_STOP",
    shortLabel: "인허가 일괄처리",
    title: "AI 데이터센터 인허가 일괄처리",
    article: "제18조",
    effect: "ONE_STOP",
    description:
      "과학기술정보통신부에 전력계통영향평가, 에너지사용계획, 교통·경관·건축 심의, 건축 인허가와 소방동의를 일괄신청할 수 있습니다. 관계기관이 법정기한까지 거부를 통지하지 않으면 기한 종료 다음 날 해당 인허가등의 처리가 완료된 것으로 봅니다.",
    conditionNote:
      "신청만으로 면제되거나 처리 완료되는 제도가 아닙니다. 과기정통부 사전검토·보완과 국가인공지능전략위원회 심의 뒤 관계기관 요청 다음 날부터 처리기한이 시작되며, 기한완료 의제는 거부 통지가 없고 법정기한이 지난 경우에만 성립합니다. 일괄처리를 받은 경우에만 AI 데이터센터 신고가 의제됩니다.",
    affectedProcedureIds: [
      "ai-data-center-one-stop-application",
      "ai-data-center-one-stop-result",
      "power-grid-impact-assessment",
      "energy-use-plan-consultation",
      "traffic-impact-assessment",
      "landscape-review",
      "building-committee-review",
      "building-permit",
      "fire-building-permit-consent",
      "ai-data-center-business-report",
    ],
    officialUrl: AIDC_SPECIAL_ACT_URL,
  },
  {
    id: "AIDC_GRID_IMPACT_EXEMPTION",
    shortLabel: "계통영향평가 면제",
    title: "비수도권 AI 데이터센터 전력계통영향평가 특례",
    article: "제19조",
    effect: "EXEMPTION",
    description:
      "비수도권 AI 데이터센터의 신축·확장·기존 데이터센터 전환이 시행령상 시설·전력용량 기준을 충족하면 전력계통영향평가 대상에서 제외됩니다.",
    conditionNote:
      "현재 하위 시행령이 제정되지 않아 AI 데이터센터 인정기준과 면제 전력용량이 확정되지 않았습니다. 시행 후 공식 요건 충족을 확인한 경우에만 선택하세요.",
    affectedProcedureIds: ["power-grid-impact-assessment"],
    officialUrl: AIDC_SPECIAL_ACT_URL,
  },
  {
    id: "AIDC_BUILDING_STANDARDS",
    shortLabel: "시설 규모 산정 특례",
    title: "AI 데이터센터 시설 규모 산정 특례",
    article: "제21조",
    effect: "STANDARD_RELAXATION",
    description:
      "승강기, 친환경자동차 충전·전용주차, 부설주차장, 건축물 미술작품의 규모 등을 대통령령에 따라 달리 산정할 수 있습니다.",
    conditionNote:
      "건축허가 면제가 아닙니다. 시행령의 별도 산정기준을 설계도서와 관할 건축부서에서 확인해야 합니다.",
    affectedProcedureIds: ["building-permit"],
    officialUrl: AIDC_SPECIAL_ACT_URL,
  },
  {
    id: "AIDC_INDUSTRIAL_COMPLEX_LOCATION",
    shortLabel: "산단 입지 특례",
    title: "산업단지 AI 데이터센터 입지 특례",
    article: "제22조",
    effect: "LOCATION_SPECIAL_CASE",
    description:
      "대통령령으로 정하는 산업단지의 AI 데이터센터를 정보통신산업 관련 산업시설용지 시설과 산업집적기반시설로 볼 수 있습니다.",
    conditionNote:
      "산업단지 입주계약은 그대로 필요합니다. 대상 산업단지와 관리기본계획 반영 여부를 관리기관에서 확인하세요.",
    affectedProcedureIds: [],
    officialUrl: AIDC_SPECIAL_ACT_URL,
  },
  {
    id: "AIDC_PORT_HINTERLAND_ENTRY",
    shortLabel: "항만배후단지 입주",
    title: "1종 항만배후단지 AI 데이터센터 입주 특례",
    article: "제23조",
    effect: "LOCATION_SPECIAL_CASE",
    description:
      "AI 데이터센터가 1종 항만배후단지에 입주할 수 있도록 허용하는 특례입니다.",
    conditionNote:
      "항만배후단지 입주계약은 별도로 체결해야 하며, 본 대시보드의 일반 산업단지 입주계약과 동일한 절차로 보지 않습니다.",
    affectedProcedureIds: [],
    officialUrl: AIDC_SPECIAL_ACT_URL,
  },
] as const;

type SpecialLawScenario = {
  assessmentDate: string;
  industryCategory: string;
  aiDataCenterActFacilityConfirmed: boolean | null;
  aiDataCenterOneStopStatus: "NOT_APPLIED" | "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  appliedSpecialLawIds: readonly SpecialLawId[];
};

export function getSpecialLawDefinition(id: SpecialLawId) {
  return specialLawDefinitions.find((item) => item.id === id) ?? null;
}

export function evaluateSelectedSpecialLaws(
  answers: SpecialLawScenario,
): SpecialLawEvaluation[] {
  const evaluations: SpecialLawEvaluation[] = [];
  for (const id of answers.appliedSpecialLawIds) {
    const definition = getSpecialLawDefinition(id);
    if (!definition) continue;
    if (answers.industryCategory !== AI_DATA_CENTER_INDUSTRY_ID) {
      evaluations.push({
        ...definition,
        status: "MISMATCH",
        statusLabel: "업종 불일치",
        statusNote: "AI 데이터센터 업종에서만 적용할 수 있어 절차 판정에는 반영하지 않았습니다.",
      });
      continue;
    }
    if (answers.assessmentDate < AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE) {
      evaluations.push({
        ...definition,
        status: "FUTURE",
        statusLabel: "시행 전",
        statusNote: `법 시행일 ${AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE} 전이므로 현재 절차를 면제하거나 대체하지 않습니다.`,
      });
      continue;
    }
    if (answers.aiDataCenterActFacilityConfirmed !== true) {
      evaluations.push({
        ...definition,
        status:
          answers.aiDataCenterActFacilityConfirmed === false
            ? "MISMATCH"
            : "UNCONFIRMED",
        statusLabel:
          answers.aiDataCenterActFacilityConfirmed === false
            ? "시설요건 미해당"
            : "요건 확인 필요",
        statusNote:
          answers.aiDataCenterActFacilityConfirmed === false
            ? "특별법상 AI 데이터센터 인정요건에 미해당으로 입력되어 절차 판정에는 반영하지 않았습니다."
            : "대통령령상 AI 데이터센터 인정요건 확인값이 없어 절차를 면제하거나 대체하지 않았습니다.",
      });
      continue;
    }
    if (
      definition.id === "AIDC_ONE_STOP" &&
      answers.aiDataCenterOneStopStatus === "NOT_APPLIED"
    ) {
      evaluations.push({
        ...definition,
        status: "UNCONFIRMED",
        statusLabel: "진행상태 확인 필요",
        statusNote: "일괄처리 특례는 선택되었지만 신청·심사·완료 상태가 입력되지 않아 절차 판정에 반영하지 않았습니다.",
      });
      continue;
    }
    const oneStopStatusNote =
      definition.id !== "AIDC_ONE_STOP"
        ? null
        : answers.aiDataCenterOneStopStatus === "COMPLETED"
          ? "일괄처리를 받은 상태로 입력되어 제10조제2항의 신고 의제를 반영합니다."
          : answers.aiDataCenterOneStopStatus === "IN_PROGRESS"
            ? "일괄처리 심사 중으로 입력되었습니다. 완료 전에는 AI 데이터센터 신고 의제가 성립하지 않습니다."
            : "일괄처리 신청 예정으로 입력되었습니다. 완료 전에는 AI 데이터센터 신고 의제가 성립하지 않습니다.";
    evaluations.push({
      ...definition,
      status: "ACTIVE",
      statusLabel: "선택 반영",
      statusNote:
        oneStopStatusNote ??
        (definition.affectedProcedureIds.length
          ? "사용자가 특별법상 시설 인정요건과 개별 특례요건 충족을 확인한 값으로 절차 판정에 반영했습니다."
          : "사용자가 적용요건 충족을 확인한 입지 특례로 표시합니다. 별도 인허가 면제는 적용하지 않습니다."),
    });
  }
  return evaluations;
}

const oneStopCaps: Record<string, string> = {
  "power-grid-impact-assessment": "관계기관 요청 다음 날부터 150일 이내",
  "energy-use-plan-consultation": "관계기관 요청 다음 날부터 90일 이내",
  "traffic-impact-assessment": "관계기관 요청 다음 날부터 90일 이내",
  "landscape-review": "관계기관 요청 다음 날부터 90일 이내",
  "building-committee-review": "관계기관 요청 다음 날부터 90일 이내",
  "building-permit": "관계기관 요청 다음 날부터 40일 이내",
  "fire-building-permit-consent": "관계기관 요청 다음 날부터 40일 이내",
};

const effectLabels: Record<SpecialLawEffect, string> = {
  ONE_STOP: "일괄처리",
  EXEMPTION: "특례 면제",
  DEEMED_REPORT: "신고 의제",
  STANDARD_RELAXATION: "규모 산정 특례",
  LOCATION_SPECIAL_CASE: "입지 특례",
};

const citationIdsByLaw: Record<SpecialLawId, string[]> = {
  AIDC_ONE_STOP: ["cit-aidc-special-act-18", "cit-aidc-special-act-18-9"],
  AIDC_GRID_IMPACT_EXEMPTION: ["cit-aidc-special-act-19"],
  AIDC_BUILDING_STANDARDS: ["cit-aidc-special-act-21"],
  AIDC_INDUSTRIAL_COMPLEX_LOCATION: ["cit-aidc-special-act-22"],
  AIDC_PORT_HINTERLAND_ENTRY: ["cit-aidc-special-act-23"],
};

export function specialLawImpactsForProcedure(
  answers: SpecialLawScenario,
  procedureId: string,
): SpecialLawImpact[] {
  return evaluateSelectedSpecialLaws(answers).flatMap((evaluation) => {
    if (!evaluation.affectedProcedureIds.includes(procedureId)) return [];
    const isReportDeemed =
      evaluation.id === "AIDC_ONE_STOP" &&
      procedureId === "ai-data-center-business-report" &&
      answers.aiDataCenterOneStopStatus === "COMPLETED" &&
      evaluation.status === "ACTIVE";
    const effect = isReportDeemed ? "DEEMED_REPORT" : evaluation.effect;
    return [{
      lawId: evaluation.id,
      lawTitle: evaluation.title,
      article: evaluation.article,
      effect,
      effectLabel:
        evaluation.status === "ACTIVE"
          ? effectLabels[effect]
          : `${effectLabels[effect]} 검토`,
      status: evaluation.status,
      statusLabel: evaluation.statusLabel,
      description: isReportDeemed
        ? "제18조에 따른 일괄처리를 받은 경우 제10조제1항의 AI 데이터센터 신고를 한 것으로 봅니다."
        : evaluation.id === "AIDC_ONE_STOP" && procedureId === "ai-data-center-business-report"
          ? "일괄처리를 받은 경우에만 별도 신고 제출을 생략할 수 있습니다. 신청 예정·심사 중에는 신고 의제가 성립하지 않습니다."
        : evaluation.description,
      ...(evaluation.id === "AIDC_ONE_STOP" && oneStopCaps[procedureId]
        ? { statutoryCap: `${oneStopCaps[procedureId]} · 주민의견 청취 또는 특별사유 시 1회 30일 이내 연장 가능(관련 법률이 의견청취를 포함한 처리기간을 정한 경우 제외) · 기한 내 거부 통지가 없으면 기한 종료 다음 날 해당 인허가등 처리 완료 의제` }
        : {}),
      citationIds:
        evaluation.id === "AIDC_ONE_STOP" &&
        procedureId === "ai-data-center-business-report"
        ? ["cit-aidc-special-act-10-2", "cit-aidc-special-act-18"]
        : citationIdsByLaw[evaluation.id],
      officialUrl: evaluation.officialUrl,
    }];
  });
}

export const specialLawLegalSources: LegalSource[] = [
  {
    id: "src-aidc-special-act-20270310",
    title: "인공지능 데이터센터 산업 진흥에 관한 특별법",
    documentType: "ACT",
    issuingAuthority: "과학기술정보통신부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: "015145",
    mst: "286707",
    proclamationDate: "2026-06-09",
    proclamationNumber: "21759",
    effectiveDate: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-final-text-286707",
    officialUrl: AIDC_SPECIAL_ACT_URL,
    status: "AUTHORITATIVE",
  },
  {
    id: "src-distributed-energy-act-20260603",
    title: "분산에너지 활성화 특별법",
    documentType: "ACT",
    issuingAuthority: "기후에너지환경부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: "014457",
    mst: "280059",
    proclamationDate: "2025-12-02",
    proclamationNumber: "21161",
    effectiveDate: "2026-06-03",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-text-280059",
    officialUrl:
      "https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20260603&lsiSeq=280059&urlMode=lsInfoP",
    status: "AUTHORITATIVE",
  },
  {
    id: "src-landscape-act-20251001",
    title: "경관법",
    documentType: "ACT",
    issuingAuthority: "국토교통부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: "010447",
    mst: "276931",
    proclamationDate: "2025-10-01",
    proclamationNumber: "21065",
    effectiveDate: "2025-10-01",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-text-276931",
    officialUrl:
      "https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&chrClsCd=010202&efYd=20251001&lsiSeq=276931&urlMode=lsInfoP",
    status: "AUTHORITATIVE",
  },
];

export const specialLawCitations: LegalCitation[] = [
  {
    id: "cit-indcluster-2-1-factory-definition",
    sourceId: "src-industrial-cluster-act-20260701",
    article: "제2조",
    paragraph: "제1호",
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 2026-07-01",
    summary: "산업집적법상 공장은 제조시설과 부대시설을 갖추고 대통령령으로 정하는 제조업을 하기 위한 사업장이다.",
  },
  {
    id: "cit-building-act-4-2",
    sourceId: "src-building-act-20260227",
    article: "제4조의2",
    paragraph: "제1항·제2항",
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 2026-02-27",
    summary: "대통령령상 건축물을 건축하거나 대수선하려는 자는 건축위원회 심의를 신청하고 관할 행정청은 심의결과를 통보해야 한다.",
  },
  {
    id: "cit-landscape-act-28",
    sourceId: "src-landscape-act-20251001",
    article: "제28조",
    paragraph: "제1항",
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 2025-10-01",
    summary: "경관지구·중점경관관리구역 등 법과 지방자치단체 조례가 정한 건축물은 경관위원회 심의를 거쳐야 한다.",
  },
  {
    id: "cit-distributed-energy-act-23",
    sourceId: "src-distributed-energy-act-20260603",
    article: "제23조",
    paragraph: "제1항",
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 2026-06-03",
    summary: "전력계통영향평가 대상지역에서 대통령령상 일정 규모 이상의 전기를 사용하려는 사업자는 평가를 실시해야 한다.",
  },
  {
    id: "cit-distributed-energy-act-24-process",
    sourceId: "src-distributed-energy-act-20260603",
    article: "제24조",
    paragraph: "제1항·제4항·제5항",
    subparagraph: null,
    item: null,
    role: "AUTHORITY",
    sourceVersion: "시행 2026-06-03",
    summary: "계통영향사업자는 승인등 신청 전 평가서를 기후에너지환경부장관에게 제출하고, 장관은 전력정책심의회 심의를 거쳐 개선필요사항등을 사업자에게 통보한다.",
  },
  {
    id: "cit-distributed-energy-act-24-duration",
    sourceId: "src-distributed-energy-act-20260603",
    article: "제24조",
    paragraph: "제6항",
    subparagraph: null,
    item: null,
    role: "DURATION",
    sourceVersion: "시행 2026-06-03",
    summary: "기후에너지환경부장관은 전력계통영향평가서를 접수한 날부터 3개월 이내에 개선필요사항등을 통보하여야 한다.",
  },
  {
    id: "cit-aidc-special-act-10",
    sourceId: "src-aidc-special-act-20270310",
    article: "제10조",
    paragraph: "제1항",
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "AI 데이터센터 사업자 또는 AI 데이터센터를 구축·운영하려는 자는 구축장소와 운영목적 등 대통령령상 사항을 과학기술정보통신부장관에게 신고해야 한다.",
  },
  {
    id: "cit-aidc-special-act-10-2",
    sourceId: "src-aidc-special-act-20270310",
    article: "제10조",
    paragraph: "제2항",
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "제18조에 따른 인허가 등의 일괄처리를 받은 경우 제10조제1항의 AI 데이터센터 신고를 한 것으로 본다.",
  },
  {
    id: "cit-aidc-special-act-18",
    sourceId: "src-aidc-special-act-20270310",
    article: "제18조",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "5개 인허가군을 과기정통부에 일괄신청할 수 있고 관계기관 요청 다음 날부터 150일·90일·40일의 처리기한을 둔다.",
  },
  {
    id: "cit-aidc-special-act-18-9",
    sourceId: "src-aidc-special-act-20270310",
    article: "제18조",
    paragraph: "제9항",
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "법정 처리기간 내 관계기관이 신청자에게 거부를 통지하지 않으면 기간이 끝난 날의 다음 날에 해당 기관 소관 인허가등의 처리가 완료된 것으로 본다.",
  },
  {
    id: "cit-aidc-special-act-19",
    sourceId: "src-aidc-special-act-20270310",
    article: "제19조",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "비수도권 AI 데이터센터의 신축·확장·전환이 대통령령상 요건을 충족하면 전력계통영향평가 실시대상 사업이 아닌 것으로 본다.",
  },
  {
    id: "cit-aidc-special-act-21",
    sourceId: "src-aidc-special-act-20270310",
    article: "제21조",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "승강기·친환경차 시설·부설주차장·미술작품의 규모 등을 대통령령으로 정하는 바에 따라 달리 산정할 수 있다.",
  },
  {
    id: "cit-aidc-special-act-22",
    sourceId: "src-aidc-special-act-20270310",
    article: "제22조",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "대통령령상 산업단지 AI 데이터센터를 정보통신산업 관련 산업시설용지 시설과 산업집적기반시설로 보되 입주계약은 유지된다.",
  },
  {
    id: "cit-aidc-special-act-23",
    sourceId: "src-aidc-special-act-20270310",
    article: "제23조",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 예정 2027-03-10",
    summary: "AI 데이터센터가 1종 항만배후단지에 입주할 수 있도록 허용하되 항만법상 입주계약은 필요하다.",
  },
];

const nationwide = {
  nationwide: true,
  provinces: [],
  cities: [],
  industrialComplexIds: [],
};

const aiDataCenterCondition: Condition = {
  eq: { path: "industry.category", value: AI_DATA_CENTER_INDUSTRY_ID },
};

const aiDataCenterActFacilityCondition: Condition = {
  eq: {
    path: "industry.aiDataCenterActFacilityConfirmed",
    value: true,
  },
};

const selectedLawCondition = (id: SpecialLawId): Condition => ({
  intersects: { path: "strategicIndustrySpecialCase", values: [id] },
});

const factoryOnlyProcedureIds = [
  "factory-establishment-approval",
  "factory-completion-report-complex",
  "factory-completion-report-offsite",
  "small-factory-registration",
] as const;

export const specialLawRules: ApplicabilityRule[] = [
  {
    id: "rule-grid-impact-assessment",
    version: "2026.08.21.1",
    procedureId: "power-grid-impact-assessment",
    effect: "INCLUDE",
    effectiveFrom: "2024-06-14",
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: { eq: { path: "utilities.gridImpactAssessmentRequired", value: true } },
    requiredInputs: ["utilities.gridImpactAssessmentRequired"],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-distributed-energy-act-23"],
    explanationTemplate: "전력계통영향평가 대상으로 입력되어 계통 수용성 평가 절차를 포함합니다.",
    priority: 100,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "대상지역·전력용량과 시행령상 제외사업은 관할기관에서 확인해야 합니다.",
  },
  {
    id: "rule-aidc-grid-impact-exemption",
    version: "2026.08.21.1",
    procedureId: "power-grid-impact-assessment",
    effect: "EXCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: {
      all: [
        aiDataCenterCondition,
        aiDataCenterActFacilityCondition,
        selectedLawCondition("AIDC_GRID_IMPACT_EXEMPTION"),
      ],
    },
    requiredInputs: [
      "industry.category",
      "industry.aiDataCenterActFacilityConfirmed",
      "strategicIndustrySpecialCase",
    ],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-19"],
    explanationTemplate: "시행 후 공식 요건 충족을 확인한 비수도권 AI 데이터센터 특례가 선택되어 전력계통영향평가를 면제합니다.",
    priority: 500,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "시행령상 AI 데이터센터 시설·전력용량 요건 확인을 전제로 한 사용자 선택입니다.",
  },
  {
    id: "rule-aidc-business-report-before-effective",
    version: "2026.08.21.1",
    procedureId: "ai-data-center-business-report",
    effect: "EXCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: "2025-01-01",
    effectiveTo: "2027-03-09",
    jurisdiction: nationwide,
    condition: aiDataCenterCondition,
    requiredInputs: ["industry.category"],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-10"],
    explanationTemplate: "AI 데이터센터 신고 의무는 2027년 3월 10일부터 시행되므로 평가 기준일 현재는 적용되지 않습니다.",
    priority: 300,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "부칙상 시행일을 적용했습니다.",
  },
  {
    id: "rule-aidc-business-report",
    version: "2026.08.21.1",
    procedureId: "ai-data-center-business-report",
    effect: "INCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: {
      all: [aiDataCenterCondition, aiDataCenterActFacilityCondition],
    },
    requiredInputs: [
      "industry.category",
      "industry.aiDataCenterActFacilityConfirmed",
    ],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-10"],
    explanationTemplate: "특별법상 AI 데이터센터 인정요건을 충족한다고 입력했고 시행일 이후이므로 과학기술정보통신부 신고 절차를 포함합니다.",
    priority: 100,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "신고항목과 서식은 시행령·시행규칙 공포 후 재확인해야 합니다.",
  },
  {
    id: "rule-aidc-business-report-not-qualified",
    version: "2026.08.21.1",
    procedureId: "ai-data-center-business-report",
    effect: "EXCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: {
      all: [
        aiDataCenterCondition,
        {
          eq: {
            path: "industry.aiDataCenterActFacilityConfirmed",
            value: false,
          },
        },
      ],
    },
    requiredInputs: [
      "industry.category",
      "industry.aiDataCenterActFacilityConfirmed",
    ],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-10"],
    explanationTemplate: "특별법상 AI 데이터센터 인정요건에 미해당으로 입력되어 제10조 신고 절차를 적용하지 않습니다.",
    priority: 300,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "법 제2조의 시설 정의와 향후 시행령상 설비·규모 기준 확인을 전제로 합니다.",
  },
  {
    id: "rule-aidc-business-report-deemed-by-one-stop",
    version: "2026.08.21.1",
    procedureId: "ai-data-center-business-report",
    effect: "EXCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: {
      all: [
        aiDataCenterCondition,
        aiDataCenterActFacilityCondition,
        selectedLawCondition("AIDC_ONE_STOP"),
        {
          eq: {
            path: "industry.aiDataCenterOneStopStatus",
            value: "COMPLETED",
          },
        },
      ],
    },
    requiredInputs: [
      "industry.category",
      "industry.aiDataCenterActFacilityConfirmed",
      "industry.aiDataCenterOneStopStatus",
      "strategicIndustrySpecialCase",
    ],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-10-2"],
    explanationTemplate: "제18조에 따른 일괄처리를 받은 상태로 입력되어 제10조제1항 신고를 별도 제출하지 않습니다.",
    priority: 500,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "일괄처리 신청 또는 심사 중이 아니라 일괄처리를 받은 경우에만 성립하는 신고 의제입니다.",
  },
  ...([
    "ai-data-center-one-stop-application",
    "ai-data-center-one-stop-result",
  ] as const).map((procedureId): ApplicabilityRule => ({
    id: `rule-${procedureId}-before-effective`,
    version: "2026.08.21.1",
    procedureId,
    effect: "EXCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: "2025-01-01",
    effectiveTo: "2027-03-09",
    jurisdiction: nationwide,
    condition: aiDataCenterCondition,
    requiredInputs: ["industry.category"],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-18"],
    explanationTemplate: "AI 데이터센터 인허가 일괄처리 제도는 2027년 3월 10일부터 시행되므로 평가 기준일 현재 적용하지 않습니다.",
    priority: 300,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "부칙상 시행일을 적용했습니다.",
  })),
  {
    id: "rule-aidc-one-stop-application",
    version: "2026.08.21.1",
    procedureId: "ai-data-center-one-stop-application",
    effect: "INCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: {
      all: [
        aiDataCenterCondition,
        aiDataCenterActFacilityCondition,
        selectedLawCondition("AIDC_ONE_STOP"),
        {
          in: {
            path: "industry.aiDataCenterOneStopStatus",
            values: ["PLANNED", "IN_PROGRESS"],
          },
        },
      ],
    },
    requiredInputs: [
      "industry.category",
      "industry.aiDataCenterActFacilityConfirmed",
      "industry.aiDataCenterOneStopStatus",
      "strategicIndustrySpecialCase",
    ],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-18"],
    explanationTemplate: "AI 데이터센터 인허가 일괄처리를 신청 예정 또는 심사 중으로 입력해 일괄처리 경로를 포함합니다.",
    priority: 300,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "과기정통부 사전검토·보완과 전략위원회 심의기간은 관계기관별 법정 처리상한에 포함되지 않습니다.",
  },
  {
    id: "rule-aidc-one-stop-result",
    version: "2026.08.21.1",
    procedureId: "ai-data-center-one-stop-result",
    effect: "INCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: {
      all: [
        aiDataCenterCondition,
        aiDataCenterActFacilityCondition,
        selectedLawCondition("AIDC_ONE_STOP"),
        {
          eq: {
            path: "industry.aiDataCenterOneStopStatus",
            value: "COMPLETED",
          },
        },
      ],
    },
    requiredInputs: [
      "industry.category",
      "industry.aiDataCenterActFacilityConfirmed",
      "industry.aiDataCenterOneStopStatus",
      "strategicIndustrySpecialCase",
    ],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-aidc-special-act-18", "cit-aidc-special-act-10-2"],
    explanationTemplate: "일괄처리를 받은 상태로 입력되어 과기정통부의 일괄처리 결과와 신고 의제를 반영합니다.",
    priority: 300,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 공포 법문 대조",
    note: "관계기관별 인허가 완료 여부와 일괄처리 결과통지를 함께 보관해야 합니다.",
  },
  {
    id: "rule-landscape-review-required",
    version: "2026.08.21.1",
    procedureId: "landscape-review",
    effect: "INCLUDE",
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: { eq: { path: "site.landscapeReviewRequired", value: true } },
    requiredInputs: ["site.landscapeReviewRequired"],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-landscape-act-28"],
    explanationTemplate: "경관심의 대상으로 입력되어 관할 경관계획·조례에 따른 심의 절차를 포함합니다.",
    priority: 100,
    status: "INTERNAL_REVIEWED",
    reviewActor: "경관법 법문 및 조례 연결 검토",
    note: "일반 적용근거와 대상기준은 경관법령·관할 경관조례·경관계획 원문을 별도 확인해야 합니다.",
  },
  {
    id: "rule-building-committee-review-required",
    version: "2026.08.21.1",
    procedureId: "building-committee-review",
    effect: "INCLUDE",
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: {
      eq: {
        path: "building.buildingCommitteeReviewRequired",
        value: true,
      },
    },
    requiredInputs: ["building.buildingCommitteeReviewRequired"],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-building-act-4-2"],
    explanationTemplate: "건축위원회 심의 대상으로 입력되어 건축허가와 구분된 사전 심의 절차를 포함합니다.",
    priority: 100,
    status: "INTERNAL_REVIEWED",
    reviewActor: "건축법 법문 및 건축절차 검토",
    note: "일반 심의대상은 건축법령과 관할 건축조례의 규모·용도 기준을 별도 확인해야 합니다.",
  },
];

/**
 * KSIC 63 서비스업으로 분류한 AI 데이터센터 업종 프로필에만 활성화되는
 * 카탈로그 규칙입니다. `industryScope`와 동일한 추적 조건을 함께 두어 다른
 * 업종의 과거 평가일 판정을 바꾸지 않으면서 산업집적법상 공장 경로만
 * 제외합니다. 환경·안전 인허가는 이 업종 프로필로 제외하지 않습니다.
 */
export const aiDataCenterProfileRules: ApplicabilityRule[] =
  factoryOnlyProcedureIds.map((procedureId): ApplicabilityRule => ({
    id: `rule-aidc-exclude-${procedureId}`,
    version: "2026.08.21.1",
    procedureId,
    effect: "EXCLUDE",
    industryScope: [AI_DATA_CENTER_INDUSTRY_ID],
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: aiDataCenterCondition,
    requiredInputs: ["industry.category"],
    missingPolicy: "INDETERMINATE",
    citationIds: ["cit-indcluster-2-1-factory-definition"],
    explanationTemplate: "선택한 AI 데이터센터 업종 프로필은 제조업 공장이 아니므로 산업집적법상 공장설립 승인·완료·등록 경로를 적용하지 않습니다.",
    priority: 600,
    status: "INTERNAL_REVIEWED",
    reviewActor: "KSIC 업종 모델 및 산업집적법 제2조 대조",
    note: "동일 사업에 별도 제조시설이 있거나 제조업을 함께 영위하면 해당 제조업 프로필로 별도 검토해야 합니다.",
  }));

export const specialLawProcedures: Procedure[] = [
  {
    id: "power-grid-impact-assessment",
    name: "전력계통영향평가",
    aliases: ["계통영향평가"],
    description: "대규모 전기사용 사업이 전력계통에 미치는 영향을 분석해 전력공급 가능성과 보강대책을 심의받는 절차입니다.",
    outcome: "전력계통영향평가 심의결과",
    stage: "SITE_REVIEW",
    actionType: "REVIEW",
    domain: "전력·에너지",
    lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY",
    applicant: "전력계통영향평가 실시대상 사업자",
    receivingAuthority: "기후에너지환경부",
    statutoryDecisionMaker: "기후에너지환경부장관",
    consultationAuthorities: ["전력정책심의회", "한국전력공사 및 관계 전기사업자"],
    submissions: ["전력사용계획", "부지·시설 개요", "전력계통영향평가서", "계통 보강·수요관리 대책"],
    validity: "심의결과와 후속 사업계획 변경 여부에 따름",
    followUpObligations: ["심의결과를 사업계획과 전력공급 협의에 반영", "전력사용계획 변경 시 재평가 여부 확인"],
    ruleIds: ["rule-grid-impact-assessment", "rule-aidc-grid-impact-exemption"],
    citationIds: [
      "cit-distributed-energy-act-23",
      "cit-distributed-energy-act-24-process",
      "cit-distributed-energy-act-24-duration",
    ],
    durationId: "duration-power-grid-impact-assessment",
    verificationStatus: "INTERNAL_REVIEWED",
    reviewedAt: "2026-08-21",
    reviewNote: "대상지역·전력용량과 시행령상 제외사업은 현행 분산에너지법령 및 관할기관에서 확인해야 합니다. 선택한 업종별 특례는 별도 카드에 표시합니다.",
    deemedByProcedureIds: [],
    deemedProcedureIds: [],
  },
  {
    id: "landscape-review",
    name: "경관심의",
    aliases: ["경관위원회 심의"],
    description: "경관법령, 경관계획과 관할 조례상 대상 개발사업·건축물의 배치·높이·외관·주변 조화를 심의받는 절차입니다.",
    outcome: "경관위원회 심의결과",
    stage: "PRE_CONSTRUCTION",
    actionType: "REVIEW",
    domain: "입지·건축",
    lane: "CITY_COUNTY_DISTRICT",
    applicant: "대상 개발사업 시행자 또는 건축주",
    receivingAuthority: "관할 시·군·구 또는 시·도 경관부서",
    statutoryDecisionMaker: "관할 경관위원회 및 인허가권자",
    consultationAuthorities: ["관할 건축·도시계획부서"],
    submissions: ["경관계획서", "배치·입면·조경계획", "조망·주변경관 검토자료", "관할 조례상 심의자료"],
    validity: "심의결과와 사업계획 변경 여부에 따름",
    followUpObligations: ["심의의결 조건을 설계·인허가도서에 반영", "주요 설계변경 시 재심의 여부 확인"],
    ruleIds: ["rule-landscape-review-required"],
    citationIds: ["cit-landscape-act-28"],
    durationId: "duration-landscape-review",
    verificationStatus: "INTERNAL_REVIEWED",
    reviewedAt: "2026-08-21",
    reviewNote: "일반 심의대상·제출자료는 경관법령, 지역 경관계획과 관할 조례를 확인해야 합니다. 선택한 업종별 특례는 별도 카드에 표시합니다.",
    deemedByProcedureIds: [],
    deemedProcedureIds: [],
  },
  {
    id: "building-committee-review",
    name: "건축위원회 심의",
    aliases: ["지방건축위원회 심의"],
    description: "건축법령과 관할 건축조례상 대상 건축물의 건축계획·구조·안전·공공성을 건축허가 전에 심의받는 절차입니다.",
    outcome: "건축위원회 심의결과",
    stage: "PRE_CONSTRUCTION",
    actionType: "REVIEW",
    domain: "입지·건축",
    lane: "CITY_COUNTY_DISTRICT",
    applicant: "건축주 또는 설계자",
    receivingAuthority: "관할 허가권자 건축부서",
    statutoryDecisionMaker: "관할 지방건축위원회 및 허가권자",
    consultationAuthorities: ["소방·구조·교통 등 심의 관계부서"],
    submissions: ["건축위원회 심의신청서", "배치·평면·입면·단면도", "구조·피난·교통 검토자료", "관할 심의기준상 도서"],
    validity: "심의결과와 설계변경 여부에 따름",
    followUpObligations: ["심의의결 조건을 건축허가도서에 반영", "주요 설계변경 시 재심의 여부 확인"],
    ruleIds: ["rule-building-committee-review-required"],
    citationIds: ["cit-building-act-4-2"],
    durationId: "duration-building-committee-review",
    verificationStatus: "INTERNAL_REVIEWED",
    reviewedAt: "2026-08-21",
    reviewNote: "일반 심의대상은 건축법령과 관할 건축조례를 확인해야 합니다. 선택한 업종별 특례는 별도 카드에 표시합니다.",
    deemedByProcedureIds: [],
    deemedProcedureIds: [],
  },
  {
    id: "ai-data-center-one-stop-application",
    name: "AI 데이터센터 인허가 일괄처리 신청·심사",
    aliases: ["AI 데이터센터 일괄처리 신청"],
    description: "AI 데이터센터 사업자등이 특별법 제18조의 인허가군을 과학기술정보통신부에 일괄신청하고 사전검토·보완·전략위원회 심의를 거치는 절차입니다.",
    outcome: "일괄처리 관계기관 요청 및 심사 진행",
    stage: "SITE_REVIEW",
    actionType: "REVIEW",
    domain: "AI 데이터센터",
    lane: "CENTRAL_OR_REGIONAL_OFFICE",
    applicant: "AI 데이터센터 사업자 또는 AI 데이터센터를 구축·운영하려는 자",
    receivingAuthority: "과학기술정보통신부",
    statutoryDecisionMaker: "과학기술정보통신부장관 및 관계기관의 장",
    consultationAuthorities: ["국가인공지능전략위원회", "개별 인허가 관계기관"],
    submissions: ["일괄처리 신청서", "대상 인허가별 신청서류", "시설·입지·전력·건축계획", "하위법령에서 정할 자료"],
    validity: "신청 사업계획과 인허가별 관계기관 처리결과에 따름",
    followUpObligations: ["보완요구 대응", "관계기관별 인허가 결과와 조건 확인"],
    ruleIds: ["rule-aidc-one-stop-application"],
    citationIds: ["cit-aidc-special-act-18", "cit-aidc-special-act-18-9"],
    durationId: "duration-aidc-one-stop-application",
    verificationStatus: "INTERNAL_REVIEWED",
    reviewedAt: "2026-08-21",
    reviewNote: "관계기관별 150·90·40일 상한은 과기정통부 요청 다음 날부터 적용되며 사전검토·보완·전략위원회 심의기간은 별도입니다.",
    deemedByProcedureIds: [],
    deemedProcedureIds: [],
  },
  {
    id: "ai-data-center-one-stop-result",
    name: "AI 데이터센터 인허가 일괄처리 결과",
    aliases: ["AI 데이터센터 일괄처리 완료"],
    description: "관계기관 처리가 끝난 뒤 과학기술정보통신부가 일괄처리 신청 결과를 통지하는 절차입니다.",
    outcome: "인허가 일괄처리 결과통지",
    stage: "PRE_CONSTRUCTION",
    actionType: "NOTICE",
    domain: "AI 데이터센터",
    lane: "CENTRAL_OR_REGIONAL_OFFICE",
    applicant: "AI 데이터센터 사업자 또는 AI 데이터센터를 구축·운영하려는 자",
    receivingAuthority: "과학기술정보통신부",
    statutoryDecisionMaker: "과학기술정보통신부장관 및 관계기관의 장",
    consultationAuthorities: ["개별 인허가 관계기관"],
    submissions: ["일괄처리 신청·보완 이력", "관계기관별 인허가 처리결과"],
    validity: "개별 인허가 결과와 조건의 유효기간에 따름",
    followUpObligations: ["관계기관별 허가조건 이행", "일괄처리 결과통지와 관련 서류 보관"],
    ruleIds: ["rule-aidc-one-stop-result"],
    citationIds: [
      "cit-aidc-special-act-18",
      "cit-aidc-special-act-18-9",
      "cit-aidc-special-act-10-2",
    ],
    durationId: "duration-aidc-one-stop-result",
    verificationStatus: "INTERNAL_REVIEWED",
    reviewedAt: "2026-08-21",
    reviewNote: "완료 상태는 사용자가 실제 일괄처리를 받은 사실을 확인한 경우에만 선택해야 합니다.",
    deemedByProcedureIds: [],
    deemedProcedureIds: ["ai-data-center-business-report"],
  },
  {
    id: "ai-data-center-business-report",
    name: "AI 데이터센터 입지·운영 신고",
    aliases: ["AI 데이터센터 신고"],
    description: "AI 데이터센터 사업자 또는 AI 데이터센터를 구축·운영하려는 자가 구축장소와 운영목적 등 대통령령으로 정하는 사항을 과학기술정보통신부에 신고하는 절차입니다.",
    outcome: "AI 데이터센터 신고",
    stage: "PLAN_AND_OCCUPANCY",
    actionType: "NOTICE",
    domain: "AI 데이터센터",
    lane: "CENTRAL_OR_REGIONAL_OFFICE",
    applicant: "AI 데이터센터 사업자 또는 AI 데이터센터를 구축·운영하려는 자",
    receivingAuthority: "과학기술정보통신부",
    statutoryDecisionMaker: "과학기술정보통신부장관",
    consultationAuthorities: [],
    submissions: ["구축장소(예정 장소 포함)", "운영목적", "대통령령·시행규칙에서 정할 신고사항과 서류"],
    validity: "구축장소 등 대통령령상 중요사항 변경 시 변경신고",
    followUpObligations: ["구축장소 등 중요사항 변경 시 변경신고"],
    ruleIds: [
      "rule-aidc-business-report-before-effective",
      "rule-aidc-business-report",
      "rule-aidc-business-report-not-qualified",
      "rule-aidc-business-report-deemed-by-one-stop",
    ],
    citationIds: ["cit-aidc-special-act-10", "cit-aidc-special-act-10-2"],
    durationId: "duration-aidc-business-report",
    verificationStatus: "INTERNAL_REVIEWED",
    reviewedAt: "2026-08-21",
    reviewNote: "최종 법률은 확인했으나 신고항목·서식은 하위법령 공포 후 갱신해야 합니다.",
    deemedByProcedureIds: ["ai-data-center-one-stop-result"],
    deemedProcedureIds: [],
  },
];

export const specialLawDurations: DurationEstimate[] = [
  {
    id: "duration-power-grid-impact-assessment",
    procedureId: "power-grid-impact-assessment",
    applicantPreparation: null,
    authorityProcessing: { min: null, base: null, max: 3, unit: "MONTH" },
    interagencyConsultation: null,
    elapsed: { min: null, base: null, max: 3, unit: "MONTH" },
    statutoryPeriod: "전력계통영향평가서 접수일부터 3개월 이내에 개선필요사항등을 통보",
    stopClockRules: ["3개월은 전력계통영향평가서 접수일부터 계산"],
    variabilityFactors: ["계통 보강대책", "평가서 보완", "전력정책심의회 심의", "관계 전기사업자 검토"],
    evidenceType: "STATUTE",
    citationIds: [
      "cit-distributed-energy-act-23",
      "cit-distributed-energy-act-24-duration",
    ],
    sampleSize: null,
    assumptions: [
      "3개월은 통상 소요기간이 아니라 일반 경로의 법정 처리상한입니다.",
      "최소·통상 일정에는 상한을 실제 예상기간으로 임의 대입하지 않습니다.",
    ],
    verifiedAt: "2026-08-21",
    legalConfidence: "HIGH",
    estimateConfidence: "LOW",
  },
  {
    id: "duration-landscape-review",
    procedureId: "landscape-review",
    applicantPreparation: null,
    authorityProcessing: null,
    interagencyConsultation: null,
    elapsed: null,
    statutoryPeriod: "전국 공통 처리기간은 확인되지 않음. 선택한 업종별 특례의 법정 처리상한은 별도 카드에 표시",
    stopClockRules: [],
    variabilityFactors: ["지역 경관계획", "관할 조례", "위원회 개최주기", "설계 보완"],
    evidenceType: "INSUFFICIENT_DATA",
    citationIds: ["cit-landscape-act-28"],
    sampleSize: null,
    assumptions: ["확인되지 않은 일반 처리기간을 임의로 생성하지 않습니다."],
    verifiedAt: "2026-08-21",
    legalConfidence: "MEDIUM",
    estimateConfidence: "UNVERIFIED",
  },
  {
    id: "duration-building-committee-review",
    procedureId: "building-committee-review",
    applicantPreparation: null,
    authorityProcessing: null,
    interagencyConsultation: null,
    elapsed: null,
    statutoryPeriod: "전국 공통 처리기간은 확인되지 않음. 선택한 업종별 특례의 법정 처리상한은 별도 카드에 표시",
    stopClockRules: [],
    variabilityFactors: ["관할 건축조례", "위원회 개최주기", "구조·피난·교통 검토", "설계 보완"],
    evidenceType: "INSUFFICIENT_DATA",
    citationIds: ["cit-building-act-4-2"],
    sampleSize: null,
    assumptions: ["확인되지 않은 일반 처리기간을 임의로 생성하지 않습니다."],
    verifiedAt: "2026-08-21",
    legalConfidence: "MEDIUM",
    estimateConfidence: "UNVERIFIED",
  },
  {
    id: "duration-aidc-one-stop-application",
    procedureId: "ai-data-center-one-stop-application",
    applicantPreparation: null,
    authorityProcessing: null,
    interagencyConsultation: null,
    elapsed: null,
    statutoryPeriod: "과기정통부 사전검토·보완과 국가인공지능전략위원회 심의의 총 처리기간은 법률에 별도 상한이 없음",
    stopClockRules: ["관계기관별 150·90·40일 상한은 과기정통부가 관계기관에 처리를 요청한 다음 날부터 시작"],
    variabilityFactors: ["신청서류 완성도", "과기정통부 보완요구", "전략위원회 심의", "대상 인허가 수"],
    evidenceType: "INSUFFICIENT_DATA",
    citationIds: ["cit-aidc-special-act-18"],
    sampleSize: null,
    assumptions: ["법에 없는 사전검토·심의기간을 임의로 생성하지 않습니다."],
    verifiedAt: "2026-08-21",
    legalConfidence: "HIGH",
    estimateConfidence: "UNVERIFIED",
  },
  {
    id: "duration-aidc-one-stop-result",
    procedureId: "ai-data-center-one-stop-result",
    applicantPreparation: null,
    authorityProcessing: null,
    interagencyConsultation: null,
    elapsed: null,
    statutoryPeriod: "관계기관별 처리가 끝난 뒤 과기정통부가 결과를 통지하지만 결과통지 자체의 별도 처리기간은 법률에 정해져 있지 않음",
    stopClockRules: [],
    variabilityFactors: ["관계기관별 인허가 처리 완료일", "일괄처리 결과 통지"],
    evidenceType: "INSUFFICIENT_DATA",
    citationIds: ["cit-aidc-special-act-18", "cit-aidc-special-act-10-2"],
    sampleSize: null,
    assumptions: ["법에 없는 결과통지 기간을 0일 또는 통상값으로 임의 산정하지 않습니다."],
    verifiedAt: "2026-08-21",
    legalConfidence: "HIGH",
    estimateConfidence: "UNVERIFIED",
  },
  {
    id: "duration-aidc-business-report",
    procedureId: "ai-data-center-business-report",
    applicantPreparation: null,
    authorityProcessing: { min: 0, base: 0, max: 0, unit: "CALENDAR_DAY" },
    interagencyConsultation: null,
    elapsed: { min: 0, base: 0, max: 0, unit: "CALENDAR_DAY" },
    statutoryPeriod: "별도 처리기간이 정해진 처분이 아닌 신고 제출일 이정표로 0일 처리",
    stopClockRules: [],
    variabilityFactors: ["하위법령상 신고항목·서식", "일괄처리 완료에 따른 신고 의제"],
    evidenceType: "STATUTE",
    citationIds: ["cit-aidc-special-act-10", "cit-aidc-special-act-10-2"],
    sampleSize: null,
    assumptions: ["0일은 승인 소요기간을 뜻하지 않고 신고 제출일을 일정 이정표로 표시한 값입니다."],
    verifiedAt: "2026-08-21",
    legalConfidence: "HIGH",
    estimateConfidence: "HIGH",
  },
];

const oneStopPermitProcedureIds = [
  "power-grid-impact-assessment",
  "energy-use-plan-consultation",
  "traffic-impact-assessment",
  "landscape-review",
  "building-committee-review",
  "building-permit",
  "fire-building-permit-consent",
] as const;

export const specialLawEdges: ProcedureEdge[] = [
  {
    id: "edge-landscape-review-to-building-permit",
    from: "landscape-review",
    to: "building-permit",
    relation: "FINISH_TO_START",
    lag: 0,
    lagUnit: "BUSINESS_DAY",
    strength: "PRACTICAL",
    conditionRuleId: "rule-landscape-review-required",
    citationIds: ["cit-landscape-act-28"],
    branchId: null,
    note: "경관심의 결과를 건축허가도서에 반영하는 통상 경로이며 관할 통합심의 운영 여부를 확인해야 합니다.",
  },
  {
    id: "edge-building-committee-review-to-building-permit",
    from: "building-committee-review",
    to: "building-permit",
    relation: "FINISH_TO_START",
    lag: 0,
    lagUnit: "BUSINESS_DAY",
    strength: "PRACTICAL",
    conditionRuleId: "rule-building-committee-review-required",
    citationIds: ["cit-building-act-4-2"],
    branchId: null,
    note: "건축위원회 심의결과를 건축허가도서에 반영하는 통상 경로이며 관할 운영절차를 확인해야 합니다.",
  },
  ...oneStopPermitProcedureIds.map((procedureId): ProcedureEdge => ({
    id: `edge-aidc-one-stop-application-to-${procedureId}`,
    from: "ai-data-center-one-stop-application",
    to: procedureId,
    relation: "FINISH_TO_START",
    lag: 0,
    lagUnit: "CALENDAR_DAY",
    strength: "PRACTICAL",
    conditionRuleId: "rule-aidc-one-stop-application",
    citationIds: ["cit-aidc-special-act-18"],
    branchId: "aidc-one-stop-route",
    note: "과기정통부 사전검토·보완과 전략위원회 심의 뒤 관계기관 요청이 이루어지는 일괄처리 경로를 표시합니다.",
  })),
  ...oneStopPermitProcedureIds.map((procedureId): ProcedureEdge => ({
    id: `edge-aidc-${procedureId}-to-one-stop-result`,
    from: procedureId,
    to: "ai-data-center-one-stop-result",
    relation: "FINISH_TO_START",
    lag: 0,
    lagUnit: "CALENDAR_DAY",
    strength: "PRACTICAL",
    conditionRuleId: "rule-aidc-one-stop-result",
    citationIds: ["cit-aidc-special-act-18"],
    branchId: "aidc-one-stop-route",
    note: "관계기관별 처리결과가 모인 뒤 과기정통부가 일괄처리 결과를 통지하는 경로를 표시합니다.",
  })),
];

export const specialLawRuleIdsByProcedure: Record<string, string[]> = Object.fromEntries(
  [...specialLawRules, ...aiDataCenterProfileRules].reduce((entries, rule) => {
    entries.set(rule.procedureId, [...(entries.get(rule.procedureId) ?? []), rule.id]);
    return entries;
  }, new Map<string, string[]>()),
);

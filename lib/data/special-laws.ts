import type {
  ApplicabilityRule,
  Condition,
  DurationEstimate,
  LegalCitation,
  LegalSource,
  Procedure,
  ProcedureEdge,
} from "@/lib/domain/schemas";
import {
  filterPlanDeemedProcedureIds,
  industrialComplexPlanDeemedProcedureIds,
  isFastTrackTargetProcedure,
  regionalSpecialZoneDeemedProcedureIds,
  semiconductorClusterPlanDeemedProcedureIds,
} from "@/lib/data/special-law-processes";

export const AI_DATA_CENTER_INDUSTRY_ID = "AI_DATA_CENTER" as const;
export const AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE = "2027-03-10" as const;

export const aiDataCenterSpecialLawIds = [
  "AIDC_ONE_STOP",
  "AIDC_GRID_IMPACT_EXEMPTION",
  "AIDC_BUILDING_STANDARDS",
  "AIDC_INDUSTRIAL_COMPLEX_LOCATION",
  "AIDC_PORT_HINTERLAND_ENTRY",
] as const;

export const automaticSpecialLawIds = [
  "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
  "SEMICONDUCTOR_CLUSTER_FAST_TRACK",
  "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING",
  "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL",
  "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING",
] as const;

export const specialLawIds = [
  ...aiDataCenterSpecialLawIds,
  ...automaticSpecialLawIds,
] as const;

export type SpecialLawId = (typeof specialLawIds)[number];
export type AiDataCenterSpecialLawId =
  (typeof aiDataCenterSpecialLawIds)[number];
export type AutomaticSpecialLawQualificationKey =
  | "advancedStrategicIndustryFastTrackConfirmed"
  | "semiconductorClusterFastTrackConfirmed"
  | "semiconductorClusterPlanDeemingConfirmed"
  | "industrialComplexPlanSpecialCaseConfirmed"
  | "regionalSpecialZonePlanDeemingConfirmed";
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
  | "LOCATION_SPECIAL_CASE"
  | "FAST_TRACK"
  | "INTEGRATED_APPROVAL"
  | "PLAN_DEEMING";

export type SpecialLawDefinition = {
  id: SpecialLawId;
  lawName?: string;
  scopeLabel?: string;
  selectionMode?: "MANUAL" | "AUTOMATIC_CONFIRMATION";
  effectiveFrom?: string;
  qualificationKey?: AutomaticSpecialLawQualificationKey;
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

const ADVANCED_STRATEGIC_INDUSTRY_ACT_URL =
  "https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=&lsId=014238";
const ADVANCED_STRATEGIC_INDUSTRY_DECREE_URL =
  "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=282935";
const SEMICONDUCTOR_SPECIAL_ACT_URL =
  "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=286559";
const INDUSTRIAL_COMPLEX_FAST_TRACK_ACT_URL =
  "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=276999";
const REGIONAL_SPECIAL_ZONE_ACT_URL =
  "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=281979";

export const specialLawDefinitions: readonly SpecialLawDefinition[] = [
  {
    id: "AIDC_ONE_STOP",
    lawName: "인공지능 데이터센터 산업 진흥에 관한 특별법",
    scopeLabel: "AI 데이터센터",
    selectionMode: "MANUAL",
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
    shortLabel: "인허가 일괄처리",
    title: "AI 데이터센터 인허가 일괄처리",
    article: "제18조",
    effect: "ONE_STOP",
    description:
      "과학기술정보통신부에 전력계통영향평가, 에너지사용계획, 교통·경관·건축 심의, 건축 인허가와 소방동의를 일괄신청할 수 있습니다. 관계기관이 법정기한까지 거부를 통지하지 않으면 기한 종료 다음 날 해당 인허가등의 처리가 완료된 것으로 봅니다.",
    conditionNote:
      "신청만으로 면제되거나 처리 완료되는 제도가 아닙니다. 과기정통부 사전검토·보완과 국가인공지능전략위원회 심의 뒤 관계기관 요청 다음 날부터 기본 처리기한이 시작되고, 주민의견 청취·특별사유 시 원칙적으로 1회 30일 이내 연장될 수 있습니다. 기한완료 의제는 적용되는 기한까지 거부 통지가 없는 경우에만 성립하며, 일괄처리를 받은 경우에만 AI 데이터센터 신고가 의제됩니다.",
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
    lawName: "인공지능 데이터센터 산업 진흥에 관한 특별법",
    scopeLabel: "AI 데이터센터",
    selectionMode: "MANUAL",
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
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
    lawName: "인공지능 데이터센터 산업 진흥에 관한 특별법",
    scopeLabel: "AI 데이터센터",
    selectionMode: "MANUAL",
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
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
    lawName: "인공지능 데이터센터 산업 진흥에 관한 특별법",
    scopeLabel: "AI 데이터센터",
    selectionMode: "MANUAL",
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
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
    lawName: "인공지능 데이터센터 산업 진흥에 관한 특별법",
    scopeLabel: "AI 데이터센터",
    selectionMode: "MANUAL",
    effectiveFrom: AI_DATA_CENTER_SPECIAL_ACT_EFFECTIVE_DATE,
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
  {
    id: "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
    lawName: "국가첨단전략산업 경쟁력 강화 및 보호에 관한 특별조치법",
    scopeLabel: "전략산업 특화단지",
    selectionMode: "AUTOMATIC_CONFIRMATION",
    effectiveFrom: "2023-07-01",
    qualificationKey: "advancedStrategicIndustryFastTrackConfirmed",
    shortLabel: "국가첨단전략산업 신속처리",
    title: "전략산업 특화단지 인허가 신속처리",
    article: "제19조",
    effect: "FAST_TRACK",
    description:
      "특화단지 사업시행자의 제19조제1항 열거 인허가등이 지연되어 조성·운영에 현저한 지장이 우려되는 경우, 위원회 심의·의결을 거쳐 산업통상부장관이 인허가권자에게 신속처리를 요청하는 절차입니다. 처리계획 회신·처리결과 통보의 특례 단계기한을 지키지 않은 경우에만 장관 요청일부터 60일이 지난 날 처리가 완료된 것으로 봅니다.",
    conditionNote:
      "반도체·디스플레이, 이차전지, 바이오 업종명만으로는 적용되지 않습니다. 법정 특화단지 사업시행자 지위, 인허가 지연과 현저한 지장 우려, 위원회 의결, 산업통상부장관의 실제 요청일을 모두 확인해야 하며, 제19조제1항이 열거·인용한 범위에 속하는 대상 인허가만 반영합니다.",
    affectedProcedureIds: [],
    officialUrl: ADVANCED_STRATEGIC_INDUSTRY_ACT_URL,
  },
  {
    id: "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING",
    lawName: "반도체산업 경쟁력 강화 및 지원에 관한 특별법",
    scopeLabel: "반도체클러스터 조성계획",
    selectionMode: "AUTOMATIC_CONFIRMATION",
    effectiveFrom: "2026-08-11",
    qualificationKey: "semiconductorClusterPlanDeemingConfirmed",
    shortLabel: "반도체클러스터 계획승인 의제",
    title: "반도체클러스터 조성계획 승인 시 개별 인허가 의제",
    article: "제26조",
    effect: "PLAN_DEEMING",
    description:
      "산업통상부장관의 반도체클러스터 조성계획 승인·변경승인 때, 계획에 포함되고 관계기관과 필요한 사전협의·승인을 거친 법정 열거 인허가만 받은 것으로 보는 경로입니다.",
    conditionNote:
      "반도체 업종이나 특화단지 소재만으로는 적용되지 않습니다. 법정 반도체클러스터, 조성계획의 실제 승인·고시, 인허가별 서류 포함과 관계기관 사전협의·승인을 항목별로 확인해야 합니다.",
    affectedProcedureIds: semiconductorClusterPlanDeemedProcedureIds,
    officialUrl: SEMICONDUCTOR_SPECIAL_ACT_URL,
  },
  {
    id: "SEMICONDUCTOR_CLUSTER_FAST_TRACK",
    lawName: "반도체산업 경쟁력 강화 및 지원에 관한 특별법",
    scopeLabel: "반도체클러스터",
    selectionMode: "AUTOMATIC_CONFIRMATION",
    effectiveFrom: "2026-08-11",
    qualificationKey: "semiconductorClusterFastTrackConfirmed",
    shortLabel: "반도체클러스터 신속처리",
    title: "반도체클러스터 인허가 신속처리",
    article: "제27조",
    effect: "FAST_TRACK",
    description:
      "반도체클러스터 부지 조성 사업시행자 등 법정 신청자의 제26조 열거 인허가등이 지연되어 조성·운영에 현저한 지장이 우려되는 경우, 위원회 심의·의결 후 산업통상부장관이 신속처리를 요청하는 절차입니다. 처리계획 회신·처리결과 통보의 특례 단계기한을 지키지 않은 경우에만 장관 요청일로부터 60일이 지난 날 처리가 완료된 것으로 봅니다.",
    conditionNote:
      "반도체 업종·국가첨단전략산업 특화단지와 법정 반도체클러스터는 동일하지 않습니다. 법정 신청자 지위, 지연과 현저한 지장 우려, 위원회 의결, 장관의 실제 요청일을 모두 확인해야 하며, 제26조 각 호 범위에 속하는 대상 인허가만 반영합니다.",
    affectedProcedureIds: [],
    officialUrl: SEMICONDUCTOR_SPECIAL_ACT_URL,
  },
  {
    id: "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL",
    lawName: "산업단지 인·허가 절차 간소화를 위한 특례법",
    scopeLabel: "산업단지계획",
    selectionMode: "AUTOMATIC_CONFIRMATION",
    effectiveFrom: "2008-09-06",
    qualificationKey: "industrialComplexPlanSpecialCaseConfirmed",
    shortLabel: "산업단지계획 통합승인·의제",
    title: "산업단지계획 통합승인 및 관련 인허가 의제",
    article: "제15조·제16조 / 산업입지법 제21조",
    effect: "INTEGRATED_APPROVAL",
    description:
      "산업단지계획 승인 절차로 지정·개발계획과 실시계획을 통합 처리하고, 계획에 서류가 포함되어 관계기관과 협의된 개발행위·농지·산지·하천·공유수면·건축 등의 인허가는 실시계획 승인 시 의제될 수 있습니다. 민간기업등의 승인신청은 접수일부터 6개월 이내 승인 여부를 결정해야 합니다.",
    conditionNote:
      "기존 산업단지에 입주하는 것만으로는 적용되지 않습니다. 이번 사업이 산업단지계획의 수립·변경 승인 대상이고, 의제할 개별 인허가 서류가 계획에 포함되어 관계기관 협의를 거치는 경로인지 확인해야 합니다.",
    affectedProcedureIds: industrialComplexPlanDeemedProcedureIds,
    officialUrl: INDUSTRIAL_COMPLEX_FAST_TRACK_ACT_URL,
  },
  {
    id: "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING",
    lawName: "규제자유특구 및 지역특화발전특구에 관한 규제특례법",
    scopeLabel: "지역특화발전특구",
    selectionMode: "AUTOMATIC_CONFIRMATION",
    effectiveFrom: "2019-04-17",
    qualificationKey: "regionalSpecialZonePlanDeemingConfirmed",
    shortLabel: "지역특화발전특구계획 의제",
    title: "지역특화발전특구 토지이용계획 인허가 의제",
    article: "제64조·제65조",
    effect: "PLAN_DEEMING",
    description:
      "특구토지이용계획이 포함된 특화특구계획을 승인할 때, 계획에 포함되고 관계기관과 미리 협의된 개발행위·농지·산지·하천·공유수면 등의 허가를 받은 것으로 볼 수 있습니다.",
    conditionNote:
      "해당 시·군에 특구가 있다는 사실만으로는 적용되지 않습니다. 사업이 승인 대상 특화특구계획에 포함되고, 의제할 인허가 서류가 계획에 반영되어 관계기관 사전협의를 거치는지를 확인해야 합니다. 규제자유특구 지정 자체의 일반 면제로 보지 않습니다.",
    affectedProcedureIds: regionalSpecialZoneDeemedProcedureIds,
    officialUrl: REGIONAL_SPECIAL_ZONE_ACT_URL,
  },
] as const;

type SpecialLawScenario = {
  assessmentDate: string;
  province: string;
  insideIndustrialComplex: boolean | null;
  industryCategory: string;
  aiDataCenterActFacilityConfirmed: boolean | null;
  aiDataCenterOneStopStatus: "NOT_APPLIED" | "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  appliedSpecialLawIds: readonly AiDataCenterSpecialLawId[];
  advancedStrategicIndustryFastTrackConfirmed: boolean | null;
  advancedStrategicIndustryApplicantRoleConfirmed: boolean | null;
  advancedStrategicIndustryDelayRiskConfirmed: boolean | null;
  advancedStrategicIndustryCommitteeResolved: boolean | null;
  advancedStrategicIndustryMinisterRequestDate: string | null;
  advancedStrategicIndustryFastTrackPermitIds: readonly string[];
  semiconductorClusterFastTrackConfirmed: boolean | null;
  semiconductorClusterApplicantRoleConfirmed: boolean | null;
  semiconductorClusterDelayRiskConfirmed: boolean | null;
  semiconductorClusterCommitteeResolved: boolean | null;
  semiconductorClusterMinisterRequestDate: string | null;
  semiconductorClusterFastTrackPermitIds: readonly string[];
  semiconductorClusterPlanDeemingConfirmed: boolean | null;
  semiconductorClusterPlanDocumentsIncluded: boolean | null;
  semiconductorClusterPlanConsultationCompleted: boolean | null;
  semiconductorClusterPlanApprovalPublished: boolean | null;
  semiconductorClusterPlanApprovalPublishedDate: string | null;
  semiconductorClusterPlanApprovalNoticeReference: string;
  semiconductorClusterPlanIncludedPermitIds: readonly string[];
  industrialComplexPlanSpecialCaseConfirmed: boolean | null;
  industrialComplexPlanDocumentsIncluded: boolean | null;
  industrialComplexPlanConsultationCompleted: boolean | null;
  industrialComplexPlanApprovalPublished: boolean | null;
  industrialComplexPlanApprovalPublishedDate: string | null;
  industrialComplexPlanApprovalNoticeReference: string;
  industrialComplexPlanIncludedPermitIds: readonly string[];
  regionalSpecialZonePlanDeemingConfirmed: boolean | null;
  regionalSpecialZonePlanDocumentsIncluded: boolean | null;
  regionalSpecialZonePlanConsultationCompleted: boolean | null;
  regionalSpecialZonePlanApprovalPublished: boolean | null;
  regionalSpecialZonePlanApprovalPublishedDate: string | null;
  regionalSpecialZonePlanApprovalNoticeReference: string;
  regionalSpecialZonePlanIncludedPermitIds: readonly string[];
};

const advancedStrategicIndustryCandidateIds = new Set([
  "SEMICONDUCTOR_ELECTRONICS",
  "SECONDARY_BATTERY_CHEMICAL",
  "PHARMACEUTICAL_BIO",
]);

export function getAiDataCenterSpecialLawDefinitions() {
  return specialLawDefinitions.filter(
    (item) => item.selectionMode === "MANUAL",
  );
}

export function getAutomaticSpecialLawDefinitions(
  answers: Pick<
    SpecialLawScenario,
    "province" | "insideIndustrialComplex" | "industryCategory"
  >,
) {
  return specialLawDefinitions.filter((definition) => {
    if (definition.selectionMode !== "AUTOMATIC_CONFIRMATION") return false;
    if (definition.id === "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK") {
      return advancedStrategicIndustryCandidateIds.has(answers.industryCategory);
    }
    if (definition.id === "SEMICONDUCTOR_CLUSTER_FAST_TRACK") {
      return answers.industryCategory === "SEMICONDUCTOR_ELECTRONICS";
    }
    if (definition.id === "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING") {
      return answers.industryCategory === "SEMICONDUCTOR_ELECTRONICS";
    }
    if (definition.id === "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL") {
      // 산업단지계획은 기존 산단 입주기업뿐 아니라 신규 지정·계획변경
      // 사업시행자도 사용할 수 있는 경로이므로 소재 여부로 후보를 막지 않는다.
      return Boolean(answers.province.trim());
    }
    if (definition.id === "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING") {
      return Boolean(answers.province.trim());
    }
    return false;
  });
}

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

  for (const definition of getAutomaticSpecialLawDefinitions(answers)) {
    const qualificationKey = definition.qualificationKey;
    if (!qualificationKey) continue;
    const confirmed = answers[qualificationKey];
    if (confirmed === false) continue;
    if (
      definition.effectiveFrom &&
      answers.assessmentDate < definition.effectiveFrom
    ) {
      evaluations.push({
        ...definition,
        status: "FUTURE",
        statusLabel: "시행 전",
        statusNote: `이 특례의 시행일 ${definition.effectiveFrom} 전이므로 현재 인허가 판정에는 반영하지 않았습니다.`,
      });
      continue;
    }
    if (confirmed !== true) {
      evaluations.push({
        ...definition,
        status: "UNCONFIRMED",
        statusLabel: "요건 확인 필요",
        statusNote:
          "업종·지역·산업단지 입력으로 검토 후보를 자동 표시했습니다. 사업시행자 지위, 승인계획 포함, 신속처리 요청 또는 관계기관 사전협의 요건이 확인되기 전에는 절차를 면제하거나 일정을 줄이지 않습니다.",
      });
      continue;
    }

    const fastTrackChecklist =
      definition.id === "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK"
        ? {
            role: answers.advancedStrategicIndustryApplicantRoleConfirmed,
            delay: answers.advancedStrategicIndustryDelayRiskConfirmed,
            committee: answers.advancedStrategicIndustryCommitteeResolved,
            requestDate: answers.advancedStrategicIndustryMinisterRequestDate,
            includedCount: answers.advancedStrategicIndustryFastTrackPermitIds.length,
          }
        : definition.id === "SEMICONDUCTOR_CLUSTER_FAST_TRACK"
          ? {
              role: answers.semiconductorClusterApplicantRoleConfirmed,
              delay: answers.semiconductorClusterDelayRiskConfirmed,
              committee: answers.semiconductorClusterCommitteeResolved,
              requestDate: answers.semiconductorClusterMinisterRequestDate,
              includedCount: answers.semiconductorClusterFastTrackPermitIds.length,
            }
          : null;
    if (
      fastTrackChecklist &&
      (fastTrackChecklist.role !== true ||
        fastTrackChecklist.delay !== true ||
        fastTrackChecklist.committee !== true ||
        fastTrackChecklist.requestDate === null ||
        (definition.effectiveFrom !== undefined &&
          fastTrackChecklist.requestDate < definition.effectiveFrom) ||
        fastTrackChecklist.requestDate > answers.assessmentDate ||
        fastTrackChecklist.includedCount === 0)
    ) {
      const missing = [
        ...(fastTrackChecklist.role === true ? [] : ["법정 신청자·사업시행자 지위"]),
        ...(fastTrackChecklist.delay === true ? [] : ["인허가 지연·현저한 지장 우려"]),
        ...(fastTrackChecklist.committee === true ? [] : ["위원회 심의·의결"]),
        ...(fastTrackChecklist.requestDate
          ? definition.effectiveFrom &&
            fastTrackChecklist.requestDate < definition.effectiveFrom
            ? [`법 시행일(${definition.effectiveFrom}) 이후의 장관 요청일`]
            : fastTrackChecklist.requestDate > answers.assessmentDate
              ? ["검토 기준일까지 실제로 도래한 장관 요청일"]
              : []
          : ["산업통상부장관의 인허가권자 요청일"]),
        ...(fastTrackChecklist.includedCount > 0 ? [] : ["신속처리 요청 공문에 포함된 인허가"]),
      ];
      evaluations.push({
        ...definition,
        status: "UNCONFIRMED",
        statusLabel: "신속처리 증빙 필요",
        statusNote: `${missing.join(" · ")}가 확인되지 않아 신속처리 절차와 60일 조건을 적용하지 않았습니다.`,
      });
      continue;
    }

    const deemingChecklist =
      definition.id === "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL"
        ? {
            documents: answers.industrialComplexPlanDocumentsIncluded,
            consultation: answers.industrialComplexPlanConsultationCompleted,
            approvalPublished: answers.industrialComplexPlanApprovalPublished,
            approvalPublishedDate: answers.industrialComplexPlanApprovalPublishedDate,
            approvalNoticeReference: answers.industrialComplexPlanApprovalNoticeReference,
            includedCount: filterPlanDeemedProcedureIds(
              "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL",
              answers.industrialComplexPlanIncludedPermitIds,
            ).length,
          }
        : definition.id === "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING"
          ? {
              documents: answers.semiconductorClusterPlanDocumentsIncluded,
              consultation: answers.semiconductorClusterPlanConsultationCompleted,
              approvalPublished: answers.semiconductorClusterPlanApprovalPublished,
              approvalPublishedDate: answers.semiconductorClusterPlanApprovalPublishedDate,
              approvalNoticeReference: answers.semiconductorClusterPlanApprovalNoticeReference,
              includedCount: filterPlanDeemedProcedureIds(
                "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING",
                answers.semiconductorClusterPlanIncludedPermitIds,
              ).length,
            }
        : definition.id === "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING"
          ? {
              documents: answers.regionalSpecialZonePlanDocumentsIncluded,
              consultation: answers.regionalSpecialZonePlanConsultationCompleted,
              approvalPublished: answers.regionalSpecialZonePlanApprovalPublished,
              approvalPublishedDate: answers.regionalSpecialZonePlanApprovalPublishedDate,
              approvalNoticeReference: answers.regionalSpecialZonePlanApprovalNoticeReference,
              includedCount: filterPlanDeemedProcedureIds(
                "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING",
                answers.regionalSpecialZonePlanIncludedPermitIds,
              ).length,
            }
          : null;
    if (
      deemingChecklist &&
      (deemingChecklist.documents !== true ||
        deemingChecklist.consultation !== true ||
        deemingChecklist.approvalPublished !== true ||
        deemingChecklist.approvalPublishedDate === null ||
        (definition.effectiveFrom !== undefined &&
          deemingChecklist.approvalPublishedDate < definition.effectiveFrom) ||
        deemingChecklist.approvalPublishedDate > answers.assessmentDate ||
        deemingChecklist.approvalNoticeReference.trim().length === 0 ||
        deemingChecklist.includedCount === 0)
    ) {
      const missing = [
        ...(deemingChecklist.documents === true ? [] : ["의제별 법정서류의 상위 계획 반영"]),
        ...(deemingChecklist.consultation === true ? [] : ["관계기관 협의 완료"]),
        ...(deemingChecklist.approvalPublished === true
          ? []
          : ["계획 승인·고시 완료"]),
        ...(deemingChecklist.approvalPublishedDate
          ? definition.effectiveFrom &&
            deemingChecklist.approvalPublishedDate < definition.effectiveFrom
            ? [`법 시행일(${definition.effectiveFrom}) 이후의 승인·고시일`]
            : deemingChecklist.approvalPublishedDate > answers.assessmentDate
              ? ["검토 기준일까지 도래한 승인·고시일"]
              : []
          : ["승인·고시일"]),
        ...(deemingChecklist.approvalNoticeReference.trim()
          ? []
          : ["승인·고시문 번호 또는 공식 URL"]),
        ...(deemingChecklist.includedCount > 0
          ? []
          : ["실제 의제대상 인허가 항목 선택"]),
      ];
      evaluations.push({
        ...definition,
        status: "UNCONFIRMED",
        statusLabel: "의제요건 확인 필요",
        statusNote: `${missing.join(" · ")}가 확인되지 않아 개별 인허가를 면제·의제 처리하지 않았습니다. 계획승인 후보 경로만 검토하세요.`,
      });
      continue;
    }

    const statusNoteById: Partial<Record<SpecialLawId, string>> = {
      ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:
        "전략산업 특화단지 사업시행자와 산업통상부장관의 신속처리 요청 대상임을 확인한 입력으로 관련 절차에 신속처리 경로를 표시합니다. 요청목록에 포함되지 않은 개별 인허가에는 적용되지 않습니다. 처리계획 회신일·처리결과 통지일·연장 요청 및 사유는 별도 증빙이 없어 일정과 처리완료 의제를 자동 확정하지 않습니다.",
      SEMICONDUCTOR_CLUSTER_FAST_TRACK:
        "반도체클러스터 사업시행자와 산업통상부장관의 신속처리 요청 대상임을 확인한 입력으로 관련 절차에 신속처리 경로를 표시합니다. 요청목록에 포함되지 않은 개별 인허가에는 적용되지 않습니다. 처리계획 회신일·처리결과 통지일·연장 요청 및 사유는 별도 증빙이 없어 일정과 처리완료 의제를 자동 확정하지 않습니다.",
      SEMICONDUCTOR_CLUSTER_PLAN_DEEMING:
        "반도체클러스터 조성계획의 승인·고시, 인허가별 서류 포함과 관계기관 사전협의·승인을 확인한 항목만 계획승인 의제로 표시합니다.",
      INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL:
        "산업단지계획 승인 대상과 의제서류 포함·관계기관 협의 경로를 확인한 입력으로 통합승인·의제 가능성을 표시합니다. 기존 산업단지 입주만으로 개별 인허가가 면제되는 것은 아닙니다.",
      REGIONAL_SPECIAL_ZONE_PLAN_DEEMING:
        "승인 대상 특화특구계획에 사업과 의제서류가 포함되고 관계기관 사전협의를 거치는 경로를 확인한 입력으로 계획승인 의제를 표시합니다. 지역 소재지만으로 적용한 결과가 아닙니다.",
    };
    evaluations.push({
      ...definition,
      status: "ACTIVE",
      statusLabel: "요건 확인",
      statusNote:
        statusNoteById[definition.id] ??
        "법정 적용요건을 확인한 입력으로 특례 검토 결과에 반영했습니다.",
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
  FAST_TRACK: "신속처리",
  INTEGRATED_APPROVAL: "통합승인·의제",
  PLAN_DEEMING: "계획승인 의제",
};

const citationIdsByLaw: Record<SpecialLawId, string[]> = {
  AIDC_ONE_STOP: ["cit-aidc-special-act-18", "cit-aidc-special-act-18-9"],
  AIDC_GRID_IMPACT_EXEMPTION: ["cit-aidc-special-act-19"],
  AIDC_BUILDING_STANDARDS: ["cit-aidc-special-act-21"],
  AIDC_INDUSTRIAL_COMPLEX_LOCATION: ["cit-aidc-special-act-22"],
  AIDC_PORT_HINTERLAND_ENTRY: ["cit-aidc-special-act-23"],
  ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK: [
    "cit-advanced-strategic-industry-act-19-applicability",
    "cit-advanced-strategic-industry-act-19-deeming",
    "cit-advanced-strategic-industry-decree-30",
  ],
  SEMICONDUCTOR_CLUSTER_FAST_TRACK: [
    "cit-semiconductor-special-act-27-applicability",
    "cit-semiconductor-special-act-27-deeming",
  ],
  SEMICONDUCTOR_CLUSTER_PLAN_DEEMING: [
    "cit-semiconductor-special-act-26-deeming",
  ],
  INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL: [
    "cit-industrial-complex-fast-track-act-15",
    "cit-industrial-complex-fast-track-act-16",
    "cit-industrial-location-act-21",
  ],
  REGIONAL_SPECIAL_ZONE_PLAN_DEEMING: [
    "cit-regional-special-zone-act-64-65",
  ],
};

const statutoryCapsByLaw: Partial<Record<SpecialLawId, string>> = {
  ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK:
    "장관 요청 후 처리계획 15일(보완기간 제외, 늦어도 30일) · 계획 제출 후 결과 15일(불가피한 경우 1회 15일 연장) · 해당 단계 기한 미준수 시에만 장관 요청일부터 60일 경과일에 처리 완료로 봄 · 허가 승인으로 단정하지 않음",
  SEMICONDUCTOR_CLUSTER_FAST_TRACK:
    "장관 요청 후 처리계획 15일(보완기간 제외, 늦어도 30일) · 계획 제출 후 결과 15일(불가피한 경우 1회 15일 연장) · 해당 단계 기한 미준수 시에만 장관 요청일부터 60일 경과일에 처리 완료로 봄 · 허가 승인으로 단정하지 않음",
  INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL:
    "민간기업등의 산업단지계획 승인신청 접수일부터 6개월 이내 승인 여부 결정 · 개별 의제는 서류 포함과 관계기관 협의 전제 · 일반 일정 자동 단축 없음",
};

export function specialLawImpactsForProcedure(
  answers: SpecialLawScenario,
  procedure: Pick<Procedure, "id" | "actionType" | "domain">,
): SpecialLawImpact[] {
  const procedureId = procedure.id;
  return evaluateSelectedSpecialLaws(answers).flatMap((evaluation) => {
    if (
      (evaluation.id === "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK" ||
        evaluation.id === "SEMICONDUCTOR_CLUSTER_FAST_TRACK") &&
      !isFastTrackTargetProcedure(evaluation.id, procedure)
    ) return [];
    const affectedProcedureIds =
      evaluation.id === "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK"
        ? answers.advancedStrategicIndustryFastTrackPermitIds
        : evaluation.id === "SEMICONDUCTOR_CLUSTER_FAST_TRACK"
          ? answers.semiconductorClusterFastTrackPermitIds
          : evaluation.affectedProcedureIds;
    if (!affectedProcedureIds.includes(procedureId)) return [];
    if (
      evaluation.id === "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL" &&
      !answers.industrialComplexPlanIncludedPermitIds.includes(procedureId)
    ) return [];
    if (
      evaluation.id === "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING" &&
      !answers.semiconductorClusterPlanIncludedPermitIds.includes(procedureId)
    ) return [];
    if (
      evaluation.id === "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING" &&
      !answers.regionalSpecialZonePlanIncludedPermitIds.includes(procedureId)
    ) return [];
    if (
      evaluation.selectionMode === "AUTOMATIC_CONFIRMATION" &&
      evaluation.status !== "ACTIVE"
    ) {
      return [];
    }
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
        : statutoryCapsByLaw[evaluation.id]
          ? { statutoryCap: statutoryCapsByLaw[evaluation.id] }
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
    id: "src-advanced-strategic-industry-act-20260602",
    title: "국가첨단전략산업 경쟁력 강화 및 보호에 관한 특별조치법",
    documentType: "ACT",
    issuingAuthority: "산업통상부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: "014238",
    mst: null,
    proclamationDate: "2026-06-02",
    proclamationNumber: "21738",
    effectiveDate: "2026-06-02",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-current-law-id-014238-review-20260821",
    officialUrl: ADVANCED_STRATEGIC_INDUSTRY_ACT_URL,
    status: "AUTHORITATIVE",
  },
  {
    id: "src-advanced-strategic-industry-decree-20260201",
    title: "국가첨단전략산업 경쟁력 강화 및 보호에 관한 특별조치법 시행령",
    documentType: "ENFORCEMENT_DECREE",
    issuingAuthority: "산업통상부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: "014320",
    mst: "282935",
    proclamationDate: "2026-01-27",
    proclamationNumber: "36055",
    effectiveDate: "2026-02-01",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-text-282935",
    officialUrl: ADVANCED_STRATEGIC_INDUSTRY_DECREE_URL,
    status: "AUTHORITATIVE",
  },
  {
    id: "src-semiconductor-special-act-20260811",
    title: "반도체산업 경쟁력 강화 및 지원에 관한 특별법",
    documentType: "ACT",
    issuingAuthority: "산업통상부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: "015044",
    mst: "286559",
    proclamationDate: "2026-06-02",
    proclamationNumber: "21738",
    effectiveDate: "2026-08-11",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-text-286559",
    officialUrl: SEMICONDUCTOR_SPECIAL_ACT_URL,
    status: "AUTHORITATIVE",
  },
  {
    id: "src-industrial-complex-fast-track-act-20251001",
    title: "산업단지 인·허가 절차 간소화를 위한 특례법",
    documentType: "ACT",
    issuingAuthority: "국토교통부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: null,
    mst: "276999",
    proclamationDate: "2025-10-01",
    proclamationNumber: "21065",
    effectiveDate: "2025-10-01",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-text-276999",
    officialUrl: INDUSTRIAL_COMPLEX_FAST_TRACK_ACT_URL,
    status: "AUTHORITATIVE",
  },
  {
    id: "src-industrial-location-act-20260102",
    title: "산업입지 및 개발에 관한 법률",
    documentType: "ACT",
    issuingAuthority: "국토교통부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: null,
    mst: "277001",
    proclamationDate: "2025-10-01",
    proclamationNumber: "21065",
    effectiveDate: "2026-01-02",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-text-277001",
    officialUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=277001",
    status: "AUTHORITATIVE",
  },
  {
    id: "src-regional-special-zone-act-20260701",
    title: "규제자유특구 및 지역특화발전특구에 관한 규제특례법",
    documentType: "ACT",
    issuingAuthority: "중소벤처기업부",
    jurisdictionCode: null,
    industrialComplexId: null,
    lawId: "009641",
    mst: "281979",
    proclamationDate: "2025-12-30",
    proclamationNumber: "21285",
    effectiveDate: "2026-07-01",
    repealDate: null,
    apiRetrievedAt: null,
    internallyVerifiedAt: "2026-08-21",
    contentHash: "official-text-281979",
    officialUrl: REGIONAL_SPECIAL_ZONE_ACT_URL,
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
    summary: "5개 인허가군을 과기정통부에 일괄신청할 수 있고 관계기관 요청 다음 날부터 150일·90일·40일의 기본 처리기한을 둔다. 주민의견 청취 또는 특별한 사유가 있으면 원칙적으로 1회 30일 이내 연장할 수 있다.",
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
  {
    id: "cit-advanced-strategic-industry-act-19-applicability",
    sourceId: "src-advanced-strategic-industry-act-20260602",
    article: "제19조",
    paragraph: "제1항·제2항",
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "현행본 대조 · 제19조 신속처리 특례 시행 2023-07-01",
    summary: "전략산업 특화단지 사업시행자는 제19조제1항에 열거된 인허가등이 지연되어 현저한 지장이 우려될 때 신속처리를 신청할 수 있고, 장관은 위원회 심의·의결 후 해당 인허가권자에게 요청할 수 있다.",
  },
  {
    id: "cit-advanced-strategic-industry-act-19-deeming",
    sourceId: "src-advanced-strategic-industry-act-20260602",
    article: "제19조",
    paragraph: "제5항",
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "현행본 대조 · 제19조제5항 시행 2023-07-01",
    summary: "인허가권자가 처리계획 회신기한 또는 처리결과 통보기한을 지키지 않은 경우에만 장관 요청일부터 60일이 지난 날 인허가등의 처리가 완료된 것으로 본다.",
  },
  {
    id: "cit-advanced-strategic-industry-decree-30",
    sourceId: "src-advanced-strategic-industry-decree-20260201",
    article: "제30조",
    paragraph: "제2항",
    subparagraph: null,
    item: "제1호·제2호",
    role: "APPLICABILITY",
    sourceVersion: "시행 2026-02-01",
    summary: "법 제19조제1항제5호의 신속처리 대상에 경관법 제27조제1항의 개발사업 경관심의와 건축법 제22조에 따라 제출된 사용승인신청서의 검사 및 결과 통보를 포함한다.",
  },
  {
    id: "cit-semiconductor-special-act-26-deeming",
    sourceId: "src-semiconductor-special-act-20260811",
    article: "제26조",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "시행 2026-08-11",
    summary: "반도체클러스터 조성계획 승인·변경승인 시 계획에 포함되고 관계기관과 필요한 사전협의·승인을 거친 법정 열거 인허가만 받은 것으로 본다.",
  },
  {
    id: "cit-semiconductor-special-act-27-applicability",
    sourceId: "src-semiconductor-special-act-20260811",
    article: "제27조",
    paragraph: "제1항·제2항",
    subparagraph: null,
    item: null,
    role: "APPLICABILITY",
    sourceVersion: "시행 2026-08-11",
    summary: "반도체클러스터 부지·산업기반시설 조성의 법정 신청자는 제26조 각 호 인허가등이 지연되어 현저한 지장이 우려될 때 신속처리를 신청할 수 있고, 장관은 위원회 심의·의결 후 해당 인허가권자에게 요청할 수 있다.",
  },
  {
    id: "cit-semiconductor-special-act-27-deeming",
    sourceId: "src-semiconductor-special-act-20260811",
    article: "제27조",
    paragraph: "제5항",
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "시행 2026-08-11",
    summary: "인허가권자가 처리계획 회신기한 또는 처리결과 통보기한을 지키지 않은 경우에만 장관 요청일부터 60일이 지난 날 인허가등의 처리가 완료된 것으로 본다.",
  },
  {
    id: "cit-industrial-complex-fast-track-act-15",
    sourceId: "src-industrial-complex-fast-track-act-20251001",
    article: "제15조·제15조의2",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "시행 2025-10-01",
    summary: "산업단지계획 승인·고시와 변경승인 절차를 두고, 경미한 변경은 의견청취와 위원회 심의의 일부를 생략할 수 있다.",
  },
  {
    id: "cit-industrial-complex-fast-track-act-16",
    sourceId: "src-industrial-complex-fast-track-act-20251001",
    article: "제16조",
    paragraph: "제1항",
    subparagraph: null,
    item: null,
    role: "DURATION",
    sourceVersion: "시행 2025-10-01",
    summary: "지정권자는 민간기업등의 산업단지계획 승인신청을 접수한 날부터 6개월 이내에 승인 여부를 결정하여 통지해야 한다.",
  },
  {
    id: "cit-industrial-location-act-21",
    sourceId: "src-industrial-location-act-20260102",
    article: "제21조",
    paragraph: "제1항·제3항",
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "시행 2026-01-02",
    summary: "실시계획 승인 시 필요한 서류를 제출하고 관계기관과 협의한 개발행위·농지·산지·하천·공유수면·건축 등의 인허가를 받은 것으로 보며, 관계기관은 협의요청을 받은 날부터 15일 이내 의견을 제출한다.",
  },
  {
    id: "cit-regional-special-zone-act-64-65",
    sourceId: "src-regional-special-zone-act-20260701",
    article: "제64조·제65조",
    paragraph: null,
    subparagraph: null,
    item: null,
    role: "DEEMING",
    sourceVersion: "현행 2026-07-01 · 현 조문 체계 시행 2019-04-17",
    summary: "특구토지이용계획이 포함된 특화특구계획 승인 시 도시·군관리계획결정 등이 의제되고, 계획에 포함되며 관계기관과 미리 협의된 개발행위·농지·산지·하천·공유수면 등의 허가를 받은 것으로 본다.",
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
    note: "과기정통부 사전검토·보완과 전략위원회 심의기간은 관계기관별 기본 처리기한에 포함되지 않으며, 제18조제8항의 1회 연장 가능성도 별도 확인합니다.",
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
  {
    id: "rule-industrial-complex-occupancy-contract",
    version: "2026.08.21.1",
    procedureId: "industrial-complex-occupancy-contract",
    effect: "INCLUDE",
    effectiveFrom: "2026-07-01",
    effectiveTo: null,
    jurisdiction: nationwide,
    condition: { eq: { path: "industrialComplex.inside", value: true } },
    requiredInputs: ["industrialComplex.occupancyContractStatus"],
    missingPolicy: "INDETERMINATE",
    citationIds: [
      "cit-indcluster-38-occupancy-contract",
      "cit-indcluster-13-2-deeming",
    ],
    explanationTemplate: "산업단지 입주사업이므로 관리기관과의 입주계약 또는 중요사항 변경계약 경로를 포함합니다.",
    priority: 200,
    status: "INTERNAL_REVIEWED",
    reviewActor: "법제처 현행 법률 제38조·제13조제2항 대조",
    note: "실제 입주계약·변경계약 진행상태를 입력해야 하며, 법정 예외 여부와 접수 관리기관은 해당 산업단지 관리기관에 확인합니다.",
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
    id: "industrial-complex-occupancy-contract",
    name: "산업단지 입주계약·변경계약",
    aliases: ["산단 입주계약", "입주 변경계약"],
    description: "산업단지에서 제조업 또는 그 밖의 사업을 하려는 자가 관리기관과 체결하는 입주계약 경로입니다. 법정 중요사항을 변경하면 변경계약을 체결합니다.",
    outcome: "산업단지 입주계약서 또는 변경계약서",
    stage: "PLAN_AND_OCCUPANCY",
    actionType: "CONTRACT",
    domain: "산업단지 입주",
    lane: "INDUSTRIAL_COMPLEX_AUTHORITY",
    applicant: "산업단지에서 사업을 하려는 자 또는 입주기업체",
    receivingAuthority: "입력한 산업단지 관리기관",
    statutoryDecisionMaker: "해당 산업단지 관리기관",
    consultationAuthorities: ["관할 시장·군수·구청장(관리기관 보고 경로)"],
    submissions: [
      "입주계약 또는 변경계약 신청서",
      "사업계획서와 업종·생산품·공정 자료",
      "산업단지 관리기본계획상 입주자격 확인자료",
      "관리기관이 요구하는 공장·부지·환경 관련 자료",
    ],
    validity: "계약내용과 관리기본계획, 변경계약 대상 여부에 따름",
    followUpObligations: [
      "계약 중요사항 변경 전 변경계약 여부 확인",
      "계약조건과 산업단지 관리기본계획 준수",
      "실제 계약서와 관리기관 확인결과 보관",
    ],
    ruleIds: ["rule-industrial-complex-occupancy-contract"],
    citationIds: [
      "cit-indcluster-38-occupancy-contract",
      "cit-indcluster-13-2-deeming",
    ],
    durationId: "duration-industrial-complex-occupancy-contract",
    verificationStatus: "INTERNAL_REVIEWED",
    reviewedAt: "2026-08-21",
    reviewNote: "법 제38조의 계약의무와 제13조제2항의 공장설립 승인 의제를 대조했습니다. 구비서류·실제 접수창구·처리기간은 해당 관리기관의 관리기본계획과 안내를 확인해야 합니다.",
    deemedByProcedureIds: [],
    deemedProcedureIds: ["factory-establishment-approval"],
  },
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
    reviewNote: "관계기관별 150·90·40일 기본 처리기한은 과기정통부 요청 다음 날부터 적용됩니다. 주민의견 청취·특별사유 시 1회 30일 이내 연장 가능성과 사전검토·보완·전략위원회 심의기간을 별도로 관리합니다.",
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
    id: "duration-industrial-complex-occupancy-contract",
    procedureId: "industrial-complex-occupancy-contract",
    applicantPreparation: null,
    authorityProcessing: null,
    interagencyConsultation: null,
    elapsed: null,
    statutoryPeriod: "전국 공통 법정 처리기간은 확인되지 않음",
    stopClockRules: [],
    variabilityFactors: ["산업단지 관리기본계획", "입주업종 적합성", "관리기관 심의·보완", "변경계약 대상 여부"],
    evidenceType: "INSUFFICIENT_DATA",
    citationIds: ["cit-indcluster-38-occupancy-contract"],
    sampleSize: null,
    assumptions: ["관리기관별 처리기간을 전국 공통값으로 임의 생성하지 않습니다."],
    verifiedAt: "2026-08-21",
    legalConfidence: "HIGH",
    estimateConfidence: "UNVERIFIED",
  },
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
    statutoryPeriod: "전국 공통 처리기간은 확인되지 않음. 선택한 업종별 특례의 기본 처리기한과 연장 가능성은 별도 카드에 표시",
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
    statutoryPeriod: "전국 공통 처리기간은 확인되지 않음. 선택한 업종별 특례의 기본 처리기한과 연장 가능성은 별도 카드에 표시",
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
    stopClockRules: ["관계기관별 150·90·40일 기본 처리기한은 과기정통부가 관계기관에 처리를 요청한 다음 날부터 시작. 주민의견 청취 또는 특별사유 시 원칙적으로 1회 30일 이내 연장 가능"],
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
    id: "edge-industrial-complex-occupancy-to-completion-report",
    from: "industrial-complex-occupancy-contract",
    to: "factory-completion-report-complex",
    relation: "FINISH_TO_START",
    lag: 0,
    lagUnit: "BUSINESS_DAY",
    strength: "PRACTICAL",
    conditionRuleId: "rule-industrial-complex-occupancy-contract",
    citationIds: ["cit-indcluster-38-occupancy-contract"],
    branchId: "industrial-complex-occupancy-route",
    note: "입주계약의 승인내용과 계약조건을 반영해 공장을 설치한 뒤 완료신고로 이어지는 실행 경로를 표시합니다.",
  },
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

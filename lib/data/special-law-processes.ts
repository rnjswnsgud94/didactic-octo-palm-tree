import type {
  ApplicabilityRule,
  Condition,
  DurationEstimate,
  Procedure,
  ProcedureEdge,
} from "@/lib/domain/schemas";

const nationwide = {
  nationwide: true,
  provinces: [],
  cities: [],
  industrialComplexIds: [],
};

const selectedLaw = (lawId: string): Condition => ({
  intersects: {
    path: "strategicIndustrySpecialCase",
    values: [lawId],
  },
});

export type FastTrackLawId =
  | "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK"
  | "SEMICONDUCTOR_CLUSTER_FAST_TRACK";

export const industrialComplexPlanDeemedProcedureIds = [
  "factory-establishment-approval",
  "development-activity-permit",
  "farmland-conversion-permit",
  "forestland-conversion-permit",
  "road-occupation-permit",
  "river-occupation-permit",
  "public-water-occupation-use-permit",
  "public-water-implementation-plan-approval-report",
  "energy-use-plan-consultation",
  "building-permit",
  "private-electrical-facility-construction-plan",
  "waste-treatment-facility-installation-approval-report",
] as const;

export const regionalSpecialZoneDeemedProcedureIds = [
  "development-activity-permit",
  "farmland-conversion-permit",
  "forestland-conversion-permit",
  "road-occupation-permit",
  "river-occupation-permit",
  "public-water-occupation-use-permit",
  "public-water-implementation-plan-approval-report",
] as const;

export const semiconductorClusterPlanDeemedProcedureIds = [
  ...industrialComplexPlanDeemedProcedureIds,
  "air-emission-installation-permit",
  "water-discharge-installation-permit",
  "national-heritage-impact-diagnosis",
] as const;

export type PlanDeemingLawId =
  | "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING"
  | "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL"
  | "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING";

export const planDeemedProcedureIdsByLaw: Record<
  PlanDeemingLawId,
  readonly string[]
> = {
  SEMICONDUCTOR_CLUSTER_PLAN_DEEMING:
    semiconductorClusterPlanDeemedProcedureIds,
  INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL:
    industrialComplexPlanDeemedProcedureIds,
  REGIONAL_SPECIAL_ZONE_PLAN_DEEMING:
    regionalSpecialZoneDeemedProcedureIds,
};

export function filterPlanDeemedProcedureIds(
  lawId: PlanDeemingLawId,
  procedureIds: readonly string[],
) {
  const allowedIds = new Set(planDeemedProcedureIdsByLaw[lawId]);
  return [
    ...new Set(
      procedureIds.filter((procedureId) => allowedIds.has(procedureId)),
    ),
  ];
}

/**
 * Both fast-track Acts use a closed statutory gateway instead of every permit
 * connected to the project. The common list is the part represented in this
 * catalog of the Industrial Sites and Development Act art. 21 deemed matters
 * and the Industrial Cluster Development Act art. 13-2 deemed-matter
 * consultations.
 *
 * The national-strategic-industry Act also names rural-road occupancy and
 * buried-heritage development consultation, and its Enforcement Decree art.
 * 30(2) adds the two exact procedures appended to its own list below. The
 * catalog has no procedure whose legal source is either rural-road or
 * buried-heritage provision, so a generic Road Act permit or the newer
 * heritage-diagnosis procedure must not be substituted for them.
 */
const commonFastTrackTargetProcedureIds = [
  ...industrialComplexPlanDeemedProcedureIds,
  "air-emission-installation-permit",
  "water-discharge-installation-permit",
] as const;

export const fastTrackTargetProcedureIdsByLaw: Record<
  FastTrackLawId,
  readonly string[]
> = {
  ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK: [
    ...commonFastTrackTargetProcedureIds,
    "landscape-review",
    "building-use-approval",
  ],
  SEMICONDUCTOR_CLUSTER_FAST_TRACK: [
    ...commonFastTrackTargetProcedureIds,
    // Semiconductor Special Act art. 26(4) expressly includes this diagnosis.
    "national-heritage-impact-diagnosis",
  ],
};

export function isFastTrackTargetProcedure(
  lawId: FastTrackLawId,
  procedure: Pick<Procedure, "id">,
) {
  return fastTrackTargetProcedureIdsByLaw[lawId].includes(procedure.id);
}

export function getFastTrackTargetProcedureIds(
  lawId: FastTrackLawId,
  procedures: readonly Pick<Procedure, "id">[],
) {
  return procedures
    .filter((procedure) => isFastTrackTargetProcedure(lawId, procedure))
    .map((procedure) => procedure.id);
}

export function filterFastTrackTargetProcedureIds(
  lawId: FastTrackLawId,
  procedureIds: readonly string[],
  procedures: readonly Pick<Procedure, "id">[],
) {
  const allowedIds = new Set(
    getFastTrackTargetProcedureIds(lawId, procedures),
  );
  return [
    ...new Set(
      procedureIds.filter((procedureId) => allowedIds.has(procedureId)),
    ),
  ];
}

type FastTrackConfig = {
  lawId: FastTrackLawId;
  prefix: string;
  effectiveFrom: string;
  lawName: string;
  scope: string;
  citationIds: string[];
};

const fastTracks: FastTrackConfig[] = [
  {
    lawId: "ADVANCED_STRATEGIC_INDUSTRY_FAST_TRACK",
    prefix: "advanced-strategic-industry-fast-track",
    effectiveFrom: "2023-07-01",
    lawName: "국가첨단전략산업 특별조치법",
    scope: "전략산업 특화단지",
    citationIds: [
      "cit-advanced-strategic-industry-act-19-applicability",
      "cit-advanced-strategic-industry-act-19-deeming",
      "cit-advanced-strategic-industry-decree-30",
    ],
  },
  {
    lawId: "SEMICONDUCTOR_CLUSTER_FAST_TRACK",
    prefix: "semiconductor-cluster-fast-track",
    effectiveFrom: "2026-08-11",
    lawName: "반도체산업 특별법",
    scope: "반도체클러스터",
    citationIds: [
      "cit-semiconductor-special-act-27-applicability",
      "cit-semiconductor-special-act-27-deeming",
    ],
  },
];

type PlanConfig = {
  lawId: string;
  prefix: string;
  effectiveFrom: string;
  lawName: string;
  planName: string;
  citationIds: string[];
  deemedProcedureIds: readonly string[];
  authority: string;
  decisionMaker: string;
};

const plans: PlanConfig[] = [
  {
    lawId: "SEMICONDUCTOR_CLUSTER_PLAN_DEEMING",
    prefix: "semiconductor-cluster-plan",
    effectiveFrom: "2026-08-11",
    lawName: "반도체산업 경쟁력 강화 및 지원에 관한 특별법",
    planName: "반도체클러스터 조성계획",
    citationIds: ["cit-semiconductor-special-act-26-deeming"],
    deemedProcedureIds: semiconductorClusterPlanDeemedProcedureIds,
    authority: "산업통상부 반도체클러스터 담당부서",
    decisionMaker: "산업통상부장관 및 관계 행정기관의 장",
  },
  {
    lawId: "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL",
    prefix: "industrial-complex-plan",
    effectiveFrom: "2008-09-06",
    lawName: "산업단지 인·허가 절차 간소화 특례법",
    planName: "산업단지계획",
    citationIds: [
      "cit-industrial-complex-fast-track-act-15",
      "cit-industrial-complex-fast-track-act-16",
      "cit-industrial-location-act-21",
    ],
    deemedProcedureIds: industrialComplexPlanDeemedProcedureIds,
    authority: "산업단지 지정권자",
    decisionMaker: "산업단지 지정권자 및 산업단지계획심의위원회",
  },
  {
    lawId: "REGIONAL_SPECIAL_ZONE_PLAN_DEEMING",
    prefix: "regional-special-zone-plan",
    effectiveFrom: "2019-04-17",
    lawName: "규제자유특구 및 지역특화발전특구 규제특례법",
    planName: "특화특구계획·특구토지이용계획",
    citationIds: ["cit-regional-special-zone-act-64-65"],
    deemedProcedureIds: regionalSpecialZoneDeemedProcedureIds,
    authority: "관할 지방자치단체 특구 담당부서",
    decisionMaker: "중소벤처기업부장관 및 관계 행정기관의 장",
  },
];

const includeRule = ({
  id,
  procedureId,
  effectiveFrom,
  lawId,
  parentLawId,
  citationIds,
  explanation,
}: {
  id: string;
  procedureId: string;
  effectiveFrom: string;
  lawId: string;
  parentLawId?: string;
  citationIds: string[];
  explanation: string;
}): ApplicabilityRule => ({
  id,
  version: "2026.08.21.1",
  procedureId,
  effect: "INCLUDE",
  effectiveFrom,
  effectiveTo: null,
  jurisdiction: nationwide,
  condition: parentLawId
    ? { all: [selectedLaw(parentLawId), selectedLaw(lawId)] }
    : selectedLaw(lawId),
  requiredInputs: ["strategicIndustrySpecialCase"],
  missingPolicy: "INDETERMINATE",
  citationIds,
  explanationTemplate: explanation,
  priority: 700,
  status: "INTERNAL_REVIEWED",
  reviewActor: "법제처 현행 법률 조문 대조",
  note: "사용자가 사업시행자·요청 또는 계획·서류·협의 요건을 확인한 경우에만 활성화합니다.",
});

export const specialLawProcessRules: ApplicabilityRule[] = [
  ...fastTracks.flatMap((config) => [
    includeRule({
      id: `rule-${config.prefix}-request`,
      procedureId: `${config.prefix}-request`,
      effectiveFrom: config.effectiveFrom,
      lawId: config.lawId,
      citationIds: config.citationIds,
      explanation: `${config.scope} 사업의 관계 인허가 신속처리 요청 요건을 확인해 요청·대상목록 관리 절차를 포함합니다.`,
    }),
    includeRule({
      id: `rule-${config.prefix}-result-check`,
      procedureId: `${config.prefix}-result-check`,
      effectiveFrom: config.effectiveFrom,
      lawId: config.lawId,
      citationIds: config.citationIds,
      explanation: `${config.scope} 신속처리 요청 후 개별 법정기한·60일 조건과 실제 처리결과를 확인하는 절차를 포함합니다.`,
    }),
  ]),
  ...plans.flatMap((config) => [
    includeRule({
      id: `rule-${config.prefix}-application`,
      procedureId: `${config.prefix}-application`,
      effectiveFrom: config.effectiveFrom,
      lawId: `${config.lawId}:PHASE:APPLICATION`,
      citationIds: config.citationIds,
      explanation: `${config.planName}에 사업과 의제대상 서류를 포함해 승인 신청하는 절차를 포함합니다.`,
    }),
    includeRule({
      id: `rule-${config.prefix}-consultation`,
      procedureId: `${config.prefix}-consultation`,
      effectiveFrom: config.effectiveFrom,
      lawId: `${config.lawId}:PHASE:CONSULTATION`,
      citationIds: config.citationIds,
      explanation: `${config.planName}의 개별 인허가 의제를 위한 관계기관 협의 절차를 포함합니다.`,
    }),
    includeRule({
      id: `rule-${config.prefix}-approval`,
      procedureId: `${config.prefix}-approval`,
      effectiveFrom: config.effectiveFrom,
      lawId: `${config.lawId}:PHASE:APPROVAL`,
      citationIds: config.citationIds,
      explanation: `${config.planName} 승인과 협의 완료된 개별 인허가의 의제 결과 확인 절차를 포함합니다.`,
    }),
    ...config.deemedProcedureIds.map((procedureId): ApplicabilityRule => ({
      id: `rule-${config.prefix}-deems-${procedureId}`,
      version: "2026.08.21.1",
      procedureId,
      effect: "EXCLUDE",
      effectiveFrom: config.effectiveFrom,
      effectiveTo: null,
      jurisdiction: nationwide,
      condition: {
        all: [
          selectedLaw(config.lawId),
          selectedLaw(`${config.lawId}:${procedureId}`),
        ],
      },
      requiredInputs: ["strategicIndustrySpecialCase"],
      missingPolicy: "INDETERMINATE",
      citationIds: config.citationIds,
      explanationTemplate: `${config.planName}에 이 인허가의 법정서류가 포함되고 관계기관 협의 및 계획 승인·고시 완료 증거가 확인되어 별도 신청 대신 계획승인 의제 경로로 표시합니다.`,
      priority: 900,
      status: "INTERNAL_REVIEWED",
      reviewActor: "법제처 현행 법률 의제조문 대조",
      note: "상위 계획 포함, 관계기관 협의, 승인·고시일과 고시문 근거가 모두 확인된 경우에만 적용합니다. 단순 지역·산업단지 소재로는 적용하지 않습니다.",
    })),
  ]),
];

export function buildFastTrackTargetRules(
  procedures: readonly Pick<Procedure, "id">[],
): ApplicabilityRule[] {
  return fastTracks.flatMap((config) =>
    getFastTrackTargetProcedureIds(config.lawId, procedures).map((procedureId) => includeRule({
      id: `rule-${config.prefix}-tracks-${procedureId}`,
      procedureId: `${config.prefix}-request`,
      effectiveFrom: config.effectiveFrom,
      lawId: `${config.lawId}:${procedureId}`,
      parentLawId: config.lawId,
      citationIds: config.citationIds,
      explanation: `${config.scope} 신속처리 요청 공문의 대상목록에 ${procedureId} 절차가 포함된 것으로 확인했습니다.`,
    })),
  );
}

const baseProcedure = ({
  id,
  name,
  description,
  outcome,
  stage,
  actionType,
  domain,
  applicant,
  receivingAuthority,
  statutoryDecisionMaker,
  consultationAuthorities,
  submissions,
  citations,
  deemedProcedureIds = [],
}: {
  id: string;
  name: string;
  description: string;
  outcome: string;
  stage: Procedure["stage"];
  actionType: Procedure["actionType"];
  domain: string;
  applicant: string;
  receivingAuthority: string;
  statutoryDecisionMaker: string;
  consultationAuthorities: string[];
  submissions: string[];
  citations: string[];
  deemedProcedureIds?: string[];
}): Procedure => ({
  id,
  name,
  aliases: [],
  description,
  outcome,
  stage,
  actionType,
  domain,
  lane: "CENTRAL_OR_REGIONAL_OFFICE",
  applicant,
  receivingAuthority,
  statutoryDecisionMaker,
  consultationAuthorities,
  submissions,
  validity: "승인·요청 대상 사업계획과 개별 인허가 조건에 따름",
  followUpObligations: ["대상 인허가별 신청·협의·처리결과 보관", "사업계획 변경 시 재협의·변경승인 여부 확인"],
  ruleIds: [],
  citationIds: citations,
  durationId: `duration-${id}`,
  verificationStatus: "INTERNAL_REVIEWED",
  reviewedAt: "2026-08-21",
  reviewNote: "법정 절차와 조건만 구조화했습니다. 하위 기관의 실제 접수서식·준비기간·보완기간은 별도 확인해야 합니다.",
  deemedByProcedureIds: [],
  deemedProcedureIds,
});

export const specialLawProcessProcedures: Procedure[] = [
  ...fastTracks.flatMap((config) => [
    baseProcedure({
      id: `${config.prefix}-request`,
      name: `${config.scope} 인허가 신속처리 요청`,
      description: `${config.lawName}에 따라 산업통상부장관이 관계 인허가의 신속처리를 요청하는 경로입니다. 요청 대상 인허가 목록을 실제 공문과 대조해야 합니다.`,
      outcome: "신속처리 요청 공문과 대상 인허가 목록",
      stage: "SITE_REVIEW",
      actionType: "NOTICE",
      domain: "특별법 신속처리",
      applicant: `${config.scope} 사업시행자와 산업통상부장관`,
      receivingAuthority: "산업통상부 및 개별 인허가 관계기관",
      statutoryDecisionMaker: "산업통상부장관과 개별 인허가 관계기관의 장",
      consultationAuthorities: ["신속처리 요청 대상 개별 인허가 관계기관"],
      submissions: ["사업시행자·특화단지 또는 클러스터 해당 확인자료", "신속처리 요청 대상 인허가 목록", "개별 인허가 신청서류와 접수일·법정 처리기한"],
      citations: config.citationIds,
    }),
    baseProcedure({
      id: `${config.prefix}-result-check`,
      name: `${config.scope} 신속처리 결과·기한 확인`,
      description: "신속처리 요청 후 처리계획 회신(15일, 보완 시에도 최대 30일)과 계획 제출 후 결과 통보(15일, 불가피한 경우 1회 15일 연장) 준수 여부를 확인합니다. 해당 단계 기한을 지키지 않은 경우에만 장관 요청일로부터 60일 경과일에 ‘처리 완료로 봄’ 조건을 검토합니다.",
      outcome: "개별 인허가 처리결과 또는 법정 처리완료 의제 검토기록",
      stage: "PRE_CONSTRUCTION",
      actionType: "REVIEW",
      domain: "특별법 신속처리",
      applicant: `${config.scope} 사업시행자`,
      receivingAuthority: "산업통상부 및 개별 인허가 관계기관",
      statutoryDecisionMaker: "개별 인허가 관계기관의 장",
      consultationAuthorities: ["산업통상부", "개별 인허가 관계기관"],
      submissions: ["신속처리 요청일 증빙", "개별 신청 접수증", "처리계획 회신일·보완기간 산정표", "처리결과 통보일·연장요청·거부 통지"],
      citations: config.citationIds,
    }),
  ]),
  ...plans.flatMap((config) => [
    baseProcedure({
      id: `${config.prefix}-application`,
      name: `${config.planName} 승인 신청`,
      description: `${config.planName}에 사업계획과 의제받으려는 인허가별 법정서류를 포함해 승인권자에게 제출하는 절차입니다.`,
      outcome: `${config.planName} 승인신청 접수`,
      stage: "SITE_REVIEW",
      actionType: "APPROVAL",
      domain: "특별법 통합승인",
      applicant: "계획 수립권자 또는 법정 사업시행자",
      receivingAuthority: config.authority,
      statutoryDecisionMaker: config.decisionMaker,
      consultationAuthorities: ["계획 및 의제대상 인허가 관계기관"],
      submissions: [`${config.planName}안`, "의제대상 인허가 목록", "각 의제 인허가의 법정 신청서류", "토지이용·환경·교통·재해 등 관계 검토자료"],
      citations: config.citationIds,
    }),
    baseProcedure({
      id: `${config.prefix}-consultation`,
      name: `${config.planName} 관계기관 협의`,
      description: "상위 계획 승인 전에 의제받으려는 각 인허가의 관계기관과 법정서류·조건을 협의하는 절차입니다. 협의하지 않은 인허가는 의제로 표시하지 않습니다.",
      outcome: "관계기관 협의의견과 조치계획",
      stage: "PLAN_AND_OCCUPANCY",
      actionType: "CONSULTATION",
      domain: "특별법 통합승인",
      applicant: "계획 승인권자와 사업시행자",
      receivingAuthority: config.authority,
      statutoryDecisionMaker: config.decisionMaker,
      consultationAuthorities: ["의제대상 개별 인허가 관계기관"],
      submissions: ["인허가별 협의요청서", "법정 신청서류", "관계기관 의견", "협의조건 반영표"],
      citations: config.citationIds,
    }),
    baseProcedure({
      id: `${config.prefix}-approval`,
      name: `${config.planName} 승인·의제 결과 확인`,
      description: `${config.planName} 승인·고시와 함께 실제 서류 포함 및 관계기관 협의가 완료된 개별 인허가의 의제 범위와 조건을 확인합니다.`,
      outcome: `${config.planName} 승인·고시와 인허가별 의제 확인표`,
      stage: "PLAN_AND_OCCUPANCY",
      actionType: "APPROVAL",
      domain: "특별법 통합승인",
      applicant: "계획 승인권자와 사업시행자",
      receivingAuthority: config.authority,
      statutoryDecisionMaker: config.decisionMaker,
      consultationAuthorities: ["의제대상 개별 인허가 관계기관"],
      submissions: ["승인·고시문", "관계기관 협의완료 자료", "의제 인허가별 조건·유효기간 확인표"],
      citations: config.citationIds,
      deemedProcedureIds: [...config.deemedProcedureIds],
    }),
  ]),
];

const unknownDuration = (
  procedureId: string,
  citations: string[],
  statutoryPeriod: string,
  variabilityFactors: string[],
): DurationEstimate => ({
  id: `duration-${procedureId}`,
  procedureId,
  applicantPreparation: null,
  authorityProcessing: null,
  interagencyConsultation: null,
  elapsed: null,
  statutoryPeriod,
  stopClockRules: [],
  variabilityFactors,
  evidenceType: "INSUFFICIENT_DATA",
  citationIds: citations,
  sampleSize: null,
  assumptions: ["법정 조건부 기한을 일반적인 예상 소요기간으로 대입하지 않습니다."],
  verifiedAt: "2026-08-21",
  legalConfidence: "HIGH",
  estimateConfidence: "UNVERIFIED",
});

export const specialLawProcessDurations: DurationEstimate[] = [
  ...fastTracks.flatMap((config) => [
    unknownDuration(
      `${config.prefix}-request`,
      config.citationIds,
      "신속처리 요청 준비·발송 자체의 전국 공통 처리기간은 확인되지 않음",
      ["대상 인허가 확정", "요청 공문 발송", "신청서류 보완"],
    ),
    unknownDuration(
      `${config.prefix}-result-check`,
      config.citationIds,
      "장관 요청 후 처리계획 회신 15일(보완기간 제외, 다만 최대 30일), 계획 제출 후 결과 통보 15일(1회 15일 연장) 기한을 지키지 않은 경우에만 요청일로부터 60일 경과일에 처리 완료로 보는 조건부 규정",
      ["신속처리 요청일", "처리계획 회신일·보완기간", "계획 제출일", "결과 통보·연장·거부", "요청 대상 인허가 포함 여부"],
    ),
  ]),
  ...plans.flatMap((config) => [
    unknownDuration(
      `${config.prefix}-application`,
      config.citationIds,
      config.lawId === "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL"
        ? "민간기업등의 산업단지계획 승인신청은 접수일부터 6개월 이내 승인 여부 결정; 신청 준비기간은 별도"
        : "계획 승인신청 준비·접수의 전국 공통 처리기간은 확인되지 않음",
      ["계획도서 완성도", "의제대상 서류", "주민의견·위원회 절차", "보완"],
    ),
    unknownDuration(
      `${config.prefix}-consultation`,
      config.citationIds,
      config.lawId === "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL"
        ? "관계기관 협의의견 제출기한은 법정 조문에 따르며, 보완·재협의 총기간은 별도"
        : "관계기관 사전협의의 전국 공통 총기간은 확인되지 않음",
      ["의제 인허가 수", "관계기관 수", "서류 보완", "협의조건 조정"],
    ),
    unknownDuration(
      `${config.prefix}-approval`,
      config.citationIds,
      config.lawId === "INDUSTRIAL_COMPLEX_PLAN_INTEGRATED_APPROVAL"
        ? "민간기업등의 승인신청 접수일부터 6개월 이내 승인 여부 결정; 상한을 통상값으로 사용하지 않음"
        : "승인·고시 및 의제결과 정리의 전국 공통 처리기간은 확인되지 않음",
      ["심의위원회", "협의조건 반영", "승인·고시", "개별 의제 범위 확인"],
    ),
  ]),
];

const practicalEdge = (
  id: string,
  from: string,
  to: string,
  conditionRuleId: string,
  citationIds: string[],
  branchId: string,
  note: string,
): ProcedureEdge => ({
  id,
  from,
  to,
  relation: "FINISH_TO_START",
  lag: 0,
  lagUnit: "CALENDAR_DAY",
  strength: "PRACTICAL",
  conditionRuleId,
  citationIds,
  branchId,
  note,
});

export const specialLawProcessEdges: ProcedureEdge[] = [
  ...fastTracks.flatMap((config) => {
    const request = `${config.prefix}-request`;
    const result = `${config.prefix}-result-check`;
    const rule = `rule-${config.prefix}-request`;
    const direct = practicalEdge(
      `edge-${config.prefix}-request-to-result-check`,
      request,
      result,
      rule,
      config.citationIds,
      config.prefix,
      "요청 공문과 대상목록을 기준으로 처리계획 회신·결과 통보 단계의 특례 기한과 실제 처리결과를 추적합니다.",
    );
    return [direct];
  }),
  ...plans.flatMap((config) => [
    practicalEdge(
      `edge-${config.prefix}-application-to-consultation`,
      `${config.prefix}-application`,
      `${config.prefix}-consultation`,
      `rule-${config.prefix}-application`,
      config.citationIds,
      config.prefix,
      "계획과 의제서류를 접수한 뒤 관계기관 협의를 진행하는 법정 경로를 표시합니다.",
    ),
    practicalEdge(
      `edge-${config.prefix}-consultation-to-approval`,
      `${config.prefix}-consultation`,
      `${config.prefix}-approval`,
      `rule-${config.prefix}-consultation`,
      config.citationIds,
      config.prefix,
      "관계기관 협의의견과 조건을 계획에 반영한 뒤 승인·고시 및 의제범위를 확인합니다.",
    ),
  ]),
];

export function buildFastTrackTargetEdges(
  procedures: readonly Pick<Procedure, "id">[],
): ProcedureEdge[] {
  return fastTracks.flatMap((config) => {
    const request = `${config.prefix}-request`;
    return getFastTrackTargetProcedureIds(config.lawId, procedures).map((procedureId) => practicalEdge(
      `edge-${config.prefix}-request-to-${procedureId}`,
      request,
      procedureId,
      `rule-${config.prefix}-tracks-${procedureId}`,
      config.citationIds,
      config.prefix,
      "실제 장관 요청 공문의 대상목록에 포함된 개별 인허가만 요청 이후 추적합니다. 처리결과 확인은 요청일부터 병행 관리합니다.",
    ));
  });
}

export const specialLawProcessRuleIdsByProcedure: Record<string, string[]> =
  Object.fromEntries(
    specialLawProcessRules.reduce((entries, rule) => {
      entries.set(rule.procedureId, [
        ...(entries.get(rule.procedureId) ?? []),
        rule.id,
      ]);
      return entries;
    }, new Map<string, string[]>()),
  );

export const specialLawDeemingParentsByProcedure: Record<string, string[]> =
  Object.fromEntries(
    plans.flatMap((config) =>
      config.deemedProcedureIds.map((procedureId) => [
        procedureId,
        `${config.prefix}-approval`,
      ] as const),
    ).reduce((entries, [procedureId, parentId]) => {
      entries.set(procedureId, [...(entries.get(procedureId) ?? []), parentId]);
      return entries;
    }, new Map<string, string[]>()),
  );

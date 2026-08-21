import type { DurationEstimate, Procedure } from "@/lib/domain/schemas";
import type { ScenarioAnswers } from "@/lib/data/catalog";
import type {
  DurationUnit,
  PlanningDuration,
  PlanningOverlapPolicy,
  PlanningReleasePolicy,
} from "@/lib/engine/schedule";

const preConstructionMilestones = new Set([
  "building-demolition-permit-report",
  "building-permit",
  "construction-start-report",
  "construction-waste-plan-report",
  "fugitive-dust-business-report",
  "nonpoint-source-installation-report",
  "fire-building-permit-consent",
  "underground-safety-assessment",
  "construction-safety-management-plan-approval",
  "specific-construction-prior-report",
  "asbestos-removal-work-report",
  "public-sewer-drainage-facility-report",
  "groundwater-development-use-permit-report",
  "private-sewage-treatment-installation-report",
  "waste-treatment-facility-installation-approval-report",
]);

const constructionFinishRelease = new Set([
  "building-use-approval",
  "development-activity-completion-inspection",
  "public-water-completion-inspection-report",
  "lpg-specific-use-facility-completion-inspection",
  "city-gas-specific-use-facility-completion-inspection",
  "mechanical-equipment-pre-use-inspection",
  "small-factory-registration",
  "factory-completion-report-complex",
  "factory-completion-report-offsite",
  "groundwater-completion-report",
  "public-sewer-drainage-facility-completion-inspection",
  "private-sewage-treatment-completion-inspection",
  "waste-treatment-facility-inspection",
  "fire-facility-completion-inspection",
  "hazardous-materials-facility-completion-inspection",
  "electrical-pre-use-inspection",
  "high-pressure-gas-facility-inspection",
  "heat-use-equipment-installation-inspection",
]);

function overlapPolicy(procedure: Procedure): PlanningOverlapPolicy {
  if (procedure.stage === "POST_OPERATION") return "POST_OPERATION";
  if (procedure.stage === "PRE_OPERATION") return "PRE_OPERATION";
  if (procedure.stage === "DURING_CONSTRUCTION") return "DURING_CONSTRUCTION";
  if (
    procedure.stage === "SITE_REVIEW" ||
    procedure.stage === "PLAN_AND_OCCUPANCY" ||
    procedure.stage === "PRE_CONSTRUCTION"
  ) return "PRE_CONSTRUCTION";
  if (preConstructionMilestones.has(procedure.id)) return "PRE_CONSTRUCTION";
  return "DURING_CONSTRUCTION";
}

function releasePolicy(procedure: Procedure): PlanningReleasePolicy {
  if (procedure.stage === "POST_OPERATION") return "OPERATION_READY";
  if (constructionFinishRelease.has(procedure.id)) return "CONSTRUCTION_FINISH";
  return "EARLIEST_ALLOWED";
}

/** 법령·정부24에서 확인한 기간을 원 단위 그대로 일정 엔진에 전달합니다. */
export function buildPlanningDurations(
  procedures: readonly Procedure[],
  durations: readonly DurationEstimate[],
  answers?: ScenarioAnswers,
): PlanningDuration[] {
  const durationByProcedure = new Map(
    durations.map((duration) => [duration.procedureId, duration]),
  );

  return procedures.map((procedure) => {
    const source = durationByProcedure.get(procedure.id);
    const elapsed = source?.elapsed ?? null;
    const resolved = resolveOfficialRoute(procedure.id, elapsed, answers);
    const hasDurationComponent = (value: unknown) =>
      value !== null && value !== undefined;
    const endToEndMissingComponents = resolved.confirmedMilestone
      ? []
      : [
          hasDurationComponent(source?.applicantPreparation) ? null : "신청인 준비",
          hasDurationComponent(source?.authorityProcessing) ? null : "기관 처리",
          hasDurationComponent(source?.interagencyConsultation) ? null : "관계기관 협의",
          hasDurationComponent(source?.elapsed) ? null : "전체 경과",
        ].filter((item): item is string => item !== null);
    return {
      procedureId: procedure.id,
      minimum: resolved.minimum,
      typical: resolved.typical,
      unit: resolved.unit ?? elapsed?.unit ?? null,
      overlapPolicy: overlapPolicy(procedure),
      releasePolicy: releasePolicy(procedure),
      evidenceType: source?.evidenceType ?? "INSUFFICIENT_DATA",
      confidence: source?.estimateConfidence ?? "UNVERIFIED",
      sourceLabel: resolved.sourceLabel ?? source?.statutoryPeriod ?? null,
      assumptions: source?.assumptions ?? [],
      reviewedAt: source?.verifiedAt ?? null,
      endToEndMissingComponents,
    } satisfies PlanningDuration;
  });
}

function resolveOfficialRoute(
  procedureId: string,
  elapsed: DurationEstimate["elapsed"],
  answers?: ScenarioAnswers,
): {
  minimum: number | null;
  typical: number | null;
  unit?: DurationUnit;
  sourceLabel?: string;
  confirmedMilestone?: boolean;
} {
  const fallback = {
    minimum: elapsed?.min ?? null,
    typical: elapsed?.base ?? null,
    unit: undefined,
    sourceLabel: undefined,
    confirmedMilestone: false,
  };
  if (!answers) return fallback;

  const confirmedMilestone = (date: string, label: string) => ({
    minimum: 0,
    typical: 0,
    unit: "CALENDAR_DAY" as const,
    sourceLabel: `${label} ${date} 확인 · 평가 기준일 이전 완료 이정표`,
    confirmedMilestone: true,
  });

  if (
    procedureId === "advanced-strategic-industry-fast-track-request" &&
    answers.advancedStrategicIndustryMinisterRequestDate !== null &&
    answers.advancedStrategicIndustryMinisterRequestDate >= "2023-07-01" &&
    answers.advancedStrategicIndustryMinisterRequestDate <= answers.assessmentDate
  ) {
    return confirmedMilestone(
      answers.advancedStrategicIndustryMinisterRequestDate,
      "산업통상부장관 신속처리 요청일",
    );
  }

  if (
    procedureId === "semiconductor-cluster-fast-track-request" &&
    answers.semiconductorClusterMinisterRequestDate !== null &&
    answers.semiconductorClusterMinisterRequestDate >= "2026-08-11" &&
    answers.semiconductorClusterMinisterRequestDate <= answers.assessmentDate
  ) {
    return confirmedMilestone(
      answers.semiconductorClusterMinisterRequestDate,
      "산업통상부장관 신속처리 요청일",
    );
  }

  const planApprovalMilestones = {
    "semiconductor-cluster-plan-approval": {
      published: answers.semiconductorClusterPlanApprovalPublished,
      date: answers.semiconductorClusterPlanApprovalPublishedDate,
      reference: answers.semiconductorClusterPlanApprovalNoticeReference,
      effectiveFrom: "2026-08-11",
    },
    "industrial-complex-plan-approval": {
      published: answers.industrialComplexPlanApprovalPublished,
      date: answers.industrialComplexPlanApprovalPublishedDate,
      reference: answers.industrialComplexPlanApprovalNoticeReference,
      effectiveFrom: "2008-09-06",
    },
    "regional-special-zone-plan-approval": {
      published: answers.regionalSpecialZonePlanApprovalPublished,
      date: answers.regionalSpecialZonePlanApprovalPublishedDate,
      reference: answers.regionalSpecialZonePlanApprovalNoticeReference,
      effectiveFrom: "2019-04-17",
    },
  } as const;
  const planApproval =
    planApprovalMilestones[
      procedureId as keyof typeof planApprovalMilestones
    ];
  if (
    planApproval?.published === true &&
    planApproval.date !== null &&
    planApproval.date >= planApproval.effectiveFrom &&
    planApproval.date <= answers.assessmentDate &&
    planApproval.reference.trim().length > 0
  ) {
    return confirmedMilestone(planApproval.date, "계획 승인·고시일");
  }

  if (procedureId === "factory-establishment-approval") {
    const daysByCoordination: Record<string, number> = {
      NONE: 7,
      LOCAL_ONLY: 14,
      OTHER_LT_20: 20,
      OTHER_GTE_20: 30,
    };
    const value = answers.permitCoordination
      ? daysByCoordination[answers.permitCoordination]
      : undefined;
    return value === undefined ? fallback : { minimum: value, typical: value };
  }

  if (procedureId === "building-permit" && answers.totalAreaM2 !== null) {
    if (answers.totalAreaM2 < 1_000) return { minimum: 7, typical: 7 };
    if (answers.totalAreaM2 < 5_000) return { minimum: 7, typical: 14 };
    if (answers.totalAreaM2 < 30_000) return { minimum: 10, typical: 14 };
    return { minimum: 15, typical: 25 };
  }

  if (procedureId === "disaster-impact-assessment-consultation") {
    if (answers.disasterImpactAssessmentType === "DISASTER_IMPACT") {
      return { minimum: 45, typical: 45 };
    }
    if (answers.disasterImpactAssessmentType === "DISASTER_IMPACT_REVIEW") {
      return { minimum: 30, typical: 30 };
    }
  }

  return fallback;
}

export const planningDurationNotice =
  "처리기간은 법령·정부24에 적힌 업무일·달력일·개월 단위를 그대로 계산합니다. 통상은 확인된 표준 처리경로의 값이며, 서류 작성·보완·기관 협의와 임시공휴일은 별도입니다.";

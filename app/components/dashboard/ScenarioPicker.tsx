import { inputLabel } from "@/app/components/dashboard/constants";
import type { ScenarioAnswers } from "@/lib/data/catalog";
import { getIndustryProfile } from "@/lib/data/industry-profiles";
import { getSpecialLawDefinition } from "@/lib/data/special-laws";
import { getOfficialLocalOrdinanceLinks } from "@/lib/regions/local-ordinances";

type InputField = {
  key: string;
  unit?: string;
};

type InputSection = {
  id: string;
  title: string;
  fields: readonly InputField[];
};

/**
 * Project Input에 있는 값을 화면 순서와 무관하게 한 번씩 모두 보여 주기 위한 목록입니다.
 * 새 입력 항목을 추가할 때는 해당 섹션에 키를 함께 추가해야 합니다.
 */
export const projectInputSections: readonly InputSection[] = [
  {
    id: "site",
    title: "입지",
    fields: [
      { key: "assessmentDate" },
      { key: "province" },
      { key: "city" },
      { key: "insideIndustrialComplex" },
      { key: "landCategory" },
      { key: "demolitionRequired" },
      { key: "roadConnectionRequired" },
      { key: "trafficImpactAssessmentRequired" },
      { key: "landscapeReviewRequired" },
      { key: "disasterImpactAssessmentType" },
      { key: "undergroundSafetyAssessmentType" },
      { key: "nationalHeritageAssessmentType" },
      { key: "militaryProtectionConsultationRequired" },
      { key: "riverOccupationRequired" },
      { key: "publicWaterOccupationRequired" },
      { key: "waterSourceProtectionZone" },
    ],
  },
  {
    id: "investment",
    title: "업종·투자",
    fields: [
      { key: "investmentType" },
      { key: "industryCategory" },
      { key: "buildingAction" },
      { key: "buildingCommitteeReviewRequired" },
      { key: "mechanicalEquipmentActTarget" },
      { key: "existingAreaM2", unit: "㎡" },
      { key: "increaseAreaM2", unit: "㎡" },
      { key: "totalAreaM2", unit: "㎡" },
      { key: "permitCoordination" },
      { key: "aiDataCenterActFacilityConfirmed" },
      { key: "aiDataCenterOneStopStatus" },
      { key: "appliedSpecialLawIds" },
    ],
  },
  {
    id: "facility-environment",
    title: "시설·환경",
    fields: [
      { key: "airEmissionFacility" },
      { key: "waterDischargeFacility" },
      { key: "wasteFacility" },
      { key: "environmentalAssessmentType" },
      { key: "integratedEnvironmentalPermitTarget" },
      { key: "powerIncreaseMw", unit: "MW" },
      { key: "waterDemandM3Day", unit: "㎥/일" },
      { key: "wastewaterM3Day", unit: "㎥/일" },
      { key: "groundwaterDevelopment" },
      { key: "publicSewerConnection" },
      { key: "privateSewageTreatmentFacility" },
      { key: "privateElectricalFacilityWork" },
      { key: "energyUsePlanRequired" },
      { key: "gridImpactAssessmentRequired" },
    ],
  },
  {
    id: "chemical-safety",
    title: "위험물·안전",
    fields: [
      { key: "chemicalsHandled" },
      { key: "chemicalManufactureOrImport" },
      { key: "hazardousChemicalBusiness" },
      { key: "chemicalRegistrationRequired" },
      { key: "restrictedOrToxicChemicalImport" },
      { key: "hazardousMaterials" },
      { key: "hazardousMaterialsTank" },
      { key: "hazardousMaterialsPreventionRulesRequired" },
      { key: "highPressureGas" },
      { key: "specificHighPressureGasUse" },
      { key: "lpgSpecificUseFacility" },
      { key: "cityGasSpecificUseFacility" },
      { key: "psmCovered" },
      { key: "fireFacilityWork" },
      { key: "fireSafetyManagerRequired" },
      { key: "heatUseEquipment" },
      { key: "hazardousMachineryInspectionRequired" },
      { key: "safetyManagerRequired" },
      { key: "healthManagerRequired" },
    ],
  },
  {
    id: "construction",
    title: "공사 일정",
    fields: [
      { key: "plannedConstructionStartDate" },
      { key: "plannedConstructionEndDate" },
      { key: "safetyManagementPlanRequired" },
      { key: "specificWorkReportRequired" },
      { key: "asbestosPresent" },
    ],
  },
] as const;

const valueLabels: Record<string, Record<string, string>> = {
  aiDataCenterOneStopStatus: {
    NOT_APPLIED: "선택 없음",
    PLANNED: "신청 예정",
    IN_PROGRESS: "심사 중",
    COMPLETED: "일괄처리 완료",
  },
  investmentType: {
    NEW: "신설",
    EXPANSION: "증설",
    RELOCATION: "이전",
    PROCESS_CHANGE: "공정변경",
    INDUSTRY_CHANGE: "업종변경",
  },
  insideIndustrialComplex: {
    true: "산업단지 안",
    false: "개별입지",
  },
  industryCategory: {
    GENERAL_MANUFACTURING: "일반 제조업",
    SEMICONDUCTOR_ELECTRONICS: "반도체·전자",
    SECONDARY_BATTERY_CHEMICAL: "이차전지·화학",
  },
  buildingAction: {
    NEW_BUILD: "신축",
    EXTENSION: "증축",
    MAJOR_REPAIR: "대수선",
    CHANGE_OF_USE: "용도변경",
    NONE: "건축 없음",
  },
  landCategory: {
    OTHER: "일반 대지·공장용지 등",
    FARMLAND: "농지",
    FOREST: "산지",
  },
  permitCoordination: {
    NONE: "의제 인허가 없음",
    LOCAL_ONLY: "시·군·구 권한만 포함",
    OTHER_LT_20: "타 기관 20일 미만 인허가 포함",
    OTHER_GTE_20: "타 기관 20일 이상 인허가 포함",
  },
  environmentalAssessmentType: {
    NONE: "비대상",
    ENVIRONMENTAL: "환경영향평가 대상",
    SMALL: "소규모 환경영향평가 대상",
  },
  disasterImpactAssessmentType: {
    NONE: "비대상",
    DISASTER_IMPACT: "재해영향평가 대상",
    DISASTER_IMPACT_REVIEW: "재해영향성검토 대상",
  },
  undergroundSafetyAssessmentType: {
    NONE: "비대상",
    UNDERGROUND_SAFETY: "지하안전평가 대상",
    SMALL_UNDERGROUND_SAFETY: "소규모 지하안전평가 대상",
  },
  nationalHeritageAssessmentType: {
    NONE: "비대상",
    PRELIMINARY_CONSULTATION: "사전협의 대상",
    IMPACT_DIAGNOSIS: "영향진단 대상",
    SIMPLIFIED_DIAGNOSIS: "약식영향진단 대상",
  },
  chemicalManufactureOrImport: {
    true: "제조·수입",
    false: "국내 구매·사용",
  },
  groundwaterDevelopment: {
    true: "개발·이용",
    false: "없음",
  },
};

function getInputValue(answers: ScenarioAnswers, key: string) {
  return (answers as unknown as Record<string, unknown>)[key];
}

export function formatProjectInputValue(
  key: string,
  value: unknown,
  unit?: string,
) {
  if (value === undefined) return "입력 항목 없음";
  if (value === null) return "미확인";
  if (value === "UNKNOWN") return "미확인";

  if (key === "industryCategory" && typeof value === "string") {
    const profile = getIndustryProfile(value);
    if (profile) return profile.label;
  }

  if (key === "appliedSpecialLawIds" && Array.isArray(value)) {
    if (!value.length) return "선택 없음";
    return value
      .map((id) => getSpecialLawDefinition(String(id) as Parameters<typeof getSpecialLawDefinition>[0])?.shortLabel ?? String(id))
      .join(" · ");
  }

  const mapped = valueLabels[key]?.[String(value)];
  if (mapped) return mapped;

  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (typeof value === "number") {
    const formatted = value.toLocaleString("ko-KR", {
      maximumFractionDigits: 6,
    });
    return unit ? `${formatted} ${unit}` : formatted;
  }
  if (typeof value === "string") return value.length ? value : "미입력";
  return String(value);
}

export function ProjectInputSummary({ answers }: { answers: ScenarioAnswers }) {
  const ordinanceLinks = getOfficialLocalOrdinanceLinks(answers.province, answers.city);
  return (
    <section className="project-input-summary" aria-labelledby="project-input-summary-title">
      <details>
      <summary className="project-input-summary-heading">
        <div>
          <h2 id="project-input-summary-title">현재 사업조건</h2>
          <p>입력값 {Object.keys(answers).length}개 보기</p>
        </div>
        <span className="details-action" aria-hidden="true" />
      </summary>

      <div className="project-input-summary-sections">
        {projectInputSections.map((section) => (
          <section
            className="project-input-summary-section"
            aria-labelledby={`project-input-section-${section.id}`}
            key={section.id}
          >
            <h3 id={`project-input-section-${section.id}`}>{section.title}</h3>
            <dl>
              {section.fields.map((field) => {
                const value = getInputValue(answers, field.key);
                const state =
                  value === undefined
                    ? "absent"
                    : value === null || value === "UNKNOWN"
                      ? "unknown"
                      : value === false
                        ? "false"
                        : value === 0
                          ? "zero"
                          : "set";

                return (
                  <div data-input-key={field.key} data-input-state={state} key={field.key}>
                    <dt>{inputLabel(field.key)}</dt>
                    <dd>
                      {field.key === "province" && ordinanceLinks.province ? (
                        <a href={ordinanceLinks.province.url} target="_blank" rel="noreferrer">{ordinanceLinks.province.name}</a>
                      ) : field.key === "city" && ordinanceLinks.municipality ? (
                        <a href={ordinanceLinks.municipality.url} target="_blank" rel="noreferrer">{ordinanceLinks.municipality.name}</a>
                      ) : formatProjectInputValue(field.key, value, field.unit)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
      </details>
    </section>
  );
}

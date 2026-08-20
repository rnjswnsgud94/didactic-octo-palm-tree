import { scenarioAnswerSchema, type ScenarioAnswers } from "@/lib/data/catalog";
import { isSupportedNonCapitalProvince } from "@/lib/regions";

const keys: Array<[keyof ScenarioAnswers, string]> = [
  ["assessmentDate", "d"],
  ["plannedConstructionStartDate", "cs"],
  ["plannedConstructionEndDate", "ce"],
  ["investmentType", "it"],
  ["province", "pr"],
  ["city", "ct"],
  ["insideIndustrialComplex", "ic"],
  ["industryCategory", "ind"],
  ["buildingAction", "ba"],
  ["mechanicalEquipmentActTarget", "mea"],
  ["existingAreaM2", "ex"],
  ["increaseAreaM2", "inc"],
  ["totalAreaM2", "tot"],
  ["landCategory", "land"],
  ["demolitionRequired", "demo"],
  ["roadConnectionRequired", "road"],
  ["trafficImpactAssessmentRequired", "tia"],
  ["permitCoordination", "pc"],
  ["airEmissionFacility", "air"],
  ["waterDischargeFacility", "wat"],
  ["environmentalAssessmentType", "eia"],
  ["integratedEnvironmentalPermitTarget", "iep"],
  ["chemicalsHandled", "chem"],
  ["chemicalManufactureOrImport", "cmi"],
  ["hazardousChemicalBusiness", "hcb"],
  ["hazardousMaterials", "haz"],
  ["highPressureGas", "hpg"],
  ["specificHighPressureGasUse", "shg"],
  ["lpgSpecificUseFacility", "lpg"],
  ["cityGasSpecificUseFacility", "cgs"],
  ["psmCovered", "psm"],
  ["fireFacilityWork", "fire"],
  ["privateElectricalFacilityWork", "pef"],
  ["energyUsePlanRequired", "eup"],
  ["groundwaterDevelopment", "gw"],
  ["disasterImpactAssessmentType", "dia"],
  ["undergroundSafetyAssessmentType", "usa"],
  ["nationalHeritageAssessmentType", "nha"],
  ["militaryProtectionConsultationRequired", "mil"],
  ["riverOccupationRequired", "riv"],
  ["publicWaterOccupationRequired", "pwo"],
  ["waterSourceProtectionZone", "wsp"],
  ["safetyManagementPlanRequired", "smp"],
  ["specificWorkReportRequired", "swr"],
  ["asbestosPresent", "asb"],
  ["publicSewerConnection", "sew"],
  ["privateSewageTreatmentFacility", "pst"],
  ["wasteFacility", "wst"],
  ["chemicalRegistrationRequired", "chr"],
  ["restrictedOrToxicChemicalImport", "cti"],
  ["fireSafetyManagerRequired", "fsm"],
  ["hazardousMaterialsTank", "hmt"],
  ["hazardousMaterialsPreventionRulesRequired", "hpr"],
  ["heatUseEquipment", "hue"],
  ["hazardousMachineryInspectionRequired", "hmi"],
  ["safetyManagerRequired", "smr"],
  ["healthManagerRequired", "hmr"],
  ["powerIncreaseMw", "pow"],
  ["waterDemandM3Day", "sup"],
  ["wastewaterM3Day", "ww"],
];

const version2Fields: Array<[keyof ScenarioAnswers, string]> = [
  ["landCategory", "land"],
  ["demolitionRequired", "demo"],
  ["roadConnectionRequired", "road"],
  ["trafficImpactAssessmentRequired", "tia"],
  ["environmentalAssessmentType", "eia"],
  ["integratedEnvironmentalPermitTarget", "iep"],
  ["chemicalManufactureOrImport", "cmi"],
  ["hazardousChemicalBusiness", "hcb"],
  ["hazardousMaterials", "haz"],
  ["highPressureGas", "hpg"],
  ["specificHighPressureGasUse", "shg"],
  ["fireFacilityWork", "fire"],
  ["privateElectricalFacilityWork", "pef"],
  ["energyUsePlanRequired", "eup"],
  ["groundwaterDevelopment", "gw"],
];

const version3Fields: Array<[keyof ScenarioAnswers, string]> = [
  ["plannedConstructionStartDate", "cs"],
  ["plannedConstructionEndDate", "ce"],
  ["disasterImpactAssessmentType", "dia"],
  ["undergroundSafetyAssessmentType", "usa"],
  ["nationalHeritageAssessmentType", "nha"],
  ["militaryProtectionConsultationRequired", "mil"],
  ["riverOccupationRequired", "riv"],
  ["publicWaterOccupationRequired", "pwo"],
  ["waterSourceProtectionZone", "wsp"],
  ["safetyManagementPlanRequired", "smp"],
  ["specificWorkReportRequired", "swr"],
  ["asbestosPresent", "asb"],
  ["publicSewerConnection", "sew"],
  ["privateSewageTreatmentFacility", "pst"],
  ["wasteFacility", "wst"],
  ["chemicalRegistrationRequired", "chr"],
  ["restrictedOrToxicChemicalImport", "cti"],
  ["fireSafetyManagerRequired", "fsm"],
  ["hazardousMaterialsTank", "hmt"],
  ["hazardousMaterialsPreventionRulesRequired", "hpr"],
  ["heatUseEquipment", "hue"],
  ["hazardousMachineryInspectionRequired", "hmi"],
  ["safetyManagerRequired", "smr"],
  ["healthManagerRequired", "hmr"],
];

function encodeValue(value: ScenarioAnswers[keyof ScenarioAnswers]) {
  if (value === null) return "u";
  if (value === true) return "1";
  if (value === false) return "0";
  return String(value);
}

function decodeValue(
  key: keyof ScenarioAnswers,
  value: string,
): string | number | boolean | null {
  if (value === "u") return null;
  if (
    [
      "insideIndustrialComplex",
      "mechanicalEquipmentActTarget",
      "airEmissionFacility",
      "waterDischargeFacility",
      "demolitionRequired",
      "roadConnectionRequired",
      "trafficImpactAssessmentRequired",
      "integratedEnvironmentalPermitTarget",
      "chemicalsHandled",
      "chemicalManufactureOrImport",
      "hazardousChemicalBusiness",
      "hazardousMaterials",
      "highPressureGas",
      "specificHighPressureGasUse",
      "lpgSpecificUseFacility",
      "cityGasSpecificUseFacility",
      "psmCovered",
      "fireFacilityWork",
      "privateElectricalFacilityWork",
      "energyUsePlanRequired",
      "groundwaterDevelopment",
      "militaryProtectionConsultationRequired",
      "riverOccupationRequired",
      "publicWaterOccupationRequired",
      "waterSourceProtectionZone",
      "safetyManagementPlanRequired",
      "specificWorkReportRequired",
      "asbestosPresent",
      "publicSewerConnection",
      "privateSewageTreatmentFacility",
      "wasteFacility",
      "chemicalRegistrationRequired",
      "restrictedOrToxicChemicalImport",
      "fireSafetyManagerRequired",
      "hazardousMaterialsTank",
      "hazardousMaterialsPreventionRulesRequired",
      "heatUseEquipment",
      "hazardousMachineryInspectionRequired",
      "safetyManagerRequired",
      "healthManagerRequired",
    ].includes(key)
  ) {
    if (value === "1") return true;
    if (value === "0") return false;
    return null;
  }
  if (
    [
      "existingAreaM2",
      "increaseAreaM2",
      "totalAreaM2",
      "powerIncreaseMw",
      "waterDemandM3Day",
      "wastewaterM3Day",
    ].includes(key)
  ) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && number <= 1_000_000_000
      ? number
      : null;
  }
  return value.slice(0, 80);
}

export function encodeShareState(
  answers: ScenarioAnswers,
  tab: string,
) {
  const params = new URLSearchParams();
  params.set("v", "7");
  for (const [key, shortKey] of keys) {
    params.set(shortKey, encodeValue(answers[key]));
  }
  params.set("tab", tab);
  params.sort();
  return params.toString();
}

export function decodeShareState(
  search: string,
  fallback: ScenarioAnswers,
): { answers: ScenarioAnswers; tab?: string; warning?: string } {
  if (search.length > 3_000) {
    return { answers: fallback, warning: "공유 주소가 너무 길어 기본값을 사용했습니다." };
  }
  const params = new URLSearchParams(search);
  if (!params.has("v")) return { answers: fallback };
  const version = params.get("v");
  if (!["1", "2", "3", "4", "5", "6", "7"].includes(version ?? "")) {
    return { answers: fallback, warning: "지원하지 않는 공유 주소 버전입니다." };
  }
  const warnings: string[] = [];
  const candidate: Record<string, unknown> = { ...fallback };
  if (version === "1") {
    const missingNewFields = version2Fields.filter(([, shortKey]) => !params.has(shortKey));
    for (const [key] of missingNewFields) candidate[key] = null;
    if (missingNewFields.length) {
      warnings.push("예전 공유 주소의 신규 조건은 미확인으로 복원했습니다.");
    }
  }
  if (version === "1" || version === "2") {
    for (const [key] of version3Fields) candidate[key] = null;
    warnings.push("예전 공유 주소에는 공사 일정이 없어 미입력 상태로 복원했습니다.");
  }
  for (const [key, shortKey] of keys) {
    const value = params.get(shortKey);
    if (value === null) continue;
    if (!["6", "7"].includes(version ?? "") && key === "plannedConstructionStartDate" && /^\d{4}-\d{2}$/.test(value)) {
      candidate[key] = `${value}-01`;
      continue;
    }
    if (!["6", "7"].includes(version ?? "") && key === "plannedConstructionEndDate" && /^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split("-").map(Number);
      const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
      candidate[key] = end;
      continue;
    }
    candidate[key] = decodeValue(key, value);
  }
  if (!["6", "7"].includes(version ?? "") && (params.has("cs") || params.has("ce"))) {
    warnings.push("예전 공유 주소의 월 단위 공사 일정을 해당 월의 첫날과 마지막 날로 변환했습니다.");
  }
  const parsed = scenarioAnswerSchema.safeParse(candidate);
  if (!parsed.success) {
    return { answers: fallback, warning: "공유 주소 일부가 올바르지 않아 기본값을 사용했습니다." };
  }
  let answers = parsed.data;
  if (answers.province !== "" && !isSupportedNonCapitalProvince(answers.province)) {
    const safeProvince = isSupportedNonCapitalProvince(fallback.province)
      ? fallback.province
      : "";
    answers = {
      ...answers,
      province: safeProvince,
      city: safeProvince ? fallback.city : "",
    };
    warnings.push("지원 범위 밖 지역이어서 비수도권 기본 지역으로 복원했습니다.");
  }
  const tab = params.get("tab")?.slice(0, 30);
  return {
    answers,
    ...(tab ? { tab } : {}),
    ...(warnings.length ? { warning: warnings.join(" ") } : {}),
  };
}

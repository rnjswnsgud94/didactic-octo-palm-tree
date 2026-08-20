import { scenarioAnswerSchema, type ScenarioAnswers } from "@/lib/data/catalog";
import { isSupportedNonCapitalProvince, nonCapitalRegions } from "@/lib/regions";

const keys: Array<[keyof ScenarioAnswers, string]> = [
  ["assessmentDate", "d"],
  ["investmentType", "it"],
  ["province", "pr"],
  ["city", "ct"],
  ["insideIndustrialComplex", "ic"],
  ["industryCategory", "ind"],
  ["buildingAction", "ba"],
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
  ["psmCovered", "psm"],
  ["fireFacilityWork", "fire"],
  ["privateElectricalFacilityWork", "pef"],
  ["energyUsePlanRequired", "eup"],
  ["groundwaterDevelopment", "gw"],
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
      "psmCovered",
      "fireFacilityWork",
      "privateElectricalFacilityWork",
      "energyUsePlanRequired",
      "groundwaterDevelopment",
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
  scenarioId?: string | null,
) {
  const params = new URLSearchParams();
  params.set("v", "2");
  for (const [key, shortKey] of keys) {
    params.set(shortKey, encodeValue(answers[key]));
  }
  if (scenarioId) params.set("sc", scenarioId.slice(0, 80));
  params.set("tab", tab);
  params.sort();
  return params.toString();
}

export function decodeShareState(
  search: string,
  fallback: ScenarioAnswers,
): { answers: ScenarioAnswers; tab?: string; scenarioId?: string; warning?: string } {
  if (search.length > 3_000) {
    return { answers: fallback, warning: "공유 주소가 너무 길어 기본값을 사용했습니다." };
  }
  const params = new URLSearchParams(search);
  if (!params.has("v")) return { answers: fallback };
  const version = params.get("v");
  if (version !== "1" && version !== "2") {
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
  for (const [key, shortKey] of keys) {
    const value = params.get(shortKey);
    if (value !== null) candidate[key] = decodeValue(key, value);
  }
  const parsed = scenarioAnswerSchema.safeParse(candidate);
  if (!parsed.success) {
    return { answers: fallback, warning: "공유 주소 일부가 올바르지 않아 기본값을 사용했습니다." };
  }
  let answers = parsed.data;
  if (!isSupportedNonCapitalProvince(answers.province)) {
    const safeProvince = isSupportedNonCapitalProvince(fallback.province)
      ? fallback.province
      : nonCapitalRegions[0];
    answers = {
      ...answers,
      province: safeProvince,
      city: isSupportedNonCapitalProvince(fallback.province) ? fallback.city : "",
    };
    warnings.push("지원 범위 밖 지역이어서 비수도권 기본 지역으로 복원했습니다.");
  }
  const tab = params.get("tab")?.slice(0, 30);
  const scenarioId = params.get("sc")?.slice(0, 80);
  return {
    answers,
    ...(tab ? { tab } : {}),
    ...(scenarioId ? { scenarioId } : {}),
    ...(warnings.length ? { warning: warnings.join(" ") } : {}),
  };
}

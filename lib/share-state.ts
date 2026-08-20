import { scenarioAnswerSchema, type ScenarioAnswers } from "@/lib/data/catalog";

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
  ["permitCoordination", "pc"],
  ["airEmissionFacility", "air"],
  ["waterDischargeFacility", "wat"],
  ["chemicalsHandled", "chem"],
  ["psmCovered", "psm"],
  ["powerIncreaseMw", "pow"],
  ["waterDemandM3Day", "sup"],
  ["wastewaterM3Day", "ww"],
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
      "chemicalsHandled",
      "psmCovered",
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

export function encodeShareState(answers: ScenarioAnswers, tab: string) {
  const params = new URLSearchParams();
  params.set("v", "1");
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
  if (params.get("v") !== "1") {
    return { answers: fallback, warning: "지원하지 않는 공유 주소 버전입니다." };
  }
  const candidate: Record<string, unknown> = { ...fallback };
  for (const [key, shortKey] of keys) {
    const value = params.get(shortKey);
    if (value !== null) candidate[key] = decodeValue(key, value);
  }
  const parsed = scenarioAnswerSchema.safeParse(candidate);
  if (!parsed.success) {
    return { answers: fallback, warning: "공유 주소 일부가 올바르지 않아 기본값을 사용했습니다." };
  }
  const tab = params.get("tab")?.slice(0, 30);
  return { answers: parsed.data, ...(tab ? { tab } : {}) };
}

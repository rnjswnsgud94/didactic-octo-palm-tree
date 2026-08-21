import type { ScenarioAnswers } from "@/lib/data/catalog";

/**
 * 제11차 한국표준산업분류의 제조업 중분류(10~34)와 대규모 디지털
 * 인프라 업종을 투자 검토자가 고르기 쉬운 묶음으로 재구성했습니다.
 *
 * 업종만으로 개별 인허가의 법적 적용 여부를 확정할 수 없으므로,
 * `reviewKeys`는 우선 확인할 입력 항목을 뜻합니다. `initialValues`도
 * 업종상 매우 흔한 공정 특성만 비어 있는 입력에 채우는 초기값이며
 * 사용자가 실제 설비·물질·규모에 맞게 수정해야 합니다.
 */

export const INDUSTRY_TAXONOMY_SOURCE = {
  title: "제11차 한국표준산업분류(2024.1.1.)",
  url: "https://mlib1.kostat.go.kr/search/detail/CATTOT000000057873",
  manufacturingDivisionRange: "10~34",
} as const;

export const industryReviewFieldLabels = {
  airEmissionFacility: "대기배출시설",
  airTotalManagementBusinessTarget: "대기 총량관리사업장 설치허가",
  waterDischargeFacility: "폐수배출시설",
  noiseVibrationFacility: "소음·진동배출시설",
  wasteFacility: "폐기물처리시설 설치",
  integratedEnvironmentalPermitTarget: "통합환경허가",
  chemicalsHandled: "화학물질 취급",
  chemicalManufactureOrImport: "화학물질·혼합물 제조·수입",
  hazardousChemicalBusiness: "유해화학물질 영업허가",
  chemicalRegistrationRequired: "화학물질 등록·신고",
  restrictedOrToxicChemicalImport: "제한·금지·유독물질 수입",
  hazardousMaterials: "위험물 지정수량",
  hazardousMaterialsTank: "위험물 탱크",
  highPressureGas: "고압가스",
  specificHighPressureGasUse: "특정고압가스 사용",
  psmCovered: "공정안전보고서(PSM)",
  heatUseEquipment: "열사용기자재",
  hazardousMachineryInspectionRequired: "유해·위험기계 안전검사",
  privateElectricalFacilityWork: "자가용전기설비",
  energyUsePlanRequired: "에너지사용계획",
  gridImpactAssessmentRequired: "전력계통영향평가",
  aiDataCenterActFacilityConfirmed: "특별법상 AI 데이터센터 인정요건",
  landscapeReviewRequired: "경관심의",
  buildingCommitteeReviewRequired: "건축위원회 심의",
  fireFacilityWork: "소방시설공사",
  publicSewerConnection: "공공하수도 연결",
  privateSewageTreatmentFacility: "개인하수처리시설",
} as const satisfies Partial<Record<keyof ScenarioAnswers, string>>;

export type IndustryReviewField = keyof typeof industryReviewFieldLabels;

type IndustryInitialValueField = Extract<
  IndustryReviewField,
  | "chemicalsHandled"
  | "chemicalManufactureOrImport"
  | "hazardousMaterials"
>;

export type IndustryProfile = {
  id: string;
  label: string;
  group: "디지털 인프라" | "생활·바이오" | "석유·화학·소재" | "금속·기계" | "전기전자·정밀" | "수송장비";
  ksicDivisions: readonly number[];
  examples: string;
  reviewKeys: readonly IndustryReviewField[];
  initialValues: Partial<Record<IndustryInitialValueField, true>>;
};

export const industryProfiles = [
  {
    id: "AI_DATA_CENTER",
    label: "AI 데이터센터",
    group: "디지털 인프라",
    ksicDivisions: [63],
    examples: "AI 학습·추론용 데이터센터, GPU 클러스터, 기존 데이터센터의 AI 전환",
    reviewKeys: ["aiDataCenterActFacilityConfirmed", "noiseVibrationFacility", "gridImpactAssessmentRequired", "buildingCommitteeReviewRequired", "landscapeReviewRequired", "privateElectricalFacilityWork", "energyUsePlanRequired", "fireFacilityWork", "hazardousMaterials", "highPressureGas", "publicSewerConnection"],
    initialValues: {},
  },
  {
    id: "FOOD_BEVERAGE_TOBACCO",
    label: "식품·음료·담배",
    group: "생활·바이오",
    ksicDivisions: [10, 11, 12],
    examples: "식품가공, 음료, 사료, 담배제품",
    reviewKeys: ["waterDischargeFacility", "airEmissionFacility", "noiseVibrationFacility", "heatUseEquipment", "publicSewerConnection", "privateSewageTreatmentFacility"],
    initialValues: {},
  },
  {
    id: "TEXTILE_APPAREL_LEATHER",
    label: "섬유·의복·가죽",
    group: "생활·바이오",
    ksicDivisions: [13, 14, 15],
    examples: "방적·직조, 염색가공, 의복, 가죽제품",
    reviewKeys: ["waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "airEmissionFacility", "heatUseEquipment", "publicSewerConnection"],
    initialValues: {},
  },
  {
    id: "WOOD_PAPER_PRINTING",
    label: "목재·종이·인쇄",
    group: "생활·바이오",
    ksicDivisions: [16, 17, 18],
    examples: "목재가공, 펄프·종이, 인쇄·기록매체",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "heatUseEquipment"],
    initialValues: {},
  },
  {
    id: "PHARMACEUTICAL_BIO",
    label: "의약품·바이오",
    group: "생활·바이오",
    ksicDivisions: [21],
    examples: "원료·완제의약품, 바이오의약품",
    reviewKeys: ["chemicalsHandled", "waterDischargeFacility", "airEmissionFacility", "noiseVibrationFacility", "hazardousMaterials", "highPressureGas", "publicSewerConnection"],
    initialValues: { chemicalsHandled: true },
  },
  {
    id: "FURNITURE_OTHER_MANUFACTURING",
    label: "가구·기타 제조",
    group: "생활·바이오",
    ksicDivisions: [32, 33],
    examples: "가구, 귀금속, 악기, 운동용품, 기타 제품",
    reviewKeys: ["airEmissionFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
  {
    id: "PETROLEUM_COAL",
    label: "석유정제·석유제품",
    group: "석유·화학·소재",
    ksicDivisions: [19],
    examples: "석유정제품, 윤활유, 코크스·연탄",
    reviewKeys: ["integratedEnvironmentalPermitTarget", "airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "hazardousMaterialsTank", "highPressureGas", "psmCovered"],
    initialValues: { chemicalsHandled: true },
  },
  {
    id: "CHEMICAL_PRODUCTS",
    label: "화학물질·화학제품",
    group: "석유·화학·소재",
    ksicDivisions: [20],
    examples: "기초화학, 합성수지, 도료, 접착제, 화장품",
    reviewKeys: ["integratedEnvironmentalPermitTarget", "airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "chemicalManufactureOrImport", "hazardousChemicalBusiness", "chemicalRegistrationRequired", "restrictedOrToxicChemicalImport", "hazardousMaterials", "highPressureGas", "psmCovered"],
    initialValues: { chemicalsHandled: true, chemicalManufactureOrImport: true },
  },
  {
    id: "SECONDARY_BATTERY_CHEMICAL",
    label: "이차전지·배터리 소재",
    group: "석유·화학·소재",
    ksicDivisions: [20, 28],
    examples: "양극재·음극재·전해액, 셀·모듈·팩",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousChemicalBusiness", "chemicalRegistrationRequired", "hazardousMaterials", "highPressureGas", "psmCovered", "energyUsePlanRequired"],
    initialValues: { chemicalsHandled: true },
  },
  {
    id: "RUBBER_PLASTIC",
    label: "고무·플라스틱",
    group: "석유·화학·소재",
    ksicDivisions: [22],
    examples: "고무제품, 플라스틱 성형·가공",
    reviewKeys: ["airEmissionFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "heatUseEquipment", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
  {
    id: "NONMETALLIC_MINERAL",
    label: "비금속광물·세라믹",
    group: "석유·화학·소재",
    ksicDivisions: [23],
    examples: "유리, 시멘트, 콘크리트, 도자기·세라믹",
    reviewKeys: ["integratedEnvironmentalPermitTarget", "airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "heatUseEquipment", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
  {
    id: "PRIMARY_METAL",
    label: "철강·비철금속",
    group: "금속·기계",
    ksicDivisions: [24],
    examples: "제철·제강, 압연, 비철금속 제련·가공",
    reviewKeys: ["integratedEnvironmentalPermitTarget", "airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas", "psmCovered", "heatUseEquipment", "hazardousMachineryInspectionRequired", "energyUsePlanRequired"],
    initialValues: {},
  },
  {
    id: "FABRICATED_METAL",
    label: "금속가공·도금·표면처리",
    group: "금속·기계",
    ksicDivisions: [25],
    examples: "주조·단조, 절삭가공, 도금, 금속구조물",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
  {
    id: "MACHINERY_EQUIPMENT",
    label: "일반·특수목적 기계",
    group: "금속·기계",
    ksicDivisions: [29],
    examples: "산업기계, 공작기계, 냉동공조, 로봇",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
  {
    id: "INDUSTRIAL_EQUIPMENT_REPAIR",
    label: "산업용 기계·장비 수리",
    group: "금속·기계",
    ksicDivisions: [34],
    examples: "산업기계·전기·운송장비 수리·정비",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas"],
    initialValues: {},
  },
  {
    id: "SEMICONDUCTOR_ELECTRONICS",
    label: "반도체·디스플레이 전공정",
    group: "전기전자·정밀",
    ksicDivisions: [26],
    examples: "반도체 소자·소재, 디스플레이 패널, 웨이퍼·식각·증착 공정",
    reviewKeys: ["integratedEnvironmentalPermitTarget", "airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousChemicalBusiness", "hazardousMaterials", "highPressureGas", "specificHighPressureGasUse", "psmCovered", "privateElectricalFacilityWork", "energyUsePlanRequired"],
    initialValues: { chemicalsHandled: true },
  },
  {
    id: "ELECTRONICS_COMMUNICATION",
    label: "전자부품·컴퓨터·통신장비",
    group: "전기전자·정밀",
    ksicDivisions: [26],
    examples: "전자부품 조립, 컴퓨터·주변기기, 통신·영상·음향기기",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "hazardousMachineryInspectionRequired", "privateElectricalFacilityWork"],
    initialValues: {},
  },
  {
    id: "MEDICAL_PRECISION_OPTICAL",
    label: "의료·정밀·광학기기",
    group: "전기전자·정밀",
    ksicDivisions: [27],
    examples: "의료기기, 측정·제어기기, 광학기기",
    reviewKeys: ["waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
  {
    id: "ELECTRICAL_EQUIPMENT",
    label: "전기장비",
    group: "전기전자·정밀",
    ksicDivisions: [28],
    examples: "전동기·변압기, 배전반, 전선, 조명장치",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "hazardousMachineryInspectionRequired", "privateElectricalFacilityWork"],
    initialValues: {},
  },
  {
    id: "AUTOMOTIVE_MOBILITY",
    label: "자동차·모빌리티",
    group: "수송장비",
    ksicDivisions: [30],
    examples: "완성차, 차체·부품, 전기차 구동부품",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas", "hazardousMachineryInspectionRequired", "energyUsePlanRequired"],
    initialValues: {},
  },
  {
    id: "SHIPBUILDING_AEROSPACE_RAIL",
    label: "조선·항공·철도",
    group: "수송장비",
    ksicDivisions: [31],
    examples: "선박·해양플랜트, 항공기, 철도차량",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
  {
    id: "GENERAL_MANUFACTURING",
    label: "기타·세부 업종 미정",
    group: "생활·바이오",
    ksicDivisions: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
    examples: "세부 업종 또는 주 공정이 아직 정해지지 않은 제조업",
    reviewKeys: ["airEmissionFacility", "waterDischargeFacility", "noiseVibrationFacility", "chemicalsHandled", "hazardousMaterials", "highPressureGas", "hazardousMachineryInspectionRequired"],
    initialValues: {},
  },
] as const satisfies readonly IndustryProfile[];

export type IndustryProfileId = (typeof industryProfiles)[number]["id"];

export const industryProfileGroups = [
  "디지털 인프라",
  "생활·바이오",
  "석유·화학·소재",
  "금속·기계",
  "전기전자·정밀",
  "수송장비",
] as const;

export const industryProfilePresetKeys = [
  "chemicalsHandled",
  "chemicalManufactureOrImport",
  "hazardousMaterials",
] as const satisfies readonly IndustryInitialValueField[];

export function getIndustryProfile(id: string) {
  return industryProfiles.find((profile) => profile.id === id) ?? null;
}

export function getIndustryProfileLabel(id: string) {
  return getIndustryProfile(id)?.label ?? id;
}

/**
 * 업종 프로필을 적용하되 사용자가 이미 답한 값은 덮어쓰지 않습니다.
 * 따라서 최초 선택 시 흔한 공정 특성이 채워지고, 이후 모든 항목을
 * 사용자가 자유롭게 수정할 수 있습니다.
 */
export function applyIndustryProfile(
  answers: ScenarioAnswers,
  industryCategory: string,
): ScenarioAnswers {
  const profile = getIndustryProfile(industryCategory);
  const next: ScenarioAnswers = { ...answers, industryCategory };
  if (!profile) return next;

  for (const [key, value] of Object.entries(profile.initialValues)) {
    const typedKey = key as IndustryInitialValueField;
    if (answers[typedKey] === null) {
      (next as unknown as Record<string, unknown>)[typedKey] = value;
    }
  }
  return next;
}

export function getIndustryProfilePatch(
  answers: ScenarioAnswers,
  industryCategory: string,
): Partial<ScenarioAnswers> {
  const applied = applyIndustryProfile(answers, industryCategory);
  const patch: Partial<ScenarioAnswers> = {};
  for (const key of ["industryCategory", ...industryProfilePresetKeys] as const) {
    if (applied[key] !== answers[key]) {
      (patch as Record<string, unknown>)[key] = applied[key];
    }
  }
  return patch;
}

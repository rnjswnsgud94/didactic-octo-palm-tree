import type { ApplicabilityStatus } from "@/lib/domain/schemas";

export const stageLabels = {
  SITE_REVIEW: "입지 사전검토",
  PLAN_AND_OCCUPANCY: "계획 승인·입주",
  PRE_CONSTRUCTION: "착공 준비",
  DURING_CONSTRUCTION: "공사 중",
  PRE_OPERATION: "준공·가동 준비",
  POST_OPERATION: "가동 이후",
} as const;

export const laneLabels = {
  COMPANY: "사업자·설계·대행",
  INDUSTRIAL_COMPLEX_AUTHORITY: "산업단지 관리기관",
  CITY_COUNTY_DISTRICT: "관할 시·군·구",
  PROVINCE: "관할 시·도",
  CENTRAL_OR_REGIONAL_OFFICE: "중앙부처·특별지방행정기관",
  ENVIRONMENT_SAFETY_FIRE_UTILITY: "환경·안전·소방·공급기관",
} as const;

export const statusLabels: Record<ApplicabilityStatus, string> = {
  APPLIES: "필수 절차",
  DOES_NOT_APPLY: "거칠 필요 없음",
  POSSIBLY_APPLIES: "대상 여부 확인 필요",
  NEEDS_MORE_INFO: "대상 여부 확인 필요",
};

export type ProcedureCategory = "REQUIRED" | "CONFIRM" | "NOT_REQUIRED";

export const procedureCategoryOrder: ProcedureCategory[] = ["REQUIRED", "CONFIRM", "NOT_REQUIRED"];

export const procedureCategorySummaries: Record<ProcedureCategory, { label: string; description: string; empty: string }> = {
  REQUIRED: {
    label: "필수적으로 거쳐야 하는 절차",
    description: "현재 입력값이 포함규칙과 일치해 계획경로에 넣은 절차",
    empty: "현재 입력값으로 확정된 필수 절차가 없습니다.",
  },
  CONFIRM: {
    label: "대상 여부 확인이 필요한 절차",
    description: "관계기관 확인 또는 추가 사업정보가 있어야 적용 여부가 정해지는 절차",
    empty: "대상 여부를 별도로 확인할 절차가 없습니다.",
  },
  NOT_REQUIRED: {
    label: "거칠 필요가 없는 절차",
    description: "현재 입력값이 제외규칙과 일치하거나 적용조건에 해당하지 않는 절차",
    empty: "현재 조건에서 제외되는 절차가 없습니다.",
  },
};

export function procedureCategoryForDecision(decision: {
  status: ApplicabilityStatus;
  provisionalEffect: "INCLUDE" | "EXCLUDE" | null;
  conflictRuleIds: string[];
}): ProcedureCategory {
  if (!decision.conflictRuleIds.length && decision.provisionalEffect === "INCLUDE") return "REQUIRED";
  if (!decision.conflictRuleIds.length && decision.provisionalEffect === "EXCLUDE") return "NOT_REQUIRED";
  if (decision.status === "APPLIES") return "REQUIRED";
  if (decision.status === "DOES_NOT_APPLY") return "NOT_REQUIRED";
  return "CONFIRM";
}

export const actionLabels = {
  PERMIT: "허가",
  APPROVAL: "승인",
  NOTICE: "신고",
  CONSULTATION: "협의",
  REVIEW: "심사",
  INSPECTION: "검사",
  REGISTRATION: "등록",
  CONTRACT: "계약",
} as const;

export const tabLabels = {
  SWIMLANE: "절차 흐름",
  LIST: "전체 절차",
  SCHEDULE: "사업 일정",
  LEGAL: "법령 근거",
  GAPS: "확인 필요",
} as const;

export type DashboardTab = keyof typeof tabLabels;

const inputLabels: Record<string, string> = {
  assessmentDate: "검토 기준일",
  plannedConstructionStartDate: "예상 공사 시작일",
  plannedConstructionEndDate: "예상 공사 종료일",
  investmentType: "투자 유형",
  "location.province": "시·도",
  "location.city": "시·군·구",
  province: "시·도",
  city: "시·군·구",
  "industrialComplex.inside": "산업단지 안/밖",
  insideIndustrialComplex: "입지 구분",
  "industry.category": "업종 유형",
  industryCategory: "업종·공정 유형",
  "industry.ksic": "한국표준산업분류(KSIC)",
  "industry.products": "생산제품",
  "industry.coreProcesses": "핵심 공정·설비·물질",
  "site.zoning": "용도지역·지구",
  "site.landCategory": "농지·산지·기타 부지 구분",
  landCategory: "부지 현황",
  "site.developmentAreaM2": "개발·사업 면적",
  "site.restrictedFactors": "입지 제한요인",
  "site.demolitionRequired": "기존 건축물 해체 여부",
  demolitionRequired: "기존 건축물 해체 여부",
  "site.roadConnectionRequired": "도로 직접 연결 여부",
  roadConnectionRequired: "도로 직접 연결허가 필요 여부",
  "site.trafficImpactAssessmentRequired": "교통영향평가 대상 여부",
  trafficImpactAssessmentRequired: "교통영향평가 대상 여부",
  "site.disasterImpactAssessmentType": "재해영향평가등 협의 유형",
  disasterImpactAssessmentType: "재해영향평가등 협의 검토 결과",
  "site.undergroundSafetyAssessmentType": "지하안전평가 유형",
  undergroundSafetyAssessmentType: "지하안전평가 검토 결과",
  "site.nationalHeritageAssessmentType": "국가유산 영향 검토 유형",
  nationalHeritageAssessmentType: "국가유산 영향 검토 결과",
  "site.militaryProtectionConsultationRequired": "군사시설 보호구역 협의 여부",
  militaryProtectionConsultationRequired: "군사시설 보호구역 협의 여부",
  "site.riverOccupationRequired": "하천점용허가 필요 여부",
  riverOccupationRequired: "하천점용허가 필요 여부",
  "site.publicWaterOccupationRequired": "공유수면 점용·사용허가 필요 여부",
  publicWaterOccupationRequired: "공유수면 점용·사용허가 필요 여부",
  "site.waterSourceProtectionZone": "상수원보호구역 해당 여부",
  waterSourceProtectionZone: "상수원보호구역 해당 여부",
  "site.groundwaterDevelopment": "지하수 개발·이용 여부",
  groundwaterDevelopment: "지하수 개발·이용 여부",
  "building.action": "건축행위",
  buildingAction: "건축행위",
  "building.mechanicalEquipmentActTarget": "기계설비법 확인·검사 대상 여부",
  mechanicalEquipmentActTarget: "기계설비법 확인·검사 대상 여부",
  existingAreaM2: "기존 공장건축면적",
  increaseAreaM2: "증가 공장건축면적",
  totalAreaM2: "사업 후 공장건축면적",
  "building.totalAreaM2": "사업 후 공장건축면적",
  "building.fireFacilityWork": "소방시설공사 대상 여부",
  fireFacilityWork: "소방시설공사 대상 여부",
  "environment.airEmissionFacility": "대기배출시설 해당 여부",
  airEmissionFacility: "대기배출시설 해당 여부",
  "environment.waterDischargeFacility": "폐수배출시설 해당 여부",
  waterDischargeFacility: "폐수배출시설 해당 여부",
  "environment.wasteFacility": "폐기물 종류·발생량",
  wasteFacility: "폐기물처리시설 설치 여부",
  "environment.chemicalsHandled": "화학물질 취급 여부",
  chemicalsHandled: "화학물질 취급 여부",
  "environment.chemicalManufactureOrImport": "화학물질·혼합물 직접 제조·수입 여부",
  chemicalManufactureOrImport: "화학물질·혼합물 직접 제조·수입 여부",
  "environment.environmentalAssessmentType": "환경영향평가 유형",
  environmentalAssessmentType: "환경영향평가 검토 결과",
  "environment.integratedPermitTarget": "통합환경허가 대상 여부",
  integratedEnvironmentalPermitTarget: "통합환경허가 대상 여부",
  "environment.hazardousChemicalBusiness": "유해화학물질 영업허가 대상 여부",
  hazardousChemicalBusiness: "유해화학물질 영업허가 대상 여부",
  "environment.chemicalRegistrationRequired": "화학물질 등록·신고 대상 여부",
  chemicalRegistrationRequired: "화학물질 등록·신고 대상 여부",
  "environment.restrictedOrToxicChemicalImport": "제한·금지·유독물질 수입허가·신고 대상 여부",
  restrictedOrToxicChemicalImport: "제한·금지·유독물질 수입허가·신고 대상 여부",
  "safety.hazardousMaterials": "지정수량 이상 위험물 여부",
  hazardousMaterials: "지정수량 이상 위험물 취급 여부",
  "safety.hazardousMaterialsTank": "위험물 탱크 설치 여부",
  hazardousMaterialsTank: "위험물 탱크 설치 여부",
  "safety.hazardousMaterialsPreventionRulesRequired": "위험물 예방규정 작성 대상 여부",
  hazardousMaterialsPreventionRulesRequired: "위험물 예방규정 작성 대상 여부",
  "safety.highPressureGas": "허가·신고 대상 고압가스 여부",
  highPressureGas: "허가·신고 대상 고압가스 여부",
  "safety.specificHighPressureGasUse": "특정고압가스 사용신고 대상 여부",
  specificHighPressureGasUse: "특정고압가스 사용신고 대상 여부",
  "safety.lpgSpecificUseFacility": "LPG 특정사용시설 완성검사 대상 여부",
  lpgSpecificUseFacility: "LPG 특정사용시설 완성검사 대상 여부",
  "safety.cityGasSpecificUseFacility": "도시가스 특정사용시설 완성검사 대상 여부",
  cityGasSpecificUseFacility: "도시가스 특정사용시설 완성검사 대상 여부",
  "safety.psmCovered": "PSM 대상 여부",
  psmCovered: "공정안전보고서(PSM) 대상 여부",
  "safety.fireSafetyManagerRequired": "소방안전관리자 선임 대상 여부",
  fireSafetyManagerRequired: "소방안전관리자 선임 대상 여부",
  "safety.heatUseEquipment": "검사대상 열사용기자재 설치 여부",
  heatUseEquipment: "검사대상 열사용기자재 설치 여부",
  "safety.hazardousMachineryInspectionRequired": "유해·위험기계 안전검사 대상 여부",
  hazardousMachineryInspectionRequired: "유해·위험기계 안전검사 대상 여부",
  "construction.safetyManagementPlanRequired": "건설공사 안전관리계획 대상 여부",
  safetyManagementPlanRequired: "건설공사 안전관리계획 대상 여부",
  "construction.specificWorkReportRequired": "유해·위험 작업 신고 대상 여부",
  specificWorkReportRequired: "유해·위험 작업 신고 대상 여부",
  "construction.asbestosPresent": "석면 함유 자재 여부",
  asbestosPresent: "석면 함유 자재 여부",
  "utilities.powerIncreaseMw": "전력 증가분",
  powerIncreaseMw: "전력 증가분",
  "utilities.waterDemandM3Day": "용수 수요",
  waterDemandM3Day: "용수 수요",
  "utilities.wastewaterM3Day": "폐수 발생량",
  wastewaterM3Day: "폐수 발생량",
  "confirmation.highPressureGasBusinessStartTarget": "관할기관의 고압가스 사업·저장소 개시신고 대상 확인",
  "confirmation.fireWorkSupervisionTarget": "관할 소방기관의 소방공사 감리대상 확인",
  "confirmation.firstFireSelfInspectionTarget": "관할 소방기관의 최초 자체점검·결과보고 대상 확인",
  "confirmation.forestRestorationObligation": "산지전용 허가권자의 복구의무·면제 여부 확인",
  "utilities.privateElectricalFacilityWork": "자가용전기설비 공사·사용전검사 대상 여부",
  privateElectricalFacilityWork: "자가용전기설비 공사·사용전검사 대상 여부",
  "utilities.energyUsePlanRequired": "에너지사용계획 대상 여부",
  energyUsePlanRequired: "에너지사용계획 협의 대상 여부",
  "utilities.publicSewerConnection": "공공하수도 연결 여부",
  publicSewerConnection: "공공하수도 연결 여부",
  "utilities.privateSewageTreatmentFacility": "개인하수처리시설 설치 여부",
  privateSewageTreatmentFacility: "개인하수처리시설 설치 여부",
  "organization.safetyManagerRequired": "안전관리자 선임 대상 여부",
  safetyManagerRequired: "안전관리자 선임 대상 여부",
  "organization.healthManagerRequired": "보건관리자 선임 대상 여부",
  healthManagerRequired: "보건관리자 선임 대상 여부",
  permitCoordination: "공장설립 승인 의제협의 범위",
};

export function inputLabel(path: string) {
  return inputLabels[path] ?? path;
}

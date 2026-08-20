import type { ApplicabilityStatus } from "@/lib/domain/schemas";

export const stageLabels = {
  SITE_REVIEW: "입지검토",
  PLAN_AND_OCCUPANCY: "계획·입주",
  PRE_CONSTRUCTION: "착공 전",
  DURING_CONSTRUCTION: "공사 중",
  PRE_OPERATION: "사용·가동 전",
  POST_OPERATION: "가동 후",
} as const;

export const laneLabels = {
  COMPANY: "기업·대행기관",
  INDUSTRIAL_COMPLEX_AUTHORITY: "산단 관리기관",
  CITY_COUNTY_DISTRICT: "시·군·구",
  PROVINCE: "시·도",
  CENTRAL_OR_REGIONAL_OFFICE: "중앙부처·지방청",
  ENVIRONMENT_SAFETY_FIRE_UTILITY: "환경·안전·소방·유틸리티",
} as const;

export const statusLabels: Record<ApplicabilityStatus, string> = {
  APPLIES: "적용",
  DOES_NOT_APPLY: "비적용",
  POSSIBLY_APPLIES: "적용 가능성",
  NEEDS_MORE_INFO: "추가정보 필요",
};

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
  SWIMLANE: "스윔레인",
  LIST: "절차 목록",
  SCHEDULE: "일정·임계경로",
  LEGAL: "근거 법령",
  GAPS: "가정·미확인",
} as const;

export type DashboardTab = keyof typeof tabLabels;

const inputLabels: Record<string, string> = {
  "investmentType": "투자 유형",
  "location.province": "시·도",
  "location.city": "시·군·구",
  "industrialComplex.inside": "산업단지 안/밖",
  "industry.category": "업종 유형",
  "industry.ksic": "한국표준산업분류(KSIC)",
  "industry.products": "생산제품",
  "industry.coreProcesses": "핵심 공정·설비·물질",
  "site.zoning": "용도지역·지구",
  "site.landCategory": "농지·산지·기타 부지 구분",
  "site.developmentAreaM2": "개발·사업 면적",
  "site.restrictedFactors": "입지 제한요인",
  "site.demolitionRequired": "기존 건축물 해체 여부",
  "site.roadConnectionRequired": "도로 직접 연결 여부",
  "site.trafficImpactAssessmentRequired": "교통영향평가 대상 여부",
  "site.groundwaterDevelopment": "지하수 개발·이용 여부",
  "building.action": "건축행위",
  "building.totalAreaM2": "사업 후 공장건축면적",
  "building.fireFacilityWork": "소방시설공사 대상 여부",
  "environment.airEmissionFacility": "대기배출시설 해당 여부",
  "environment.waterDischargeFacility": "폐수배출시설 해당 여부",
  "environment.wasteFacility": "폐기물 종류·발생량",
  "environment.chemicalsHandled": "화학물질 취급 여부",
  "environment.chemicalManufactureOrImport": "화학물질·혼합물 직접 제조·수입 여부",
  "environment.environmentalAssessmentType": "환경영향평가 유형",
  "environment.integratedPermitTarget": "통합환경허가 대상 여부",
  "environment.hazardousChemicalBusiness": "유해화학물질 영업허가 대상 여부",
  "safety.hazardousMaterials": "지정수량 이상 위험물 여부",
  "safety.highPressureGas": "허가·신고 대상 고압가스 여부",
  "safety.specificHighPressureGasUse": "특정고압가스 사용신고 대상 여부",
  "safety.psmCovered": "PSM 대상 여부",
  "utilities.powerIncreaseMw": "전력 증가분",
  "utilities.waterDemandM3Day": "용수 수요",
  "utilities.wastewaterM3Day": "폐수 발생량",
  "utilities.privateElectricalFacilityWork": "자가용전기설비 공사·사용전검사 대상 여부",
  "utilities.energyUsePlanRequired": "에너지사용계획 대상 여부",
  "permitCoordination": "공장설립승인 의제협의 범위",
};

export function inputLabel(path: string) {
  return inputLabels[path] ?? path;
}

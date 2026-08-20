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

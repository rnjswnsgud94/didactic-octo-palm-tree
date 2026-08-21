export const supplementalPermitTargetIds = [
  "road-occupation-permit",
  "fugitive-emission-facility-report",
  "fugitive-dust-business-report",
  "nonpoint-source-installation-report",
  "business-waste-generator-report",
  "designated-waste-plan-confirmation",
  "construction-waste-plan-report",
  "soil-contamination-facility-report",
  "hazard-prevention-plan",
] as const;

export type SupplementalPermitTargetId =
  (typeof supplementalPermitTargetIds)[number];

export const supplementalPermitTargetNames: Record<
  SupplementalPermitTargetId,
  string
> = {
  "road-occupation-permit": "도로점용허가",
  "fugitive-emission-facility-report": "비산배출시설 설치·운영 신고",
  "fugitive-dust-business-report": "비산먼지 발생사업 신고",
  "nonpoint-source-installation-report": "비점오염원 설치신고",
  "business-waste-generator-report": "사업장폐기물배출자 신고",
  "designated-waste-plan-confirmation": "지정폐기물 처리계획 확인",
  "construction-waste-plan-report": "건설폐기물 처리계획 신고",
  "soil-contamination-facility-report": "특정토양오염관리대상시설 신고·검사",
  "hazard-prevention-plan": "유해·위험방지계획서 제출·심사",
};

export const supplementalPermitTargetDescriptions: Record<
  SupplementalPermitTargetId,
  string
> = {
  "road-occupation-permit": "실제 도로구역 점용·굴착 여부",
  "fugitive-emission-facility-report": "대상 업종·공정·유해대기오염물질 여부",
  "fugitive-dust-business-report": "공사 종류·면적·토공량 등 신고기준 충족 여부",
  "nonpoint-source-installation-report": "법정 개발사업·사업장 및 규모기준 충족 여부",
  "business-waste-generator-report": "폐기물 종류·일평균 발생량 등 신고기준 충족 여부",
  "designated-waste-plan-confirmation": "지정폐기물 코드·월평균 발생량 기준 충족 여부",
  "construction-waste-plan-report": "건설폐기물 총 5톤 이상 발생 여부",
  "soil-contamination-facility-report": "특정시설 종류·물질·저장용량 기준 충족 여부",
  "hazard-prevention-plan": "법정 업종·규모 또는 지정 기계·설비 대상 여부",
};

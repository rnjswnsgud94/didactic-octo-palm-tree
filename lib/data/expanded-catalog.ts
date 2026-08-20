import type {
  ApplicabilityRule,
  Condition,
  DurationEstimate,
  LegalCitation,
  LegalSource,
  Procedure,
  ProcedureEdge,
} from "@/lib/domain/schemas";

const REVIEW_DATE = "2026-08-20";
const VERSION = "2026.08.20.3";

type SourceSeed = {
  id: string;
  title: string;
  authority: string;
  url: string;
  effectiveDate?: string;
  mst?: string;
  documentType?: LegalSource["documentType"];
};

const sourceSeeds: SourceSeed[] = [
  { id: "src-national-land-planning-act-20260603", title: "국토의 계획 및 이용에 관한 법률", authority: "국토교통부", url: "https://www.law.go.kr/법령/국토의계획및이용에관한법률", effectiveDate: "2026-06-03", mst: "280113" },
  { id: "src-farmland-act-20260616", title: "농지법", authority: "농림축산식품부", url: "https://www.law.go.kr/법령/농지법", effectiveDate: "2026-06-16", mst: "286901" },
  { id: "src-forestland-act-current", title: "산지관리법", authority: "산림청", url: "https://www.law.go.kr/법령/산지관리법" },
  { id: "src-building-management-act-current", title: "건축물관리법", authority: "국토교통부", url: "https://www.law.go.kr/법령/건축물관리법" },
  { id: "src-urban-traffic-act-20260603", title: "도시교통정비 촉진법", authority: "국토교통부", url: "https://www.law.go.kr/법령/도시교통정비촉진법", effectiveDate: "2026-06-03", mst: "280121" },
  { id: "src-road-act-20260603", title: "도로법", authority: "국토교통부", url: "https://www.law.go.kr/법령/도로법", effectiveDate: "2026-06-03", mst: "280119" },
  { id: "src-groundwater-act-current", title: "지하수법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/지하수법" },
  { id: "src-eia-act-current", title: "환경영향평가법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/환경영향평가법" },
  { id: "src-integrated-environment-act-20260707", title: "환경오염시설의 통합관리에 관한 법률", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/환경오염시설의통합관리에관한법률", effectiveDate: "2026-07-07", mst: "287993" },
  { id: "src-air-management-area-act-current", title: "대기관리권역의 대기환경개선에 관한 특별법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/대기관리권역의대기환경개선에관한특별법" },
  { id: "src-noise-vibration-act-current", title: "소음·진동관리법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/소음진동관리법" },
  { id: "src-waste-control-act-current", title: "폐기물관리법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/폐기물관리법" },
  { id: "src-construction-waste-act-current", title: "건설폐기물의 재활용촉진에 관한 법률", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/건설폐기물의재활용촉진에관한법률" },
  { id: "src-soil-environment-act-current", title: "토양환경보전법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/토양환경보전법" },
  { id: "src-chemicals-control-act-current", title: "화학물질관리법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/화학물질관리법", effectiveDate: "2025-10-01", mst: "276815" },
  { id: "src-fire-facilities-act-current", title: "소방시설 설치 및 관리에 관한 법률", authority: "소방청", url: "https://www.law.go.kr/법령/소방시설설치및관리에관한법률" },
  { id: "src-fire-facility-business-act-current", title: "소방시설공사업법", authority: "소방청", url: "https://www.law.go.kr/법령/소방시설공사업법" },
  { id: "src-hazardous-materials-act-current", title: "위험물안전관리법", authority: "소방청", url: "https://www.law.go.kr/법령/위험물안전관리법" },
  { id: "src-electrical-safety-act-20260201", title: "전기안전관리법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/전기안전관리법", effectiveDate: "2026-02-01" },
  { id: "src-energy-use-act-current", title: "에너지이용 합리화법", authority: "기후에너지환경부", url: "https://www.law.go.kr/법령/에너지이용합리화법" },
  { id: "src-high-pressure-gas-act-current", title: "고압가스 안전관리법", authority: "산업통상부", url: "https://www.law.go.kr/법령/고압가스안전관리법" },
];

export const expandedLegalSources: LegalSource[] = sourceSeeds.map((source) => ({
  id: source.id,
  title: source.title,
  documentType: source.documentType ?? "ACT",
  issuingAuthority: source.authority,
  jurisdictionCode: null,
  industrialComplexId: null,
  lawId: null,
  mst: source.mst ?? null,
  proclamationDate: null,
  proclamationNumber: null,
  effectiveDate: source.effectiveDate ?? null,
  repealDate: null,
  apiRetrievedAt: null,
  internallyVerifiedAt: REVIEW_DATE,
  contentHash: `official-page-review:${source.id}`,
  officialUrl: source.url,
  status: "AUTHORITATIVE",
}));

const BUILDING_WORK: Condition = { in: { path: "building.action", values: ["NEW_BUILD", "EXTENSION", "MAJOR_REPAIR", "CHANGE_OF_USE"] } };
const ANY_INVESTMENT: Condition = { in: { path: "investmentType", values: ["NEW", "EXPANSION", "RELOCATION", "PROCESS_CHANGE", "INDUSTRY_CHANGE"] } };
const CHEMICALS: Condition = { eq: { path: "environment.chemicalsHandled", value: true } };
const POWER_WORK: Condition = { gt: { path: "utilities.powerIncreaseMw", value: 0 } };
const PRIVATE_ELECTRICAL_FACILITY_WORK: Condition = { eq: { path: "utilities.privateElectricalFacilityWork", value: true } };
const SPECIFIC_HIGH_PRESSURE_GAS_USE: Condition = { eq: { path: "safety.specificHighPressureGasUse", value: true } };
const CHEMICAL_MANUFACTURE_OR_IMPORT: Condition = { eq: { path: "environment.chemicalManufactureOrImport", value: true } };

type PermitSeed = {
  id: string;
  name: string;
  aliases?: string[];
  description: string;
  outcome: string;
  stage: Procedure["stage"];
  actionType?: Procedure["actionType"];
  domain: string;
  lane: Procedure["lane"];
  applicant: string;
  authority: string;
  decisionMaker?: string;
  consultations?: string[];
  submissions: string[];
  followUp: string[];
  sourceId: string;
  article: string;
  paragraph?: string;
  citationSummary: string;
  condition: Condition;
  requiredInputs: string[];
  explanation: string;
  reviewNote: string;
  verified?: boolean;
  days?: [number, number, number];
  statutoryPeriod?: string;
  durationEvidence?: DurationEstimate["evidenceType"];
  variability?: string[];
  deemedBy?: string[];
  deems?: string[];
};

const permitSeeds: PermitSeed[] = [
  {
    id: "development-activity-permit", name: "개발행위허가", aliases: ["토지형질변경허가"],
    description: "개별입지에서 건축물·공작물을 설치하거나 토지 형질을 변경하는 경우 용도지역, 기반시설, 환경·경관 기준을 종합 심사하는 절차입니다.", outcome: "개발행위허가서 또는 조건부허가",
    stage: "SITE_REVIEW", domain: "입지·토지", lane: "CITY_COUNTY_DISTRICT", applicant: "사업자 또는 토지사용권자", authority: "관할 시·군·구 개발행위허가 부서",
    consultations: ["도시계획·환경·도로·농지·산지 관계부서"], submissions: ["토지 권원자료", "배치도·공사계획도·설계도서", "환경·경관·위해 방지계획", "공공시설 귀속·부담 조서(해당 시)"], followUp: ["허가조건 이행", "준공검사 대상 여부 확인"],
    sourceId: "src-national-land-planning-act-20260603", article: "제56조", citationSummary: "건축물 건축, 공작물 설치, 토지 형질변경 등 대통령령상 개발행위는 원칙적으로 관할 허가권자의 허가가 필요하다.",
    condition: { all: [{ eq: { path: "industrialComplex.inside", value: false } }, BUILDING_WORK] }, requiredInputs: ["site.zoning", "site.developmentAreaM2", "site.restrictedFactors"], explanation: "개별입지의 건축·개발행위이므로 개발행위허가 및 건축허가 의제협의 여부를 검토합니다.", reviewNote: "용도지역·개발면적·경사도·조례와 건축허가 의제서류를 확인해야 확정됩니다.", days: [15, 15, 30], statutoryPeriod: "정부24 전국 공통 안내 기준 총 15일; 보완·협의기간은 별도", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["용도지역", "도시계획위원회 심의", "관계부서 협의"], deemedBy: ["building-permit", "factory-establishment-approval"],
  },
  {
    id: "farmland-conversion-permit", name: "농지전용허가", description: "현황 또는 지목상 농지를 공장용지·도로 등으로 전용할 때 농업진흥지역, 면적, 시설 제한을 심사받는 절차입니다.", outcome: "농지전용허가 및 농지보전부담금 부과내역",
    stage: "SITE_REVIEW", domain: "입지·농지", lane: "CITY_COUNTY_DISTRICT", applicant: "농지를 전용하려는 사업자", authority: "면적·농업진흥지역에 따른 시·군·구, 시·도 또는 농림축산식품부",
    consultations: ["농지관리 부서", "개발행위·공장설립 승인부서"], submissions: ["사업계획서", "토지 권원자료", "지형도·피해방지계획", "전용면적 산출도"], followUp: ["농지보전부담금 납부", "허가목적 외 사용·면적 변경 시 변경허가 검토"],
    sourceId: "src-farmland-act-20260616", article: "제34조", citationSummary: "농지를 전용하려는 자는 법정 예외를 제외하고 농림축산식품부장관의 허가 또는 의제협의를 받아야 한다.",
    condition: { eq: { path: "site.landCategory", value: "FARMLAND" } }, requiredInputs: ["site.developmentAreaM2", "site.restrictedFactors"], explanation: "입력한 부지 현황이 농지이므로 전용허가와 입지제한을 검토합니다.", reviewNote: "농업진흥지역 여부, 현황농지, 전용면적과 오염시설 제한을 필지별로 확인해야 합니다.", verified: true, days: [10, 20, 30], statutoryPeriod: "정부24 안내 기준 농업진흥지역·면적에 따라 10일·20일·30일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["농업진흥지역", "전용면적", "관계기관 의제협의"], deemedBy: ["factory-establishment-approval", "development-activity-permit"],
  },
  {
    id: "forestland-conversion-permit", name: "산지전용허가", description: "산지를 공장·도로·부대시설 용지로 전용하기 전 보전산지 여부, 면적, 재해·복구대책을 심사받는 절차입니다.", outcome: "산지전용허가서",
    stage: "SITE_REVIEW", domain: "입지·산지", lane: "CITY_COUNTY_DISTRICT", applicant: "산지를 전용하려는 사업자", authority: "산림청장·시도지사·시장·군수·구청장 중 법정 권한자",
    consultations: ["산림부서", "재해·개발행위 관계부서"], submissions: ["경계·현황도", "토지 권원과 사업계획", "산림조사서", "토사유출·재해방지·복구계획"], followUp: ["복구비 예치", "복구설계 승인·복구준공검사 대상 확인"],
    sourceId: "src-forestland-act-current", article: "제14조", citationSummary: "산지전용을 하려는 자는 산지 종류와 면적에 따른 법정 권한자의 허가를 받아야 한다.",
    condition: { eq: { path: "site.landCategory", value: "FOREST" } }, requiredInputs: ["site.developmentAreaM2", "site.restrictedFactors"], explanation: "입력한 부지 현황이 산지이므로 전용허가와 복구의무를 검토합니다.", reviewNote: "보전산지·산지전용제한지역·면적과 재해방지 기준 확인 전에는 확정할 수 없습니다.", variability: ["보전산지 여부", "전용면적", "산지전용타당성조사"], deemedBy: ["factory-establishment-approval", "development-activity-permit"],
  },
  {
    id: "building-demolition-permit-report", name: "건축물 해체허가·신고", description: "기존 건축물을 철거하는 경우 규모·높이·층수·주변 위험요인에 따라 해체허가 또는 신고를 거치는 절차입니다.", outcome: "해체허가서 또는 해체신고 수리",
    stage: "PRE_CONSTRUCTION", domain: "건축·해체", lane: "CITY_COUNTY_DISTRICT", applicant: "건축물 관리자", authority: "관할 시·군·구 건축물관리 부서",
    consultations: ["석면조사기관", "해체계획 검토자·감리자"], submissions: ["해체계획서", "전문가 검토확인서(허가대상)", "석면조사 결과", "안전관리·폐기물 처리계획"], followUp: ["해체공사 착공신고", "해체감리 및 완료신고"],
    sourceId: "src-building-management-act-current", article: "제30조", citationSummary: "건축물 해체는 법정 규모와 위험요인에 따라 허가 또는 신고 대상이며 해체계획서를 제출해야 한다.",
    condition: { eq: { path: "site.demolitionRequired", value: true } }, requiredInputs: ["building.totalAreaM2", "site.restrictedFactors"], explanation: "기존 건축물 해체가 예정되어 해체허가·신고 경로를 포함합니다.", reviewNote: "연면적·높이·층수, 주요구조부 해체, 인접 위험시설 및 조례를 확인해야 허가·신고를 구분할 수 있습니다.", verified: true, days: [7, 7, 14], statutoryPeriod: "정부24 해체허가·신고 안내 기준 7일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["전문가 검토", "해체심의", "보완"],
  },
  {
    id: "traffic-impact-assessment", name: "교통영향평가", description: "도시교통정비지역·교통권역에서 대규모 공장 건축 또는 개발사업의 교통수요와 진출입·주차 개선대책을 심의받는 절차입니다.", outcome: "교통영향평가 심의의견 및 개선대책",
    stage: "PLAN_AND_OCCUPANCY", actionType: "REVIEW", domain: "교통", lane: "CITY_COUNTY_DISTRICT", applicant: "사업시행자", authority: "사업 승인관청 및 교통영향평가심의위원회",
    consultations: ["교통부서", "도로관리청", "교통영향평가 전문기관"], submissions: ["교통현황·수요예측", "진출입·내부동선·주차계획", "교통개선대책", "건축·개발계획"], followUp: ["심의의견을 건축·사업계획에 반영", "변경 시 재평가 여부 확인"],
    sourceId: "src-urban-traffic-act-20260603", article: "제15조", citationSummary: "도시교통정비지역 또는 교통권역의 대통령령상 개발사업·건축물은 교통영향평가 대상이 된다.",
    condition: { eq: { path: "site.trafficImpactAssessmentRequired", value: true } }, requiredInputs: ["building.totalAreaM2", "location.city"], explanation: "전문검토 결과 교통영향평가 대상으로 입력되어 승인 전 심의경로를 포함합니다.", reviewNote: "공장 연면적 기준, 기존·증축 합산, 복합용도와 지자체 조례를 확인한 입력값을 전제로 합니다.", verified: true, variability: ["심의위원회 일정", "보완 요구", "도로 개선대책"],
  },
  {
    id: "road-connection-permit", name: "도로 연결허가", description: "공장 진출입로를 법정 대상 도로에 직접 연결할 때 연결 위치, 가감속차로와 교통안전을 심사받는 절차입니다.", outcome: "도로 연결허가서",
    stage: "SITE_REVIEW", domain: "도로·교통", lane: "CITY_COUNTY_DISTRICT", applicant: "시설 소유자 또는 사용권자", authority: "해당 도로관리청",
    consultations: ["교통경찰", "지하매설물 관리기관", "도로안전 부서"], submissions: ["연결계획서", "가감속·회전차로 포함 설계도", "부대시설 계획", "지하매설물 의견"], followUp: ["허가조건에 따른 연결공사", "공사완료 확인 및 원상회복"],
    sourceId: "src-road-act-20260603", article: "제52조", citationSummary: "도로관리청이 아닌 자가 법정 대상 도로에 다른 도로·통로·시설을 연결하려면 미리 허가를 받아야 한다.",
    condition: { eq: { path: "site.roadConnectionRequired", value: true } }, requiredInputs: ["site.restrictedFactors"], explanation: "공장 진출입로의 도로 직접 연결이 필요하므로 연결허가를 포함합니다.", reviewNote: "도로종류, 연결금지구간, 차로 수와 관할 도로관리청을 현장별로 확인해야 합니다.", verified: true, days: [21, 21, 30], statutoryPeriod: "정부24 도로 연결허가 안내 기준 21일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["도로관리청 협의", "교통안전시설", "설계 보완"], deems: ["road-occupation-permit"],
  },
  {
    id: "road-occupation-permit", name: "도로점용허가", description: "전력·통신·상하수도·가스 관로, 출입시설이나 구조물이 도로구역을 점용할 때 받는 허가입니다.", outcome: "도로점용허가서 및 점용·복구 조건",
    stage: "PRE_CONSTRUCTION", domain: "도로·인프라", lane: "CITY_COUNTY_DISTRICT", applicant: "시설 설치·운영자", authority: "해당 도로관리청",
    consultations: ["지하매설물 관리기관", "교통경찰", "도로굴착 관계기관"], submissions: ["위치도·평면도·상세설계", "굴착·복구계획", "교통처리·안전계획", "점용기간·면적 산출서"], followUp: ["점용료 납부", "굴착복구 및 공사완료 확인"],
    sourceId: "src-road-act-20260603", article: "제61조", citationSummary: "도로구역에서 공작물·물건 또는 시설을 신설·개축·변경하거나 그 밖의 목적으로 도로를 점용하려면 도로관리청 허가가 필요하다.",
    condition: { any: [{ eq: { path: "site.roadConnectionRequired", value: true } }, POWER_WORK, { gt: { path: "utilities.waterDemandM3Day", value: 0 } }] }, requiredInputs: ["site.restrictedFactors"], explanation: "진출입 또는 유틸리티 인입으로 도로점용 가능성이 있어 점용·굴착 범위를 확인합니다.", reviewNote: "실제 도로구역 점용 여부, 관로 노선과 연결허가 의제 여부에 따라 적용됩니다.", days: [7, 7, 20], statutoryPeriod: "국가도로 정부24 안내 기준 7일; 도로종류·굴착협의에 따라 달라짐", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["도로종류", "굴착심의", "지하매설물 협의"], deemedBy: ["road-connection-permit"],
  },
  {
    id: "groundwater-development-use-permit-report", name: "지하수 개발·이용 허가·신고", description: "공업용수·공정수 확보를 위해 관정을 개발하는 경우 양수능력과 토출관 직경 등에 따라 허가 또는 신고하는 절차입니다.", outcome: "지하수 개발·이용 허가서 또는 신고증",
    stage: "PRE_CONSTRUCTION", domain: "용수·지하수", lane: "CITY_COUNTY_DISTRICT", applicant: "지하수 개발·이용자", authority: "관할 시·군·구",
    consultations: ["지하수영향조사기관(허가대상)", "상수도·환경 부서"], submissions: ["위치·시설구조·굴착계획", "토지 권원", "지하수영향조사서(허가대상)", "원상복구계획·이행보증"], followUp: ["준공 후 1개월 내 준공신고", "수질검사·이용량 신고 및 원상복구"],
    sourceId: "src-groundwater-act-current", article: "제7조·제8조", citationSummary: "지하수 개발·이용은 양수능력 등 기준에 따라 허가 또는 신고 대상이며 굴착 전 절차를 완료해야 한다.",
    condition: { eq: { path: "site.groundwaterDevelopment", value: true } }, requiredInputs: ["utilities.waterDemandM3Day"], explanation: "지하수 개발·이용이 예정되어 관정 허가·신고와 준공 경로를 포함합니다.", reviewNote: "일 양수능력, 토출관 직경, 용도와 보호구역을 확인해야 허가·신고를 구분할 수 있습니다.", verified: true, days: [7, 7, 20], statutoryPeriod: "정부24 신고·준공신고 안내 기준 각 7일; 허가는 영향조사에 따라 증가", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["지하수영향조사", "보호구역", "관정 규모"],
  },
  {
    id: "environmental-impact-assessment", name: "환경영향평가", description: "산업단지·도시·산지·폐기물시설 등 시행령상 사업유형과 규모에 해당할 때 주민의견과 환경영향 저감방안을 거쳐 승인기관이 환경부와 협의하는 절차입니다.", outcome: "환경영향평가 협의내용 통보",
    stage: "PLAN_AND_OCCUPANCY", actionType: "CONSULTATION", domain: "환경영향평가", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "사업자(승인기관을 통해 협의)", authority: "기후에너지환경부장관 또는 관할 지방환경관서",
    consultations: ["사업 승인기관", "관할 지자체", "주민·전문검토기관"], submissions: ["평가준비서", "평가서 초안·주민의견 수렴결과", "환경영향평가서", "저감·사후환경관리계획"], followUp: ["승인 전 협의내용 반영", "사전공사 금지와 사후환경영향조사"],
    sourceId: "src-eia-act-current", article: "제22조·제29조·제34조", citationSummary: "대통령령상 대상사업은 환경영향평가를 실시하고 사업 승인 전에 협의를 완료하며 협의 전 공사를 해서는 안 된다.",
    condition: { eq: { path: "environment.environmentalAssessmentType", value: "ENVIRONMENTAL" } }, requiredInputs: ["site.developmentAreaM2", "site.zoning"], explanation: "환경영향평가 대상으로 입력되어 사업 승인 전 평가·협의 절차를 포함합니다.", reviewNote: "업종 자체가 아니라 사업유형·개발면적·입지와 시행령 별표 3 판정을 전제로 합니다.", verified: true, days: [45, 45, 60], statutoryPeriod: "협의 45일, 부득이한 경우 60일; 보완·전문위원회·공휴일 등 제외", durationEvidence: "STATUTE", variability: ["주민의견", "보완", "전문위원회 검토"],
  },
  {
    id: "small-environmental-impact-assessment", name: "소규모 환경영향평가", description: "보전용도지역의 일정 규모 개발사업이 본 환경영향평가 대상은 아니지만 입지·환경영향 검토가 필요한 경우 진행하는 협의입니다.", outcome: "소규모 환경영향평가 협의내용 통보",
    stage: "PLAN_AND_OCCUPANCY", actionType: "CONSULTATION", domain: "환경영향평가", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "사업자 또는 사업 승인기관", authority: "관할 지방환경관서",
    consultations: ["사업 승인기관", "관할 지자체 환경부서"], submissions: ["사업계획·입지 현황", "환경현황 조사", "영향예측·저감방안", "도면·개발면적 산출"], followUp: ["승인 전 협의내용 반영", "협의내용 이행관리"],
    sourceId: "src-eia-act-current", article: "제43조·제44조", citationSummary: "보전이 필요한 지역에서 대통령령상 개발사업을 하려는 자는 승인 전에 소규모 환경영향평가 협의를 해야 한다.",
    condition: { eq: { path: "environment.environmentalAssessmentType", value: "SMALL" } }, requiredInputs: ["site.developmentAreaM2", "site.zoning"], explanation: "소규모 환경영향평가 대상으로 입력되어 개발·건축 승인 전 협의를 포함합니다.", reviewNote: "용도지역·사업종류·개발면적과 시행령 별표 4 판정을 전제로 합니다.", verified: true, days: [20, 30, 40], statutoryPeriod: "원칙 30일(연장 40일), 일정 사업은 20일(연장 30일); 보완기간 등 제외", durationEvidence: "STATUTE", variability: ["입지 민감도", "보완", "현지조사"],
  },
  {
    id: "integrated-environmental-permit", name: "환경오염시설 통합허가", description: "시행령상 대상 업종의 대기·수질 1·2종 등 대형 사업장이 개별 배출시설 허가를 통합환경관리계획으로 묶어 설치·운영 허가받는 절차입니다.", outcome: "배출시설등 설치·운영 통합허가서",
    stage: "PRE_CONSTRUCTION", domain: "환경·통합허가", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "통합관리사업장 설치·운영자", authority: "기후에너지환경부장관",
    consultations: ["통합허가 전문검토기관", "관할 지방환경관서"], submissions: ["통합환경관리계획서", "배출영향분석", "최적가용기법 적용자료", "시설·공정·원료·배출량 자료"], followUp: ["허가조건·허가배출기준 준수", "변경허가·변경신고와 주기적 허가조건 검토"],
    sourceId: "src-integrated-environment-act-20260707", article: "제6조·제10조", citationSummary: "대상 업종·규모의 배출시설등은 통합허가를 받아야 하며 법정 개별 환경 인허가가 의제될 수 있다.",
    condition: { eq: { path: "environment.integratedPermitTarget", value: true } }, requiredInputs: ["industry.category", "environment.airEmissionFacility", "environment.waterDischargeFacility"], explanation: "통합환경허가 대상으로 입력되어 개별 환경 인허가보다 통합허가 경로를 우선합니다.", reviewNote: "시행령 별표 1 업종과 대기·수질 종별 규모 판정을 전제로 하며, 개별 인허가 의제범위는 허가서류를 확인해야 합니다.", verified: true, days: [25, 35, 35], statutoryPeriod: "일반 허가 35일, 사전협의 경로 등 25일; 보완·공휴일 제외", durationEvidence: "OFFICIAL_AGENCY_MATERIAL", variability: ["사전협의", "통합환경관리계획 보완", "전문검토"], deems: ["air-emission-installation-permit", "water-discharge-installation-permit", "noise-vibration-facility-report"],
  },
  {
    id: "integrated-environmental-operation-start-report", name: "통합관리사업장 가동개시 신고 및 수리", description: "통합허가를 받은 배출시설등과 방지시설의 설치·변경을 완료한 뒤 실제 가동 전에 신고하고, 현장 확인을 거쳐 수리받는 절차입니다.", outcome: "배출시설등 및 방지시설 가동개시 신고필증",
    stage: "PRE_OPERATION", actionType: "NOTICE", domain: "환경·통합허가", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "통합관리사업자", authority: "기후에너지환경부장관",
    consultations: ["통합허가 전문검토기관", "관할 지방환경관서"], submissions: ["가동개시 신고서", "통합허가·변경허가 내역", "시설 설치완료·시험 자료", "폐기물처리시설 검사결과서(해당 시)"], followUp: ["현장 확인 및 신고 수리 후 가동", "시설별 시운전기간과 허가배출기준 준수"],
    sourceId: "src-integrated-environment-act-20260707", article: "제12조", citationSummary: "통합관리사업자는 배출시설등 및 방지시설의 설치·변경을 완료하여 가동하려는 경우 가동개시를 신고해야 하며, 장관은 법정 기간 안에 현장 확인 후 적합한 신고를 수리한다.",
    condition: { eq: { path: "environment.integratedPermitTarget", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], explanation: "통합환경허가 대상으로 입력되어 개별 대기·수질 가동개시 대신 통합법상 가동개시 신고·수리 경로를 포함합니다.", reviewNote: "변경신고 시설은 현장 확인기간 10일 경로가 적용될 수 있으며 폐기물처리시설은 검사결과서를 함께 제출해야 합니다.", verified: true, days: [10, 15, 15], statutoryPeriod: "시행규칙 제10조에 따라 신고 접수 후 원칙 15일, 일부 변경신고 시설은 10일 이내 현장 확인·수리", durationEvidence: "STATUTE", variability: ["변경신고 시설 여부", "현장 확인", "시설 보완"], deems: ["air-facility-operation-start-report", "water-facility-operation-start-report"],
  },
  {
    id: "air-facility-operation-start-report", name: "대기 배출·방지시설 가동개시 신고", description: "대기배출시설과 방지시설의 설치·변경을 완료한 뒤 실제 가동하기 전에 설치 내용과 가동예정일을 신고하는 절차입니다.", outcome: "가동개시 신고 접수",
    stage: "PRE_OPERATION", actionType: "NOTICE", domain: "환경·대기", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "대기배출시설 사업자", authority: "설치허가·신고 관청",
    consultations: ["관할 환경부서"], submissions: ["설치허가·신고 내역", "배출·방지시설 설치완료 자료", "가동예정일·시운전계획"], followUp: ["배출허용기준·자가측정·운영기록 준수", "변경 시 변경허가·신고 검토"],
    sourceId: "src-air-act-current-20260326", article: "제30조", citationSummary: "배출시설이나 방지시설의 설치·변경을 완료하여 가동하려는 자는 미리 가동개시 신고를 해야 한다.",
    condition: { eq: { path: "environment.airEmissionFacility", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], explanation: "대기배출시설이 있으므로 설치 완료 후 가동개시 신고를 포함합니다.", reviewNote: "통합환경허가 의제 여부와 시설별 시운전·측정의무를 확인해야 합니다.", verified: true, statutoryPeriod: "가동 전에 신고; 전국 공통 별도 심사기간 없음", durationEvidence: "STATUTE", deemedBy: ["integrated-environmental-operation-start-report"],
  },
  {
    id: "fugitive-emission-facility-report", name: "비산배출시설 설치·운영 신고", description: "굴뚝 없이 대기오염물질을 직접 배출하는 시행령상 업종·공정의 시설에 대해 설치·운영과 시설관리기준 준수계획을 신고합니다.", outcome: "비산배출시설 신고 수리",
    stage: "PRE_OPERATION", actionType: "NOTICE", domain: "환경·대기", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "비산배출시설 설치·운영자", authority: "관할 지방환경관서",
    consultations: ["관할 환경청"], submissions: ["시설 명세·배치도", "물질·공정 설명", "시설관리기준 준수계획", "점검·측정계획"], followUp: ["시설관리기준 준수", "정기점검보고서와 변경신고"],
    sourceId: "src-air-act-current-20260326", article: "제38조의2", citationSummary: "대통령령상 업종에서 비산배출되는 유해대기오염물질을 취급하는 시설은 설치·운영 신고와 시설관리기준 준수가 필요하다.",
    condition: { all: [CHEMICALS, { in: { path: "industry.category", values: ["SEMICONDUCTOR_ELECTRONICS", "SECONDARY_BATTERY_CHEMICAL"] } }] }, requiredInputs: ["industry.coreProcesses"], explanation: "화학물질을 취급하는 전자·화학 공정이므로 비산배출 업종·공정 해당 여부를 검토합니다.", reviewNote: "시행령 대상업종과 공정·물질을 대조하기 전에는 적용 가능성으로만 표시합니다.", days: [10, 10, 10], statutoryPeriod: "신고수리 10일; 기간 내 미통지 시 수리 간주", durationEvidence: "STATUTE", variability: ["대상 업종", "공정·물질", "시설관리기준"],
  },
  {
    id: "fugitive-dust-business-report", name: "비산먼지 발생사업 신고", description: "공장 신축·증축 과정의 토공·철거 등 공사가 시행규칙상 종류·규모에 해당할 때 비산먼지 억제계획을 신고합니다.", outcome: "비산먼지 발생사업 신고증명",
    stage: "PRE_CONSTRUCTION", actionType: "NOTICE", domain: "환경·대기", lane: "CITY_COUNTY_DISTRICT", applicant: "공사 발주자 또는 사업자", authority: "관할 시·군·구",
    consultations: ["대기환경 부서", "건축·공사 부서"], submissions: ["공사개요·위치도", "토공·철거 규모", "비산먼지 억제시설·조치계획"], followUp: ["억제시설 설치·운영", "공사규모·기간 변경 시 변경신고"],
    sourceId: "src-air-act-current-20260326", article: "제43조", citationSummary: "비산먼지를 발생시키는 대통령령상 사업은 관할 행정기관에 신고하고 억제시설 설치 등 조치를 해야 한다.",
    condition: BUILDING_WORK, requiredInputs: ["site.developmentAreaM2", "site.demolitionRequired"], explanation: "건축공사가 있으므로 공사종류·면적·토공량에 따른 비산먼지 신고를 검토합니다.", reviewNote: "공장 건축 자체가 자동 대상은 아니며 시행규칙의 공사 종류·규모 기준 확인이 필요합니다.", variability: ["토공면적", "공사종류", "지역별 접수기준"],
  },
  {
    id: "air-total-management-business-permit", name: "대기 총량관리사업장 설치허가", description: "비수도권을 포함한 대기관리권역에서 연간 질소산화물·황산화물·먼지 배출량 기준을 충족하는 사업장이 배출허용총량을 부여받는 절차입니다.", outcome: "총량관리사업장 설치허가 및 배출허용총량",
    stage: "PRE_CONSTRUCTION", domain: "환경·대기", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "총량관리 대상 사업장 설치자", authority: "기후에너지환경부장관 또는 위임기관",
    consultations: ["관할 지방환경관서", "시·도 환경부서"], submissions: ["연료·원료 사용계획", "배출·방지시설 명세", "5년 배출량 예측", "총량저감계획"], followUp: ["배출허용총량 준수", "측정기기 설치·배출량 보고"],
    sourceId: "src-air-management-area-act-current", article: "제15조", citationSummary: "대기관리권역에서 배출량 기준을 초과하는 사업장을 설치하려는 자는 총량관리사업장 설치허가를 받아야 한다.",
    condition: { eq: { path: "environment.airEmissionFacility", value: true } }, requiredInputs: ["location.city", "industry.coreProcesses"], explanation: "대기배출시설이 있으므로 비수도권 대기관리권역과 연간 배출량 기준을 확인합니다.", reviewNote: "소재지 권역 포함 여부와 NOx·SOx·먼지 연간 배출량이 없어 적용 가능성으로 표시합니다.", variability: ["대기관리권역", "연간 배출량", "배출총량 배정"],
  },
  {
    id: "water-facility-operation-start-report", name: "폐수 배출·방지시설 가동시작 신고", description: "폐수배출시설과 수질오염방지시설 설치·변경을 완료한 뒤 가동 전에 처리계통과 가동예정일을 신고합니다.", outcome: "가동시작 신고 접수",
    stage: "PRE_OPERATION", actionType: "NOTICE", domain: "환경·수질", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "폐수배출시설 사업자", authority: "설치허가·신고 관청",
    consultations: ["관할 수질환경 부서"], submissions: ["허가·신고 내역", "배출·방지시설 설치완료 자료", "처리계통·가동예정일", "시운전계획"], followUp: ["배출허용기준·운영기록 준수", "폐수무방류시설 조사 대응"],
    sourceId: "src-water-act-current-20260219", article: "제37조", citationSummary: "배출시설 또는 방지시설의 설치를 완료하여 가동하려는 자는 가동시작 신고를 해야 한다.",
    condition: { eq: { path: "environment.waterDischargeFacility", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], explanation: "폐수배출시설이 있으므로 설치 완료 후 가동시작 신고를 포함합니다.", reviewNote: "통합환경허가 의제와 폐수무방류·시운전 기간 여부를 확인해야 합니다.", verified: true, statutoryPeriod: "가동 전에 신고; 폐수무방류배출시설은 신고일부터 10일 이내 기준 조사", durationEvidence: "STATUTE", deemedBy: ["integrated-environmental-operation-start-report"],
  },
  {
    id: "nonpoint-source-installation-report", name: "비점오염원 설치신고", description: "일정 규모 이상의 개발사업 또는 사업장에서 빗물 유출로 발생하는 오염을 줄이기 위한 저감계획·시설을 신고합니다.", outcome: "비점오염원 설치신고 증명",
    stage: "PRE_CONSTRUCTION", actionType: "NOTICE", domain: "환경·수질", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "개발사업자 또는 사업장 설치자", authority: "관할 유역·지방환경청",
    consultations: ["사업 승인기관", "관할 지자체 환경부서"], submissions: ["사업·사업장 개요", "위치도·개발면적", "비점오염 저감계획", "저감시설 설계도"], followUp: ["저감시설 설치·운영", "변경신고 및 관리·점검"],
    sourceId: "src-water-act-current-20260219", article: "제53조", citationSummary: "대통령령상 개발사업 또는 사업장은 비점오염원 설치신고와 저감시설 설치 등 조치를 해야 한다.",
    condition: { any: [BUILDING_WORK, { gt: { path: "utilities.wastewaterM3Day", value: 0 } }] }, requiredInputs: ["site.developmentAreaM2", "environment.environmentalAssessmentType"], explanation: "개발공사 또는 사업장 운영으로 비점오염원 기준 해당 여부를 검토합니다.", reviewNote: "사업유형·부지면적·환경영향평가 대상 여부가 없어 적용 가능성으로 표시합니다.", days: [10, 10, 20], statutoryPeriod: "설치신고 10일, 저감시설 설치면제 신고 20일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["개발면적", "저감시설", "환경영향평가 연계"],
  },
  {
    id: "noise-vibration-facility-report", name: "소음·진동배출시설 설치신고·허가", description: "프레스·압축기 등 시행규칙상 기계·기구를 설치할 때 주변지역과 입지에 따라 신고 또는 허가하는 절차입니다.", outcome: "소음·진동배출시설 허가증 또는 신고증명",
    stage: "PRE_CONSTRUCTION", domain: "환경·소음진동", lane: "CITY_COUNTY_DISTRICT", applicant: "배출시설 설치자", authority: "관할 시·군·구",
    consultations: ["소음·진동 환경부서"], submissions: ["시설명세·배치도", "기계 출력·대수", "소음·진동 예측", "방지시설 계획"], followUp: ["배출허용기준 준수", "변경신고·방지시설 운영"],
    sourceId: "src-noise-vibration-act-current", article: "제8조·제9조", citationSummary: "소음·진동배출시설 설치자는 법정 입지에 따라 설치신고 또는 허가를 해야 하며 산업단지 등의 공장은 일부 제외된다.",
    condition: ANY_INVESTMENT, requiredInputs: ["industry.coreProcesses", "industrialComplex.inside"], explanation: "제조업 기계·설비가 소음·진동 배출시설 분류에 해당하는지 검토합니다.", reviewNote: "기계 종류·출력, 학교·병원 주변 여부와 산업단지 제외규정을 확인해야 합니다.", deemedBy: ["integrated-environmental-permit"],
  },
  {
    id: "business-waste-generator-report", name: "사업장폐기물배출자 신고", description: "대기·수질·소음 배출시설 사업장 또는 폐기물 발생량 기준을 충족하는 제조 사업장이 폐기물 종류·양과 위탁처리계획을 신고합니다.", outcome: "사업장폐기물배출자 신고증명",
    stage: "PRE_OPERATION", actionType: "NOTICE", domain: "환경·폐기물", lane: "CITY_COUNTY_DISTRICT", applicant: "사업장폐기물 배출자", authority: "폐기물 발생지 관할 시·군·구",
    consultations: ["폐기물 처리업체", "관할 환경부서"], submissions: ["폐기물 종류·일평균 발생량", "보관·운반·처리계획", "수탁처리능력 확인자료", "성상분석자료(해당 시)"], followUp: ["올바로시스템 인계·인수", "발생량·처리방법 변경신고"],
    sourceId: "src-waste-control-act-current", article: "제17조", citationSummary: "대통령령상 사업장폐기물 배출자는 폐기물 처리계획을 수립하고 법정 신고·확인의무를 이행해야 한다.",
    condition: ANY_INVESTMENT, requiredInputs: ["environment.wasteFacility", "industry.coreProcesses"], explanation: "제조사업장에서 발생하는 사업장폐기물의 종류·일평균량 기준을 확인합니다.", reviewNote: "배출시설 여부와 일평균 100kg·300kg 등 시행규칙 유형별 기준을 확인해야 합니다.", variability: ["폐기물 종류·발생량", "위탁처리계약", "지정폐기물 여부"],
  },
  {
    id: "designated-waste-plan-confirmation", name: "지정폐기물 처리계획 확인", description: "폐산·폐알칼리·폐유기용제·폐유·폐흡착제·폐촉매 등 지정폐기물이 종류별 월평균 기준 이상 발생할 때 처리계획을 확인받습니다.", outcome: "지정폐기물 처리계획 확인",
    stage: "PRE_OPERATION", actionType: "REVIEW", domain: "환경·폐기물", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "지정폐기물 배출자", authority: "관할 지방환경관서 또는 법정 위임기관",
    consultations: ["폐기물 분석기관", "지정폐기물 처리업체"], submissions: ["지정폐기물 종류·코드·월평균량", "성상분석 결과", "보관·운반·처리계획", "수탁확인서"], followUp: ["확인내용에 따른 보관·인계", "종류·양·처리방법 변경 시 변경확인"],
    sourceId: "src-waste-control-act-current", article: "제17조제5항", citationSummary: "환경 위해성이 높은 지정폐기물 배출자는 처리 전에 폐기물 처리계획 확인을 받아야 한다.",
    condition: { any: [CHEMICALS, { in: { path: "industry.category", values: ["SEMICONDUCTOR_ELECTRONICS", "SECONDARY_BATTERY_CHEMICAL"] } }] }, requiredInputs: ["industry.coreProcesses"], explanation: "화학·전자 공정에서 지정폐기물 발생 가능성이 있어 폐기물 코드·월평균량 기준을 확인합니다.", reviewNote: "물질별 폐기물 코드와 시행규칙상 월평균 임계값이 없어 적용 가능성으로 표시합니다.", variability: ["폐기물 코드", "월평균량", "성상분석"],
  },
  {
    id: "construction-waste-plan-report", name: "건설폐기물 처리계획 신고", description: "신축·증축·해체공사에서 건설폐기물이 총 5톤 이상 발생할 것으로 예상되면 분리배출·운반·처리계획을 착공 전 신고합니다.", outcome: "건설폐기물 처리계획 신고증명",
    stage: "PRE_CONSTRUCTION", actionType: "NOTICE", domain: "환경·건설폐기물", lane: "CITY_COUNTY_DISTRICT", applicant: "건설공사 발주자", authority: "관할 시·군·구 환경부서",
    consultations: ["건설폐기물 수집·운반·처리업체", "건축·해체 부서"], submissions: ["공사개요", "폐기물 종류·예상량", "분리배출·현장재활용계획", "운반·처리계약 자료"], followUp: ["올바로시스템 인계", "폐기물 종류·양·처리업체 변경신고"],
    sourceId: "src-construction-waste-act-current", article: "제17조", citationSummary: "건설폐기물을 5톤 이상 배출하는 자는 착공 전 처리계획을 신고하고 관할기관은 10일 이내 수리 여부를 통지한다.",
    condition: { any: [BUILDING_WORK, { eq: { path: "site.demolitionRequired", value: true } }] }, requiredInputs: ["site.developmentAreaM2"], explanation: "건축·해체공사가 있어 건설폐기물 5톤 기준과 처리계획 신고를 확인합니다.", reviewNote: "공사 전체 예상발생량 5톤 기준과 발주·도급 구조를 확인해야 합니다.", verified: true, days: [10, 10, 10], statutoryPeriod: "신고수리 10일, 기간 내 미통지 시 수리 간주", durationEvidence: "STATUTE", variability: ["예상발생량", "처리계약", "현장재활용"],
  },
  {
    id: "soil-contamination-facility-report", name: "특정토양오염관리대상시설 설치신고·검사", description: "대용량 석유류 저장시설 등 시행령상 시설을 설치할 때 토양오염 방지계획을 신고하고 최초·정기검사를 받는 절차입니다.", outcome: "설치신고 증명 및 토양오염검사 결과",
    stage: "PRE_CONSTRUCTION", actionType: "NOTICE", domain: "환경·토양", lane: "CITY_COUNTY_DISTRICT", applicant: "대상시설 설치자", authority: "관할 시·군·구",
    consultations: ["토양관련전문기관", "위험물·화학물질 관계부서"], submissions: ["시설내역·도면", "저장물질명·용량·농도", "오염방지시설 계획", "주변 현황도"], followUp: ["최초·정기 토양오염검사", "누출검사·변경신고"],
    sourceId: "src-soil-environment-act-current", article: "제12조·제13조", citationSummary: "특정토양오염관리대상시설 설치자는 신고하고 토양오염도검사·누출검사 등 의무를 이행해야 한다.",
    condition: { any: [{ eq: { path: "safety.hazardousMaterials", value: true } }, CHEMICALS] }, requiredInputs: ["industry.coreProcesses"], explanation: "위험물·화학물질 저장시설이 있을 수 있어 대상시설 종류와 총 저장용량을 확인합니다.", reviewNote: "물질분류, 저장용량, 지상·지하 탱크 여부를 확인해야 합니다.", days: [7, 7, 14], statutoryPeriod: "공식 지자체 민원안내에서 설치신고 7일 사례 확인; 관할기관 기준 재확인", durationEvidence: "OFFICIAL_AGENCY_MATERIAL", variability: ["시설 종류", "저장용량", "검사기관 일정"],
  },
  {
    id: "chemical-substance-confirmation", name: "화학물질 확인명세서 제출", description: "화학물질 또는 혼합물을 직접 제조·수입하는 자가 성분과 함량을 확인하여 유독·제한·금지·허가·사고대비물질 여부를 신고하는 선행 절차입니다.", outcome: "화학물질 확인명세 접수 또는 확인증명",
    stage: "PLAN_AND_OCCUPANCY", actionType: "NOTICE", domain: "화학물질", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "화학물질·혼합물 제조자 또는 수입자", authority: "기후에너지환경부장관 권한 위탁기관",
    consultations: ["한국화학물질관리협회", "성분확인서 발급기관"], submissions: ["성분·함량 자료", "MSDS", "성분확인서·분석자료", "제조·수입 품목 정보"], followUp: ["물질분류에 따른 허가·신고 분기", "성분 변경 시 재확인"],
    sourceId: "src-chemicals-control-act-current", article: "제9조", citationSummary: "화학물질을 제조하거나 수입하려는 자는 해당 물질의 법정 분류 해당 여부를 확인해 명세서를 제출해야 한다.",
    condition: CHEMICAL_MANUFACTURE_OR_IMPORT, requiredInputs: ["industry.products", "industry.coreProcesses"], explanation: "화학물질 또는 혼합물을 직접 제조·수입하는 것으로 입력되어 성분확인 선행절차를 포함합니다.", reviewNote: "제조·수입 품목별 성분과 함량을 확인해 법정 분류 해당 여부를 판정해야 합니다.", variability: ["성분정보 비공개", "분석 필요", "혼합물 함량"],
  },
  {
    id: "chemical-accident-prevention-plan", name: "화학사고예방관리계획서 제출·검토", description: "유해화학물질 취급시설이 물질별 규정수량 이상을 취급할 때 사고영향범위, 예방·비상대응·주민소산 정보를 작성해 적합통보를 받는 절차입니다.", outcome: "화학사고예방관리계획서 적합통보",
    stage: "PRE_CONSTRUCTION", actionType: "REVIEW", domain: "화학물질·안전", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "유해화학물질 취급시설 설치·운영자", authority: "화학물질안전원",
    consultations: ["관할 지방환경관서", "소방·지자체 비상대응기관"], submissions: ["물질명·CAS·최대보유량·연간취급량", "시설·공정도", "사고영향범위 평가", "예방·비상대응·주민소산 계획"], followUp: ["적합내용대로 시설 설치", "취급량·시설 변경 시 변경제출"],
    sourceId: "src-chemicals-control-act-current", article: "제23조", citationSummary: "규정수량 이상의 유해화학물질 취급시설 설치·운영자는 화학사고예방관리계획서를 제출해 적합통보를 받아야 한다.",
    condition: { eq: { path: "environment.hazardousChemicalBusiness", value: true } }, requiredInputs: ["industry.coreProcesses"], explanation: "유해화학물질 영업허가 대상으로 입력되어 선행 화학사고예방관리계획서 경로를 포함합니다.", reviewNote: "CAS별 최대보유량·연간취급량에 따른 1·2군 또는 면제 판정을 확인해야 합니다.", verified: true, variability: ["물질별 규정수량", "사고영향범위", "보완"],
  },
  {
    id: "hazardous-chemical-facility-inspection", name: "유해화학물질 취급시설 설치검사", description: "유해화학물질 취급시설 설치를 마친 뒤 가동·영업허가 전에 법정 검사기관의 설치검사를 받아 적합판정을 확보하는 절차입니다.", outcome: "유해화학물질 취급시설 설치검사 적합 결과서",
    stage: "PRE_OPERATION", actionType: "INSPECTION", domain: "화학물질·안전", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "유해화학물질 취급시설 설치자", authority: "법정 검사기관",
    consultations: ["관할 지방환경관서", "화학물질안전원"], submissions: ["시설·배치·설계자료", "물질·용량 명세", "설치기준 적합자료", "화학사고예방관리계획서"], followUp: ["검사결과를 관할기관에 제출", "정기·수시검사"],
    sourceId: "src-chemicals-control-act-current", article: "제24조", citationSummary: "유해화학물질 취급시설 설치를 마친 자는 검사기관의 설치검사를 받아야 하며 검사기관은 결과를 장관에게 제출한다.",
    condition: { eq: { path: "environment.hazardousChemicalBusiness", value: true } }, requiredInputs: ["industry.coreProcesses"], explanation: "유해화학물질 영업허가 대상 시설의 가동 전 설치검사를 포함합니다.", reviewNote: "시설 종류·물질·용량에 따른 세부 설치기준과 검사기관 일정을 확인해야 합니다.", verified: true, variability: ["시설 복잡도", "현장검사 일정", "보완공사"],
  },
  {
    id: "hazardous-chemical-business-permit", name: "유해화학물질 영업허가", description: "유해화학물질 제조·판매·보관·저장·운반·사용업 중 허가대상이 계획서 적합, 설치검사 적합, 시설·장비·기술인력을 갖춘 뒤 받는 영업허가입니다.", outcome: "유해화학물질 영업허가증",
    stage: "PRE_OPERATION", domain: "화학물질", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "유해화학물질 영업자", authority: "관할 유역·지방환경청",
    consultations: ["화학물질안전원", "법정 검사기관"], submissions: ["화학사고예방관리계획서 적합통보", "설치검사 적합결과", "시설·장비·기술인력 자료", "영업구분별 사업계획"], followUp: ["유해화학물질관리자 선임·교육", "변경허가·변경신고와 기록보존"],
    sourceId: "src-chemicals-control-act-current", article: "제27조·제28조", citationSummary: "유해화학물질 영업자는 사업장별로 법정 시설·장비·기술인력을 갖추고 장관의 허가를 받아야 한다.",
    condition: { eq: { path: "environment.hazardousChemicalBusiness", value: true } }, requiredInputs: ["industry.coreProcesses"], explanation: "유해화학물질 영업허가 대상으로 입력되어 적합 계획서·설치검사 뒤 영업허가를 포함합니다.", reviewNote: "영업구분·면제량·면제업종과 취급시설 유무를 확인한 입력값을 전제로 합니다.", verified: true, variability: ["영업구분", "기술인력", "선행 적합자료"],
  },
  {
    id: "hazard-prevention-plan", name: "제조업 등 유해위험방지계획서 제출·심사", description: "시행령상 대상 업종·규모 또는 지정 기계·설비를 설치·이전·주요 구조변경하는 경우 작업 전 안전계획을 제출해 심사·확인받는 절차입니다.", outcome: "유해위험방지계획서 심사결과 및 이행확인",
    stage: "PRE_CONSTRUCTION", actionType: "REVIEW", domain: "산업안전", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "사업주", authority: "고용노동부장관(한국산업안전보건공단 수행)",
    consultations: ["한국산업안전보건공단", "설계·시공·안전 담당자"], submissions: ["층별 평면도", "기계·설비 개요와 배치", "원재료·제품·작업방법", "위험방지계획"], followUp: ["계획서대로 시공", "공사·가동 전 이행확인"],
    sourceId: "src-osh-act-20260601", article: "제42조·제43조", citationSummary: "대통령령상 업종·규모 또는 기계·설비를 설치·이전·변경하는 사업주는 유해위험방지계획서를 제출하고 확인받아야 한다.",
    condition: { any: [BUILDING_WORK, { in: { path: "investmentType", values: ["PROCESS_CHANGE", "EXPANSION"] } }] }, requiredInputs: ["industry.ksic", "industry.coreProcesses"], explanation: "설비 설치·이전·변경이 있어 유해위험방지계획서 대상 업종·기계를 확인합니다.", reviewNote: "KSIC, 상시근로자, 설비 종류·용량과 PSM 동일설비 의제범위를 확인해야 합니다.", days: [15, 15, 30], statutoryPeriod: "해당 작업 15일 전까지 제출; 제조업 계획서 심사결과 15일 경로 확인", durationEvidence: "OFFICIAL_AGENCY_MATERIAL", variability: ["대상업종", "설비 종류", "현장확인"], deemedBy: ["process-safety-report"],
  },
  {
    id: "fire-building-permit-consent", name: "건축허가 등의 소방동의", description: "소방동의 대상 건축물의 건축허가·용도변경·사용승인 전에 허가권자가 관할 소방기관의 설계·시설 적합 동의를 받는 내부 협의입니다.", outcome: "소방동의 회신",
    stage: "PRE_CONSTRUCTION", actionType: "CONSULTATION", domain: "소방", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "건축허가권자(회사가 설계도서 제공)", authority: "관할 소방본부장 또는 소방서장",
    consultations: ["건축허가 부서", "소방설계자"], submissions: ["건축허가 도서", "배치·평면·단면도", "소방시설 설계도·명세"], followUp: ["동의조건을 설계·시공에 반영", "변경설계 시 재동의 여부 확인"],
    sourceId: "src-fire-facilities-act-current", article: "제6조", citationSummary: "건축허가 등의 권한이 있는 행정기관은 대상 건축물의 허가·사용승인 전에 관할 소방본부장 또는 소방서장의 동의를 받아야 한다.",
    condition: { eq: { path: "building.fireFacilityWork", value: true } }, requiredInputs: ["building.totalAreaM2"], explanation: "소방시설공사 대상으로 입력되어 건축허가 단계의 소방동의를 포함합니다.", reviewNote: "연면적·용도·층수·수용인원과 시행령 예외를 확인한 입력값을 전제로 합니다.", verified: true, days: [5, 5, 10], statutoryPeriod: "통상 5일, 시행규칙상 특정 고위험 건축물 10일", durationEvidence: "STATUTE", variability: ["건축물 용도·규모", "설계보완"],
  },
  {
    id: "fire-facility-work-start-report", name: "소방시설공사 착공신고", description: "법정 소방시설공사를 실제 착수하기 전에 공사업자가 시공자·설계·감리 정보를 관할 소방기관에 신고하는 절차입니다.", outcome: "소방시설공사 착공신고 수리",
    stage: "PRE_CONSTRUCTION", actionType: "NOTICE", domain: "소방", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "소방시설공사업자", authority: "관할 소방본부 또는 소방서",
    consultations: ["소방설계자", "감리자", "건축주"], submissions: ["착공신고서", "도급·시공자 자료", "소방시설 설계도", "감리자 정보"], followUp: ["변경신고", "법정 감리 및 완공검사"],
    sourceId: "src-fire-facility-business-act-current", article: "제13조", citationSummary: "소방시설공사업자는 대통령령상 소방시설공사를 시작하기 전까지 착공신고를 해야 한다.",
    condition: { eq: { path: "building.fireFacilityWork", value: true } }, requiredInputs: ["building.totalAreaM2"], explanation: "소방시설공사 대상으로 입력되어 공사 착수 전 착공신고를 포함합니다.", reviewNote: "소방시설 종류와 감리자 지정대상 여부를 확인해야 합니다.", verified: true, days: [2, 2, 2], statutoryPeriod: "정부24 및 법정 민원처리 기준 2일; 기간 내 미통지 시 수리 간주", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["설계변경", "감리자 지정"],
  },
  {
    id: "fire-facility-completion-inspection", name: "소방시설 완공검사", description: "소방시설공사를 마친 뒤 건축물 사용·공장 가동 전에 현장검사 또는 감리결과 검토를 거쳐 완공검사증명서를 받는 절차입니다.", outcome: "소방시설 완공검사증명서",
    stage: "PRE_OPERATION", actionType: "INSPECTION", domain: "소방", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "소방시설공사업자", authority: "관할 소방본부 또는 소방서",
    consultations: ["소방감리자", "건축 사용승인 부서"], submissions: ["완공검사 신청서", "변경 설계도서", "감리결과보고서", "시험·검측자료"], followUp: ["건축물 사용승인 연계", "소방시설 유지관리"],
    sourceId: "src-fire-facility-business-act-current", article: "제14조", citationSummary: "공사업자는 소방시설공사를 마치면 소방본부장 또는 소방서장의 완공검사를 받아야 한다.",
    condition: { eq: { path: "building.fireFacilityWork", value: true } }, requiredInputs: ["building.totalAreaM2"], explanation: "소방시설공사 대상으로 입력되어 건축물 사용 전 완공검사를 포함합니다.", reviewNote: "감리결과보고로 갈음되는 시설과 현장검사 대상 구분을 확인해야 합니다.", verified: true, days: [3, 3, 5], statutoryPeriod: "정부24 완공검사 안내 기준 3일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["현장검사", "감리결과 보완"],
  },
  {
    id: "hazardous-materials-facility-installation-permit", name: "위험물 제조소등 설치·변경허가", description: "물질별 지정수량 이상의 위험물을 제조·저장·취급하는 제조소·저장소·취급소를 설치하거나 중요설비를 변경하기 전에 받는 허가입니다.", outcome: "위험물 제조소등 설치·변경허가서",
    stage: "PRE_CONSTRUCTION", domain: "위험물·소방", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "위험물 제조소등 설치자", authority: "시·도지사(위임 시 관할 소방기관)",
    consultations: ["관할 소방서", "탱크안전성 검사기관"], submissions: ["위치·구조·설비도", "위험물 품명·수량·지정수량 배수", "공사계획", "탱크·안전설비 자료"], followUp: ["허가도서대로 시공", "사용 전 완공검사"],
    sourceId: "src-hazardous-materials-act-current", article: "제6조", citationSummary: "위험물 제조소·저장소·취급소를 설치하거나 법정 중요사항을 변경하려는 자는 시·도지사의 허가를 받아야 한다.",
    condition: { eq: { path: "safety.hazardousMaterials", value: true } }, requiredInputs: ["industry.coreProcesses"], explanation: "지정수량 이상 위험물 취급으로 입력되어 제조소등 설치허가를 포함합니다.", reviewNote: "상품명이 아닌 성분별 위험물 품명·농도와 지정수량 배수 계산을 전제로 합니다.", verified: true, days: [5, 5, 10], statutoryPeriod: "정부24 위험물 제조소등 설치허가 안내 기준 5일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["제조소등 유형", "탱크검사", "설계보완"],
  },
  {
    id: "hazardous-materials-facility-completion-inspection", name: "위험물 제조소등 완공검사", description: "허가받은 위험물 제조소등의 설치·변경공사를 마친 뒤 위험물 저장·취급 전에 허가도서와 시설기준 적합 여부를 검사받습니다.", outcome: "위험물 제조소등 완공검사필증",
    stage: "PRE_OPERATION", actionType: "INSPECTION", domain: "위험물·소방", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "위험물 제조소등 설치자", authority: "시·도 또는 관할 소방기관",
    consultations: ["탱크안전성 검사기관", "관할 소방서"], submissions: ["설치허가 내역", "준공도면·변경사항", "탱크안전성 검사결과", "시설시험 자료"], followUp: ["위험물안전관리자 선임", "정기점검·변경허가"],
    sourceId: "src-hazardous-materials-act-current", article: "제9조", citationSummary: "제조소등 설치·변경 공사를 마친 자는 사용 전에 시·도지사가 실시하는 완공검사를 받아 기술기준 적합을 확인해야 한다.",
    condition: { eq: { path: "safety.hazardousMaterials", value: true } }, requiredInputs: ["industry.coreProcesses"], explanation: "위험물 제조소등 설치허가 대상이므로 시설 사용 전 완공검사를 포함합니다.", reviewNote: "부분완공검사와 탱크안전성능검사 선행 여부를 시설별로 확인해야 합니다.", verified: true, days: [5, 5, 10], statutoryPeriod: "정부24 위험물 제조소등 완공검사 안내 기준 5일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["탱크검사", "현장보완"],
  },
  {
    id: "private-electrical-facility-construction-plan", name: "자가용전기설비 공사계획 인가·신고", description: "자가용전기설비 신설·변경공사 중 시행규칙 대상 공사를 착수하기 전에 전압·용량·공사종류에 따라 공사계획 인가 또는 신고를 거칩니다.", outcome: "공사계획 인가서 또는 신고수리",
    stage: "PRE_CONSTRUCTION", domain: "전기·에너지", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "자가용전기설비 소유자·점유자", authority: "기후에너지환경부 또는 시·도(한국전기안전공사 기술접수)",
    consultations: ["한국전기안전공사", "전기설계·공사업체"], submissions: ["배치도·단선결선도", "배선·변압기 선정자료", "구조·계산서", "보호·접지 계획"], followUp: ["인가·신고 도서대로 시공", "사용 전 검사"],
    sourceId: "src-electrical-safety-act-20260201", article: "제8조", citationSummary: "기후에너지환경부령상 자가용전기설비 설치·변경공사는 공사계획 인가를 받거나 신고해야 한다.",
    condition: PRIVATE_ELECTRICAL_FACILITY_WORK, requiredInputs: ["utilities.privateElectricalFacilityWork", "utilities.powerIncreaseMw"], explanation: "자가용전기설비 공사 대상으로 입력되어 공사계획 인가·신고 경로를 포함합니다.", reviewNote: "수전전압, 계약전력, 발전·저장설비 용량과 공사유형에 따라 인가·신고를 구분해야 합니다.", days: [5, 5, 15], statutoryPeriod: "정부24 신고 5일, 대용량 설비 인가 등 15일 경로", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["수전전압", "설비용량", "공사유형"],
  },
  {
    id: "electrical-pre-use-inspection", name: "자가용전기설비 사용전검사", description: "공사계획 대상 자가용전기설비의 설치·변경공사를 마친 뒤 수전·시운전·가동 전에 기술기준 적합 검사를 받습니다.", outcome: "자가용전기설비 사용전검사 합격증",
    stage: "PRE_OPERATION", actionType: "INSPECTION", domain: "전기·에너지", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "자가용전기설비 소유자·점유자", authority: "기후에너지환경부 또는 시·도(한국전기안전공사 검사)",
    consultations: ["한국전기안전공사", "전기안전관리자"], submissions: ["공사계획 인가·신고 내역", "시험성적서·준공도서", "전기안전관리자 자료", "검사희망일"], followUp: ["합격 후 수전·사용", "정기검사·안전관리자 선임"],
    sourceId: "src-electrical-safety-act-20260201", article: "제9조", citationSummary: "자가용전기설비 설치·변경공사를 한 자는 사용 전에 법정 검사에 합격해야 한다.",
    condition: PRIVATE_ELECTRICAL_FACILITY_WORK, requiredInputs: ["utilities.privateElectricalFacilityWork", "utilities.powerIncreaseMw"], explanation: "자가용전기설비 공사 대상으로 입력되어 수전·가동 전 사용전검사를 포함합니다.", reviewNote: "공사계획 대상 여부와 검사범위를 전압·용량별로 확인해야 합니다.", verified: true, statutoryPeriod: "신청인이 검사 희망일을 지정하며 전국 공통 고정 처리기간 없음", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["검사희망일", "시험성적", "부적합 보완"],
  },
  {
    id: "energy-use-plan-consultation", name: "에너지사용계획 협의", description: "연간 연료·전력사용량 또는 산업단지 개발면적이 법정 기준 이상인 사업이 승인 전에 에너지 수급영향과 효율화·온실가스 저감계획을 협의합니다.", outcome: "에너지사용계획 협의의견",
    stage: "PLAN_AND_OCCUPANCY", actionType: "CONSULTATION", domain: "전기·에너지", lane: "CENTRAL_OR_REGIONAL_OFFICE", applicant: "사업주관자", authority: "기후에너지환경부장관",
    consultations: ["한국에너지공단", "사업 승인기관", "전문위원회"], submissions: ["에너지 수요·공급예측", "효율화·온실가스 저감계획", "사업·시설 계획", "사후 이행계획"], followUp: ["협의의견을 사업·건축계획에 반영", "이행실적 관리"],
    sourceId: "src-energy-use-act-current", article: "제10조", citationSummary: "대통령령상 일정 규모 이상 에너지 사용 사업·시설의 사업주관자는 사업 실시 또는 시설 설치 전에 에너지사용계획을 수립·협의해야 한다.",
    condition: { eq: { path: "utilities.energyUsePlanRequired", value: true } }, requiredInputs: ["utilities.powerIncreaseMw"], explanation: "에너지사용계획 협의 대상으로 입력되어 사업 승인 전 협의를 포함합니다.", reviewNote: "공공·민간 구분, 연간 연료 toe·전력 kWh와 산업단지 개발면적 기준을 확인한 입력값을 전제로 합니다.", verified: true, variability: ["에너지 수요", "전문위원회", "보완"],
  },
  {
    id: "high-pressure-gas-manufacture-storage-permit-report", name: "고압가스 제조·저장 허가·신고", description: "냉동·압축·충전 등 제조시설 또는 법정 규모 이상의 고압가스 저장소를 설치하기 전에 가스종류·압력·능력에 따라 허가 또는 신고합니다.", outcome: "고압가스 제조·저장 허가서 또는 신고증명",
    stage: "PRE_CONSTRUCTION", domain: "고압가스", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "고압가스 제조·저장 사업자", authority: "관할 시·군·구 허가·신고관청",
    consultations: ["한국가스안전공사 기술검토", "소방·산업안전 관계기관"], submissions: ["사업·시설계획", "배치·설비도", "가스 종류·압력·용량", "안전거리·안전설비", "KGS 기술검토서"], followUp: ["허가·신고 도서대로 시공", "중간·완성검사"],
    sourceId: "src-high-pressure-gas-act-current", article: "제4조", citationSummary: "고압가스를 제조하거나 법정 규모의 저장소를 설치하려는 자는 가스 종류·능력에 따라 허가를 받거나 신고해야 한다.",
    condition: { eq: { path: "safety.highPressureGas", value: true } }, requiredInputs: ["industry.coreProcesses"], explanation: "허가·신고 대상 고압가스로 입력되어 제조·저장 시설 절차를 포함합니다.", reviewNote: "가스 종류, 상용압력, 냉동능력·저장량과 제조·사용방식 판정을 전제로 합니다.", verified: true, days: [2, 5, 10], statutoryPeriod: "정부24 제조·저장 허가 5일, 제조신고 2일", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["KGS 기술검토", "가스 종류", "시설능력"],
  },
  {
    id: "high-pressure-gas-facility-inspection", name: "고압가스시설 중간·완성검사", description: "허가·신고된 고압가스 제조·저장시설의 설치·변경공사 중 법정 공정과 사용 전에 한국가스안전공사의 중간·완성검사를 받습니다.", outcome: "고압가스시설 중간·완성검사 합격증명",
    stage: "PRE_OPERATION", actionType: "INSPECTION", domain: "고압가스", lane: "ENVIRONMENT_SAFETY_FIRE_UTILITY", applicant: "고압가스 시설 사업자", authority: "허가·신고관청 및 한국가스안전공사",
    consultations: ["한국가스안전공사", "시공·안전관리 담당자"], submissions: ["허가·신고 도서", "공정검사 자료", "준공도면·시험성적", "안전설비 확인자료"], followUp: ["합격 후 시설 사용", "정기검사·안전관리"],
    sourceId: "src-high-pressure-gas-act-current", article: "제16조", citationSummary: "허가·신고 대상 고압가스시설의 설치·변경공사는 중간검사와 완성검사를 받고 합격한 뒤 사용해야 한다.",
    condition: { eq: { path: "safety.highPressureGas", value: true } }, requiredInputs: ["industry.coreProcesses"], explanation: "고압가스 시설 허가·신고 대상이므로 사용 전 중간·완성검사를 포함합니다.", reviewNote: "시설 종류별 중간검사 공정과 완성검사 범위를 확인해야 합니다.", verified: true, days: [7, 7, 14], statutoryPeriod: "정부24 중간검사 안내 기준 7일; 완성검사는 검사일정에 따라 달라짐", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["검사공정", "현장보완", "검사기관 일정"],
  },
  {
    id: "specific-high-pressure-gas-use-report", name: "특정고압가스 사용신고", description: "수소·산소·암모니아·염소·모노실란·디보란 등 법정 특정고압가스를 기준 저장규모 이상 사용하는 경우 사용 전에 신고하고 시설검사를 받습니다.", outcome: "특정고압가스 사용신고 수리",
    stage: "PRE_OPERATION", actionType: "NOTICE", domain: "고압가스", lane: "CITY_COUNTY_DISTRICT", applicant: "특정고압가스 사용자", authority: "관할 시·군·구",
    consultations: ["한국가스안전공사"], submissions: ["사용시설 배치·계통도", "가스 종류·저장량", "안전설비 자료", "완성검사 자료"], followUp: ["시설 완성·정기검사", "사용시설 변경신고"],
    sourceId: "src-high-pressure-gas-act-current", article: "제20조", citationSummary: "대통령령상 특정고압가스를 일정 규모 이상 사용하려는 자는 사용 전에 신고하고 시설검사를 받아야 한다.",
    condition: SPECIFIC_HIGH_PRESSURE_GAS_USE, requiredInputs: ["safety.specificHighPressureGasUse", "industry.coreProcesses"], explanation: "법정 종류·규모의 특정고압가스 사용 대상으로 입력되어 사용신고를 포함합니다.", reviewNote: "가스별 법정 목록과 저장능력 임계값을 확인한 판정값을 전제로 합니다.", days: [0, 0, 1], statutoryPeriod: "정부24 즉시 처리(근무시간 내 3시간) 안내", durationEvidence: "OFFICIAL_SERVICE_STANDARD", variability: ["가스 종류", "저장량", "완성검사"],
  },
];

const sourceVersion = (sourceId: string) => {
  const source = expandedLegalSources.find((item) => item.id === sourceId);
  return source?.effectiveDate ? `시행 ${source.effectiveDate}` : `현행본 검토 ${REVIEW_DATE}`;
};

export const expandedCitations: LegalCitation[] = permitSeeds.map((seed) => ({
  id: `cit-exp-${seed.id}`,
  sourceId: seed.sourceId,
  article: seed.article,
  paragraph: seed.paragraph ?? null,
  subparagraph: null,
  item: null,
  role: "APPLICABILITY",
  sourceVersion: sourceVersion(seed.sourceId),
  summary: seed.citationSummary,
}));

export const expandedRules: ApplicabilityRule[] = permitSeeds.map((seed) => ({
  id: `rule-exp-${seed.id}`,
  version: VERSION,
  procedureId: seed.id,
  effect: "INCLUDE",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] },
  condition: seed.condition,
  requiredInputs: seed.requiredInputs,
  missingPolicy: "INDETERMINATE",
  citationIds: [`cit-exp-${seed.id}`],
  explanationTemplate: seed.explanation,
  priority: 100,
  status: "DRAFT",
  reviewActor: "AI-assisted official-source review",
  note: seed.reviewNote,
}));

expandedRules.push(
  {
    id: "rule-exp-air-integrated-exclusion", version: VERSION, procedureId: "air-emission-installation-permit", effect: "EXCLUDE", effectiveFrom: "2026-01-01", effectiveTo: null,
    jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] }, condition: { eq: { path: "environment.integratedPermitTarget", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], missingPolicy: "INDETERMINATE", citationIds: ["cit-exp-integrated-environmental-permit"], explanationTemplate: "통합환경허가 대상 입력이므로 개별 대기 설치허가·신고는 통합허가 의제범위로 접습니다.", priority: 300, status: "DRAFT", reviewActor: "AI-assisted official-source review", note: "통합허가서의 실제 의제범위와 제출서류를 확인해야 합니다.",
  },
  {
    id: "rule-exp-water-integrated-exclusion", version: VERSION, procedureId: "water-discharge-installation-permit", effect: "EXCLUDE", effectiveFrom: "2026-01-01", effectiveTo: null,
    jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] }, condition: { eq: { path: "environment.integratedPermitTarget", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], missingPolicy: "INDETERMINATE", citationIds: ["cit-exp-integrated-environmental-permit"], explanationTemplate: "통합환경허가 대상 입력이므로 개별 폐수 설치허가·신고는 통합허가 의제범위로 접습니다.", priority: 300, status: "DRAFT", reviewActor: "AI-assisted official-source review", note: "통합허가서의 실제 의제범위와 제출서류를 확인해야 합니다.",
  },
  {
    id: "rule-exp-air-operation-integrated-exclusion", version: VERSION, procedureId: "air-facility-operation-start-report", effect: "EXCLUDE", effectiveFrom: "2026-01-01", effectiveTo: null,
    jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] }, condition: { eq: { path: "environment.integratedPermitTarget", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], missingPolicy: "INDETERMINATE", citationIds: ["cit-exp-integrated-environmental-operation-start-report"], explanationTemplate: "통합환경허가 대상 입력이므로 개별 대기 가동개시 신고를 통합법상 가동개시 신고·수리 경로로 대체합니다.", priority: 300, status: "DRAFT", reviewActor: "AI-assisted official-source review", note: "통합법 제12조 가동개시 신고·수리 절차를 적용합니다.",
  },
  {
    id: "rule-exp-water-operation-integrated-exclusion", version: VERSION, procedureId: "water-facility-operation-start-report", effect: "EXCLUDE", effectiveFrom: "2026-01-01", effectiveTo: null,
    jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] }, condition: { eq: { path: "environment.integratedPermitTarget", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], missingPolicy: "INDETERMINATE", citationIds: ["cit-exp-integrated-environmental-operation-start-report"], explanationTemplate: "통합환경허가 대상 입력이므로 개별 수질 가동시작 신고를 통합법상 가동개시 신고·수리 경로로 대체합니다.", priority: 300, status: "DRAFT", reviewActor: "AI-assisted official-source review", note: "통합법 제12조 가동개시 신고·수리 절차를 적용합니다.",
  },
  {
    id: "rule-exp-hazard-prevention-psm-exclusion", version: VERSION, procedureId: "hazard-prevention-plan", effect: "EXCLUDE", effectiveFrom: "2026-01-01", effectiveTo: null,
    jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] }, condition: { eq: { path: "safety.psmCovered", value: true } }, requiredInputs: ["safety.psmCovered"], missingPolicy: "INDETERMINATE", citationIds: ["cit-osh-44-1"], explanationTemplate: "PSM 대상 입력이므로 동일 설비에 대한 유해위험방지계획서 절차는 공정안전보고서 경로로 접습니다.", priority: 300, status: "DRAFT", reviewActor: "AI-assisted official-source review", note: "동일 설비의 면제범위는 공정안전보고서 제출범위와 대조해야 합니다.",
  },
  {
    id: "rule-exp-noise-complex-exclusion", version: VERSION, procedureId: "noise-vibration-facility-report", effect: "EXCLUDE", effectiveFrom: "2026-01-01", effectiveTo: null,
    jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] }, condition: { eq: { path: "industrialComplex.inside", value: true } }, requiredInputs: ["industrialComplex.inside"], missingPolicy: "INDETERMINATE", citationIds: ["cit-exp-noise-vibration-facility-report"], explanationTemplate: "산업단지 안의 공장은 법정 제외규정을 우선 적용해 소음·진동 설치허가·신고를 비적용으로 표시합니다.", priority: 250, status: "DRAFT", reviewActor: "AI-assisted official-source review", note: "개별 시설의 배출허용기준 준수의무는 별도로 유지됩니다.",
  },
  {
    id: "rule-exp-noise-integrated-exclusion", version: VERSION, procedureId: "noise-vibration-facility-report", effect: "EXCLUDE", effectiveFrom: "2026-01-01", effectiveTo: null,
    jurisdiction: { nationwide: true, provinces: [], cities: [], industrialComplexIds: [] }, condition: { eq: { path: "environment.integratedPermitTarget", value: true } }, requiredInputs: ["environment.integratedPermitTarget"], missingPolicy: "INDETERMINATE", citationIds: ["cit-exp-integrated-environmental-permit"], explanationTemplate: "통합환경허가 대상 입력이므로 개별 소음·진동 설치허가·신고는 통합허가 의제범위로 접습니다.", priority: 300, status: "DRAFT", reviewActor: "AI-assisted official-source review", note: "통합허가서의 실제 의제범위와 제출서류를 확인해야 합니다.",
  },
);

const additionalRuleIdsByProcedure: Record<string, string[]> = {
  "air-facility-operation-start-report": ["rule-exp-air-operation-integrated-exclusion"],
  "water-facility-operation-start-report": ["rule-exp-water-operation-integrated-exclusion"],
  "noise-vibration-facility-report": ["rule-exp-noise-complex-exclusion", "rule-exp-noise-integrated-exclusion"],
  "hazard-prevention-plan": ["rule-exp-hazard-prevention-psm-exclusion"],
};

export const expandedProcedures: Procedure[] = permitSeeds.map((seed) => ({
  id: seed.id,
  name: seed.name,
  aliases: seed.aliases ?? [],
  description: seed.description,
  outcome: seed.outcome,
  stage: seed.stage,
  actionType: seed.actionType ?? "PERMIT",
  domain: seed.domain,
  lane: seed.lane,
  applicant: seed.applicant,
  receivingAuthority: seed.authority,
  statutoryDecisionMaker: seed.decisionMaker ?? seed.authority,
  consultationAuthorities: seed.consultations ?? [],
  submissions: seed.submissions,
  validity: "처분 내용·허가조건과 관계 법령에 따름",
  followUpObligations: seed.followUp,
  ruleIds: [`rule-exp-${seed.id}`, ...(additionalRuleIdsByProcedure[seed.id] ?? [])],
  citationIds: [`cit-exp-${seed.id}`],
  durationId: `duration-exp-${seed.id}`,
  verificationStatus: seed.verified ? "AI_ASSISTED_DRAFT" : "TODO_LEGAL_REVIEW",
  reviewedAt: REVIEW_DATE,
  reviewNote: seed.reviewNote,
  deemedByProcedureIds: seed.deemedBy ?? [],
  deemedProcedureIds: seed.deems ?? [],
}));

export const expandedDurations: DurationEstimate[] = permitSeeds.map((seed) => {
  const authorityProcessing = seed.days
    ? { min: seed.days[0], base: seed.days[1], max: seed.days[2], unit: "BUSINESS_DAY" as const }
    : null;
  return {
    id: `duration-exp-${seed.id}`,
    procedureId: seed.id,
    applicantPreparation: null,
    authorityProcessing,
    interagencyConsultation: null,
    elapsed: authorityProcessing,
    statutoryPeriod: seed.statutoryPeriod ?? null,
    stopClockRules: ["보완요구·현장보정·민원처리법상 처리기간 정지는 별도 확인"],
    variabilityFactors: seed.variability ?? ["대상 세부기준", "신청자료 완결성", "관계기관 협의"],
    evidenceType: seed.durationEvidence ?? "INSUFFICIENT_DATA",
    citationIds: [`cit-exp-${seed.id}`],
    sampleSize: null,
    assumptions: ["전국 공통값이 확인되지 않은 절차는 임의 기간을 생성하지 않음"],
    verifiedAt: REVIEW_DATE,
    legalConfidence: seed.verified ? "HIGH" : "MEDIUM",
    estimateConfidence: seed.days ? (seed.verified ? "HIGH" : "MEDIUM") : "UNVERIFIED",
  };
});

const edge = (
  id: string,
  from: string,
  to: string,
  conditionRuleId: string | null,
  note: string,
  strength: ProcedureEdge["strength"] = "LEGAL_HARD",
): ProcedureEdge => ({
  id,
  from,
  to,
  relation: "FINISH_TO_START",
  lag: 0,
  lagUnit: "BUSINESS_DAY",
  strength,
  conditionRuleId,
  citationIds: [],
  branchId: null,
  note,
});

const completionBranchEdges = (
  idPrefix: string,
  from: string,
  conditionRuleId: string,
  note: string,
): ProcedureEdge[] => [
  edge(`${idPrefix}-complex`, from, "factory-completion-report-complex", conditionRuleId, note, "PRACTICAL"),
  edge(`${idPrefix}-offsite`, from, "factory-completion-report-offsite", conditionRuleId, note, "PRACTICAL"),
];

export const expandedEdges: ProcedureEdge[] = [
  edge("edge-exp-farmland-to-development", "farmland-conversion-permit", "development-activity-permit", "rule-exp-farmland-conversion-permit", "농지전용 협의·허가를 개발행위 또는 상위 의제절차와 조율합니다.", "PRACTICAL"),
  edge("edge-exp-forest-to-development", "forestland-conversion-permit", "development-activity-permit", "rule-exp-forestland-conversion-permit", "산지전용 협의·허가를 개발행위 또는 상위 의제절차와 조율합니다.", "PRACTICAL"),
  edge("edge-exp-eia-to-development", "environmental-impact-assessment", "development-activity-permit", "rule-exp-environmental-impact-assessment", "환경영향평가 협의내용을 사업·개발 승인 전에 반영합니다."),
  edge("edge-exp-small-eia-to-development", "small-environmental-impact-assessment", "development-activity-permit", "rule-exp-small-environmental-impact-assessment", "소규모 환경영향평가 협의내용을 개발 승인 전에 반영합니다."),
  edge("edge-exp-development-to-building", "development-activity-permit", "building-permit", "rule-exp-development-activity-permit", "개발행위허가를 건축허가에서 의제하는지 확인하고 미의제 시 선행 완료합니다.", "PRACTICAL"),
  edge("edge-exp-demolition-to-building", "building-demolition-permit-report", "building-permit", "rule-exp-building-demolition-permit-report", "기존 건축물 해체 경로를 신축·증축 착수 전에 완료합니다.", "PRACTICAL"),
  edge("edge-exp-road-to-start", "road-connection-permit", "construction-start-report", "rule-exp-road-connection-permit", "공사차량·최종 진출입계획을 착공 전에 확정합니다.", "PRACTICAL"),
  edge("edge-exp-waste-to-start", "construction-waste-plan-report", "construction-start-report", "rule-exp-construction-waste-plan-report", "건설폐기물 5톤 이상이면 착공 전 처리계획 신고가 필요합니다."),
  edge("edge-exp-fire-consent-to-building", "fire-building-permit-consent", "building-permit", "rule-exp-fire-building-permit-consent", "건축허가권자는 건축허가 전에 관할 소방기관의 동의를 받아야 합니다."),
  edge("edge-exp-fire-consent-to-start", "fire-building-permit-consent", "fire-facility-work-start-report", "rule-exp-fire-facility-work-start-report", "소방동의 설계도서를 기준으로 소방시설공사 착공신고를 합니다."),
  edge("edge-exp-fire-start-to-completion", "fire-facility-work-start-report", "fire-facility-completion-inspection", "rule-exp-fire-facility-completion-inspection", "소방시설공사 완료 후 완공검사를 신청합니다."),
  edge("edge-exp-fire-completion-to-use", "fire-facility-completion-inspection", "building-use-approval", "rule-exp-fire-facility-completion-inspection", "건축물 사용승인·가동 전 소방시설 완공검사증명서를 확보합니다."),
  edge("edge-exp-hazardous-permit-to-inspection", "hazardous-materials-facility-installation-permit", "hazardous-materials-facility-completion-inspection", "rule-exp-hazardous-materials-facility-completion-inspection", "허가도서대로 공사 후 위험물 반입·사용 전 완공검사를 받습니다."),
  edge("edge-exp-electric-plan-to-inspection", "private-electrical-facility-construction-plan", "electrical-pre-use-inspection", "rule-exp-electrical-pre-use-inspection", "공사계획 대상 전기설비는 설치·변경공사 후 사용전검사를 받습니다."),
  edge("edge-exp-gas-permit-to-inspection", "high-pressure-gas-manufacture-storage-permit-report", "high-pressure-gas-facility-inspection", "rule-exp-high-pressure-gas-facility-inspection", "고압가스 시설 허가·신고 후 법정 공정·사용 전에 검사를 받습니다."),
  edge("edge-exp-chemical-plan-to-inspection", "chemical-accident-prevention-plan", "hazardous-chemical-facility-inspection", "rule-exp-hazardous-chemical-facility-inspection", "적합통보된 계획과 일치하도록 시설을 설치한 뒤 설치검사를 받습니다."),
  edge("edge-exp-chemical-inspection-to-permit", "hazardous-chemical-facility-inspection", "hazardous-chemical-business-permit", "rule-exp-hazardous-chemical-business-permit", "설치검사 적합결과를 갖춘 뒤 유해화학물질 영업허가를 신청합니다."),
  edge("edge-exp-integrated-permit-to-operation", "integrated-environmental-permit", "integrated-environmental-operation-start-report", "rule-exp-integrated-environmental-operation-start-report", "통합허가 시설의 설치·변경을 완료한 뒤 가동 전 현장 확인과 신고 수리를 거칩니다."),
  edge("edge-exp-air-permit-to-operation", "air-emission-installation-permit", "air-facility-operation-start-report", "rule-exp-air-facility-operation-start-report", "대기배출시설 설치허가·신고 후 설치를 완료하고 가동개시 신고를 합니다."),
  edge("edge-exp-water-permit-to-operation", "water-discharge-installation-permit", "water-facility-operation-start-report", "rule-exp-water-facility-operation-start-report", "폐수배출시설 설치허가·신고 후 설치를 완료하고 가동시작 신고를 합니다."),
  edge("edge-exp-gas-inspection-to-specific-use", "high-pressure-gas-facility-inspection", "specific-high-pressure-gas-use-report", "rule-exp-specific-high-pressure-gas-use-report", "특정고압가스 사용시설은 완성검사 자료를 갖춘 뒤 사용신고를 합니다."),
  ...completionBranchEdges("edge-exp-integrated-operation-to-completion", "integrated-environmental-operation-start-report", "rule-exp-integrated-environmental-operation-start-report", "통합환경 가동개시 신고 수리 후 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-air-operation-to-completion", "air-facility-operation-start-report", "rule-exp-air-facility-operation-start-report", "개별 대기 가동개시 신고 후 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-water-operation-to-completion", "water-facility-operation-start-report", "rule-exp-water-facility-operation-start-report", "개별 수질 가동시작 신고 후 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-chemical-business-to-completion", "hazardous-chemical-business-permit", "rule-exp-hazardous-chemical-business-permit", "유해화학물질 영업허가를 확보한 뒤 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-hazardous-inspection-to-completion", "hazardous-materials-facility-completion-inspection", "rule-exp-hazardous-materials-facility-completion-inspection", "위험물 제조소등 완공검사를 마친 뒤 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-electric-inspection-to-completion", "electrical-pre-use-inspection", "rule-exp-electrical-pre-use-inspection", "자가용전기설비 사용전검사 합격 후 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-gas-inspection-to-completion", "high-pressure-gas-facility-inspection", "rule-exp-high-pressure-gas-facility-inspection", "고압가스시설 완성검사 합격 후 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-specific-gas-to-completion", "specific-high-pressure-gas-use-report", "rule-exp-specific-high-pressure-gas-use-report", "특정고압가스 사용신고 후 공장설립 완료·가동 일정을 확정합니다."),
  ...completionBranchEdges("edge-exp-fire-inspection-to-completion", "fire-facility-completion-inspection", "rule-exp-fire-facility-completion-inspection", "소방시설 완공검사 후 공장설립 완료·가동 일정을 확정합니다."),
];

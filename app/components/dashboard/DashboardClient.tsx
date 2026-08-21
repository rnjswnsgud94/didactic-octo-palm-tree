"use client";

import { useEffect, useMemo, useState } from "react";

import {
  procedureCategoryForDecision,
  procedureCategoryOrder,
  procedureCategorySummaries,
  tabLabels,
  type DashboardTab,
  type ProcedureCategory,
} from "@/app/components/dashboard/constants";
import { DashboardTabIcon } from "@/app/components/dashboard/DashboardTabIcon";
import { ActionPlanView, GapsView, LegalView, ProcedureList, ScheduleView } from "@/app/components/dashboard/DashboardViews";
import { LocalJurisdictionLinks, LocalOrdinancePanel } from "@/app/components/dashboard/LocalOrdinancePanel";
import { ProcedureDrawer } from "@/app/components/dashboard/ProcedureDrawer";
import { StatusSummaryDialog } from "@/app/components/dashboard/StatusSummaryDialog";
import { TotalDurationDialog } from "@/app/components/dashboard/TotalDurationDialog";
import { ProjectInputSummary } from "@/app/components/dashboard/ScenarioPicker";
import { SpecialLawSummary } from "@/app/components/dashboard/SpecialLawSummary";
import { Swimlane } from "@/app/components/dashboard/Swimlane";
import { Wizard } from "@/app/components/dashboard/Wizard";
import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";
import { evaluateProject } from "@/lib/engine/pipeline";
import type { DurationScenario } from "@/lib/engine/schedule";
import { formatCalendarPeriod } from "@/lib/format-duration";
import { decodeShareState, encodeShareState, ShareStateTooLongError } from "@/lib/share-state";

const defaultAnswers: ScenarioAnswers = {
  assessmentDate: catalog.coverage.assessmentDefault,
  plannedConstructionStartDate: null,
  plannedConstructionEndDate: null,
  equipmentInstallationCompletionDate: null,
  commissioningStartDate: null,
  investmentType: "UNKNOWN",
  province: "",
  city: "",
  siteAddress: "",
  siteZoning: "",
  siteRestrictedFactors: "",
  insideIndustrialComplex: null,
  industrialComplexName: "",
  industrialComplexIdentifier: "",
  industrialComplexManagingAuthority: "",
  industrialComplexOccupancyContractStatus: "NOT_APPLIED",
  industryCategory: "UNKNOWN",
  ksicCode: "",
  products: "",
  coreProcesses: "",
  existingApprovalIds: "",
  buildingAction: "UNKNOWN",
  mechanicalEquipmentActTarget: null,
  existingAreaM2: null,
  increaseAreaM2: null,
  totalAreaM2: null,
  landCategory: null,
  demolitionRequired: null,
  roadConnectionRequired: null,
  trafficImpactAssessmentRequired: null,
  landscapeReviewRequired: null,
  buildingCommitteeReviewRequired: null,
  gridImpactAssessmentRequired: null,
  aiDataCenterActFacilityConfirmed: null,
  aiDataCenterOneStopStatus: "NOT_APPLIED",
  appliedSpecialLawIds: [],
  advancedStrategicIndustryFastTrackConfirmed: null,
  advancedStrategicIndustryApplicantRoleConfirmed: null,
  advancedStrategicIndustryDelayRiskConfirmed: null,
  advancedStrategicIndustryCommitteeResolved: null,
  advancedStrategicIndustryMinisterRequestDate: null,
  advancedStrategicIndustryFastTrackPermitIds: [],
  semiconductorClusterFastTrackConfirmed: null,
  semiconductorClusterApplicantRoleConfirmed: null,
  semiconductorClusterDelayRiskConfirmed: null,
  semiconductorClusterCommitteeResolved: null,
  semiconductorClusterMinisterRequestDate: null,
  semiconductorClusterFastTrackPermitIds: [],
  semiconductorClusterPlanDeemingConfirmed: null,
  semiconductorClusterPlanDocumentsIncluded: null,
  semiconductorClusterPlanConsultationCompleted: null,
  semiconductorClusterPlanApprovalPublished: null,
  semiconductorClusterPlanApprovalPublishedDate: null,
  semiconductorClusterPlanApprovalNoticeReference: "",
  semiconductorClusterPlanIncludedPermitIds: [],
  industrialComplexPlanSpecialCaseConfirmed: null,
  industrialComplexPlanDocumentsIncluded: null,
  industrialComplexPlanConsultationCompleted: null,
  industrialComplexPlanApprovalPublished: null,
  industrialComplexPlanApprovalPublishedDate: null,
  industrialComplexPlanApprovalNoticeReference: "",
  industrialComplexPlanIncludedPermitIds: [],
  regionalSpecialZonePlanDeemingConfirmed: null,
  regionalSpecialZonePlanDocumentsIncluded: null,
  regionalSpecialZonePlanConsultationCompleted: null,
  regionalSpecialZonePlanApprovalPublished: null,
  regionalSpecialZonePlanApprovalPublishedDate: null,
  regionalSpecialZonePlanApprovalNoticeReference: "",
  regionalSpecialZonePlanIncludedPermitIds: [],
  permitCoordination: null,
  airEmissionFacility: null,
  waterDischargeFacility: null,
  environmentalAssessmentType: null,
  integratedEnvironmentalPermitTarget: null,
  chemicalsHandled: null,
  chemicalManufactureOrImport: null,
  hazardousChemicalBusiness: null,
  hazardousMaterials: null,
  highPressureGas: null,
  highPressureGasBusinessStartTarget: null,
  specificHighPressureGasUse: null,
  lpgSpecificUseFacility: null,
  cityGasSpecificUseFacility: null,
  psmCovered: null,
  fireFacilityWork: null,
  fireWorkSupervisionTarget: null,
  firstFireSelfInspectionTarget: null,
  privateElectricalFacilityWork: null,
  energyUsePlanRequired: null,
  groundwaterDevelopment: null,
  disasterImpactAssessmentType: null,
  undergroundSafetyAssessmentType: null,
  nationalHeritageAssessmentType: null,
  militaryProtectionConsultationRequired: null,
  riverOccupationRequired: null,
  publicWaterOccupationRequired: null,
  waterSourceProtectionZone: null,
  safetyManagementPlanRequired: null,
  specificWorkReportRequired: null,
  asbestosPresent: null,
  publicSewerConnection: null,
  privateSewageTreatmentFacility: null,
  wasteFacility: null,
  chemicalRegistrationRequired: null,
  restrictedOrToxicChemicalImport: null,
  fireSafetyManagerRequired: null,
  hazardousMaterialsTank: null,
  hazardousMaterialsPreventionRulesRequired: null,
  heatUseEquipment: null,
  hazardousMachineryInspectionRequired: null,
  safetyManagerRequired: null,
  healthManagerRequired: null,
  forestRestorationObligation: null,
  powerIncreaseMw: null,
  waterDemandM3Day: null,
  wastewaterM3Day: null,
};
const validTabs = new Set(Object.keys(tabLabels));
const summaryClass: Record<ProcedureCategory, string> = {
  REQUIRED: "applies",
  CONFIRM: "possibly_applies",
  NOT_REQUIRED: "does_not_apply",
};

function OrdinanceDisclosure({ answers }: { answers: ScenarioAnswers }) {
  const [isOpen, setIsOpen] = useState(Boolean(answers.province));
  return (
    <details
      className="ordinance-disclosure"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary>지역 자치법규 확인</summary>
      <LocalOrdinancePanel answers={answers} />
    </details>
  );
}

export function DashboardClient() {
  const [answers, setAnswers] = useState<ScenarioAnswers>(defaultAnswers);
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState<DashboardTab>("SWIMLANE");
  const [durationScenario, setDurationScenario] = useState<DurationScenario>("TYPICAL");
  const [isDurationDialogOpen, setIsDurationDialogOpen] = useState(false);
  const [selectedSummaryCategory, setSelectedSummaryCategory] = useState<ProcedureCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("ALL");
  const [showExcluded, setShowExcluded] = useState(false);
  const [requiredOnly, setRequiredOnly] = useState(false);
  const [includeConditional, setIncludeConditional] = useState(true);
  const [includePractical, setIncludePractical] = useState(true);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const restored = decodeShareState(window.location.search, defaultAnswers);
      setAnswers(restored.answers);
      if (restored.tab && validTabs.has(restored.tab)) setActiveTab(restored.tab as DashboardTab);
      if (restored.warning) setShareMessage(restored.warning);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const query = encodeShareState(answers, activeTab);
        window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
      } catch (error) {
        if (!(error instanceof ShareStateTooLongError)) throw error;
      }
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [answers, activeTab]);

  const evaluation = useMemo(() => evaluateProject(answers, { includeConditional, includePractical }), [answers, includeConditional, includePractical]);
  const schedule = evaluation.schedules[durationScenario];
  const timeline = schedule.projectTimeline;
  const unknownOperationReadyDurationCount = timeline
    ? timeline.unknownPlanningDurationProcedureIds.filter(
        (id) => !timeline.postOperationProcedureIds.includes(id),
      ).length
    : 0;
  const omittedOperationReadyProcedureCount = timeline
    ? timeline.omittedConditionalProcedureIds.filter(
        (id) => !timeline.postOperationProcedureIds.includes(id),
      ).length
    : 0;
  const incompleteDurationComponentCount = timeline
    ? timeline.incompleteDurationComponentProcedureIds.filter(
        (id) => !timeline.postOperationProcedureIds.includes(id),
      ).length
    : 0;
  const minimumOnlyMissingComponents = [
    unknownOperationReadyDurationCount
      ? `처리기간 미확인 인허가 ${unknownOperationReadyDurationCount}개`
      : null,
    omittedOperationReadyProcedureCount
      ? `일정에서 제외한 대상확인 절차 ${omittedOperationReadyProcedureCount}개`
      : null,
    incompleteDurationComponentCount
      ? `신청준비·심사·협의 기간 구성 미확인 ${incompleteDurationComponentCount}개`
      : null,
  ].filter((item): item is string => item !== null);
  const durationSummary = !timeline
    ? {
        value: "산정 불가",
        detail: "착공 예정일·준공 예정일 미입력",
        description: "공사 일정과 공식 처리기간을 함께 계산합니다.",
        isMinimumOnly: false,
      }
    : timeline.durationStatus === "MINIMUM_ONLY"
      ? {
          value: formatCalendarPeriod(timeline.projectStartDate, timeline.minimumKnownCompletionDate),
          detail: `누락 구성요소 · ${minimumOnlyMissingComponents.join(" · ") || "일정 구조 검증 항목"}`,
          description: "공식 처리기간이 확인된 절차만 합산한 값으로, 총 소요기간이 아닙니다.",
          isMinimumOnly: true,
        }
      : {
          value: formatCalendarPeriod(timeline.projectStartDate, timeline.operationReadyDate ?? timeline.minimumKnownCompletionDate),
          detail: durationScenario === "MIN" ? "공식 최단 처리경로" : "공식 표준 처리경로",
          description: durationScenario === "MIN"
            ? "가장 빠른 공식 처리경로를 기준으로 산정합니다."
            : "확인된 공식 처리기간의 통상 경로를 기준으로 산정합니다.",
          isMinimumOnly: false,
        };
  const durationHeading = !timeline
    ? "사업 일정"
    : durationSummary.isMinimumOnly
      ? "확인된 일정 하한"
      : "총 소요기간";
  const domains = useMemo(() => [...new Set(evaluation.decisions.map((decision) => decision.procedure.domain))].sort(), [evaluation.decisions]);
  const decisionsByCategory = useMemo(
    () => Object.fromEntries(
      procedureCategoryOrder.map((category) => [
        category,
        evaluation.decisions.filter(
          (decision) => procedureCategoryForDecision(decision) === category,
        ),
      ]),
    ) as Record<ProcedureCategory, typeof evaluation.decisions>,
    [evaluation],
  );
  const filteredDecisions = evaluation.decisions.filter((decision) => {
    const category = procedureCategoryForDecision(decision);
    if (!showExcluded && category === "NOT_REQUIRED") return false;
    if (requiredOnly && category !== "REQUIRED") return false;
    if (domain !== "ALL" && decision.procedure.domain !== domain) return false;
    const legalText = decision.procedure.citationIds.map((citationId) => {
      const citation = catalog.citations.find((item) => item.id === citationId);
      const source = catalog.legalSources.find((item) => item.id === citation?.sourceId);
      return `${source?.title ?? ""} ${citation?.article ?? ""} ${citation?.summary ?? ""}`;
    }).join(" ");
    const haystack = `${decision.procedure.name} ${decision.procedure.aliases.join(" ")} ${decision.procedure.receivingAuthority} ${legalText}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  const selectedDecision = evaluation.decisions.find((decision) => decision.procedure.id === selectedId) ?? null;

  function changeAnswer<K extends keyof ScenarioAnswers>(key: K, value: ScenarioAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  async function copyShareLink() {
    let link: string;
    try {
      link = `${window.location.origin}${window.location.pathname}?${encodeShareState(answers, activeTab)}`;
    } catch (error) {
      if (!(error instanceof ShareStateTooLongError)) throw error;
      setShareMessage("입력 내용이 많아 공유 링크를 만들 수 없습니다. 긴 설명이나 선택 항목을 줄여 주세요.");
      window.setTimeout(() => setShareMessage(""), 3600);
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setShareMessage("현재 조건의 공유 링크를 복사했습니다.");
    } catch {
      setShareMessage("주소창의 링크를 복사해 공유해 주세요.");
    }
    window.setTimeout(() => setShareMessage(""), 2600);
  }

  function resetDashboard() {
    setAnswers(defaultAnswers);
    setActiveStep(0);
    setActiveTab("SWIMLANE");
    setDurationScenario("TYPICAL");
    setIsDurationDialogOpen(false);
    setSelectedSummaryCategory(null);
    setSelectedId(null);
    setSearch("");
    setDomain("ALL");
    setShowExcluded(false);
    setRequiredOnly(false);
    setIncludeConditional(true);
    setIncludePractical(true);
  }

  function closeStatusDialog() {
    const previous = selectedSummaryCategory;
    setSelectedSummaryCategory(null);
    window.setTimeout(() => {
      if (previous) document.getElementById(`summary-${previous}`)?.focus();
    }, 0);
  }

  function closeDurationDialog() {
    setIsDurationDialogOpen(false);
    window.setTimeout(() => {
      document.getElementById("duration-summary-trigger")?.focus();
    }, 0);
  }

  return (
    <main className="dashboard-page">
      <header className="topbar">
        <a className="brand" href="#main-dashboard" aria-label="지역투자 인허가 입력으로 이동">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><h1>지역투자 인허가 로드맵</h1><small>비수도권 사업 검토</small></span>
        </a>
        <div className="topbar-meta">
          <span className="data-health"><i /> 법령 검토 기준 · {catalog.coverage.lastLegalReviewAt}</span>
          <button type="button" className="share-button" onClick={copyShareLink}>공유 링크 복사</button>
        </div>
      </header>

      <div id="main-dashboard" className="dashboard-grid">
        <Wizard answers={answers} activeStep={activeStep} onStepChange={setActiveStep} onChange={changeAnswer} />
        <section className="workspace" aria-label="판정 결과">
          <div className="workspace-toolbar">
            <div className="workspace-title"><h2 id="dashboard-title">사업 검토 결과</h2><p>사업 조건에 맞는 절차, 적용 특례와 예상 일정을 확인합니다.</p></div>
            <div className="scenario-caption"><strong><LocalJurisdictionLinks answers={answers} /> · {answers.insideIndustrialComplex === null ? "입지 미확인" : answers.insideIndustrialComplex ? "산업단지" : "개별입지"}</strong><span>{answers.totalAreaM2 === null ? "면적 미확인" : `${answers.totalAreaM2.toLocaleString("ko-KR")}㎡`} · 검토 기준일 {answers.assessmentDate}</span><em>지역명은 전체 목록, 아래 지역기준 카드는 관련 조례 상세 원문으로 연결됩니다.</em></div>
            <div className="utility-actions"><button type="button" onClick={resetDashboard}>초기화</button><button type="button" onClick={() => window.print()}>인쇄</button></div>
          </div>
          <div className="summary-strip" aria-label="판정 요약">
            <div className="summary-card summary-schedule">
              <button
                id="duration-summary-trigger"
                type="button"
                className="duration-summary-trigger"
                aria-haspopup="dialog"
                aria-controls="total-duration-dialog"
                aria-expanded={isDurationDialogOpen}
                aria-label={`${durationHeading} ${durationSummary.value} 계산 경로 열기`}
                aria-describedby="duration-summary-description duration-summary-detail"
                onClick={() => setIsDurationDialogOpen(true)}
              >
                <span className="summary-card-copy">
                  <span className="duration-summary-title">
                    <b>{durationHeading}</b>
                    {durationSummary.isMinimumOnly ? <span className="duration-summary-badge">총 소요기간 아님</span> : null}
                  </span>
                  <small id="duration-summary-description">{durationSummary.description}</small>
                </span>
                <span className={`duration-summary-result${durationSummary.isMinimumOnly ? " is-minimum-only" : ""}`}>
                  <strong>{durationSummary.value}</strong>
                  <small id="duration-summary-detail">{durationSummary.detail}</small>
                </span>
                <span className="summary-card-link">계산 경로 보기 <span aria-hidden="true">→</span></span>
              </button>
              <div className="summary-scenario-row">
                <span>소요기간 기준</span>
                <div className="scenario-switch" aria-label="소요기간 기준">
                  {(["MIN", "TYPICAL"] as DurationScenario[]).map((scenario) => <button type="button" key={scenario} aria-pressed={durationScenario === scenario} className={durationScenario === scenario ? "is-selected" : ""} onClick={() => setDurationScenario(scenario)}>{scenario === "MIN" ? "최소기간" : "통상"}</button>)}
                </div>
              </div>
            </div>
            {procedureCategoryOrder.map((category) => (
              <button
                id={`summary-${category}`}
                type="button"
                className={`summary-card summary-action summary-${summaryClass[category]}`}
                key={category}
                aria-haspopup="dialog"
                aria-controls="status-summary-dialog"
                aria-expanded={selectedSummaryCategory === category}
                aria-label={`${procedureCategorySummaries[category].label} ${decisionsByCategory[category].length}개 목록 열기`}
                aria-describedby={`summary-${category}-description`}
                onClick={() => setSelectedSummaryCategory(category)}
              >
                <span className="summary-card-heading">
                  <b>{procedureCategorySummaries[category].label}</b>
                  <span className="summary-count"><strong>{decisionsByCategory[category].length}</strong><small>개</small></span>
                </span>
                <small id={`summary-${category}-description`} className="summary-card-description">{procedureCategorySummaries[category].description}</small>
                <span className="summary-card-link">목록 보기 <span aria-hidden="true">→</span></span>
              </button>
            ))}
          </div>
          <SpecialLawSummary industryCategory={answers.industryCategory} evaluations={evaluation.specialLawEvaluations} />
          <ProjectInputSummary answers={answers} />
          <div className="decision-banner" role="note"><span className="decision-icon" aria-hidden="true">i</span><p><strong>화면의 결과는 사전 검토용입니다.</strong> 신청 전에는 필지·시설 규모·물질 수량과 최신 관할기준을 담당기관에 확인해야 합니다.</p></div>
          <OrdinanceDisclosure
            key={`${answers.province}:${answers.city}`}
            answers={answers}
          />

          <div className="tab-row">
            <nav className="dashboard-tabs" aria-label="결과 보기" role="tablist">
              {(Object.keys(tabLabels) as DashboardTab[]).map((tab) => <button id={`tab-${tab}`} aria-controls="dashboard-result-panel" key={tab} type="button" className={activeTab === tab ? "is-active" : ""} aria-selected={activeTab === tab} role="tab" onClick={() => setActiveTab(tab)}><DashboardTabIcon tab={tab} />{tabLabels[tab]}</button>)}
            </nav>
          </div>

          {activeTab === "SWIMLANE" || activeTab === "LIST" ? (
            <div className="filterbar">
              <label className="search-field"><span className="sr-only">절차 검색</span><i aria-hidden="true" /><input type="search" placeholder="절차·기관 검색" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <label><span className="sr-only">분야 필터</span><select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="ALL">모든 분야</option>{domains.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="check-control"><input type="checkbox" checked={includeConditional} onChange={(event) => setIncludeConditional(event.target.checked)} /><span>대상 확인 절차 일정 포함</span></label>
              <label className="check-control"><input type="checkbox" checked={requiredOnly} onChange={(event) => setRequiredOnly(event.target.checked)} /><span>필수만 보기</span></label>
              <label className="check-control"><input type="checkbox" checked={includePractical} onChange={(event) => setIncludePractical(event.target.checked)} /><span>실무 선행 포함</span></label>
              <label className="check-control"><input type="checkbox" checked={showExcluded} onChange={(event) => setShowExcluded(event.target.checked)} /><span>거칠 필요 없는 절차 표시</span></label>
            </div>
          ) : null}

          <div id="dashboard-result-panel" className="view-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            {activeTab === "SWIMLANE" ? <Swimlane decisions={filteredDecisions} schedule={schedule} selectedId={selectedId} onSelect={setSelectedId} /> : null}
            {activeTab === "ACTION" ? <ActionPlanView decisions={evaluation.decisions} schedule={schedule} answers={answers} onSelect={setSelectedId} /> : null}
            {activeTab === "LIST" ? <ProcedureList decisions={filteredDecisions} schedule={schedule} onSelect={setSelectedId} /> : null}
            {activeTab === "SCHEDULE" ? <ScheduleView schedule={schedule} answers={answers} /> : null}
            {activeTab === "LEGAL" ? <LegalView decisions={evaluation.decisions.filter((decision) => procedureCategoryForDecision(decision) !== "NOT_REQUIRED" || decision.specialLawImpacts?.length)} onSelect={setSelectedId} /> : null}
            {activeTab === "GAPS" ? <GapsView decisions={evaluation.decisions} /> : null}
          </div>
        </section>
      </div>

      <footer className="dashboard-footer"><p>{catalog.coverage.disclaimer}</p><span>데이터 버전 {catalog.coverage.catalogVersion} · 출처 {catalog.coverage.sourceAttribution}</span></footer>
      {selectedSummaryCategory ? (
        <StatusSummaryDialog
          category={selectedSummaryCategory}
          decisions={decisionsByCategory[selectedSummaryCategory]}
          onClose={closeStatusDialog}
          onSelect={setSelectedId}
        />
      ) : null}
      {isDurationDialogOpen ? <TotalDurationDialog schedule={schedule} onClose={closeDurationDialog} /> : null}
      <ProcedureDrawer decision={selectedDecision} schedule={schedule} onClose={() => setSelectedId(null)} />
      {shareMessage ? <div className="toast" role="status">{shareMessage}</div> : null}
    </main>
  );
}

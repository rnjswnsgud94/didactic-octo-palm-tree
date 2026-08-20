"use client";

import { useState } from "react";

import type { ScenarioAnswers } from "@/lib/data/catalog";
import {
  applyIndustryProfile,
  getIndustryProfile,
  industryProfileGroups,
  industryProfilePresetKeys,
  industryProfiles,
  industryReviewFieldLabels,
} from "@/lib/data/industry-profiles";
import { nonCapitalRegions } from "@/lib/regions";
import { listSupportedMunicipalities } from "@/lib/regions/local-ordinances";

type Props = {
  answers: ScenarioAnswers;
  activeStep: number;
  onStepChange: (step: number) => void;
  onChange: <K extends keyof ScenarioAnswers>(key: K, value: ScenarioAnswers[K]) => void;
};

const steps = [
  { title: "사업 기본", hint: "유형·지역·입지" },
  { title: "시설 규모", hint: "건축·면적·의제" },
  { title: "환경·안전", hint: "배출시설·PSM" },
  { title: "인프라", hint: "전력·용수·폐수" },
  { title: "공사 일정", hint: "착공·준공 예정일" },
];

function calendarDayDistance(start: string, end: string) {
  const startDay = Date.parse(`${start}T00:00:00.000Z`);
  const endDay = Date.parse(`${end}T00:00:00.000Z`);
  if (!Number.isFinite(startDay) || !Number.isFinite(endDay)) return 0;
  return Math.floor((endDay - startDay) / 86_400_000) + 1;
}

function koreanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

function isValidAssessmentDate(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function Question({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="wizard-question">
      <legend>{label}</legend>
      {hint ? <p className="question-hint">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; note?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button
          type="button"
          className={`choice-button ${value === option.value ? "is-selected" : ""}`}
          aria-pressed={value === option.value}
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          {option.note ? <small>{option.note}</small> : null}
        </button>
      ))}
    </div>
  );
}

function TriState({
  value,
  onChange,
  yesLabel = "있음",
  noLabel = "없음",
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="segmented" role="group">
      {[
        { value: true, label: yesLabel },
        { value: false, label: noLabel },
        { value: null, label: "모름" },
      ].map((option) => (
        <button
          type="button"
          key={String(option.value)}
          aria-pressed={value === option.value}
          className={value === option.value ? "is-selected" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function NumberInput({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number | null;
  unit: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <span className="input-with-unit">
        <input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder="미확인"
          value={value ?? ""}
          onChange={(event) => {
            const next = event.target.value;
            onChange(next === "" ? null : Math.max(0, Number(next)));
          }}
        />
        <em>{unit}</em>
      </span>
    </label>
  );
}

export function Wizard({ answers, activeStep, onStepChange, onChange }: Props) {
  const [assessmentDateError, setAssessmentDateError] = useState("");
  const assessmentDateIsValid = isValidAssessmentDate(answers.assessmentDate);
  const selectedIndustryProfile = getIndustryProfile(answers.industryCategory);
  const municipalities = listSupportedMunicipalities(answers.province);
  const visibleAssessmentDateError = assessmentDateIsValid
    ? assessmentDateError
    : "평가 기준일을 올바른 날짜로 입력해 주세요.";

  function changeIndustry(industryCategory: string) {
    const applied = applyIndustryProfile(answers, industryCategory);
    onChange("industryCategory", applied.industryCategory);
    for (const key of industryProfilePresetKeys) {
      if (applied[key] !== answers[key]) onChange(key, applied[key]);
    }
  }

  return (
    <aside className="wizard-panel" aria-label="사업조건 입력">
      <div className="wizard-heading">
        <div>
          <span className="eyebrow">사업 정보 입력</span>
          <h2>사업조건 설정</h2>
        </div>
        <span className="step-count">{activeStep + 1} / {steps.length}</span>
      </div>

      <nav className="wizard-steps" aria-label="입력 단계">
        {steps.map((step, index) => (
          <button
            type="button"
            key={step.title}
            className={index === activeStep ? "is-active" : ""}
            aria-current={index === activeStep ? "step" : undefined}
            onClick={() => onStepChange(index)}
          >
            <span>{index + 1}</span>
            <strong>{step.title}</strong>
            <small>{step.hint}</small>
          </button>
        ))}
      </nav>

      <div className="wizard-body">
        {activeStep === 0 ? (
          <>
            <Question label="투자 유형">
              <ChoiceGroup
                value={answers.investmentType}
                onChange={(value) => onChange("investmentType", value)}
                options={[
                  { value: "NEW", label: "신설" },
                  { value: "EXPANSION", label: "증설" },
                  { value: "RELOCATION", label: "이전" },
                  { value: "PROCESS_CHANGE", label: "공정변경" },
                  { value: "INDUSTRY_CHANGE", label: "업종변경" },
                ]}
              />
            </Question>
            <Question label="평가 기준일" hint="이 날짜에 시행 중인 법령 경로를 기준으로 봅니다.">
              <input
                className="text-input"
                type="date"
                aria-label="평가 기준일"
                aria-describedby={visibleAssessmentDateError ? "assessment-date-error" : undefined}
                aria-invalid={visibleAssessmentDateError ? true : undefined}
                required
                value={answers.assessmentDate}
                onChange={(event) => {
                  const next = event.target.value;
                  if (!isValidAssessmentDate(next)) {
                    setAssessmentDateError("평가 기준일은 비워둘 수 없습니다.");
                    onChange("assessmentDate", answers.assessmentDate);
                    return;
                  }
                  setAssessmentDateError("");
                  onChange("assessmentDate", next);
                }}
              />
              {visibleAssessmentDateError ? (
                <p id="assessment-date-error" className="question-error" role="alert">
                  {visibleAssessmentDateError}
                </p>
              ) : null}
            </Question>
            <Question label="투자 지역" hint="비수도권 14개 시·도와 시·군·구를 선택하면 해당 관할의 현행 자치법규 목록을 결과에 연결합니다.">
              <div className="two-column-fields">
                <label>
                  <span>시·도</span>
                  <select
                    value={answers.province}
                    onChange={(event) => {
                      onChange("province", event.target.value);
                      onChange("city", "");
                    }}
                  >
                    <option value="">시·도 선택</option>
                    {nonCapitalRegions.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>시·군·구</span>
                  <select
                    value={answers.city}
                    onChange={(event) => onChange("city", event.target.value)}
                    disabled={!answers.province || municipalities.length === 0}
                  >
                    <option value="">{answers.province ? municipalities.length ? "시·군·구 선택" : "광역 단층제" : "시·도 먼저 선택"}</option>
                    {municipalities.map((municipality) => (
                      <option value={municipality} key={municipality}>{municipality}</option>
                    ))}
                  </select>
                </label>
              </div>
            </Question>
            <Question label="산업단지 안에 있습니까?">
              <TriState
                value={answers.insideIndustrialComplex}
                yesLabel="산단 안"
                noLabel="개별입지"
                onChange={(value) => onChange("insideIndustrialComplex", value)}
              />
            </Question>
            <Question
              label="업종·주요 공정"
              hint="제11차 한국표준산업분류의 제조업(10~34)을 투자 검토용으로 묶었습니다."
            >
              <select
                aria-label="업종·주요 공정"
                value={answers.industryCategory}
                onChange={(event) => changeIndustry(event.target.value)}
              >
                <option value="UNKNOWN">업종을 선택해 주세요</option>
                {industryProfileGroups.map((group) => (
                  <optgroup label={group} key={group}>
                    {industryProfiles
                      .filter((profile) => profile.group === group)
                      .map((profile) => (
                        <option value={profile.id} key={profile.id}>
                          {profile.label}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {selectedIndustryProfile ? (
                <div className="inline-notice info">
                  <strong>업종 프로필 자동 반영</strong>
                  <span>
                    {Object.keys(selectedIndustryProfile.initialValues).length > 0
                      ? `비어 있던 ${Object.keys(selectedIndustryProfile.initialValues)
                          .map((key) => industryReviewFieldLabels[key as keyof typeof industryReviewFieldLabels])
                          .join("·")} 항목에 업종상 흔한 초기값을 넣었습니다. `
                      : "업종명만으로 예·아니오를 정하지 않고 우선 확인 항목을 안내합니다. "}
                    법적 대상 확정이 아니므로 실제 설비·물질·규모에 맞게 아래에서 수정하세요.
                    {` 우선 확인: ${selectedIndustryProfile.reviewKeys
                      .map((key) => industryReviewFieldLabels[key])
                      .join(" · ")}`}
                  </span>
                </div>
              ) : null}
            </Question>
          </>
        ) : null}

        {activeStep === 1 ? (
          <>
            <Question label="건축행위">
              <ChoiceGroup
                value={answers.buildingAction}
                onChange={(value) => onChange("buildingAction", value)}
                options={[
                  { value: "NEW_BUILD", label: "신축" },
                  { value: "EXTENSION", label: "증축" },
                  { value: "MAJOR_REPAIR", label: "대수선" },
                  { value: "CHANGE_OF_USE", label: "용도변경" },
                  { value: "NONE", label: "건축 없음", note: "설비투자" },
                ]}
              />
            </Question>
            <Question
              label="기계설비법 착공 전 확인·사용 전 검사 대상 여부"
              hint="건축물 용도·연면적과 냉난방·환기·급배수 등 기계설비 공사 범위를 검토한 결과를 입력합니다."
            >
              <TriState
                value={answers.mechanicalEquipmentActTarget}
                yesLabel="대상"
                noLabel="비대상"
                onChange={(value) => onChange("mechanicalEquipmentActTarget", value)}
              />
            </Question>
            <Question label="공장건축면적" hint="기존·증가분·사업 후 총량을 구분해 입력합니다.">
              <div className="stacked-fields">
                <NumberInput label="기존" unit="㎡" value={answers.existingAreaM2} onChange={(value) => onChange("existingAreaM2", value)} />
                <NumberInput label="증가분" unit="㎡" value={answers.increaseAreaM2} onChange={(value) => onChange("increaseAreaM2", value)} />
                <NumberInput label="사업 후 총량" unit="㎡" value={answers.totalAreaM2} onChange={(value) => onChange("totalAreaM2", value)} />
              </div>
              {answers.totalAreaM2 !== null ? (
                <p className={`threshold-note ${answers.totalAreaM2 >= 500 ? "is-over" : ""}`}>
                  500㎡ 기준 {answers.totalAreaM2 < 500 ? "미만" : answers.totalAreaM2 === 500 ? "동일" : "초과"} · 현재 {answers.totalAreaM2.toLocaleString("ko-KR")}㎡
                </p>
              ) : null}
            </Question>
            <Question label="부지 현황" hint="개별입지는 지목뿐 아니라 실제 농지·산지 여부를 함께 확인해야 합니다.">
              <select
                value={answers.landCategory ?? "UNKNOWN"}
                onChange={(event) => onChange("landCategory", event.target.value === "UNKNOWN" ? null : event.target.value as ScenarioAnswers["landCategory"])}
              >
                <option value="OTHER">일반 대지·공장용지 등</option>
                <option value="FARMLAND">농지</option>
                <option value="FOREST">산지</option>
                <option value="UNKNOWN">미확인</option>
              </select>
            </Question>
            <Question label="기존 건축물 해체 여부">
              <TriState value={answers.demolitionRequired} onChange={(value) => onChange("demolitionRequired", value)} />
            </Question>
            {answers.demolitionRequired !== false ? (
              <Question label="석면 함유 자재 확인 여부" hint="해체·철거 전 석면조사 결과를 입력합니다.">
                <TriState value={answers.asbestosPresent} yesLabel="석면 있음" noLabel="석면 없음" onChange={(value) => onChange("asbestosPresent", value)} />
              </Question>
            ) : null}
            <Question label="도로 직접 연결허가 필요 여부">
              <TriState value={answers.roadConnectionRequired} yesLabel="필요" noLabel="불필요" onChange={(value) => onChange("roadConnectionRequired", value)} />
            </Question>
            <Question label="교통영향평가 대상 여부" hint="공장 연면적·도시교통정비지역·조례 기준을 검토한 결과를 입력합니다.">
              <TriState value={answers.trafficImpactAssessmentRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("trafficImpactAssessmentRequired", value)} />
            </Question>
            {answers.insideIndustrialComplex !== true ? (
              <Question label="공장설립 승인 시 의제협의 범위" hint="정부24 처리기간 유형 선택에만 사용하며 자동 의제를 의미하지 않습니다.">
                <select
                  value={answers.permitCoordination ?? "UNKNOWN"}
                  onChange={(event) => onChange("permitCoordination", event.target.value === "UNKNOWN" ? null : event.target.value)}
                >
                  <option value="NONE">의제 인허가 없음</option>
                  <option value="LOCAL_ONLY">시·군·구 권한만 포함</option>
                  <option value="OTHER_LT_20">타 기관 20일 미만 인허가 포함</option>
                  <option value="OTHER_GTE_20">타 기관 20일 이상 인허가 포함</option>
                  <option value="UNKNOWN">미확인</option>
                </select>
              </Question>
            ) : (
              <div className="inline-notice success">
                <strong>산단 경로</strong>
                <span>입주계약 체결 시 별도 공장설립 승인은 의제되어 중복 제거됩니다.</span>
              </div>
            )}
            <Question label="재해영향평가등 협의 검토 결과">
              <select
                value={answers.disasterImpactAssessmentType ?? "UNKNOWN"}
                onChange={(event) => onChange("disasterImpactAssessmentType", event.target.value === "UNKNOWN" ? null : event.target.value as ScenarioAnswers["disasterImpactAssessmentType"])}
              >
                <option value="NONE">비대상</option>
                <option value="DISASTER_IMPACT">재해영향평가 대상</option>
                <option value="DISASTER_IMPACT_REVIEW">재해영향성검토 대상</option>
                <option value="UNKNOWN">미확인</option>
              </select>
            </Question>
            <Question label="지하안전평가 검토 결과" hint="굴착깊이와 굴착면적을 기준으로 검토한 값을 입력합니다.">
              <select
                value={answers.undergroundSafetyAssessmentType ?? "UNKNOWN"}
                onChange={(event) => onChange("undergroundSafetyAssessmentType", event.target.value === "UNKNOWN" ? null : event.target.value as ScenarioAnswers["undergroundSafetyAssessmentType"])}
              >
                <option value="NONE">비대상</option>
                <option value="UNDERGROUND_SAFETY">지하안전평가 대상</option>
                <option value="SMALL_UNDERGROUND_SAFETY">소규모 지하안전평가 대상</option>
                <option value="UNKNOWN">미확인</option>
              </select>
            </Question>
            <Question label="국가유산 영향 검토 결과" hint="매장유산 유존지역·보존영향 검토 결과를 입력합니다.">
              <select
                value={answers.nationalHeritageAssessmentType ?? "UNKNOWN"}
                onChange={(event) => onChange("nationalHeritageAssessmentType", event.target.value === "UNKNOWN" ? null : event.target.value as ScenarioAnswers["nationalHeritageAssessmentType"])}
              >
                <option value="NONE">비대상</option>
                <option value="PRELIMINARY_CONSULTATION">사전협의 대상</option>
                <option value="IMPACT_DIAGNOSIS">영향진단 대상</option>
                <option value="SIMPLIFIED_DIAGNOSIS">약식영향진단 대상</option>
                <option value="UNKNOWN">미확인</option>
              </select>
            </Question>
            <Question label="필지별 입지규제 검토" hint="토지이용규제정보와 관할기관 사전검토 결과를 항목별로 입력합니다.">
              <div className="stacked-fields compact-tristates">
                <label><span>군사시설 보호구역 협의</span><TriState value={answers.militaryProtectionConsultationRequired} yesLabel="필요" noLabel="불필요" onChange={(value) => onChange("militaryProtectionConsultationRequired", value)} /></label>
                <label><span>하천점용허가</span><TriState value={answers.riverOccupationRequired} yesLabel="필요" noLabel="불필요" onChange={(value) => onChange("riverOccupationRequired", value)} /></label>
                <label><span>공유수면 점용·사용허가</span><TriState value={answers.publicWaterOccupationRequired} yesLabel="필요" noLabel="불필요" onChange={(value) => onChange("publicWaterOccupationRequired", value)} /></label>
                <label><span>상수원보호구역 해당</span><TriState value={answers.waterSourceProtectionZone} yesLabel="해당" noLabel="비해당" onChange={(value) => onChange("waterSourceProtectionZone", value)} /></label>
              </div>
            </Question>
          </>
        ) : null}

        {activeStep === 2 ? (
          <>
            <Question label="대기배출시설 해당 여부" hint="시설 종류·규모를 관계 법령의 배출시설 분류표와 대조한 결과를 입력하세요.">
              <TriState value={answers.airEmissionFacility} onChange={(value) => onChange("airEmissionFacility", value)} />
            </Question>
            <Question label="폐수배출시설 해당 여부">
              <TriState value={answers.waterDischargeFacility} onChange={(value) => onChange("waterDischargeFacility", value)} />
            </Question>
            <Question label="폐기물처리시설 설치 여부">
              <TriState value={answers.wasteFacility} onChange={(value) => onChange("wasteFacility", value)} />
            </Question>
            <Question label="환경영향평가 검토 결과" hint="사업유형·용도지역·개발면적을 기준으로 본안/소규모 여부를 구분합니다.">
              <select
                value={answers.environmentalAssessmentType ?? "UNKNOWN"}
                onChange={(event) => onChange("environmentalAssessmentType", event.target.value === "UNKNOWN" ? null : event.target.value as ScenarioAnswers["environmentalAssessmentType"])}
              >
                <option value="NONE">비대상</option>
                <option value="ENVIRONMENTAL">환경영향평가 대상</option>
                <option value="SMALL">소규모 환경영향평가 대상</option>
                <option value="UNKNOWN">미확인</option>
              </select>
            </Question>
            <Question label="통합환경허가 대상 여부" hint="대상 업종과 대기·수질 1·2종 등 규모를 검토한 결과를 입력합니다.">
              <TriState value={answers.integratedEnvironmentalPermitTarget} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("integratedEnvironmentalPermitTarget", value)} />
            </Question>
            <Question label="화학물질 취급 여부">
              <TriState value={answers.chemicalsHandled} onChange={(value) => onChange("chemicalsHandled", value)} />
            </Question>
            <Question label="화학물질·혼합물 직접 제조·수입 여부" hint="국내에서 구매해 사용만 하는 경우와 구분합니다.">
              <TriState value={answers.chemicalManufactureOrImport} yesLabel="제조·수입" noLabel="국내 구매·사용" onChange={(value) => onChange("chemicalManufactureOrImport", value)} />
            </Question>
            <Question label="유해화학물질 영업허가 대상 여부">
              <TriState value={answers.hazardousChemicalBusiness} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("hazardousChemicalBusiness", value)} />
            </Question>
            <Question label="화학물질 등록·신고 대상 여부" hint="신규·기존화학물질의 제조·수입량과 면제 여부를 검토한 값을 입력합니다.">
              <TriState value={answers.chemicalRegistrationRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("chemicalRegistrationRequired", value)} />
            </Question>
            <Question label="제한·금지·유독물질 수입허가·신고 대상 여부">
              <TriState value={answers.restrictedOrToxicChemicalImport} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("restrictedOrToxicChemicalImport", value)} />
            </Question>
            <Question label="지정수량 이상 위험물 취급 여부">
              <TriState value={answers.hazardousMaterials} onChange={(value) => onChange("hazardousMaterials", value)} />
            </Question>
            {answers.hazardousMaterials !== false ? (
              <>
                <Question label="위험물 탱크 설치 여부"><TriState value={answers.hazardousMaterialsTank} onChange={(value) => onChange("hazardousMaterialsTank", value)} /></Question>
                <Question label="위험물 예방규정 작성 대상 여부"><TriState value={answers.hazardousMaterialsPreventionRulesRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("hazardousMaterialsPreventionRulesRequired", value)} /></Question>
              </>
            ) : null}
            <Question label="허가·신고 대상 고압가스 여부">
              <TriState value={answers.highPressureGas} onChange={(value) => onChange("highPressureGas", value)} />
            </Question>
            <Question label="특정고압가스 사용신고 대상 여부" hint="가스 종류와 저장·사용 규모를 검토한 결과를 입력합니다.">
              <TriState value={answers.specificHighPressureGasUse} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("specificHighPressureGasUse", value)} />
            </Question>
            <Question label="LPG 특정사용시설 여부" hint="산업용 LPG 저장능력·사용량과 시설종류를 기준으로 완성검사 대상을 선택합니다.">
              <TriState value={answers.lpgSpecificUseFacility} yesLabel="검사 대상" noLabel="비대상" onChange={(value) => onChange("lpgSpecificUseFacility", value)} />
            </Question>
            <Question label="도시가스 특정사용시설 여부" hint="월 사용예정량과 배관 설치형태를 기준으로 완성검사 대상을 선택합니다.">
              <TriState value={answers.cityGasSpecificUseFacility} yesLabel="검사 대상" noLabel="비대상" onChange={(value) => onChange("cityGasSpecificUseFacility", value)} />
            </Question>
            {answers.chemicalsHandled !== false || answers.industryCategory !== "GENERAL_MANUFACTURING" ? (
              <Question label="PSM 대상 설비 여부" hint="업종·유해위험물질·규정량을 전문검토한 결과를 입력합니다.">
                <TriState
                  value={answers.psmCovered}
                  yesLabel="대상"
                  noLabel="비대상"
                  onChange={(value) => onChange("psmCovered", value)}
                />
              </Question>
            ) : null}
            <Question label="소방안전관리자 선임 대상 여부"><TriState value={answers.fireSafetyManagerRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("fireSafetyManagerRequired", value)} /></Question>
            <Question label="검사대상 열사용기자재 설치 여부"><TriState value={answers.heatUseEquipment} onChange={(value) => onChange("heatUseEquipment", value)} /></Question>
            <Question label="유해·위험기계 기구 안전검사 대상 여부"><TriState value={answers.hazardousMachineryInspectionRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("hazardousMachineryInspectionRequired", value)} /></Question>
            <Question label="안전·보건관리자 선임 대상 여부" hint="업종, 상시근로자 수, 공사금액·규모를 검토한 결과를 입력합니다.">
              <div className="stacked-fields compact-tristates">
                <label><span>안전관리자</span><TriState value={answers.safetyManagerRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("safetyManagerRequired", value)} /></label>
                <label><span>보건관리자</span><TriState value={answers.healthManagerRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("healthManagerRequired", value)} /></label>
              </div>
            </Question>
            <div className="inline-notice warning"><strong>별표 임계값</strong><span>물질명·CAS·최대보유량·지정수량 배수와 시설분류는 관계기관 또는 전문가 검토값을 입력하세요.</span></div>
          </>
        ) : null}

        {activeStep === 3 ? (
          <>
            <Question label="추가 인프라 수요" hint="0은 추가 수요 없음, 빈칸은 미확인으로 판정합니다.">
              <div className="stacked-fields">
                <NumberInput label="전력 증가분" unit="MW" value={answers.powerIncreaseMw} onChange={(value) => onChange("powerIncreaseMw", value)} />
                <NumberInput label="용수 수요" unit="㎥/일" value={answers.waterDemandM3Day} onChange={(value) => onChange("waterDemandM3Day", value)} />
                <NumberInput label="폐수 발생" unit="㎥/일" value={answers.wastewaterM3Day} onChange={(value) => onChange("wastewaterM3Day", value)} />
              </div>
            </Question>
            <Question label="소방시설공사 대상 여부">
              <TriState value={answers.fireFacilityWork} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("fireFacilityWork", value)} />
            </Question>
            <Question label="자가용전기설비 공사·사용전검사 대상 여부" hint="수전전압·설비용량·공사종류를 검토한 결과를 입력합니다.">
              <TriState value={answers.privateElectricalFacilityWork} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("privateElectricalFacilityWork", value)} />
            </Question>
            <Question label="에너지사용계획 협의 대상 여부">
              <TriState value={answers.energyUsePlanRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("energyUsePlanRequired", value)} />
            </Question>
            <Question label="지하수 개발·이용 여부">
              <TriState value={answers.groundwaterDevelopment} yesLabel="개발" noLabel="없음" onChange={(value) => onChange("groundwaterDevelopment", value)} />
            </Question>
            <Question label="오·폐수 처리 경로" hint="공공하수도 연결과 개인하수처리시설 설치 여부를 각각 입력합니다.">
              <div className="stacked-fields compact-tristates">
                <label><span>공공하수도 연결</span><TriState value={answers.publicSewerConnection} yesLabel="연결" noLabel="미연결" onChange={(value) => onChange("publicSewerConnection", value)} /></label>
                <label><span>개인하수처리시설 설치</span><TriState value={answers.privateSewageTreatmentFacility} yesLabel="설치" noLabel="미설치" onChange={(value) => onChange("privateSewageTreatmentFacility", value)} /></label>
              </div>
            </Question>
            <div className="inline-notice info">
              <strong>공급 일정 확인</strong>
              <span>전력·용수·폐수 인입은 공급기관의 용량 검토와 외부 공사 범위에 따라 달라집니다. 협의 결과가 나오면 공사 일정과 함께 갱신하세요.</span>
            </div>
          </>
        ) : null}

        {activeStep === 4 ? (
          <>
            <Question
              label="예상 공사 일정"
              hint="2025년 1월 1일부터 착공·준공 예정일을 입력하면 절차별 처리기간과 공사기간을 일 단위로 합쳐 계산합니다."
            >
              <div className="two-column-fields construction-date-fields">
                <label>
                  <span>착공 예정일</span>
                  <input
                    className="text-input"
                    type="date"
                    min="2025-01-01"
                    max="2040-12-31"
                    value={answers.plannedConstructionStartDate ?? ""}
                    onChange={(event) => onChange(
                      "plannedConstructionStartDate",
                      event.target.value || null,
                    )}
                  />
                </label>
                <label>
                  <span>준공 예정일</span>
                  <input
                    className="text-input"
                    type="date"
                    min={answers.plannedConstructionStartDate ?? "2025-01-01"}
                    max="2040-12-31"
                    value={answers.plannedConstructionEndDate ?? ""}
                    onChange={(event) => onChange(
                      "plannedConstructionEndDate",
                      event.target.value || null,
                    )}
                  />
                </label>
              </div>
              {answers.plannedConstructionStartDate && answers.plannedConstructionEndDate ? (
                calendarDayDistance(
                  answers.plannedConstructionStartDate,
                  answers.plannedConstructionEndDate,
                ) > 0 ? (
                  <p className="threshold-note is-over">
                    {koreanDate(answers.plannedConstructionStartDate)}부터 {koreanDate(answers.plannedConstructionEndDate)}까지 · 공사 {calendarDayDistance(answers.plannedConstructionStartDate, answers.plannedConstructionEndDate).toLocaleString("ko-KR")}일
                  </p>
                ) : (
                  <p className="threshold-note schedule-date-error">
                    준공 예정일은 착공 예정일보다 빠를 수 없습니다.
                  </p>
                )
              ) : (
                <p className="question-hint">두 값을 모두 입력하면 최소기간과 통상기간을 자동으로 비교할 수 있습니다.</p>
              )}
            </Question>
            <div className="inline-notice info">
              <strong>자동 일정 계산</strong>
              <span>법령·정부24에서 확인한 원 단위 처리기간을 사용합니다. 병행 가능한 절차는 겹쳐 배치하고, 착공이나 가동을 막는 경로만 총기간을 늘립니다.</span>
            </div>
            <Question label="건설공사 사전계획·신고 대상 여부" hint="공사 종류·규모·공사금액을 검토한 결과를 입력합니다.">
              <div className="stacked-fields compact-tristates">
                <label><span>안전관리계획 수립·검토</span><TriState value={answers.safetyManagementPlanRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("safetyManagementPlanRequired", value)} /></label>
                <label><span>유해·위험 작업 신고</span><TriState value={answers.specificWorkReportRequired} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("specificWorkReportRequired", value)} /></label>
              </div>
            </Question>
          </>
        ) : null}
      </div>

      <div className="wizard-footer">
        <button type="button" disabled={activeStep === 0} onClick={() => onStepChange(Math.max(0, activeStep - 1))}>이전</button>
        <button type="button" className="primary-button" disabled={activeStep === steps.length - 1} onClick={() => onStepChange(Math.min(steps.length - 1, activeStep + 1))}>다음</button>
      </div>
    </aside>
  );
}

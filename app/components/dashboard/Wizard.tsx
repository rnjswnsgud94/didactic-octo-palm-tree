"use client";

import type { ScenarioAnswers } from "@/lib/data/catalog";
import { nonCapitalRegions } from "@/lib/regions";

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
];

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
  return (
    <aside className="wizard-panel" aria-label="사업조건 입력">
      <div className="wizard-heading">
        <div>
          <span className="eyebrow">PROJECT INPUT</span>
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
                value={answers.assessmentDate}
                onChange={(event) => onChange("assessmentDate", event.target.value)}
              />
            </Question>
            <Question label="투자 지역" hint="서울·경기·인천을 제외한 전국 비수도권을 지원합니다. 시·군·구는 직접 수정할 수 있습니다.">
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
                    {nonCapitalRegions.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>시·군·구</span>
                  <input
                    className="text-input"
                    value={answers.city}
                    placeholder="예: 창원시"
                    maxLength={40}
                    onChange={(event) => onChange("city", event.target.value)}
                  />
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
            <Question label="업종·공정 유형" hint="업종명만으로 환경·안전 절차를 확정하지 않습니다.">
              <ChoiceGroup
                value={answers.industryCategory}
                onChange={(value) => onChange("industryCategory", value)}
                options={[
                  { value: "GENERAL_MANUFACTURING", label: "일반 제조업" },
                  { value: "SEMICONDUCTOR_ELECTRONICS", label: "반도체·전자" },
                  { value: "SECONDARY_BATTERY_CHEMICAL", label: "이차전지·화학" },
                ]}
              />
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
            <Question label="지정수량 이상 위험물 취급 여부">
              <TriState value={answers.hazardousMaterials} onChange={(value) => onChange("hazardousMaterials", value)} />
            </Question>
            <Question label="허가·신고 대상 고압가스 여부">
              <TriState value={answers.highPressureGas} onChange={(value) => onChange("highPressureGas", value)} />
            </Question>
            <Question label="특정고압가스 사용신고 대상 여부" hint="가스 종류와 저장·사용 규모를 검토한 결과를 입력합니다.">
              <TriState value={answers.specificHighPressureGasUse} yesLabel="대상" noLabel="비대상" onChange={(value) => onChange("specificHighPressureGasUse", value)} />
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
            <div className="inline-notice info">
              <strong>일정 활용 팁</strong>
              <span>공급협의 기간은 공식 공통값이 없어 숫자를 만들지 않으며 임계경로의 미확인 구간으로 표시합니다.</span>
            </div>
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

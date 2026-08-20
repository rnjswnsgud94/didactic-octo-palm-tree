import type { ScenarioAnswers } from "@/lib/data/catalog";

export type ScenarioPreset = {
  id: string;
  name: string;
  answers: ScenarioAnswers;
};

const industryLabels: Record<string, string> = {
  GENERAL_MANUFACTURING: "일반 제조업",
  SEMICONDUCTOR_ELECTRONICS: "반도체·전자",
  SECONDARY_BATTERY_CHEMICAL: "이차전지·화학",
};

function answersMatch(left: ScenarioAnswers, right: ScenarioAnswers) {
  const keys = new Set([
    ...Object.keys(left),
    ...Object.keys(right),
  ] as Array<keyof ScenarioAnswers>);
  return [...keys].every(
    (key) => JSON.stringify(left[key]) === JSON.stringify(right[key]),
  );
}

export function findExactScenarioId(
  scenarios: readonly ScenarioPreset[],
  answers: ScenarioAnswers,
) {
  return scenarios.find((scenario) => answersMatch(scenario.answers, answers))?.id;
}

export function countScenarioChanges(
  baseline: ScenarioAnswers,
  answers: ScenarioAnswers,
) {
  const keys = new Set([
    ...Object.keys(baseline),
    ...Object.keys(answers),
  ] as Array<keyof ScenarioAnswers>);
  return [...keys].filter(
    (key) => JSON.stringify(baseline[key]) !== JSON.stringify(answers[key]),
  ).length;
}

export function describeCurrentScenario(answers: ScenarioAnswers) {
  const industry = industryLabels[answers.industryCategory] ?? answers.industryCategory;
  const location = answers.city || answers.province || "지역 미확인";
  const site =
    answers.insideIndustrialComplex === null
      ? "입지 미확인"
      : answers.insideIndustrialComplex
        ? "산업단지"
        : "개별입지";
  return `${industry} · ${location} · ${site}`;
}

type Props = {
  scenarios: readonly ScenarioPreset[];
  answers: ScenarioAnswers;
  selectedScenarioId: string | null;
  onSelect: (scenarioId: string) => void;
};

export function ScenarioPicker({
  scenarios,
  answers,
  selectedScenarioId,
  onSelect,
}: Props) {
  const exactScenarioId = findExactScenarioId(scenarios, answers);
  const selectedScenario = scenarios.find(
    (scenario) => scenario.id === (selectedScenarioId ?? exactScenarioId),
  );
  const activeValue = selectedScenario?.id ?? "custom";
  const changeCount = selectedScenario
    ? countScenarioChanges(selectedScenario.answers, answers)
    : 0;

  return (
    <label className="scenario-picker">
      <span>검증 시나리오</span>
      <select
        value={activeValue}
        onChange={(event) => {
          if (event.target.value !== "custom") onSelect(event.target.value);
        }}
      >
        {!selectedScenario ? (
          <option value="custom">현재 조건 · {describeCurrentScenario(answers)}</option>
        ) : null}
        {scenarios.map((scenario) => {
          const isAdjusted = scenario.id === activeValue && changeCount > 0;
          return (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
              {isAdjusted ? ` · ${changeCount}개 조건 조정됨` : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

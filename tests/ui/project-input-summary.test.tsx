import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  getVisibleProjectInputSections,
  ProjectInputSummary,
  projectInputSections,
} from "@/app/components/dashboard/ScenarioPicker";
import { catalog, type ScenarioAnswers } from "@/lib/data/catalog";

function answerFixture(overrides: Partial<ScenarioAnswers> = {}) {
  return {
    ...catalog.scenarios[0].answers,
    plannedConstructionStartDate: "2027-03-01",
    plannedConstructionEndDate: "2029-08-31",
    ...overrides,
  } as ScenarioAnswers;
}

describe("ProjectInputSummary", () => {
  it("shows each relevant roadmap input once and omits legacy record-only fields", () => {
    const answers = answerFixture();
    const { container } = render(<ProjectInputSummary answers={answers} />);

    expect(screen.getByRole("heading", { name: "현재 사업조건" })).toBeInTheDocument();
    for (const title of ["입지", "업종·투자", "시설·환경", "위험물·안전", "공사 일정"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }

    const configuredKeys = projectInputSections.flatMap((section) =>
      section.fields.map((field) => field.key),
    );
    expect(configuredKeys).toHaveLength(new Set(configuredKeys).size);
    for (const legacyKey of [
      "siteAddress",
      "siteZoning",
      "siteRestrictedFactors",
      "industrialComplexName",
      "industrialComplexIdentifier",
      "industrialComplexManagingAuthority",
      "ksicCode",
      "products",
      "coreProcesses",
      "existingApprovalIds",
      "existingAreaM2",
      "increaseAreaM2",
    ]) {
      expect(configuredKeys).not.toContain(legacyKey);
    }

    const visibleKeys = getVisibleProjectInputSections(answers).flatMap((section) =>
      section.fields.map((field) => field.key),
    );
    expect(container.querySelectorAll("[data-input-key]")).toHaveLength(visibleKeys.length);
    expect(container.querySelector('[data-input-key="totalAreaM2"]')).not.toBeNull();
    expect(container.querySelector('[data-input-key="noiseVibrationFacility"]')).not.toBeNull();
  });

  it("does not collapse false, zero, null, and empty text into one state", () => {
    const answers = answerFixture({
      city: "",
      insideIndustrialComplex: false,
      totalAreaM2: 0,
      airEmissionFacility: null,
    });
    const { container } = render(<ProjectInputSummary answers={answers} />);

    const valueFor = (key: string) =>
      container.querySelector(`[data-input-key="${key}"]`);

    expect(valueFor("insideIndustrialComplex")).toHaveAttribute("data-input-state", "false");
    expect(valueFor("insideIndustrialComplex")).toHaveTextContent("개별입지");
    expect(valueFor("totalAreaM2")).toHaveAttribute("data-input-state", "zero");
    expect(valueFor("totalAreaM2")).toHaveTextContent("0 ㎡");
    expect(valueFor("airEmissionFacility")).toHaveAttribute("data-input-state", "unknown");
    expect(valueFor("airEmissionFacility")).toHaveTextContent("미확인");
    expect(valueFor("city")).toHaveAttribute("data-input-state", "set");
    expect(valueFor("city")).toHaveTextContent("미입력");
  });

  it("reflects edited inputs and daily construction dates without preset comparison text", () => {
    const initial = answerFixture();
    const { rerender } = render(<ProjectInputSummary answers={initial} />);

    rerender(
      <ProjectInputSummary
        answers={answerFixture({
          investmentType: "EXPANSION",
          province: "부산광역시",
          plannedConstructionStartDate: "2028-01-15",
          plannedConstructionEndDate: "2030-06-20",
        })}
      />,
    );

    expect(screen.getByText("증설")).toBeInTheDocument();
    expect(screen.getByText("부산광역시")).toBeInTheDocument();
    expect(screen.getByText("2028-01-15")).toBeInTheDocument();
    expect(screen.getByText("2030-06-20")).toBeInTheDocument();
    expect(screen.queryByText(/검증 시나리오|조건 조정됨|사용자 설정/)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});

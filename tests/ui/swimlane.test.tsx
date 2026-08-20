import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  denseProcedureCellThreshold,
  Swimlane,
} from "@/app/components/dashboard/Swimlane";
import { catalog } from "@/lib/data/catalog";
import { evaluateProject } from "@/lib/engine/pipeline";
import type { ProcedureDecision } from "@/lib/engine/rule-engine";
import type { ScheduleResult } from "@/lib/engine/schedule";

function denseFixture(count: number): {
  decisions: ProcedureDecision[];
  schedule: ScheduleResult;
} {
  const evaluated = evaluateProject(catalog.scenarios[0].answers);
  const source = evaluated.decisions.slice(0, count);
  const lane = source[0].procedure.lane;
  const decisions = source.map((decision) => ({
    ...decision,
    procedure: { ...decision.procedure, lane },
  }));
  const ids = decisions.map((decision) => decision.procedure.id);
  return {
    decisions,
    schedule: {
      scenario: "TYPICAL",
      unit: "BUSINESS_DAY",
      total: count,
      complete: true,
      nodes: ids.map((procedureId, index) => ({
        procedureId,
        earliestStart: 0,
        earliestFinish: index + 1,
        latestStart: 0,
        latestFinish: index + 1,
        slack: 0,
        duration: 1,
        critical: false,
        wave: 0,
        parallel: true,
      })),
      topologicalOrder: ids,
      activeEdgeIds: [],
      criticalProcedureIds: [],
      unknownDurationProcedureIds: [],
      warnings: [],
      projectTimeline: null,
    },
  };
}

describe("swimlane dense procedure cells", () => {
  it("switches only cells with ten or more procedures to a readable two-column track", () => {
    expect(denseProcedureCellThreshold).toBe(10);
    const onSelect = vi.fn();
    const nine = denseFixture(9);
    const view = render(
      <Swimlane
        decisions={nine.decisions}
        schedule={nine.schedule}
        selectedId={null}
        onSelect={onSelect}
      />,
    );

    const nineCell = view.container.querySelector(
      '.lane-cell[data-item-count="9"]',
    );
    expect(nineCell).not.toBeNull();
    expect(nineCell).not.toHaveClass("is-dense");
    expect(
      (view.container.querySelector(".swimlane-grid") as HTMLElement).style
        .gridTemplateColumns,
    ).toContain("minmax(220px, 1fr)");

    const ten = denseFixture(10);
    view.rerender(
      <Swimlane
        decisions={ten.decisions}
        schedule={ten.schedule}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    const tenCell = view.container.querySelector(
      '.lane-cell[data-item-count="10"]',
    );
    expect(tenCell).not.toBeNull();
    expect(tenCell).toHaveClass("is-dense");
    expect(within(tenCell as HTMLElement).getAllByRole("button")).toHaveLength(
      10,
    );
    expect(
      (view.container.querySelector(".swimlane-grid") as HTMLElement).style
        .gridTemplateColumns,
    ).toContain("minmax(440px, 2fr)");

    const clickedCard = within(tenCell as HTMLElement).getAllByRole("button")[4];
    const clickedName = clickedCard
      .getAttribute("aria-label")
      ?.replace(/ 상세 보기$/, "");
    const clickedDecision = ten.decisions.find(
      (decision) => decision.procedure.name === clickedName,
    );
    expect(clickedDecision).toBeDefined();
    fireEvent.click(clickedCard);
    expect(onSelect).toHaveBeenCalledWith(clickedDecision!.procedure.id);
  });
});

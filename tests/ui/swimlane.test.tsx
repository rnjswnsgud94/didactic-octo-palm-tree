import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  denseProcedureColumnThreshold,
  orthogonalConnectorPath,
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
  const fixtureLanes = [
    "CITY_COUNTY_DISTRICT",
    "ENVIRONMENT_SAFETY_FIRE_UTILITY",
  ] as const;
  const decisions = source.map((decision, index) => ({
    ...decision,
    procedure: { ...decision.procedure, lane: fixtureLanes[index % 2] },
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

function svgPathPoints(path: string) {
  const tokens = path.split(/\s+/);
  const points: Array<{ x: number; y: number }> = [];
  let x = 0;
  let y = 0;
  for (let index = 0; index < tokens.length;) {
    const command = tokens[index];
    if (command === "M") {
      x = Number(tokens[index + 1]);
      y = Number(tokens[index + 2]);
      index += 3;
    } else if (command === "H") {
      x = Number(tokens[index + 1]);
      index += 2;
    } else if (command === "V") {
      y = Number(tokens[index + 1]);
      index += 2;
    } else {
      throw new Error(`지원하지 않는 SVG 경로 명령: ${command}`);
    }
    points.push({ x, y });
  }
  return points;
}

function crossesRect(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rect: { top: number; right: number; bottom: number; left: number },
) {
  if (from.y === to.y) {
    return from.y > rect.top && from.y < rect.bottom
      && Math.min(from.x, to.x) < rect.right
      && Math.max(from.x, to.x) > rect.left;
  }
  return from.x > rect.left && from.x < rect.right
    && Math.min(from.y, to.y) < rect.bottom
    && Math.max(from.y, to.y) > rect.top;
}

describe("swimlane dense procedure columns", () => {
  it("switches every lane cell when the whole flow column reaches ten procedures", () => {
    expect(denseProcedureColumnThreshold).toBe(10);
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

    const nineCells = view.container.querySelectorAll(
      '.lane-cell[data-column-item-count="9"]',
    );
    expect(nineCells).toHaveLength(2);
    expect([...nineCells].map((cell) => cell.getAttribute("data-item-count"))).toEqual(["5", "4"]);
    for (const cell of nineCells) expect(cell).not.toHaveClass("is-dense");
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
    const tenCells = view.container.querySelectorAll(
      '.lane-cell[data-column-item-count="10"]',
    );
    expect(tenCells).toHaveLength(2);
    for (const cell of tenCells) {
      expect(cell).toHaveClass("is-dense");
      expect(cell).toHaveAttribute("data-item-count", "5");
      expect(within(cell as HTMLElement).getAllByRole("button")).toHaveLength(5);
    }
    expect(
      (view.container.querySelector(".swimlane-grid") as HTMLElement).style
        .gridTemplateColumns,
    ).toContain("minmax(440px, 2fr)");

    const clickedCard = view.container.querySelectorAll<HTMLButtonElement>(".procedure-card")[4];
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

  it("routes forward dependencies orthogonally and rejects unmeasured cards", () => {
    expect(orthogonalConnectorPath(
      { top: 100, right: 260, bottom: 160, left: 180, width: 80, height: 60 },
      { top: 210, right: 480, bottom: 270, left: 400, width: 80, height: 60 },
    )).toBe("M 260 130 H 330 V 240 H 395");
    expect(orthogonalConnectorPath(
      { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 },
      { top: 210, right: 480, bottom: 270, left: 400, width: 80, height: 60 },
    )).toBeNull();
  });

  it("detours around intervening cards without lifting the line over their content", () => {
    const cases = [
      {
        source: { top: 100, right: 260, bottom: 160, left: 180, width: 80, height: 60 },
        target: { top: 100, right: 480, bottom: 160, left: 400, width: 80, height: 60 },
        blockers: [{ top: 80, right: 370, bottom: 180, left: 290, width: 80, height: 100 }],
      },
      {
        source: { top: 100, right: 260, bottom: 160, left: 180, width: 80, height: 60 },
        target: { top: 100, right: 480, bottom: 160, left: 400, width: 80, height: 60 },
        blockers: [{ top: 100, right: 346, bottom: 160, left: 266, width: 80, height: 60 }],
      },
      {
        source: { top: 100, right: 260, bottom: 160, left: 180, width: 80, height: 60 },
        target: { top: 240, right: 260, bottom: 300, left: 180, width: 80, height: 60 },
        blockers: [{ top: 170, right: 260, bottom: 230, left: 180, width: 80, height: 60 }],
      },
      {
        source: { top: 100, right: 480, bottom: 160, left: 400, width: 80, height: 60 },
        target: { top: 100, right: 260, bottom: 160, left: 180, width: 80, height: 60 },
        blockers: [{ top: 80, right: 370, bottom: 180, left: 290, width: 80, height: 100 }],
      },
    ];

    for (const { source, target, blockers } of cases) {
      const path = orthogonalConnectorPath(
        source,
        target,
        { top: 0, left: 0 },
        blockers,
        { width: 660, height: 380 },
      );
      expect(path).not.toBeNull();
      expect(orthogonalConnectorPath(
        source,
        target,
        { top: 0, left: 0 },
        blockers,
        { width: 660, height: 380 },
      )).toBe(path);

      const points = svgPathPoints(path!);
      for (let index = 1; index < points.length; index += 1) {
        expect(
          points[index - 1].x === points[index].x
            || points[index - 1].y === points[index].y,
        ).toBe(true);
        for (const blocker of blockers) {
          expect(crossesRect(points[index - 1], points[index], blocker)).toBe(false);
        }
      }
    }
  });

  it("exposes only citation-backed sequence edges until a related card is selected", () => {
    const evaluation = evaluateProject(catalog.scenarios[0].answers);
    const schedule = evaluation.schedules.TYPICAL;
    const onSelect = vi.fn();
    const view = render(
      <Swimlane
        decisions={evaluation.decisions}
        schedule={schedule}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    const grid = view.container.querySelector(".swimlane-grid");
    expect(Number(grid?.getAttribute("data-evidence-edge-count"))).toBeGreaterThan(0);
    expect(grid).toHaveAttribute("data-context-edge-count", "0");

    view.rerender(
      <Swimlane
        decisions={evaluation.decisions}
        schedule={schedule}
        selectedId="building-permit"
        onSelect={onSelect}
      />,
    );
    expect(Number(
      view.container.querySelector(".swimlane-grid")?.getAttribute("data-context-edge-count"),
    )).toBeGreaterThan(0);
  });
});

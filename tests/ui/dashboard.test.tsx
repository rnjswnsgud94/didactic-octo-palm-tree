import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DashboardClient } from "@/app/components/dashboard/DashboardClient";
import { ScenarioPicker } from "@/app/components/dashboard/ScenarioPicker";
import { catalog } from "@/lib/data/catalog";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("dashboard UI", () => {
  it("renders the Korean work dashboard and changes scenario", () => {
    render(<DashboardClient />);
    expect(screen.getByRole("heading", { name: /투자조건에서 인허가 경로까지/ })).toBeInTheDocument();
    const scenario = screen.getByLabelText("검증 시나리오");
    fireEvent.change(scenario, { target: { value: "battery-offsite-chemical" } });
    expect(screen.getByText(/청주시 · 개별입지/)).toBeInTheDocument();
    expect(screen.getByText("공정안전보고서 작성·제출·심사")).toBeInTheDocument();
  });

  it("keeps the selected validation scenario visible when inputs are adjusted", () => {
    render(<DashboardClient />);
    const scenario = screen.getByLabelText("검증 시나리오") as HTMLSelectElement;
    fireEvent.change(scenario, { target: { value: "battery-offsite-chemical" } });

    fireEvent.click(screen.getByRole("button", { name: "증설" }));

    expect(scenario).toHaveValue("battery-offsite-chemical");
    expect(scenario.selectedOptions[0]).toHaveTextContent(
      "비산단 이차전지 공장 신설 · 1개 조건 조정됨",
    );

    fireEvent.change(scenario, { target: { value: "semiconductor-expansion-complex" } });
    expect(scenario).toHaveValue("semiconductor-expansion-complex");
    expect(scenario.selectedOptions[0]).toHaveTextContent("산단 내 반도체 공장 증설");
    expect(scenario.selectedOptions[0]).not.toHaveTextContent("조건 조정됨");
  });

  it("keeps the chosen baseline even when edited answers equal another preset", () => {
    render(
      <ScenarioPicker
        scenarios={catalog.scenarios}
        answers={catalog.scenarios[1].answers}
        selectedScenarioId={catalog.scenarios[0].id}
        onSelect={() => undefined}
      />,
    );

    const scenario = screen.getByLabelText("검증 시나리오") as HTMLSelectElement;
    expect(scenario).toHaveValue(catalog.scenarios[0].id);
    expect(scenario.selectedOptions[0]).toHaveTextContent("조건 조정됨");
  });

  it("restores an adjusted validation scenario from the share URL", async () => {
    const first = render(<DashboardClient />);
    await waitFor(() => {
      expect(window.location.search).toContain("sc=general-manufacturing-complex");
    });
    fireEvent.change(screen.getByLabelText("검증 시나리오"), {
      target: { value: "battery-offsite-chemical" },
    });
    fireEvent.click(screen.getByRole("button", { name: "증설" }));

    await waitFor(() => {
      expect(window.location.search).toContain("sc=battery-offsite-chemical");
    });
    first.unmount();

    render(<DashboardClient />);
    const restored = screen.getByLabelText("검증 시나리오") as HTMLSelectElement;
    await waitFor(() => {
      expect(restored).toHaveValue("battery-offsite-chemical");
      expect(restored.selectedOptions[0]).toHaveTextContent("1개 조건 조정됨");
    });
  });

  it("opens details and exposes an official source link", () => {
    render(<DashboardClient />);
    const card = screen.getByRole("button", { name: /산업단지 입주계약/ });
    fireEvent.click(card);
    expect(screen.getByRole("complementary", { name: /산업단지 입주계약 상세정보/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /원문 열기/ })[0]).toHaveAttribute("href", expect.stringMatching(/^https:\/\//));
  });

  it("offers all non-capital provinces and updates the editable locality", () => {
    render(<DashboardClient />);
    const province = screen.getByLabelText("시·도") as HTMLSelectElement;
    expect(province.options).toHaveLength(14);
    expect([...province.options].map((option) => option.value)).not.toContain("경기도");
    fireEvent.change(province, { target: { value: "부산광역시" } });
    expect(screen.getByLabelText("시·군·구")).toHaveValue("");
    expect(screen.getByText(/부산광역시 내 시·군·구 미확인/)).toBeInTheDocument();
  });

  it("switches to list, law, and gaps tabs", () => {
    render(<DashboardClient />);
    fireEvent.click(screen.getByRole("tab", { name: /절차 목록/ }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /근거 법령/ }));
    expect(screen.getAllByRole("link", { name: /공식 원문/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: /가정·미확인/ }));
    expect(screen.getByRole("heading", { name: "MVP 자동판정 범위 밖" })).toBeInTheDocument();
  });
});

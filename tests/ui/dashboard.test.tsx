import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardClient } from "@/app/components/dashboard/DashboardClient";

describe("dashboard UI", () => {
  it("renders the Korean work dashboard and changes scenario", () => {
    render(<DashboardClient />);
    expect(screen.getByRole("heading", { name: /투자조건에서 인허가 경로까지/ })).toBeInTheDocument();
    const scenario = screen.getByLabelText("검증 시나리오");
    fireEvent.change(scenario, { target: { value: "battery-offsite-chemical" } });
    expect(screen.getByText(/청주시 · 개별입지/)).toBeInTheDocument();
    expect(screen.getByText("공정안전보고서 작성·제출·심사")).toBeInTheDocument();
  });

  it("opens details and exposes an official source link", () => {
    render(<DashboardClient />);
    const card = screen.getByRole("button", { name: /산업단지 입주계약/ });
    fireEvent.click(card);
    expect(screen.getByRole("complementary", { name: /산업단지 입주계약 상세정보/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /원문 열기/ })[0]).toHaveAttribute("href", expect.stringMatching(/^https:\/\//));
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

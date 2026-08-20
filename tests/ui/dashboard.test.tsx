import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { DashboardClient } from "@/app/components/dashboard/DashboardClient";

const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  "showModal",
);
const originalClose = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  "close",
);

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});

afterAll(() => {
  if (originalShowModal) {
    Object.defineProperty(
      HTMLDialogElement.prototype,
      "showModal",
      originalShowModal,
    );
  } else {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  }
  if (originalClose) {
    Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  } else {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
  }
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("dashboard UI", () => {
  it("renders the project-input summary without validation presets", () => {
    render(<DashboardClient />);

    expect(screen.getByRole("heading", { name: "지방투자기업 인허가 로드맵" })).toBeInTheDocument();
    expect(screen.getByText("사업 조건별 절차 · 순서 · 소요기간")).toBeInTheDocument();
    expect(document.querySelector(".scope-card")).toBeNull();
    expect(screen.getByRole("heading", { name: "현재 사업조건" })).toBeInTheDocument();
    expect(screen.queryByText(/검증 시나리오|사용자 설정|조건 조정됨/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("시·도")).toHaveValue("");
    expect(screen.queryByText("청주시")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /총 소요기간 산정 불가 계산 경로 열기/ })).toHaveTextContent("산정 불가");
  });

  it("reflects every edited Project Input value directly in the summary", () => {
    render(<DashboardClient />);

    fireEvent.click(screen.getByRole("button", { name: "증설" }));
    const province = screen.getByLabelText("시·도") as HTMLSelectElement;
    fireEvent.change(province, { target: { value: "부산광역시" } });
    fireEvent.change(screen.getByLabelText("시·군·구"), { target: { value: "강서구" } });

    const summary = screen.getByRole("heading", { name: "현재 사업조건" }).closest("section");
    expect(summary).not.toBeNull();
    expect(within(summary!).getByText("증설")).toBeInTheDocument();
    expect(within(summary!).getByText("부산광역시")).toBeInTheDocument();
    expect(within(summary!).getByText("강서구")).toBeInTheDocument();
  });

  it("keeps the legal assessment date valid and reports a cleared required value", () => {
    render(<DashboardClient />);
    const assessmentDate = screen.getByLabelText("평가 기준일");
    const original = (assessmentDate as HTMLInputElement).value;

    expect(assessmentDate).toBeRequired();
    fireEvent.change(assessmentDate, { target: { value: "" } });

    expect(screen.getByRole("alert")).toHaveTextContent("평가 기준일은 비워둘 수 없습니다.");
    expect(assessmentDate).toHaveValue(original);
  });

  it("reflects the entered daily construction dates in the total-duration result", () => {
    render(<DashboardClient />);
    fireEvent.click(screen.getByRole("button", { name: /공사 일정/ }));

    const start = screen.getByLabelText("착공 예정일");
    const end = screen.getByLabelText("준공 예정일");
    expect(start).toHaveAttribute("min", "2025-01-01");
    fireEvent.change(start, { target: { value: "2027-06-15" } });
    fireEvent.change(end, { target: { value: "2030-05-20" } });

    const scheduleCard = screen.getByRole("button", { name: /총 소요기간 .* 계산 경로 열기/ });
    expect(scheduleCard).not.toBeNull();
    expect(scheduleCard).toHaveTextContent(/(?:년|개월|일)/);
    expect(scheduleCard).toHaveTextContent("총 소요기간");
    expect(screen.queryByText("확인된 일정 하한")).not.toBeInTheDocument();
    expect(screen.getByText(/공사 [\d,]+일/)).toBeInTheDocument();
  });

  it("offers only minimum and typical official schedule scenarios without user duration assumptions", () => {
    render(<DashboardClient />);
    const range = screen.getByLabelText("소요기간 기준");
    const minimum = within(range).getByRole("button", { name: "최소기간" });
    const typical = within(range).getByRole("button", { name: "통상" });

    expect(within(range).getAllByRole("button")).toEqual([minimum, typical]);
    expect(range.closest(".summary-schedule")).not.toBeNull();
    expect(document.querySelector(".tab-row .scenario-switch")).toBeNull();
    expect(typical).toHaveAttribute("aria-pressed", "true");
    expect(minimum).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(minimum);
    expect(minimum).toHaveAttribute("aria-pressed", "true");
    expect(typical).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: /공사 일정/ }));
    expect(screen.getByLabelText("착공 예정일")).toBeInTheDocument();
    expect(screen.getByLabelText("준공 예정일")).toBeInTheDocument();
    expect(screen.queryByLabelText(/계획기간/)).not.toBeInTheDocument();
    expect(screen.queryByText("일정 가정")).not.toBeInTheDocument();
  });

  it("opens the total-duration result as a simplified six-stage graphic and restores focus", async () => {
    render(<DashboardClient />);
    await waitFor(() => expect(window.location.search).toContain("v=7"));
    fireEvent.click(screen.getByRole("button", { name: /공사 일정/ }));
    fireEvent.change(screen.getByLabelText("착공 예정일"), { target: { value: "2027-01-01" } });
    fireEvent.change(screen.getByLabelText("준공 예정일"), { target: { value: "2028-12-31" } });

    const trigger = screen.getByRole("button", { name: /총 소요기간 .* 계산 경로 열기/ });
    await waitFor(() => expect(trigger).not.toHaveTextContent("산정 불가"));
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-controls", "total-duration-dialog");
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "총 소요기간 계산 경로" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const graphic = within(dialog).getByRole("list", { name: "전체 절차 6단계 그래픽" });
    expect(within(graphic).getAllByRole("listitem")).toHaveLength(6);
    expect(within(dialog).getByText("공장 건설")).toBeInTheDocument();
    const procedureIds = [...dialog.querySelectorAll("[data-procedure-id]")].map(
      (element) => element.getAttribute("data-procedure-id"),
    );
    expect(procedureIds.length).toBeGreaterThan(0);
    expect(new Set(procedureIds).size).toBe(procedureIds.length);

    fireEvent.click(within(dialog).getByRole("button", { name: "총 소요기간 닫기" }));
    expect(screen.queryByRole("dialog", { name: "총 소요기간 계산 경로" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("explains the missing dates inside the total-duration dialog", async () => {
    render(<DashboardClient />);
    const trigger = screen.getByRole("button", { name: /총 소요기간 산정 불가 계산 경로 열기/ });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "총 소요기간 계산 경로" });
    expect(within(dialog).getByText("공사 시작일과 준공일을 입력해 주세요.")).toBeInTheDocument();
  });

  it("opens each beginner-friendly status card as a dialog with the complete status list", async () => {
    render(<DashboardClient />);
    const summary = screen.getByLabelText("판정 요약");
    const labels = [
      "필수적으로 거쳐야 하는 절차",
      "대상 여부 확인이 필요한 절차",
      "거칠 필요가 없는 절차",
    ];

    for (const label of labels) {
      const trigger = within(summary).getByRole("button", {
        name: new RegExp(`^${label} \\d+개 목록 열기$`),
      });
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      expect(trigger).toHaveAttribute("aria-controls", "status-summary-dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }

    const trigger = within(summary).getByRole("button", {
      name: /^대상 여부 확인이 필요한 절차 \d+개 목록 열기$/,
    });
    const expectedCount = Number(
      trigger.getAttribute("aria-label")?.match(/(\d+)개/)?.[1],
    );
    expect(expectedCount).toBeGreaterThan(0);

    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", {
      name: new RegExp(`대상 여부 확인이 필요한 절차 ${expectedCount}개`),
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(expectedCount);
    expect(within(dialog).getByText(`${expectedCount}개 표시`)).toBeInTheDocument();
  });

  it("searches and closes a status-list dialog", async () => {
    render(<DashboardClient />);
    const trigger = screen.getByRole("button", {
      name: /^대상 여부 확인이 필요한 절차 \d+개 목록 열기$/,
    });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", {
      name: /대상 여부 확인이 필요한 절차 \d+개/,
    });
    const search = within(dialog).getByRole("searchbox", {
      name: "목록에서 절차 또는 기관 검색",
    });

    fireEvent.change(search, { target: { value: "존재하지않는절차명" } });
    expect(within(dialog).getByText("0개 표시")).toBeInTheDocument();
    expect(within(dialog).getByText("검색 결과가 없습니다.")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "목록 닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("restores edited inputs from the share URL without a scenario id", async () => {
    const first = render(<DashboardClient />);
    await waitFor(() => expect(window.location.search).toContain("v=7"));
    fireEvent.click(screen.getByRole("button", { name: "증설" }));

    await waitFor(() => {
      expect(window.location.search).toContain("it=EXPANSION");
      expect(window.location.search).toContain("v=7");
      expect(window.location.search).not.toContain("sc=");
    });
    first.unmount();

    render(<DashboardClient />);
    const summary = screen.getByRole("heading", { name: "현재 사업조건" }).closest("section");
    await waitFor(() => {
      expect(within(summary!).getByText("증설")).toBeInTheDocument();
    });
  });

  it("opens details and exposes an official source link", () => {
    render(<DashboardClient />);
    const card = screen.getByRole("button", { name: /건축허가·신고 경로 확인/ });
    fireEvent.click(card);
    const drawer = screen.getByRole("complementary", { name: /건축허가·신고 경로 확인 상세정보/ });
    expect(drawer).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /원문 열기/ })[0]).toHaveAttribute("href", expect.stringMatching(/^https:\/\//));
    expect(drawer).toHaveTextContent("업무일");
    expect(drawer).not.toHaveTextContent(/\b(?:HIGH|MEDIUM|LOW|UNVERIFIED|BUSINESS_DAY|MVP)\b/);
  });

  it("offers all non-capital provinces and updates the editable locality", () => {
    render(<DashboardClient />);
    const province = screen.getByLabelText("시·도") as HTMLSelectElement;
    expect(province.options).toHaveLength(15);
    expect(province.options[0]).toHaveTextContent("시·도 선택");
    expect([...province.options].map((option) => option.value)).not.toContain("경기도");
    fireEvent.change(province, { target: { value: "부산광역시" } });
    expect(screen.getByLabelText("시·군·구")).toHaveValue("");
    expect(screen.getAllByRole("link", { name: "부산광역시" })[0]).toHaveAttribute("href", expect.stringContaining("elis.go.kr"));
    expect(screen.getByText("시·군·구 미선택")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("시·군·구"), { target: { value: "강서구" } });
    expect(screen.getAllByRole("link", { name: "강서구" })[0]).toHaveAttribute("href", expect.stringContaining("ctpvCd=26"));
    expect(screen.getByRole("heading", { name: "광역·기초 자치법규 확인" })).toBeInTheDocument();
  });

  it("links a matched local review category to the actual ordinance detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        checkedAt: "2026-08-21T00:00:00.000Z",
        source: "행정안전부 자치법규정보시스템(ELIS)",
        mode: "LIVE",
        categories: [
          {
            categoryId: "urban-planning-development",
            ordinances: [
              {
                name: "아산시 도시계획 조례",
                level: "MUNICIPALITY",
                jurisdictionName: "아산시",
                amendmentDate: "2026-08-18",
                url: "https://www.elis.go.kr/alrpop/alrDtlsPop?alrNo=44200123456789&histNo=003",
              },
            ],
          },
        ],
      }),
    } as Response);

    render(<DashboardClient />);
    fireEvent.change(screen.getByLabelText("시·도"), { target: { value: "충청남도" } });
    fireEvent.change(screen.getByLabelText("시·군·구"), { target: { value: "아산시" } });

    const detailLink = await screen.findByRole("link", { name: /아산시 도시계획 조례/ });
    expect(detailLink).toHaveAttribute("href", expect.stringContaining("elis.go.kr/alrpop/alrDtlsPop"));
    expect(detailLink).toHaveAttribute("href", expect.stringContaining("alrNo=44200123456789"));
    expect(detailLink).toHaveAttribute("href", expect.stringContaining("histNo=003"));
    expect(detailLink).not.toHaveAttribute("href", expect.stringContaining("/locgovAlrPopup"));
    expect(detailLink).not.toHaveAttribute("href", expect.stringContaining("OC="));
  });

  it("rejects a non-detail ELIS URL supplied by the lookup response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        checkedAt: "2026-08-21T00:00:00.000Z",
        source: "행정안전부 자치법규정보시스템(ELIS)",
        mode: "LIVE",
        categories: [
          {
            categoryId: "urban-planning-development",
            ordinances: [
              {
                name: "아산시 자치법규 전체 목록",
                level: "MUNICIPALITY",
                jurisdictionName: "아산시",
                url: "https://www.elis.go.kr/alrpop/locgovAlrPopup?ctpvCd=44&sggCd=200",
              },
            ],
          },
        ],
      }),
    } as Response);

    render(<DashboardClient />);
    fireEvent.change(screen.getByLabelText("시·도"), { target: { value: "충청남도" } });
    fireEvent.change(screen.getByLabelText("시·군·구"), { target: { value: "아산시" } });

    const urbanCard = screen
      .getByRole("heading", { name: "도시계획·개발행위 기준" })
      .closest("article");
    expect(urbanCard).not.toBeNull();
    await waitFor(() => {
      expect(within(urbanCard!).queryByRole("link")).not.toBeInTheDocument();
      expect(
        within(urbanCard!).getByText(/현행 조례 원문을 자동 확인하지 못했습니다/),
      ).toBeInTheDocument();
    });
  });

  it("does not present a broad ELIS list as if it were a matched ordinance", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("live ordinance lookup unavailable"),
    );

    render(<DashboardClient />);
    await waitFor(() => expect(window.location.search).toContain("v=7"));
    fireEvent.change(screen.getByLabelText("시·도"), {
      target: { value: "충청남도" },
    });
    fireEvent.change(screen.getByLabelText("시·군·구"), {
      target: { value: "아산시" },
    });

    const urbanCard = screen
      .getByRole("heading", { name: "도시계획·개발행위 기준" })
      .closest("article");
    expect(urbanCard).not.toBeNull();
    await waitFor(() => {
      expect(within(urbanCard!).queryByRole("link")).not.toBeInTheDocument();
      expect(
        within(urbanCard!).getByText(/상단 지역명에서 현행 목록을 확인/),
      ).toBeInTheDocument();
    });

    expect(screen.getAllByRole("link", { name: "충청남도" })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("ctpvCd=44&sggCd=000"),
    );
    expect(screen.getAllByRole("link", { name: "아산시" })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("ctpvCd=44&sggCd=200"),
    );

    const trafficCard = screen
      .getByRole("heading", { name: "교통영향평가 지역기준" })
      .closest("article");
    expect(trafficCard).not.toBeNull();
    expect(within(trafficCard!).queryByRole("link")).not.toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText("ELIS 상세 원문 조회 지연 · 상단 지역명에서 현행 목록 확인"),
      ).toBeInTheDocument(),
    );
  });

  it("uses the reviewed Muju ELIS detail snapshot when the static site has no API route", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("GitHub Pages has no API route"),
    );

    render(<DashboardClient />);
    await waitFor(() => expect(window.location.search).toContain("v=7"));
    fireEvent.change(screen.getByLabelText("시·도"), {
      target: { value: "전북특별자치도" },
    });
    fireEvent.change(screen.getByLabelText("시·군·구"), {
      target: { value: "무주군" },
    });

    const sewerCard = screen
      .getByRole("heading", { name: "하수도 연결·원인자부담금" })
      .closest("article");
    expect(sewerCard).not.toBeNull();
    const detailLink = await within(sewerCard!).findByRole("link", {
      name: /무주군 하수도 사용 조례/,
    });
    expect(detailLink).toHaveAttribute(
      "href",
      "https://www.elis.go.kr/alrpop/alrDtlsPop?alrNo=52730129348001&histNo=006",
    );
    expect(detailLink).not.toHaveAttribute(
      "href",
      expect.stringContaining("locgovAlrPopup"),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/검증된 ELIS 상세 원문 저장본/),
      ).toBeInTheDocument(),
    );
  });

  it("applies an editable industry profile without treating the industry as a final permit ruling", () => {
    render(<DashboardClient />);
    fireEvent.change(screen.getByLabelText("업종·주요 공정"), {
      target: { value: "CHEMICAL_PRODUCTS" },
    });

    expect(document.querySelector('[data-input-key="industryCategory"]')).toHaveTextContent("화학물질·화학제품");
    expect(document.querySelector('[data-input-key="chemicalsHandled"]')).toHaveTextContent("예");
    expect(screen.getByText(/법적 대상 확정이 아니므로/)).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("navigation", { name: "입력 단계" })).getByRole("button", { name: /^3 환경·안전/ }));
    const chemicalQuestion = screen.getByText("화학물질 취급 여부", { selector: "legend" }).closest("fieldset");
    expect(chemicalQuestion).not.toBeNull();
    fireEvent.click(within(chemicalQuestion!).getByRole("button", { name: "없음" }));
    expect(document.querySelector('[data-input-key="chemicalsHandled"]')).toHaveTextContent("아니오");
  });

  it("uses named flow phases instead of numbered progress bundles", () => {
    render(<DashboardClient />);
    expect(screen.queryByText(/진행 묶음/)).not.toBeInTheDocument();
    const phaseRoute = screen.getByRole("list", { name: "사업 단계" });
    expect(within(phaseRoute).getAllByRole("listitem")).toHaveLength(6);
    expect(within(phaseRoute).getByText("입지 사전검토")).toBeInTheDocument();
    expect(within(phaseRoute).getByText("계획 승인·입주")).toBeInTheDocument();
    expect(within(phaseRoute).getByText("착공 준비")).toBeInTheDocument();
    expect(within(phaseRoute).getByText("공사 중")).toBeInTheDocument();
    expect(within(phaseRoute).getByText("준공·가동 준비")).toBeInTheDocument();
    expect(within(phaseRoute).getByText("가동 이후")).toBeInTheDocument();
  });

  it("switches to the procedure, law, schedule, and review tabs", () => {
    render(<DashboardClient />);
    fireEvent.click(screen.getByRole("tab", { name: /전체 절차/ }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /법령 근거/ }));
    expect(screen.getAllByRole("link", { name: /공식 원문/ }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^(?:ACT|ENFORCEMENT_DECREE|ENFORCEMENT_RULE|AUTHORITATIVE|STALE|UNVERIFIED)$/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /사업 일정/ }));
    expect(screen.getByText(/공사 시작일과 준공일을 입력/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /확인 필요/ }));
    expect(screen.getByRole("heading", { name: "현재 데이터에 포함되지 않은 항목" })).toBeInTheDocument();
  });
});

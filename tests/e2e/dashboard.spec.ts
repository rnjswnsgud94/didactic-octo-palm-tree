import { expect, test } from "@playwright/test";

test("wizard changes the route and detail links are official", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "지역투자 인허가 로드맵" })).toBeVisible();
  await page.getByRole("button", { name: "개별입지" }).click();
  await expect(page.getByText(/지역 미입력 · 개별입지/)).toBeVisible();
  await page.getByRole("button", { name: /공장설립·증설·업종변경 승인/ }).click();
  await expect(page.getByRole("complementary", { name: /공장설립·증설·업종변경 승인 상세정보/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /원문 열기/ }).first()).toHaveAttribute("href", /^https:\/\//);
});

test("AI data-center special-law selection is reflected in the result and share URL", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("업종·주요 공정").selectOption("AI_DATA_CENTER");
  await expect(page.getByRole("heading", { name: "AI 데이터센터 특별법 적용" })).toBeVisible();

  await page.getByRole("button", { name: "요건 확인" }).click();
  await page.getByRole("checkbox", { name: /인허가 일괄처리/ }).check();
  await page.getByLabel("평가 기준일").fill("2027-04-01");

  await expect(page.getByText("선택 반영")).toBeVisible();
  await expect(page.getByText(/일괄처리는 면제가 아니며/)).toBeVisible();
  await expect(page).toHaveURL(/ind=AI_DATA_CENTER/);
  await expect(page).toHaveURL(/sl=AIDC_ONE_STOP/);
  await expect(page).toHaveURL(/aic=1/);
  await expect(page).toHaveURL(/aos=PLANNED/);
});

test("share URL restores state and tabs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "증설" }).click();
  await page.getByRole("tab", { name: /확인 필요/ }).click();
  await expect(page).toHaveURL(/tab=GAPS/);
  const url = page.url();
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "판정에 필요한 추가 정보" })).toBeVisible();
  await expect(page.getByText("증설")).toBeVisible();
});

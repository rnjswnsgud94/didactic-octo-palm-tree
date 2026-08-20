import { expect, test } from "@playwright/test";

test("wizard changes the route and detail links are official", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /투자조건에서 인허가 경로까지/ })).toBeVisible();
  await page.getByLabel("검증 시나리오").selectOption("battery-offsite-chemical");
  await expect(page.getByText(/청주시 · 개별입지/)).toBeVisible();
  await page.getByRole("button", { name: /공장설립·증설·업종변경 승인/ }).click();
  await expect(page.getByRole("complementary", { name: /공장설립·증설·업종변경 승인 상세정보/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /원문 열기/ }).first()).toHaveAttribute("href", /^https:\/\//);
});

test("share URL restores state and tabs", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("검증 시나리오").selectOption("insufficient-inputs");
  await page.getByRole("tab", { name: /가정·미확인/ }).click();
  await expect(page).toHaveURL(/tab=GAPS/);
  const url = page.url();
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "현재 시나리오의 추가 확인사항" })).toBeVisible();
});

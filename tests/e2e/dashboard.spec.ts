import { expect, test } from "@playwright/test";

test("wizard changes the route and detail links are official", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /사업 조건에 맞는 절차와/ })).toBeVisible();
  await page.getByRole("button", { name: "개별입지" }).click();
  await expect(page.getByText(/청주시 · 개별입지/)).toBeVisible();
  await page.getByRole("button", { name: /공장설립·증설·업종변경 승인/ }).click();
  await expect(page.getByRole("complementary", { name: /공장설립·증설·업종변경 승인 상세정보/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /원문 열기/ }).first()).toHaveAttribute("href", /^https:\/\//);
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

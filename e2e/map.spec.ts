import { expect, test } from "@playwright/test";

test("full city map renders with HUD and no page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#map");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("MAYOR OF THE LAKE")).toBeVisible();
  await expect(page.getByText("73,637")).toBeVisible();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "test-results/map-full.png" });
  expect(errors).toEqual([]);
});

test("front page shows the orbiting city behind the menu", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mayor of the Lake" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 90_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "test-results/front.png" });
  expect(errors).toEqual([]);
});

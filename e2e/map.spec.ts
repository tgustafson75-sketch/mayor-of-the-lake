import { expect, test } from "@playwright/test";

test("3D map renders real-data city", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#map");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "test-results/map.png" });
  expect(errors).toEqual([]);
});

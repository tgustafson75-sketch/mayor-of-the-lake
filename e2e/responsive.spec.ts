import { expect, test } from "@playwright/test";

test.describe("desktop map HUD", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test("camera presets are clickable and report their state", async ({ page }) => {
    await page.goto("/#map");
    await expect(page.getByRole("region", { name: "Talk to council" })).toBeVisible({ timeout: 90_000 });
    for (const name of ["Street", "Lake", "Planner", "Free", "City"]) {
      const btn = page.getByRole("button", { name, exact: true });
      await btn.click();
      await expect(btn).toHaveAttribute("aria-pressed", "true");
    }
  });
});


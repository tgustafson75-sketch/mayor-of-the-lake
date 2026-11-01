import { devices, expect, test } from "@playwright/test";

// Device settings must be top-level in the file, so the phone test lives on its own.
const { defaultBrowserType: _browser, ...iphone } = devices["iPhone 13"];
test.use(iphone);

test("phone: bottom dock opens each tool sheet, and the sheet's controls are clickable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#map");
  const dock = page.getByRole("toolbar", { name: "Map tools" });
  await expect(dock).toBeVisible({ timeout: 90_000 });
  await dock.getByRole("button", { name: "Camera" }).click();
  await page.getByRole("dialog", { name: "camera" }).getByRole("button", { name: "Lake", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lake", exact: true })).toHaveAttribute("aria-pressed", "true");
  await dock.getByRole("button", { name: "Time" }).click();
  await expect(page.getByRole("dialog", { name: "time" }).getByRole("group", { name: "Time controls" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("phone: the main menu link is reachable on the map and returns to the menu", async ({ page }) => {
  await page.goto("/#map");
  const back = page.getByRole("link", { name: "← Main menu" });
  await expect(back).toBeVisible({ timeout: 90_000 });
  await back.click();
  await expect(page.getByRole("navigation", { name: "Main menu" })).toBeVisible();
});

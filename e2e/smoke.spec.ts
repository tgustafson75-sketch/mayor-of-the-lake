import { expect, test } from "@playwright/test";

test("main menu renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mayor of the Lake" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New Life" })).toBeDisabled();
});

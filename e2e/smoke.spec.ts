import { expect, test } from "@playwright/test";

test("main menu renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: "Mayor of the Lake" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main menu" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New Life" })).toHaveAttribute("href", "#life");
});

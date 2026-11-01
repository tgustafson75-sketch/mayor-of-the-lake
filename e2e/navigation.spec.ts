import { expect, test } from "@playwright/test";

const logo = (page: import("@playwright/test").Page) => page.getByRole("img", { name: "Mayor of the Lake" });
const mapReady = (page: import("@playwright/test").Page) =>
  expect(page.getByRole("toolbar", { name: "Map tools" }).or(page.getByRole("region", { name: "Talk to council" })).first()).toBeVisible({ timeout: 90_000 });

test("you can go from the menu to the map and back, and browser back and forward work", async ({ page }) => {
  await page.goto("/");
  await expect(logo(page)).toBeVisible();

  await page.getByRole("link", { name: "Open the 3D city" }).click();
  await mapReady(page);
  expect(page.url()).toContain("#map");

  await page.getByRole("link", { name: "← Main menu" }).first().click();
  await expect(logo(page)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main menu" })).toBeVisible();

  await page.goBack();
  await mapReady(page);
  await page.goForward();
  await expect(logo(page)).toBeVisible();
});

test("a deep link opens the map directly, and an unknown address shows the menu", async ({ page }) => {
  await page.goto("/#map");
  await mapReady(page);
  await page.goto("/#not-a-screen");
  await expect(logo(page)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main menu" })).toBeVisible();
});

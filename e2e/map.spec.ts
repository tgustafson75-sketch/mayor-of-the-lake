import { expect, test } from "@playwright/test";

test("full city map renders with HUD and no page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#map");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByAltText("Mayor of the Lake")).toBeVisible();
  await expect(page.getByText("73,637")).toBeVisible();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "test-results/map-full.png" });
  expect(errors).toEqual([]);
});

test("front page shows the photoreal hero behind the menu", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("img", { name: "Mayor of the Lake" })).toBeVisible();
  const hero = page.getByAltText("Aerial view of Lake Elsinore at golden hour");
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("council talk panel is on the map and reports a missing server clearly", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#map");
  await expect(page.getByRole("region", { name: "Talk to council" })).toBeVisible({ timeout: 90_000 });
  await page.getByLabel("What you say").fill("Back the plan");
  await page.getByRole("button", { name: "Say it" }).click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});

test("the map extends past the city and a parcel can be selected", async ({ page }) => {
  await page.goto("/#map");
  await expect(page.getByRole("toolbar", { name: "Map tools" }).or(page.getByRole("region", { name: "Talk to council" })).first()).toBeVisible({ timeout: 90_000 });
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(12000); // let the terrain load before clicking
  // Raw mouse clicks on the terrain (the HUD sits over the corners, so no locator actionability check).
  await page.mouse.click(640, 420);
  await page.waitForTimeout(500);
  await page.mouse.click(520, 430);
  await expect(page.getByRole("region", { name: "Selected parcel" })).toBeVisible({ timeout: 10000 });
});

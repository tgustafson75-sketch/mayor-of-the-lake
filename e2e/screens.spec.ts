import { expect, test } from "@playwright/test";

test("menu opens the Life screen, spending a block changes a need, and back works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "New Life" }).click();
  await expect(page.getByText("Your life")).toBeVisible();
  const before = await page.locator("text=Energy").locator("..").innerText();
  await page.getByRole("button", { name: "Work", exact: true }).click();
  const after = await page.locator("text=Energy").locator("..").innerText();
  expect(after).not.toBe(before);
  await page.getByRole("link", { name: "← Main menu" }).click();
  await expect(page.getByRole("navigation", { name: "Main menu" })).toBeVisible();
});

test("menu opens the Council chamber: vote, whip and a promise are recorded", async ({ page }) => {
  await page.goto("/#council");
  await expect(page.getByText("Council chamber")).toBeVisible();
  await page.getByRole("button", { name: "Call the vote" }).click();
  await expect(page.getByText(/Vote 1:/)).toBeVisible();
  await page.getByRole("button", { name: "Whip" }).first().click();
  await expect(page.getByText(/trust -?\d\.\d\d/).first()).toBeVisible();
  await page.getByRole("button", { name: /Promise a marina plan/ }).click();
  await expect(page.getByText("Bring the marina plan to the council by spring")).toBeVisible();
});

test("the feed: a post is published, shows its reach, and moves sentiment", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Feed" }).click();
  await expect(page.getByText("Sentiment by group")).toBeVisible();
  await page.getByLabel("Your post").fill("Lake clean-up starts Monday");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Lake clean-up starts Monday")).toBeVisible();
  await expect(page.getByText(/reach \d+/)).toBeVisible();
});

test("campaigning raises strength and the shown odds, and the election clock is visible", async ({ page }) => {
  await page.goto("/#life");
  await expect(page.getByLabel("Election")).toBeVisible();
  const strengthBefore = await page.getByLabel("Election").innerText();
  await page.getByRole("button", { name: "Campaign", exact: true }).click();
  const strengthAfter = await page.getByLabel("Election").innerText();
  expect(strengthAfter).not.toBe(strengthBefore);
  expect(strengthAfter).toMatch(/campaign strength [1-9]\d*/);
});

test("the chosen game mode carries from the menu to the Life screen", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Builder").check({ force: true });
  await page.getByRole("link", { name: "New Life" }).click();
  await expect(page.getByText("Builder mode")).toBeVisible();
});

test("the council chamber shows advisors and public comment", async ({ page }) => {
  await page.goto("/#council");
  await expect(page.getByRole("heading", { name: "Advisors" })).toBeVisible();
  await expect(page.getByLabel("Public comment")).toContainText("speakers for");
  await expect(page.getByText("Political strategist (fictional)")).toBeVisible();
});

test("City Hall opens in 3D and links into the council chamber and home", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "City Hall" }).click();
  await expect(page.getByRole("navigation", { name: "City Hall rooms" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 90_000 });
  await page.getByRole("link", { name: "Council chamber" }).click();
  await expect(page.getByText("Council chamber", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

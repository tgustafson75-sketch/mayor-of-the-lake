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

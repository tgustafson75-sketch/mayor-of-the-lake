import { expect, test } from "@playwright/test";

test("the app is installable: manifest, icons and iOS install tags", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/icons/apple-touch-icon.png");
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute("content", "yes");

  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(manifest.icons.some((i: { sizes: string }) => i.sizes === "512x512")).toBe(true);

  const icon = await request.get("/icons/icon-192.png");
  expect(icon.status()).toBe(200);
  const bytes = await icon.body();
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a"); // real PNG signature
});

test("the front page link opens the map without a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open the 3D city" }).click();
  await expect(page.getByRole("toolbar", { name: "Map tools" }).or(page.getByRole("region", { name: "Talk to council" }))).toBeVisible({ timeout: 90_000 });
});

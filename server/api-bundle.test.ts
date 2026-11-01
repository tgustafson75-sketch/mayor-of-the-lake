import { describe, expect, it } from "vitest";

// Regression: the deployed function must export named HTTP methods (a default
// export that returns a Response made Vercel hang). This loads the bundle that ships.
describe("Vercel talk function bundle", () => {
  it("exports named methods, and answers a bad request quickly with 400", async () => {
    process.env.GEMINI_API_KEY ??= "test-key-not-used-for-400";
    const mod = (await import("../api/[...route].js")) as Record<string, unknown>;
    expect(typeof mod.POST).toBe("function");
    expect(typeof mod.GET).toBe("function");
    const res = await (mod.POST as (r: Request) => Promise<Response>)(
      new Request("https://x/api/talk", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }),
    );
    expect(res.status).toBe(400);
  });
});

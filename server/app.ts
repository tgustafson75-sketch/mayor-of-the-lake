import { Hono } from "hono";

// Builds the HTTP app without starting a listener, so tests can call it directly.
export function createApp() {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, ai: "stub" }));

  return app;
}

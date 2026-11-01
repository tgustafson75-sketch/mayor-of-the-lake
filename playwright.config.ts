import { defineConfig } from "@playwright/test";

// Own port, never reused: another local dev server on 5173 (e.g. Save the AMX)
// must not be mistaken for this app.
const PORT = 5183;

export default defineConfig({
  testDir: "e2e",
  // WebGL pages are heavy; parallel workers hit screenshot protocol errors.
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
});

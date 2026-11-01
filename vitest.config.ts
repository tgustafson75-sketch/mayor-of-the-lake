import { defineConfig } from "vitest/config";

// Unit tests for the sim, the AI package and the server. The browser smoke
// test lives in e2e/ and runs under Playwright instead.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "packages/**/*.test.ts", "server/**/*.test.ts"],
  },
});

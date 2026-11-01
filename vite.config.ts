import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The map scene is three.js, which is large by nature. Gzipped it is about 240 kB.
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    strictPort: true,
    // The game server (npm run server) handles /api, so the browser never sees a key.
    proxy: { "/api": "http://localhost:8787" },
  },
});

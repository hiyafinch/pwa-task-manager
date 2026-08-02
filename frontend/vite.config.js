// Generated with Claude Code - CS 3660 Sprint 3
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/auth": "http://localhost:3000",
      "/health": "http://localhost:3000",
      "/.well-known": "http://localhost:3000",
    },
  },
});

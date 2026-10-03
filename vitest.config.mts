import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // "server-only" throws outside a React Server environment; tests import server modules directly.
    alias: { "server-only": new URL("./tests/unit/empty-module.ts", import.meta.url).pathname },
  },
});

import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/helpers/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // The dashboard exercises the full 124-procedure catalog in one DOM. Keep
    // interaction regressions strict while allowing slower shared CI runners.
    testTimeout: 10_000,
    coverage: {
      reporter: ["text", "json-summary"],
      include: ["lib/**/*.ts", "app/components/dashboard/**/*.tsx"],
    },
  },
});

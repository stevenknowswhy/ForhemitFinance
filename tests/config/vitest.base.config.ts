/**
 * Base Vitest Configuration
 * Shared configuration for all Vitest test suites
 * Package-specific configs should extend this
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.config.ts",
        "**/_generated/**",
      ],
    },
    include: ["**/*.test.ts", "**/*.spec.ts"],
    exclude: ["node_modules/", "dist/", "tests/archive/**"],
  },
});


import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(rootDir, "tests/setup.ts")],
    testTimeout: 10000,
    include: [
      path.resolve(rootDir, "tests/**/*.{test,spec}.{ts,tsx}"),
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/packages/**",
      "**/tests/e2e/**", // Exclude Playwright e2e tests
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@testing-library/react": path.resolve(__dirname, "node_modules/@testing-library/react"),
      "@testing-library/jest-dom": path.resolve(__dirname, "node_modules/@testing-library/jest-dom"),
    },
  },
});

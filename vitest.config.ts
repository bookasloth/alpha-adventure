import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration tests hit the live DB with the service-role key — run them
    // explicitly via `npm run test:integration`, never in the default/CI unit run.
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    testTimeout: 30000,
  },
});

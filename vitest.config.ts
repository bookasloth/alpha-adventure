import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // Next resolves `server-only` to an empty module via the react-server
      // export condition; vitest (plain node) can't, so stub it for tests.
      "server-only": fileURLToPath(new URL("./src/test/server-only-shim.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration tests hit the live DB with the service-role key — run them
    // explicitly via `npm run test:integration`, never in the default/CI unit run.
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    testTimeout: 30000,
  },
});

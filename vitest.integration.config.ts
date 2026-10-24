import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Integration tests — hit the live Supabase DB using the service-role key from
// .env.local. Run explicitly: `npm run test:integration`. Never in CI.
export default defineConfig({
  resolve: {
    alias: {
      // Match the `@/` path alias used across src (Next resolves it via tsconfig
      // paths; plain-node vitest needs it declared here).
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Next resolves `server-only` to an empty module via the react-server
      // export condition; vitest (plain node) can't, so stub it for tests.
      "server-only": fileURLToPath(new URL("./src/test/server-only-shim.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 40000,
    hookTimeout: 40000,
    fileParallelism: false,
  },
});

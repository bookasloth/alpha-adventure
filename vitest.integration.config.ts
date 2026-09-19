import { defineConfig } from "vitest/config";

// Integration tests — hit the live Supabase DB using the service-role key from
// .env.local. Run explicitly: `npm run test:integration`. Never in CI.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 40000,
    hookTimeout: 40000,
    fileParallelism: false,
  },
});

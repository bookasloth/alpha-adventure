// Test-only stub for the `server-only` package. Next.js resolves `server-only`
// via the "react-server" export condition (an empty module) in server
// components, but plain-node vitest has no such condition and fails to resolve
// the bare specifier. vitest.config.ts aliases `server-only` here so modules
// guarded with `import "server-only"` can be unit-tested. No runtime effect.
export {};

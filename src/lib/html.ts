// Escape user- or catalog-supplied text before it lands in HTML (email bodies,
// injected strings). Cheap guard against markup/stored-XSS as more fields become
// DB-editable. Pure + framework-free so it's unit-testable.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

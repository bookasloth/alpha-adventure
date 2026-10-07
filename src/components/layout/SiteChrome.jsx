// Renders the site chrome around (site)-group routes. Auth + admin live outside
// this group (app/ root, Tailwind-only) and never reach here, so there is no
// per-path bare/full branch — chrome always wraps its children.
export default function SiteChrome({ header, footer, children }) {
  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}

import NotFoundContent from "@/components/NotFoundContent";

// Bare 404 for routes outside the (site) group (admin, auth). Site URLs get
// (site)/not-found.jsx, which renders the same body inside header/footer.
export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <NotFoundContent />;
}

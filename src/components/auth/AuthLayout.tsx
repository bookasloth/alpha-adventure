import Link from "next/link";

// Split-screen auth shell (form left, branded dark panel right) in the site
// theme. Shared by login / signup / forgot-password.
function Mark() {
  return (
    <span className="inline-flex items-center gap-2 text-white">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M3 20L9 8l4 7 2-3 6 8z" fill="#fe5100" /><path d="M9 8l4 7-2.4 5H3z" fill="#ff8a4d" /><circle cx="17" cy="6" r="2.2" fill="#FFB52A" /></svg>
      <span className="text-lg font-bold tracking-tight">Alpha Adventures</span>
    </span>
  );
}

function RightPanel() {
  const stats = [
    { n: "50+", l: "Treks" },
    { n: "12", l: "Regions" },
    { n: "5,000+", l: "Trekkers" },
  ];
  return (
    <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-14"
      style={{ backgroundImage: "radial-gradient(700px 400px at 90% -10%, rgba(254,81,0,.22), transparent 60%), radial-gradient(500px 300px at 0% 110%, rgba(255,181,42,.12), transparent 60%)" }}>
      <Mark />
      <div className="max-w-lg">
        <h2 className="text-5xl font-extrabold leading-tight text-white">Welcome to the trail<span className="text-primary">.</span></h2>
        <p className="mt-5 text-lg text-white/70">Book Sahyadri treks, manage your journeys, and keep the mountain spirit alive with <span className="text-primary">Alpha Adventures</span>.</p>
        <div className="mt-8 flex gap-3">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl2 border border-white/10 bg-white/5 px-5 py-4">
              <div className="text-2xl font-bold text-white">{s.n}</div>
              <div className="text-sm text-white/60">{s.l}</div>
            </div>
          ))}
        </div>
        <blockquote className="mt-10 border-l-2 border-primary pl-5">
          <p className="text-lg font-medium text-white">&ldquo;Every batch felt like family by the summit. Alpha made my first trek unforgettable.&rdquo;</p>
          <footer className="mt-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/20 font-bold text-primary">RS</span>
            <span className="text-sm text-white/70"><b className="text-white">Riya Sharma</b><br />Kalsubai Trek, 2025</span>
          </footer>
        </blockquote>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-white/60">
        <Link href="/about-us" className="hover:text-white">About</Link>
        <Link href="/contact" className="hover:text-white">Contact</Link>
        <Link href="/gallery" className="hover:text-white">Gallery</Link>
        <span className="ml-auto text-white/40">© {new Date().getFullYear()} Alpha Adventures · Nagpur</span>
      </div>
    </div>
  );
}

export default function AuthLayout({ topRight, children }: { topRight?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-0px)] bg-white lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-end gap-3">{topRight}</div>
        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-xs text-gray-400">All rights reserved © Handcrafted by the team at Alpha Adventures.</p>
      </div>
      <RightPanel />
    </div>
  );
}

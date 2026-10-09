import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

// Mirrors AdminShell's frame (icon rail, secondary nav, header) and the
// Overview tab (KPI row, chart cards) so the swap to real content doesn't shift.
export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <nav className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-line bg-ink py-4">
        <div className="mb-3 h-10 w-10 rounded-xl2 bg-primary" />
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-11 w-11 rounded-xl2 bg-white/5" />)}
      </nav>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-white sm:flex">
        <div className="flex h-16 items-center px-5"><Skeleton className="h-5 w-24" /></div>
        <div className="space-y-2 px-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-5">
          <div className="h-9 max-w-md flex-1 rounded-lg border border-line bg-slate-50" />
        </header>
        <main className="flex-1 overflow-hidden p-6">
          <SkeletonGroup label="Loading dashboard">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[106px] rounded-xl2" />)}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-[330px] rounded-xl2 lg:col-span-2" />
              <Skeleton className="h-[330px] rounded-xl2" />
            </div>
          </SkeletonGroup>
        </main>
      </div>
    </div>
  );
}

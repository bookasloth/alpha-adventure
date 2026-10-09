import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

// Mirrors Dashboard.tsx: full-width container, 256px sidebar on lg, then the
// Overview tab (title, 3 stat cards, recent-bookings table) — no layout jump
// when the real page streams in.
export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-page">
      <SkeletonGroup label="Loading your dashboard" className="container-px flex gap-6 py-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="rounded-xl2 border border-line/70 bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center gap-3 border-b border-line/70 pb-4">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div>
            </div>
            <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-6">
          <div className="flex gap-2 lg:hidden">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}</div>
          <Skeleton className="h-8 w-56" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl2 border border-line/70 bg-white p-5 shadow-soft">
                <Skeleton className="h-12 w-12 rounded-xl2" />
                <div className="space-y-2"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-7 w-16" /></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl2 border border-line/70 bg-white shadow-soft">
            <div className="p-5"><Skeleton className="h-6 w-40" /></div>
            <div className="space-y-3 px-5 pb-5">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          </div>
        </main>
      </SkeletonGroup>
    </div>
  );
}

import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

// Admin create/edit forms (treks, tours, gallery, testimonials). Matches the
// forms' max-w-3xl column: back button + title row, then field cards.
// The dashboard has its own shell-shaped skeleton in (dashboard)/loading.tsx.
export default function Loading() {
  return (
    <div className="min-h-screen bg-page">
      <SkeletonGroup label="Loading form" className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-64" /></div>
          <Skeleton className="ml-auto h-9 w-32 rounded-[10px]" />
        </div>
        {[4, 3].map((rows, c) => (
          <div key={c} className="space-y-4 rounded-xl2 border border-line/70 bg-white p-5 shadow-soft">
            <Skeleton className="h-6 w-28" />
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="space-y-1.5"><Skeleton className="h-3.5 w-20" /><Skeleton className="h-10 w-full rounded-lg" /></div>
            ))}
          </div>
        ))}
      </SkeletonGroup>
    </div>
  );
}

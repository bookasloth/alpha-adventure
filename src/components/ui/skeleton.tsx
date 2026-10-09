import { cn } from "@/lib/utils";

// Placeholder block. Size it like the content it stands in for (see the
// loading.tsx files). Pulse is disabled under prefers-reduced-motion.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-slate-200/80 motion-reduce:animate-none", className)} />;
}

// Wrap a group of skeletons: hidden for the first 150ms, then fades in, so a
// fast response never flashes a placeholder.
export function SkeletonGroup({ className, children, label = "Loading" }: { className?: string; children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-busy="true" className={cn("animate-appear", className)}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

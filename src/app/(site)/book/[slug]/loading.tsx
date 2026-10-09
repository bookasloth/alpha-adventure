import "./booking.css";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

// Built from the booking flow's own bk-* layout classes (1180px wrap, brand
// row, 5-step stepper, 1fr/380px split with the summary first on mobile), so
// the checkout appears in place instead of jumping.
export default function Loading() {
  return (
    <div className="bk-root">
      <SkeletonGroup label="Loading checkout" className="bk-wrap">
        <div className="bk-top"><Skeleton className="h-5 w-28" /></div>
        <div className="bk-brand">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-2"><Skeleton className="h-6 w-56" /><Skeleton className="h-4 w-40" /></div>
        </div>
        <div className="bk-stepper">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="bk-node"><Skeleton className="mx-auto h-[34px] w-[34px] rounded-full" /><Skeleton className="mx-auto mt-2 h-3.5 w-16" /></div>
          ))}
        </div>
        <div className="bk-split">
          <div className="bk-card bk-panel">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-64" />
            <Skeleton className="mb-6 mt-2 h-4 w-80 max-w-full" />
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="mb-3 h-[74px] w-full rounded-[14px]" />)}
          </div>
          <div className="bk-aside bk-card p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
            <Skeleton className="mt-6 h-12 w-full rounded-[10px]" />
          </div>
        </div>
      </SkeletonGroup>
    </div>
  );
}

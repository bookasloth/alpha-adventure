// Route skeleton shown while the booking flow streams (audit §3.5).
export default function Loading() {
  return (
    <div className="container-px mx-auto max-w-5xl py-10 animate-pulse" aria-hidden="true">
      <div className="h-8 w-1/2 rounded bg-gray-200" />
      <div className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="h-12 w-full rounded bg-gray-200" />
          <div className="h-12 w-full rounded bg-gray-200" />
          <div className="h-12 w-full rounded bg-gray-200" />
          <div className="h-32 w-full rounded bg-gray-200" />
        </div>
        <div className="h-72 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

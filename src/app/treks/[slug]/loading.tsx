// Route skeleton shown while the trek detail page streams (audit §3.5).
export default function Loading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-[320px] w-full bg-gray-200" />
      <div className="container-px mx-auto max-w-6xl py-10">
        <div className="h-8 w-2/3 rounded bg-gray-200" />
        <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
        <div className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/6 rounded bg-gray-200" />
            <div className="mt-6 h-40 w-full rounded bg-gray-200" />
          </div>
          <div className="h-64 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// Route skeleton shown while the dashboard streams (audit §3.5).
export default function Loading() {
  return (
    <div className="container-px mx-auto max-w-5xl py-10 animate-pulse" aria-hidden="true">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="mt-8 space-y-4">
        <div className="h-24 w-full rounded-xl bg-gray-200" />
        <div className="h-24 w-full rounded-xl bg-gray-200" />
        <div className="h-24 w-full rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

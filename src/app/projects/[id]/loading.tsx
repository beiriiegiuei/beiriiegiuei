export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-paper-sunk" />
          <div className="h-4 w-28 rounded bg-paper-sunk" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-paper-sunk" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-paper-sunk" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-paper-sunk" />
                <div className="h-3 w-1/3 rounded bg-paper-sunk" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-paper-sunk" />
              <div className="h-3 w-4/5 rounded bg-paper-sunk" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

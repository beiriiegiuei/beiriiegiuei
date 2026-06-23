export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl animate-pulse px-5 py-12 sm:py-16">
      <div className="mb-10 space-y-3">
        <div className="h-5 w-40 rounded-full bg-paper-sunk" />
        <div className="h-9 w-48 rounded-lg bg-paper-sunk" />
        <div className="h-4 w-72 rounded bg-paper-sunk" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="mb-3 h-8 w-8 rounded bg-paper-sunk" />
            <div className="h-5 w-1/2 rounded bg-paper-sunk" />
            <div className="mt-3 h-3 w-full rounded bg-paper-sunk" />
          </div>
        ))}
      </div>
    </main>
  );
}

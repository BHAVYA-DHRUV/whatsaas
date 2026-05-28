export default function DashboardLoading() {
  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 animate-pulse">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <div className="h-9 w-48 rounded-md bg-muted" />
          <div className="h-4 w-72 rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 w-full rounded-xl bg-muted" />
      </div>
    </div>
  );
}

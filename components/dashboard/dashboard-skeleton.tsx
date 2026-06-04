import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="h-full p-6 overflow-y-auto md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-4 h-4" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        <div className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded">
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border/60 bg-card/80 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

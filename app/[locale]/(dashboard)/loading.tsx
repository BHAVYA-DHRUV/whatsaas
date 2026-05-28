import { EnterpriseTopbar } from '@/components/layout/enterprise-topbar';

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col">
      <EnterpriseTopbar />
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    </div>
  );
}

import { PlanForm } from '@/components/admin/PlanForm';
import { getActiveGateways } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewPlanPage() {
  const gateways = await getActiveGateways();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/plans">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Create New Plan</h1>
      </div>
      <PlanForm gateways={gateways} />
    </div>
  );
}
'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { toggleAutomationStatus } from '@/app/[locale]/(dashboard)/automation/actions';
import { toast } from 'sonner';

export function AutomationStatusToggle({
  id,
  initialActive,
}: {
  id: number;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  const onCheckedChange = (checked: boolean) => {
    setActive(checked);
    startTransition(async () => {
      try {
        await toggleAutomationStatus(id, checked);
        toast.success(checked ? 'Automation activated' : 'Automation paused');
      } catch {
        setActive(!checked);
        toast.error('Could not update status');
      }
    });
  };

  return (
    <Switch
      checked={active}
      onCheckedChange={onCheckedChange}
      disabled={pending}
      aria-label={active ? 'Deactivate automation' : 'Activate automation'}
    />
  );
}

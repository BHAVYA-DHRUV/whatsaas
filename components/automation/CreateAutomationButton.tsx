'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useSWR from 'swr';
import { toast } from 'sonner';
import { createAutomation } from '@/app/[locale]/(dashboard)/automation/actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type InstanceOption = { dbId: number; instanceName: string };

export function CreateAutomationButton({ variant = 'default' }: { variant?: 'default' | 'outline' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: instances } = useSWR<InstanceOption[]>('/api/instance/details', fetcher);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Enter an automation name');
      return;
    }
    if (!instanceId) {
      toast.error('Select a WhatsApp instance');
      return;
    }

    setSaving(true);
    try {
      const result = await createAutomation(name.trim(), parseInt(instanceId, 10));
      if (result.success && result.id) {
        toast.success('Automation created');
        setOpen(false);
        setName('');
        router.push(`/automation/${result.id}`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create automation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant === 'outline' ? 'outline' : 'default'} className="gap-2">
          <Plus className="h-4 w-4" />
          New automation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create automation</DialogTitle>
          <DialogDescription>
            Build a visual workflow for auto-replies, routing, and AI handoffs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="auto-name">Name</Label>
            <Input
              id="auto-name"
              placeholder="e.g. Welcome flow"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp instance</Label>
            <Select value={instanceId} onValueChange={setInstanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select instance" />
              </SelectTrigger>
              <SelectContent>
                {(instances ?? []).map((inst) => (
                  <SelectItem key={inst.dbId} value={String(inst.dbId)}>
                    {inst.instanceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create & edit flow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { upsertPlan, type ActionState } from '@/app/[locale]/(admin)/admin-actions';
import type { plans, paymentGateways } from '@/lib/db/schema';
import { Loader2 } from 'lucide-react';

type Plan = typeof plans.$inferSelect;
type Gateway = typeof paymentGateways.$inferSelect;

const initialState: ActionState = {};

export function PlanForm({
  initialData,
  gateways = [],
}: {
  initialData?: Plan | null;
  gateways?: Gateway[];
}) {
  const [state, formAction, pending] = useActionState(upsertPlan, initialState);

  const amountDisplay = initialData ? (initialData.amount / 100).toFixed(2) : '0';

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      {state?.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-2 text-sm text-green-700 dark:text-green-300">
          {state.success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={initialData?.name} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={initialData?.description ?? ''} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Price (USD)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" defaultValue={amountDisplay} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={initialData?.currency ?? 'usd'} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interval">Billing interval</Label>
              <select
                id="interval"
                name="interval"
                defaultValue={initialData?.interval ?? 'month'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialDays">Trial days</Label>
              <Input id="trialDays" name="trialDays" type="number" min="0" defaultValue={initialData?.trialDays ?? 0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gatewayId">Payment gateway</Label>
              <Select name="gatewayId" defaultValue={initialData?.gatewayId ? String(initialData.gatewayId) : 'none'}>
                <SelectTrigger>
                  <SelectValue placeholder="None (free plan)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {gateways.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.displayName} ({g.gateway})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limits</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="maxUsers">Max users</Label>
            <Input id="maxUsers" name="maxUsers" type="number" min="1" defaultValue={initialData?.maxUsers ?? 1} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxContacts">Max contacts</Label>
            <Input id="maxContacts" name="maxContacts" type="number" min="0" defaultValue={initialData?.maxContacts ?? 1000} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxInstances">Max WhatsApp</Label>
            <Input id="maxInstances" name="maxInstances" type="number" min="0" defaultValue={initialData?.maxInstances ?? 1} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['isAiEnabled', 'AI assistant'],
              ['isFlowBuilderEnabled', 'Automation builder'],
              ['isCampaignsEnabled', 'Campaigns'],
              ['isTemplatesEnabled', 'Templates'],
              ['isVoiceCallsEnabled', 'Voice calls'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm font-medium">{label}</span>
              <Switch name={key} defaultChecked={initialData?.[key] ?? false} />
            </label>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? 'Update plan' : 'Create plan'}
      </Button>
    </form>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import useSWR from 'swr';
import {
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  MessageCircle,
  QrCode,
  SkipForward,
  Smartphone,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { inviteTeamMember } from '@/app/[locale]/(login)/actions';
import Link from 'next/link';
import Logo from '@/components/interface/Logo';
import { getTeamChannel } from '@/lib/pusher-client';

type OnboardingPlan = {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  interval: string;
  currency: string;
};

type OnboardingStatus = {
  completed: boolean;
  onboardingCompletedAt?: string | null;
  steps: {
    workspace: boolean;
    plan: boolean;
    whatsapp: boolean;
    team: boolean;
  };
  team: { id: number; name: string; planId: number | null; planName: string | null };
  plans: OnboardingPlan[];
};

const STEPS = [
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'plan', label: 'Plan', icon: CreditCard },
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { id: 'team', label: 'Team', icon: Users },
] as const;

type StepId = (typeof STEPS)[number]['id'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export function OnboardingWizard() {
  const router = useRouter();
  const { data, mutate, isLoading } = useSWR<OnboardingStatus>('/api/onboarding/status', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 10_000,
  });

  const [activeStep, setActiveStep] = useState<StepId>('workspace');
  const [workspaceName, setWorkspaceName] = useState('');
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [selectingPlanId, setSelectingPlanId] = useState<number | null>(null);

  const [instanceLabel, setInstanceLabel] = useState('Main');
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [connectedInstance, setConnectedInstance] = useState<string | null>(null);
  const [refreshingQr, setRefreshingQr] = useState(false);
  const [pollingConnected, setPollingConnected] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (data?.team?.name) setWorkspaceName(data.team.name);
  }, [data?.team?.name]);

  useEffect(() => {
    if (data?.onboardingCompletedAt) {
      router.replace('/dashboard');
    }
  }, [data?.onboardingCompletedAt, router]);

  const firstIncomplete = useMemo((): StepId => {
    if (!data?.steps) return 'workspace';
    if (!data.steps.workspace) return 'workspace';
    if (!data.steps.plan) return 'plan';
    if (!data.steps.whatsapp) return 'whatsapp';
    return 'team';
  }, [data?.steps]);

  useEffect(() => {
    if (data && !data.completed) {
      setActiveStep(firstIncomplete);
    }
  }, [firstIncomplete, data]);

  const saveWorkspace = async () => {
    setSavingWorkspace(true);
    try {
      const res = await fetch('/api/onboarding/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      await mutate();
      toast.success('Workspace updated');
      setActiveStep('plan');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save workspace');
    } finally {
      setSavingWorkspace(false);
    }
  };

  const selectPlan = async (plan: OnboardingPlan) => {
    if (plan.amount > 0) {
      router.push(`/pricing?planId=${plan.id}`);
      return;
    }
    setSelectingPlanId(plan.id);
    try {
      const res = await fetch('/api/onboarding/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to select plan');
      await mutate();
      toast.success(`${plan.name} plan activated`);
      setActiveStep('whatsapp');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to select plan');
    } finally {
      setSelectingPlanId(null);
    }
  };

  const createWhatsAppInstance = async () => {
    setCreatingInstance(true);
    setConnectionState('creating');
    setQrBase64(null);
    try {
      const res = await fetch('/api/instance/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName: instanceLabel,
          integration: 'WHATSAPP-BAILEYS',
          ignoreGroups: true,
          alwaysOnline: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create instance');
      const name = (json.internalName ?? json.instance?.instanceName ?? json.instance?.name) as string | undefined;
      if (!name) throw new Error('Instance created but name was not returned');
      setConnectedInstance(name);
      setConnectionState(json.instance?.status === 'open' ? 'open' : 'waiting_qr');
      const initialQr = json.qrcode?.base64;
      if (initialQr) {
        setQrBase64(initialQr);
      } else {
        await refreshQr(name);
      }
    } catch (e: unknown) {
      setConnectionState('disconnected');
      toast.error(e instanceof Error ? e.message : 'Could not create WhatsApp instance');
    } finally {
      setCreatingInstance(false);
    }
  };

  const refreshQr = async (instanceName: string) => {
    setRefreshingQr(true);
    try {
      const res = await fetch(`/api/instance/connect?instanceName=${encodeURIComponent(instanceName)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to refresh QR');
      if (json.base64) {
        setQrBase64(json.base64);
        setConnectionState('waiting_qr');
        return;
      }
      throw new Error('QR code is not available yet. Please try again in a moment.');
    } catch (error) {
      setConnectionState('connecting');
      throw error;
    } finally {
      setRefreshingQr(false);
    }
  };

  const pollConnection = useCallback(async () => {
    if (!connectedInstance || pollingConnected) return;
    setPollingConnected(true);
    try {
      const res = await fetch('/api/instance/details');
      const list = await res.json();
      if (!Array.isArray(list)) return;
      const match = list.find(
        (i: { internalName?: string; instanceName: string; status: string }) =>
          i.internalName === connectedInstance || i.instanceName === connectedInstance
      );

      if (match?.status === 'open') {
        setConnectionState('open');
        await mutate();
        toast.success('WhatsApp connected');
        return;
      }

      if (!qrBase64 && (match?.status === 'connecting' || match?.status === 'close' || match?.status === 'unknown')) {
        await refreshQr(connectedInstance);
      }
    } catch (error) {
      console.error('[OnboardingWizard] pollConnection failed', error);
    } finally {
      setPollingConnected(false);
    }
  }, [connectedInstance, mutate, pollingConnected, qrBase64]);

  useEffect(() => {
    if (!connectedInstance || data?.steps.whatsapp) return;
    const id = setInterval(pollConnection, 12000);
    return () => clearInterval(id);
  }, [connectedInstance, data?.steps.whatsapp, pollConnection]);

  useEffect(() => {
    if (!data?.team?.id || !connectedInstance || data.steps.whatsapp) return;

    const channel = getTeamChannel(data.team.id);
    if (!channel) return;

    const handleQrUpdate = async (payload: { instance?: string }) => {
      if (payload.instance && payload.instance !== connectedInstance) return;
      try {
        await refreshQr(connectedInstance);
      } catch {
        // Manual refresh remains available in the UI.
      }
    };

    const handleConnectionStatus = async (payload: { instance?: string; status?: string }) => {
      if (payload.instance && payload.instance !== connectedInstance) return;

      if (payload.status === 'open') {
        setConnectionState('open');
        setQrBase64(null);
        await mutate();
        toast.success('WhatsApp connected');
        return;
      }

      if (payload.status === 'connecting') {
        setConnectionState('connecting');
        return;
      }

      if (payload.status === 'close') {
        setConnectionState('disconnected');
      }
    };

    channel.bind('qr-update-needed', handleQrUpdate);
    channel.bind('connection-status', handleConnectionStatus);

    return () => {
      channel.unbind('qr-update-needed', handleQrUpdate);
      channel.unbind('connection-status', handleConnectionStatus);
    };
  }, [connectedInstance, data?.steps.whatsapp, data?.team?.id, mutate]);

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const fd = new FormData();
      fd.set('email', inviteEmail.trim());
      fd.set('role', 'agent');
      const result = await inviteTeamMember({}, fd);
      if (result?.error) throw new Error(result.error);
      toast.success('Invitation sent');
      setInviteEmail('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const finishOnboarding = async () => {
    setFinishing(true);
    try {
      const res = await fetch('/api/onboarding/complete', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to complete onboarding');
      }
      await mutate();
      router.push('/dashboard');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not finish setup');
    } finally {
      setFinishing(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthlyPlans = data.plans.filter((p) => p.interval === 'month');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Logo />
        <Button variant="ghost" size="sm" onClick={finishOnboarding} disabled={finishing}>
          <SkipForward className="h-4 w-4 mr-2" />
          Skip for now
        </Button>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Set up your workspace</h1>
          <p className="text-muted-foreground mt-1">
            Connect WhatsApp, choose a plan, and invite your team in a few steps.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-2 mb-8">
          {STEPS.map((step, index) => {
            const done = data.steps[step.id];
            const isActive = activeStep === step.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm border transition-colors',
                  isActive && 'border-primary bg-primary/10 text-primary',
                  !isActive && done && 'border-green-500/40 bg-green-500/5',
                  !isActive && !done && 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {done ? <Check className="h-3.5 w-3.5 text-green-600" /> : index + 1}
                </span>
                <Icon className="h-4 w-4 hidden sm:block" />
                {step.label}
              </button>
            );
          })}
        </nav>

        {activeStep === 'workspace' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Name your workspace
              </CardTitle>
              <CardDescription>
                This is how your team will see the account in the sidebar and reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace name</Label>
                <Input
                  id="workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Sales"
                />
              </div>
              <Button onClick={saveWorkspace} disabled={savingWorkspace || workspaceName.trim().length < 2}>
                {savingWorkspace ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {activeStep === 'plan' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Choose a plan
              </CardTitle>
              <CardDescription>
                Start free or upgrade anytime. Paid plans open secure checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {monthlyPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'rounded-lg border p-4 flex flex-col gap-3',
                    data.team.planId === plan.id && 'border-primary ring-1 ring-primary'
                  )}
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {plan.amount === 0 ? 'Free' : formatMoney(plan.amount, plan.currency)}
                    {plan.amount > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                  </p>
                  <Button
                    variant={data.team.planId === plan.id ? 'secondary' : 'default'}
                    disabled={selectingPlanId === plan.id || data.team.planId === plan.id}
                    onClick={() => selectPlan(plan)}
                  >
                    {selectingPlanId === plan.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {data.team.planId === plan.id ? 'Current plan' : plan.amount === 0 ? 'Use free plan' : 'Subscribe'}
                  </Button>
                </div>
              ))}
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Need annual billing?{' '}
                <Link href="/pricing" className="text-primary underline-offset-4 hover:underline">
                  View all plans
                </Link>
              </p>
              {data.steps.plan && (
                <Button variant="outline" onClick={() => setActiveStep('whatsapp')}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {activeStep === 'whatsapp' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Connect WhatsApp
              </CardTitle>
              <CardDescription>
                Scan the QR code with WhatsApp on your phone. Requires Evolution API in your environment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.steps.whatsapp ? (
                <div className="flex items-center gap-2 text-green-600 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                  <Check className="h-5 w-5" />
                  <span>At least one WhatsApp instance is configured.</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="instance">Instance label</Label>
                    <Input
                      id="instance"
                      value={instanceLabel}
                      onChange={(e) => setInstanceLabel(e.target.value)}
                      placeholder="Main"
                    />
                  </div>
                  <Button onClick={createWhatsAppInstance} disabled={creatingInstance}>
                    {creatingInstance ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <QrCode className="h-4 w-4 mr-2" />
                    )}
                    Generate QR code
                  </Button>
                  {qrBase64 && (
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <img
                        src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                        alt="WhatsApp QR"
                        className="w-56 h-56 rounded-lg border"
                      />
                      <p className="text-sm text-muted-foreground">Open WhatsApp → Linked devices → Link a device</p>
                      {connectedInstance && (
                        <Button variant="outline" size="sm" onClick={() => refreshQr(connectedInstance)} disabled={refreshingQr}>
                          {refreshingQr ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Refresh QR
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setActiveStep('team')}>
                  {data.steps.whatsapp ? 'Continue' : 'Skip for now'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/settings/connect">Advanced setup</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 'team' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invite your team
              </CardTitle>
              <CardDescription>Optional — you can add members later in Settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invite'}
                </Button>
              </div>
              <Button className="w-full sm:w-auto" onClick={finishOnboarding} disabled={finishing}>
                {finishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Go to dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

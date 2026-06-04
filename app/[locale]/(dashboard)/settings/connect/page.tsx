'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Trash2, LogOut, QrCode, Plus, Smartphone, Settings as SettingsIcon, MoreVertical, Info, RefreshCw, Signal, Globe, Zap, Loader2, Download, Check, Users, MessageSquare, CheckCircle2, ExternalLink } from 'lucide-react';
import { getTeamChannel } from '@/lib/pusher-client';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

type TeamData = { id: number; };

type InstanceDetailItem = {
    dbId: number;
    instanceName: string;
    internalName?: string;
    evolutionInstanceId: string | null;
    owner: string | null;
    profileName: string | null;
    profilePictureUrl: string | null;
    status: string;
    token: string | null;
    number?: string;
    integration?: string;
};

type QrCodeApiResponse = {
  qrCode?: string | null;
  base64: string | null;
  code?: string | null;
  pairingCode?: string | null;
  status?: 'open' | 'waiting_qr' | 'connecting' | string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ConnectInstanceForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void; }) {
  const t = useTranslations('Settings');
  const [instanceName, setInstanceName] = useState('');
  const [number, setNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [connectionType, setConnectionType] = useState<"WHATSAPP-BAILEYS" | "WHATSAPP-BUSINESS" | "META-CLOUD">("WHATSAPP-BAILEYS");
  const [metaToken, setMetaToken] = useState("");
  const [metaBusinessId, setMetaBusinessId] = useState("");
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");

  const [rejectCalls, setRejectCalls] = useState(false);
  const [ignoreGroups, setIgnoreGroups] = useState(true);
  const [alwaysOnline, setAlwaysOnline] = useState(true);
  const [readMessages, setReadMessages] = useState(false);
  const [readStatus, setReadStatus] = useState(false);

  const [channelInfo, setChannelInfo] = useState<{ evoActive: boolean; metaActive: boolean; metaAppId: string }>({
    evoActive: true, metaActive: false, metaAppId: '',
  });

  useEffect(() => {
    fetch('/api/channels/status').then(r => r.json()).then(data => {
      setChannelInfo({
        evoActive: data.evolution?.active ?? true,
        metaActive: data.metaCloud?.active ?? false,
        metaAppId: data.metaCloud?.appId || '',
      });
    }).catch(() => {});
  }, []);

  const hasMetaCloudPlugin = channelInfo.metaActive;

  const launchMetaEmbeddedSignup = () => {
    const metaAppId = channelInfo.metaAppId;
    if (!metaAppId) return;
    setIsLoading(true);
    setError(null);

    const launchLogin = () => {
      const FB = (window as any).FB;
      if (!FB) {
        setError('Facebook SDK failed to load');
        setIsLoading(false);
        return;
      }

      FB.login(
        (response: any) => {
          if (response.authResponse?.code) {
            
            handleMetaSignupToken(response.authResponse.code);
          } else {
            setError(t('meta_cloud_error'));
            setIsLoading(false);
          }
        },
        {
          config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: '',
            sessionInfoVersion: 2,
          },
        }
      );
    };

    if ((window as any).FB) {
      launchLogin();
    } else {
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        (window as any).FB.init({
          appId: metaAppId,
          cookie: true,
          xfbml: false,
          version: 'v21.0',
        });
        launchLogin();
      };
      script.onerror = () => {
        setError('Failed to load Facebook SDK');
        setIsLoading(false);
      };
      document.body.appendChild(script);
    }
  };

  const handleMetaSignupToken = async (exchangeToken: string) => {
    try {
      const response = await fetch('/api/instance/meta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchangeToken, instanceName: instanceName || undefined }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('meta_cloud_error'));

      toast.success(t('meta_cloud_success'));
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionType === 'META-CLOUD') {
      launchMetaEmbeddedSignup();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        instanceName,
        integration: connectionType,
        ...(connectionType === "WHATSAPP-BAILEYS"
            ? {
                number,
                rejectCalls,
                ignoreGroups,
                alwaysOnline,
                readMessages,
                readStatus
              }
            : { metaToken, metaBusinessId, metaPhoneNumberId }
        )
      };

      const response = await fetch('/api/instance/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('failed_to_connect_toast'));

      toast.success(t('instance_created_success_toast'));
      onSuccess();

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const showEvoTabs = channelInfo.evoActive;
  const showMetaTab = hasMetaCloudPlugin;
  const tabCount = (showEvoTabs ? 2 : 0) + (showMetaTab ? 1 : 0);
  const defaultTab = showEvoTabs ? 'WHATSAPP-BAILEYS' : showMetaTab ? 'META-CLOUD' : 'WHATSAPP-BAILEYS';

  return (
    <form onSubmit={handleSubmit} className="pt-4 space-y-6">
        {connectionType !== 'META-CLOUD' && (
          <div className="space-y-2">
            <Label htmlFor="instanceNameFormModal">{t('instance_name_label')}</Label>
            <Input id="instanceNameFormModal" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} placeholder={t('instance_name_placeholder')} required disabled={isLoading && !error}/>
          </div>
        )}

        <Tabs defaultValue={defaultTab} onValueChange={(v) => setConnectionType(v as any)} className="w-full">
            <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${tabCount || 1}, 1fr)` }}>
                {showEvoTabs && <TabsTrigger value="WHATSAPP-BAILEYS">{t('whatsapp_web_tab')}</TabsTrigger>}
                {showEvoTabs && <TabsTrigger value="WHATSAPP-BUSINESS">{t('official_api_waba_tab')}</TabsTrigger>}
                {showMetaTab && <TabsTrigger value="META-CLOUD">{t('meta_cloud_tab')}</TabsTrigger>}
            </TabsList>

            {showEvoTabs && <TabsContent value="WHATSAPP-BAILEYS" className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numberFormModal">{t('whatsapp_number_label')}</Label>
                  <Input id="numberFormModal" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t('whatsapp_number_placeholder')} disabled={isLoading && !error}/>
                </div>

                <div className="pt-2 space-y-3">
                    <Label className="block mb-2 text-sm font-medium text-muted-foreground">{t('preferences_label')}</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="rejectCalls" checked={rejectCalls} onCheckedChange={(c) => setRejectCalls(c as boolean)} />
                            <Label htmlFor="rejectCalls" className="font-normal cursor-pointer">{t('reject_calls_checkbox')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="alwaysOnline" checked={alwaysOnline} onCheckedChange={(c) => setAlwaysOnline(c as boolean)} />
                            <Label htmlFor="alwaysOnline" className="font-normal cursor-pointer">{t('always_online_checkbox')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="readMessages" checked={readMessages} onCheckedChange={(c) => setReadMessages(c as boolean)} />
                            <Label htmlFor="readMessages" className="font-normal cursor-pointer">{t('read_messages_checkbox')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="readStatus" checked={readStatus} onCheckedChange={(c) => setReadStatus(c as boolean)} />
                            <Label htmlFor="readStatus" className="font-normal cursor-pointer">{t('read_status_checkbox')}</Label>
                        </div>
                    </div>
                </div>
            </TabsContent>}

            {showEvoTabs && <TabsContent value="WHATSAPP-BUSINESS" className="pt-4 space-y-4">
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">{t('meta_configuration_title')}</AlertTitle>
                    <AlertDescription className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                        {t('meta_configuration_desc')}<br/>
                        <code className="px-1 rounded select-all bg-black/10 dark:bg-black/30">{process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_URL+'/webhook/meta' || ''}</code><br/>
                        {t('verify_token_label')} <code className="px-1 rounded select-all bg-black/10 dark:bg-black/30">{process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN || ''}</code>
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label>{t('phone_number_id_label')}</Label>
                    <Input value={metaPhoneNumberId} onChange={(e) => setMetaPhoneNumberId(e.target.value)} placeholder={t('phone_number_id_placeholder')} required={connectionType === "WHATSAPP-BUSINESS"} disabled={isLoading && !error}/>
                </div>
                <div className="space-y-2">
                    <Label>{t('business_account_id_label')}</Label>
                    <Input value={metaBusinessId} onChange={(e) => setMetaBusinessId(e.target.value)} placeholder={t('business_account_id_placeholder')} required={connectionType === "WHATSAPP-BUSINESS"} disabled={isLoading && !error}/>
                </div>
                <div className="space-y-2">
                    <Label>{t('system_user_token_label')}</Label>
                    <PasswordInput value={metaToken} onChange={(e) => setMetaToken(e.target.value)} placeholder={t('system_user_token_placeholder')} required={connectionType === "WHATSAPP-BUSINESS"} disabled={isLoading && !error} toggleLabel="Show or hide system user token"/>
                </div>
            </TabsContent>}

            {showMetaTab && (
              <TabsContent value="META-CLOUD" className="pt-4 space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">{t('meta_cloud_title')}</AlertTitle>
                    <AlertDescription className="mt-1 text-xs text-green-700 dark:text-green-400">
                        {t('meta_cloud_desc')}
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="instanceNameMeta">{t('instance_name_label')}</Label>
                  <Input id="instanceNameMeta" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} placeholder={t('instance_name_placeholder')} disabled={isLoading}/>
                </div>
              </TabsContent>
            )}
        </Tabs>

        <div className="flex justify-end pt-4 space-x-2 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>{t('cancel_btn')}</Button>
            {connectionType === 'META-CLOUD' ? (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Globe className="w-4 h-4 mr-2"/>}
                {isLoading ? t('meta_cloud_connecting_btn') : t('meta_cloud_start_btn')}
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                {isLoading ? t('creating_instance_btn') : t('create_instance_btn')}
              </Button>
            )}
        </div>
     {error && (<p className="p-2 mt-4 text-sm text-center rounded text-destructive bg-destructive/10">{error}</p>)}
    </form>
  );
}

function InstanceCard({ details, mutateDetails, allInstances }: { details: InstanceDetailItem; mutateDetails: () => void; allInstances: InstanceDetailItem[] }) {
  const t = useTranslations('Settings');
  const router = useRouter();
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { data: teamData } = useSWR<TeamData>('/api/team', fetcher);
  const teamId = teamData?.id;
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [moveContactsTarget, setMoveContactsTarget] = useState<string>('');
  const otherInstances = allInstances.filter(i => i.dbId !== details.dbId);

  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncChats, setSyncChats] = useState<any[]>([]);
  const [selectedSyncJids, setSelectedSyncJids] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; total: number } | null>(null);
  const [syncPeriod, setSyncPeriod] = useState<'1' | '3' | '6' | 'all'>('all');
  const [saveContacts, setSaveContacts] = useState(true);

  const filteredSyncChats = useMemo(() => {
    if (syncPeriod === 'all') return syncChats;
    const months = parseInt(syncPeriod);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return syncChats.filter((c: any) => {
      if (!c.lastMessageTimestamp) return false;
      return new Date(c.lastMessageTimestamp) >= cutoff;
    });
  }, [syncChats, syncPeriod]);

  useEffect(() => {
    if (filteredSyncChats.length > 0) {
      const notImported = filteredSyncChats
        .filter((c: any) => !c.alreadyImported)
        .map((c: any) => c.remoteJid);
      setSelectedSyncJids(new Set(notImported));
    }
  }, [filteredSyncChats]);

  const handleOpenSync = async () => {
    setShowSyncDialog(true);
    setSyncLoading(true);
    setSyncChats([]);
    setSelectedSyncJids(new Set());
    setSyncResult(null);
    try {
      const res = await fetch('/api/instance/sync-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: details.dbId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncChats(data.chats || []);
      setSyncPeriod('all');
    } catch (err: any) {
      toast.error(err.message || t('sync_chats.error_loading'));
    } finally {
      setSyncLoading(false);
    }
  };

  const toggleSyncJid = (jid: string) => {
    setSelectedSyncJids(prev => {
      const next = new Set(prev);
      if (next.has(jid)) next.delete(jid);
      else next.add(jid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const notImported = filteredSyncChats.filter(c => !c.alreadyImported);
    if (selectedSyncJids.size === notImported.length) {
      setSelectedSyncJids(new Set());
    } else {
      setSelectedSyncJids(new Set(notImported.map(c => c.remoteJid)));
    }
  };

  const handleImportChats = async () => {
    if (selectedSyncJids.size === 0) return;
    setIsImporting(true);
    try {
      const selectedChats = filteredSyncChats.filter(c => selectedSyncJids.has(c.remoteJid));
      const res = await fetch('/api/instance/sync-chats/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: details.dbId, selectedChats, saveContacts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResult({ imported: data.imported, total: data.total });
      toast.success(t('sync_chats.import_success', { count: data.imported }));
      setSyncChats(prev =>
        prev.map(c =>
          selectedSyncJids.has(c.remoteJid) ? { ...c, alreadyImported: true } : c
        )
      );
      setSelectedSyncJids(new Set());
    } catch (err: any) {
      toast.error(err.message || t('sync_chats.import_error'));
    } finally {
      setIsImporting(false);
    }
  };

  const fetchQr = async (attempt: number | React.MouseEvent = 0) => {
      const actualAttempt = typeof attempt === 'number' ? attempt : 0;
      if (actualAttempt === 0) {
          setQrLoading(true); 
          setShowQrModal(true); 
          setQrCode(null); 
          setPairingCode(null); 
          setError(null);
      }
      const identifier = details.internalName || details.instanceName;
      try {
          const url = `/api/instance/connect?instanceName=${encodeURIComponent(identifier)}${actualAttempt === 0 ? '&reconnect=true' : ''}`;
          const response = await fetch(url);
          const data: QrCodeApiResponse = await response.json();

          if (!response.ok) {
            // On 503, retry up to 12 times
            if (response.status === 503 && actualAttempt < 12 && showQrModalRef.current) {
              setTimeout(() => fetchQr(actualAttempt + 1), 4000);
              return;
            }
            throw new Error((data as any).error || t('could_not_load_qr_code_error'));
          }

          // Instance is open/connected - no QR needed
          if (data.status === 'open' || (!data.qrCode && !data.base64 && !data.pairingCode && !data.code && detailsRef.current.status === 'open')) {
            setShowQrModal(false);
            setQrLoading(false);
            toast.info(t('instance_already_connected_info'));
            mutateDetails();
            return;
          }

          // QR code received
          if (data.qrCode || data.base64 || data.pairingCode || data.code) {
            if (data.qrCode) {
              setQrCode(data.qrCode);
            } else if (data.base64) {
              setQrCode(data.base64.startsWith('data:') ? data.base64 : `data:image/png;base64,${data.base64}`);
            }
            if (data.pairingCode || data.code) {
              setPairingCode(data.pairingCode || data.code || null);
            }
            setQrLoading(false);
          } else {
            // No QR yet — instance is still initializing/connecting, poll again
            if (actualAttempt < 15 && showQrModalRef.current) {
              setTimeout(() => fetchQr(actualAttempt + 1), 3000);
            } else {
              setQrLoading(false);
              setError(t('could_not_load_qr_code_error'));
            }
          }
      } catch (err: any) { 
          if (actualAttempt < 12 && showQrModalRef.current) {
              setTimeout(() => fetchQr(actualAttempt + 1), 3000);
          } else {
              toast.error(err.message); 
              setError(err.message);
              setQrLoading(false);
          }
      }
  };

  const handleAction = async (action: 'logout' | 'delete') => {
      if (action === 'delete') {
          setShowDeleteDialog(true);
          return;
      }
      setActionLoading(action); setError(null);
      const identifier = details.internalName || details.instanceName;
      try {
          const response = await fetch(`/api/instance/${action}?instanceName=${encodeURIComponent(identifier)}`, {
             method: 'POST'
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || t('failed_to_action_toast', { action: action }));
          toast.success(t('instance_action_success_toast', { action: t('instance_logged_out_success') }));
          mutateDetails();
      } catch (err: any) { toast.error(err.message); setError(err.message);}
      finally { setActionLoading(null); }
  };

  const handleConfirmDelete = async () => {
      setActionLoading('delete'); setError(null);
      try {
          if (moveContactsTarget && moveContactsTarget !== 'none') {
              const moveRes = await fetch('/api/contacts/move-instance-by-instance', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      sourceInstanceId: details.dbId,
                      targetInstanceId: parseInt(moveContactsTarget)
                  })
              });
              if (!moveRes.ok) {
                  const moveData = await moveRes.json();
                  throw new Error(moveData.error || t('move_contacts_error'));
              }
          }

          const response = await fetch(`/api/instance/delete?instanceName=${encodeURIComponent(details.internalName || details.instanceName)}`, {
              method: 'DELETE'
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || t('failed_to_action_toast', { action: 'delete' }));
          toast.success(t('instance_action_success_toast', { action: t('instance_deleted_success') }));
          setShowDeleteDialog(false);
          setMoveContactsTarget('');
          mutateDetails();
      } catch (err: any) { toast.error(err.message); setError(err.message); }
      finally { setActionLoading(null); }
  };

  const showQrModalRef = useRef(showQrModal);
  showQrModalRef.current = showQrModal;
  const detailsRef = useRef(details);
  detailsRef.current = details;

  useEffect(() => {
    if (!teamId) return;

    const channel = getTeamChannel(teamId);
    if (!channel) return;

    const handleQrUpdate = (data: { instance?: string; qrcode?: { base64?: string; code?: string; pairingCode?: string } }) => {
      if (!showQrModalRef.current) return;
      if (data.instance && data.instance !== detailsRef.current.internalName && data.instance !== detailsRef.current.instanceName) return;

      // If the Pusher event already contains the QR base64, use it directly (no extra API call)
      if (data.qrcode?.base64) {
        const b64 = data.qrcode.base64;
        setQrCode(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`);
        setPairingCode(data.qrcode.pairingCode || data.qrcode.code || null);
        setQrLoading(false);
        setError(null);
      } else {
        fetchQr();
      }
    };

    const handleConnectionStatus = (data: { status: string; instance?: string }) => {
      if (!data.instance || data.instance === detailsRef.current.internalName || data.instance === detailsRef.current.instanceName) {
        mutateDetails();
        if (data.status === 'open' && showQrModalRef.current) {
          setShowQrModal(false);
          toast.success(t('connected_success_toast'));
          // Auto-redirect to inbox after successful connection
          setTimeout(() => {
            router.push('/inbox');
          }, 1500);
        }
      }
    };

    channel.bind('qr-update-needed', handleQrUpdate);
    channel.bind('connection-status', handleConnectionStatus);

    return () => {
      channel.unbind('qr-update-needed', handleQrUpdate);
      channel.unbind('connection-status', handleConnectionStatus);
    };
  }, [teamId, mutateDetails, t]);

  const isConnected = details.status === 'open';
  const ownerNumber = details.number || details.owner?.split('@')[0] || t('no_number_fallback');
  const displayName = details.profileName || details.instanceName;
  const avatarUrl = details.profilePictureUrl || undefined;
  const isWaba = details.integration === 'WHATSAPP-BUSINESS';
  const isMetaCloud = details.integration === 'META-CLOUD';

  const getBadgeStyle = () => {
    if (isMetaCloud) return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800';
    if (isWaba) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
  };

  const getBadgeLabel = () => {
    if (isMetaCloud) return t('meta_cloud_badge');
    if (isWaba) return t('waba_api_badge');
    return t('whatsapp_web_badge');
  };

  return (
    <Card className="w-full overflow-hidden transition-all duration-200 border shadow-sm hover:shadow-md bg-card text-card-foreground group">

      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
            <div className={`relative flex h-2.5 w-2.5 items-center justify-center`}>
                {isConnected && <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : (details.status === 'connecting' ? 'bg-amber-500' : 'bg-destructive')}`}></span>
            </div>
            <span className={`text-xs font-medium uppercase tracking-wide ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : (details.status === 'connecting' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}`}>
                {isConnected ? t('online_status') : (details.status === 'connecting' ? t('connecting_status') : t('offline_status'))}
            </span>
        </div>
        <Badge variant="outline" className={`text-[10px] font-medium border ${getBadgeStyle()}`}>
            {isMetaCloud ? <Zap className="w-3 h-3 mr-1"/> : isWaba ? <Globe className="w-3 h-3 mr-1"/> : <Smartphone className="w-3 h-3 mr-1"/>}
            {getBadgeLabel()}
        </Badge>
      </div>

      <CardContent className="px-5 pt-2 pb-5">
        <div className="flex items-start gap-4 mt-2">
          <div className={`p-0.5 rounded-full border-2 ${isConnected ? 'border-emerald-500/50' : 'border-border'}`}>
            <Avatar className="h-14 w-14">
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover"/>
                <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                    {displayName?.substring(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex flex-col justify-center flex-1 min-w-0 h-14">
              <h3 className="text-lg font-semibold leading-tight truncate text-foreground" title={displayName}>{displayName}</h3>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Smartphone className="h-3.5 w-3.5 mr-1.5 opacity-70"/>
                  <span className="font-mono tracking-tight">{ownerNumber}</span>
              </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 px-4 py-3 border-t bg-muted/30">
          <div className="flex w-full gap-2">
            {!isConnected && !isWaba && !isMetaCloud && (
                <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
                    <DialogTrigger asChild>
                        <Button variant="default" size="sm" onClick={fetchQr} disabled={qrLoading || actionLoading !== null} className="flex-1 text-white bg-emerald-600 hover:bg-emerald-700">
                            {qrLoading ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin"/> : <QrCode className="h-3.5 w-3.5 mr-2"/>} 
                            {t('scan_qr_btn')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 overflow-hidden sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="sr-only">{t('connect_whatsapp_title')}</DialogTitle>
                        <DialogDescription className="sr-only">
                          {t('connect_whatsapp_desc')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="p-6 pb-2 text-center bg-background">
                        <h2 className="text-xl font-bold text-foreground">{t('connect_whatsapp_title')}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{t('connect_whatsapp_desc')}</p>
                      </div>
                        <div className="flex flex-col items-center justify-center p-8 border-t bg-muted/30">
                            <div className="relative p-2 bg-white border rounded-lg shadow-sm">
                                {qrLoading && (
                                    <div className="flex flex-col items-center justify-center w-64 h-64 p-4 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3"/>
                                        <p className="text-xs text-muted-foreground animate-pulse">
                                            {details.status === 'connecting'
                                                ? "Initializing WhatsApp engine..."
                                                : "Generating QR code..."}
                                        </p>
                                    </div>
                                )}
                                {qrCode && !qrLoading && <img src={qrCode} alt="QR Code" className="object-contain w-64 h-64"/>}
                                {!qrLoading && !qrCode && (
                                    <div className="flex flex-col items-center justify-center w-64 h-64 p-4 text-center">
                                        <AlertTitle className="mb-2 text-destructive">{t('error_qr_dialog_title')}</AlertTitle>
                                        <p className="text-sm text-muted-foreground">{error || t('could_not_load_qr_code_error')}</p>
                                        <Button variant="outline" size="sm" onClick={fetchQr} className="mt-4">{t('try_again_btn')}</Button>
                                    </div>
                                )}
                            </div>
                            {pairingCode && !qrLoading && (
                                <div className="px-3 py-2 mt-4 text-center border rounded-md bg-background">
                                    <p className="text-xs text-muted-foreground">Pairing code</p>
                                    <p className="font-mono text-sm font-semibold tracking-wider">{pairingCode}</p>
                                </div>
                            )}
                            <div className="mt-6 text-xs text-muted-foreground flex flex-col gap-1.5 w-full max-w-xs">
                                <p className="flex items-center"><span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 text-[10px] font-bold">1</span> {t('qr_instruction_1')}</p>
                                <p className="flex items-center"><span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 text-[10px] font-bold">2</span> {t('qr_instruction_2')}</p>
                                <p className="flex items-center"><span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 text-[10px] font-bold">3</span> {t('qr_instruction_3')}</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            
            {isConnected && !isMetaCloud && (
                <>
                {!isWaba && (
                <Button variant="outline" size="sm" onClick={handleOpenSync} disabled={actionLoading !== null} className="flex-1 transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 dark:hover:border-blue-800">
                    <Download className="h-3.5 w-3.5 mr-2"/> {t('sync_chats.btn')}
                </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleAction('logout')} disabled={actionLoading !== null} className="flex-1 transition-colors hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-amber-950/30 dark:hover:text-amber-400 dark:hover:border-amber-800">
                    {actionLoading === 'logout' ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <LogOut className="h-3.5 w-3.5 mr-2"/>} {t('logout_btn')}
                </Button>
                </>
            )}

            <Button variant="ghost" size="sm" onClick={() => handleAction('delete')} disabled={actionLoading !== null} className="px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
            </Button>
          </div>
      </CardFooter>

      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="sm:max-w-150 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('sync_chats.title')}
            </DialogTitle>
            <DialogDescription>
              {t('sync_chats.description')}
            </DialogDescription>
          </DialogHeader>

          {syncLoading ? (
            <div className="flex items-center justify-center flex-1 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : syncChats.length === 0 ? (
            <div className="flex items-center justify-center flex-1 py-12 text-muted-foreground">
              {t('sync_chats.no_chats')}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-1 pb-2">
                {(['1', '3', '6', 'all'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={syncPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    className="px-3 text-xs h-7"
                    onClick={() => setSyncPeriod(period)}
                  >
                    {t(`sync_chats.period_${period}`)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between px-1 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedSyncJids.size > 0 && selectedSyncJids.size === filteredSyncChats.filter(c => !c.alreadyImported).length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {t('sync_chats.select_all')} ({filteredSyncChats.filter(c => !c.alreadyImported).length} {t('sync_chats.available')})
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {filteredSyncChats.filter(c => c.alreadyImported).length} {t('sync_chats.already_imported')}
                </Badge>
              </div>
              <div className="flex-1 pr-3 overflow-y-auto max-h-100">
                <div className="space-y-1">
                  {filteredSyncChats.map((chat) => (
                    <div
                      key={chat.remoteJid}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                        chat.alreadyImported
                          ? 'opacity-50 bg-muted/30'
                          : selectedSyncJids.has(chat.remoteJid)
                            ? 'bg-primary/5 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <Checkbox
                        checked={chat.alreadyImported || selectedSyncJids.has(chat.remoteJid)}
                        disabled={chat.alreadyImported}
                        onCheckedChange={() => toggleSyncJid(chat.remoteJid)}
                      />
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={chat.profilePicUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {chat.isGroup ? <Users className="w-4 h-4" /> : chat.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{chat.name}</span>
                          {chat.isGroup && <Users className="w-3 h-3 text-muted-foreground shrink-0" />}
                          {chat.alreadyImported && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-xs truncate text-muted-foreground">
                          {chat.lastMessageText || t('sync_chats.no_message')}
                        </p>
                      </div>
                      {chat.lastMessageTimestamp && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(chat.lastMessageTimestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {syncResult && (
            <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {t('sync_chats.result', { imported: syncResult.imported })}
            </div>
          )}

          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="save-contacts"
              checked={saveContacts}
              onCheckedChange={(checked) => setSaveContacts(checked === true)}
            />
            <label htmlFor="save-contacts" className="text-sm cursor-pointer text-muted-foreground">
              {t('sync_chats.save_contacts')}
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
              {t('cancel_btn')}
            </Button>
            <Button
              onClick={handleImportChats}
              disabled={selectedSyncJids.size === 0 || isImporting}
            >
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {t('sync_chats.import_btn', { count: selectedSyncJids.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setMoveContactsTarget(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete_instance_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('delete_instance_dialog.description', { instanceName: details.instanceName })}
            </DialogDescription>
          </DialogHeader>
          {otherInstances.length > 0 && (
            <div className="py-4 space-y-3">
              <Label>{t('delete_instance_dialog.move_contacts_label')}</Label>
              <p className="text-sm text-muted-foreground">{t('delete_instance_dialog.move_contacts_desc')}</p>
              <Select value={moveContactsTarget} onValueChange={setMoveContactsTarget}>
                <SelectTrigger>
                  <SelectValue placeholder={t('delete_instance_dialog.dont_move')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('delete_instance_dialog.dont_move')}</SelectItem>
                  {otherInstances.map((inst) => (
                    <SelectItem key={inst.dbId} value={inst.dbId.toString()}>
                      {inst.profileName || inst.instanceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setMoveContactsTarget(''); }}>
              {t('cancel_btn')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={actionLoading === 'delete'}>
              {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {t('delete_instance_dialog.confirm_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function ConnectInstancePage() {
  const t = useTranslations('Settings');
  const { data: instanceList, error, isLoading, mutate } = useSWR<InstanceDetailItem[]>(
    '/api/instance/details',
    fetcher,
    { revalidateOnFocus: false, revalidateIfStale: true }
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) {
    return (
        <div className="max-w-6xl p-4 mx-auto space-y-8 md:p-8">
             <div className="flex items-center justify-between pb-6 border-b">
                 <div className="w-48 h-8 rounded bg-muted animate-pulse"></div>
                 <div className="w-32 h-10 rounded bg-muted animate-pulse"></div>
            </div>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="h-64 animate-pulse">
                        <CardHeader><div className="w-1/3 h-6 rounded bg-muted"></div></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-muted"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="w-3/4 h-4 rounded bg-muted"></div>
                                    <div className="w-1/2 h-3 rounded bg-muted"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex h-[80vh] flex-col items-center justify-center p-8">
            <div className="p-4 mb-4 rounded-full bg-destructive/10">
                <Signal className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('error_loading_instances_title')}</h3>
            <p className="mb-6 text-muted-foreground">{t('error_loading_instances_desc')}</p>
            <Button onClick={() => window.location.reload()} variant="outline">{t('retry_connection_btn')}</Button>
        </div>
    );
  }

  const hasInstances = instanceList && instanceList.length > 0;

  return (
    <div className="max-w-6xl p-4 mx-auto space-y-8 md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 pb-6 border-b sm:flex-row sm:items-center">
             <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('connections_title')}</h1>
                <p className="mt-1 text-muted-foreground">{t('connections_desc')}</p>
             </div>
             
             <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" className="shadow-sm">
                        <Plus className="w-5 h-5 mr-2"/> {t('add_connection_btn')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-137.5">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{t('connect_new_instance_title')}</DialogTitle>
                        <DialogDescription>
                            {t('connect_new_instance_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <ConnectInstanceForm
                        onSuccess={() => { mutate(); setIsAddModalOpen(false); }}
                        onCancel={() => setIsAddModalOpen(false)}
                    />
                </DialogContent>
             </Dialog>
        </div>

        {hasInstances ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {instanceList.map((instance) => (
                    <InstanceCard key={instance.dbId} details={instance} mutateDetails={mutate} allInstances={instanceList} />
                ))}
            </div>
        ) : (
             <div className="flex flex-col items-center justify-center px-4 py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
                 <div className="p-4 mb-4 rounded-full shadow-sm bg-background">
                    <Zap className="w-8 h-8 text-primary" />
                 </div>
                 <h3 className="text-xl font-semibold text-foreground">{t('no_connections_yet_title')}</h3>
                 <p className="max-w-md mt-2 mb-8 text-muted-foreground">
                    {t('no_connections_yet_desc')}
                 </p>
                 <Button onClick={() => setIsAddModalOpen(true)} size="lg">
                     <Plus className="w-5 h-5 mr-2"/> {t('connect_first_instance_btn')}
                 </Button>
             </div>
        )}
    </div>
  );
}

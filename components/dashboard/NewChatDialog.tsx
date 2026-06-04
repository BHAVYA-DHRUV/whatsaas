'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type InstanceData = {
  dbId: number;
  instanceName: string;
  internalName?: string;
  status: string;
  integration?: string;
};

type NewChatDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  instances: InstanceData[];
};

export function NewChatDialog({
  isOpen,
  onClose,
  instances,
}: NewChatDialogProps) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter for open/connected instances
  const activeInstances = instances.filter((inst) => inst.status === 'open');

  // Auto-select first active instance
  useEffect(() => {
    if (activeInstances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(activeInstances[0].dbId.toString());
    }
  }, [activeInstances, selectedInstanceId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedInstanceId) {
      setError('Please select an active WhatsApp connection.');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter a phone number.');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a first message to start the conversation.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chats/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: Number(selectedInstanceId),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start conversation.');
      }

      toast.success('Conversation started successfully!');
      onClose();

      // Reset form fields
      setPhone('');
      setMessage('');

      // Redirect to the newly created chat
      // Format URL to match the activeChatNumber
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      router.push(`/inbox/chat/${cleanPhone}?instanceId=${selectedInstanceId}`);
    } catch (err: any) {
      console.error('[NEW CHAT DIALOG] Error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 shadow-2xl bg-card border rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Start New Chat
            </h2>
            <p className="text-xs text-muted-foreground">
              Send the first message to start a conversation thread
            </p>
          </div>
        </div>

        {activeInstances.length === 0 ? (
          <div className="space-y-4 py-4 text-center">
            <div className="flex items-center justify-center text-amber-500 mb-2">
              <AlertCircle className="w-12 h-12" />
            </div>
            <p className="text-sm text-muted-foreground">
              No connected WhatsApp devices found. You must connect a device to send messages.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => { onClose(); router.push('/settings/connect'); }}>
                Go to Connections
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-lg text-destructive bg-destructive/10 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instanceSelect">WhatsApp Connection</Label>
              <select
                id="instanceSelect"
                value={selectedInstanceId}
                onChange={(e) => setSelectedInstanceId(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                disabled={isLoading}
              >
                {activeInstances.map((inst) => (
                  <option key={inst.dbId} value={inst.dbId.toString()}>
                    {inst.instanceName} ({inst.integration === 'WHATSAPP-BUSINESS' ? 'Official API' : 'WhatsApp Web'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneInput">Phone Number</Label>
              <Input
                id="phoneInput"
                placeholder="+91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="rounded-lg h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                Include country code (e.g. +1 for USA, +91 for India, +55 for Brazil)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageInput">First Message</Label>
              <textarea
                id="messageInput"
                rows={3}
                placeholder="Hello! How can we help you today?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={isLoading}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Send & Open'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
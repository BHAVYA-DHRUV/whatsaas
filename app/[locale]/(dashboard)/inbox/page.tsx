'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Target Chat Initiation: If user hits inbox with phone parameter, redirect to chat
    if (mounted && phone) {
      // Format the phone number for WhatsApp JID format
      const formattedPhone = phone.replace(/[^0-9]/g, '');
      router.push(`/inbox/chat/${formattedPhone}`);
    }
  }, [phone, router, mounted]);

  // Show loading state if redirecting, otherwise show placeholder
  if (phone) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] p-8 text-center dark:bg-none">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Opening conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] p-8 text-center dark:bg-none">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">WhatSaaS Inbox</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Select a conversation from the list to start messaging your customers on WhatsApp.
      </p>
    </div>
  );
}

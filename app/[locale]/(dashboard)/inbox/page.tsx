'use client';

import { MessageSquare } from 'lucide-react';

export default function InboxPage() {
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

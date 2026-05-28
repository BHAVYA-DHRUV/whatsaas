'use client';

import { MessageSquare } from 'lucide-react';

export default function InboxPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Select a conversation</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Choose a chat from the list or start a new conversation to message your customers on WhatsApp.
      </p>
    </div>
  );
}

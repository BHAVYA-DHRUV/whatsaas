'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { QuickReply } from './types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replies?: QuickReply[];
};

export function QuickRepliesModal({ open, onOpenChange, replies = [] }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick replies</DialogTitle>
        </DialogHeader>
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {!replies.length && (
            <li className="text-sm text-muted-foreground">No quick replies configured.</li>
          )}
          {replies.map((r) => (
            <li key={r.id} className="rounded-lg border p-3">
              <p className="font-mono text-sm text-primary">/{r.shortcut}</p>
              <p className="mt-1 text-sm">{r.message}</p>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

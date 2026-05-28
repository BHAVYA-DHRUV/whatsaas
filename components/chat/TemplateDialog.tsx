'use client';

import useSWR from 'swr';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetcher } from './utils';

type Template = { id: number; name: string; body: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendTemplate: (templateId: number, variables: Record<string, string>) => void;
};

export function TemplateDialog({ open, onOpenChange, onSendTemplate }: Props) {
  const { data: templates } = useSWR<Template[]>(
    open ? '/api/templates' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send template</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {!templates?.length && (
            <p className="text-sm text-muted-foreground">No templates available.</p>
          )}
          {templates?.map((t) => (
            <Button
              key={t.id}
              variant="outline"
              className="w-full justify-start h-auto py-3 text-left"
              onClick={() => {
                onSendTemplate(t.id, {});
                onOpenChange(false);
              }}
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

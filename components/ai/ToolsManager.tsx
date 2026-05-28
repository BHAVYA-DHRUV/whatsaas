'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAiTools,
  createAiTool,
  updateAiTool,
  deleteAiTool,
} from '@/app/[locale]/(dashboard)/settings/ai/tools-actions';

type AiToolRow = {
  id: number;
  name: string;
  description: string;
  confirmationMessage: string | null;
  isActive: boolean;
  actionData?: { actions?: unknown[] };
};

export function ToolsManager() {
  const [tools, setTools] = useState<AiToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AiToolRow | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [actionJson, setActionJson] = useState('[{"type":"send_message","text":"Done!"}]');
  const [pending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const list = await getAiTools();
    setTools(list as AiToolRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setConfirmationMessage('');
    setActionJson('[{"type":"send_message","text":"Done!"}]');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (tool: AiToolRow) => {
    setEditing(tool);
    setName(tool.name);
    setDescription(tool.description);
    setConfirmationMessage(tool.confirmationMessage || '');
    setActionJson(JSON.stringify(tool.actionData?.actions ?? [], null, 2));
    setOpen(true);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('name', name);
      fd.set('description', description);
      fd.set('confirmationMessage', confirmationMessage);
      try {
        JSON.parse(actionJson);
        fd.set('actions', actionJson);
      } catch {
        toast.error('Actions must be valid JSON array');
        return;
      }

      const result = editing ? await updateAiTool(editing.id, fd) : await createAiTool(fd);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? 'Tool updated' : 'Tool created');
      setOpen(false);
      resetForm();
      load();
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this tool?')) return;
    startTransition(async () => {
      await deleteAiTool(id);
      toast.success('Tool deleted');
      load();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Function calling tools
          </CardTitle>
          <CardDescription>Custom actions your AI agent can invoke during conversations.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add tool
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit tool' : 'New tool'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label>Name (snake_case)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="book_appointment" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this tool does for the model"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmation message</Label>
                <Input
                  value={confirmationMessage}
                  onChange={(e) => setConfirmationMessage(e.target.value)}
                  placeholder="Shown before executing"
                />
              </div>
              <div className="space-y-2">
                <Label>Actions (JSON array)</Label>
                <Textarea value={actionJson} onChange={(e) => setActionJson(e.target.value)} rows={6} className="font-mono text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tools.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No tools configured yet.</p>
        ) : (
          <div className="space-y-2">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{tool.description}</p>
                  <Badge variant={tool.isActive ? 'default' : 'secondary'} className="mt-1">
                    {tool.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(tool)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(tool.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useCallback, useState, useTransition } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  Panel,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { saveAutomation, toggleAutomationStatus } from '@/app/[locale]/(dashboard)/automation/actions';
import { toast } from 'sonner';
import { Bot, Clock, GitBranch, Loader2, MessageSquare, Save, Sparkles, Webhook } from 'lucide-react';
import Link from 'next/link';

type FlowBuilderProps = {
  automationId: number;
  initialNodes: Node[];
  initialEdges: Edge[];
  initialActive: boolean;
  integration: string;
};

function StartNode({ data }: { data: { label?: string } }) {
  return (
    <div className="min-w-[140px] rounded-lg border-2 border-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-900 dark:bg-green-950 dark:text-green-100">
      <Handle type="source" position={Position.Bottom} />
      {data.label || 'Start'}
    </div>
  );
}

function MessageNode({ data }: { data: { label?: string; text?: string } }) {
  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
        <MessageSquare className="h-3 w-3" /> Message
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{data.text || data.label || 'Send text'}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function DelayNode({ data }: { data: { label?: string; seconds?: number } }) {
  return (
    <div className="min-w-[140px] rounded-lg border border-amber-400/60 bg-amber-50 px-4 py-3 dark:bg-amber-950/40">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
        <Clock className="h-3 w-3" /> Delay {data.seconds ? `${data.seconds}s` : ''}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ConditionNode({ data }: { data: { label?: string } }) {
  return (
    <div className="min-w-[140px] rounded-lg border border-blue-400/60 bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-1 text-xs font-semibold text-blue-800 dark:text-blue-200">
        <GitBranch className="h-3 w-3" /> {data.label || 'Condition'}
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" />
      <Handle type="source" position={Position.Right} id="no" />
    </div>
  );
}

function AiNode({ data }: { data: { label?: string } }) {
  return (
    <div className="min-w-[140px] rounded-lg border border-violet-400/60 bg-violet-50 px-4 py-3 dark:bg-violet-950/40">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-1 text-xs font-semibold text-violet-800 dark:text-violet-200">
        <Sparkles className="h-3 w-3" /> {data.label || 'AI reply'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function WebhookNode({ data }: { data: { label?: string; url?: string } }) {
  return (
    <div className="min-w-[160px] rounded-lg border border-border bg-muted px-4 py-3">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-1 text-xs font-semibold">
        <Webhook className="h-3 w-3" /> Webhook
      </div>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{data.url || 'POST URL'}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  delay: DelayNode,
  condition: ConditionNode,
  ai: AiNode,
  webhook: WebhookNode,
};

let nodeId = 1000;
const nextId = () => `node-${++nodeId}`;

export default function FlowBuilder({
  automationId,
  initialNodes,
  initialEdges,
  initialActive,
  integration,
}: FlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [active, setActive] = useState(initialActive);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, startSave] = useTransition();
  const [toggling, startToggle] = useTransition();

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const id = nextId();
    const y = 120 + nodes.length * 40;
    const base = { id, type, position: { x: 280, y }, data: { label: type } };
    const node: Node =
      type === 'message'
        ? { ...base, data: { label: 'Message', text: 'Hello! How can we help?' } }
        : type === 'delay'
          ? { ...base, data: { label: 'Delay', seconds: 5 } }
          : type === 'ai'
            ? { ...base, data: { label: 'AI reply' } }
            : type === 'webhook'
              ? { ...base, data: { label: 'Webhook', url: '' } }
              : type === 'condition'
                ? { ...base, data: { label: 'If contains keyword' } }
                : base;
    setNodes((nds) => [...nds, node]);
  };

  const updateSelected = (patch: Record<string, unknown>) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, ...patch } } : n))
    );
    setSelectedNode((n) => (n ? { ...n, data: { ...n.data, ...patch } } : n));
  };

  const handleSave = () => {
    startSave(async () => {
      try {
        await saveAutomation(automationId, nodes, edges);
        toast.success('Flow saved');
      } catch {
        toast.error('Failed to save flow');
      }
    });
  };

  const handleToggle = (checked: boolean) => {
    setActive(checked);
    startToggle(async () => {
      try {
        await toggleAutomationStatus(automationId, checked);
        toast.success(checked ? 'Automation live' : 'Automation paused');
      } catch {
        setActive(!checked);
        toast.error('Could not update status');
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/automation" className="text-sm text-muted-foreground hover:text-foreground">
            ← Automations
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">Flow editor</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{integration}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="flow-active" className="text-sm">
              Active
            </Label>
            <Switch id="flow-active" checked={active} onCheckedChange={handleToggle} disabled={toggling} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save flow
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-52 shrink-0 border-r border-border bg-card/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add node</p>
          <div className="flex flex-col gap-2">
            {[
              { type: 'message', icon: MessageSquare, label: 'Send message' },
              { type: 'delay', icon: Clock, label: 'Delay' },
              { type: 'condition', icon: GitBranch, label: 'Condition' },
              { type: 'ai', icon: Sparkles, label: 'AI reply' },
              { type: 'webhook', icon: Webhook, label: 'Webhook' },
            ].map(({ type, icon: Icon, label }) => (
              <Button key={type} variant="outline" size="sm" className="justify-start gap-2" onClick={() => addNode(type)}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/20"
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-left" className="rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow">
              Drag nodes · Connect handles · Save when done
            </Panel>
          </ReactFlow>
        </div>

        <aside className="w-64 shrink-0 border-l border-border bg-card/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</p>
          {!selectedNode ? (
            <p className="text-sm text-muted-foreground">Select a node to edit</p>
          ) : selectedNode.type === 'message' ? (
            <div className="space-y-2">
              <Label>Message text</Label>
              <Input
                value={(selectedNode.data as { text?: string }).text || ''}
                onChange={(e) => updateSelected({ text: e.target.value })}
              />
            </div>
          ) : selectedNode.type === 'delay' ? (
            <div className="space-y-2">
              <Label>Seconds</Label>
              <Input
                type="number"
                min={1}
                value={String((selectedNode.data as { seconds?: number }).seconds ?? 5)}
                onChange={(e) => updateSelected({ seconds: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          ) : selectedNode.type === 'webhook' ? (
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={(selectedNode.data as { url?: string }).url || ''}
                onChange={(e) => updateSelected({ url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={(selectedNode.data as { label?: string }).label || ''}
                onChange={(e) => updateSelected({ label: e.target.value })}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

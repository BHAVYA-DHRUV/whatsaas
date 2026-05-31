'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type FilterState = {
  funnelStageId: number | null;
  tagId: number | null;
  agentId: number | null;
  instanceId: number | null;
};

type InstanceData = {
  dbId: number;
  instanceName: string;
  integration?: string;
};

type ChatFiltersProps = {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  instances: InstanceData[];
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'archived', label: 'Archived' },
] as const;

export function ChatFilters({ activeTab, setActiveTab }: ChatFiltersProps) {
  return (
    <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b bg-background/80 scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

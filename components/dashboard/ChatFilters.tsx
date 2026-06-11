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
  counts?: Record<string, number>;
};

const TABS = [
  { id: 'all', label: 'All', countKey: 'all' },
  { id: 'unread', label: 'Unread', countKey: 'unread' },
  { id: 'pinned', label: 'Pinned', countKey: 'pinned' },
  { id: 'archived', label: 'Archived', countKey: 'archived' },
  { id: 'starred', label: 'Starred', countKey: 'starred' },
  { id: 'media', label: 'Media', countKey: 'media' },
] as const;

export function ChatFilters({ activeTab, setActiveTab, counts }: ChatFiltersProps) {
  return (
    <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b bg-background/80 scrollbar-none">
      {TABS.map((tab) => {
        const count = counts?.[tab.countKey] ?? 0;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span>{tab.label}</span>
            {count > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[9px] font-bold transition-all',
                activeTab === tab.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary text-primary-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

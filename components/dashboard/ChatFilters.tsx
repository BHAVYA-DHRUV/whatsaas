'use client';

import React from 'react';

type FilterState = {
  funnelStageId: number | null;
  tagId: number | null;
  agentId: number | null;
  instanceId: number | null;
};

type InstanceData = {
  dbId: number;
  instanceName: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS' | string;
};

type ChatFiltersProps = {
  activeTab: string;

  setActiveTab: React.Dispatch<React.SetStateAction<string>>;

  filters: FilterState;

  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;

  instances: InstanceData[];
};

export function ChatFilters({
  activeTab,
  setActiveTab,
}: ChatFiltersProps) {
  return (
    <div className="flex gap-2 p-4 border-b bg-background">
      <button
        onClick={() => setActiveTab('all')}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition
          ${activeTab === 'all'
            ? 'bg-primary text-white'
            : 'bg-muted'}
        `}
      >
        All
      </button>

      <button
        onClick={() => setActiveTab('unread')}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition
          ${activeTab === 'unread'
            ? 'bg-primary text-white'
            : 'bg-muted'}
        `}
      >
        Unread
      </button>
    </div>
  );
}
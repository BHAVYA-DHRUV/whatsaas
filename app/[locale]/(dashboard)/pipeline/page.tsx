'use client';

import KanbanBoard from '../dashboard/KanbanBoard';

export default function PipelinePage() {
  return (
    <div className="flex h-full flex-col bg-muted/30 p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Sales pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Drag contacts across stages to track leads and conversions.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}

'use client';

import React from 'react';

type InstanceData = {
  dbId: number;
  instanceName: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS' | string;
};

type NewChatDialogProps = {
  isOpen: boolean;

  onClose: () => void;

  instances: InstanceData[];
};

export function NewChatDialog({
  isOpen,
  onClose,
}: NewChatDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md p-6 shadow-xl bg-background rounded-2xl">
        <h2 className="mb-4 text-xl font-semibold">
          Start New Chat
        </h2>

        <input
          placeholder="Enter phone number"
          className="w-full p-3 border rounded-lg"
        />

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted"
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 text-white rounded-lg bg-primary"
          >
            Create Chat
          </button>
        </div>
      </div>
    </div>
  );
}
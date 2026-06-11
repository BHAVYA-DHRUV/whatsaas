'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global layout level crash caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-900/20 animate-pulse">
            <AlertTriangle className="h-7 w-7" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Critical System Error</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              WhatsSaaS encountered a critical error during initialization. Click below to reload the app.
            </p>
          </div>

          {error.message && (
            <div className="text-left text-xs bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-32 overflow-y-auto font-mono text-zinc-500 dark:text-zinc-400 break-all">
              {error.name}: {error.message}
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={() => reset()}
              className="w-full gap-2 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function LocaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Locale level rendering crash caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-none flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border bg-card/60 p-6 md:p-8 shadow-xl backdrop-blur-md text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20 animate-pulse">
          <AlertCircle className="h-7 w-7" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this workspace page. We have logged the error details.
          </p>
        </div>

        {error.message && (
          <div className="text-left text-xs bg-muted/60 p-3 rounded-lg border border-border/60 max-h-32 overflow-y-auto font-mono text-muted-foreground break-all">
            {error.name}: {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            asChild
            className="flex-1 gap-2 border-border/80"
          >
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

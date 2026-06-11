'use client';

import { useState, useEffect, memo } from 'react';
import { formatLiveTimestamp } from '@/lib/inbox/utils';

type Props = {
  timestamp: string | Date | number | null | undefined;
  className?: string;
  formatFn?: (ts: string | Date | number | null | undefined) => string;
};

export const LiveTimestamp = memo(function LiveTimestamp({ timestamp, className, formatFn }: Props) {
  // Initialize synchronously so there's no empty-string flash on mount
  const [formatted, setFormatted] = useState(() => {
    const fn = formatFn || formatLiveTimestamp;
    return fn(timestamp);
  });

  useEffect(() => {
    const fn = formatFn || formatLiveTimestamp;
    // Sync immediately when timestamp changes
    const next = fn(timestamp);
    setFormatted(next);

    // Only set up interval for "just now" / "X min ago" style timestamps that tick
    const interval = setInterval(() => {
      const updated = fn(timestamp);
      // Only trigger re-render if the display string actually changed
      setFormatted((prev) => (prev === updated ? prev : updated));
    }, 30_000);

    return () => clearInterval(interval);
  }, [timestamp, formatFn]);

  return <span className={className}>{formatted}</span>;
});

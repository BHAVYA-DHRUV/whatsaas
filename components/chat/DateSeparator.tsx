'use client';

type Props = { date: Date; label: string };

export function DateSeparator({ label }: Props) {
  return (
    <div className="flex justify-center py-3">
      <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
        {label}
      </span>
    </div>
  );
}

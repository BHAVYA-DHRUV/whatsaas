type Props = { date: Date; label: string };

export function DateSeparator({ label }: Props) {
  return (
    <div className="flex justify-center py-3">
      <span className="px-3 py-1 text-xs font-medium rounded-full shadow-sm bg-background/90 text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

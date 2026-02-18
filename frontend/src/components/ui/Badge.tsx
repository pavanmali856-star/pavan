import { cn } from '../../lib/cn';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200',
        className
      )}
    >
      {children}
    </span>
  );
}


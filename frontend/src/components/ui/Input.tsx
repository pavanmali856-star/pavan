import React from 'react';
import { cn } from '../../lib/cn';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl bg-white/5 border border-white/10 px-4 text-sm',
        'placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-neon-500/40 focus:border-neon-500/40',
        'dark:placeholder:text-zinc-500',
        className
      )}
      {...props}
    />
  );
}


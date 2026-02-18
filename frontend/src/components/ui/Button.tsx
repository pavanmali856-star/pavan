import React from 'react';
import { cn } from '../../lib/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        variant === 'primary' &&
          'bg-neon-500 text-zinc-950 hover:bg-neon-400 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_10px_30px_rgba(43,231,255,0.15)]',
        variant === 'secondary' && 'bg-white/10 hover:bg-white/15 border border-white/10',
        variant === 'ghost' && 'hover:bg-white/10',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500',
        className
      )}
      {...props}
    />
  );
}


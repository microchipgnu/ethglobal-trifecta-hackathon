'use client';

import { cn } from '@/lib/utils';

export interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export const PulsatingButton = ({
  className,
  children,
  ...props
}: PulsatingButtonProps) => {
  return (
    <button
      className={cn(
        'relative flex cursor-pointer items-center justify-center rounded-lg bg-[#FFDB00]/50 px-4 py-2 text-center text-primary-foreground',
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute left-1/2 top-1/2 size-full -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-lg bg-[#FFDB00]" />
    </button>
  );
};

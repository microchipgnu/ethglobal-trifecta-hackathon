import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  pulseColor?: string;
  duration?: string;
}

export const PulsatingButton = forwardRef<
  HTMLButtonElement,
  PulsatingButtonProps
>(
  (
    {
      className,
      children,
      pulseColor = '#8008FD',
      duration = '1.5s',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative flex cursor-pointer items-center justify-center rounded-lg bg-[#FFDB00]/50 px-4 py-2 text-center text-primary-foreground',
          className
        )}
        style={
          {
            '--pulse-color': pulseColor,
            '--duration': duration,
          } as React.CSSProperties
        }
        {...props}
      >
        <div className="relative z-10">{children}</div>
        <div className="absolute left-1/2 top-1/2 size-full -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-lg bg-[#FFDB00]" />
      </button>
    );
  }
);

PulsatingButton.displayName = 'PulsatingButton';

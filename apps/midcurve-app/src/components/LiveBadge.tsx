
import React from 'react';
import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  className?: string;
  pulseSize?: 'sm' | 'md' | 'lg';
}

const LiveBadge = ({ className, pulseSize = 'md' }: LiveBadgeProps) => {
  const pulseSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  };

  return (
    <div className={cn('flex items-center gap-1.5 group', className)}>
      <div className="relative flex items-center justify-center">
        <div className={cn('bg-live-red rounded-full animate-pulse-slow', pulseSizes[pulseSize])} />
        <div className={cn(
          'absolute bg-live-red/30 rounded-full animate-pulse-slow',
          pulseSize === 'sm' ? 'h-2.5 w-2.5' : pulseSize === 'md' ? 'h-3.5 w-3.5' : 'h-5 w-5'
        )} />
      </div>
      <span className="text-live-red font-semibold text-xs uppercase tracking-wider group-hover:animate-pulse">Live</span>
    </div>
  );
};

export default LiveBadge;

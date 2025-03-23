
import React from 'react';
import { cn } from '@/lib/utils';

interface GlowEffectProps {
  className?: string;
  children: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  intensity?: 'low' | 'medium' | 'high';
}

const GlowEffect = ({ 
  className, 
  children, 
  color = 'from-primary/40 to-primary/20',
  size = 'md',
  intensity = 'medium'
}: GlowEffectProps) => {
  const sizeClasses = {
    sm: 'blur-sm',
    md: 'blur-md',
    lg: 'blur-lg',
    xl: 'blur-xl'
  };

  const intensityClasses = {
    low: 'opacity-20',
    medium: 'opacity-30',
    high: 'opacity-50'
  };

  return (
    <div className={cn('relative group', className)}>
      <div className={cn(
        'absolute inset-0 bg-gradient-to-r animate-glow rounded-lg -z-10 transition-all duration-1000',
        sizeClasses[size],
        intensityClasses[intensity],
        color
      )} />
      {children}
    </div>
  );
};

export default GlowEffect;

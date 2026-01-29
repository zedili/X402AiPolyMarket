'use client';

import { Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AILoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function AILoading({ className, size = 'md', text = 'AI Analyzing...' }: AILoadingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className={cn('flex items-center gap-1.5 text-purple-400', className)}>
      <div className="relative">
        <Brain className={cn(sizeClasses[size], 'animate-pulse')} />
        <Sparkles 
          className={cn(
            sizeClasses[size], 
            'absolute -top-0.5 -right-0.5 text-purple-500 animate-ping'
          )} 
        />
      </div>
      <span className={cn('font-bold tracking-wider uppercase animate-pulse', textSizeClasses[size])}>
        {text}
      </span>
    </div>
  );
}


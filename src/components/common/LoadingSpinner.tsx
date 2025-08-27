// src/components/common/LoadingSpinner.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  message 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-4'
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={cn(
          `${sizeClasses[size]} border-slate-200 border-t-slate-900 rounded-full animate-spin`,
          className
        )} 
      />
      {message && (
        <p className="text-sm text-slate-600">{message}</p>
      )}
    </div>
  );
};
// src/components/common/EmptyState.tsx

import React from 'react';
import { FileX, AlertCircle, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  variant?: 'default' | 'search' | 'error' | 'create';
}

const iconMap = {
  default: FileX,
  search: Search,
  error: AlertCircle,
  create: Plus
};

const variantClasses = {
  default: {
    container: 'text-gray-500',
    icon: 'text-gray-400',
    title: 'text-gray-900',
    description: 'text-gray-500'
  },
  search: {
    container: 'text-blue-500',
    icon: 'text-blue-400',
    title: 'text-gray-900',
    description: 'text-gray-500'
  },
  error: {
    container: 'text-red-500',
    icon: 'text-red-400',
    title: 'text-gray-900',
    description: 'text-gray-500'
  },
  create: {
    container: 'text-green-500',
    icon: 'text-green-400',
    title: 'text-gray-900',
    description: 'text-gray-500'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon: CustomIcon,
  className,
  variant = 'default'
}) => {
  const Icon = CustomIcon || iconMap[variant];
  const classes = variantClasses[variant];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      classes.container,
      className
    )}>
      <div className={cn(
        "mb-4 p-3 rounded-full bg-gray-100",
        classes.icon
      )}>
        <Icon className="w-8 h-8" />
      </div>
      
      <h3 className={cn("text-lg font-semibold mb-2", classes.title)}>
        {title}
      </h3>
      
      {description && (
        <p className={cn("text-sm mb-6 max-w-md", classes.description)}>
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action}
        </div>
      )}
    </div>
  );
};
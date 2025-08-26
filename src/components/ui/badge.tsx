// src/components/ui/Badge.tsx

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  destructive: 'bg-red-500 text-slate-50 hover:bg-red-600',
  outline: 'text-slate-950 border border-slate-200 bg-transparent hover:bg-slate-100',
  success: 'bg-green-500 text-slate-50 hover:bg-green-600',
  warning: 'bg-yellow-500 text-slate-900 hover:bg-yellow-600',
  info: 'bg-blue-500 text-slate-50 hover:bg-blue-600',
};

const badgeSizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

export function Badge({ 
  className, 
  variant = 'default', 
  size = 'sm',
  children,
  ...props 
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Componente de status automático
export const StatusBadge = ({ status, ...props }: { status: string } & Omit<BadgeProps, 'variant' | 'children'>) => {
  const getVariant = (status: string): BadgeProps['variant'] => {
    const lowerStatus = status.toLowerCase();
    
    if (['active', 'ativo', 'completed', 'concluído', 'success', 'aprovado'].includes(lowerStatus)) {
      return 'success';
    }
    if (['pending', 'pendente', 'warning', 'aguardando'].includes(lowerStatus)) {
      return 'warning';
    }
    if (['cancelled', 'cancelado', 'error', 'erro', 'failed', 'falhou'].includes(lowerStatus)) {
      return 'destructive';
    }
    if (['info', 'informação', 'draft', 'rascunho'].includes(lowerStatus)) {
      return 'info';
    }
    
    return 'secondary';
  };

  return (
    <Badge variant={getVariant(status)} {...props}>
      {status}
    </Badge>
  );
};

// Badge de prioridade
export const PriorityBadge = ({ priority, ...props }: { priority: 'low' | 'medium' | 'high' | 'urgent' } & Omit<BadgeProps, 'variant' | 'children'>) => {
  const priorityConfig = {
    low: { variant: 'secondary' as const, label: 'Baixa' },
    medium: { variant: 'info' as const, label: 'Média' },
    high: { variant: 'warning' as const, label: 'Alta' },
    urgent: { variant: 'destructive' as const, label: 'Urgente' },
  };

  const config = priorityConfig[priority];

  return (
    <Badge variant={config.variant} {...props}>
      {config.label}
    </Badge>
  );
};
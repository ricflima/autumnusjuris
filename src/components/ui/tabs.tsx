// src/components/ui/tabs.tsx

import React, { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
  className
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className
}) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        "bg-gray-100",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value: triggerValue,
  children,
  className,
  disabled = false
}) => {
  const { value, onValueChange } = useTabsContext();
  const isActive = value === triggerValue;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tab-content-${triggerValue}`}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(triggerValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-background text-foreground shadow-sm bg-white text-gray-900" 
          : "text-gray-600 hover:text-gray-900",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  value: contentValue,
  children,
  className
}) => {
  const { value } = useTabsContext();
  
  if (value !== contentValue) {
    return null;
  }

  return (
    <div
      id={`tab-content-${contentValue}`}
      role="tabpanel"
      aria-labelledby={`tab-trigger-${contentValue}`}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
};
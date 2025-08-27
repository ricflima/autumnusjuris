// src/components/ui/collapsible.tsx
import React, { useState, createContext, useContext } from 'react';

interface CollapsibleContextType {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | null>(null);

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ 
  children, 
  defaultOpen = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div className={className}>{children}</div>
    </CollapsibleContext.Provider>
  );
};

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ 
  children, 
  className = ""
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within Collapsible');
  }

  return (
    <button
      onClick={context.toggle}
      className={`w-full text-left ${className}`}
    >
      {children}
    </button>
  );
};

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ 
  children, 
  className = ""
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleContent must be used within Collapsible');
  }

  if (!context.isOpen) return null;

  return (
    <div className={`transition-all duration-200 ease-in-out ${className}`}>
      {children}
    </div>
  );
};
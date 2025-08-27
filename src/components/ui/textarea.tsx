// src/components/ui/textarea.tsx
import React from 'react';

interface TextareaProps {
  id?: string; // Adicionado
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  id, // Adicionado
  value, 
  onChange, 
  placeholder, 
  rows = 3,
  className = "",
  disabled = false
}) => {
  return (
    <textarea
      id={id} // Adicionado
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
};
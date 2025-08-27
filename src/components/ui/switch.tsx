// src/components/ui/switch.tsx
import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ 
  checked = false, 
  onCheckedChange, 
  disabled = false,
  className = ""
}) => {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onCheckedChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 shadow-sm transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </div>
    </label>
  );
};
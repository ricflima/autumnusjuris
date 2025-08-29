// src/components/ui/process-number-input.tsx

import React, { forwardRef, useEffect, useRef } from 'react';
import { Input } from './input';

interface ProcessNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

// Função para aplicar máscara de número de processo CNJ
const applyProcessNumberMask = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Se não tem números, retorna vazio
  if (!numbers) return '';
  
  // Limita a 20 dígitos (padrão CNJ)
  const limitedNumbers = numbers.slice(0, 20);
  
  // Aplica a máscara progressivamente
  let masked = '';
  
  for (let i = 0; i < limitedNumbers.length; i++) {
    const digit = limitedNumbers[i];
    
    if (i === 7) {
      masked += '-' + digit;
    } else if (i === 9) {
      masked += '.' + digit;
    } else if (i === 13) {
      masked += '.' + digit;
    } else if (i === 14) {
      masked += '.' + digit;
    } else if (i === 16) {
      masked += '.' + digit;
    } else {
      masked += digit;
    }
  }
  
  return masked;
};

// Função para remover máscara (retorna apenas números)
const removeProcessNumberMask = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Função para validar se o número de processo está no formato correto
const validateProcessNumber = (value: string): boolean => {
  // Remove a máscara para validação
  const numbers = removeProcessNumberMask(value);
  
  // Deve ter exatamente 20 dígitos para ser um número de processo CNJ completo
  return numbers.length === 20;
};

const ProcessNumberInput = forwardRef<HTMLInputElement, ProcessNumberInputProps>(
  ({ value = '', onChange, error, placeholder, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Usar ref externo se fornecido, senão usar ref interno
    const inputElement = (ref as React.RefObject<HTMLInputElement>) || inputRef;

    // Aplicar máscara no valor inicial
    const [maskedValue, setMaskedValue] = React.useState(() => applyProcessNumberMask(value));

    // Sincronizar com valor externo
    useEffect(() => {
      const newMasked = applyProcessNumberMask(value);
      if (newMasked !== maskedValue) {
        setMaskedValue(newMasked);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cursorPosition = e.target.selectionStart;
      
      // Aplicar máscara
      const newMaskedValue = applyProcessNumberMask(inputValue);
      
      // Atualizar estado local
      setMaskedValue(newMaskedValue);
      
      // Notificar mudança para o componente pai com valor sem máscara
      if (onChange) {
        const unmaskedValue = removeProcessNumberMask(newMaskedValue);
        onChange(unmaskedValue);
      }
      
      // Ajustar posição do cursor após aplicar a máscara
      setTimeout(() => {
        if (inputElement.current && cursorPosition !== null) {
          let newCursorPosition = cursorPosition;
          
          // Ajustar cursor se caracteres especiais foram adicionados
          const oldLength = inputValue.length;
          const newLength = newMaskedValue.length;
          
          if (newLength > oldLength) {
            newCursorPosition = Math.min(cursorPosition + (newLength - oldLength), newMaskedValue.length);
          }
          
          inputElement.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir teclas especiais
      const allowedKeys = [
        'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', 'Tab', 'Enter', 'Escape'
      ];
      
      // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      
      // Bloquear teclas que não são números ou teclas especiais
      if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
        e.preventDefault();
      }
      
      // Chamar onKeyDown original se existir
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      
      // Obter texto da área de transferência
      const pastedText = e.clipboardData.getData('text');
      
      // Aplicar máscara ao texto colado
      const maskedPastedText = applyProcessNumberMask(pastedText);
      
      // Atualizar valor
      setMaskedValue(maskedPastedText);
      
      if (onChange) {
        const unmaskedValue = removeProcessNumberMask(maskedPastedText);
        onChange(unmaskedValue);
      }
    };

    return (
      <div className="space-y-1">
        <Input
          {...props}
          ref={inputElement}
          value={maskedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder || "0000000-00.0000.0.00.0000"}
          maxLength={25} // Máximo de caracteres com máscara
          error={error}
        />
        
        {/* Dica visual sobre o formato */}
        <div className="text-xs text-gray-500 mt-1">
          Formato: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos)
        </div>
        
        {/* Indicador de validade */}
        {maskedValue && (
          <div className="text-xs mt-1">
            {validateProcessNumber(maskedValue) ? (
              <span className="text-green-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Número válido
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Digite todos os 20 dígitos
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

ProcessNumberInput.displayName = 'ProcessNumberInput';

export { ProcessNumberInput, applyProcessNumberMask, removeProcessNumberMask, validateProcessNumber };
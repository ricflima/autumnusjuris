// src/components/common/LoadingScreen.tsx
import { Scale } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ 
  message = 'Carregando...', 
  fullScreen = true 
}: LoadingScreenProps) {
  const containerClasses = fullScreen 
    ? 'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Logo animado */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-900 rounded-full animate-pulse">
            <Scale className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>
        
        {/* Título */}
        <h1 className="text-xl font-semibold text-slate-900 mb-4">
          Autumnus Juris
        </h1>
        
        {/* Spinner de loading */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        </div>
        
        {/* Mensagem */}
        <p className="text-slate-600 text-sm animate-pulse">
          {message}
        </p>
        
        {/* Indicador de progresso */}
        <div className="mt-6 w-48 mx-auto">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-900 rounded-full animate-pulse" style={{
              animation: 'loading-bar 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      </div>
      
      {/* CSS personalizado para animação */}
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Componente de loading menor para usar dentro de páginas
export function LoadingSpinner({ 
  size = 'md', 
  message 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  message?: string; 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-4'
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} border-slate-200 border-t-slate-900 rounded-full animate-spin`}></div>
      {message && (
        <p className="text-sm text-slate-600">{message}</p>
      )}
    </div>
  );
}

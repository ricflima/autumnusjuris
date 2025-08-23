// src/pages/common/ComingSoon.tsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Code, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComingSoonProps {
  title: string;
  message: string;
  showBackButton?: boolean;
  estimatedDate?: string;
}

export default function ComingSoon({ 
  title, 
  message, 
  showBackButton = true,
  estimatedDate 
}: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      {showBackButton && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Code className="w-12 h-12 text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 p-1 bg-yellow-500 rounded-full">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <CardTitle className="text-2xl text-gray-900">
              {title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {message}
            </p>
            
            {estimatedDate && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>Previsão de lançamento: {estimatedDate}</span>
              </div>
            )}
            
            <div className="pt-4 space-y-3">
              <p className="text-sm text-gray-500">
                Enquanto isso, você pode:
              </p>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Ir para o Dashboard
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/cases')}
                  className="w-full"
                >
                  Gerenciar Casos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações adicionais */}
      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500">
          Este módulo faz parte do roadmap de desenvolvimento do Autumnus Juris
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span>Fase 2: MVP ✅</span>
          <span>•</span>
          <span>Fase 3: Em desenvolvimento 🚧</span>
          <span>•</span>
          <span>10 fases planejadas 📋</span>
        </div>
      </div>
    </div>
  );
}

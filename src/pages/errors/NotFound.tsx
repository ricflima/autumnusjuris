// src/pages/errors/NotFound.tsx
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-slate-900 rounded-full">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Erro 404 */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl font-bold text-slate-900">404</span>
            <FileQuestion className="w-16 h-16 text-slate-400" />
          </div>
          
          <CardTitle className="text-2xl text-gray-900">
            Página não encontrada
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir para Dashboard
              </Button>
            </div>
          </div>
          
          <div className="pt-4 text-xs text-gray-500">
            <p>Autumnus Juris - Sistema de Gestão Jurídica</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
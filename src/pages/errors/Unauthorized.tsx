// src/pages/errors/Unauthorized.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, ArrowLeft, AlertTriangle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const requiredRoles = location.state?.requiredRoles || [];

  const handleLogout = async () => {
    await logout();
  };

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
          
          {/* Ícone de erro */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-4 bg-red-100 rounded-full">
              <Shield className="w-12 h-12 text-red-600" />
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <CardTitle className="text-2xl text-gray-900">
            Acesso Negado
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
          
          {requiredRoles.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Permissões necessárias:</strong> {requiredRoles.join(', ')}
              </p>
              {user && (
                <p className="text-xs text-yellow-700 mt-1">
                  Seu nível: {user.role}
                </p>
              )}
            </div>
          )}
          
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
                Dashboard
              </Button>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-red-600 hover:bg-red-50 hover:border-red-200"
              >
                Fazer logout e trocar de conta
              </Button>
            </div>
          </div>
          
          <div className="pt-4 text-xs text-gray-500">
            <p>Se você acredita que isso é um erro, entre em contato com o administrador.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
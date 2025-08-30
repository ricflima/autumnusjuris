// src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requiredRoles = [],
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isCheckingAuth, isLoading } = useAuth();
  const location = useLocation();

  // Se não precisa de autenticação, renderizar direto
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Mostrar loading enquanto verifica autenticação
  if (isCheckingAuth || isLoading) {
    return <LoadingScreen />;
  }

  // Se não está autenticado, redirecionar para login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Se precisa verificar roles específicas
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ from: location, requiredRoles }} 
          replace 
        />
      );
    }
  }

  // Tudo ok, renderizar componente
  return <>{children}</>;
}

// Componente para rotas públicas (só para usuários NÃO autenticados)
export function PublicRoute({ 
  children, 
  redirectTo = '/dashboard' 
}: { 
  children: React.ReactNode; 
  redirectTo?: string; 
}) {
  const { isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  // Se já está logado, redirecionar para dashboard
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

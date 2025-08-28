// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService, type LoginCredentials } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { 
    user, 
    token, 
    isAuthenticated, 
    setUser, 
    setToken, 
    clearUser, 
    setLoading, 
    login: storeLogin, 
    logout: storeLogout 
  } = useAuthStore();

  // Query para verificar usuário atual
  const { isLoading: isCheckingAuth, data: userData, error: authError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getCurrentUser,
    enabled: !!token && !user,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    // Remove onSuccess e onError
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      setLoading(true);
      return authService.login(credentials);
    },
    onSuccess: (response) => {
      const { user, token } = response;
      
      // Atualizar store
      storeLogin(user, token);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Feedback positivo
      toast.success(`Bem-vindo de volta, ${user.name}!`, {
        duration: 3000,
        icon: '👋',
      });
      
      // Navegar para dashboard
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      setLoading(false);
      const message = error.message || 'Erro ao fazer login. Tente novamente.';
      toast.error(message, {
        duration: 4000,
        icon: '❌',
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Limpar store
      storeLogout();
      
      // Limpar cache completo
      queryClient.clear();
      
      toast.success('Logout realizado com sucesso', {
        duration: 2000,
        icon: '👋',
      });
      
      navigate('/login', { replace: true });
    },
    onError: (error: any) => {
      console.error('Erro no logout:', error);
      // Mesmo com erro, fazer logout local
      storeLogout();
      queryClient.clear();
      navigate('/login', { replace: true });
      
      toast.error('Erro no logout, mas você foi desconectado', {
        duration: 3000,
      });
    },
  });

  // Mutation para refresh token
  const refreshTokenMutation = useMutation({
    mutationFn: authService.refreshToken,
    onSuccess: (token) => {
      // Token refresh only returns a new token, not user data
      setToken(token);
    },
    onError: (error) => {
      console.error('Erro ao renovar token:', error);
      clearUser();
      navigate('/login', { replace: true });
    },
  });

  // Funções públicas
  const login = async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    return logoutMutation.mutateAsync();
  };

  const refreshToken = async () => {
    return refreshTokenMutation.mutateAsync();
  };

  // Verificar se está autenticado
  const checkAuthentication = () => {
    return authService.isAuthenticated() && isAuthenticated;
  };

  return {
    // Estado
    user,
    token,
    isAuthenticated: checkAuthentication(),
    
    // Loading states
    isLoading: loginMutation.isPending || logoutMutation.isPending || isCheckingAuth,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isCheckingAuth,
    
    // Actions
    login,
    logout,
    refreshToken,
    
    // Error states
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    
    // Utils
    checkAuthentication,
  };
};
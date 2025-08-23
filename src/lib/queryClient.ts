// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo de cache padrão: 5 minutos
      staleTime: 5 * 60 * 1000,
      // Tempo para garbage collection: 10 minutos  
      gcTime: 10 * 60 * 1000,
      // Retry automático em caso de erro
      retry: (failureCount, error: any) => {
        // Não retry para erros 4xx (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Máximo 3 tentativas para outros erros
        return failureCount < 3;
      },
      // Intervalo entre retries (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch quando a janela ganhar foco
      refetchOnWindowFocus: false,
      // Refetch quando reconectar
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry para mutations em caso de erro de rede
      retry: (failureCount, error: any) => {
        // Não retry para erros 4xx
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Máximo 2 tentativas para mutations
        return failureCount < 2;
      },
    },
  },
});

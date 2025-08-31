// src/hooks/useMovements.ts

import { useState, useEffect, useCallback } from 'react';
import TribunalMovementsService from '@/services/tribunalMovements.service';
import { Novelty } from '@/services/tribunals/novelty/noveltyController.service';

/**
 * Filtros para movimentações
 */
interface MovementFilters {
  showOnlyNew?: boolean;
  tribunalCode?: string;
  priority?: ('urgent' | 'high' | 'medium' | 'low')[];
  dateFrom?: string;
  dateTo?: string;
  processId?: string;
}

/**
 * Estado das movimentações
 */
interface MovementsState {
  novelties: Novelty[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  stats: {
    total: number;
    unread: number;
    byPriority: Record<string, number>;
  } | null;
}

/**
 * Hook personalizado para gerenciar movimentações e novidades
 */
export const useMovements = (
  filters: MovementFilters = {},
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
) => {
  const [state, setState] = useState<MovementsState>({
    novelties: [],
    isLoading: false,
    error: null,
    lastUpdate: null,
    stats: null
  });

  const service = TribunalMovementsService.getInstance();

  const loadNovelties = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await service.initialize();
      
      const novelties = await service.getUnreadNovelties(100);
      
      // Aplicar filtros locais
      let filteredNovelties = novelties;
      
      if (filters.showOnlyNew) {
        filteredNovelties = filteredNovelties.filter(n => !n.isRead);
      }
      
      if (filters.tribunalCode) {
        // Extrair código do tribunal do CNJ (assumindo formato NNNNNNN-DD.AAAA.J.TR.OOOO)
        filteredNovelties = filteredNovelties.filter(n => {
          const match = n.cnjNumber.match(/\d{7}-\d{2}\.\d{4}\.(\d)\.(\d{2})\.\d{4}/);
          if (match) {
            const tribunalCode = match[1] + match[2];
            return tribunalCode === filters.tribunalCode;
          }
          return false;
        });
      }
      
      if (filters.priority?.length) {
        filteredNovelties = filteredNovelties.filter(n => 
          filters.priority!.includes(n.priority as any)
        );
      }
      
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        filteredNovelties = filteredNovelties.filter(n => 
          new Date(n.movementDate) >= dateFrom
        );
      }
      
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        filteredNovelties = filteredNovelties.filter(n => 
          new Date(n.movementDate) <= dateTo
        );
      }

      // Calcular estatísticas
      const stats = {
        total: filteredNovelties.length,
        unread: filteredNovelties.filter(n => !n.isRead).length,
        byPriority: filteredNovelties.reduce((acc, n) => {
          acc[n.priority] = (acc[n.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      setState({
        novelties: filteredNovelties,
        isLoading: false,
        error: null,
        lastUpdate: new Date(),
        stats
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar movimentações'
      }));
    }
  }, [service, filters]);

  const markAsRead = useCallback(async (noveltyIds: string[]) => {
    try {
      await service.markNoveltiesAsRead(noveltyIds);
      
      // Atualizar estado local
      setState(prev => ({
        ...prev,
        novelties: prev.novelties.filter(n => !noveltyIds.includes(n.id)),
        stats: prev.stats ? {
          ...prev.stats,
          unread: Math.max(0, prev.stats.unread - noveltyIds.length),
          total: prev.stats.total - noveltyIds.length
        } : null
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Erro ao marcar como lido'
      }));
    }
  }, [service]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = state.novelties
      .filter(n => !n.isRead)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [state.novelties, markAsRead]);

  const refresh = useCallback(async () => {
    await loadNovelties();
  }, [loadNovelties]);

  const getNoveltyById = useCallback((id: string): Novelty | undefined => {
    return state.novelties.find(n => n.id === id);
  }, [state.novelties]);

  const getNoveltyByPriority = useCallback((priority: string): Novelty[] => {
    return state.novelties.filter(n => n.priority === priority);
  }, [state.novelties]);

  const getExpiringSoon = useCallback((hours: number = 24): Novelty[] => {
    return state.novelties.filter(n => n.remainingHours <= hours);
  }, [state.novelties]);

  // Auto-refresh
  useEffect(() => {
    loadNovelties();
    
    if (autoRefresh) {
      const interval = setInterval(loadNovelties, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadNovelties, autoRefresh, refreshInterval]);

  return {
    // Estado
    novelties: state.novelties,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    stats: state.stats,
    
    // Ações
    refresh,
    markAsRead,
    markAllAsRead,
    
    // Utilitários
    getNoveltyById,
    getNoveltyByPriority,
    getExpiringSoon,
    
    // Dados derivados
    hasNovelties: state.novelties.length > 0,
    unreadCount: state.stats?.unread || 0,
    urgentCount: state.stats?.byPriority?.urgent || 0,
    highPriorityCount: (state.stats?.byPriority?.urgent || 0) + (state.stats?.byPriority?.high || 0),
    expiringSoonCount: state.novelties.filter(n => n.remainingHours <= 24).length
  };
};

export default useMovements;
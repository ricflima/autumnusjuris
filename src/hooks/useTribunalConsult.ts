// src/hooks/useTribunalConsult.ts

import { useState, useCallback } from 'react';
import TribunalMovementsService, { MovementQueryResult } from '@/services/tribunalMovements.service';

/**
 * Configuração da consulta
 */
interface ConsultConfig {
  useCache?: boolean;
  enablePersistence?: boolean;
  enableNoveltyDetection?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Estado da consulta
 */
interface ConsultState {
  isLoading: boolean;
  result: MovementQueryResult | null;
  error: string | null;
  lastQuery: string | null;
  queryCount: number;
}

/**
 * Hook personalizado para consultas de tribunal
 */
export const useTribunalConsult = (config: ConsultConfig = {}) => {
  const [state, setState] = useState<ConsultState>({
    isLoading: false,
    result: null,
    error: null,
    lastQuery: null,
    queryCount: 0
  });

  const service = TribunalMovementsService.getInstance();

  const consultProcess = useCallback(async (processNumber: string) => {
    if (!processNumber?.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Número do processo é obrigatório'
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastQuery: processNumber
    }));

    try {
      await service.initialize();
      
      const result = await service.queryMovements(processNumber, {
        useCache: config.useCache ?? true,
        enablePersistence: config.enablePersistence ?? true,
        enableNoveltyDetection: config.enableNoveltyDetection ?? true
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        result,
        queryCount: prev.queryCount + 1,
        error: result.success ? null : result.error || 'Erro na consulta'
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        queryCount: prev.queryCount + 1
      }));

      return null;
    }
  }, [service, config]);

  const validateCNJ = useCallback((processNumber: string) => {
    return service.validateCNJNumber(processNumber);
  }, [service]);

  const clearResult = useCallback(() => {
    setState({
      isLoading: false,
      result: null,
      error: null,
      lastQuery: null,
      queryCount: 0
    });
  }, []);

  const retry = useCallback(() => {
    if (state.lastQuery) {
      return consultProcess(state.lastQuery);
    }
    return Promise.resolve(null);
  }, [state.lastQuery, consultProcess]);

  return {
    // Estado
    isLoading: state.isLoading,
    result: state.result,
    error: state.error,
    lastQuery: state.lastQuery,
    queryCount: state.queryCount,
    
    // Ações
    consultProcess,
    validateCNJ,
    clearResult,
    retry,
    
    // Dados derivados
    hasResult: !!state.result,
    hasError: !!state.error,
    isSuccess: state.result?.success === true,
    newMovements: state.result?.newMovements || 0,
    totalMovements: state.result?.totalMovements || 0,
    fromCache: state.result?.fromCache || false,
    tribunal: state.result?.tribunal || null,
    novelties: state.result?.novelties || []
  };
};

export default useTribunalConsult;
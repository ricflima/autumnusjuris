// src/hooks/useAnalytics.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import analyticsService from '@/services/analytics';
import type {
  AnalyticsFilters,
  BusinessIntelligenceData,
  PredictiveInsight,
  KPITarget,
  ReportConfiguration,
  GeneratedReport,
  ReportTemplate,
  UseAnalyticsReturn,
  UseReportGeneratorReturn
} from '@/types/analytics';

// Analytics Query Keys
export const ANALYTICS_KEYS = {
  all: ['analytics'] as const,
  data: (filters: AnalyticsFilters) => [...ANALYTICS_KEYS.all, 'data', filters] as const,
  insights: () => [...ANALYTICS_KEYS.all, 'insights'] as const,
  kpis: () => [...ANALYTICS_KEYS.all, 'kpis'] as const,
  revenue: (filters: AnalyticsFilters) => [...ANALYTICS_KEYS.all, 'revenue', filters] as const,
  clients: (filters: AnalyticsFilters) => [...ANALYTICS_KEYS.all, 'clients', filters] as const,
  cashflow: (filters: AnalyticsFilters) => [...ANALYTICS_KEYS.all, 'cashflow', filters] as const,
  reports: () => [...ANALYTICS_KEYS.all, 'reports'] as const,
  templates: () => [...ANALYTICS_KEYS.all, 'templates'] as const,
};

/**
 * Hook principal para dados de analytics
 */
export function useAnalytics(filters: AnalyticsFilters = {
  period: 'month',
  groupBy: 'day'
}): UseAnalyticsReturn {
  const query = useQuery({
    queryKey: ANALYTICS_KEYS.data(filters),
    queryFn: () => analyticsService.getAnalyticsData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook para projeções de receita
 */
export function useRevenueProjection(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.revenue(filters),
    queryFn: () => analyticsService.getRevenueProjection(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook para análise de rentabilidade de clientes
 */
export function useClientProfitability(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.clients(filters),
    queryFn: () => analyticsService.getClientProfitability(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook para projeção de fluxo de caixa
 */
export function useCashFlowProjection(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.cashflow(filters),
    queryFn: () => analyticsService.getCashFlowProjection(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook para insights preditivos
 */
export function usePredictiveInsights(category?: string) {
  return useQuery({
    queryKey: [...ANALYTICS_KEYS.insights(), category],
    queryFn: () => analyticsService.getPredictiveInsights(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para KPIs e metas
 */
export function useKPITargets() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.kpis(),
    queryFn: () => analyticsService.getKPITargets(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook para geração de relatórios
 */
export function useReportGenerator(): UseReportGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const generateReport = useCallback(async (config: ReportConfiguration): Promise<GeneratedReport> => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const report = await analyticsService.generateReport(config);
      
      clearInterval(progressInterval);
      setProgress(100);

      // Invalidar cache de relatórios
      queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.reports() });

      return report;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [queryClient]);

  return {
    generateReport,
    isGenerating,
    error,
    progress,
  };
}

/**
 * Hook para templates de relatório
 */
export function useReportTemplates() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.templates(),
    queryFn: () => analyticsService.getReportTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook para relatórios gerados
 */
export function useGeneratedReports() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.reports(),
    queryFn: () => analyticsService.getGeneratedReports(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook para salvar template de relatório
 */
export function useSaveReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: ReportTemplate) => analyticsService.saveReportTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYTICS_KEYS.templates() });
    },
  });
}

/**
 * Hook personalizado para cálculos de analytics
 */
export function useAnalyticsCalculations() {
  const formatCurrency = (amount: number, currency: string = 'BRL'): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const calculateROI = (gain: number, cost: number): number => {
    if (cost === 0) return 0;
    return ((gain - cost) / cost) * 100;
  };

  const calculateMovingAverage = (data: number[], window: number): number[] => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(data[i]);
      } else {
        const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
    }
    return result;
  };

  const predictTrend = (data: number[]): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-3);
    const older = data.slice(-6, -3);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  };

  return {
    formatCurrency,
    formatPercentage,
    calculateGrowth,
    calculateROI,
    calculateMovingAverage,
    predictTrend,
  };
}

/**
 * Hook para configuração de dashboard
 */
export function useDashboardConfig(userId: string) {
  const defaultConfig = useMemo(() => ({
    layout: {
      widgets: [],
      columns: 12,
      theme: 'light' as const,
    },
    preferences: {
      defaultPeriod: 'month',
      refreshInterval: 5,
      notifications: true,
      emailReports: false,
    },
    customMetrics: [],
  }), []);

  // Em produção, isso viria de uma API
  const [config, setConfig] = useState(defaultConfig);

  const updateConfig = useCallback((updates: any) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    config,
    updateConfig,
  };
}

/**
 * Hook para filtros de analytics
 */
export function useAnalyticsFilters(initialFilters: Partial<AnalyticsFilters> = {}) {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'month',
    groupBy: 'day',
    ...initialFilters,
  });

  const updateFilters = useCallback((updates: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      period: 'month',
      groupBy: 'day',
      ...initialFilters,
    });
  }, [initialFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
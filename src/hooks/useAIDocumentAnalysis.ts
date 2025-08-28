import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiDocumentAnalysisService } from '../services/aiDocumentAnalysis.service';
import { AnalysisType, AnalysisTemplate } from '../types/aiDocumentAnalysis';

export function useAIDocumentAnalysis() {
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => aiDocumentAnalysisService.getAvailableModels(),
  });

  const templatesQuery = useQuery({
    queryKey: ['analysis-templates'],
    queryFn: () => aiDocumentAnalysisService.getAnalysisTemplates(),
  });

  const analysesQuery = useQuery({
    queryKey: ['document-analyses'],
    queryFn: () => aiDocumentAnalysisService.getDocumentAnalyses(),
  });

  const startAnalysisMutation = useMutation({
    mutationFn: ({
      documentId,
      documentName,
      analysisTypes,
      templateId
    }: {
      documentId: string;
      documentName: string;
      analysisTypes: AnalysisType[];
      templateId?: string;
    }) => aiDocumentAnalysisService.startDocumentAnalysis(
      documentId,
      documentName,
      analysisTypes,
      templateId
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-analyses'] });
    },
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: (analysisId: string) =>
      aiDocumentAnalysisService.deleteAnalysis(analysisId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-analyses'] });
    },
  });

  const exportReportMutation = useMutation({
    mutationFn: ({ analysisId, format }: { 
      analysisId: string; 
      format: 'pdf' | 'docx' | 'json'; 
    }) => aiDocumentAnalysisService.exportAnalysisReport(analysisId, format),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<AnalysisTemplate, 'id'>) =>
      aiDocumentAnalysisService.createAnalysisTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-templates'] });
    },
  });

  return {
    // Queries
    models: modelsQuery.data || [],
    templates: templatesQuery.data || [],
    analyses: analysesQuery.data || [],
    isLoading: modelsQuery.isLoading || templatesQuery.isLoading || analysesQuery.isLoading,
    
    // Mutations
    startAnalysis: startAnalysisMutation.mutateAsync,
    deleteAnalysis: deleteAnalysisMutation.mutateAsync,
    exportReport: exportReportMutation.mutateAsync,
    createTemplate: createTemplateMutation.mutateAsync,
    
    // Loading states
    isStartingAnalysis: startAnalysisMutation.isPending,
    isDeletingAnalysis: deleteAnalysisMutation.isPending,
    isExportingReport: exportReportMutation.isPending,
    isCreatingTemplate: createTemplateMutation.isPending,
    
    // Results
    exportedReportUrl: exportReportMutation.data,
  };
}

export function useDocumentAnalyses(documentId: string) {
  return useQuery({
    queryKey: ['document-analyses', documentId],
    queryFn: () => aiDocumentAnalysisService.getDocumentAnalyses(documentId),
    enabled: !!documentId,
  });
}

export function useAnalysisStatus(analysisId: string) {
  return useQuery({
    queryKey: ['analysis-status', analysisId],
    queryFn: () => aiDocumentAnalysisService.getAnalysisStatus(analysisId),
    enabled: !!analysisId,
    refetchInterval: (query) => {
      // Refetch a cada 2 segundos se ainda estiver processando
      return query.state.data?.status === 'processing' ? 2000 : false;
    },
  });
}
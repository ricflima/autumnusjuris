import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tribunalIntegrationService } from '../services/tribunalIntegration.service';
import { TribunalConfig, PetitionFiling } from '../types/tribunalIntegration';

export function useTribunalIntegration() {
  const queryClient = useQueryClient();

  const configsQuery = useQuery({
    queryKey: ['tribunal-configs'],
    queryFn: () => tribunalIntegrationService.getTribunalConfigs(),
  });

  const notificationsQuery = useQuery({
    queryKey: ['tribunal-notifications'],
    queryFn: () => tribunalIntegrationService.getTribunalNotifications(),
  });

  const hearingsQuery = useQuery({
    queryKey: ['tribunal-hearings'],
    queryFn: () => tribunalIntegrationService.getHearingSchedule(),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (config: TribunalConfig) =>
      tribunalIntegrationService.updateTribunalConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribunal-configs'] });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (tribunalId: string) =>
      tribunalIntegrationService.testTribunalConnection(tribunalId),
  });

  const consultProcessMutation = useMutation({
    mutationFn: ({ processNumber, tribunal }: { 
      processNumber: string; 
      tribunal?: string; 
    }) => tribunalIntegrationService.consultProcess(processNumber, tribunal),
  });

  const syncTribunalMutation = useMutation({
    mutationFn: (tribunalId: string) =>
      tribunalIntegrationService.syncTribunalData(tribunalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribunal-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['tribunal-hearings'] });
    },
  });

  const syncAllTribunalsMutation = useMutation({
    mutationFn: () => tribunalIntegrationService.syncAllTribunals(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribunal-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['tribunal-hearings'] });
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      tribunalIntegrationService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribunal-notifications'] });
    },
  });

  const submitPetitionMutation = useMutation({
    mutationFn: (petition: Omit<PetitionFiling, 'id' | 'status' | 'submittedAt'>) =>
      tribunalIntegrationService.submitPetition(petition),
  });

  return {
    // Queries
    configs: configsQuery.data || [],
    notifications: notificationsQuery.data || [],
    hearings: hearingsQuery.data || [],
    isLoading: configsQuery.isLoading || notificationsQuery.isLoading || hearingsQuery.isLoading,
    
    // Mutations
    updateConfig: updateConfigMutation.mutateAsync,
    testConnection: testConnectionMutation.mutateAsync,
    consultProcess: consultProcessMutation.mutateAsync,
    syncTribunal: syncTribunalMutation.mutateAsync,
    syncAllTribunals: syncAllTribunalsMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutateAsync,
    submitPetition: submitPetitionMutation.mutateAsync,
    
    // Loading states
    isUpdatingConfig: updateConfigMutation.isPending,
    isTestingConnection: testConnectionMutation.isPending,
    isConsultingProcess: consultProcessMutation.isPending,
    isSyncing: syncTribunalMutation.isPending || syncAllTribunalsMutation.isPending,
    isMarkingRead: markNotificationReadMutation.isPending,
    isSubmittingPetition: submitPetitionMutation.isPending,
    
    // Results
    connectionTestResult: testConnectionMutation.data,
    consultationResult: consultProcessMutation.data,
  };
}

export function useProcessMovements(processNumber: string) {
  return useQuery({
    queryKey: ['process-movements', processNumber],
    queryFn: () => tribunalIntegrationService.getProcessMovements(processNumber),
    enabled: !!processNumber,
  });
}

export function useProcessHearings(processNumber: string) {
  return useQuery({
    queryKey: ['process-hearings', processNumber],
    queryFn: () => tribunalIntegrationService.getHearingSchedule(processNumber),
    enabled: !!processNumber,
  });
}
// src/contexts/TribunalNotificationsContext.tsx

import React, { createContext, useContext, useEffect } from 'react';
import { useTribunalNotifications } from '@/hooks/useTribunalNotifications';
import { tribunalSchedulerService } from '@/services/tribunalScheduler.service';
import { TribunalType, MovimentacaoTribunal } from '@/types/tribunalIntegration';

interface TribunalNotificationsContextType {
  notifications: any[];
  settings: any;
  unreadCount: number;
  addNotification: (
    processId: string,
    processNumber: string,
    tribunal: TribunalType,
    movement: MovimentacaoTribunal,
    priority?: 'low' | 'medium' | 'high'
  ) => string | undefined;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  updateSettings: (settings: any) => void;
  getNotificationsForProcess: (processId: string) => any[];
  getStats: () => any;
  requestBrowserNotificationPermission: () => Promise<boolean>;
  showBrowserNotification: (notification: any) => void;
}

const TribunalNotificationsContext = createContext<TribunalNotificationsContextType | undefined>(undefined);

export function TribunalNotificationsProvider({ children }: { children: React.ReactNode }) {
  const tribunalNotifications = useTribunalNotifications();

  // Integrar com o scheduler para receber notificações automáticas
  useEffect(() => {
    // Simular recebimento de notificações do scheduler
    const handleSchedulerUpdate = () => {
      const jobs = tribunalSchedulerService.getScheduledJobs();
      
      // Verificar jobs que foram executados recentemente
      jobs.forEach(job => {
        if (job.lastResult === 'success' && job.lastExecution) {
          const lastExecution = new Date(job.lastExecution);
          const oneMinuteAgo = new Date(Date.now() - 60000);
          
          // Se foi executado no último minuto e teve sucesso
          if (lastExecution > oneMinuteAgo) {
            // Simular nova movimentação encontrada
            if (Math.random() > 0.7) { // 30% de chance de ter nova movimentação
              const mockMovement: MovimentacaoTribunal = {
                id: `mock-${Date.now()}`,
                data: new Date().toISOString().split('T')[0],
                titulo: 'Nova movimentação detectada automaticamente',
                descricao: `Movimentação encontrada durante consulta automática ao ${job.tribunalName}`,
                oficial: true
              };

              tribunalNotifications.addNotification(
                job.processId,
                `${job.processId}-processo`,
                job.tribunalType,
                mockMovement,
                'medium'
              );
            }
          }
        }
      });
    };

    // Verificar a cada 2 minutos por atualizações do scheduler
    const interval = setInterval(handleSchedulerUpdate, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tribunalNotifications]);

  // Solicitar permissão para notificações do browser quando o provider é montado
  useEffect(() => {
    if (tribunalNotifications.settings.enabled) {
      tribunalNotifications.requestBrowserNotificationPermission();
    }
  }, [tribunalNotifications.settings.enabled, tribunalNotifications.requestBrowserNotificationPermission]);

  return (
    <TribunalNotificationsContext.Provider value={tribunalNotifications}>
      {children}
    </TribunalNotificationsContext.Provider>
  );
}

export function useTribunalNotificationsContext() {
  const context = useContext(TribunalNotificationsContext);
  if (context === undefined) {
    throw new Error('useTribunalNotificationsContext deve ser usado dentro de TribunalNotificationsProvider');
  }
  return context;
}

export default TribunalNotificationsContext;
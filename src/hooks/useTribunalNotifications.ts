// src/hooks/useTribunalNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  TribunalType, 
  MovimentacaoTribunal, 
  NotificationConfig,
  TRIBUNAL_NAMES 
} from '@/types/tribunalIntegration';

interface NotificationSettings {
  enabled: boolean;
  showToasts: boolean;
  playSound: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  filters: {
    onlyOfficial: boolean;
    tribunals: TribunalType[];
    keywords: string[];
  };
}

interface TribunalNotification {
  id: string;
  processId: string;
  processNumber: string;
  tribunal: TribunalType;
  tribunalName: string;
  movement: MovimentacaoTribunal;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function useTribunalNotifications(processIds?: string[]) {
  const [notifications, setNotifications] = useState<TribunalNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    showToasts: true,
    playSound: false,
    emailNotifications: false,
    whatsappNotifications: false,
    filters: {
      onlyOfficial: false,
      tribunals: [],
      keywords: []
    }
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('tribunal-notifications-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Erro ao carregar configurações de notificação:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('tribunal-notifications-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Adicionar nova notificação
  const addNotification = useCallback((
    processId: string,
    processNumber: string,
    tribunal: TribunalType,
    movement: MovimentacaoTribunal,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!settings.enabled) return;

    // Aplicar filtros
    if (settings.filters.onlyOfficial && !movement.oficial) return;
    
    if (settings.filters.tribunals.length > 0 && !settings.filters.tribunals.includes(tribunal)) {
      return;
    }

    if (settings.filters.keywords.length > 0) {
      const hasKeyword = settings.filters.keywords.some(keyword =>
        movement.titulo.toLowerCase().includes(keyword.toLowerCase()) ||
        movement.descricao.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return;
    }

    const notification: TribunalNotification = {
      id: `${processId}-${tribunal}-${movement.id}-${Date.now()}`,
      processId,
      processNumber,
      tribunal,
      tribunalName: TRIBUNAL_NAMES[tribunal] || tribunal,
      movement,
      timestamp: new Date().toISOString(),
      read: false,
      priority
    };

    setNotifications(prev => [notification, ...prev]);

    // Mostrar toast se habilitado
    if (settings.showToasts) {
      showNotificationToast(notification);
    }

    // Reproduzir som se habilitado
    if (settings.playSound) {
      playNotificationSound(priority);
    }

    // Enviar notificação por email/WhatsApp se habilitado
    if (settings.emailNotifications || settings.whatsappNotifications) {
      sendExternalNotification(notification);
    }

    return notification.id;
  }, [settings]);

  // Mostrar toast de notificação
  const showNotificationToast = (notification: TribunalNotification) => {
    const message = `${notification.tribunalName}: ${notification.movement.titulo}`;
    
    const toastOptions = {
      duration: 6000,
      position: 'top-right' as const,
      icon: '⚖️',
    };

    switch (notification.priority) {
      case 'high':
        toast.error(message, { ...toastOptions, duration: 10000 });
        break;
      case 'medium':
        toast.success(message, toastOptions);
        break;
      case 'low':
        toast(message, { ...toastOptions, duration: 4000 });
        break;
    }
  };

  // Reproduzir som de notificação
  const playNotificationSound = (priority: 'low' | 'medium' | 'high') => {
    try {
      // Criar contexto de áudio se não existir
      if (typeof window !== 'undefined' && window.AudioContext) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Frequências diferentes para cada prioridade
        const frequencies = {
          low: 400,
          medium: 600,
          high: 800
        };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequencies[priority], audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } catch (error) {
      console.warn('Erro ao reproduzir som de notificação:', error);
    }
  };

  // Enviar notificação externa (email/WhatsApp)
  const sendExternalNotification = async (notification: TribunalNotification) => {
    try {
      // Em produção, aqui seria feita a chamada real para envio de notificações
      console.log('Enviando notificação externa:', {
        email: settings.emailNotifications,
        whatsapp: settings.whatsappNotifications,
        notification
      });

      // Mock de envio
      if (settings.emailNotifications) {
        // Simular envio de email
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (settings.whatsappNotifications) {
        // Simular envio de WhatsApp
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.error('Erro ao enviar notificação externa:', error);
    }
  };

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Remover notificação
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Limpar todas as notificações
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Limpar notificações antigas (mais de 7 dias)
  const clearOldNotifications = useCallback(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    setNotifications(prev =>
      prev.filter(notification => new Date(notification.timestamp) > weekAgo)
    );
  }, []);

  // Filtrar notificações por processo
  const getNotificationsForProcess = useCallback((processId: string) => {
    return notifications.filter(n => n.processId === processId);
  }, [notifications]);

  // Obter estatísticas
  const getStats = useCallback(() => {
    const unread = notifications.filter(n => !n.read).length;
    const byPriority = {
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
      low: notifications.filter(n => n.priority === 'low').length
    };
    const byTribunal = notifications.reduce((acc, n) => {
      acc[n.tribunal] = (acc[n.tribunal] || 0) + 1;
      return acc;
    }, {} as Record<TribunalType, number>);

    return {
      total: notifications.length,
      unread,
      byPriority,
      byTribunal
    };
  }, [notifications]);

  // Solicitar permissão para notificações do browser
  const requestBrowserNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Mostrar notificação nativa do browser
  const showBrowserNotification = useCallback((notification: TribunalNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(
        `${notification.tribunalName} - Nova Movimentação`,
        {
          body: notification.movement.titulo,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: notification.priority === 'high'
        }
      );

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        markAsRead(notification.id);
      };

      // Auto-fechar após alguns segundos
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }, [markAsRead]);

  // Limpar notificações antigas automaticamente
  useEffect(() => {
    const interval = setInterval(clearOldNotifications, 24 * 60 * 60 * 1000); // Uma vez por dia
    return () => clearInterval(interval);
  }, [clearOldNotifications]);

  return {
    notifications,
    settings,
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,
    getNotificationsForProcess,
    getStats,
    requestBrowserNotificationPermission,
    showBrowserNotification
  };
}
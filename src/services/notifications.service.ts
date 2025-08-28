import {
  AdvancedNotification,
  NotificationTemplate,
  NotificationCampaign,
  NotificationSettings,
  NotificationAnalytics,
  NotificationChannel,
  NotificationRecipient
} from '../types/notifications';

class NotificationService {
  private mockNotifications: AdvancedNotification[] = [
    {
      id: 'notif-1',
      title: 'Prazo de Contestação',
      message: 'Prazo para apresentar contestação expira em 3 dias.',
      type: 'deadline',
      priority: 'high',
      category: 'legal',
      recipients: [
        {
          id: 'user-1',
          type: 'user',
          name: 'João Silva',
          email: 'joao@email.com',
          preferences: {
            channels: { push: true, email: true, sms: false, whatsapp: true, in_app: true, webhook: false },
            categories: { legal: true, financial: true, administrative: true, client: true, system: false, marketing: false },
            quietHours: { enabled: true, start: '22:00', end: '07:00' },
            frequency: 'immediate'
          },
          status: 'delivered',
          sentAt: '2025-01-26T09:00:00Z',
          deliveredAt: '2025-01-26T09:00:05Z'
        }
      ],
      channels: ['push', 'email', 'whatsapp'],
      status: 'delivered',
      sentAt: '2025-01-26T09:00:00Z',
      actionUrl: '/cases/123',
      actionText: 'Ver Processo',
      data: {
        processNumber: '1001234-12.2025.8.26.0100',
        deadline: '2025-01-29T23:59:59Z'
      },
      createdBy: 'system',
      createdAt: '2025-01-26T08:55:00Z',
      updatedAt: '2025-01-26T09:00:05Z'
    }
  ];

  private mockTemplates: NotificationTemplate[] = [
    {
      id: 'template-deadline',
      name: 'Aviso de Prazo',
      description: 'Template para avisos de prazos processuais',
      type: 'deadline',
      category: 'legal',
      channels: ['push', 'email', 'whatsapp'],
      subject: 'Prazo {{processType}} - {{daysRemaining}} dias',
      content: {
        email: {
          html: '<p>Olá {{userName}},</p><p>O prazo para {{processType}} do processo {{processNumber}} expira em {{daysRemaining}} dias.</p>',
          text: 'Olá {{userName}}, O prazo para {{processType}} do processo {{processNumber}} expira em {{daysRemaining}} dias.'
        },
        sms: {
          message: 'Prazo {{processType}} expira em {{daysRemaining}} dias. Processo: {{processNumber}}'
        },
        push: {
          title: 'Prazo {{processType}}',
          body: 'Expira em {{daysRemaining}} dias - {{processNumber}}',
          icon: '/icons/deadline.png'
        },
        whatsapp: {
          message: '⚖️ *Aviso de Prazo*\n\nOlá {{userName}}!\n\nO prazo para {{processType}} do processo {{processNumber}} expira em {{daysRemaining}} dias.\n\n📅 Data limite: {{deadlineDate}}'
        }
      },
      variables: [
        { name: 'userName', description: 'Nome do usuário', type: 'string', required: true },
        { name: 'processType', description: 'Tipo do processo', type: 'string', required: true },
        { name: 'processNumber', description: 'Número do processo', type: 'string', required: true },
        { name: 'daysRemaining', description: 'Dias restantes', type: 'number', required: true },
        { name: 'deadlineDate', description: 'Data do prazo', type: 'date', required: true }
      ],
      isActive: true,
      createdAt: '2025-01-20T10:00:00Z',
      updatedAt: '2025-01-25T14:30:00Z'
    }
  ];

  private mockCampaigns: NotificationCampaign[] = [
    {
      id: 'campaign-1',
      name: 'Lembretes de Prazos Semanais',
      description: 'Campanha automática para lembrar prazos que expiram na semana',
      type: 'recurring',
      templateId: 'template-deadline',
      targetAudience: {
        type: 'all',
        filters: [
          { field: 'role', operator: 'equals', value: 'lawyer' }
        ]
      },
      schedule: {
        type: 'recurring',
        recurring: {
          frequency: 'weekly',
          interval: 1
        }
      },
      status: 'active',
      statistics: {
        totalRecipients: 25,
        sent: 125,
        delivered: 122,
        read: 98,
        clicked: 45,
        failed: 3,
        unsubscribed: 1,
        deliveryRate: 0.976,
        openRate: 0.803,
        clickRate: 0.459
      },
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-26T09:00:00Z'
    }
  ];

  private mockSettings: NotificationSettings = {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: true,
    providers: {
      push: { service: 'firebase', config: { serverKey: 'xxx' }, isActive: true },
      email: { service: 'smtp', config: { host: 'smtp.gmail.com' }, isActive: true },
      sms: { service: 'twilio', config: { accountSid: 'xxx' }, isActive: false },
      whatsapp: { service: 'twilio', config: { accountSid: 'xxx' }, isActive: true }
    },
    rateLimiting: {
      enabled: true,
      maxPerMinute: 60,
      maxPerHour: 1000,
      maxPerDay: 10000
    },
    retryPolicy: {
      enabled: true,
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoffDelay: 300000
    }
  };

  async getNotifications(
    limit?: number,
    offset?: number,
    filters?: Record<string, any>
  ): Promise<{ notifications: AdvancedNotification[]; total: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let notifications = [...this.mockNotifications];
        
        if (filters) {
          if (filters.status) {
            notifications = notifications.filter(n => n.status === filters.status);
          }
          if (filters.type) {
            notifications = notifications.filter(n => n.type === filters.type);
          }
          if (filters.priority) {
            notifications = notifications.filter(n => n.priority === filters.priority);
          }
        }
        
        const total = notifications.length;
        
        if (offset) {
          notifications = notifications.slice(offset);
        }
        if (limit) {
          notifications = notifications.slice(0, limit);
        }
        
        resolve({ notifications, total });
      }, 500);
    });
  }

  async createNotification(notification: Omit<AdvancedNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdvancedNotification> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newNotification: AdvancedNotification = {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.mockNotifications.push(newNotification);
        resolve(newNotification);
      }, 800);
    });
  }

  async sendNotification(notificationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notification = this.mockNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.status = 'sent';
          notification.sentAt = new Date().toISOString();
          notification.updatedAt = new Date().toISOString();
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000);
    });
  }

  async sendBulkNotification(
    templateId: string,
    recipients: string[],
    variables: Record<string, any>,
    channels: NotificationChannel[]
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sent = Math.floor(recipients.length * 0.95); // 95% success rate
        const failed = recipients.length - sent;
        
        resolve({
          success: true,
          sent,
          failed
        });
      }, 2000);
    });
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.mockTemplates]), 300);
    });
  }

  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTemplate: NotificationTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.mockTemplates.push(newTemplate);
        resolve(newTemplate);
      }, 500);
    });
  }

  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const template = this.mockTemplates.find(t => t.id === templateId);
        if (template) {
          Object.assign(template, updates, { updatedAt: new Date().toISOString() });
          resolve(template);
        } else {
          resolve(null);
        }
      }, 500);
    });
  }

  async getCampaigns(): Promise<NotificationCampaign[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.mockCampaigns]), 400);
    });
  }

  async createCampaign(campaign: Omit<NotificationCampaign, 'id' | 'statistics' | 'createdAt' | 'updatedAt'>): Promise<NotificationCampaign> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCampaign: NotificationCampaign = {
          ...campaign,
          id: `campaign-${Date.now()}`,
          statistics: {
            totalRecipients: 0,
            sent: 0,
            delivered: 0,
            read: 0,
            clicked: 0,
            failed: 0,
            unsubscribed: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.mockCampaigns.push(newCampaign);
        resolve(newCampaign);
      }, 600);
    });
  }

  async getSettings(): Promise<NotificationSettings> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...this.mockSettings }), 200);
    });
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return new Promise((resolve) => {
      setTimeout(() => {
        Object.assign(this.mockSettings, settings);
        resolve({ ...this.mockSettings });
      }, 400);
    });
  }

  async getAnalytics(
    period: 'hour' | 'day' | 'week' | 'month',
    startDate: string,
    endDate: string
  ): Promise<NotificationAnalytics> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock analytics data
        const analytics: NotificationAnalytics = {
          period,
          startDate,
          endDate,
          metrics: {
            totalSent: 1250,
            totalDelivered: 1198,
            totalRead: 987,
            totalFailed: 52,
            averageDeliveryTime: 2500,
            deliveryRate: 0.958,
            openRate: 0.824,
            clickRate: 0.345
          },
          byChannel: {
            push: { totalSent: 450, totalDelivered: 435, totalRead: 380, totalFailed: 15, averageDeliveryTime: 1200, deliveryRate: 0.967, openRate: 0.873, clickRate: 0.421 },
            email: { totalSent: 400, totalDelivered: 385, totalRead: 310, totalFailed: 15, averageDeliveryTime: 3200, deliveryRate: 0.963, openRate: 0.805, clickRate: 0.287 },
            whatsapp: { totalSent: 300, totalDelivered: 295, totalRead: 250, totalFailed: 5, averageDeliveryTime: 1800, deliveryRate: 0.983, openRate: 0.847, clickRate: 0.392 },
            sms: { totalSent: 100, totalDelivered: 83, totalRead: 47, totalFailed: 17, averageDeliveryTime: 5000, deliveryRate: 0.830, openRate: 0.566, clickRate: 0.213 },
            in_app: { totalSent: 0, totalDelivered: 0, totalRead: 0, totalFailed: 0, averageDeliveryTime: 0, deliveryRate: 0, openRate: 0, clickRate: 0 },
            webhook: { totalSent: 0, totalDelivered: 0, totalRead: 0, totalFailed: 0, averageDeliveryTime: 0, deliveryRate: 0, openRate: 0, clickRate: 0 }
          },
          byCategory: {
            legal: { totalSent: 600, totalDelivered: 580, totalRead: 520, totalFailed: 20, averageDeliveryTime: 2200, deliveryRate: 0.967, openRate: 0.897, clickRate: 0.456 },
            financial: { totalSent: 300, totalDelivered: 290, totalRead: 230, totalFailed: 10, averageDeliveryTime: 2800, deliveryRate: 0.967, openRate: 0.793, clickRate: 0.287 },
            administrative: { totalSent: 200, totalDelivered: 195, totalRead: 145, totalFailed: 5, averageDeliveryTime: 2400, deliveryRate: 0.975, openRate: 0.744, clickRate: 0.234 },
            client: { totalSent: 100, totalDelivered: 95, totalRead: 70, totalFailed: 5, averageDeliveryTime: 3000, deliveryRate: 0.950, openRate: 0.737, clickRate: 0.314 },
            system: { totalSent: 50, totalDelivered: 38, totalRead: 22, totalFailed: 12, averageDeliveryTime: 1500, deliveryRate: 0.760, openRate: 0.579, clickRate: 0.182 },
            marketing: { totalSent: 0, totalDelivered: 0, totalRead: 0, totalFailed: 0, averageDeliveryTime: 0, deliveryRate: 0, openRate: 0, clickRate: 0 }
          },
          timeline: [
            { timestamp: '2025-01-26T00:00:00Z', sent: 120, delivered: 115, read: 95, failed: 5 },
            { timestamp: '2025-01-26T01:00:00Z', sent: 85, delivered: 82, read: 68, failed: 3 },
            { timestamp: '2025-01-26T02:00:00Z', sent: 45, delivered: 44, read: 38, failed: 1 }
          ]
        };
        
        resolve(analytics);
      }, 800);
    });
  }

  async testProvider(channel: NotificationChannel): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulação de teste de provedor
        const success = Math.random() > 0.2; // 80% chance de sucesso
        resolve({
          success,
          message: success 
            ? `Teste do provedor ${channel} realizado com sucesso`
            : `Falha no teste do provedor ${channel}: Configuração inválida`
        });
      }, 1500);
    });
  }

  async scheduleNotification(notificationId: string, scheduledFor: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notification = this.mockNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.status = 'scheduled';
          notification.scheduledFor = scheduledFor;
          notification.updatedAt = new Date().toISOString();
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notification = this.mockNotifications.find(n => n.id === notificationId);
        if (notification && ['draft', 'scheduled'].includes(notification.status)) {
          notification.status = 'cancelled';
          notification.updatedAt = new Date().toISOString();
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
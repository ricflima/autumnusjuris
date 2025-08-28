import {
  TribunalConfig,
  ProcessMovement,
  TribunalNotification,
  ProcessConsultation,
  HearingSchedule,
  PetitionFiling,
  TribunalSyncStatus
} from '../types/tribunalIntegration';

class TribunalIntegrationService {
  // Mock data para demonstração
  private mockConfigs: TribunalConfig[] = [
    {
      id: 'tjsp-001',
      name: 'TJSP - Tribunal de Justiça de São Paulo',
      type: 'tjsp',
      apiUrl: 'https://esaj.tjsp.jus.br/esaj',
      isActive: true,
      supportedFeatures: [
        'process_consultation',
        'movement_tracking',
        'document_download',
        'hearing_schedule'
      ]
    },
    {
      id: 'tjrj-001',
      name: 'TJRJ - Tribunal de Justiça do Rio de Janeiro',
      type: 'tjrj',
      apiUrl: 'https://www4.tjrj.jus.br',
      isActive: false,
      supportedFeatures: [
        'process_consultation',
        'movement_tracking',
        'notification_receipt'
      ]
    }
  ];

  private mockNotifications: TribunalNotification[] = [
    {
      id: 'notif-1',
      processNumber: '1001234-12.2025.8.26.0100',
      tribunal: 'TJSP',
      type: 'intimation',
      title: 'Intimação para apresentar defesa',
      content: 'Fica a parte intimada para apresentar defesa no prazo de 15 dias.',
      deadline: '2025-02-10T23:59:59Z',
      isRead: false,
      receivedAt: '2025-01-26T09:00:00Z',
      documentUrl: '/documents/intimacao-123.pdf'
    },
    {
      id: 'notif-2',
      processNumber: '2002345-23.2025.8.26.0200',
      tribunal: 'TJSP',
      type: 'decision',
      title: 'Decisão Interlocutória',
      content: 'Foi proferida decisão interlocutória nos autos.',
      isRead: true,
      receivedAt: '2025-01-25T14:30:00Z',
      documentUrl: '/documents/decisao-456.pdf'
    }
  ];

  private mockMovements: ProcessMovement[] = [
    {
      id: 'mov-1',
      processNumber: '1001234-12.2025.8.26.0100',
      date: '2025-01-26T09:00:00Z',
      description: 'Juntada de petição inicial',
      type: 'petition',
      tribunal: 'TJSP',
      lastSync: '2025-01-26T09:05:00Z'
    },
    {
      id: 'mov-2',
      processNumber: '1001234-12.2025.8.26.0100',
      date: '2025-01-25T16:30:00Z',
      description: 'Decisão de recebimento da inicial',
      type: 'decision',
      documentUrl: '/documents/decisao-recebimento.pdf',
      tribunal: 'TJSP',
      lastSync: '2025-01-26T09:05:00Z'
    }
  ];

  private mockHearings: HearingSchedule[] = [
    {
      id: 'hearing-1',
      processNumber: '1001234-12.2025.8.26.0100',
      tribunal: 'TJSP',
      date: '2025-02-15',
      time: '14:00',
      type: 'conciliation',
      location: 'Sala 205 - Fórum Central',
      judge: 'Dr. João Silva',
      status: 'scheduled',
      observations: 'Audiência de conciliação designada'
    }
  ];

  async getTribunalConfigs(): Promise<TribunalConfig[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.mockConfigs]), 300);
    });
  }

  async updateTribunalConfig(config: TribunalConfig): Promise<TribunalConfig> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.mockConfigs.findIndex(c => c.id === config.id);
        if (index > -1) {
          this.mockConfigs[index] = config;
        } else {
          this.mockConfigs.push(config);
        }
        resolve(config);
      }, 500);
    });
  }

  async testTribunalConnection(tribunalId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.mockConfigs.find(c => c.id === tribunalId);
        if (!config) {
          resolve({ success: false, message: 'Configuração de tribunal não encontrada' });
          return;
        }
        
        if (!config.isActive) {
          resolve({ success: false, message: 'Tribunal não está ativo' });
          return;
        }

        // Simulação de teste de conexão
        resolve({ success: true, message: 'Conexão estabelecida com sucesso' });
      }, 1500);
    });
  }

  async consultProcess(processNumber: string, tribunal?: string): Promise<ProcessConsultation> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!processNumber.match(/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/)) {
          reject(new Error('Número de processo inválido'));
          return;
        }

        const consultation: ProcessConsultation = {
          processNumber,
          tribunal: tribunal || 'TJSP',
          status: 'active',
          subject: 'Ação de Cobrança',
          distributionDate: '2025-01-20T10:00:00Z',
          judge: 'Dr. João Silva',
          court: '1ª Vara Cível Central',
          parties: [
            {
              name: 'João da Silva Advocacia LTDA',
              type: 'author',
              lawyer: 'João Silva',
              oab: 'OAB/SP 123456'
            },
            {
              name: 'Maria Santos',
              type: 'defendant'
            }
          ],
          movements: this.mockMovements.filter(m => m.processNumber === processNumber),
          lastMovement: this.mockMovements.find(m => m.processNumber === processNumber)
        };

        resolve(consultation);
      }, 1000);
    });
  }

  async getProcessMovements(processNumber: string): Promise<ProcessMovement[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const movements = this.mockMovements.filter(m => m.processNumber === processNumber);
        resolve(movements);
      }, 500);
    });
  }

  async getTribunalNotifications(isRead?: boolean): Promise<TribunalNotification[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let notifications = [...this.mockNotifications];
        if (typeof isRead === 'boolean') {
          notifications = notifications.filter(n => n.isRead === isRead);
        }
        resolve(notifications);
      }, 300);
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notification = this.mockNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }

  async getHearingSchedule(processNumber?: string): Promise<HearingSchedule[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let hearings = [...this.mockHearings];
        if (processNumber) {
          hearings = hearings.filter(h => h.processNumber === processNumber);
        }
        resolve(hearings);
      }, 400);
    });
  }

  async syncTribunalData(tribunalId: string): Promise<TribunalSyncStatus> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.mockConfigs.find(c => c.id === tribunalId);
        if (!config) {
          resolve({
            tribunal: tribunalId,
            lastSync: new Date().toISOString(),
            status: 'error',
            processesUpdated: 0,
            notificationsReceived: 0,
            errors: ['Configuração de tribunal não encontrada']
          });
          return;
        }

        // Simulação de sincronização
        resolve({
          tribunal: config.name,
          lastSync: new Date().toISOString(),
          status: 'success',
          processesUpdated: Math.floor(Math.random() * 10) + 1,
          notificationsReceived: Math.floor(Math.random() * 5) + 1
        });
      }, 3000);
    });
  }

  async syncAllTribunals(): Promise<TribunalSyncStatus[]> {
    const activeConfigs = this.mockConfigs.filter(c => c.isActive);
    const syncPromises = activeConfigs.map(config => this.syncTribunalData(config.id));
    return Promise.all(syncPromises);
  }

  // Funcionalidade de peticionamento eletrônico (estrutura básica)
  async submitPetition(petition: Omit<PetitionFiling, 'id' | 'status' | 'submittedAt'>): Promise<PetitionFiling> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filedPetition: PetitionFiling = {
          ...petition,
          id: `petition-${Date.now()}`,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          protocolNumber: `${Date.now()}`
        };
        resolve(filedPetition);
      }, 2000);
    });
  }

  async getPetitionStatus(petitionId: string): Promise<PetitionFiling | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock de consulta de status de petição
        if (Math.random() > 0.3) {
          resolve({
            id: petitionId,
            processNumber: '1001234-12.2025.8.26.0100',
            tribunal: 'TJSP',
            type: 'petition',
            title: 'Petição de Defesa',
            documents: [],
            status: 'accepted',
            submittedAt: '2025-01-26T10:00:00Z',
            protocolNumber: '123456789'
          });
        } else {
          resolve(null);
        }
      }, 800);
    });
  }
}

export const tribunalIntegrationService = new TribunalIntegrationService();
export default tribunalIntegrationService;
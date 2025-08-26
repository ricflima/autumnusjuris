import { ProcessDeadline, ProcessHearing, CreateDeadlineRequest, UpdateDeadlineRequest, CreateHearingRequest, UpdateHearingRequest } from '@/types/processes';

class ProcessDeadlinesService {
  private deadlines: ProcessDeadline[] = [
    {
      id: 'deadline-1',
      processId: 'process-1',
      type: 'appeal',
      title: 'Prazo para Recurso',
      description: 'Prazo final para interposição de recurso',
      dueDate: '2025-01-15T09:00:00Z',
      priority: 'urgent',
      status: 'pending',
      isRecurring: false,
      notes: 'Verificar jurisprudência antes do protocolo',
      attachments: [],
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z'
    },
    {
      id: 'deadline-2',
      processId: 'process-1',
      type: 'response',
      title: 'Contestação',
      description: 'Prazo para apresentar contestação',
      dueDate: '2024-12-20T17:00:00Z',
      priority: 'high',
      status: 'overdue',
      isRecurring: false,
      notes: 'Cliente ainda não enviou documentos',
      attachments: [],
      createdAt: '2024-11-15T10:00:00Z',
      updatedAt: '2024-12-10T15:30:00Z'
    },
    {
      id: 'deadline-3',
      processId: 'process-2',
      type: 'hearing',
      title: 'Audiência de Instrução',
      description: 'Audiência para oitiva de testemunhas',
      dueDate: '2025-01-25T14:00:00Z',
      priority: 'medium',
      status: 'pending',
      isRecurring: false,
      attachments: [],
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z'
    }
  ];

  private hearings: ProcessHearing[] = [
    {
      id: 'hearing-1',
      processId: 'process-1',
      title: 'Audiência de Conciliação',
      description: 'Tentativa de acordo entre as partes',
      date: '2025-01-20',
      time: '10:00',
      location: 'Sala 101 - Fórum Central',
      type: 'conciliation',
      status: 'scheduled',
      participants: ['Advogado', 'Cliente', 'Parte contrária'],
      notes: 'Preparar proposta de acordo',
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z'
    },
    {
      id: 'hearing-2', 
      processId: 'process-2',
      title: 'Audiência de Instrução e Julgamento',
      description: 'Audiência para coleta de provas e sentença',
      date: '2025-02-15',
      time: '14:30',
      location: 'Sala 205 - Fórum Central',
      type: 'instruction',
      status: 'scheduled',
      participants: ['Advogado', 'Cliente', 'Testemunhas (2)'],
      notes: 'Preparar rol de testemunhas',
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z'
    }
  ];

  // DEADLINES/PRAZOS
  async getDeadlines(filters?: {
    processId?: string;
    status?: 'pending' | 'completed' | 'overdue';
    type?: string;
    dueFromDate?: string;
    dueToDate?: string;
    overdue?: boolean;
    page?: number;
    limit?: number;
  }) {
    await this.simulateDelay();

    let filteredDeadlines = [...this.deadlines];

    if (filters) {
      if (filters.processId) {
        filteredDeadlines = filteredDeadlines.filter(d => d.processId === filters.processId);
      }
      if (filters.status) {
        filteredDeadlines = filteredDeadlines.filter(d => d.status === filters.status);
      }
      if (filters.type) {
        filteredDeadlines = filteredDeadlines.filter(d => d.type === filters.type);
      }
      if (filters.overdue) {
        filteredDeadlines = filteredDeadlines.filter(d => d.isOverdue);
      }
      if (filters.dueFromDate) {
        filteredDeadlines = filteredDeadlines.filter(d => 
          new Date(d.dueDate) >= new Date(filters.dueFromDate!)
        );
      }
      if (filters.dueToDate) {
        filteredDeadlines = filteredDeadlines.filter(d => 
          new Date(d.dueDate) <= new Date(filters.dueToDate!)
        );
      }
    }

    // Ordenar por data de vencimento
    filteredDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    // Antes de retornar:
    const enrichedDeadlines = filteredDeadlines.map(this.enrichDeadline);
    return {
      deadlines: enrichedDeadlines.slice(start, end),
      total: enrichedDeadlines.length,
      page,
      limit,
      hasMore: end < enrichedDeadlines.length
    };
  }

  async getDeadlineById(id: string): Promise<ProcessDeadline> {
    await this.simulateDelay();
    
    const deadline = this.deadlines.find(d => d.id === id);
    if (!deadline) {
      throw new Error('Prazo não encontrado');
    }
    
    return this.enrichDeadline(deadline);
  }

  async createDeadline(data: CreateDeadlineRequest): Promise<ProcessDeadline> {
    await this.simulateDelay();

    const now = new Date().toISOString();

    const newDeadline: ProcessDeadline = {
      id: `deadline-${Date.now()}`,
      processId: data.processId,
      type: data.type,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority,
      status: 'pending',
      isRecurring: data.isRecurring || false,
      recurringPattern: data.recurringPattern,
      notes: data.notes,
      attachments: [],
      createdAt: now,
      updatedAt: now
    };

    this.deadlines.unshift(newDeadline);
    return newDeadline;
  }

  async updateDeadline(id: string, data: UpdateDeadlineRequest): Promise<ProcessDeadline> {
    await this.simulateDelay();

    const index = this.deadlines.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Prazo não encontrado');
    }

    const deadline = this.deadlines[index];
    const now = new Date().toISOString();

    let daysUntilDue = deadline.daysUntilDue;
    let isOverdue = deadline.isOverdue;
    if (data.dueDate) {
      const dueDate = new Date(data.dueDate);
      const today = new Date();
      daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    const updatedDeadline: ProcessDeadline = {
      ...deadline,
      ...data,
      updatedAt: now,
      isOverdue: (daysUntilDue ?? 0) < 0,
      daysUntilDue: daysUntilDue,
      completedAt: data.status === 'completed' ? (data.completedAt || now) : undefined,
      completedBy: data.status === 'completed' ? (data.completedBy || 'user-1') : undefined,
    };

    this.deadlines[index] = updatedDeadline;
    return updatedDeadline;
  }

  async deleteDeadline(id: string): Promise<void> {
    await this.simulateDelay();
    
    const index = this.deadlines.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Prazo não encontrado');
    }
    
    this.deadlines.splice(index, 1);
  }

  // AUDIÊNCIAS/HEARINGS
  async getHearings(filters?: {
    processId?: string;
    status?: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    await this.simulateDelay();

    let filteredHearings = [...this.hearings];

    if (filters) {
      if (filters.processId) {
        filteredHearings = filteredHearings.filter(h => h.processId === filters.processId);
      }
      if (filters.status) {
        filteredHearings = filteredHearings.filter(h => h.status === filters.status);
      }
      if (filters.fromDate) {
        filteredHearings = filteredHearings.filter(h => 
          new Date(h.date) >= new Date(filters.fromDate!)
        );
      }
      if (filters.toDate) {
        filteredHearings = filteredHearings.filter(h => 
          new Date(h.date) <= new Date(filters.toDate!)
        );
      }
    }

    // Ordenar por data da audiência
    filteredHearings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      hearings: filteredHearings.slice(start, end),
      total: filteredHearings.length,
      page,
      limit,
      hasMore: end < filteredHearings.length
    };
  }

  async getHearingById(id: string): Promise<ProcessHearing> {
    await this.simulateDelay();
    
    const hearing = this.hearings.find(h => h.id === id);
    if (!hearing) {
      throw new Error('Audiência não encontrada');
    }
    
    return hearing;
  }

  async createHearing(data: CreateHearingRequest): Promise<ProcessHearing> {
    await this.simulateDelay();

    const now = new Date().toISOString();

    const newHearing: ProcessHearing = {
      id: `hearing-${Date.now()}`,
      processId: data.processId,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      location: data.location,
      type: data.type,
      status: 'scheduled',
      participants: data.participants || [],
      notes: data.notes,
      createdAt: now,
      updatedAt: now
    };

    this.hearings.unshift(newHearing);
    return newHearing;
  }

  async updateHearing(id: string, data: UpdateHearingRequest): Promise<ProcessHearing> {
    await this.simulateDelay();

    const index = this.hearings.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error('Audiência não encontrada');
    }

    const hearing = this.hearings[index];
    const now = new Date().toISOString();

    const updatedHearing: ProcessHearing = {
      ...hearing,
      ...data,
      updatedAt: now
    };

    this.hearings[index] = updatedHearing;
    return updatedHearing;
  }

  async deleteHearing(id: string): Promise<void> {
    await this.simulateDelay();
    
    const index = this.hearings.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error('Audiência não encontrada');
    }
    
    this.hearings.splice(index, 1);
  }

  // MÉTODOS DE UTILIDADE
  async getUpcomingDeadlines(days: number = 7) {
    await this.simulateDelay();

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.deadlines.filter(deadline => {
      const dueDate = new Date(deadline.dueDate);
      return dueDate >= today && dueDate <= futureDate && deadline.status === 'pending';
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async getOverdueDeadlines() {
    await this.simulateDelay();

    const today = new Date();
    return this.deadlines.filter(deadline => {
      const dueDate = new Date(deadline.dueDate);
      return dueDate < today && deadline.status !== 'completed';
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async getUpcomingHearings(days: number = 30) {
    await this.simulateDelay();

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.hearings.filter(hearing => {
      const hearingDate = new Date(hearing.date);
      return hearingDate >= today && hearingDate <= futureDate && hearing.status === 'scheduled';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async markDeadlineAsCompleted(id: string, notes?: string): Promise<ProcessDeadline> {
    return this.updateDeadline(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy: 'user-1', // TODO: pegar do contexto
      notes: notes
    });
  }

  async snoozeDeadline(id: string, newDueDate: string): Promise<ProcessDeadline> {
    return this.updateDeadline(id, {
      dueDate: newDueDate,
      status: 'pending'
    });
  }

  // Função utilitária para simular delay de rede
  private async simulateDelay(): Promise<void> {
    const delay = Math.random() * 500 + 200; // 200-700ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Funções de formatação e utilidades
  getDeadlineStatusLabel(status: 'pending' | 'completed' | 'overdue'): string {
    const labels = {
      pending: 'Pendente',
      completed: 'Concluído',
      overdue: 'Em atraso'
    };
    return labels[status];
  }

  getDeadlineTypeLabel(type: string): string {
    const labels = {
      response: 'Resposta',
      appeal: 'Recurso',
      hearing: 'Audiência',
      filing: 'Protocolo',
      payment: 'Pagamento',
      document: 'Documento',
      other: 'Outro'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getHearingStatusLabel(status: 'scheduled' | 'completed' | 'cancelled' | 'postponed'): string {
    const labels = {
      scheduled: 'Agendada',
      completed: 'Realizada',
      cancelled: 'Cancelada',
      postponed: 'Adiada'
    };
    return labels[status];
  }

  getHearingTypeLabel(type: string): string {
    const labels = {
      conciliation: 'Conciliação',
      instruction: 'Instrução',
      judgment: 'Julgamento',
      preliminary: 'Preliminar',
      other: 'Outra'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getDeadlineStatusColor(status: 'pending' | 'completed' | 'overdue'): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status];
  }

  getHearingStatusColor(status: 'scheduled' | 'completed' | 'cancelled' | 'postponed'): string {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      postponed: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status];
  }

  getPriorityColor(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  }

  formatDaysUntilDue(dueDate: string): string {
    const today = new Date();
    const due = new Date(dueDate);
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      const overdue = Math.abs(days);
      return `${overdue} dia${overdue !== 1 ? 's' : ''} em atraso`;
    } else if (days === 0) {
      return 'Vence hoje';
    } else if (days === 1) {
      return 'Vence amanhã';
    } else {
      return `${days} dias restantes`;
    }
  }

  private enrichDeadline(deadline: ProcessDeadline): ProcessDeadline {
    const dueDate = new Date(deadline.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDue < 0 && deadline.status !== 'completed';
    return {
      ...deadline,
      daysUntilDue,
      isOverdue,
    };
  }
}

export const processDeadlinesService = new ProcessDeadlinesService();
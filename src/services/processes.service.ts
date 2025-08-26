// src/services/processes.service.ts

import { 
  Process, 
  ProcessesResponse, 
  ProcessFilters,
  CreateProcessRequest,
  UpdateProcessRequest,
  ProcessDeadline,
  ProcessHearing,
  ProcessMovement,
  CreateDeadlineRequest,
  UpdateDeadlineRequest,
  CreateHearingRequest,
  UpdateHearingRequest,
  CreateMovementRequest,
  ProcessStatus,
  ProcessPhase,
} from '@/types/processes';

// Mock data para desenvolvimento
const MOCK_PROCESSES: Process[] = [
  {
    id: '1',
    number: '1234567-89.2024.8.26.0001',
    internalNumber: 'PROC-2024-001',
    title: 'Ação de Cobrança - Empresa ABC vs João Silva',
    description: 'Ação de cobrança de prestação de serviços no valor de R$ 50.000,00',
    type: 'civil',
    status: 'active',
    phase: 'instruction',
    priority: 'medium',
    caseId: '1',
    clientIds: ['1'],
    responsibleLawyerId: 'lawyer-1',
    court: {
      court: '1ª Vara Cível',
      district: 'Foro Central',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    },
    opposingParty: 'João Silva',
    opposingLawyer: 'Dr. Maria Santos - OAB/SP 123456',
    processValue: {
      amount: 50000,
      currency: 'BRL',
      description: 'Valor da causa'
    },
    costs: {
      initialFees: { amount: 2500, currency: 'BRL' },
      courtCosts: { amount: 1200, currency: 'BRL' },
      lawyerFees: { amount: 15000, currency: 'BRL' },
      otherExpenses: [],
      totalCosts: { amount: 18700, currency: 'BRL' }
    },
    filingDate: '2024-01-15T10:00:00Z',
    citationDate: '2024-02-01T10:00:00Z',
    lastMovementDate: '2024-03-10T14:30:00Z',
    notes: 'Cliente possui todos os documentos comprobatórios. Empresa réu contestou parcialmente.',
    tags: ['cobrança', 'empresarial'],
    isConfidential: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-10T14:30:00Z',
    createdBy: 'lawyer-1',
    daysActive: 55,
    pendingDeadlines: 2,
    recentMovements: []
  },
  {
    id: '2',
    number: '2345678-90.2024.8.26.0002',
    internalNumber: 'PROC-2024-002',
    title: 'Divórcio Consensual - Maria Santos',
    description: 'Divórcio consensual com partilha de bens',
    type: 'family',
    status: 'active',
    phase: 'initial',
    priority: 'low',
    caseId: '2',
    clientIds: ['2'],
    responsibleLawyerId: 'lawyer-1',
    court: {
      court: '2ª Vara de Família',
      district: 'Foro Central',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    },
    opposingParty: 'Carlos Santos',
    filingDate: '2024-02-01T10:00:00Z',
    lastMovementDate: '2024-02-15T16:20:00Z',
    notes: 'Divórcio amigável. Casal já acordou sobre partilha de bens e guarda dos filhos.',
    tags: ['família', 'consensual'],
    isConfidential: true,
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-15T16:20:00Z',
    createdBy: 'lawyer-1',
    daysActive: 38,
    pendingDeadlines: 1,
    recentMovements: []
  },
  {
    id: '3',
    number: '3456789-01.2024.5.02.0001',
    internalNumber: 'PROC-2024-003',
    title: 'Ação Trabalhista - Pedro Oliveira vs Empresa XYZ',
    description: 'Reclamação trabalhista por horas extras e verbas rescisórias',
    type: 'labor',
    status: 'active',
    phase: 'judgment',
    priority: 'high',
    caseId: '3',
    clientIds: ['4'],
    responsibleLawyerId: 'lawyer-2',
    court: {
      court: '1ª Vara do Trabalho',
      district: 'TRT - 2ª Região',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    },
    opposingParty: 'Empresa XYZ Ltda',
    opposingLawyer: 'Dra. Ana Costa - OAB/SP 987654',
    processValue: {
      amount: 25000,
      currency: 'BRL',
      description: 'Valor estimado das verbas'
    },
    filingDate: '2024-01-10T10:00:00Z',
    citationDate: '2024-01-20T10:00:00Z',
    lastMovementDate: '2024-03-08T09:00:00Z',
    notes: 'Audiência de conciliação não obteve êxito. Processo em fase de julgamento.',
    tags: ['trabalhista', 'horas-extras'],
    isConfidential: false,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-03-08T09:00:00Z',
    createdBy: 'lawyer-2',
    daysActive: 60,
    pendingDeadlines: 0,
    recentMovements: []
  }
];

const MOCK_DEADLINES: ProcessDeadline[] = [
  {
    id: '1',
    processId: '1',
    type: 'response',
    title: 'Tríplica',
    description: 'Prazo para apresentar tríplica no processo de cobrança',
    dueDate: '2024-03-25T23:59:59Z',
    status: 'pending',
    priority: 'medium',
    isRecurring: false,
    notes: 'Aguardando documentos complementares do cliente',
    attachments: [],
    createdAt: '2024-03-10T14:30:00Z',
    updatedAt: '2024-03-10T14:30:00Z'
  },
  {
    id: '2',
    processId: '1',
    type: 'hearing',
    title: 'Audiência de Instrução',
    description: 'Audiência de instrução e julgamento',
    dueDate: '2024-04-15T14:00:00Z',
    status: 'pending',
    priority: 'high',
    isRecurring: false,
    notes: 'Preparar rol de testemunhas',
    attachments: [],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z'
  },
  {
    id: '3',
    processId: '2',
    type: 'petition',
    title: 'Manifestação sobre Documentos',
    description: 'Prazo para manifestação sobre documentos juntados',
    dueDate: '2024-03-30T23:59:59Z',
    status: 'pending',
    priority: 'low',
    isRecurring: false,
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z'
  }
];

const MOCK_HEARINGS: ProcessHearing[] = [
  {
    id: '1',
    processId: '1',
    title: 'Audiência de Instrução e Julgamento',
    description: 'Audiência para oitiva de testemunhas e julgamento',
    date: '2024-04-15',
    time: '14:00',
    location: '1ª Vara Cível - Sala de Audiências 1',
    type: 'instruction',
    status: 'scheduled',
    participants: ['lawyer-1', 'client-1', 'testemunha-1'],
    notes: 'Levar 3 testemunhas e documentos originais',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z'
  },
  {
    id: '2',
    processId: '3',
    title: 'Audiência de Conciliação',
    description: 'Audiência inicial para tentativa de conciliação',
    date: '2024-02-15',
    time: '09:30',
    location: '1ª Vara do Trabalho - Sala 3',
    type: 'conciliation',
    status: 'completed',
    participants: ['lawyer-2', 'client-4'],
    notes: 'Tentativa de acordo não obteve êxito',
    outcome: 'Sem acordo. Processo seguiu para instrução.',
    nextSteps: 'Aguardar designação de nova audiência',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-15T16:30:00Z'
  }
];

const MOCK_MOVEMENTS: ProcessMovement[] = [
  {
    id: '1',
    processId: '1',
    date: '2024-03-10T14:30:00Z',
    description: 'Juntada de documentos pelo autor',
    type: 'document',
    author: 'Cartório da 1ª Vara Cível',
    official: true,
    createdAt: '2024-03-10T14:30:00Z',
    updatedAt: '2024-03-10T14:30:00Z'
  },
  {
    id: '2',
    processId: '1',
    date: '2024-03-01T10:00:00Z',
    description: 'Designada audiência de instrução e julgamento para 15/04/2024 às 14h00',
    type: 'hearing',
    author: 'Juiz da 1ª Vara Cível',
    official: true,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z'
  }
];

class ProcessesService {
  // CRUD de Processos
  async getProcesses(filters: ProcessFilters = {}): Promise<ProcessesResponse> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredProcesses = [...MOCK_PROCESSES];
    
    // Aplicar filtros
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredProcesses = filteredProcesses.filter(process => 
        process.title.toLowerCase().includes(search) ||
        process.number.toLowerCase().includes(search) ||
        process.description?.toLowerCase().includes(search) ||
        process.opposingParty?.toLowerCase().includes(search)
      );
    }
    
    if (filters.status && filters.status.length > 0) {
      filteredProcesses = filteredProcesses.filter(process => 
        filters.status!.includes(process.status)
      );
    }
    
    if (filters.type && filters.type.length > 0) {
      filteredProcesses = filteredProcesses.filter(process => 
        filters.type!.includes(process.type)
      );
    }
    
    if (filters.priority && filters.priority.length > 0) {
      filteredProcesses = filteredProcesses.filter(process => 
        filters.priority!.includes(process.priority)
      );
    }
    
    if (filters.clientId) {
      filteredProcesses = filteredProcesses.filter(process => 
        process.clientIds.includes(filters.clientId!)
      );
    }
    
    if (filters.caseId) {
      filteredProcesses = filteredProcesses.filter(process => 
        process.caseId === filters.caseId
      );
    }
    
    if (filters.hasOverdueDeadlines) {
      const now = new Date();
      const overdueProcessIds = MOCK_DEADLINES
        .filter(deadline => 
          deadline.status === 'pending' && 
          new Date(deadline.dueDate) < now
        )
        .map(deadline => deadline.processId);
      
      filteredProcesses = filteredProcesses.filter(process => 
        overdueProcessIds.includes(process.id)
      );
    }
    
    // Ordenação
    const sortBy = filters.sortBy || 'filingDate';
    const sortOrder = filters.sortOrder || 'desc';
    
    filteredProcesses.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Process];
      let bValue: any = b[sortBy as keyof Process];
      
      if (sortBy === 'nextDeadline') {
        const aDeadline = MOCK_DEADLINES.find(d => d.processId === a.id && d.status === 'pending');
        const bDeadline = MOCK_DEADLINES.find(d => d.processId === b.id && d.status === 'pending');
        aValue = aDeadline?.dueDate || '9999-12-31';
        bValue = bDeadline?.dueDate || '9999-12-31';
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedProcesses = filteredProcesses.slice(startIndex, endIndex);
    
    // Adicionar informações calculadas
    const enrichedProcesses = paginatedProcesses.map(process => {
      const nextDeadline = MOCK_DEADLINES
        .filter(d => d.processId === process.id && d.status === 'pending')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
      
      const pendingDeadlines = MOCK_DEADLINES
        .filter(d => d.processId === process.id && d.status === 'pending').length;
      
      const recentMovements = MOCK_MOVEMENTS
        .filter(m => m.processId === process.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      
      return {
        ...process,
        nextDeadline,
        pendingDeadlines,
        recentMovements
      };
    });
    
    return {
      processes: enrichedProcesses,
      total: filteredProcesses.length,
      page,
      limit,
      hasMore: endIndex < filteredProcesses.length
    };
  }
  
  async getProcess(id: string): Promise<Process> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const process = MOCK_PROCESSES.find(p => p.id === id);
    if (!process) {
      throw new Error('Processo não encontrado');
    }
    
    // Enriquecer com dados relacionados
    const nextDeadline = MOCK_DEADLINES
      .filter(d => d.processId === id && d.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    
    const pendingDeadlines = MOCK_DEADLINES
      .filter(d => d.processId === id && d.status === 'pending').length;
    
    const recentMovements = MOCK_MOVEMENTS
      .filter(m => m.processId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    return {
      ...process,
      nextDeadline,
      pendingDeadlines,
      recentMovements
    };
  }
  
  async createProcess(data: CreateProcessRequest): Promise<Process> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newProcess: Process = {
      id: Date.now().toString(),
      ...data,
      status: 'active' as ProcessStatus,
      phase: 'initial' as ProcessPhase,
      costs: data.processValue ? {
        initialFees: { amount: 0, currency: 'BRL' },
        courtCosts: { amount: 0, currency: 'BRL' },
        lawyerFees: { amount: 0, currency: 'BRL' },
        otherExpenses: [],
        totalCosts: { amount: 0, currency: 'BRL' }
      } : undefined,
      lastMovementDate: data.filingDate,
      isConfidential: data.isConfidential || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user',
      daysActive: Math.floor((Date.now() - new Date(data.filingDate).getTime()) / (1000 * 60 * 60 * 24)),
      pendingDeadlines: 0,
      recentMovements: []
    };
    
    MOCK_PROCESSES.push(newProcess);
    return newProcess;
  }
  
  async updateProcess(id: string, data: UpdateProcessRequest): Promise<Process> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = MOCK_PROCESSES.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Processo não encontrado');
    }
    
    MOCK_PROCESSES[index] = {
      ...MOCK_PROCESSES[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return this.getProcess(id);
  }
  
  async deleteProcess(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = MOCK_PROCESSES.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Processo não encontrado');
    }
    
    MOCK_PROCESSES.splice(index, 1);
  }
  
  // Gerenciamento de Prazos
  async getProcessDeadlines(processId: string): Promise<ProcessDeadline[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return MOCK_DEADLINES
      .filter(d => d.processId === processId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async createDeadline(data: CreateDeadlineRequest): Promise<ProcessDeadline> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newDeadline: ProcessDeadline = {
      id: Date.now().toString(),
      ...data,
      status: 'pending',
      isRecurring: data.isRecurring || false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MOCK_DEADLINES.push(newDeadline);
    return newDeadline;
  }
  
  async updateDeadline(id: string, data: UpdateDeadlineRequest): Promise<ProcessDeadline> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = MOCK_DEADLINES.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Prazo não encontrado');
    }
    
    MOCK_DEADLINES[index] = {
      ...MOCK_DEADLINES[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return MOCK_DEADLINES[index];
  }
  
  async deleteDeadline(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = MOCK_DEADLINES.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Prazo não encontrado');
    }
    
    MOCK_DEADLINES.splice(index, 1);
  }
  
  // Gerenciamento de Audiências
  async getProcessHearings(processId: string): Promise<ProcessHearing[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return MOCK_HEARINGS
      .filter(h => h.processId === processId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createHearing(data: CreateHearingRequest): Promise<ProcessHearing> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newHearing: ProcessHearing = {
      id: Date.now().toString(),
      ...data,
      status: 'scheduled',
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MOCK_HEARINGS.push(newHearing);
    return newHearing;
  }
  
  async updateHearing(id: string, data: UpdateHearingRequest): Promise<ProcessHearing> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = MOCK_HEARINGS.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error('Audiência não encontrada');
    }
    
    MOCK_HEARINGS[index] = {
      ...MOCK_HEARINGS[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return MOCK_HEARINGS[index];
  }
  
  // Movimentações Processuais
  async getProcessMovements(processId: string): Promise<ProcessMovement[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return MOCK_MOVEMENTS
      .filter(m => m.processId === processId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createMovement(data: CreateMovementRequest): Promise<ProcessMovement> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newMovement: ProcessMovement = {
      id: Date.now().toString(),
      ...data,
      official: data.official || false,
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MOCK_MOVEMENTS.push(newMovement);
    return newMovement;
  }
  
  // Métodos utilitários
  async getUpcomingDeadlines(days: number = 7): Promise<ProcessDeadline[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return MOCK_DEADLINES
      .filter(d => 
        d.status === 'pending' &&
        new Date(d.dueDate) >= now &&
        new Date(d.dueDate) <= futureDate
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async getOverdueDeadlines(): Promise<ProcessDeadline[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const now = new Date();
    
    return MOCK_DEADLINES
      .filter(d => 
        d.status === 'pending' && 
        new Date(d.dueDate) < now
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }
  
  async getProcessStatistics(): Promise<{
    totalProcesses: number;
    activeProcesses: number;
    overdueDeadlines: number;
    upcomingDeadlines: number;
    processesByStatus: Record<ProcessStatus, number>;
    processesByType: Record<string, number>;
  }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const processesByStatus = MOCK_PROCESSES.reduce((acc, process) => {
      acc[process.status] = (acc[process.status] || 0) + 1;
      return acc;
    }, {} as Record<ProcessStatus, number>);
    
    const processesByType = MOCK_PROCESSES.reduce((acc, process) => {
      acc[process.type] = (acc[process.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalProcesses: MOCK_PROCESSES.length,
      activeProcesses: MOCK_PROCESSES.filter(p => p.status === 'active').length,
      overdueDeadlines: MOCK_DEADLINES.filter(d => 
        d.status === 'pending' && new Date(d.dueDate) < now
      ).length,
      upcomingDeadlines: MOCK_DEADLINES.filter(d => 
        d.status === 'pending' && 
        new Date(d.dueDate) >= now && 
        new Date(d.dueDate) <= weekFromNow
      ).length,
      processesByStatus,
      processesByType
    };
  }
}

export const processesService = new ProcessesService();
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
  ProcessType,
  ProcessPriority,
} from '@/types/processes';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.25.132.0:3001/api';

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
    lastMovementDate: '2025-07-10T14:30:00Z',
    notes: 'Cliente possui todos os documentos comprobatórios. Empresa réu contestou parcialmente.',
    tags: ['cobrança', 'empresarial'],
    isConfidential: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2025-07-10T14:30:00Z',
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
    lastMovementDate: '2025-07-08T09:00:00Z',
    notes: 'Audiência de conciliação não obteve êxito. Processo em fase de julgamento.',
    tags: ['trabalhista', 'horas-extras'],
    isConfidential: false,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2025-07-08T09:00:00Z',
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
    dueDate: '2025-07-25T23:59:59Z',
    status: 'pending',
    priority: 'medium',
    isRecurring: false,
    notes: 'Aguardando documentos complementares do cliente',
    attachments: [],
    createdAt: '2025-07-10T14:30:00Z',
    updatedAt: '2025-07-10T14:30:00Z'
  },
  {
    id: '2',
    processId: '1',
    type: 'hearing',
    title: 'Audiência de Instrução',
    description: 'Audiência de instrução e julgamento',
    dueDate: '2025-08-15T14:00:00Z',
    status: 'pending',
    priority: 'high',
    isRecurring: false,
    notes: 'Preparar rol de testemunhas',
    attachments: [],
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z'
  },
  {
    id: '3',
    processId: '2',
    type: 'petition',
    title: 'Manifestação sobre Documentos',
    description: 'Prazo para manifestação sobre documentos juntados',
    dueDate: '2025-07-30T23:59:59Z',
    status: 'pending',
    priority: 'low',
    isRecurring: false,
    createdAt: '2025-07-15T10:00:00Z',
    updatedAt: '2025-07-15T10:00:00Z'
  }
];

const MOCK_HEARINGS: ProcessHearing[] = [
  {
    id: '1',
    processId: '1',
    title: 'Audiência de Instrução e Julgamento',
    description: 'Audiência para oitiva de testemunhas e julgamento',
    date: '2025-08-15',
    time: '14:00',
    location: '1ª Vara Cível - Sala de Audiências 1',
    type: 'instruction',
    status: 'scheduled',
    participants: ['lawyer-1', 'client-1', 'testemunha-1'],
    notes: 'Levar 3 testemunhas e documentos originais',
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z'
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
    date: '2025-07-10T14:30:00Z',
    description: 'Juntada de documentos pelo autor',
    type: 'document',
    author: 'Cartório da 1ª Vara Cível',
    official: true,
    createdAt: '2025-07-10T14:30:00Z',
    updatedAt: '2025-07-10T14:30:00Z'
  },
  {
    id: '2',
    processId: '1',
    date: '2025-07-01T10:00:00Z',
    description: 'Designada audiência de instrução e julgamento para 15/04/2024 às 14h00',
    type: 'hearing',
    author: 'Juiz da 1ª Vara Cível',
    official: true,
    createdAt: '2025-07-01T10:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z'
  }
];

class ProcessesService {
  // CRUD de Processos
  async getProcesses(filters: ProcessFilters = {}): Promise<ProcessesResponse> {
    try {
      const params = new URLSearchParams();
      
      // Add filters as query parameters
      if (filters.caseId) params.append('caseId', filters.caseId);
      if (filters.status?.length === 1) params.append('status', filters.status[0]);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      const response = await axios.get(`${API_BASE_URL}/processes?${params.toString()}`);
      
      // Transform API response to match frontend types
      const apiProcesses = response.data.processes || [];
      const processes: Process[] = apiProcesses.map((p: any) => ({
        id: p.id,
        number: p.number,
        internalNumber: p.number,
        title: p.caseTitle || `Processo ${p.number}`,
        description: p.observations || '',
        type: 'civil' as ProcessType,
        status: p.status as ProcessStatus,
        phase: 'instruction' as ProcessPhase,
        priority: 'medium' as ProcessPriority,
        caseId: p.caseId,
        clientIds: [],
        responsibleLawyerId: '',
        court: {
          court: p.court,
          district: p.judicialDistrict || '',
          city: p.city || '',
          state: p.state || '',
          country: 'Brasil'
        },
        opposingParty: p.defendant || '',
        opposingLawyer: p.lawyerDefendant || '',
        processValue: {
          amount: p.claimValue || 0,
          currency: 'BRL',
          description: 'Valor da causa'
        },
        costs: {
          initialFees: { amount: 0, currency: 'BRL' },
          courtCosts: { amount: 0, currency: 'BRL' },
          lawyerFees: { amount: 0, currency: 'BRL' },
          otherExpenses: [],
          totalCosts: { amount: 0, currency: 'BRL' }
        },
        filingDate: p.distributionDate || p.createdAt,
        lastMovementDate: p.updatedAt,
        nextDeadline: undefined,
        tags: p.tags || [],
        notes: p.observations || '',
        isConfidential: false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        createdBy: '',
        daysActive: Math.ceil((new Date().getTime() - new Date(p.createdAt).getTime()) / (1000 * 3600 * 24)),
        pendingDeadlines: 0,
        recentMovements: []
      }));

      return {
        processes,
        total: response.data.total || processes.length,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        hasMore: response.data.hasMore || false
      };
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      throw new Error('Falha ao buscar processos');
    }
  }
  
  async getProcess(id: string): Promise<Process> {
    try {
      const response = await axios.get(`${API_BASE_URL}/processes/${id}`);
      const p = response.data;
      
      // Transform API response to match frontend types
      const process: Process = {
        id: p.id,
        number: p.number,
        internalNumber: p.number,
        title: p.caseTitle || `Processo ${p.number}`,
        description: p.observations || '',
        type: 'civil',
        status: p.status as ProcessStatus,
        phase: 'instruction' as ProcessPhase,
        priority: 'medium' as ProcessPriority,
        caseId: p.caseId,
        clientIds: [],
        responsibleLawyerId: '',
        court: {
          court: p.court,
          district: p.judicialDistrict || '',
          city: p.city || '',
          state: p.state || '',
          country: 'Brasil'
        },
        opposingParty: p.defendant || '',
        opposingLawyer: p.lawyerDefendant || '',
        processValue: {
          amount: p.claimValue || 0,
          currency: 'BRL',
          description: 'Valor da causa'
        },
        costs: {
          initialFees: { amount: 0, currency: 'BRL' },
          courtCosts: { amount: 0, currency: 'BRL' },
          lawyerFees: { amount: 0, currency: 'BRL' },
          otherExpenses: [],
          totalCosts: { amount: 0, currency: 'BRL' }
        },
        filingDate: p.distributionDate || p.createdAt,
        lastMovementDate: p.updatedAt,
        nextDeadline: undefined,
        tags: p.tags || [],
        notes: p.observations || '',
        isConfidential: false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        createdBy: '',
        daysActive: Math.ceil((new Date().getTime() - new Date(p.createdAt).getTime()) / (1000 * 3600 * 24)),
        pendingDeadlines: 0,
        recentMovements: p.movements?.map((m: any) => ({
          id: m.id,
          processId: p.id,
          date: m.date,
          description: m.description,
          type: 'other' as any,
          author: m.responsible || '',
          official: true,
          createdAt: m.createdAt,
          updatedAt: m.createdAt
        })) || []
      };

      return process;
    } catch (error) {
      console.error('Erro ao buscar processo:', error);
      throw new Error('Processo não encontrado');
    }
  }
  
  async createProcess(data: CreateProcessRequest): Promise<Process> {
    try {
      const response = await axios.post(`${API_BASE_URL}/processes`, {
        // Campos modernos
        number: data.number,
        internalNumber: data.internalNumber,
        title: data.title,
        description: data.description,
        type: data.type,
        phase: 'initial', // Sempre inicial na criação
        priority: data.priority,
        responsibleLawyerId: data.responsibleLawyerId,
        court: data.court.court,
        district: data.court.district,
        city: data.court.city,
        state: data.court.state,
        country: data.court.country,
        opposingParty: data.opposingParty,
        opposingLawyer: data.opposingLawyer,
        processValueAmount: data.processValue?.amount,
        processValueDescription: data.processValue?.description,
        filingDate: data.filingDate,
        citationDate: data.citationDate,
        notes: data.notes,
        tags: data.tags || [],
        isConfidential: data.isConfidential,
        status: 'active', // Sempre ativo na criação
        // Campos legacy para compatibilidade
        caseId: data.caseId,
        plaintiff: data.clientIds[0] || 'Autor',
        defendant: data.opposingParty || 'Réu',
        subject: data.title,
        class: 'Processo',
        distributionDate: data.filingDate,
        lawyerPlaintiff: data.responsibleLawyerId,
        claimValue: data.processValue?.amount || 0,
        observations: data.notes
      });

      if (response.data.success) {
        // Converter resposta da API para formato esperado pelo frontend
        const apiProcess = response.data.process;
        return {
          id: apiProcess.id,
          number: apiProcess.number,
          internalNumber: data.internalNumber,
          title: data.title,
          description: data.description,
          type: data.type,
          status: apiProcess.status as ProcessStatus,
          phase: 'initial' as ProcessPhase,
          priority: data.priority,
          caseId: data.caseId,
          clientIds: data.clientIds,
          responsibleLawyerId: data.responsibleLawyerId,
          court: data.court,
          opposingParty: data.opposingParty,
          opposingLawyer: data.opposingLawyer,
          processValue: data.processValue
            ? {
                ...data.processValue,
                currency: data.processValue.currency ?? 'BRL'
              }
            : undefined,
          filingDate: data.filingDate,
          citationDate: data.citationDate,
          lastMovementDate: data.filingDate,
          notes: data.notes,
          tags: data.tags || [],
          isConfidential: data.isConfidential || false,
          createdAt: apiProcess.createdAt,
          updatedAt: apiProcess.updatedAt,
          createdBy: 'current-user',
          daysActive: Math.floor(
            (Date.now() - new Date(data.filingDate).getTime()) / (1000 * 60 * 60 * 24)
          ),
          pendingDeadlines: 0,
          recentMovements: []
        };
      } else {
        throw new Error(response.data.message || 'Erro ao criar processo');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao criar processo');
      }
      throw error;
    }
  }
  
  async updateProcess(id: string, data: UpdateProcessRequest): Promise<Process> {
    try {
      const response = await axios.put(`${API_BASE_URL}/processes/${id}`, {
        // Campos modernos
        number: data.number,
        internalNumber: data.internalNumber,
        title: data.title,
        description: data.description,
        type: data.type,
        phase: data.phase,
        priority: data.priority,
        responsibleLawyerId: data.responsibleLawyerId,
        court: data.court?.court,
        district: data.court?.district,
        city: data.court?.city,
        state: data.court?.state,
        country: data.court?.country,
        opposingParty: data.opposingParty,
        opposingLawyer: data.opposingLawyer,
        processValueAmount: data.processValue?.amount,
        processValueDescription: data.processValue?.description,
        filingDate: data.filingDate,
        citationDate: data.citationDate,
        notes: data.notes,
        tags: data.tags || [],
        isConfidential: data.isConfidential,
        status: data.status,
        // Campos legacy para compatibilidade
        plaintiff: data.clientIds?.[0] || undefined,
        defendant: data.opposingParty,
        subject: data.title,
        class: 'Processo',
        distributionDate: data.filingDate,
        claimValue: data.processValue?.amount || 0,
        observations: data.notes,
        lawyerPlaintiff: data.responsibleLawyerId
      });

      if (response.data.success) {
        // Buscar processo atualizado completo
        return await this.getProcess(id);
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar processo');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao atualizar processo');
      }
      throw error;
    }
  }
  
  async deleteProcess(id: string): Promise<void> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/processes/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao deletar processo');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao deletar processo');
      }
      throw error;
    }
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
    
    if (processId === 'all') {
      return MOCK_HEARINGS
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
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
    try {
      const response = await axios.get(`${API_BASE_URL}/processes/${processId}`);
      const p = response.data;
      
      if (!p.movements) {
        return [];
      }
      
      return p.movements.map((m: any) => ({
        id: m.id,
        processId: processId,
        date: m.date,
        description: m.description,
        type: 'other' as any,
        author: m.responsible || '',
        official: true,
        createdAt: m.createdAt,
        updatedAt: m.createdAt
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      return [];
    }
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

  async createProcessHearing(processId: string, data: any): Promise<ProcessHearing> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newHearing: ProcessHearing = {
      id: Date.now().toString(),
      processId,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      location: data.location,
      type: data.type || 'instruction',
      status: 'scheduled',
      participants: data.participants || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MOCK_HEARINGS.push(newHearing);
    return newHearing;
  }

  async createProcessDeadline(processId: string, data: any): Promise<ProcessDeadline> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newDeadline: ProcessDeadline = {
      id: Date.now().toString(),
      processId,
      type: data.type || 'other',
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      status: 'pending',
      priority: data.priority || 'medium',
      isRecurring: data.isRecurring || false,
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MOCK_DEADLINES.push(newDeadline);
    return newDeadline;
  }
}

export const processesService = new ProcessesService();
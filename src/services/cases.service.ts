// src/services/cases.service.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Case {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  clientId: string;
  clientName: string;
  clientType?: 'individual' | 'company'; // NOVO
  clientDocument?: string; // NOVO
  clientEmail?: string; // NOVO
  clientPhone?: string; // NOVO
  lawyerId: string;
  lawyerName: string;
  processNumber?: string;
  court?: string;
  subject: string;
  value?: number;
  startDate: string;
  expectedEndDate?: string;
  lastUpdate: string;
  nextAction?: string;
  nextActionDate?: string;
  documents: CaseDocument[];
  timeline: CaseTimelineItem[];
  createdAt: string;
  updatedAt: string;
  // NOVOS CAMPOS DE RELACIONAMENTO
  relatedCases?: string[]; // IDs de casos relacionados
  tags?: string[]; // Tags para categorização
}

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface CaseTimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'created' | 'updated' | 'document' | 'hearing' | 'deadline' | 'note';
  user: string;
}

export type CaseStatus = 
  | 'draft' 
  | 'active' 
  | 'waiting_documents' 
  | 'in_court' 
  | 'appealing' 
  | 'concluded' 
  | 'archived';

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateCaseRequest {
  title: string;
  description: string;
  clientId: string;
  subject: string;
  priority: CasePriority;
  processNumber?: string;
  court?: string;
  value?: number;
  expectedEndDate?: string;
  nextAction?: string;
  nextActionDate?: string;
}

export interface UpdateCaseRequest extends Partial<CreateCaseRequest> {
  status?: CaseStatus;
}

export interface CasesResponse {
  cases: Case[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CaseFilters {
  status?: CaseStatus[];
  priority?: CasePriority[];
  clientId?: string;
  lawyerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Mock data para desenvolvimento
const MOCK_CASES: Case[] = [
  {
    id: '1',
    title: 'Processo Trabalhista - Silva vs Empresa XYZ',
    description: 'Ação trabalhista por horas extras não pagas e rescisão indevida. Cliente trabalhou por 3 anos sem receber adequadamente.',
    status: 'active',
    priority: 'high',
    clientId: '1',
    clientName: 'João Silva',
    clientType: 'individual',
    clientDocument: '123.456.789-00',
    clientEmail: 'joao.silva@email.com',
    clientPhone: '(11) 99999-9999',
    lawyerId: '1',
    lawyerName: 'Dr. João Silva',
    processNumber: '1001234-56.2024.5.02.0001',
    court: '1ª Vara do Trabalho de São Paulo',
    subject: 'Direito do Trabalho',
    value: 25000,
    startDate: '2024-01-15T00:00:00Z',
    expectedEndDate: '2024-06-15T00:00:00Z',
    lastUpdate: '2024-03-10T14:30:00Z',
    nextAction: 'Audiência de conciliação',
    nextActionDate: '2024-03-15T14:30:00Z',
    documents: [
      {
        id: '1',
        name: 'Petição Inicial.pdf',
        type: 'application/pdf',
        size: 1024000,
        uploadedAt: '2024-01-15T10:00:00Z',
        uploadedBy: 'Dr. João Silva'
      }
    ],
    timeline: [
      {
        id: '1',
        title: 'Caso criado',
        description: 'Caso iniciado com petição inicial',
        date: '2024-01-15T10:00:00Z',
        type: 'created',
        user: 'Dr. João Silva'
      }
    ],
    tags: ['trabalhista', 'horas-extras'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-10T14:30:00Z'
  },
  {
    id: '2',
    title: 'Divórcio Consensual - Maria Santos',
    description: 'Procedimento de divórcio consensual com partilha de bens. Casal sem filhos menores.',
    status: 'waiting_documents',
    priority: 'medium',
    clientId: '2',
    clientName: 'Maria Santos',
    clientType: 'individual',
    clientDocument: '987.654.321-00',
    clientEmail: 'maria.santos@email.com',
    clientPhone: '(11) 88888-8888',
    lawyerId: '2',
    lawyerName: 'Dra. Maria Santos',
    processNumber: '2001234-56.2024.8.26.0001',
    court: '1ª Vara de Família e Sucessões',
    subject: 'Direito de Família',
    value: 0,
    startDate: '2024-02-01T00:00:00Z',
    expectedEndDate: '2024-05-01T00:00:00Z',
    lastUpdate: '2024-03-09T09:15:00Z',
    nextAction: 'Aguardando certidões de casamento e nascimento',
    nextActionDate: '2024-03-20T00:00:00Z',
    documents: [],
    timeline: [
      {
        id: '2',
        title: 'Caso criado',
        description: 'Divórcio consensual iniciado',
        date: '2024-02-01T10:00:00Z',
        type: 'created',
        user: 'Dra. Maria Santos'
      }
    ],
    tags: ['divórcio', 'família'],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-09T09:15:00Z'
  },
  {
    id: '3',
    title: 'Ação de Cobrança - Contrato Comercial',
    description: 'Cobrança de valores em aberto referente ao contrato comercial com fornecedor.',
    status: 'appealing',
    priority: 'low',
    clientId: '3',
    clientName: 'Empresa ABC Ltda',
    clientType: 'company',
    clientDocument: '12.345.678/0001-90',
    clientEmail: 'contato@empresaabc.com',
    clientPhone: '(11) 3333-3333',
    lawyerId: '1',
    lawyerName: 'Dr. João Silva',
    processNumber: '3001234-56.2024.8.26.0100',
    court: '2ª Vara Cível',
    subject: 'Direito Civil',
    value: 50000,
    startDate: '2024-01-10T00:00:00Z',
    expectedEndDate: '2024-08-10T00:00:00Z',
    lastUpdate: '2024-03-07T16:20:00Z',
    nextAction: 'Prazo para recurso de apelação',
    nextActionDate: '2024-03-20T23:59:00Z',
    documents: [
      {
        id: '2',
        name: 'Contrato Comercial.pdf',
        type: 'application/pdf',
        size: 2048000,
        uploadedAt: '2024-01-10T14:00:00Z',
        uploadedBy: 'Dr. João Silva'
      }
    ],
    timeline: [
      {
        id: '3',
        title: 'Caso criado',
        description: 'Ação de cobrança protocolada',
        date: '2024-01-10T14:00:00Z',
        type: 'created',
        user: 'Dr. João Silva'
      }
    ],
    tags: ['cobrança', 'comercial'],
    createdAt: '2024-01-10T14:00:00Z',
    updatedAt: '2024-03-07T16:20:00Z'
  },
  {
    id: '4',
    title: 'Revisão de Contrato - Empresa ABC',
    description: 'Análise e revisão de contratos de fornecimento para adequação à nova legislação.',
    status: 'active',
    priority: 'medium',
    clientId: '3',
    clientName: 'Empresa ABC Ltda',
    clientType: 'company',
    clientDocument: '12.345.678/0001-90',
    clientEmail: 'contato@empresaabc.com',
    clientPhone: '(11) 3333-3333',
    lawyerId: '1',
    lawyerName: 'Dr. João Silva',
    court: '',
    subject: 'Direito Empresarial',
    value: 15000,
    startDate: '2024-03-01T00:00:00Z',
    expectedEndDate: '2024-04-30T00:00:00Z',
    lastUpdate: '2024-03-11T10:00:00Z',
    nextAction: 'Reunião para apresentar alterações sugeridas',
    nextActionDate: '2024-03-15T15:00:00Z',
    documents: [],
    timeline: [
      {
        id: '4',
        title: 'Caso criado',
        description: 'Revisão contratual solicitada',
        date: '2024-03-01T10:00:00Z',
        type: 'created',
        user: 'Dr. João Silva'
      }
    ],
    tags: ['contratos', 'empresarial'],
    relatedCases: ['3'], // Relacionado ao caso de cobrança da mesma empresa
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-11T10:00:00Z'
  }
];

// Simular delay de rede
const simulateDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));

class CasesService {
  async getCases(filters: CaseFilters = {}): Promise<CasesResponse> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay();
        
        let filteredCases = [...MOCK_CASES];
        
        // Aplicar filtros
        if (filters.status?.length) {
          filteredCases = filteredCases.filter(c => filters.status!.includes(c.status));
        }
        
        if (filters.priority?.length) {
          filteredCases = filteredCases.filter(c => filters.priority!.includes(c.priority));
        }
        
        if (filters.clientId) {
          filteredCases = filteredCases.filter(c => c.clientId === filters.clientId);
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredCases = filteredCases.filter(c => 
            c.title.toLowerCase().includes(searchLower) ||
            c.description.toLowerCase().includes(searchLower) ||
            c.clientName.toLowerCase().includes(searchLower)
          );
        }
        
        // Ordenação
        const sortBy = filters.sortBy || 'updatedAt';
        const sortOrder = filters.sortOrder || 'desc';
        
        filteredCases.sort((a, b) => {
          let aVal: any = a[sortBy];
          let bVal: any = b[sortBy];
          
          if (sortBy === 'priority') {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            aVal = priorityOrder[a.priority as keyof typeof priorityOrder];
            bVal = priorityOrder[b.priority as keyof typeof priorityOrder];
          }
          
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
        
        // Paginação
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCases = filteredCases.slice(startIndex, endIndex);
        
        return {
          cases: paginatedCases,
          total: filteredCases.length,
          page,
          limit,
          hasMore: endIndex < filteredCases.length
        };
      }
      
      // API real
      const response = await api.get('/cases', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar casos');
    }
  }
  
  async getCaseById(id: string): Promise<Case> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(500);
        
        const case_ = MOCK_CASES.find(c => c.id === id);
        if (!case_) {
          throw new Error('Caso não encontrado');
        }
        
        return case_;
      }
      
      const response = await api.get(`/cases/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar caso');
    }
  }
  
  async createCase(data: CreateCaseRequest): Promise<Case> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(1500);
        
        const newCase: Case = {
          id: (MOCK_CASES.length + 1).toString(),
          ...data,
          status: 'draft',
          lawyerId: '1',
          lawyerName: 'Dr. João Silva',
          clientName: `Cliente ${data.clientId}`,
          startDate: new Date().toISOString(),
          lastUpdate: new Date().toISOString(),
          documents: [],
          timeline: [{
            id: '1',
            title: 'Caso criado',
            description: 'Novo caso jurídico criado',
            date: new Date().toISOString(),
            type: 'created',
            user: 'Dr. João Silva'
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        MOCK_CASES.push(newCase);
        return newCase;
      }
      
      const response = await api.post('/cases', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar caso');
    }
  }
  
  async updateCase(id: string, data: UpdateCaseRequest): Promise<Case> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(1000);
        
        const caseIndex = MOCK_CASES.findIndex(c => c.id === id);
        if (caseIndex === -1) {
          throw new Error('Caso não encontrado');
        }
        
        const updatedCase = {
          ...MOCK_CASES[caseIndex],
          ...data,
          lastUpdate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        MOCK_CASES[caseIndex] = updatedCase;
        return updatedCase;
      }
      
      const response = await api.put(`/cases/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar caso');
    }
  }
  
  async deleteCase(id: string): Promise<void> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(800);
        
        const caseIndex = MOCK_CASES.findIndex(c => c.id === id);
        if (caseIndex === -1) {
          throw new Error('Caso não encontrado');
        }
        
        MOCK_CASES.splice(caseIndex, 1);
        return;
      }
      
      await api.delete(`/cases/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar caso');
    }
  }
  
  async addCaseNote(id: string, note: string): Promise<CaseTimelineItem> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(500);
        
        const case_ = MOCK_CASES.find(c => c.id === id);
        if (!case_) {
          throw new Error('Caso não encontrado');
        }
        
        const newNote: CaseTimelineItem = {
          id: (case_.timeline.length + 1).toString(),
          title: 'Anotação adicionada',
          description: note,
          date: new Date().toISOString(),
          type: 'note',
          user: 'Dr. João Silva'
        };
        
        case_.timeline.push(newNote);
        case_.lastUpdate = new Date().toISOString();
        case_.updatedAt = new Date().toISOString();
        
        return newNote;
      }
      
      const response = await api.post(`/cases/${id}/notes`, { note });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar anotação');
    }
  }
  // Adicionar método para buscar casos por cliente (adicionar na classe CasesService):
  async getCasesByClient(clientId: string): Promise<Case[]> {
  try {
    if (import.meta.env.VITE_MOCK_API !== 'false') {
      await simulateDelay(500);
      
      return MOCK_CASES.filter(c => c.clientId === clientId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    
      const response = await api.get(`/cases?clientId=${clientId}`);
      return response.data.cases || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar casos do cliente');
    }
  }

  // Adicionar método para vincular caso ao cliente:
  async linkCaseToClient(caseId: string, clientId: string): Promise<void> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(500);
      
        const caseIndex = MOCK_CASES.findIndex(c => c.id === caseId);
        if (caseIndex !== -1) {
          MOCK_CASES[caseIndex].clientId = clientId;
          MOCK_CASES[caseIndex].updatedAt = new Date().toISOString();
        }
        return;
      }
    
      await api.put(`/cases/${caseId}/link-client`, { clientId });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao vincular caso ao cliente');
    }
  }

  // Adicionar método para obter estatísticas do relacionamento cliente-caso:
  async getClientCaseStats(clientId: string): Promise<{
    totalCases: number;
    activeCases: number;
   concludedCases: number;
    totalValue: number;
  }> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(300);
      
        const clientCases = MOCK_CASES.filter(c => c.clientId === clientId);
      
        return {
          totalCases: clientCases.length,
          activeCases: clientCases.filter(c => ['active', 'in_court'].includes(c.status)).length,
          concludedCases: clientCases.filter(c => c.status === 'concluded').length,
          totalValue: clientCases.reduce((sum, c) => sum + (c.value || 0), 0)
        };
      }
    
      const response = await api.get(`/clients/${clientId}/case-stats`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao obter estatísticas');
    }
  }
  
  // Funções utilitárias
  getStatusLabel(status: CaseStatus): string {
    const labels = {
      draft: 'Rascunho',
      active: 'Em andamento',
      waiting_documents: 'Aguardando documentos',
      in_court: 'Em tribunal',
      appealing: 'Em recurso',
      concluded: 'Concluído',
      archived: 'Arquivado'
    };
    return labels[status];
  }
  
  getPriorityLabel(priority: CasePriority): string {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority];
  }
  
  getStatusColor(status: CaseStatus): string {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      waiting_documents: 'bg-yellow-100 text-yellow-800',
      in_court: 'bg-blue-100 text-blue-800',
      appealing: 'bg-purple-100 text-purple-800',
      concluded: 'bg-emerald-100 text-emerald-800',
      archived: 'bg-slate-100 text-slate-800'
    };
    return colors[status];
  }
  
  getPriorityColor(priority: CasePriority): string {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority];
  }
}

export const casesService = new CasesService();

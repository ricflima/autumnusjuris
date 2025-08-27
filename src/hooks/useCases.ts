// src/hooks/useCases.ts

import { useQuery } from '@tanstack/react-query';

// Tipos básicos (versão simplificada)
export interface Case {
  id: string;
  title: string;
  description: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'closed' | 'suspended' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  area: string;
  createdAt: string;
  updatedAt?: string;
  startDate: string;
  expectedEndDate?: string;
  totalValue?: number;
}

export interface CasesResponse {
  cases: Case[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CaseFilters {
  search?: string;
  status?: string[];
  priority?: string[];
  clientId?: string;
  area?: string;
  page?: number;
  limit?: number;
}

// Mock data básico para desenvolvimento
const MOCK_CASES: Case[] = [
  {
    id: '1',
    title: 'Processo Trabalhista - Horas Extras',
    description: 'Ação trabalhista para cobrança de horas extras não pagas',
    caseNumber: '5001234-12.2024.5.02.0001',
    clientId: '1',
    clientName: 'João Silva',
    status: 'active',
    priority: 'high',
    area: 'Direito Trabalhista',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-10T14:30:00Z',
    startDate: '2024-01-15',
    expectedEndDate: '2024-12-15',
    totalValue: 25000
  },
  {
    id: '2',
    title: 'Divórcio Consensual',
    description: 'Processo de divórcio consensual com partilha de bens',
    caseNumber: 'DIV-2024-002',
    clientId: '2',
    clientName: 'Maria Santos',
    status: 'active',
    priority: 'medium',
    area: 'Direito de Família',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-09T16:20:00Z',
    startDate: '2024-02-01',
    expectedEndDate: '2024-08-01',
    totalValue: 8000
  },
  {
    id: '3',
    title: 'Consultoria Jurídica Empresarial',
    description: 'Assessoria jurídica continuada para questões empresariais',
    caseNumber: 'CONS-2024-003',
    clientId: '3',
    clientName: 'Empresa ABC Ltda',
    status: 'active',
    priority: 'medium',
    area: 'Direito Empresarial',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-03-25T09:45:00Z',
    startDate: '2024-01-10',
    totalValue: 48000
  },
  {
    id: '4',
    title: 'Ação de Cobrança',
    description: 'Cobrança de débito em aberto com cliente inadimplente',
    caseNumber: 'COB-2024-004',
    clientId: '4',
    clientName: 'Pedro Oliveira',
    status: 'active',
    priority: 'low',
    area: 'Direito Civil',
    createdAt: '2024-03-05T10:00:00Z',
    startDate: '2024-03-05',
    expectedEndDate: '2024-09-05',
    totalValue: 12000
  },
  {
    id: '5',
    title: 'Contrato de Software',
    description: 'Elaboração e revisão de contratos de licenciamento de software',
    caseNumber: 'CONT-2024-005',
    clientId: '5',
    clientName: 'Tech Solutions Ltda',
    status: 'closed',
    priority: 'medium',
    area: 'Direito Digital',
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-03-15T11:00:00Z',
    startDate: '2024-02-20',
    expectedEndDate: '2024-03-20',
    totalValue: 5000
  },
  {
    id: '6',
    title: 'Defesa Criminal - Trânsito',
    description: 'Defesa em processo criminal por infração de trânsito',
    caseNumber: 'CRIM-2024-006',
    clientId: '1',
    clientName: 'João Silva',
    status: 'active',
    priority: 'urgent',
    area: 'Direito Criminal',
    createdAt: '2024-03-01T10:00:00Z',
    startDate: '2024-03-01',
    expectedEndDate: '2024-10-01',
    totalValue: 15000
  }
];

// Simulação de service
const casesService = {
  async getCases(filters: CaseFilters = {}): Promise<CasesResponse> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredCases = [...MOCK_CASES];
    
    // Aplicar filtros
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredCases = filteredCases.filter(caseItem =>
        caseItem.title.toLowerCase().includes(search) ||
        caseItem.description.toLowerCase().includes(search) ||
        caseItem.caseNumber.toLowerCase().includes(search) ||
        caseItem.clientName.toLowerCase().includes(search)
      );
    }
    
    if (filters.status && filters.status.length > 0) {
      filteredCases = filteredCases.filter(caseItem =>
        filters.status!.includes(caseItem.status)
      );
    }
    
    if (filters.priority && filters.priority.length > 0) {
      filteredCases = filteredCases.filter(caseItem =>
        filters.priority!.includes(caseItem.priority)
      );
    }
    
    if (filters.clientId) {
      filteredCases = filteredCases.filter(caseItem =>
        caseItem.clientId === filters.clientId
      );
    }
    
    if (filters.area) {
      filteredCases = filteredCases.filter(caseItem =>
        caseItem.area === filters.area
      );
    }
    
    // Paginação básica
    const page = filters.page || 1;
    const limit = filters.limit || 50; // Limite maior para não quebrar funcionalidade
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
};

// Query keys
export const CASES_KEYS = {
  all: ['cases'] as const,
  lists: () => [...CASES_KEYS.all, 'list'] as const,
  list: (filters: CaseFilters) => [...CASES_KEYS.lists(), filters] as const,
  details: () => [...CASES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CASES_KEYS.details(), id] as const,
};

// Hooks
export function useCases(filters: CaseFilters = {}) {
  return useQuery({
    queryKey: CASES_KEYS.list(filters),
    queryFn: () => casesService.getCases(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: CASES_KEYS.detail(id),
    queryFn: async () => {
      const response = await casesService.getCases();
      return response.cases.find(caseItem => caseItem.id === id) || null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook para casos de um cliente específico
export function useClientCases(clientId: string) {
  return useCases({ clientId });
}
// src/hooks/useClients.ts

import { useQuery } from '@tanstack/react-query';

// Tipos básicos (versão simplificada)
export interface Client {
  id: string;
  name: string;
  email: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  phone?: string;
  type: 'individual' | 'company';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ClientFilters {
  search?: string;
  status?: string[];
  type?: string[];
  page?: number;
  limit?: number;
}

// Mock data básico para desenvolvimento
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    document: '123.456.789-00',
    documentType: 'cpf',
    phone: '(11) 99999-9999',
    type: 'individual',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    document: '987.654.321-00',
    documentType: 'cpf',
    phone: '(11) 88888-8888',
    type: 'individual',
    status: 'active',
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: '3',
    name: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com',
    document: '12.345.678/0001-90',
    documentType: 'cnpj',
    phone: '(11) 3333-3333',
    type: 'company',
    status: 'active',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '4',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    document: '555.666.777-88',
    documentType: 'cpf',
    phone: '(11) 77777-7777',
    type: 'individual',
    status: 'active',
    createdAt: '2024-03-05T10:00:00Z'
  },
  {
    id: '5',
    name: 'Tech Solutions Ltda',
    email: 'contato@techsolutions.com',
    document: '98.765.432/0001-10',
    documentType: 'cnpj',
    phone: '(11) 2222-2222',
    type: 'company',
    status: 'active',
    createdAt: '2024-02-20T10:00:00Z'
  }
];

// Simulação de service
const clientsService = {
  async getClients(filters: ClientFilters = {}): Promise<ClientsResponse> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredClients = [...MOCK_CLIENTS];
    
    // Aplicar filtros
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredClients = filteredClients.filter(client =>
        client.name.toLowerCase().includes(search) ||
        client.email.toLowerCase().includes(search) ||
        client.document.includes(search)
      );
    }
    
    if (filters.status && filters.status.length > 0) {
      filteredClients = filteredClients.filter(client =>
        filters.status!.includes(client.status)
      );
    }
    
    if (filters.type && filters.type.length > 0) {
      filteredClients = filteredClients.filter(client =>
        filters.type!.includes(client.type)
      );
    }
    
    // Paginação básica
    const page = filters.page || 1;
    const limit = filters.limit || 50; // Limite maior para não quebrar funcionalidade
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedClients = filteredClients.slice(startIndex, endIndex);
    
    return {
      clients: paginatedClients,
      total: filteredClients.length,
      page,
      limit,
      hasMore: endIndex < filteredClients.length
    };
  }
};

// Query keys
export const CLIENTS_KEYS = {
  all: ['clients'] as const,
  lists: () => [...CLIENTS_KEYS.all, 'list'] as const,
  list: (filters: ClientFilters) => [...CLIENTS_KEYS.lists(), filters] as const,
  details: () => [...CLIENTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLIENTS_KEYS.details(), id] as const,
};

// Hooks
export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: CLIENTS_KEYS.list(filters),
    queryFn: () => clientsService.getClients(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: CLIENTS_KEYS.detail(id),
    queryFn: async () => {
      const response = await clientsService.getClients();
      return response.clients.find(client => client.id === id) || null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
// src/services/clients.service.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.25.132.0:3001/api';

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

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  type: 'individual' | 'company';
  status: ClientStatus;
  classification: ClientClassification;
  address: Address;
  contactPerson?: string;
  birthDate?: string;
  profession?: string;
  maritalStatus?: string;
  notes: string;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastContact?: string;
  totalCases: number;
  activeCases: number;
  totalBilled: number;
  avatar?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ClientInteraction {
  id: string;
  clientId: string;
  type: InteractionType;
  subject: string;
  description: string;
  date: string;
  userId: string;
  userName: string;
  attachments?: InteractionAttachment[];
  createdAt: string;
}

export interface InteractionAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'former';
export type ClientClassification = 'vip' | 'premium' | 'standard' | 'basic';
export type InteractionType = 'call' | 'email' | 'meeting' | 'document' | 'note' | 'task';

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  type: 'individual' | 'company';
  classification: ClientClassification;
  address: Address;
  contactPerson?: string;
  birthDate?: string;
  profession?: string;
  maritalStatus?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: ClientStatus;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ClientFilters {
  status?: ClientStatus[];
  classification?: ClientClassification[];
  type?: ('individual' | 'company')[];
  search?: string;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'lastContact' | 'totalCases' | 'totalBilled' | 'classification';
  sortOrder?: 'asc' | 'desc';
}

class ClientsService {
  async getClients(filters: ClientFilters = {}): Promise<ClientsResponse> {
    try {
      const response = await api.get('/clients', { params: filters });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar clientes');
    }
  }

  async getClientById(id: string): Promise<Client> {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar cliente:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar cliente');
    }
  }

  async createClient(data: CreateClientRequest): Promise<Client> {
    try {
      const response = await api.post('/clients', data);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      throw new Error(error.response?.data?.message || 'Erro ao criar cliente');
    }
  }

  async updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
    try {
      const response = await api.put(`/clients/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error(error.response?.data?.message || 'Erro ao atualizar cliente');
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      await api.delete(`/clients/${id}`);
    } catch (error: any) {
      console.error('Erro ao deletar cliente:', error);
      throw new Error(error.response?.data?.message || 'Erro ao deletar cliente');
    }
  }

  async getClientInteractions(clientId: string): Promise<ClientInteraction[]> {
    try {
      const response = await api.get(`/clients/${clientId}/interactions`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar interações:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar interações');
    }
  }

  async addClientInteraction(clientId: string, interaction: Omit<ClientInteraction, 'id' | 'clientId' | 'createdAt'>): Promise<ClientInteraction> {
    try {
      const response = await api.post(`/clients/${clientId}/interactions`, interaction);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao adicionar interação:', error);
      throw new Error(error.response?.data?.message || 'Erro ao adicionar interação');
    }
  }

  // Funções utilitárias
  getStatusLabel(status: ClientStatus): string {
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      prospect: 'Prospect',
      former: 'Ex-cliente'
    };
    return labels[status];
  }

  getClassificationLabel(classification: ClientClassification): string {
    const labels = {
      vip: 'VIP',
      premium: 'Premium',
      standard: 'Padrão',
      basic: 'Básico'
    };
    return labels[classification];
  }

  getTypeLabel(type: 'individual' | 'company'): string {
    const labels = {
      individual: 'Pessoa Física',
      company: 'Pessoa Jurídica'
    };
    return labels[type];
  }

  getStatusColor(status: ClientStatus): string {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      prospect: 'bg-blue-100 text-blue-800',
      former: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status];
  }

  getClassificationColor(classification: ClientClassification): string {
    const colors = {
      vip: 'bg-purple-100 text-purple-800',
      premium: 'bg-indigo-100 text-indigo-800',
      standard: 'bg-blue-100 text-blue-800',
      basic: 'bg-gray-100 text-gray-800'
    };
    return colors[classification];
  }

  formatDocument(document: string, type: 'cpf' | 'cnpj'): string {
    if (type === 'cpf') {
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  }

  formatPhone(phone: string): string {
    return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  }
}

export const clientsService = new ClientsService();
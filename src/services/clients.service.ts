// src/services/clients.service.ts
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

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string; // CPF ou CNPJ
  documentType: 'cpf' | 'cnpj';
  type: 'individual' | 'company';
  status: ClientStatus;
  classification: ClientClassification;
  address: Address;
  contactPerson?: string; // Para empresas
  birthDate?: string; // Para pessoas físicas
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

// Mock data para desenvolvimento
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    document: '123.456.789-00',
    documentType: 'cpf',
    type: 'individual',
    status: 'active',
    classification: 'premium',
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil'
    },
    birthDate: '1985-06-15',
    profession: 'Engenheiro',
    maritalStatus: 'Casado',
    notes: 'Cliente muito pontual e organizado. Sempre traz toda documentação necessária.',
    customFields: {},
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-10T14:30:00Z',
    lastContact: '2024-03-08T09:00:00Z',
    totalCases: 3,
    activeCases: 1,
    totalBilled: 25000
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 88888-8888',
    document: '987.654.321-00',
    documentType: 'cpf',
    type: 'individual',
    status: 'active',
    classification: 'standard',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil'
    },
    birthDate: '1978-03-22',
    profession: 'Professora',
    maritalStatus: 'Divorciada',
    notes: 'Caso de divórcio consensual. Cliente colaborativa e compreensiva.',
    customFields: {},
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-09T16:20:00Z',
    lastContact: '2024-03-09T14:00:00Z',
    totalCases: 1,
    activeCases: 1,
    totalBilled: 8000
  },
  {
    id: '3',
    name: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com',
    phone: '(11) 3333-3333',
    document: '12.345.678/0001-90',
    documentType: 'cnpj',
    type: 'company',
    status: 'active',
    classification: 'vip',
    address: {
      street: 'Rua do Comércio',
      number: '456',
      neighborhood: 'Vila Olimpia',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04551-060',
      country: 'Brasil'
    },
    contactPerson: 'Carlos Oliveira (Diretor Jurídico)',
    notes: 'Grande empresa cliente. Múltiplos contratos e demandas regulares.',
    customFields: {
      segmento: 'Tecnologia',
      funcionarios: 150
    },
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-03-07T11:15:00Z',
    lastContact: '2024-03-05T15:30:00Z',
    totalCases: 5,
    activeCases: 2,
    totalBilled: 85000
  },
  {
    id: '4',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '(11) 77777-7777',
    document: '456.789.123-00',
    documentType: 'cpf',
    type: 'individual',
    status: 'prospect',
    classification: 'basic',
    address: {
      street: 'Rua das Palmeiras',
      number: '789',
      neighborhood: 'Morumbi',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05651-000',
      country: 'Brasil'
    },
    birthDate: '1990-11-03',
    profession: 'Médico',
    maritalStatus: 'Solteiro',
    notes: 'Prospect interessado em consultoria tributária. Aguardando proposta.',
    customFields: {},
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    totalCases: 0,
    activeCases: 0,
    totalBilled: 0
  },
  {
    id: '5',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 66666-6666',
    document: '321.654.987-00',
    documentType: 'cpf',
    type: 'individual',
    status: 'former',
    classification: 'standard',
    address: {
      street: 'Rua dos Jardins',
      number: '321',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01404-000',
      country: 'Brasil'
    },
    birthDate: '1983-09-12',
    profession: 'Arquiteta',
    maritalStatus: 'Casada',
    notes: 'Ex-cliente. Caso trabalhista resolvido com sucesso em 2023.',
    customFields: {},
    createdAt: '2023-05-10T10:00:00Z',
    updatedAt: '2023-12-15T10:00:00Z',
    lastContact: '2023-12-15T10:00:00Z',
    totalCases: 1,
    activeCases: 0,
    totalBilled: 12000
  }
];

const MOCK_INTERACTIONS: ClientInteraction[] = [
  {
    id: '1',
    clientId: '1',
    type: 'meeting',
    subject: 'Reunião inicial - Processo Trabalhista',
    description: 'Reunião para discutir os detalhes do processo trabalhista. Cliente apresentou toda documentação necessária.',
    date: '2024-03-08T09:00:00Z',
    userId: '1',
    userName: 'Dr. João Silva',
    createdAt: '2024-03-08T09:30:00Z'
  },
  {
    id: '2',
    clientId: '1',
    type: 'call',
    subject: 'Atualização sobre audiência',
    description: 'Ligação para informar data da audiência de conciliação marcada para 15/03.',
    date: '2024-03-10T14:00:00Z',
    userId: '1',
    userName: 'Dr. João Silva',
    createdAt: '2024-03-10T14:05:00Z'
  },
  {
    id: '3',
    clientId: '2',
    type: 'email',
    subject: 'Documentos para divórcio',
    description: 'Enviado lista de documentos necessários para prosseguir com o divórcio consensual.',
    date: '2024-03-09T14:00:00Z',
    userId: '2',
    userName: 'Dra. Maria Santos',
    createdAt: '2024-03-09T14:00:00Z'
  },
  {
    id: '4',
    clientId: '3',
    type: 'meeting',
    subject: 'Revisão de contratos',
    description: 'Reunião mensal para revisão dos contratos comerciais da empresa.',
    date: '2024-03-05T15:30:00Z',
    userId: '1',
    userName: 'Dr. João Silva',
    createdAt: '2024-03-05T16:00:00Z'
  }
];

// Simular delay de rede
const simulateDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));

class ClientsService {
  async getClients(filters: ClientFilters = {}): Promise<ClientsResponse> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay();
        
        let filteredClients = [...MOCK_CLIENTS];
        
        // Aplicar filtros
        if (filters.status?.length) {
          filteredClients = filteredClients.filter(c => filters.status!.includes(c.status));
        }
        
        if (filters.classification?.length) {
          filteredClients = filteredClients.filter(c => filters.classification!.includes(c.classification));
        }
        
        if (filters.type?.length) {
          filteredClients = filteredClients.filter(c => filters.type!.includes(c.type));
        }
        
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredClients = filteredClients.filter(c => 
            c.name.toLowerCase().includes(searchLower) ||
            c.email.toLowerCase().includes(searchLower) ||
            c.document.includes(searchLower) ||
            c.address.city.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.city) {
          filteredClients = filteredClients.filter(c => 
            c.address.city.toLowerCase().includes(filters.city!.toLowerCase())
          );
        }
        
        if (filters.state) {
          filteredClients = filteredClients.filter(c => c.address.state === filters.state);
        }
        
        // Ordenação
        const sortBy = filters.sortBy || 'name';
        const sortOrder = filters.sortOrder || 'asc';
        
        filteredClients.sort((a, b) => {
          let result = 0;

          if (sortBy === 'classification') {
            const classOrder = { vip: 4, premium: 3, standard: 2, basic: 1 };
            const aVal = classOrder[a.classification] || 0;
            const bVal = classOrder[b.classification] || 0;
            result = aVal - bVal;
          } else if (sortBy === 'name') {
            result = a.name.localeCompare(b.name);
          } else if (sortBy === 'createdAt' || sortBy === 'lastContact') {
            const aDate = a[sortBy] ? new Date(a[sortBy] as string).getTime() : 0;
            const bDate = b[sortBy] ? new Date(b[sortBy] as string).getTime() : 0;
            result = aDate - bDate;
          } else if (sortBy === 'totalCases' || sortBy === 'totalBilled') {
            result = (a[sortBy] as number) - (b[sortBy] as number);
          } else {
            // fallback para string
            result = String(a[sortBy] || '').localeCompare(String(b[sortBy] || ''));
          }

          return sortOrder === 'asc' ? result : -result;
        });
        
        // Paginação
        const page = filters.page || 1;
        const limit = filters.limit || 10;
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
      
      // API real
      const response = await api.get('/clients', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar clientes');
    }
  }
  
  async getClientById(id: string): Promise<Client> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(500);
        
        const client = MOCK_CLIENTS.find(c => c.id === id);
        if (!client) {
          throw new Error('Cliente não encontrado');
        }
        
        return client;
      }
      
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar cliente');
    }
  }
  
  async createClient(data: CreateClientRequest): Promise<Client> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(1500);
        
        const newClient: Client = {
          id: (MOCK_CLIENTS.length + 1).toString(),
          ...data,
          status: 'active',
          notes: data.notes || '',
          customFields: data.customFields || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalCases: 0,
          activeCases: 0,
          totalBilled: 0
        };
        
        MOCK_CLIENTS.push(newClient);
        return newClient;
      }
      
      const response = await api.post('/clients', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar cliente');
    }
  }
  
  async updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(1000);
        
        const clientIndex = MOCK_CLIENTS.findIndex(c => c.id === id);
        if (clientIndex === -1) {
          throw new Error('Cliente não encontrado');
        }
        
        const updatedClient = {
          ...MOCK_CLIENTS[clientIndex],
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        MOCK_CLIENTS[clientIndex] = updatedClient;
        return updatedClient;
      }
      
      const response = await api.put(`/clients/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar cliente');
    }
  }
  
  async deleteClient(id: string): Promise<void> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(800);
        
        const clientIndex = MOCK_CLIENTS.findIndex(c => c.id === id);
        if (clientIndex === -1) {
          throw new Error('Cliente não encontrado');
        }
        
        MOCK_CLIENTS.splice(clientIndex, 1);
        return;
      }
      
      await api.delete(`/clients/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao deletar cliente');
    }
  }
  
  async getClientInteractions(clientId: string): Promise<ClientInteraction[]> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(500);
        
        return MOCK_INTERACTIONS.filter(i => i.clientId === clientId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      const response = await api.get(`/clients/${clientId}/interactions`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao buscar interações');
    }
  }
  
  async addClientInteraction(clientId: string, interaction: Omit<ClientInteraction, 'id' | 'clientId' | 'createdAt'>): Promise<ClientInteraction> {
    try {
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(500);
        
        const newInteraction: ClientInteraction = {
          ...interaction,
          id: (MOCK_INTERACTIONS.length + 1).toString(),
          clientId,
          createdAt: new Date().toISOString()
        };
        
        MOCK_INTERACTIONS.push(newInteraction);
        
        // Atualizar lastContact do cliente
        const clientIndex = MOCK_CLIENTS.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
          MOCK_CLIENTS[clientIndex].lastContact = newInteraction.date;
          MOCK_CLIENTS[clientIndex].updatedAt = new Date().toISOString();
        }
        
        return newInteraction;
      }
      
      const response = await api.post(`/clients/${clientId}/interactions`, interaction);
      return response.data;
    } catch (error: any) {
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

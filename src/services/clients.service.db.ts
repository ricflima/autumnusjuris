// src/services/clients.service.db.ts
import { pool, query } from '../lib/database';

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

// Mapear dados do PostgreSQL para o formato da interface
const mapClientFromDB = (row: any): Client => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  document: row.document,
  documentType: row.document_type,
  type: row.type,
  status: row.status,
  classification: row.classification,
  address: {
    street: row.street || '',
    number: row.number || '',
    complement: row.complement || '',
    neighborhood: row.neighborhood || '',
    city: row.city || '',
    state: row.state || '',
    zipCode: row.zip_code || '',
    country: row.country || 'Brasil'
  },
  contactPerson: row.contact_person,
  birthDate: row.birth_date,
  profession: row.profession,
  maritalStatus: row.marital_status,
  notes: row.notes || '',
  customFields: row.custom_fields || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastContact: row.last_contact,
  totalCases: row.total_cases || 0,
  activeCases: row.active_cases || 0,
  totalBilled: parseFloat(row.total_billed || '0'),
  avatar: row.avatar_url
});

class ClientsService {
  async getClients(filters: ClientFilters = {}): Promise<ClientsResponse> {
    try {
      let whereConditions = [];
      let queryParams: any[] = [];
      let paramCount = 0;

      // Construir filtros WHERE
      if (filters.status?.length) {
        paramCount++;
        whereConditions.push(`status = ANY($${paramCount})`);
        queryParams.push(filters.status);
      }

      if (filters.classification?.length) {
        paramCount++;
        whereConditions.push(`classification = ANY($${paramCount})`);
        queryParams.push(filters.classification);
      }

      if (filters.type?.length) {
        paramCount++;
        whereConditions.push(`type = ANY($${paramCount})`);
        queryParams.push(filters.type);
      }

      if (filters.search) {
        paramCount++;
        whereConditions.push(`(
          name ILIKE $${paramCount} OR 
          email ILIKE $${paramCount} OR 
          document ILIKE $${paramCount} OR 
          city ILIKE $${paramCount}
        )`);
        queryParams.push(`%${filters.search}%`);
      }

      if (filters.city) {
        paramCount++;
        whereConditions.push(`city ILIKE $${paramCount}`);
        queryParams.push(`%${filters.city}%`);
      }

      if (filters.state) {
        paramCount++;
        whereConditions.push(`state = $${paramCount}`);
        queryParams.push(filters.state);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Construir ORDER BY
      const sortBy = filters.sortBy || 'name';
      const sortOrder = filters.sortOrder || 'asc';
      let orderByClause = '';

      switch (sortBy) {
        case 'classification':
          orderByClause = `ORDER BY 
            CASE classification 
              WHEN 'vip' THEN 4 
              WHEN 'premium' THEN 3 
              WHEN 'standard' THEN 2 
              WHEN 'basic' THEN 1 
              ELSE 0 
            END ${sortOrder.toUpperCase()}`;
          break;
        case 'createdAt':
          orderByClause = `ORDER BY created_at ${sortOrder.toUpperCase()}`;
          break;
        case 'lastContact':
          orderByClause = `ORDER BY last_contact ${sortOrder.toUpperCase()} NULLS LAST`;
          break;
        case 'totalCases':
          orderByClause = `ORDER BY total_cases ${sortOrder.toUpperCase()}`;
          break;
        case 'totalBilled':
          orderByClause = `ORDER BY total_billed ${sortOrder.toUpperCase()}`;
          break;
        default:
          orderByClause = `ORDER BY name ${sortOrder.toUpperCase()}`;
      }

      // Paginação
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      paramCount++;
      const limitParam = paramCount;
      queryParams.push(limit);
      
      paramCount++;
      const offsetParam = paramCount;
      queryParams.push(offset);

      // Query principal
      const mainQuery = `
        SELECT * FROM clients 
        ${whereClause} 
        ${orderByClause} 
        LIMIT $${limitParam} OFFSET $${offsetParam}
      `;

      const result = await query(mainQuery, queryParams);

      // Query para contar total
      const countQuery = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
      const countResult = await query(countQuery, queryParams.slice(0, paramCount - 2));
      const total = parseInt(countResult.rows[0].total);

      const clients = result.rows.map(mapClientFromDB);

      return {
        clients,
        total,
        page,
        limit,
        hasMore: offset + limit < total
      };
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error('Erro ao buscar clientes');
    }
  }

  async getClientById(id: string): Promise<Client> {
    try {
      const result = await query('SELECT * FROM clients WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }

      return mapClientFromDB(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao buscar cliente:', error);
      throw new Error('Erro ao buscar cliente');
    }
  }

  async createClient(data: CreateClientRequest): Promise<Client> {
    try {
      const result = await query(`
        INSERT INTO clients (
          name, email, phone, document, document_type, type, classification,
          street, number, complement, neighborhood, city, state, zip_code, country,
          birth_date, profession, marital_status, contact_person, notes, custom_fields
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21
        ) RETURNING *
      `, [
        data.name, data.email, data.phone, data.document, data.documentType, data.type, data.classification,
        data.address.street, data.address.number, data.address.complement, data.address.neighborhood,
        data.address.city, data.address.state, data.address.zipCode, data.address.country || 'Brasil',
        data.birthDate, data.profession, data.maritalStatus, data.contactPerson, data.notes || '',
        JSON.stringify(data.customFields || {})
      ]);

      return mapClientFromDB(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Erro ao criar cliente');
    }
  }

  async updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
    try {
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      // Construir campos para atualização
      const fields = [
        'name', 'email', 'phone', 'status', 'classification', 'profession', 
        'maritalStatus', 'contactPerson', 'notes', 'birthDate'
      ];

      fields.forEach(field => {
        if (data[field as keyof UpdateClientRequest] !== undefined) {
          paramCount++;
          updateFields.push(`${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount}`);
          values.push(data[field as keyof UpdateClientRequest]);
        }
      });

      // Campos de endereço
      if (data.address) {
        const addressFields = ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipCode', 'country'];
        addressFields.forEach(field => {
          const value = data.address![field as keyof Address];
          if (value !== undefined) {
            paramCount++;
            const dbField = field === 'zipCode' ? 'zip_code' : field.replace(/([A-Z])/g, '_$1').toLowerCase();
            updateFields.push(`${dbField} = $${paramCount}`);
            values.push(value);
          }
        });
      }

      if (data.customFields !== undefined) {
        paramCount++;
        updateFields.push(`custom_fields = $${paramCount}`);
        values.push(JSON.stringify(data.customFields));
      }

      if (updateFields.length === 0) {
        throw new Error('Nenhum campo para atualização');
      }

      paramCount++;
      values.push(id);

      const updateQuery = `
        UPDATE clients 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }

      return mapClientFromDB(result.rows[0]);
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error('Erro ao atualizar cliente');
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
      const result = await query('DELETE FROM clients WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        throw new Error('Cliente não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao deletar cliente:', error);
      throw new Error('Erro ao deletar cliente');
    }
  }

  async getClientInteractions(clientId: string): Promise<ClientInteraction[]> {
    try {
      const result = await query(`
        SELECT 
          ci.id, ci.client_id, ci.type, ci.subject, ci.description,
          ci.interaction_date as date, ci.user_id, ci.attachments, ci.created_at,
          u.full_name as user_name
        FROM client_interactions ci
        LEFT JOIN users u ON ci.user_id = u.id
        WHERE ci.client_id = $1
        ORDER BY ci.interaction_date DESC
      `, [clientId]);

      return result.rows.map(row => ({
        id: row.id,
        clientId: row.client_id,
        type: row.type,
        subject: row.subject,
        description: row.description,
        date: row.date,
        userId: row.user_id,
        userName: row.user_name || 'Usuário Desconhecido',
        attachments: row.attachments || [],
        createdAt: row.created_at
      }));
    } catch (error: any) {
      console.error('Erro ao buscar interações:', error);
      throw new Error('Erro ao buscar interações');
    }
  }

  async addClientInteraction(
    clientId: string,
    interaction: Omit<ClientInteraction, 'id' | 'clientId' | 'createdAt'>
  ): Promise<ClientInteraction> {
    try {
      const result = await query(`
        INSERT INTO client_interactions (
          client_id, user_id, type, subject, description, interaction_date, attachments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        clientId, interaction.userId, interaction.type, interaction.subject,
        interaction.description, interaction.date, JSON.stringify(interaction.attachments || [])
      ]);

      // Atualizar lastContact do cliente
      await query(`
        UPDATE clients 
        SET last_contact = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [interaction.date, clientId]);

      return {
        id: result.rows[0].id,
        clientId: result.rows[0].client_id,
        type: result.rows[0].type,
        subject: result.rows[0].subject,
        description: result.rows[0].description,
        date: result.rows[0].interaction_date,
        userId: result.rows[0].user_id,
        userName: interaction.userName,
        attachments: result.rows[0].attachments || [],
        createdAt: result.rows[0].created_at
      };
    } catch (error: any) {
      console.error('Erro ao adicionar interação:', error);
      throw new Error('Erro ao adicionar interação');
    }
  }

  // Funções utilitárias (mantidas)
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
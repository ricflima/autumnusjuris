// src/services/tribunals/database/tribunalDatabase.service.ts

import { TribunalMovement, ScrapingResult } from '../../../types/tribunal.types';
import { CNJProcessNumber } from '../parsers/cnj.parser';

/**
 * Interface para processo monitorado
 */
export interface MonitoredProcess {
  id: string;
  cnjNumber: string;
  cleanNumber: string;
  tribunalCode: string;
  tribunalName: string;
  status: 'active' | 'suspended' | 'archived';
  monitoringFrequency: number; // minutos
  lastQueryAt?: string;
  lastMovementAt?: string;
  totalMovements: number;
  contentHash?: string;
  basicInfo?: any; // Informações básicas do processo
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Interface para movimentação persistida
 */
export interface PersistedMovement {
  id: string;
  processId: string;
  movementId: string;
  movementDate: string;
  movementDatetime?: string;
  title: string;
  description?: string;
  movementType?: string;
  isPublic: boolean;
  author?: string;
  destination?: string;
  attachments?: any;
  rawContent?: string;
  contentHash: string;
  tribunalSource: string;
  queryTimestamp: string;
  isNew: boolean;
  newUntil?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para estatísticas do tribunal
 */
export interface TribunalStatistics {
  tribunalCode: string;
  tribunalName: string;
  totalProcesses: number;
  totalMovements: number;
  newMovements: number;
  lastQuery?: string;
  avgResponseTime?: number;
}

/**
 * Interface para cache de consulta
 */
export interface QueryCache {
  id: string;
  cacheKey: string;
  cnjNumber: string;
  tribunalCode: string;
  queryResult: any; // Resultado da consulta
  contentHash: string;
  queryStatus: string;
  expiresAt: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service para gerenciar persistência das consultas de tribunal
 */
export default class TribunalDatabaseService {
  private static instance: TribunalDatabaseService;
  private static apiUrl = 'http://172.25.132.0:3001/api';
  
  private constructor() {}
  
  static getInstance(): TribunalDatabaseService {
    if (!TribunalDatabaseService.instance) {
      TribunalDatabaseService.instance = new TribunalDatabaseService();
    }
    return TribunalDatabaseService.instance;
  }
  
  async initialize(): Promise<void> {
    // Inicialização se necessária
    console.log('[TribunalDatabase] Serviço inicializado');
  }
  
  async saveMovements(
    processNumber: string, 
    tribunal: string, 
    movements: any[], 
    novelties: any[]
  ): Promise<void> {
    // Implementar salvamento das movimentações
    console.log(`[TribunalDatabase] Salvando ${movements.length} movimentações`);
  }
  
  /**
   * Adiciona um processo para monitoramento
   */
  static async addMonitoredProcess(
    cnj: CNJProcessNumber,
    tribunalCode: string,
    userId?: string
  ): Promise<MonitoredProcess> {
    const processData = {
      cnj_number: cnj.formattedNumber,
      clean_number: cnj.cleanNumber,
      tribunal_code: tribunalCode,
      tribunal_name: cnj.tribunalName,
      status: 'active',
      monitoring_frequency: 60, // 1 hora por padrão
      basic_info: {
        number: cnj.formattedNumber,
        court: cnj.tribunalName,
        segment: cnj.judiciarySegmentName,
        year: cnj.year
      },
      created_by: userId
    };
    
    const response = await fetch(`${this.apiUrl}/tribunal/processes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processData)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao adicionar processo: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Busca processo monitorado por número CNJ
   */
  static async getMonitoredProcess(cnjNumber: string): Promise<MonitoredProcess | null> {
    try {
      const response = await fetch(`${this.apiUrl}/tribunal/processes/${encodeURIComponent(cnjNumber)}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar processo: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar processo monitorado:', error);
      return null;
    }
  }
  
  /**
   * Lista todos os processos monitorados
   */
  static async getMonitoredProcesses(filters?: {
    tribunalCode?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    processes: MonitoredProcess[];
    total: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters?.tribunalCode) params.append('tribunal_code', filters.tribunalCode);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const response = await fetch(`${this.apiUrl}/tribunal/processes?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao listar processos: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Persiste movimentações de um processo
   */
  static async persistMovements(
    processId: string,
    movements: TribunalMovement[],
    tribunalCode: string
  ): Promise<{
    persisted: number;
    newMovements: number;
    duplicates: number;
  }> {
    const movementsData = movements.map(movement => ({
      process_id: processId,
      movement_id: movement.id,
      movement_date: movement.movementDate.toISOString().split('T')[0], // Data sem hora
      movement_datetime: movement.movementDate.toISOString(),
      title: movement.title,
      description: movement.description,
      movement_type: movement.isJudicial ? 'judicial' : 'administrative',
      is_public: true,
      author: null,
      destination: null,
      attachments: JSON.stringify([]),
      raw_content: `${movement.title}\n${movement.description || ''}`,
      content_hash: this.generateContentHash(movement),
      tribunal_source: tribunalCode,
      is_new: true // Será definido como novo por 48h
    }));
    
    const response = await fetch(`${this.apiUrl}/tribunal/movements/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movements: movementsData })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao persistir movimentações: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Busca movimentações de um processo
   */
  static async getProcessMovements(
    processId: string,
    options?: {
      includeOld?: boolean;
      onlyNew?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    movements: PersistedMovement[];
    total: number;
    newCount: number;
  }> {
    const params = new URLSearchParams();
    
    if (options?.includeOld !== undefined) params.append('include_old', options.includeOld.toString());
    if (options?.onlyNew) params.append('only_new', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const response = await fetch(`${this.apiUrl}/tribunal/processes/${processId}/movements?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar movimentações: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Marca movimentações como lidas (remove flag "novo")
   */
  static async markMovementsAsRead(movementIds: string[]): Promise<void> {
    const response = await fetch(`${this.apiUrl}/tribunal/movements/mark-read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movement_ids: movementIds })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao marcar movimentações como lidas: ${response.statusText}`);
    }
  }
  
  /**
   * Atualiza resultado da consulta no cache
   */
  static async updateCache(
    cnjNumber: string,
    tribunalCode: string,
    queryResult: any, // Resultado da consulta
    ttlMinutes: number = 60
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(cnjNumber, tribunalCode);
    const expiresAt = new Date(Date.now() + (ttlMinutes * 60 * 1000)).toISOString();
    
    const cacheData = {
      cache_key: cacheKey,
      cnj_number: cnjNumber,
      tribunal_code: tribunalCode,
      query_result: queryResult,
      content_hash: this.generateQueryHash(queryResult),
      query_status: queryResult.status,
      expires_at: expiresAt
    };
    
    const response = await fetch(`${this.apiUrl}/tribunal/cache`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cacheData)
    });
    
    if (!response.ok) {
      console.error('Erro ao atualizar cache:', response.statusText);
    }
  }
  
  /**
   * Busca resultado no cache
   */
  static async getFromCache(
    cnjNumber: string,
    tribunalCode: string
  ): Promise<QueryCache | null> {
    const cacheKey = this.generateCacheKey(cnjNumber, tribunalCode);
    
    try {
      const response = await fetch(`${this.apiUrl}/tribunal/cache/${encodeURIComponent(cacheKey)}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        return null;
      }
      
      const cache = await response.json();
      
      // Verificar se não expirou
      if (new Date(cache.expiresAt) < new Date()) {
        return null;
      }
      
      // Incrementar hit count
      await this.incrementCacheHit(cache.id);
      
      return cache;
    } catch (error) {
      console.error('Erro ao buscar cache:', error);
      return null;
    }
  }
  
  /**
   * Registra log de consulta
   */
  static async logQuery(
    cnjNumber: string,
    tribunalCode: string,
    queryStatus: string,
    responseTime: number,
    errorMessage?: string,
    fromCache: boolean = false,
    retryCount: number = 0
  ): Promise<void> {
    const logData = {
      cnj_number: cnjNumber,
      tribunal_code: tribunalCode,
      query_status: queryStatus,
      response_time_ms: responseTime,
      error_message: errorMessage,
      from_cache: fromCache,
      retry_count: retryCount,
      user_agent: navigator?.userAgent || 'AutumnusJuris-System'
    };
    
    try {
      await fetch(`${this.apiUrl}/tribunal/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }
  
  /**
   * Obtém estatísticas dos tribunais
   */
  static async getTribunalStatistics(): Promise<TribunalStatistics[]> {
    const response = await fetch(`${this.apiUrl}/tribunal/statistics`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar estatísticas: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Executa limpeza automática (movimentações antigas e cache expirado)
   */
  static async runCleanup(): Promise<{
    expiredMovements: number;
    expiredCache: number;
  }> {
    const response = await fetch(`${this.apiUrl}/tribunal/cleanup`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Erro na limpeza: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Atualiza informações básicas do processo
   */
  static async updateProcessBasicInfo(
    processId: string,
    basicInfo: any, // Informações básicas do processo
    contentHash: string
  ): Promise<void> {
    const updateData = {
      basic_info: basicInfo,
      content_hash: contentHash,
      last_query_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const response = await fetch(`${this.apiUrl}/tribunal/processes/${processId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar processo: ${response.statusText}`);
    }
  }
  
  /**
   * Gera hash do conteúdo da movimentação para detecção de duplicatas
   */
  private static generateContentHash(movement: TribunalMovement): string {
    const content = `${movement.movementDate.toISOString()}|${movement.title}|${movement.description || ''}`;
    return this.simpleHash(content);
  }
  
  /**
   * Gera hash do resultado da consulta
   */
  private static generateQueryHash(queryResult: any): string {
    const content = JSON.stringify({
      status: queryResult.status,
      basicInfo: queryResult.basicInfo,
      movementCount: queryResult.movements?.length || 0
    });
    return this.simpleHash(content);
  }
  
  /**
   * Gera chave de cache
   */
  private static generateCacheKey(cnjNumber: string, tribunalCode: string): string {
    return `${tribunalCode}:${cnjNumber.replace(/\D/g, '')}`;
  }
  
  /**
   * Implementação simples de hash
   */
  private static simpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Incrementa contador de hit do cache
   */
  private static async incrementCacheHit(cacheId: string): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/tribunal/cache/${cacheId}/hit`, {
        method: 'POST'
      });
    } catch (error) {
      // Falha silenciosa - não é crítico
    }
  }
}


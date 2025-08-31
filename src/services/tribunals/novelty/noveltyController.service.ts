// src/services/tribunals/novelty/noveltyController.service.ts

import TribunalDatabaseService from '../database/tribunalDatabase.service';
import HashGeneratorService from '../utils/hashGenerator.service';
import { ProcessMovement } from '../scrapers/baseScraper';

/**
 * Interface para uma novidade
 */
export interface Novelty {
  id: string;
  processId: string;
  movementId: string;
  cnjNumber: string;
  tribunalName: string;
  title: string;
  description?: string;
  movementDate: string;
  movementType?: string;
  isRead: boolean;
  createdAt: string;
  expiresAt: string;
  remainingHours: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Configuração do controlador de novidades
 */
export interface NoveltyConfig {
  ttlHours: number; // TTL padrão em horas
  autoMarkRead: boolean; // Marcar como lida automaticamente após visualização
  enableNotifications: boolean; // Habilitar notificações
  cleanupIntervalMinutes: number; // Intervalo de limpeza automática
  maxNoveltiesPerProcess: number; // Máximo de novidades por processo
  priorityRules: {
    keywords: { [key: string]: 'low' | 'medium' | 'high' | 'urgent' };
    movementTypes: { [key: string]: 'low' | 'medium' | 'high' | 'urgent' };
  };
}

/**
 * Estatísticas de novidades
 */
export interface NoveltyStats {
  total: number;
  unread: number;
  byPriority: Record<string, number>;
  byTribunal: Record<string, number>;
  byType: Record<string, number>;
  expiring24h: number;
  expired: number;
}

/**
 * Filtros para busca de novidades
 */
export interface NoveltyFilters {
  processId?: string;
  cnjNumber?: string;
  tribunalCode?: string;
  isRead?: boolean;
  priority?: string[];
  movementType?: string[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  expiringInHours?: number;
}

/**
 * Service para controle de novidades com TTL de 48h
 */
export class NoveltyControllerService {
  
  private static instance: NoveltyControllerService;
  private config: NoveltyConfig;
  private cleanupTimer?: NodeJS.Timeout;
  
  private constructor(config?: Partial<NoveltyConfig>) {
    this.config = {
      ttlHours: 48, // 48 horas por padrão
      autoMarkRead: false,
      enableNotifications: true,
      cleanupIntervalMinutes: 60, // 1 hora
      maxNoveltiesPerProcess: 50,
      priorityRules: {
        keywords: {
          'sentença': 'urgent',
          'decisão': 'high',
          'acórdão': 'urgent',
          'audiência': 'high',
          'intimação': 'high',
          'citação': 'medium',
          'despacho': 'medium',
          'juntada': 'low',
          'conclusão': 'medium',
          'recurso': 'high',
          'embargos': 'high',
          'mandado': 'medium',
          'certidão': 'low'
        },
        movementTypes: {
          'decisao': 'urgent',
          'audiencia': 'high',
          'peticao': 'medium',
          'juntada': 'low',
          'despacho': 'medium',
          'outros': 'low'
        }
      },
      ...config
    };
    
    this.startCleanupTimer();
  }
  
  /**
   * Singleton instance
   */
  static getInstance(config?: Partial<NoveltyConfig>): NoveltyControllerService {
    if (!NoveltyControllerService.instance) {
      NoveltyControllerService.instance = new NoveltyControllerService(config);
    }
    return NoveltyControllerService.instance;
  }
  
  /**
   * Processa movimentações e identifica novidades
   */
  async processMovements(
    processId: string,
    movements: ProcessMovement[],
    cnjNumber: string,
    tribunalName: string
  ): Promise<{
    newNoveltiesCount: number;
    totalNoveltiesCount: number;
    noveltiesCreated: Novelty[];
  }> {
    const existingMovements = await this.getExistingMovementHashes(processId);
    const noveltiesCreated: Novelty[] = [];
    let newNoveltiesCount = 0;
    
    for (const movement of movements) {
      const movementHash = HashGeneratorService.generateMovementHash(movement).hash;
      
      // Verificar se é uma novidade (movimento não existente)
      if (!existingMovements.has(movementHash)) {
        const novelty = await this.createNovelty(
          processId,
          movement,
          cnjNumber,
          tribunalName
        );
        
        if (novelty) {
          noveltiesCreated.push(novelty);
          newNoveltiesCount++;
        }
      }
    }
    
    // Aplicar limite máximo de novidades por processo
    await this.enforceMaxNoveltiesPerProcess(processId);
    
    const totalNoveltiesCount = await this.getTotalNoveltiesCount(processId);
    
    return {
      newNoveltiesCount,
      totalNoveltiesCount,
      noveltiesCreated
    };
  }
  
  /**
   * Cria uma nova novidade
   */
  private async createNovelty(
    processId: string,
    movement: ProcessMovement,
    cnjNumber: string,
    tribunalName: string
  ): Promise<Novelty | null> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (this.config.ttlHours * 60 * 60 * 1000));
      
      const priority = this.calculatePriority(movement);
      const tags = this.generateTags(movement);
      
      const noveltyData = {
        process_id: processId,
        movement_id: movement.id,
        cnj_number: cnjNumber,
        tribunal_name: tribunalName,
        title: movement.title,
        description: movement.description,
        movement_date: movement.date,
        movement_type: movement.type || 'outros',
        is_read: false,
        expires_at: expiresAt.toISOString(),
        priority,
        tags: JSON.stringify(tags),
        created_at: now.toISOString()
      };
      
      // Salvar no banco através da API
      const response = await fetch('http://172.25.132.0:3001/api/tribunal/novelties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noveltyData)
      });
      
      if (!response.ok) {
        console.error('Erro ao criar novidade:', response.statusText);
        return null;
      }
      
      const createdNovelty = await response.json();
      
      // Disparar notificação se habilitado
      if (this.config.enableNotifications) {
        await this.sendNotification(createdNovelty);
      }
      
      return this.mapToNovelty(createdNovelty);
      
    } catch (error) {
      console.error('Erro ao criar novidade:', error);
      return null;
    }
  }
  
  /**
   * Busca novidades com filtros
   */
  async getNoveltiesWithFilters(
    filters?: NoveltyFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    novelties: Novelty[];
    total: number;
    stats: NoveltyStats;
  }> {
    const params = new URLSearchParams();
    
    if (filters?.processId) params.append('process_id', filters.processId);
    if (filters?.cnjNumber) params.append('cnj_number', filters.cnjNumber);
    if (filters?.tribunalCode) params.append('tribunal_code', filters.tribunalCode);
    if (filters?.isRead !== undefined) params.append('is_read', filters.isRead.toString());
    if (filters?.priority?.length) params.append('priority', filters.priority.join(','));
    if (filters?.movementType?.length) params.append('movement_type', filters.movementType.join(','));
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (filters?.expiringInHours) params.append('expiring_in_hours', filters.expiringInHours.toString());
    
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await fetch(`http://172.25.132.0:3001/api/tribunal/novelties?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar novidades: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      novelties: data.novelties.map((n: any) => this.mapToNovelty(n)),
      total: data.total,
      stats: data.stats
    };
  }
  
  /**
   * Busca novidades não lidas
   */
  async getUnreadNovelties(limit: number = 20): Promise<Novelty[]> {
    const result = await this.getNoveltiesWithFilters(
      { isRead: false },
      limit,
      0
    );
    
    return result.novelties;
  }
  
  /**
   * Busca novidades por prioridade
   */
  async getNoveltiesToByPriority(
    priority: 'urgent' | 'high' | 'medium' | 'low'
  ): Promise<Novelty[]> {
    const result = await this.getNoveltiesWithFilters(
      { priority: [priority], isRead: false },
      100,
      0
    );
    
    return result.novelties;
  }
  
  /**
   * Marca novidades como lidas
   */
  async markAsRead(noveltyIds: string[]): Promise<void> {
    const response = await fetch('http://172.25.132.0:3001/api/tribunal/novelties/mark-read', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ novelty_ids: noveltyIds })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao marcar novidades como lidas: ${response.statusText}`);
    }
  }
  
  /**
   * Marca todas as novidades de um processo como lidas
   */
  async markProcessAsRead(processId: string): Promise<number> {
    const response = await fetch(`http://172.25.132.0:3001/api/tribunal/novelties/process/${processId}/mark-read`, {
      method: 'PATCH'
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao marcar processo como lido: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.marked_count;
  }
  
  /**
   * Remove novidades expiradas
   */
  async removeExpiredNovelties(): Promise<{ removed: number; errors: number }> {
    const response = await fetch('http://172.25.132.0:3001/api/tribunal/novelties/cleanup', {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Erro na limpeza de novidades: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Obtém estatísticas das novidades
   */
  async getStatistics(): Promise<NoveltyStats> {
    const response = await fetch('http://172.25.132.0:3001/api/tribunal/novelties/stats');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar estatísticas: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Obtém novidades que expiram nas próximas horas
   */
  async getExpiringNovelties(hours: number = 24): Promise<Novelty[]> {
    const result = await this.getNoveltiesWithFilters(
      { expiringInHours: hours, isRead: false },
      100,
      0
    );
    
    return result.novelties;
  }
  
  /**
   * Estende TTL de uma novidade
   */
  async extendTTL(noveltyId: string, additionalHours: number): Promise<void> {
    const response = await fetch(`http://172.25.132.0:3001/api/tribunal/novelties/${noveltyId}/extend`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ additional_hours: additionalHours })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao estender TTL: ${response.statusText}`);
    }
  }
  
  /**
   * Calcula prioridade baseada no conteúdo da movimentação
   */
  private calculatePriority(movement: ProcessMovement): 'low' | 'medium' | 'high' | 'urgent' {
    // Verificar tipo da movimentação
    if (movement.type && this.config.priorityRules.movementTypes[movement.type]) {
      return this.config.priorityRules.movementTypes[movement.type];
    }
    
    // Verificar palavras-chave no título e descrição
    const content = `${movement.title} ${movement.description || ''}`.toLowerCase();
    
    for (const [keyword, priority] of Object.entries(this.config.priorityRules.keywords)) {
      if (content.includes(keyword.toLowerCase())) {
        return priority;
      }
    }
    
    // Prioridade padrão baseada na presença de anexos
    if (movement.attachments && movement.attachments.length > 0) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Gera tags baseadas no conteúdo da movimentação
   */
  private generateTags(movement: ProcessMovement): string[] {
    const tags: string[] = [];
    
    // Tag do tipo
    if (movement.type) {
      tags.push(`tipo:${movement.type}`);
    }
    
    // Tags baseadas em palavras-chave
    const content = `${movement.title} ${movement.description || ''}`.toLowerCase();
    const keywords = Object.keys(this.config.priorityRules.keywords);
    
    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        tags.push(`palavra-chave:${keyword}`);
      }
    }
    
    // Tag de anexos
    if (movement.attachments && movement.attachments.length > 0) {
      tags.push('com-anexos');
      tags.push(`anexos:${movement.attachments.length}`);
    }
    
    // Tag do autor se disponível
    if (movement.author) {
      tags.push(`autor:${movement.author.toLowerCase().replace(/\s+/g, '-')}`);
    }
    
    return tags;
  }
  
  /**
   * Busca hashes de movimentações existentes
   */
  private async getExistingMovementHashes(processId: string): Promise<Set<string>> {
    try {
      const response = await fetch(`http://172.25.132.0:3001/api/tribunal/processes/${processId}/movement-hashes`);
      
      if (!response.ok) {
        return new Set();
      }
      
      const hashes = await response.json();
      return new Set(hashes);
    } catch {
      return new Set();
    }
  }
  
  /**
   * Obtém contagem total de novidades de um processo
   */
  private async getTotalNoveltiesCount(processId: string): Promise<number> {
    try {
      const result = await this.getNoveltiesWithFilters({ processId }, 1, 0);
      return result.total;
    } catch {
      return 0;
    }
  }
  
  /**
   * Aplica limite máximo de novidades por processo
   */
  private async enforceMaxNoveltiesPerProcess(processId: string): Promise<void> {
    const result = await this.getNoveltiesWithFilters({ processId }, this.config.maxNoveltiesPerProcess + 10, 0);
    
    if (result.total > this.config.maxNoveltiesPerProcess) {
      // Remover as novidades mais antigas
      const toRemove = result.novelties
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, result.total - this.config.maxNoveltiesPerProcess)
        .map(n => n.id);
      
      if (toRemove.length > 0) {
        await this.removeNovelties(toRemove);
      }
    }
  }
  
  /**
   * Remove novidades específicas
   */
  private async removeNovelties(noveltyIds: string[]): Promise<void> {
    const response = await fetch('http://172.25.132.0:3001/api/tribunal/novelties/batch-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ novelty_ids: noveltyIds })
    });
    
    if (!response.ok) {
      console.error('Erro ao remover novidades:', response.statusText);
    }
  }
  
  /**
   * Mapeia dados do banco para interface Novelty
   */
  private mapToNovelty(data: any): Novelty {
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingHours = Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000)));
    
    return {
      id: data.id,
      processId: data.process_id,
      movementId: data.movement_id,
      cnjNumber: data.cnj_number,
      tribunalName: data.tribunal_name,
      title: data.title,
      description: data.description,
      movementDate: data.movement_date,
      movementType: data.movement_type,
      isRead: data.is_read,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      remainingHours,
      tags: data.tags ? JSON.parse(data.tags) : [],
      priority: data.priority
    };
  }
  
  /**
   * Envia notificação de nova movimentação
   */
  private async sendNotification(novelty: any): Promise<void> {
    // Implementar integração com sistema de notificações
    console.log(`🔔 Nova movimentação: ${novelty.title} - Prioridade: ${novelty.priority}`);
  }
  
  /**
   * Inicia timer de limpeza automática
   */
  private startCleanupTimer(): void {
    if (this.config.cleanupIntervalMinutes > 0) {
      this.cleanupTimer = setInterval(() => {
        this.removeExpiredNovelties().catch(error => {
          console.error('Erro na limpeza automática:', error);
        });
      }, this.config.cleanupIntervalMinutes * 60 * 1000);
    }
  }
  
  /**
   * Para timer de limpeza
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  
  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<NoveltyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar timer se mudou o intervalo
    if (newConfig.cleanupIntervalMinutes !== undefined) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }
  
  /**
   * Obtém configuração atual
   */
  getConfig(): NoveltyConfig {
    return { ...this.config };
  }
  
  /**
   * Cleanup da instância
   */
  destroy(): void {
    this.stopCleanupTimer();
  }
}

export default NoveltyControllerService;
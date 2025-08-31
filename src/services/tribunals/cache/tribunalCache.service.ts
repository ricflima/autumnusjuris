// src/services/tribunals/cache/tribunalCache.service.ts

import { ProcessQueryResult } from '../scrapers/baseScraper';
import TribunalDatabaseService from '../database/tribunalDatabase.service';

/**
 * Configuração do cache
 */
export interface CacheConfig {
  defaultTTL: number; // TTL padrão em minutos
  maxSize: number; // Tamanho máximo do cache em memória
  enablePersistence: boolean; // Salvar no banco de dados
  enableMemoryCache: boolean; // Cache em memória
  cleanupInterval: number; // Intervalo de limpeza em minutos
}

/**
 * Item do cache em memória
 */
interface CacheItem {
  key: string;
  data: ProcessQueryResult;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccess: number;
  size: number; // Tamanho estimado em bytes
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  memoryCache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalItems: number;
    totalSize: number;
    averageSize: number;
  };
  persistentCache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalItems: number;
  };
  operations: {
    sets: number;
    gets: number;
    deletes: number;
    cleanups: number;
  };
}

/**
 * Service de cache inteligente para consultas de tribunal
 */
export class TribunalCacheService {
  
  private static instance: TribunalCacheService;
  private memoryCache = new Map<string, CacheItem>();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;
  private currentMemorySize = 0;
  
  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 60, // 1 hora
      maxSize: 100 * 1024 * 1024, // 100MB
      enablePersistence: true,
      enableMemoryCache: true,
      cleanupInterval: 15, // 15 minutos
      ...config
    };
    
    this.stats = {
      memoryCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalItems: 0,
        totalSize: 0,
        averageSize: 0
      },
      persistentCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalItems: 0
      },
      operations: {
        sets: 0,
        gets: 0,
        deletes: 0,
        cleanups: 0
      }
    };
    
    this.startCleanupTimer();
  }
  
  /**
   * Singleton instance
   */
  static getInstance(config?: Partial<CacheConfig>): TribunalCacheService {
    if (!TribunalCacheService.instance) {
      TribunalCacheService.instance = new TribunalCacheService(config);
    }
    return TribunalCacheService.instance;
  }
  
  /**
   * Busca resultado no cache (memória primeiro, depois persistente)
   */
  async get(cnjNumber: string, tribunalCode: string): Promise<ProcessQueryResult | null> {
    this.stats.operations.gets++;
    
    const cacheKey = this.generateCacheKey(cnjNumber, tribunalCode);
    
    // 1. Tentar cache em memória
    if (this.config.enableMemoryCache) {
      const memoryResult = this.getFromMemory(cacheKey);
      if (memoryResult) {
        this.stats.memoryCache.hits++;
        this.updateStats();
        return memoryResult;
      }
      this.stats.memoryCache.misses++;
    }
    
    // 2. Tentar cache persistente
    if (this.config.enablePersistence) {
      try {
        const persistentResult = await TribunalDatabaseService.getFromCache(cnjNumber, tribunalCode);
        if (persistentResult?.queryResult) {
          this.stats.persistentCache.hits++;
          
          // Armazenar no cache de memória para próximas consultas
          if (this.config.enableMemoryCache) {
            this.setInMemory(cacheKey, persistentResult.queryResult, this.config.defaultTTL);
          }
          
          this.updateStats();
          return {
            ...persistentResult.queryResult,
            fromCache: true
          };
        }
        this.stats.persistentCache.misses++;
      } catch (error) {
        console.error('Erro ao buscar cache persistente:', error);
        this.stats.persistentCache.misses++;
      }
    }
    
    this.updateStats();
    return null;
  }
  
  /**
   * Armazena resultado no cache (memória e/ou persistente)
   */
  async set(
    cnjNumber: string,
    tribunalCode: string,
    result: ProcessQueryResult,
    ttlMinutes?: number
  ): Promise<void> {
    this.stats.operations.sets++;
    
    const cacheKey = this.generateCacheKey(cnjNumber, tribunalCode);
    const ttl = ttlMinutes || this.config.defaultTTL;
    
    // Armazenar no cache de memória
    if (this.config.enableMemoryCache) {
      this.setInMemory(cacheKey, result, ttl);
    }
    
    // Armazenar no cache persistente
    if (this.config.enablePersistence) {
      try {
        await TribunalDatabaseService.updateCache(cnjNumber, tribunalCode, result, ttl);
      } catch (error) {
        console.error('Erro ao salvar cache persistente:', error);
      }
    }
    
    this.updateStats();
  }
  
  /**
   * Remove item do cache
   */
  async delete(cnjNumber: string, tribunalCode: string): Promise<void> {
    this.stats.operations.deletes++;
    
    const cacheKey = this.generateCacheKey(cnjNumber, tribunalCode);
    
    // Remover do cache de memória
    if (this.config.enableMemoryCache) {
      const item = this.memoryCache.get(cacheKey);
      if (item) {
        this.currentMemorySize -= item.size;
        this.memoryCache.delete(cacheKey);
      }
    }
    
    // TODO: Implementar remoção do cache persistente se necessário
    
    this.updateStats();
  }
  
  /**
   * Verifica se existe no cache
   */
  async has(cnjNumber: string, tribunalCode: string): Promise<boolean> {
    const result = await this.get(cnjNumber, tribunalCode);
    return result !== null;
  }
  
  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    // Limpar cache de memória
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    
    // TODO: Implementar limpeza do cache persistente se necessário
    
    this.updateStats();
  }
  
  /**
   * Executa limpeza de itens expirados
   */
  async cleanup(): Promise<{ memoryCleared: number; persistentCleared: number }> {
    this.stats.operations.cleanups++;
    
    const now = Date.now();
    let memoryCleared = 0;
    
    // Limpar cache de memória
    if (this.config.enableMemoryCache) {
      for (const [key, item] of this.memoryCache.entries()) {
        if (item.expiresAt < now) {
          this.currentMemorySize -= item.size;
          this.memoryCache.delete(key);
          memoryCleared++;
        }
      }
    }
    
    // Limpar cache persistente
    let persistentCleared = 0;
    if (this.config.enablePersistence) {
      try {
        const result = await TribunalDatabaseService.runCleanup();
        persistentCleared = result.expiredCache;
      } catch (error) {
        console.error('Erro na limpeza do cache persistente:', error);
      }
    }
    
    this.updateStats();
    
    return { memoryCleared, persistentCleared };
  }
  
  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }
  
  /**
   * Redefine estatísticas
   */
  resetStats(): void {
    this.stats = {
      memoryCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalItems: 0,
        totalSize: 0,
        averageSize: 0
      },
      persistentCache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalItems: 0
      },
      operations: {
        sets: 0,
        gets: 0,
        deletes: 0,
        cleanups: 0
      }
    };
  }
  
  /**
   * Obtém configuração atual
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }
  
  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar timer de limpeza se o intervalo mudou
    if (newConfig.cleanupInterval) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }
  
  /**
   * Invalida cache para um tribunal específico
   */
  async invalidateTribunal(tribunalCode: string): Promise<number> {
    let invalidated = 0;
    
    // Invalidar cache de memória
    if (this.config.enableMemoryCache) {
      for (const [key, item] of this.memoryCache.entries()) {
        if (key.startsWith(`${tribunalCode}:`)) {
          this.currentMemorySize -= item.size;
          this.memoryCache.delete(key);
          invalidated++;
        }
      }
    }
    
    this.updateStats();
    return invalidated;
  }
  
  /**
   * Pré-aquece o cache com consultas frequentes
   */
  async warmUp(processes: { cnjNumber: string; tribunalCode: string }[]): Promise<void> {
    console.log(`🔥 Pré-aquecendo cache com ${processes.length} processos...`);
    
    for (const process of processes) {
      // Verificar se já existe no cache
      const exists = await this.has(process.cnjNumber, process.tribunalCode);
      if (!exists) {
        // Aqui poderia fazer uma consulta real, mas vamos apenas marcar como consultado
        console.log(`📋 Processo ${process.cnjNumber} marcado para consulta`);
      }
    }
  }
  
  /**
   * Busca no cache de memória
   */
  private getFromMemory(key: string): ProcessQueryResult | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (item.expiresAt < now) {
      // Item expirado
      this.currentMemorySize -= item.size;
      this.memoryCache.delete(key);
      return null;
    }
    
    // Atualizar estatísticas de acesso
    item.accessCount++;
    item.lastAccess = now;
    
    return { ...item.data, fromCache: true };
  }
  
  /**
   * Armazena no cache de memória
   */
  private setInMemory(key: string, data: ProcessQueryResult, ttlMinutes: number): void {
    const now = Date.now();
    const size = this.estimateSize(data);
    
    // Verificar se precisa liberar espaço
    if (this.currentMemorySize + size > this.config.maxSize) {
      this.evictOldest();
    }
    
    const item: CacheItem = {
      key,
      data,
      createdAt: now,
      expiresAt: now + (ttlMinutes * 60 * 1000),
      accessCount: 0,
      lastAccess: now,
      size
    };
    
    // Remover item anterior se existir
    const existing = this.memoryCache.get(key);
    if (existing) {
      this.currentMemorySize -= existing.size;
    }
    
    this.memoryCache.set(key, item);
    this.currentMemorySize += size;
  }
  
  /**
   * Remove os itens mais antigos quando o cache está cheio
   */
  private evictOldest(): void {
    const items = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);
    
    // Remover até liberar 25% do espaço
    const targetSize = this.config.maxSize * 0.75;
    
    while (this.currentMemorySize > targetSize && items.length > 0) {
      const [key, item] = items.shift()!;
      this.memoryCache.delete(key);
      this.currentMemorySize -= item.size;
    }
  }
  
  /**
   * Estima o tamanho do objeto em bytes
   */
  private estimateSize(obj: any): number {
    return JSON.stringify(obj).length * 2; // Aproximação: 2 bytes por char
  }
  
  /**
   * Gera chave de cache consistente
   */
  private generateCacheKey(cnjNumber: string, tribunalCode: string): string {
    return `${tribunalCode}:${cnjNumber.replace(/\D/g, '')}`;
  }
  
  /**
   * Atualiza estatísticas calculadas
   */
  private updateStats(): void {
    // Estatísticas de memória
    this.stats.memoryCache.totalItems = this.memoryCache.size;
    this.stats.memoryCache.totalSize = this.currentMemorySize;
    this.stats.memoryCache.averageSize = this.memoryCache.size > 0 
      ? this.currentMemorySize / this.memoryCache.size 
      : 0;
    
    const memoryTotal = this.stats.memoryCache.hits + this.stats.memoryCache.misses;
    this.stats.memoryCache.hitRate = memoryTotal > 0 
      ? (this.stats.memoryCache.hits / memoryTotal) * 100 
      : 0;
    
    // Estatísticas persistentes
    const persistentTotal = this.stats.persistentCache.hits + this.stats.persistentCache.misses;
    this.stats.persistentCache.hitRate = persistentTotal > 0 
      ? (this.stats.persistentCache.hits / persistentTotal) * 100 
      : 0;
  }
  
  /**
   * Inicia timer de limpeza automática
   */
  private startCleanupTimer(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch(error => {
          console.error('Erro na limpeza automática do cache:', error);
        });
      }, this.config.cleanupInterval * 60 * 1000);
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
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

export default TribunalCacheService;
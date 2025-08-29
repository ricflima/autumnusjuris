// src/services/tribunalCache.service.ts

import { ProcessoTribunalData, MovimentacaoTribunal, TribunalType } from '@/types/tribunalIntegration';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  expiresAt: Date;
  tribunal: TribunalType;
  hits: number;
  lastAccessed: Date;
  size: number; // em bytes
}

export interface CacheConfig {
  maxSizeBytes: number;
  defaultTTL: number; // em segundos
  tribunalTTL: Map<TribunalType, number>; // TTL específico por tribunal
  persistToDisk: boolean;
  diskCachePath: string;
  cleanupIntervalMs: number;
  compressionEnabled: boolean;
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO';
}

export interface CacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  evictions: number;
  tribunalStats: Map<TribunalType, {
    entries: number;
    sizeBytes: number;
    hits: number;
    misses: number;
  }>;
}

class TribunalCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSizeBytes: 100 * 1024 * 1024, // 100MB default
      defaultTTL: 3600, // 1 hora default
      tribunalTTL: new Map([
        // Configurações específicas de TTL por tribunal
        ['tjsp', 1800], // 30 minutos para TJSP (mais dinâmico)
        ['stj', 7200], // 2 horas para STJ (mais estável)
        ['stf', 7200], // 2 horas para STF
        ['receita_federal', 21600], // 6 horas para Receita Federal
        ['inss', 10800], // 3 horas para INSS
        ['trf1', 3600], // 1 hora para TRFs
        ['trf2', 3600],
        ['trf3', 3600],
        ['trf4', 3600],
        ['trf5', 3600],
        ['trf6', 3600],
      ]),
      persistToDisk: true,
      diskCachePath: './cache/tribunals',
      cleanupIntervalMs: 300000, // 5 minutos
      compressionEnabled: true,
      evictionPolicy: 'LRU',
      ...config
    };

    this.stats = {
      totalEntries: 0,
      totalSizeBytes: 0,
      hitRate: 0,
      missRate: 0,
      totalHits: 0,
      totalMisses: 0,
      evictions: 0,
      tribunalStats: new Map()
    };

    this.initializeCache();
  }

  private initializeCache(): void {
    // Criar diretório de cache se necessário
    if (this.config.persistToDisk && !fs.existsSync(this.config.diskCachePath)) {
      fs.mkdirSync(this.config.diskCachePath, { recursive: true });
    }

    // Carregar cache do disco se habilitado
    if (this.config.persistToDisk) {
      this.loadFromDisk();
    }

    // Iniciar timer de limpeza
    this.startCleanupTimer();
  }

  // Gerar chave de cache baseada no tribunal e número do processo
  private generateCacheKey(tribunal: TribunalType, numeroProcesso: string, queryType: string = 'processo'): string {
    const normalizedNumber = numeroProcesso.replace(/\D/g, '');
    const keyData = `${tribunal}:${queryType}:${normalizedNumber}`;
    return crypto.createHash('sha256').update(keyData).digest('hex').substring(0, 16);
  }

  // Calcular tamanho aproximado dos dados em bytes
  private calculateSize(data: any): number {
    return new TextEncoder().encode(JSON.stringify(data)).length;
  }

  // Obter TTL específico para um tribunal
  private getTTL(tribunal: TribunalType): number {
    return this.config.tribunalTTL.get(tribunal) || this.config.defaultTTL;
  }

  // Verificar se uma entrada está expirada
  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  // Cache para processos
  async cacheProcess(tribunal: TribunalType, numeroProcesso: string, data: ProcessoTribunalData): Promise<void> {
    const key = this.generateCacheKey(tribunal, numeroProcesso, 'processo');
    const ttl = this.getTTL(tribunal);
    const now = new Date();
    const size = this.calculateSize(data);

    const entry: CacheEntry<ProcessoTribunalData> = {
      key,
      data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      tribunal,
      hits: 0,
      lastAccessed: now,
      size
    };

    // Verificar se é necessário fazer eviction
    await this.ensureCapacity(size);

    this.cache.set(key, entry);
    this.updateStats(tribunal, 'cache', size);

    // Persistir no disco se habilitado
    if (this.config.persistToDisk) {
      await this.saveToDisk(entry);
    }
  }

  // Recuperar processo do cache
  async getCachedProcess(tribunal: TribunalType, numeroProcesso: string): Promise<ProcessoTribunalData | null> {
    const key = this.generateCacheKey(tribunal, numeroProcesso, 'processo');
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordMiss(tribunal);
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.recordMiss(tribunal);
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.hits++;
    entry.lastAccessed = new Date();
    this.recordHit(tribunal);

    return entry.data as ProcessoTribunalData;
  }

  // Cache para movimentações específicas
  async cacheMovements(tribunal: TribunalType, numeroProcesso: string, movements: MovimentacaoTribunal[]): Promise<void> {
    const key = this.generateCacheKey(tribunal, numeroProcesso, 'movimentacoes');
    const ttl = Math.min(this.getTTL(tribunal), 1800); // Movimentações têm TTL menor (máximo 30 min)
    const now = new Date();
    const size = this.calculateSize(movements);

    const entry: CacheEntry<MovimentacaoTribunal[]> = {
      key,
      data: movements,
      timestamp: now,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      tribunal,
      hits: 0,
      lastAccessed: now,
      size
    };

    await this.ensureCapacity(size);
    this.cache.set(key, entry);
    this.updateStats(tribunal, 'cache', size);

    if (this.config.persistToDisk) {
      await this.saveToDisk(entry);
    }
  }

  // Recuperar movimentações do cache
  async getCachedMovements(tribunal: TribunalType, numeroProcesso: string): Promise<MovimentacaoTribunal[] | null> {
    const key = this.generateCacheKey(tribunal, numeroProcesso, 'movimentacoes');
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      if (entry) this.cache.delete(key);
      this.recordMiss(tribunal);
      return null;
    }

    entry.hits++;
    entry.lastAccessed = new Date();
    this.recordHit(tribunal);

    return entry.data as MovimentacaoTribunal[];
  }

  // Cache para múltiplas consultas (busca por CPF/CNPJ)
  async cacheBulkQuery(tribunal: TribunalType, queryKey: string, data: ProcessoTribunalData[]): Promise<void> {
    const key = this.generateCacheKey(tribunal, queryKey, 'bulk');
    const ttl = this.getTTL(tribunal) * 0.5; // TTL menor para consultas bulk
    const now = new Date();
    const size = this.calculateSize(data);

    const entry: CacheEntry<ProcessoTribunalData[]> = {
      key,
      data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      tribunal,
      hits: 0,
      lastAccessed: now,
      size
    };

    await this.ensureCapacity(size);
    this.cache.set(key, entry);
    this.updateStats(tribunal, 'cache', size);

    if (this.config.persistToDisk) {
      await this.saveToDisk(entry);
    }
  }

  // Recuperar consulta bulk do cache
  async getCachedBulkQuery(tribunal: TribunalType, queryKey: string): Promise<ProcessoTribunalData[] | null> {
    const key = this.generateCacheKey(tribunal, queryKey, 'bulk');
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      if (entry) this.cache.delete(key);
      this.recordMiss(tribunal);
      return null;
    }

    entry.hits++;
    entry.lastAccessed = new Date();
    this.recordHit(tribunal);

    return entry.data as ProcessoTribunalData[];
  }

  // Invalidar cache de um processo específico
  invalidateProcess(tribunal: TribunalType, numeroProcesso: string): void {
    const processKey = this.generateCacheKey(tribunal, numeroProcesso, 'processo');
    const movementsKey = this.generateCacheKey(tribunal, numeroProcesso, 'movimentacoes');

    [processKey, movementsKey].forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.updateStats(tribunal, 'evict', -entry.size);
      }
    });
  }

  // Invalidar todo cache de um tribunal
  invalidateTribunal(tribunal: TribunalType): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tribunal === tribunal) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      const entry = this.cache.get(key)!;
      this.cache.delete(key);
      this.updateStats(tribunal, 'evict', -entry.size);
    });
  }

  // Garantir que há capacidade no cache
  private async ensureCapacity(requiredBytes: number): Promise<void> {
    const currentSize = this.stats.totalSizeBytes;
    
    if (currentSize + requiredBytes <= this.config.maxSizeBytes) {
      return; // Há espaço suficiente
    }

    const bytesToFree = (currentSize + requiredBytes) - this.config.maxSizeBytes;
    await this.evictEntries(bytesToFree);
  }

  // Fazer eviction baseado na política configurada
  private async evictEntries(bytesToFree: number): Promise<void> {
    let freedBytes = 0;
    const entries = Array.from(this.cache.entries());

    // Ordenar baseado na política de eviction
    switch (this.config.evictionPolicy) {
      case 'LRU': // Least Recently Used
        entries.sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
        break;
      case 'LFU': // Least Frequently Used
        entries.sort(([, a], [, b]) => a.hits - b.hits);
        break;
      case 'FIFO': // First In First Out
        entries.sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
        break;
    }

    // Remover entradas até liberar espaço suficiente
    for (const [key, entry] of entries) {
      if (freedBytes >= bytesToFree) break;

      this.cache.delete(key);
      freedBytes += entry.size;
      this.updateStats(entry.tribunal, 'evict', -entry.size);
      this.stats.evictions++;

      // Remover do disco também
      if (this.config.persistToDisk) {
        this.deleteFromDisk(entry);
      }
    }
  }

  // Limpeza automática de entradas expiradas
  private cleanup(): void {
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      const entry = this.cache.get(key)!;
      this.cache.delete(key);
      this.updateStats(entry.tribunal, 'evict', -entry.size);
      
      if (this.config.persistToDisk) {
        this.deleteFromDisk(entry);
      }
    });

    // Recalcular estatísticas globais
    this.recalculateStats();
  }

  // Iniciar timer de limpeza automática
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  // Parar timer de limpeza
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  // Atualizar estatísticas
  private updateStats(tribunal: TribunalType, operation: 'cache' | 'evict' | 'hit' | 'miss', size?: number): void {
    if (!this.stats.tribunalStats.has(tribunal)) {
      this.stats.tribunalStats.set(tribunal, {
        entries: 0,
        sizeBytes: 0,
        hits: 0,
        misses: 0
      });
    }

    const tribunalStats = this.stats.tribunalStats.get(tribunal)!;

    switch (operation) {
      case 'cache':
        tribunalStats.entries++;
        if (size) tribunalStats.sizeBytes += size;
        break;
      case 'evict':
        tribunalStats.entries = Math.max(0, tribunalStats.entries - 1);
        if (size) tribunalStats.sizeBytes = Math.max(0, tribunalStats.sizeBytes + size); // size is negative for eviction
        break;
      case 'hit':
        tribunalStats.hits++;
        this.stats.totalHits++;
        break;
      case 'miss':
        tribunalStats.misses++;
        this.stats.totalMisses++;
        break;
    }

    this.recalculateGlobalStats();
  }

  private recordHit(tribunal: TribunalType): void {
    this.updateStats(tribunal, 'hit');
  }

  private recordMiss(tribunal: TribunalType): void {
    this.updateStats(tribunal, 'miss');
  }

  private recalculateGlobalStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSizeBytes = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    const totalRequests = this.stats.totalHits + this.stats.totalMisses;
    if (totalRequests > 0) {
      this.stats.hitRate = this.stats.totalHits / totalRequests;
      this.stats.missRate = this.stats.totalMisses / totalRequests;
    }
  }

  private recalculateStats(): void {
    // Reset counters
    this.stats.tribunalStats.forEach(stat => {
      stat.entries = 0;
      stat.sizeBytes = 0;
    });

    // Recalculate from current cache
    this.cache.forEach(entry => {
      if (!this.stats.tribunalStats.has(entry.tribunal)) {
        this.stats.tribunalStats.set(entry.tribunal, {
          entries: 0,
          sizeBytes: 0,
          hits: 0,
          misses: 0
        });
      }

      const stats = this.stats.tribunalStats.get(entry.tribunal)!;
      stats.entries++;
      stats.sizeBytes += entry.size;
    });

    this.recalculateGlobalStats();
  }

  // Persistência em disco
  private async saveToDisk(entry: CacheEntry): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const filePath = path.join(this.config.diskCachePath, `${entry.key}.json`);
      const data = {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        expiresAt: entry.expiresAt.toISOString(),
        lastAccessed: entry.lastAccessed.toISOString()
      };
      
      await fs.promises.writeFile(filePath, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar cache no disco:', error);
    }
  }

  private async loadFromDisk(): Promise<void> {
    if (!this.config.persistToDisk) return;

    try {
      const files = await fs.promises.readdir(this.config.diskCachePath);
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.config.diskCachePath, file);
        const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
        
        const entry: CacheEntry = {
          ...data,
          timestamp: new Date(data.timestamp),
          expiresAt: new Date(data.expiresAt),
          lastAccessed: new Date(data.lastAccessed)
        };

        if (!this.isExpired(entry)) {
          this.cache.set(entry.key, entry);
        } else {
          // Remover arquivo expirado
          await fs.promises.unlink(filePath);
        }
      }
      
      this.recalculateStats();
    } catch (error) {
      console.error('Erro ao carregar cache do disco:', error);
    }
  }

  private deleteFromDisk(entry: CacheEntry): void {
    if (!this.config.persistToDisk) return;

    const filePath = path.join(this.config.diskCachePath, `${entry.key}.json`);
    fs.promises.unlink(filePath).catch(() => {
      // Ignorar erros de arquivo não encontrado
    });
  }

  // Métodos públicos de gerenciamento

  getStats(): CacheStats {
    return { 
      ...this.stats,
      tribunalStats: new Map(this.stats.tribunalStats)
    };
  }

  clearCache(tribunal?: TribunalType): void {
    if (tribunal) {
      this.invalidateTribunal(tribunal);
    } else {
      this.cache.clear();
      this.stats = {
        totalEntries: 0,
        totalSizeBytes: 0,
        hitRate: 0,
        missRate: 0,
        totalHits: 0,
        totalMisses: 0,
        evictions: 0,
        tribunalStats: new Map()
      };
    }
  }

  updateTTL(tribunal: TribunalType, ttlSeconds: number): void {
    this.config.tribunalTTL.set(tribunal, ttlSeconds);
  }

  warmupCache(processes: Array<{ tribunal: TribunalType; numeroProcesso: string; data: ProcessoTribunalData }>): Promise<void[]> {
    return Promise.all(
      processes.map(({ tribunal, numeroProcesso, data }) =>
        this.cacheProcess(tribunal, numeroProcesso, data)
      )
    );
  }

  async shutdown(): Promise<void> {
    this.stopCleanupTimer();
    
    if (this.config.persistToDisk) {
      // Salvar entradas ainda não persistidas
      const promises = Array.from(this.cache.values()).map(entry => this.saveToDisk(entry));
      await Promise.all(promises);
    }
  }
}

export { TribunalCache };
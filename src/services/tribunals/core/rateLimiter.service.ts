// src/services/tribunals/core/rateLimiter.service.ts

/**
 * Configuração do rate limiter por tribunal
 */
export interface RateLimitConfig {
  tribunalCode: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number; // Máximo de requisições em rajada
  cooldownMinutes: number; // Tempo de espera após atingir limite
}

/**
 * Status do rate limit
 */
export interface RateLimitStatus {
  tribunalCode: string;
  isBlocked: boolean;
  requestsInLastMinute: number;
  requestsInLastHour: number;
  requestsToday: number;
  nextAvailableAt?: Date;
  resetAt: Date;
  timeToReset: number; // em milissegundos
}

/**
 * Resultado da verificação de rate limit
 */
export interface RateLimitResult {
  allowed: boolean;
  status: RateLimitStatus;
  waitTime?: number; // Tempo de espera em ms se bloqueado
  reason?: string;
}

/**
 * Interface para armazenamento de dados do rate limiter
 */
interface RateLimitData {
  requests: Array<{
    timestamp: number;
    endpoint?: string;
  }>;
  blockedUntil?: number;
  lastReset: number;
}

/**
 * Service para controle de rate limiting por tribunal
 * Implementa limites por minuto, hora e dia com sistema de cooldown
 */
export class RateLimiterService {
  
  private static instance: RateLimiterService;
  private storage = new Map<string, RateLimitData>();
  private configs = new Map<string, RateLimitConfig>();
  private cleanupTimer?: NodeJS.Timeout;
  
  private constructor() {
    this.loadDefaultConfigs();
    this.startCleanupTimer();
  }
  
  /**
   * Singleton instance
   */
  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }
  
  /**
   * Verifica se uma requisição é permitida
   */
  async checkLimit(tribunalCode: string, endpoint?: string): Promise<RateLimitResult> {
    const config = this.getConfig(tribunalCode);
    const data = this.getData(tribunalCode);
    const now = Date.now();
    
    // Verificar se está em cooldown
    if (data.blockedUntil && now < data.blockedUntil) {
      const waitTime = data.blockedUntil - now;
      return {
        allowed: false,
        status: this.getStatus(tribunalCode, config, data, now),
        waitTime,
        reason: `Tribunal em cooldown por mais ${Math.ceil(waitTime / 1000)}s`
      };
    }
    
    // Limpar requisições antigas
    this.cleanOldRequests(data, now);
    
    // Contar requisições por período
    const requestsLastMinute = this.countRequestsInPeriod(data, now, 60 * 1000);
    const requestsLastHour = this.countRequestsInPeriod(data, now, 60 * 60 * 1000);
    const requestsToday = this.countRequestsInPeriod(data, now, 24 * 60 * 60 * 1000);
    
    // Verificar limites
    if (requestsLastMinute >= config.requestsPerMinute) {
      return {
        allowed: false,
        status: this.getStatus(tribunalCode, config, data, now),
        waitTime: 60 * 1000, // 1 minuto
        reason: `Limite de ${config.requestsPerMinute} requisições por minuto atingido`
      };
    }
    
    if (requestsLastHour >= config.requestsPerHour) {
      const cooldownTime = config.cooldownMinutes * 60 * 1000;
      data.blockedUntil = now + cooldownTime;
      
      return {
        allowed: false,
        status: this.getStatus(tribunalCode, config, data, now),
        waitTime: cooldownTime,
        reason: `Limite de ${config.requestsPerHour} requisições por hora atingido. Cooldown de ${config.cooldownMinutes} minutos.`
      };
    }
    
    if (requestsToday >= config.requestsPerDay) {
      // Bloquear até a meia-noite
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      data.blockedUntil = tomorrow.getTime();
      
      return {
        allowed: false,
        status: this.getStatus(tribunalCode, config, data, now),
        waitTime: tomorrow.getTime() - now,
        reason: `Limite diário de ${config.requestsPerDay} requisições atingido`
      };
    }
    
    // Requisição permitida - registrar
    data.requests.push({
      timestamp: now,
      endpoint
    });
    
    return {
      allowed: true,
      status: this.getStatus(tribunalCode, config, data, now)
    };
  }
  
  /**
   * Registra uma requisição (para uso após execução)
   */
  async recordRequest(tribunalCode: string, endpoint?: string): Promise<void> {
    const data = this.getData(tribunalCode);
    data.requests.push({
      timestamp: Date.now(),
      endpoint
    });
  }
  
  /**
   * Obtém status atual do rate limit
   */
  async getCurrentStatus(tribunalCode: string): Promise<RateLimitStatus> {
    const config = this.getConfig(tribunalCode);
    const data = this.getData(tribunalCode);
    const now = Date.now();
    
    return this.getStatus(tribunalCode, config, data, now);
  }
  
  /**
   * Remove todos os limites de um tribunal (reset)
   */
  async resetLimits(tribunalCode: string): Promise<void> {
    this.storage.delete(tribunalCode);
  }
  
  /**
   * Configura limites específicos para um tribunal
   */
  async setConfig(config: RateLimitConfig): Promise<void> {
    this.configs.set(config.tribunalCode, config);
  }
  
  /**
   * Obtém configuração de um tribunal
   */
  getConfig(tribunalCode: string): RateLimitConfig {
    return this.configs.get(tribunalCode) || this.getDefaultConfig(tribunalCode);
  }
  
  /**
   * Lista todos os status de rate limit ativos
   */
  async getAllStatus(): Promise<RateLimitStatus[]> {
    const statuses: RateLimitStatus[] = [];
    const now = Date.now();
    
    for (const [tribunalCode] of this.storage) {
      const config = this.getConfig(tribunalCode);
      const data = this.getData(tribunalCode);
      statuses.push(this.getStatus(tribunalCode, config, data, now));
    }
    
    return statuses.sort((a, b) => 
      (b.requestsInLastHour + b.requestsToday) - (a.requestsInLastHour + a.requestsToday)
    );
  }
  
  /**
   * Bloqueia temporariamente um tribunal
   */
  async blockTribunal(tribunalCode: string, durationMinutes: number): Promise<void> {
    const data = this.getData(tribunalCode);
    data.blockedUntil = Date.now() + (durationMinutes * 60 * 1000);
  }
  
  /**
   * Remove bloqueio de um tribunal
   */
  async unblockTribunal(tribunalCode: string): Promise<void> {
    const data = this.getData(tribunalCode);
    delete data.blockedUntil;
  }
  
  /**
   * Obtém ou cria dados para um tribunal
   */
  private getData(tribunalCode: string): RateLimitData {
    if (!this.storage.has(tribunalCode)) {
      this.storage.set(tribunalCode, {
        requests: [],
        lastReset: Date.now()
      });
    }
    return this.storage.get(tribunalCode)!;
  }
  
  /**
   * Gera status do rate limit
   */
  private getStatus(
    tribunalCode: string, 
    config: RateLimitConfig, 
    data: RateLimitData, 
    now: number
  ): RateLimitStatus {
    const isBlocked = Boolean(data.blockedUntil && now < data.blockedUntil);
    const requestsInLastMinute = this.countRequestsInPeriod(data, now, 60 * 1000);
    const requestsInLastHour = this.countRequestsInPeriod(data, now, 60 * 60 * 1000);
    const requestsToday = this.countRequestsInPeriod(data, now, 24 * 60 * 60 * 1000);
    
    // Calcular próximo reset
    const nextHour = new Date(now + 60 * 60 * 1000);
    nextHour.setMinutes(0, 0, 0);
    
    return {
      tribunalCode,
      isBlocked,
      requestsInLastMinute,
      requestsInLastHour,
      requestsToday,
      nextAvailableAt: data.blockedUntil ? new Date(data.blockedUntil) : undefined,
      resetAt: nextHour,
      timeToReset: nextHour.getTime() - now
    };
  }
  
  /**
   * Conta requisições em um período específico
   */
  private countRequestsInPeriod(data: RateLimitData, now: number, periodMs: number): number {
    const cutoff = now - periodMs;
    return data.requests.filter(req => req.timestamp > cutoff).length;
  }
  
  /**
   * Remove requisições antigas dos dados
   */
  private cleanOldRequests(data: RateLimitData, now: number): void {
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    data.requests = data.requests.filter(req => req.timestamp > oneDayAgo);
  }
  
  /**
   * Carrega configurações padrão por tipo de tribunal
   */
  private loadDefaultConfigs(): void {
    // Tribunais de Justiça Estadual - mais restritivos
    const tjConfigs = ['825', '819', '813', '821', '816']; // TJSP, TJRJ, TJMG, TJRS, TJPR
    tjConfigs.forEach(code => {
      this.configs.set(code, {
        tribunalCode: code,
        requestsPerMinute: 6,
        requestsPerHour: 50,
        requestsPerDay: 500,
        burstLimit: 10,
        cooldownMinutes: 15
      });
    });
    
    // Tribunais do Trabalho - moderados
    const trtConfigs = ['502', '515']; // TRT2, TRT15
    trtConfigs.forEach(code => {
      this.configs.set(code, {
        tribunalCode: code,
        requestsPerMinute: 10,
        requestsPerHour: 80,
        requestsPerDay: 800,
        burstLimit: 15,
        cooldownMinutes: 10
      });
    });
    
    // Tribunais Federais - moderados
    const trfConfigs = ['403']; // TRF3
    trfConfigs.forEach(code => {
      this.configs.set(code, {
        tribunalCode: code,
        requestsPerMinute: 8,
        requestsPerHour: 60,
        requestsPerDay: 600,
        burstLimit: 12,
        cooldownMinutes: 12
      });
    });
    
    // Tribunais Superiores - mais restritivos
    const superiorConfigs = ['301', '590']; // STJ, TST
    superiorConfigs.forEach(code => {
      this.configs.set(code, {
        tribunalCode: code,
        requestsPerMinute: 3,
        requestsPerHour: 30,
        requestsPerDay: 200,
        burstLimit: 5,
        cooldownMinutes: 30
      });
    });
  }
  
  /**
   * Configuração padrão para tribunais não especificados
   */
  private getDefaultConfig(tribunalCode: string): RateLimitConfig {
    return {
      tribunalCode,
      requestsPerMinute: 5,
      requestsPerHour: 40,
      requestsPerDay: 300,
      burstLimit: 8,
      cooldownMinutes: 20
    };
  }
  
  /**
   * Timer de limpeza automática
   */
  private startCleanupTimer(): void {
    // Executar limpeza a cada 15 minutos
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 15 * 60 * 1000);
  }
  
  /**
   * Executa limpeza de dados antigos
   */
  private performCleanup(): void {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    for (const [tribunalCode, data] of this.storage) {
      // Remover requisições antigas
      data.requests = data.requests.filter(req => req.timestamp > oneDayAgo);
      
      // Remover bloqueios expirados
      if (data.blockedUntil && now >= data.blockedUntil) {
        delete data.blockedUntil;
      }
      
      // Remover dados vazios
      if (data.requests.length === 0 && !data.blockedUntil) {
        this.storage.delete(tribunalCode);
      }
    }
  }
  
  /**
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.storage.clear();
  }
}

export default RateLimiterService;
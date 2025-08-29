// src/services/tribunalRateLimiter.service.ts

import { TribunalType } from '@/types/tribunalIntegration';

export interface RateLimitConfig {
  tribunal: TribunalType;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  cooldownPeriod: number; // em segundos
  backoffMultiplier: number;
  maxRetries: number;
  priority: number; // 1 (alta) a 5 (baixa)
}

export interface RateLimitStatus {
  tribunal: TribunalType;
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsThisDay: number;
  lastRequestTime: Date;
  isBlocked: boolean;
  blockedUntil?: Date;
  nextAvailableSlot: Date;
  queueSize: number;
}

export interface QueuedRequest {
  id: string;
  tribunal: TribunalType;
  priority: number;
  timestamp: Date;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeout?: NodeJS.Timeout;
  retryCount: number;
  request: () => Promise<any>;
}

class TribunalRateLimiter {
  private configs: Map<TribunalType, RateLimitConfig> = new Map();
  private status: Map<TribunalType, RateLimitStatus> = new Map();
  private queues: Map<TribunalType, QueuedRequest[]> = new Map();
  private processingQueues: Set<TribunalType> = new Set();
  private globalStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    blockedRequests: 0,
    averageWaitTime: 0
  };

  constructor() {
    this.loadDefaultConfigs();
    this.startCleanupTimer();
  }

  private loadDefaultConfigs(): void {
    // Configurações específicas por tribunal baseadas em suas políticas conhecidas
    
    // E-SAJ (TJSP e outros)
    this.setRateLimitConfig('tjsp', {
      tribunal: 'tjsp',
      requestsPerMinute: 10,
      requestsPerHour: 300,
      requestsPerDay: 5000,
      burstLimit: 3,
      cooldownPeriod: 30,
      backoffMultiplier: 2,
      maxRetries: 3,
      priority: 2
    });

    // PJe (TRFs e TRTs)
    ['trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6'].forEach(tribunal => {
      this.setRateLimitConfig(tribunal as TribunalType, {
        tribunal: tribunal as TribunalType,
        requestsPerMinute: 15,
        requestsPerHour: 500,
        requestsPerDay: 8000,
        burstLimit: 5,
        cooldownPeriod: 20,
        backoffMultiplier: 1.5,
        maxRetries: 5,
        priority: 1
      });
    });

    // Tribunais Superiores (STJ/STF)
    ['stj', 'stf'].forEach(tribunal => {
      this.setRateLimitConfig(tribunal as TribunalType, {
        tribunal: tribunal as TribunalType,
        requestsPerMinute: 5,
        requestsPerHour: 100,
        requestsPerDay: 1000,
        burstLimit: 2,
        cooldownPeriod: 60,
        backoffMultiplier: 3,
        maxRetries: 2,
        priority: 1
      });
    });

    // Receita Federal
    this.setRateLimitConfig('receita_federal', {
      tribunal: 'receita_federal',
      requestsPerMinute: 3,
      requestsPerHour: 50,
      requestsPerDay: 500,
      burstLimit: 1,
      cooldownPeriod: 120,
      backoffMultiplier: 4,
      maxRetries: 3,
      priority: 1
    });

    // INSS
    this.setRateLimitConfig('inss', {
      tribunal: 'inss',
      requestsPerMinute: 5,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      burstLimit: 2,
      cooldownPeriod: 60,
      backoffMultiplier: 2.5,
      maxRetries: 4,
      priority: 2
    });

    // Tribunais Estaduais (configuração padrão)
    ['tjrj', 'tjmg', 'tjrs', 'tjpr', 'tjsc', 'tjgo', 'tjba', 'tjce', 'tjpe'].forEach(tribunal => {
      this.setRateLimitConfig(tribunal as TribunalType, {
        tribunal: tribunal as TribunalType,
        requestsPerMinute: 8,
        requestsPerHour: 200,
        requestsPerDay: 2000,
        burstLimit: 3,
        cooldownPeriod: 30,
        backoffMultiplier: 2,
        maxRetries: 3,
        priority: 3
      });
    });
  }

  setRateLimitConfig(tribunal: TribunalType, config: RateLimitConfig): void {
    this.configs.set(tribunal, config);
    
    // Inicializar status se não existir
    if (!this.status.has(tribunal)) {
      this.status.set(tribunal, {
        tribunal,
        requestsThisMinute: 0,
        requestsThisHour: 0,
        requestsThisDay: 0,
        lastRequestTime: new Date(0),
        isBlocked: false,
        nextAvailableSlot: new Date(),
        queueSize: 0
      });
    }

    // Inicializar fila se não existir
    if (!this.queues.has(tribunal)) {
      this.queues.set(tribunal, []);
    }
  }

  async executeRequest<T>(
    tribunal: TribunalType, 
    request: () => Promise<T>,
    priority: number = 3
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();
      const queuedRequest: QueuedRequest = {
        id: requestId,
        tribunal,
        priority,
        timestamp: new Date(),
        resolve,
        reject,
        retryCount: 0,
        request
      };

      // Adicionar timeout
      queuedRequest.timeout = setTimeout(() => {
        this.removeFromQueue(tribunal, requestId);
        reject(new Error('Request timeout'));
      }, 300000); // 5 minutos timeout

      this.addToQueue(queuedRequest);
      this.processQueue(tribunal);
    });
  }

  private addToQueue(queuedRequest: QueuedRequest): void {
    const { tribunal } = queuedRequest;
    const queue = this.queues.get(tribunal) || [];
    
    // Inserir na posição correta baseado na prioridade
    const insertIndex = queue.findIndex(req => req.priority > queuedRequest.priority);
    if (insertIndex === -1) {
      queue.push(queuedRequest);
    } else {
      queue.splice(insertIndex, 0, queuedRequest);
    }

    this.queues.set(tribunal, queue);
    this.updateQueueSize(tribunal);
  }

  private async processQueue(tribunal: TribunalType): Promise<void> {
    if (this.processingQueues.has(tribunal)) {
      return; // Já está processando esta fila
    }

    this.processingQueues.add(tribunal);

    try {
      while (true) {
        const queue = this.queues.get(tribunal) || [];
        if (queue.length === 0) {
          break;
        }

        const nextRequest = queue[0];
        
        // Verificar se pode executar a requisição
        if (!this.canExecuteRequest(tribunal)) {
          const waitTime = this.calculateWaitTime(tribunal);
          await this.sleep(waitTime);
          continue;
        }

        // Remover da fila
        queue.shift();
        this.queues.set(tribunal, queue);
        this.updateQueueSize(tribunal);

        try {
          // Executar a requisição
          const startTime = Date.now();
          this.recordRequestStart(tribunal);
          
          const result = await nextRequest.request();
          
          const endTime = Date.now();
          this.recordRequestSuccess(tribunal, endTime - startTime);
          
          // Limpar timeout e resolver
          if (nextRequest.timeout) {
            clearTimeout(nextRequest.timeout);
          }
          nextRequest.resolve(result);

        } catch (error) {
          this.recordRequestFailure(tribunal);
          
          // Tentar retry se possível
          const config = this.configs.get(tribunal)!;
          if (nextRequest.retryCount < config.maxRetries) {
            nextRequest.retryCount++;
            
            // Calcular delay para retry com backoff exponencial
            const delay = config.cooldownPeriod * Math.pow(config.backoffMultiplier, nextRequest.retryCount - 1) * 1000;
            
            setTimeout(() => {
              this.addToQueue(nextRequest);
            }, delay);
          } else {
            // Máximo de retries excedido
            if (nextRequest.timeout) {
              clearTimeout(nextRequest.timeout);
            }
            nextRequest.reject(error);
          }
        }

        // Delay mínimo entre requisições
        await this.sleep(1000);
      }
    } finally {
      this.processingQueues.delete(tribunal);
    }
  }

  private canExecuteRequest(tribunal: TribunalType): boolean {
    const config = this.configs.get(tribunal);
    const status = this.status.get(tribunal);
    
    if (!config || !status) {
      return false;
    }

    // Verificar se está bloqueado
    if (status.isBlocked && status.blockedUntil && new Date() < status.blockedUntil) {
      return false;
    }

    // Verificar limites
    const now = new Date();
    this.cleanupCounters(tribunal, now);

    return (
      status.requestsThisMinute < config.requestsPerMinute &&
      status.requestsThisHour < config.requestsPerHour &&
      status.requestsThisDay < config.requestsPerDay
    );
  }

  private calculateWaitTime(tribunal: TribunalType): number {
    const config = this.configs.get(tribunal);
    const status = this.status.get(tribunal);
    
    if (!config || !status) {
      return 1000; // Fallback: 1 segundo
    }

    const now = new Date();
    
    // Se está bloqueado, aguardar até o desbloqueio
    if (status.isBlocked && status.blockedUntil && now < status.blockedUntil) {
      return status.blockedUntil.getTime() - now.getTime();
    }

    // Calcular próximo slot disponível baseado nos limites
    const timeSinceLastRequest = now.getTime() - status.lastRequestTime.getTime();
    const minIntervalBetweenRequests = (60 * 1000) / config.requestsPerMinute;
    
    if (timeSinceLastRequest < minIntervalBetweenRequests) {
      return minIntervalBetweenRequests - timeSinceLastRequest;
    }

    return 0;
  }

  private recordRequestStart(tribunal: TribunalType): void {
    const status = this.status.get(tribunal)!;
    const now = new Date();
    
    status.requestsThisMinute++;
    status.requestsThisHour++;
    status.requestsThisDay++;
    status.lastRequestTime = now;
    
    this.globalStats.totalRequests++;
  }

  private recordRequestSuccess(tribunal: TribunalType, duration: number): void {
    this.globalStats.successfulRequests++;
    
    // Atualizar tempo médio de espera
    this.globalStats.averageWaitTime = 
      (this.globalStats.averageWaitTime * (this.globalStats.successfulRequests - 1) + duration) / 
      this.globalStats.successfulRequests;
      
    // Desbloquear tribunal se estava bloqueado
    const status = this.status.get(tribunal)!;
    if (status.isBlocked) {
      status.isBlocked = false;
      status.blockedUntil = undefined;
    }
  }

  private recordRequestFailure(tribunal: TribunalType): void {
    this.globalStats.failedRequests++;
    
    const config = this.configs.get(tribunal)!;
    const status = this.status.get(tribunal)!;
    
    // Bloquear temporariamente em caso de muitas falhas
    const failureRate = this.globalStats.failedRequests / this.globalStats.totalRequests;
    if (failureRate > 0.5 && this.globalStats.totalRequests > 10) {
      status.isBlocked = true;
      status.blockedUntil = new Date(Date.now() + config.cooldownPeriod * 2 * 1000);
    }
  }

  private cleanupCounters(tribunal: TribunalType, now: Date): void {
    const status = this.status.get(tribunal)!;
    
    // Reset contador por minuto
    const minutesSinceLastRequest = Math.floor((now.getTime() - status.lastRequestTime.getTime()) / (60 * 1000));
    if (minutesSinceLastRequest >= 1) {
      status.requestsThisMinute = 0;
    }
    
    // Reset contador por hora
    const hoursSinceLastRequest = Math.floor((now.getTime() - status.lastRequestTime.getTime()) / (60 * 60 * 1000));
    if (hoursSinceLastRequest >= 1) {
      status.requestsThisHour = 0;
    }
    
    // Reset contador por dia
    const daysSinceLastRequest = Math.floor((now.getTime() - status.lastRequestTime.getTime()) / (24 * 60 * 60 * 1000));
    if (daysSinceLastRequest >= 1) {
      status.requestsThisDay = 0;
    }
  }

  private updateQueueSize(tribunal: TribunalType): void {
    const queue = this.queues.get(tribunal) || [];
    const status = this.status.get(tribunal)!;
    status.queueSize = queue.length;
  }

  private removeFromQueue(tribunal: TribunalType, requestId: string): void {
    const queue = this.queues.get(tribunal) || [];
    const index = queue.findIndex(req => req.id === requestId);
    
    if (index !== -1) {
      const request = queue[index];
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
      queue.splice(index, 1);
      this.queues.set(tribunal, queue);
      this.updateQueueSize(tribunal);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startCleanupTimer(): void {
    // Limpar estatísticas antigas a cada hora
    setInterval(() => {
      this.cleanupOldRequests();
    }, 60 * 60 * 1000);
  }

  private cleanupOldRequests(): void {
    const now = new Date();
    
    this.status.forEach((status, tribunal) => {
      this.cleanupCounters(tribunal, now);
    });
  }

  // Métodos públicos para monitoramento
  
  getRateLimitStatus(tribunal: TribunalType): RateLimitStatus | undefined {
    return this.status.get(tribunal);
  }

  getAllStatuses(): Map<TribunalType, RateLimitStatus> {
    return new Map(this.status);
  }

  getGlobalStats(): typeof this.globalStats {
    return { ...this.globalStats };
  }

  getQueueStatus(tribunal: TribunalType): { size: number; nextRequestETA: Date | null } {
    const queue = this.queues.get(tribunal) || [];
    const status = this.status.get(tribunal);
    
    let nextRequestETA: Date | null = null;
    if (queue.length > 0 && status) {
      const waitTime = this.calculateWaitTime(tribunal);
      nextRequestETA = new Date(Date.now() + waitTime);
    }
    
    return {
      size: queue.length,
      nextRequestETA
    };
  }

  // Limpar todas as filas (útil para testes)
  clearAllQueues(): void {
    this.queues.forEach((queue, tribunal) => {
      queue.forEach(request => {
        if (request.timeout) {
          clearTimeout(request.timeout);
        }
        request.reject(new Error('Queue cleared'));
      });
    });
    
    this.queues.clear();
    this.processingQueues.clear();
  }

  // Bloquear/desbloquear tribunal manualmente
  blockTribunal(tribunal: TribunalType, durationSeconds: number): void {
    const status = this.status.get(tribunal);
    if (status) {
      status.isBlocked = true;
      status.blockedUntil = new Date(Date.now() + durationSeconds * 1000);
    }
  }

  unblockTribunal(tribunal: TribunalType): void {
    const status = this.status.get(tribunal);
    if (status) {
      status.isBlocked = false;
      status.blockedUntil = undefined;
    }
  }
}

export { TribunalRateLimiter };
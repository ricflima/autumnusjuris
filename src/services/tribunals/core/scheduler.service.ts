// src/services/tribunals/core/scheduler.service.ts

import TribunalMovementsService from '../../tribunalMovements.service';
import RateLimiterService from './rateLimiter.service';
import TribunalDatabaseService from '../database/tribunalDatabase.service';

/**
 * Configuração de agendamento de um processo
 */
export interface ScheduleConfig {
  processId: string;
  cnjNumber: string;
  tribunalCode: string;
  frequencyHours: number; // Frequência em horas
  isActive: boolean;
  lastExecution?: Date;
  nextExecution?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  retryCount: number;
  maxRetries: number;
  createdBy?: string;
}

/**
 * Resultado de uma execução de consulta agendada
 */
export interface ScheduledQueryResult {
  scheduleId: string;
  processId: string;
  cnjNumber: string;
  executedAt: Date;
  status: 'success' | 'error' | 'rate_limited' | 'skipped';
  newMovements: number;
  totalMovements: number;
  executionTime: number;
  error?: string;
  nextExecution?: Date;
}

/**
 * Estatísticas do scheduler
 */
export interface SchedulerStats {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  executionsToday: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  nextExecutionTime?: Date;
  upcomingExecutions: Array<{
    cnjNumber: string;
    tribunalCode: string;
    nextExecution: Date;
    priority: string;
  }>;
}

/**
 * Service para agendamento inteligente de consultas aos tribunais
 */
export class SchedulerService {
  
  private static instance: SchedulerService;
  private schedules = new Map<string, ScheduleConfig>();
  private isRunning = false;
  private intervalTimer?: NodeJS.Timeout;
  private rateLimiter: RateLimiterService;
  private tribunalService: TribunalMovementsService;
  private executionHistory: ScheduledQueryResult[] = [];
  
  private constructor() {
    this.rateLimiter = RateLimiterService.getInstance();
    this.tribunalService = TribunalMovementsService.getInstance();
  }
  
  /**
   * Singleton instance
   */
  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }
  
  /**
   * Inicia o scheduler
   */
  async start(intervalMinutes: number = 5): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Scheduler já está rodando');
      return;
    }
    
    console.log('🚀 Iniciando Scheduler de Tribunais...');
    this.isRunning = true;
    
    // Inicializar serviços dependentes
    await this.tribunalService.initialize();
    
    // Carregar agendamentos existentes
    await this.loadSchedulesFromDatabase();
    
    // Executar imediatamente uma verificação
    await this.executeScheduledQueries();
    
    // Configurar timer para execuções regulares
    this.intervalTimer = setInterval(async () => {
      await this.executeScheduledQueries();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`✅ Scheduler iniciado com intervalo de ${intervalMinutes} minutos`);
  }
  
  /**
   * Para o scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('🛑 Parando Scheduler...');
    this.isRunning = false;
    
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
    
    console.log('✅ Scheduler parado');
  }
  
  /**
   * Adiciona um processo ao agendamento
   */
  async addSchedule(config: Omit<ScheduleConfig, 'nextExecution' | 'retryCount'>): Promise<string> {
    const scheduleId = this.generateScheduleId(config.processId, config.tribunalCode);
    
    const schedule: ScheduleConfig = {
      ...config,
      nextExecution: this.calculateNextExecution(config.frequencyHours),
      retryCount: 0
    };
    
    this.schedules.set(scheduleId, schedule);
    
    // Salvar no banco de dados (simulado)
    console.log(`📅 Agendamento criado: ${config.cnjNumber} (${config.tribunalCode}) - Frequência: ${config.frequencyHours}h`);
    
    return scheduleId;
  }
  
  /**
   * Remove um agendamento
   */
  async removeSchedule(scheduleId: string): Promise<boolean> {
    const removed = this.schedules.delete(scheduleId);
    if (removed) {
      console.log(`🗑️ Agendamento removido: ${scheduleId}`);
    }
    return removed;
  }
  
  /**
   * Pausa um agendamento
   */
  async pauseSchedule(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      schedule.isActive = false;
      console.log(`⏸️ Agendamento pausado: ${schedule.cnjNumber}`);
      return true;
    }
    return false;
  }
  
  /**
   * Resume um agendamento
   */
  async resumeSchedule(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      schedule.isActive = true;
      schedule.nextExecution = this.calculateNextExecution(schedule.frequencyHours);
      console.log(`▶️ Agendamento reativado: ${schedule.cnjNumber}`);
      return true;
    }
    return false;
  }
  
  /**
   * Atualiza configuração de um agendamento
   */
  async updateSchedule(scheduleId: string, updates: Partial<ScheduleConfig>): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      Object.assign(schedule, updates);
      
      // Recalcular próxima execução se frequência mudou
      if (updates.frequencyHours) {
        schedule.nextExecution = this.calculateNextExecution(updates.frequencyHours);
      }
      
      console.log(`🔄 Agendamento atualizado: ${schedule.cnjNumber}`);
      return true;
    }
    return false;
  }
  
  /**
   * Obtém todos os agendamentos
   */
  async getSchedules(): Promise<ScheduleConfig[]> {
    return Array.from(this.schedules.values())
      .sort((a, b) => {
        // Ordenar por prioridade e próxima execução
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        const aNext = a.nextExecution?.getTime() || 0;
        const bNext = b.nextExecution?.getTime() || 0;
        
        return aNext - bNext;
      });
  }
  
  /**
   * Obtém estatísticas do scheduler
   */
  async getStatistics(): Promise<SchedulerStats> {
    const schedules = Array.from(this.schedules.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayExecutions = this.executionHistory.filter(
      e => e.executedAt >= today
    );
    
    const successfulExecutions = todayExecutions.filter(e => e.status === 'success');
    const avgExecutionTime = todayExecutions.length > 0
      ? todayExecutions.reduce((sum, e) => sum + e.executionTime, 0) / todayExecutions.length
      : 0;
    
    // Próximas 5 execuções
    const upcomingExecutions = schedules
      .filter(s => s.isActive && s.nextExecution)
      .sort((a, b) => (a.nextExecution?.getTime() || 0) - (b.nextExecution?.getTime() || 0))
      .slice(0, 5)
      .map(s => ({
        cnjNumber: s.cnjNumber,
        tribunalCode: s.tribunalCode,
        nextExecution: s.nextExecution!,
        priority: s.priority
      }));
    
    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter(s => s.isActive).length,
      pausedSchedules: schedules.filter(s => !s.isActive).length,
      executionsToday: todayExecutions.length,
      successfulExecutions: successfulExecutions.length,
      failedExecutions: todayExecutions.filter(e => e.status === 'error').length,
      avgExecutionTime: Math.round(avgExecutionTime),
      nextExecutionTime: upcomingExecutions[0]?.nextExecution,
      upcomingExecutions
    };
  }
  
  /**
   * Executa uma consulta específica manualmente
   */
  async executeNow(scheduleId: string): Promise<ScheduledQueryResult> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error('Agendamento não encontrado');
    }
    
    return await this.executeQuery(schedule);
  }
  
  /**
   * Executa consultas que estão na hora
   */
  private async executeScheduledQueries(): Promise<void> {
    if (!this.isRunning) return;
    
    const now = new Date();
    const dueCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
    
    // Encontrar agendamentos que precisam ser executados
    const dueSchedules = Array.from(this.schedules.values())
      .filter(schedule => 
        schedule.isActive && 
        schedule.nextExecution && 
        schedule.nextExecution <= now
      )
      .sort((a, b) => {
        // Ordenar por prioridade primeiro
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Depois por tempo de execução
        return (a.nextExecution?.getTime() || 0) - (b.nextExecution?.getTime() || 0);
      });
    
    if (dueSchedules.length === 0) return;
    
    // Contar por prioridade
    dueSchedules.forEach(s => dueCounts[s.priority]++);
    
    console.log(`⏰ Executando ${dueSchedules.length} consultas agendadas:`, dueCounts);
    
    // Executar as consultas
    const results: ScheduledQueryResult[] = [];
    
    for (const schedule of dueSchedules) {
      try {
        const result = await this.executeQuery(schedule);
        results.push(result);
        
        // Pequeno delay entre execuções para não sobrecarregar
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`❌ Erro na execução agendada ${schedule.cnjNumber}:`, error);
      }
    }
    
    // Relatório resumido
    const successful = results.filter(r => r.status === 'success').length;
    const errors = results.filter(r => r.status === 'error').length;
    const rateLimited = results.filter(r => r.status === 'rate_limited').length;
    
    console.log(`✅ Execução completa: ${successful} sucessos, ${errors} erros, ${rateLimited} limitados`);
  }
  
  /**
   * Executa uma consulta específica
   */
  private async executeQuery(schedule: ScheduleConfig): Promise<ScheduledQueryResult> {
    const startTime = Date.now();
    const scheduleId = this.generateScheduleId(schedule.processId, schedule.tribunalCode);
    
    const result: ScheduledQueryResult = {
      scheduleId,
      processId: schedule.processId,
      cnjNumber: schedule.cnjNumber,
      executedAt: new Date(),
      status: 'error',
      newMovements: 0,
      totalMovements: 0,
      executionTime: 0
    };
    
    try {
      // Verificar rate limit
      const rateLimitResult = await this.rateLimiter.checkLimit(schedule.tribunalCode, 'scheduled');
      
      if (!rateLimitResult.allowed) {
        result.status = 'rate_limited';
        result.error = rateLimitResult.reason;
        
        // Reagendar para mais tarde baseado no rate limit
        schedule.nextExecution = new Date(Date.now() + (rateLimitResult.waitTime || 300000)); // 5min default
        
        console.log(`⏱️ Rate limit: ${schedule.cnjNumber} reagendado para ${schedule.nextExecution.toLocaleTimeString()}`);
        return result;
      }
      
      // Executar consulta
      const queryResult = await this.tribunalService.queryMovements(schedule.cnjNumber, {
        useCache: true,
        enablePersistence: true,
        enableNoveltyDetection: true
      });
      
      if (queryResult.success) {
        result.status = 'success';
        result.newMovements = queryResult.newMovements || 0;
        result.totalMovements = queryResult.totalMovements || 0;
        
        // Reset retry count em caso de sucesso
        schedule.retryCount = 0;
        
        console.log(`✅ ${schedule.cnjNumber}: ${result.newMovements} novas movimentações`);
        
      } else {
        throw new Error(queryResult.error || 'Falha na consulta');
      }
      
    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Incrementar contador de tentativas
      schedule.retryCount++;
      
      console.log(`❌ ${schedule.cnjNumber}: ${result.error} (tentativa ${schedule.retryCount}/${schedule.maxRetries})`);
      
      // Desativar se excedeu máximo de tentativas
      if (schedule.retryCount >= schedule.maxRetries) {
        schedule.isActive = false;
        console.log(`🛑 ${schedule.cnjNumber}: Desativado após ${schedule.maxRetries} falhas`);
      }
    }
    
    // Calcular tempo de execução e próxima consulta
    result.executionTime = Date.now() - startTime;
    
    if (schedule.isActive) {
      schedule.lastExecution = result.executedAt;
      schedule.nextExecution = this.calculateNextExecution(schedule.frequencyHours, schedule.priority);
      result.nextExecution = schedule.nextExecution;
    }
    
    // Adicionar ao histórico (manter apenas últimas 1000)
    this.executionHistory.push(result);
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-500);
    }
    
    return result;
  }
  
  /**
   * Calcula próxima execução baseada na frequência e prioridade
   */
  private calculateNextExecution(frequencyHours: number, priority: string = 'medium'): Date {
    const baseDelay = frequencyHours * 60 * 60 * 1000; // em ms
    
    // Ajustar delay baseado na prioridade
    const priorityMap: Record<string, number> = {
      urgent: 0.5,   // Metade do tempo
      high: 0.75,    // 25% menos tempo
      medium: 1.0,   // Tempo normal
      low: 1.5       // 50% mais tempo
    };
    const priorityMultiplier = priorityMap[priority] || 1.0;
    
    const adjustedDelay = baseDelay * priorityMultiplier;
    
    // Adicionar pequena variação aleatória para evitar execuções simultâneas
    const jitter = Math.random() * 0.1 * adjustedDelay; // até 10% de variação
    
    return new Date(Date.now() + adjustedDelay + jitter);
  }
  
  /**
   * Carrega agendamentos do banco de dados
   */
  private async loadSchedulesFromDatabase(): Promise<void> {
    // Simular carregamento do banco
    console.log('📥 Carregando agendamentos do banco de dados...');
    
    // Em produção, aqui seria uma consulta real ao banco
    // const schedules = await TribunalDatabaseService.getSchedules();
    
    console.log(`📋 ${this.schedules.size} agendamentos carregados`);
  }
  
  /**
   * Gera ID único para um agendamento
   */
  private generateScheduleId(processId: string, tribunalCode: string): string {
    return `${processId}_${tribunalCode}`;
  }
  
  /**
   * Utilitário para delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Cleanup ao destruir a instância
   */
  destroy(): void {
    this.stop();
    this.schedules.clear();
    this.executionHistory = [];
  }
}

export default SchedulerService;
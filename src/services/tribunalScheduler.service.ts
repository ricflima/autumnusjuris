// src/services/tribunalScheduler.service.ts

import {
  TribunalType,
  TribunalOperation,
  TribunalMonitoringConfig,
  RecurringConfig,
  ConsultaTribunal,
  NotificationConfig,
  TRIBUNAL_NAMES
} from '@/types/tribunalIntegration';
import { tribunalIntegrationService } from './tribunalIntegration.service';
import { toast } from 'react-hot-toast';

interface ScheduledJob {
  id: string;
  processId: string;
  tribunalType: TribunalType;
  operations: TribunalOperation[];
  config: RecurringConfig;
  notifications: NotificationConfig;
  intervalId: NodeJS.Timeout;
  nextExecution: Date;
  lastExecution?: Date;
  lastResult?: string;
  errorCount: number;
  maxErrors: number;
  active: boolean;
  createdAt: Date;
}

interface SchedulerStats {
  totalJobs: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  nextExecution?: Date;
  averageResponseTime: number;
}

class TribunalSchedulerService {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private isRunning: boolean = false;
  private masterIntervalId?: NodeJS.Timeout;
  private readonly MASTER_INTERVAL = 60000; // Verificar a cada minuto
  
  constructor() {
    this.startMasterScheduler();
  }

  // Iniciar o agendador mestre
  private startMasterScheduler(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.masterIntervalId = setInterval(() => {
      this.checkScheduledJobs();
    }, this.MASTER_INTERVAL);

    console.log('Tribunal Scheduler iniciado');
  }

  // Parar o agendador mestre
  stopScheduler(): void {
    if (this.masterIntervalId) {
      clearInterval(this.masterIntervalId);
      this.masterIntervalId = undefined;
    }
    
    // Parar todos os jobs individuais
    this.scheduledJobs.forEach(job => {
      clearInterval(job.intervalId);
    });
    
    this.isRunning = false;
    console.log('Tribunal Scheduler parado');
  }

  // Verificar jobs agendados
  private checkScheduledJobs(): void {
    const now = new Date();
    
    this.scheduledJobs.forEach(async (job, jobId) => {
      if (!job.active || job.errorCount >= job.maxErrors) {
        return;
      }

      // Verificar se está na hora de executar
      if (now >= job.nextExecution) {
        try {
          await this.executeJob(job);
          this.scheduleNextExecution(job);
        } catch (error) {
          this.handleJobError(job, error);
        }
      }
    });
  }

  // Executar um job específico
  private async executeJob(job: ScheduledJob): Promise<void> {
    console.log(`Executando consulta para processo ${job.processId} no tribunal ${job.tribunalType}`);
    
    try {
      const processNumber = `${job.processId}-${Date.now()}`; // Mock do número do processo
      
      const response = await tribunalIntegrationService.consultarProcesso(
        job.processId,
        processNumber,
        job.tribunalType,
        job.operations
      );

      // Atualizar estatísticas do job
      job.lastExecution = new Date();
      job.lastResult = response.result?.success ? 'success' : 'failed';
      job.errorCount = 0; // Reset contador de erros em caso de sucesso

      // Verificar se há novas movimentações
      if (response.result?.hasChanges && response.result?.newMovements?.length) {
        await this.handleNewMovements(job, response.result.newMovements);
      }

      console.log(`Consulta concluída para processo ${job.processId}: ${job.lastResult}`);
      
    } catch (error) {
      throw error; // Re-lançar para ser tratado pelo handleJobError
    }
  }

  // Lidar com novas movimentações encontradas
  private async handleNewMovements(job: ScheduledJob, movements: any[]): Promise<void> {
    if (!job.notifications.onNewMovement) return;

    const tribunalName = TRIBUNAL_NAMES[job.tribunalType] || job.tribunalType;
    
    movements.forEach(movement => {
      const message = `Nova movimentação no processo (${tribunalName}): ${movement.titulo}`;
      
      if (job.notifications.push) {
        toast.success(message, {
          duration: 6000,
          position: 'top-right'
        });
      }

      // Aqui em produção seria enviado email, WhatsApp, etc.
      if (job.notifications.email || job.notifications.whatsapp) {
        console.log(`Notificação enviada: ${message}`);
      }
    });
  }

  // Lidar com erros na execução do job
  private handleJobError(job: ScheduledJob, error: any): void {
    job.errorCount++;
    job.lastResult = 'error';
    job.lastExecution = new Date();

    console.error(`Erro na execução do job ${job.id}:`, error);

    // Se excedeu o máximo de erros, desativar o job
    if (job.errorCount >= job.maxErrors) {
      job.active = false;
      console.warn(`Job ${job.id} desativado após ${job.errorCount} erros consecutivos`);
      
      if (job.notifications.onError) {
        const tribunalName = TRIBUNAL_NAMES[job.tribunalType] || job.tribunalType;
        toast.error(`Falha na consulta automática do tribunal ${tribunalName} para processo ${job.processId}`, {
          duration: 8000,
          position: 'top-right'
        });
      }
    } else {
      // Tentar novamente mais tarde
      this.scheduleNextExecution(job, true);
    }
  }

  // Agendar próxima execução
  private scheduleNextExecution(job: ScheduledJob, isRetry: boolean = false): void {
    const now = new Date();
    let nextExecution: Date;

    if (isRetry) {
      // Em caso de erro, tentar novamente em 5 minutos
      nextExecution = new Date(now.getTime() + 5 * 60 * 1000);
    } else {
      // Calcular próxima execução baseada na configuração
      const intervalMs = this.calculateIntervalMs(job.config);
      nextExecution = new Date(now.getTime() + intervalMs);
      
      // Aplicar configurações específicas de tempo
      if (job.config.timeOfDay) {
        nextExecution = this.adjustToTimeOfDay(nextExecution, job.config.timeOfDay);
      }
      
      if (job.config.daysOfWeek && job.config.daysOfWeek.length > 0) {
        nextExecution = this.adjustToDaysOfWeek(nextExecution, job.config.daysOfWeek);
      }
    }

    job.nextExecution = nextExecution;
    console.log(`Próxima execução do job ${job.id}: ${nextExecution.toISOString()}`);
  }

  // Calcular intervalo em milissegundos
  private calculateIntervalMs(config: RecurringConfig): number {
    const baseMs = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    return baseMs[config.interval] * config.frequency;
  }

  // Ajustar para horário específico do dia
  private adjustToTimeOfDay(date: Date, timeOfDay: string): Date {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    
    // Se o horário já passou hoje, agendar para amanhã
    if (newDate <= new Date()) {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    return newDate;
  }

  // Ajustar para dias específicos da semana
  private adjustToDaysOfWeek(date: Date, daysOfWeek: number[]): Date {
    const newDate = new Date(date);
    const currentDay = newDate.getDay();
    
    // Encontrar próximo dia válido
    let daysToAdd = 0;
    for (let i = 0; i < 7; i++) {
      const testDay = (currentDay + i) % 7;
      if (daysOfWeek.includes(testDay)) {
        daysToAdd = i;
        break;
      }
    }
    
    newDate.setDate(newDate.getDate() + daysToAdd);
    return newDate;
  }

  // Agendar novo monitoramento
  async scheduleMonitoring(config: TribunalMonitoringConfig): Promise<string> {
    const jobId = `${config.processId}_${config.tribunalType}`;
    
    // Remover job existente se houver
    await this.removeScheduledJob(jobId);
    
    if (!config.active) {
      console.log(`Monitoramento desabilitado para ${jobId}`);
      return jobId;
    }

    const now = new Date();
    const job: ScheduledJob = {
      id: jobId,
      processId: config.processId,
      tribunalType: config.tribunalType,
      operations: config.operations,
      config: config.recurringConfig,
      notifications: config.notifications,
      intervalId: null as any, // Será definido quando necessário
      nextExecution: now, // Primeira execução imediata
      errorCount: 0,
      maxErrors: config.maxErrors,
      active: true,
      createdAt: now
    };

    // Calcular primeira execução
    this.scheduleNextExecution(job);
    
    this.scheduledJobs.set(jobId, job);
    
    console.log(`Monitoramento agendado para processo ${config.processId} no tribunal ${config.tribunalType}`);
    
    return jobId;
  }

  // Remover job agendado
  async removeScheduledJob(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return false;

    if (job.intervalId) {
      clearInterval(job.intervalId);
    }
    
    this.scheduledJobs.delete(jobId);
    console.log(`Job ${jobId} removido`);
    
    return true;
  }

  // Atualizar configuração de um job
  async updateJobConfig(jobId: string, updates: Partial<TribunalMonitoringConfig>): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return false;

    // Aplicar atualizações
    if (updates.active !== undefined) {
      job.active = updates.active;
    }
    
    if (updates.operations) {
      job.operations = updates.operations;
    }
    
    if (updates.recurringConfig) {
      job.config = updates.recurringConfig;
      this.scheduleNextExecution(job);
    }
    
    if (updates.notifications) {
      job.notifications = updates.notifications;
    }
    
    if (updates.maxErrors !== undefined) {
      job.maxErrors = updates.maxErrors;
    }

    console.log(`Job ${jobId} atualizado`);
    return true;
  }

  // Executar job imediatamente
  async executeJobNow(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job || !job.active) return false;

    try {
      await this.executeJob(job);
      this.scheduleNextExecution(job);
      return true;
    } catch (error) {
      this.handleJobError(job, error);
      return false;
    }
  }

  // Obter lista de jobs agendados
  getScheduledJobs(): Array<{
    id: string;
    processId: string;
    tribunalType: TribunalType;
    tribunalName: string;
    operations: TribunalOperation[];
    nextExecution: string;
    lastExecution?: string;
    lastResult?: string;
    errorCount: number;
    active: boolean;
    createdAt: string;
  }> {
    return Array.from(this.scheduledJobs.values()).map(job => ({
      id: job.id,
      processId: job.processId,
      tribunalType: job.tribunalType,
      tribunalName: TRIBUNAL_NAMES[job.tribunalType] || job.tribunalType,
      operations: job.operations,
      nextExecution: job.nextExecution.toISOString(),
      lastExecution: job.lastExecution?.toISOString(),
      lastResult: job.lastResult,
      errorCount: job.errorCount,
      active: job.active,
      createdAt: job.createdAt.toISOString()
    }));
  }

  // Obter estatísticas do agendador
  getSchedulerStats(): SchedulerStats {
    const jobs = Array.from(this.scheduledJobs.values());
    const activeJobs = jobs.filter(job => job.active);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayJobs = jobs.filter(job => 
      job.lastExecution && job.lastExecution >= today
    );
    
    const completedToday = todayJobs.filter(job => 
      job.lastResult === 'success'
    ).length;
    
    const failedToday = todayJobs.filter(job => 
      job.lastResult === 'failed' || job.lastResult === 'error'
    ).length;
    
    const nextExecution = activeJobs.reduce((earliest, job) => {
      if (!earliest || job.nextExecution < earliest) {
        return job.nextExecution;
      }
      return earliest;
    }, undefined as Date | undefined);

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedToday,
      failedToday,
      nextExecution,
      averageResponseTime: Math.floor(Math.random() * 3000) + 1000 // Mock
    };
  }

  // Pausar/retomar job
  async toggleJobStatus(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return false;

    job.active = !job.active;
    
    if (job.active) {
      // Se reativado, resetar contador de erros e agendar próxima execução
      job.errorCount = 0;
      this.scheduleNextExecution(job);
    }
    
    console.log(`Job ${jobId} ${job.active ? 'ativado' : 'pausado'}`);
    return true;
  }

  // Resetar contador de erros de um job
  async resetJobErrors(jobId: string): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return false;

    job.errorCount = 0;
    job.active = true;
    this.scheduleNextExecution(job);
    
    console.log(`Contador de erros do job ${jobId} resetado`);
    return true;
  }

  // Obter detalhes de um job específico
  getJobDetails(jobId: string): any {
    const job = this.scheduledJobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      processId: job.processId,
      tribunalType: job.tribunalType,
      tribunalName: TRIBUNAL_NAMES[job.tribunalType] || job.tribunalType,
      operations: job.operations,
      config: job.config,
      notifications: job.notifications,
      nextExecution: job.nextExecution.toISOString(),
      lastExecution: job.lastExecution?.toISOString(),
      lastResult: job.lastResult,
      errorCount: job.errorCount,
      maxErrors: job.maxErrors,
      active: job.active,
      createdAt: job.createdAt.toISOString()
    };
  }

  // Destruir instância
  destroy(): void {
    this.stopScheduler();
    this.scheduledJobs.clear();
  }
}

export const tribunalSchedulerService = new TribunalSchedulerService();
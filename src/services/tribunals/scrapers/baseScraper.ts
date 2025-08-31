// src/services/tribunals/scrapers/baseScraper.ts

import { CNJProcessNumber } from '../parsers/cnj.parser';
import { TribunalConfig } from '../tribunalIdentifier.service';

/**
 * Status da consulta do processo
 */
export type ProcessQueryStatus = 
  | 'success'      // Consulta bem-sucedida
  | 'not_found'    // Processo não encontrado
  | 'error'        // Erro na consulta
  | 'blocked'      // Bloqueado por anti-bot
  | 'timeout'      // Timeout na requisição
  | 'rate_limit';  // Rate limit excedido

/**
 * Informações básicas do processo
 */
export interface ProcessBasicInfo {
  number: string;
  court: string;
  subject: string;
  parties: {
    plaintiffs: string[];
    defendants: string[];
    lawyers: string[];
  };
  status: string;
  value?: string;
  distributionDate?: string;
  lastUpdate?: string;
  judge?: string;
  courtRoom?: string;
  processClass?: string;
}

/**
 * Movimentação processual
 */
export interface ProcessMovement {
  id: string;
  date: string;
  title: string;
  description: string;
  type?: 'decisao' | 'despacho' | 'peticao' | 'juntada' | 'audiencia' | 'outros';
  isPublic: boolean;
  attachments?: {
    name: string;
    url?: string;
    type: 'pdf' | 'doc' | 'txt' | 'other';
  }[];
  author?: string;
  destination?: string;
}

/**
 * Resultado da consulta do processo
 */
export interface ProcessQueryResult {
  status: ProcessQueryStatus;
  processNumber: string;
  queryTimestamp: string;
  error?: string;
  
  // Dados do processo (quando sucesso)
  basicInfo?: ProcessBasicInfo;
  movements?: ProcessMovement[];
  
  // Metadados da consulta
  tribunal: string;
  queryDuration: number;
  fromCache: boolean;
  retryCount: number;
  nextRetryAt?: string;
  
  // Hash para detecção de mudanças
  contentHash?: string;
  
  // Para processos em segredo de justiça
  isConfidential?: boolean;
  confidentialMessage?: string;
}

/**
 * Configurações de requisição
 */
export interface RequestConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  cookies?: Record<string, string>;
  proxy?: string;
  userAgent: string;
  followRedirects: boolean;
}

/**
 * Configurações do scraper
 */
export interface ScraperConfig {
  tribunal: TribunalConfig;
  request: RequestConfig;
  parsing: {
    waitForLoad: number;
    retryOnEmpty: boolean;
    validateContent: boolean;
  };
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

/**
 * Métricas do scraper
 */
export interface ScraperMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  blockedRequests: number;
  avgResponseTime: number;
  lastUsed: string;
  errorRate: number;
}

/**
 * Classe base abstrata para scrapers de tribunais
 */
export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected metrics: ScraperMetrics;
  private requestQueue: Promise<any>[] = [];
  private lastRequestTime = 0;

  constructor(tribunal: TribunalConfig) {
    this.config = this.createScraperConfig(tribunal);
    this.metrics = this.initializeMetrics();
  }

  /**
   * Método principal para consultar um processo
   */
  async queryProcess(cnj: CNJProcessNumber): Promise<ProcessQueryResult> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Verificar rate limit
      await this.enforceRateLimit();

      // Fazer a consulta específica do tribunal
      const result = await this.performQuery(cnj);

      // Calcular métricas
      const duration = Date.now() - startTime;
      this.updateMetrics(true, duration);

      return {
        ...result,
        queryTimestamp: new Date().toISOString(),
        queryDuration: duration,
        tribunal: this.config.tribunal.name,
        retryCount: 0
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration);

      return {
        status: 'error',
        processNumber: cnj.formattedNumber,
        queryTimestamp: new Date().toISOString(),
        queryDuration: duration,
        tribunal: this.config.tribunal.name,
        retryCount: 0,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Método abstrato que cada scraper deve implementar
   */
  protected abstract performQuery(cnj: CNJProcessNumber): Promise<Omit<ProcessQueryResult, 'queryTimestamp' | 'queryDuration' | 'tribunal' | 'retryCount'>>;

  /**
   * Verifica se o tribunal está funcionando
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest(this.config.tribunal.baseUrl, 'GET');
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }

  /**
   * Faz requisição HTTP com configurações do scraper
   */
  protected async makeRequest(
    url: string, 
    method: 'GET' | 'POST' = 'GET',
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<any> {
    const headers = {
      ...this.config.request.headers,
      ...customHeaders
    };

    const requestConfig = {
      method,
      headers,
      timeout: this.config.request.timeout,
      body: data ? JSON.stringify(data) : undefined
    };

    const response = await fetch(url, requestConfig);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return { 
        status: response.status, 
        data: await response.json(),
        headers: response.headers,
        url: response.url
      };
    }
    
    return { 
      status: response.status, 
      data: await response.text(),
      headers: response.headers,
      url: response.url
    };
  }

  /**
   * Extrai texto limpo de HTML
   */
  protected extractText(html: string): string {
    // Remove tags HTML e limpa o texto
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normaliza dados de entrada
   */
  protected normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  /**
   * Gera hash MD5 do conteúdo
   */
  protected generateContentHash(content: string): string {
    // Implementação simples de hash (em produção usar crypto)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Valida se o conteúdo é válido
   */
  protected validateContent(content: string): boolean {
    if (!content || content.length < 50) return false;
    
    // Verificar se contém indicadores de erro
    const errorIndicators = [
      'erro',
      'error',
      'não encontrado',
      'not found',
      'acesso negado',
      'bloqueado',
      'captcha'
    ];

    const normalizedContent = this.normalizeText(content);
    return !errorIndicators.some(indicator => 
      normalizedContent.includes(this.normalizeText(indicator))
    );
  }

  /**
   * Parseia data brasileira
   */
  protected parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    // Remover caracteres extras
    const cleanDate = dateStr.replace(/[^\d\/\-\.]/g, '');
    
    // Tentar diferentes formatos
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // dd/mm/yyyy
      /^(\d{2})-(\d{2})-(\d{4})$/,   // dd-mm-yyyy
      /^(\d{2})\.(\d{2})\.(\d{4})$/  // dd.mm.yyyy
    ];

    for (const format of formats) {
      const match = cleanDate.match(format);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return null;
  }

  /**
   * Aplica rate limit
   */
  private async enforceRateLimit(): Promise<void> {
    if (!this.config.rateLimit.enabled) return;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / this.config.rateLimit.requestsPerMinute;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Atualiza métricas do scraper
   */
  private updateMetrics(success: boolean, duration: number): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Calcular média de tempo de resposta
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.avgResponseTime = 
      ((this.metrics.avgResponseTime * (total - 1)) + duration) / total;

    // Calcular taxa de erro
    this.metrics.errorRate = 
      (this.metrics.failedRequests / this.metrics.totalRequests) * 100;

    this.metrics.lastUsed = new Date().toISOString();
  }

  /**
   * Cria configuração do scraper
   */
  private createScraperConfig(tribunal: TribunalConfig): ScraperConfig {
    return {
      tribunal,
      request: {
        timeout: 30000,
        retries: 3,
        retryDelay: 2000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          ...tribunal.headers
        },
        cookies: tribunal.cookies,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        followRedirects: true
      },
      parsing: {
        waitForLoad: 2000,
        retryOnEmpty: true,
        validateContent: true
      },
      rateLimit: {
        enabled: true,
        requestsPerMinute: tribunal.rateLimit.requestsPerMinute,
        requestsPerHour: tribunal.rateLimit.requestsPerHour
      }
    };
  }

  /**
   * Inicializa métricas
   */
  private initializeMetrics(): ScraperMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      blockedRequests: 0,
      avgResponseTime: 0,
      lastUsed: new Date().toISOString(),
      errorRate: 0
    };
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): ScraperMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset das métricas
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Obtém informações do tribunal
   */
  getTribunalInfo(): TribunalConfig {
    return this.config.tribunal;
  }
}

export default BaseScraper;
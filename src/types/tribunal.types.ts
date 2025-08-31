// src/types/tribunal.types.ts

/**
 * Movimentação processual individual
 */
export interface TribunalMovement {
  id: string;
  processNumber: string;
  tribunal: string;
  movementDate: Date;
  movementCode?: string;
  title: string;
  description: string;
  isJudicial: boolean;
  hash: string;
  source: string;
  discoveredAt: Date;
  isNew: boolean;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Resultado de scraping/consulta
 */
export interface ScrapingResult {
  success: boolean;
  movements: TribunalMovement[];
  error?: string;
  metadata: {
    tribunal: string;
    processNumber?: string;
    consultationDate: Date;
    responseTime: number;
    totalMovements: number;
    source: string;
    lastUpdate?: Date;
    dataSource?: any;
  };
}

/**
 * Configuração de tribunal
 */
export interface TribunalConfig {
  code: string;
  name: string;
  baseUrl: string;
  type: 'estadual' | 'federal' | 'trabalhista' | 'superior' | 'especial';
  isActive: boolean;
  rateLimit?: number;
  timeout?: number;
  retryCount?: number;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Status do processo
 */
export enum ProcessQueryStatus {
  SUCCESS = 'success',
  NOT_FOUND = 'not_found',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CAPTCHA_REQUIRED = 'captcha_required',
  INVALID_NUMBER = 'invalid_number'
}

/**
 * Informações básicas do processo
 */
export interface ProcessBasicInfo {
  processNumber: string;
  tribunal: string;
  court?: string;
  judge?: string;
  subject?: string;
  parties?: string[];
  filingDate?: Date;
  lastUpdate?: Date;
}

/**
 * Resultado de consulta de processo
 */
export interface ProcessQueryResult {
  status: ProcessQueryStatus;
  processNumber: string;
  error?: string;
  basicInfo?: ProcessBasicInfo;
  movements?: TribunalMovement[];
  confidential?: boolean;
  confidentialMessage?: string;
  consultationTimestamp: Date;
  responseTime: number;
  source: string;
  cached?: boolean;
}

/**
 * Estatísticas de cache
 */
export interface CacheStats {
  hitRate?: number;
  totalQueries?: number;
  successRate?: number;
  cacheSize?: number;
  lastCleanup?: Date;
}

/**
 * Estatísticas do sistema
 */
export interface SystemStats {
  totalProcesses: number;
  totalMovements: number;
  tribunalsActive: number;
  lastUpdate?: Date;
  performance?: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
}

/**
 * Configuração de consulta
 */
export interface QueryOptions {
  useCache?: boolean;
  cacheTimeMinutes?: number;
  enablePersistence?: boolean;
  enableNoveltyDetection?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Resultado de paginação
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

/**
 * Filtros para consulta
 */
export interface MovementFilters {
  dateFrom?: Date;
  dateTo?: Date;
  judicial?: boolean;
  searchText?: string;
  tribunal?: string;
}

/**
 * Métrica de performance
 */
export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: any;
}
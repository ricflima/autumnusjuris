// Serviço frontend para comunicação com API de tribunais
interface TribunalMovement {
  id: string;
  processNumber: string;
  tribunal: string;
  movementDate: string;
  movementCode?: string;
  title: string;
  description: string;
  isJudicial: boolean;
  hash: string;
  source: string;
  discoveredAt: string;
  isNew: boolean;
  metadata?: any;
}

interface QueryResult {
  success: boolean;
  processNumber: string;
  tribunal: string;
  movements: TribunalMovement[];
  totalMovements: number;
  newMovements: number;
  queryDuration: number;
  fromCache: boolean;
  source: string;
  error?: string;
  processInfo?: any;
  message?: string;
}

interface BatchResult {
  success: boolean;
  results: QueryResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalMovements: number;
    tribunals: string[];
  };
  errors: string[];
  persisted: number;
  newMovements: number;
  duplicates: number;
  message: string;
}

class TribunalApiService {
  private static instance: TribunalApiService;
  private baseUrl: string;
  private requestCache = new Map<string, Promise<any>>();
  private cacheTimeout = 5000; // 5 segundos

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://172.25.132.0:3001/api';
    console.log('[TribunalApiService] Inicializado com base URL:', this.baseUrl);
  }

  static getInstance(): TribunalApiService {
    if (!TribunalApiService.instance) {
      TribunalApiService.instance = new TribunalApiService();
    }
    return TribunalApiService.instance;
  }

  /**
   * Cache para evitar requisições duplicadas
   */
  private getCachedRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    if (this.requestCache.has(key)) {
      console.log('[TribunalApiService] Usando cache para:', key);
      return this.requestCache.get(key)!;
    }

    const promise = request().finally(() => {
      // Remove do cache após timeout
      setTimeout(() => {
        this.requestCache.delete(key);
      }, this.cacheTimeout);
    });

    this.requestCache.set(key, promise);
    return promise;
  }

  /**
   * Invalidar cache para processos específicos ou geral
   */
  private invalidateCache(processNumbers?: string[]): void {
    if (processNumbers) {
      // Invalidar cache específico de processos
      processNumbers.forEach(processNumber => {
        const keys = [`getStoredMovements-${processNumber}`];
        keys.forEach(key => this.requestCache.delete(key));
      });
      console.log(`[TribunalApiService] Cache invalidado para ${processNumbers.length} processos`);
    }
    
    // Sempre invalidar cache geral
    const generalKeys = Array.from(this.requestCache.keys()).filter(key => 
      key.startsWith('getAllStoredMovements-')
    );
    generalKeys.forEach(key => this.requestCache.delete(key));
    console.log(`[TribunalApiService] Cache geral invalidado: ${generalKeys.length} entradas`);
  }

  /**
   * Método público para limpar todo o cache
   */
  public clearCache(): void {
    this.requestCache.clear();
    console.log('[TribunalApiService] Todo o cache foi limpo');
  }

  /**
   * Validar número CNJ (validação básica no frontend)
   */
  validateCNJNumber(processNumber: string): {
    isValid: boolean;
    error?: string;
    parsedNumber?: any;
    tribunalInfo?: any;
  } {
    if (!processNumber) {
      return { isValid: false, error: 'Número do processo é obrigatório' };
    }

    // Remover caracteres não numéricos
    const cleanNumber = processNumber.replace(/\D/g, '');
    
    if (cleanNumber.length !== 20) {
      return { isValid: false, error: 'Número CNJ deve ter 20 dígitos' };
    }

    // Validar formato básico CNJ
    const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
    const formatted = `${cleanNumber.substr(0, 7)}-${cleanNumber.substr(7, 2)}.${cleanNumber.substr(9, 4)}.${cleanNumber.substr(13, 1)}.${cleanNumber.substr(14, 2)}.${cleanNumber.substr(16, 4)}`;
    
    if (!cnjRegex.test(formatted)) {
      return { isValid: false, error: 'Formato CNJ inválido' };
    }

    // Extrair informações básicas
    const segmento = cleanNumber.substr(13, 1);
    const tribunal = cleanNumber.substr(14, 2);
    const codigoCompleto = segmento + tribunal;

    const segmentoInfo: Record<string, string> = {
      '1': 'STF',
      '2': 'CNJ',
      '3': 'STJ',
      '4': 'Justiça Federal',
      '5': 'Justiça do Trabalho',
      '6': 'Justiça Eleitoral',
      '7': 'Justiça Militar da União',
      '8': 'Justiça Estadual',
      '9': 'Justiça Militar Estadual'
    };

    return {
      isValid: true,
      parsedNumber: {
        sequencial: cleanNumber.substr(0, 7),
        digitoVerificador: cleanNumber.substr(7, 2),
        ano: cleanNumber.substr(9, 4),
        segmentoJudiciario: segmento,
        tribunal: tribunal,
        origem: cleanNumber.substr(16, 4),
        formatted: formatted
      },
      tribunalInfo: {
        codigo: codigoCompleto,
        segmento: segmentoInfo[segmento] || 'Desconhecido',
        tribunalCodigo: tribunal
      }
    };
  }

  /**
   * Consultar processo individual
   */
  async queryMovements(processNumber: string, config: {
    useCache?: boolean;
    enableNoveltyDetection?: boolean;
    enablePersistence?: boolean;
  } = {}): Promise<QueryResult> {
    console.log(`[TribunalApiService] Consultando processo: ${processNumber}`);

    try {
      const response = await fetch(`${this.baseUrl}/tribunal/movements/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processNumbers: [processNumber]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BatchResult = await response.json();

      if (data.success && data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log(`[TribunalApiService] Resultado: ${result.success ? 'Sucesso' : 'Falha'}`);
        console.log(`[TribunalApiService] Movimentações: ${result.totalMovements}`);
        
        return result;
      } else {
        throw new Error(data.errors?.[0] || 'Erro na consulta');
      }

    } catch (error) {
      console.error('[TribunalApiService] Erro na consulta:', error);
      
      return {
        success: false,
        processNumber,
        tribunal: 'UNKNOWN',
        movements: [],
        totalMovements: 0,
        newMovements: 0,
        queryDuration: 0,
        fromCache: false,
        source: 'api',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Consultar múltiplos processos
   */
  async queryBatch(processNumbers: string[]): Promise<BatchResult> {
    console.log(`[TribunalApiService] Consultando lote de ${processNumbers.length} processos`);

    try {
      const response = await fetch(`${this.baseUrl}/tribunal/movements/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processNumbers
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BatchResult = await response.json();
      console.log(`[TribunalApiService] Lote concluído: ${data.summary?.successful || 0}/${data.summary?.total || 0} sucessos`);
      
      // Invalidar cache após consulta bem-sucedida
      if (data.success && data.persisted > 0) {
        this.invalidateCache(processNumbers);
      }
      
      return data;

    } catch (error) {
      console.error('[TribunalApiService] Erro no lote:', error);
      
      return {
        success: false,
        results: [],
        summary: {
          total: processNumbers.length,
          successful: 0,
          failed: processNumbers.length,
          totalMovements: 0,
          tribunals: []
        },
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        persisted: 0,
        newMovements: 0,
        duplicates: 0,
        message: 'Erro na consulta em lote'
      };
    }
  }

  /**
   * Buscar movimentações já salvas para um processo específico
   */
  async getStoredMovements(processNumber: string): Promise<{
    success: boolean;
    movements: TribunalMovement[];
    processNumber: string;
    error?: string;
  }> {
    console.log(`[TribunalApiService] Buscando movimentações salvas para: ${processNumber}`);

    const cacheKey = `getStoredMovements-${processNumber}`;
    
    return this.getCachedRequest(cacheKey, async () => {
      try {
        const response = await fetch(`${this.baseUrl}/tribunal/movements/${encodeURIComponent(processNumber)}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          movements: data.movements || [],
          processNumber
        };

      } catch (error) {
        console.error('[TribunalApiService] Erro ao buscar movimentações salvas:', error);
        
        return {
          success: false,
          movements: [],
          processNumber,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
    });
  }

  /**
   * Buscar todas as movimentações salvas de processos de um usuário
   */
  async getAllStoredMovements(userId?: string): Promise<{
    success: boolean;
    movements: TribunalMovement[];
    totalCount: number;
    processCount: number;
    error?: string;
  }> {
    console.log(`[TribunalApiService] Buscando todas movimentações salvas${userId ? ` para usuário: ${userId}` : ''}`);

    const cacheKey = `getAllStoredMovements-${userId || 'all'}`;
    
    return this.getCachedRequest(cacheKey, async () => {
      try {
        const url = userId 
          ? `${this.baseUrl}/tribunal/movements/user/${encodeURIComponent(userId)}`
          : `${this.baseUrl}/tribunal/movements/all`;
        
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          movements: data.movements || [],
          totalCount: data.totalCount || 0,
          processCount: data.processCount || 0
        };

      } catch (error) {
        console.error('[TribunalApiService] Erro ao buscar todas movimentações:', error);
        
        return {
          success: false,
          movements: [],
          totalCount: 0,
          processCount: 0,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
    });
  }

  /**
   * Testar conectividade com backend
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: 'Conectado ao backend com sucesso',
          responseTime
        };
      } else {
        return {
          success: false,
          message: `Backend respondeu com erro: ${response.status}`,
          responseTime
        };
      }

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro de conectividade',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Obter estatísticas do sistema
   */
  async getSystemStatistics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/tribunal/statistics`);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('[TribunalApiService] Erro ao obter estatísticas:', error);
      return {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Método de inicialização (compatibilidade com interface anterior)
   */
  async initialize(): Promise<void> {
    // Teste de conectividade básico
    const connectivity = await this.testConnection();
    if (!connectivity.success) {
      throw new Error(`Backend não disponível: ${connectivity.message}`);
    }
    console.log('[TribunalApiService] Inicializado e conectado ao backend');
  }

  /**
   * Obter novidades não lidas (placeholder - implementar conforme necessidade)
   */
  async getUnreadNovelties(): Promise<any[]> {
    // TODO: Implementar endpoint específico para novidades
    return [];
  }

  /**
   * Marcar novidades como lidas (placeholder)
   */
  async markNoveltiesAsRead(noveltyIds: string[]): Promise<void> {
    // TODO: Implementar endpoint específico para marcar novidades
    console.log(`[TribunalApiService] Marcando ${noveltyIds.length} novidades como lidas`);
  }

  /**
   * Executar limpeza do sistema (placeholder)
   */
  async runSystemCleanup(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tribunal/cleanup`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('[TribunalApiService] Limpeza do sistema executada');
    } catch (error) {
      console.error('[TribunalApiService] Erro na limpeza:', error);
      throw error;
    }
  }
}

export default TribunalApiService;
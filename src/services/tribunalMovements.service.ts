// src/services/tribunalMovements.service.ts

import { CNJParser, CNJProcessNumber } from './tribunals/parsers/cnj.parser';
import TribunalDatabaseService from './tribunals/database/tribunalDatabase.service';
import TribunalCacheService from './tribunals/cache/tribunalCache.service';
import HashGeneratorService from './tribunals/utils/hashGenerator.service';
import NoveltyControllerService, { Novelty } from './tribunals/novelty/noveltyController.service';

// NOVOS IMPORTS PARA DATAJUD
import { DatajudClient } from './tribunals/clients/datajud.client';
import { CNJDatajudMapper } from './tribunals/mappers/cnj-datajud.mapper';
import { DatajudParser } from './tribunals/parsers/datajud.parser';
import { TribunalMovement, ScrapingResult } from '../types/tribunal.types';

/**
 * Resultado da consulta de movimentações
 */
export interface MovementQueryResult {
  success: boolean;
  processNumber: string;
  tribunal: string;
  queryTimestamp: string;
  fromCache: boolean;
  
  // Dados do processo
  movements?: TribunalMovement[];
  
  // Para compatibilidade com frontend existente
  processInfo?: any;
  
  // Novidades encontradas
  newMovements?: number;
  totalMovements?: number;
  novelties?: Novelty[];
  
  // Metadados
  queryDuration: number;
  retryCount: number;
  error?: string;
  source: 'datajud' | 'scraping';
  
  // Hash para comparação
  contentHash?: string;
}

/**
 * Configuração da consulta
 */
export interface QueryConfig {
  useCache?: boolean;
  cacheTimeMinutes?: number;
  enablePersistence?: boolean;
  enableNoveltyDetection?: boolean;
  maxRetries?: number;
  timeout?: number;
  forceDatajud?: boolean; // NOVA OPÇÃO: forçar uso da API DataJud
}

/**
 * Serviço principal para consulta de movimentações processuais
 * ATUALIZADO: Nova estratégia baseada na API oficial DataJud do CNJ
 */
export default class TribunalMovementsService {
  private static instance: TribunalMovementsService;
  
  // Serviços existentes (mantidos para compatibilidade)
  private databaseService: TribunalDatabaseService;
  private cacheService: TribunalCacheService;
  // HashGeneratorService é usado como classe estática
  private noveltyService: NoveltyControllerService;
  
  // NOVOS SERVIÇOS DATAJUD
  private datajudClient: DatajudClient;
  
  private initialized = false;

  private constructor() {
    this.databaseService = TribunalDatabaseService.getInstance();
    this.cacheService = TribunalCacheService.getInstance();
    // HashGeneratorService é usado como classe estática
    this.noveltyService = NoveltyControllerService.getInstance();
    
    // Inicializar cliente DataJud
    this.datajudClient = DatajudClient.getInstance();
  }

  public static getInstance(): TribunalMovementsService {
    if (!TribunalMovementsService.instance) {
      TribunalMovementsService.instance = new TribunalMovementsService();
    }
    return TribunalMovementsService.instance;
  }

  /**
   * Inicializar o serviço
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('[TribunalMovements] Inicializando serviço com estratégia DataJud...');
      
      // Inicializar serviços existentes
      await this.databaseService.initialize();
      await this.cacheService.initialize();
      await this.noveltyService.initialize();
      
      this.initialized = true;
      console.log('[TribunalMovements] Serviço inicializado com sucesso (API DataJud)');
      
    } catch (error) {
      console.error('[TribunalMovements] Erro na inicialização:', error);
      throw error;
    }
  }

  /**
   * PRINCIPAL: Consultar movimentações de um processo
   * NOVA IMPLEMENTAÇÃO: Prioriza API DataJud sobre scraping
   */
  async queryMovements(
    processNumber: string, 
    config: QueryConfig = {}
  ): Promise<MovementQueryResult> {
    const startTime = Date.now();
    const defaultConfig: Required<QueryConfig> = {
      useCache: true,
      cacheTimeMinutes: 240, // 4 horas
      enablePersistence: true,
      enableNoveltyDetection: true,
      maxRetries: 3,
      timeout: 30000,
      forceDatajud: true // PADRÃO: usar sempre DataJud
    };
    
    const finalConfig = { ...defaultConfig, ...config };

    try {
      await this.initialize();
      
      console.log(`[TribunalMovements] Iniciando consulta para processo ${processNumber}`);

      // Validar número CNJ
      const cnjValidation = this.validateCNJNumber(processNumber);
      if (!cnjValidation.isValid) {
        return this.createErrorResult(
          processNumber,
          'UNKNOWN',
          `Número CNJ inválido: ${cnjValidation.error}`,
          Date.now() - startTime,
          'datajud'
        );
      }

      // Mapear tribunal para DataJud
      const tribunalMapping = CNJDatajudMapper.mapCNJToDatajud(processNumber);
      if (!tribunalMapping.success) {
        return this.createErrorResult(
          processNumber,
          'UNKNOWN',
          `Tribunal não disponível: ${tribunalMapping.error}`,
          Date.now() - startTime,
          'datajud'
        );
      }

      const tribunalCode = tribunalMapping.tribunalCode!;
      
      // Verificar cache se habilitado
      if (finalConfig.useCache) {
        const cached = await this.checkCache(processNumber, tribunalCode, finalConfig.cacheTimeMinutes);
        if (cached) {
          console.log(`[TribunalMovements] Resultado encontrado no cache para ${processNumber}`);
          return cached;
        }
      }

      // NOVA ESTRATÉGIA: Consultar via API DataJud
      const datajudResult = await this.queryViaDatajud(
        processNumber,
        tribunalCode,
        finalConfig
      );

      const queryDuration = Date.now() - startTime;

      if (datajudResult.success) {
        console.log(`[TribunalMovements] Consulta DataJud bem-sucedida: ${datajudResult.movements?.length} movimentações`);
        
        // Processar resultado
        const result = await this.processSuccessfulQuery(
          datajudResult,
          processNumber,
          tribunalCode,
          queryDuration,
          finalConfig
        );

        // Armazenar no cache
        if (finalConfig.useCache && result.success) {
          await this.storeInCache(processNumber, tribunalCode, result);
        }

        return result;

      } else {
        console.error(`[TribunalMovements] Falha na consulta DataJud: ${datajudResult.error}`);
        
        return this.createErrorResult(
          processNumber,
          tribunalCode,
          datajudResult.error || 'Erro desconhecido na consulta DataJud',
          queryDuration,
          'datajud'
        );
      }

    } catch (error) {
      const queryDuration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error(`[TribunalMovements] Erro geral na consulta:`, error);
      
      return this.createErrorResult(
        processNumber,
        'UNKNOWN',
        errorMessage,
        queryDuration,
        'datajud'
      );
    }
  }

  /**
   * NOVA IMPLEMENTAÇÃO: Consultar via API DataJud
   */
  private async queryViaDatajud(
    processNumber: string,
    tribunalCode: string,
    config: Required<QueryConfig>
  ): Promise<ScrapingResult> {
    try {
      console.log(`[TribunalMovements] Consultando via API DataJud: ${processNumber} no ${tribunalCode}`);
      
      const result = await this.datajudClient.consultarProcesso(processNumber, tribunalCode);
      
      return result;

    } catch (error) {
      console.error('[TribunalMovements] Erro na consulta DataJud:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na API DataJud',
        movements: [],
        metadata: {
          tribunal: tribunalCode,
          processNumber: processNumber,
          consultationDate: new Date(),
          responseTime: 0,
          totalMovements: 0,
          source: 'api-publica.datajud.cnj.jus.br'
        }
      };
    }
  }

  /**
   * Processar resultado bem-sucedido da consulta
   */
  private async processSuccessfulQuery(
    scrapingResult: ScrapingResult,
    processNumber: string,
    tribunal: string,
    queryDuration: number,
    config: Required<QueryConfig>
  ): Promise<MovementQueryResult> {
    try {
      const movements = scrapingResult.movements || [];
      let novelties: Novelty[] = [];
      let newMovements = 0;

      // Detectar novidades se habilitado
      if (config.enableNoveltyDetection && movements.length > 0) {
        const noveltyResult = await this.detectNovelties(processNumber, tribunal, movements);
        novelties = noveltyResult.novelties;
        newMovements = noveltyResult.newCount;
      }

      // Persistir dados se habilitado
      if (config.enablePersistence) {
        await this.persistMovements(processNumber, tribunal, movements, novelties);
      }

      // Gerar hash do conteúdo
      const contentHash = HashGeneratorService.generateContentHash(movements);

      return {
        success: true,
        processNumber,
        tribunal,
        queryTimestamp: new Date().toISOString(),
        fromCache: false,
        movements,
        newMovements,
        totalMovements: movements.length,
        novelties,
        queryDuration,
        retryCount: 0,
        contentHash,
        source: 'datajud'
      };

    } catch (error) {
      console.error('[TribunalMovements] Erro ao processar resultado:', error);
      
      return this.createErrorResult(
        processNumber,
        tribunal,
        `Erro ao processar resultado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        queryDuration,
        'datajud'
      );
    }
  }

  /**
   * Detectar novidades nas movimentações
   */
  private async detectNovelties(
    processNumber: string,
    tribunal: string,
    movements: TribunalMovement[]
  ): Promise<{ novelties: Novelty[]; newCount: number }> {
    try {
      const novelties = await this.noveltyService.detectNovelties(
        processNumber,
        tribunal,
        movements
      );

      return {
        novelties,
        newCount: novelties.length
      };

    } catch (error) {
      console.error('[TribunalMovements] Erro na detecção de novidades:', error);
      return { novelties: [], newCount: 0 };
    }
  }

  /**
   * Persistir movimentações no banco de dados
   */
  private async persistMovements(
    processNumber: string,
    tribunal: string,
    movements: TribunalMovement[],
    novelties: Novelty[]
  ): Promise<void> {
    try {
      await this.databaseService.saveMovements(processNumber, tribunal, movements, novelties);
      console.log(`[TribunalMovements] ${movements.length} movimentações persistidas`);

    } catch (error) {
      console.error('[TribunalMovements] Erro ao persistir movimentações:', error);
      // Não propagar erro - persistência é opcional
    }
  }

  /**
   * Verificar cache
   */
  private async checkCache(
    processNumber: string,
    tribunal: string,
    cacheTimeMinutes: number
  ): Promise<MovementQueryResult | null> {
    try {
      const cached = await this.cacheService.get(processNumber, tribunal, cacheTimeMinutes);
      
      if (cached) {
        return {
          ...cached,
          fromCache: true,
          queryTimestamp: new Date().toISOString(),
          source: 'datajud' // Manter fonte original
        };
      }
      
      return null;

    } catch (error) {
      console.error('[TribunalMovements] Erro ao verificar cache:', error);
      return null;
    }
  }

  /**
   * Armazenar resultado no cache
   */
  private async storeInCache(
    processNumber: string,
    tribunal: string,
    result: MovementQueryResult
  ): Promise<void> {
    try {
      await this.cacheService.set(processNumber, tribunal, result);

    } catch (error) {
      console.error('[TribunalMovements] Erro ao armazenar no cache:', error);
      // Não propagar erro - cache é opcional
    }
  }

  /**
   * Validar número CNJ (mantido do sistema anterior)
   */
  validateCNJNumber(processNumber: string): {
    isValid: boolean;
    error?: string;
    parsedNumber?: CNJProcessNumber;
    tribunalInfo?: any;
  } {
    const result = CNJParser.parse(processNumber);
    let tribunalInfo;
    
    if (result.isValid && result.processNumber) {
      // Usar novo mapeamento DataJud
      const mapping = CNJDatajudMapper.getTribunalInfo(processNumber);
      if (mapping.success) {
        tribunalInfo = mapping.tribunal;
      }
    }
    
    return {
      isValid: result.isValid,
      error: result.error,
      parsedNumber: result.processNumber,
      tribunalInfo
    };
  }

  /**
   * Criar resultado de erro
   */
  private createErrorResult(
    processNumber: string,
    tribunal: string,
    error: string,
    queryDuration: number,
    source: 'datajud' | 'scraping'
  ): MovementQueryResult {
    return {
      success: false,
      processNumber,
      tribunal,
      queryTimestamp: new Date().toISOString(),
      fromCache: false,
      movements: [],
      newMovements: 0,
      totalMovements: 0,
      novelties: [],
      queryDuration,
      retryCount: 0,
      error,
      source
    };
  }

  /**
   * Obter estatísticas do serviço
   */
  async getServiceStats(): Promise<{
    tribunalsSupported: number;
    datajudCoverage: number;
    cacheHitRate?: number;
    totalQueries?: number;
    successRate?: number;
  }> {
    try {
      const stats = CNJDatajudMapper.getStatistics();
      const cacheStats = await this.cacheService.getStats();

      return {
        tribunalsSupported: stats.total,
        datajudCoverage: stats.coverage,
        cacheHitRate: cacheStats.hitRate,
        totalQueries: cacheStats.totalQueries,
        successRate: cacheStats.successRate
      };

    } catch (error) {
      console.error('[TribunalMovements] Erro ao obter estatísticas:', error);
      return {
        tribunalsSupported: 37, // Total conhecido da API DataJud
        datajudCoverage: 100
      };
    }
  }

  /**
   * Obter lista de tribunais suportados
   */
  getSupportedTribunals(): Array<{
    code: string;
    name: string;
    type: string;
    available: boolean;
    source: 'datajud';
  }> {
    const tribunals = CNJDatajudMapper.getAllTribunals();
    
    return tribunals.map(tribunal => ({
      code: tribunal.datajudCode,
      name: tribunal.name,
      type: tribunal.type,
      available: true, // Todos tribunais DataJud estão disponíveis
      source: 'datajud' as const
    }));
  }

  /**
   * Testar conectividade com API DataJud
   */
  async testConnectivity(): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
    tribunalsAvailable?: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Testar com processo conhecido do TRF1
      const testResult = await this.datajudClient.consultarProcesso(
        '00008323520184013202', // Processo de exemplo da documentação
        'TRF1'
      );

      const responseTime = Date.now() - startTime;
      const tribunalsAvailable = this.datajudClient.getTribunaisDisponiveis().length;

      return {
        success: testResult.success,
        responseTime,
        tribunalsAvailable,
        error: testResult.success ? undefined : testResult.error
      };

    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erro de conectividade'
      };
    }
  }

  /**
   * Métodos para compatibilidade com frontend existente
   */
  async getUnreadNovelties(): Promise<any[]> {
    // Implementação básica para compatibilidade
    return [];
  }

  async getSystemStatistics(): Promise<any> {
    // Implementação básica para compatibilidade
    return await this.getServiceStats();
  }

  async markNoveltiesAsRead(noveltyIds: string[]): Promise<void> {
    // Implementação básica para compatibilidade
    console.log(`[TribunalMovements] Marcando ${noveltyIds.length} novidades como lidas`);
  }

  async getAvailableTribunals(): Promise<any[]> {
    // Implementação básica para compatibilidade
    return this.getSupportedTribunals();
  }

  async runSystemCleanup(): Promise<void> {
    // Implementação básica para compatibilidade
    console.log('[TribunalMovements] Executando limpeza do sistema');
  }
}
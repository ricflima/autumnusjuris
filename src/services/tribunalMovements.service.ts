// src/services/tribunalMovements.service.ts

import { CNJParser, CNJProcessNumber } from './tribunals/parsers/cnj.parser';
import TribunalIdentifierService, { TribunalConfig } from './tribunals/tribunalIdentifier.service';
import BaseScraper, { ProcessQueryResult } from './tribunals/scrapers/baseScraper';
import TribunalDatabaseService from './tribunals/database/tribunalDatabase.service';
import TribunalCacheService from './tribunals/cache/tribunalCache.service';
import HashGeneratorService from './tribunals/utils/hashGenerator.service';
import NoveltyControllerService, { Novelty } from './tribunals/novelty/noveltyController.service';

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
  processInfo?: ProcessQueryResult;
  
  // Novidades encontradas
  newMovements?: number;
  totalMovements?: number;
  novelties?: Novelty[];
  
  // Metadados
  queryDuration: number;
  retryCount: number;
  error?: string;
  
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
}

/**
 * Service principal para consulta de movimentações processuais
 * Orquestra todos os componentes da Fase 0
 */
export class TribunalMovementsService {
  
  private static instance: TribunalMovementsService;
  private cacheService: TribunalCacheService;
  private noveltyService: NoveltyControllerService;
  private isInitialized = false;
  
  private constructor() {
    this.cacheService = TribunalCacheService.getInstance();
    this.noveltyService = NoveltyControllerService.getInstance();
  }
  
  /**
   * Singleton instance
   */
  static getInstance(): TribunalMovementsService {
    if (!TribunalMovementsService.instance) {
      TribunalMovementsService.instance = new TribunalMovementsService();
    }
    return TribunalMovementsService.instance;
  }
  
  /**
   * Inicializa o service e seus componentes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 Inicializando TribunalMovementsService...');
    
    try {
      // Inicializar identificador de tribunais
      await TribunalIdentifierService.initialize();
      console.log('✅ Identificador de tribunais inicializado');
      
      this.isInitialized = true;
      console.log('✅ TribunalMovementsService inicializado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar TribunalMovementsService:', error);
      throw error;
    }
  }
  
  /**
   * Consulta movimentações de um processo
   */
  async queryMovements(
    processNumber: string,
    config?: QueryConfig
  ): Promise<MovementQueryResult> {
    const startTime = Date.now();
    
    // Validar inicialização
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const finalConfig = {
      useCache: true,
      cacheTimeMinutes: 60,
      enablePersistence: true,
      enableNoveltyDetection: true,
      maxRetries: 3,
      timeout: 30000,
      ...config
    };
    
    try {
      console.log(`🔍 Consultando processo: ${processNumber}`);
      
      // 1. Parse do número CNJ
      const parseResult = CNJParser.parse(processNumber);
      if (!parseResult.isValid || !parseResult.processNumber) {
        return {
          success: false,
          processNumber,
          tribunal: 'Desconhecido',
          queryTimestamp: new Date().toISOString(),
          fromCache: false,
          queryDuration: Date.now() - startTime,
          retryCount: 0,
          error: parseResult.error || 'Número do processo inválido'
        };
      }
      
      const cnj = parseResult.processNumber;
      console.log(`✅ CNJ parseado: ${cnj.tribunalName}`);
      
      // 2. Identificar tribunal
      const identificationResult = await TribunalIdentifierService.identifyTribunal(processNumber);
      if (!identificationResult.success || !identificationResult.tribunal) {
        return {
          success: false,
          processNumber: cnj.formattedNumber,
          tribunal: cnj.tribunalName,
          queryTimestamp: new Date().toISOString(),
          fromCache: false,
          queryDuration: Date.now() - startTime,
          retryCount: 0,
          error: identificationResult.error || 'Tribunal não identificado'
        };
      }
      
      const tribunal = identificationResult.tribunal;
      console.log(`✅ Tribunal identificado: ${tribunal.name}`);
      
      // 3. Verificar cache se habilitado
      let cachedResult: ProcessQueryResult | null = null;
      if (finalConfig.useCache) {
        cachedResult = await this.cacheService.get(cnj.formattedNumber, tribunal.code);
        if (cachedResult) {
          console.log('💾 Resultado encontrado no cache');
          
          // Processar novidades mesmo com cache
          const novelties = await this.processNovelties(
            cnj,
            tribunal,
            cachedResult,
            finalConfig
          );
          
          return {
            success: true,
            processNumber: cnj.formattedNumber,
            tribunal: tribunal.name,
            queryTimestamp: new Date().toISOString(),
            fromCache: true,
            processInfo: cachedResult,
            newMovements: novelties.newMovements,
            totalMovements: novelties.totalMovements,
            novelties: novelties.novelties,
            queryDuration: Date.now() - startTime,
            retryCount: 0,
            contentHash: cachedResult.contentHash
          };
        }
      }
      
      // 4. Fazer consulta real no tribunal
      const queryResult = await this.performRealQuery(cnj, tribunal, finalConfig);
      
      if (queryResult.status !== 'success') {
        return {
          success: false,
          processNumber: cnj.formattedNumber,
          tribunal: tribunal.name,
          queryTimestamp: new Date().toISOString(),
          fromCache: false,
          queryDuration: Date.now() - startTime,
          retryCount: queryResult.retryCount,
          error: queryResult.error
        };
      }
      
      console.log(`✅ Consulta realizada com sucesso: ${queryResult.movements?.length || 0} movimentações`);
      
      // 5. Atualizar cache
      if (finalConfig.useCache && queryResult) {
        await this.cacheService.set(
          cnj.formattedNumber,
          tribunal.code,
          queryResult,
          finalConfig.cacheTimeMinutes
        );
      }
      
      // 6. Processar persistência e novidades
      const novelties = await this.processNovelties(
        cnj,
        tribunal,
        queryResult,
        finalConfig
      );
      
      // 7. Log da consulta
      await TribunalDatabaseService.logQuery(
        cnj.formattedNumber,
        tribunal.code,
        queryResult.status,
        Date.now() - startTime,
        queryResult.error,
        false,
        queryResult.retryCount
      );
      
      return {
        success: true,
        processNumber: cnj.formattedNumber,
        tribunal: tribunal.name,
        queryTimestamp: new Date().toISOString(),
        fromCache: false,
        processInfo: queryResult,
        newMovements: novelties.newMovements,
        totalMovements: novelties.totalMovements,
        novelties: novelties.novelties,
        queryDuration: Date.now() - startTime,
        retryCount: queryResult.retryCount,
        contentHash: queryResult.contentHash
      };
      
    } catch (error) {
      console.error('❌ Erro na consulta:', error);
      
      return {
        success: false,
        processNumber,
        tribunal: 'Desconhecido',
        queryTimestamp: new Date().toISOString(),
        fromCache: false,
        queryDuration: Date.now() - startTime,
        retryCount: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Obtém novidades não lidas
   */
  async getUnreadNovelties(limit: number = 20): Promise<Novelty[]> {
    return await this.noveltyService.getUnreadNovelties(limit);
  }
  
  /**
   * Marca novidades como lidas
   */
  async markNoveltiesAsRead(noveltyIds: string[]): Promise<void> {
    return await this.noveltyService.markAsRead(noveltyIds);
  }
  
  /**
   * Obtém estatísticas do sistema
   */
  async getSystemStatistics(): Promise<{
    tribunals: any;
    cache: any;
    novelties: any;
  }> {
    const [tribunalStats, cacheStats, noveltyStats] = await Promise.all([
      TribunalDatabaseService.getTribunalStatistics(),
      this.cacheService.getStats(),
      this.noveltyService.getStatistics()
    ]);
    
    return {
      tribunals: tribunalStats,
      cache: cacheStats,
      novelties: noveltyStats
    };
  }
  
  /**
   * Lista tribunais disponíveis
   */
  async getAvailableTribunals(): Promise<TribunalConfig[]> {
    return TribunalIdentifierService.getAllTribunals();
  }
  
  /**
   * Valida número CNJ
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
      const tribunalCode = result.processNumber.judiciarySegment + result.processNumber.tribunalCode;
      tribunalInfo = TribunalIdentifierService.identifyTribunal(tribunalCode);
    }
    
    return {
      isValid: result.isValid,
      error: result.error,
      parsedNumber: result.processNumber,
      tribunalInfo
    };
  }
  
  /**
   * Executa limpeza automática do sistema
   */
  async runSystemCleanup(): Promise<{
    cache: any;
    novelties: any;
  }> {
    const [cacheCleanup, noveltiesCleanup] = await Promise.all([
      this.cacheService.cleanup(),
      this.noveltyService.removeExpiredNovelties()
    ]);
    
    return {
      cache: cacheCleanup,
      novelties: noveltiesCleanup
    };
  }
  
  /**
   * Realiza consulta real no tribunal
   */
  private async performRealQuery(
    cnj: CNJProcessNumber,
    tribunal: TribunalConfig,
    config: QueryConfig
  ): Promise<ProcessQueryResult> {
    // Por enquanto, retorna um resultado simulado
    // Na Fase 1-6, implementaremos os scrapers específicos
    
    console.log(`🌐 Simulando consulta ao ${tribunal.name}...`);
    
    // Simular tempo de resposta
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Gerar resultado simulado baseado no tribunal
    const mockResult: ProcessQueryResult = {
      status: 'success',
      processNumber: cnj.formattedNumber,
      queryTimestamp: new Date().toISOString(),
      queryDuration: 1500,
      tribunal: tribunal.name,
      retryCount: 0,
      fromCache: false,
      
      basicInfo: {
        number: cnj.formattedNumber,
        court: tribunal.name,
        subject: 'Assunto simulado para desenvolvimento',
        parties: {
          plaintiffs: ['Requerente Simulado'],
          defendants: ['Requerido Simulado'],
          lawyers: ['Dr. Advogado Simulado']
        },
        status: 'Em andamento',
        distributionDate: '2024-01-15',
        lastUpdate: new Date().toISOString().split('T')[0]
      },
      
      movements: [
        {
          id: 'mov_001',
          date: new Date().toISOString(),
          title: 'Juntada de Petição',
          description: 'Petição inicial protocolada pelo requerente',
          type: 'peticao',
          isPublic: true,
          author: 'Dr. Advogado Simulado'
        },
        {
          id: 'mov_002',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          title: 'Despacho do Juiz',
          description: 'Determina citação do requerido',
          type: 'despacho',
          isPublic: true,
          author: 'Juiz Responsável'
        }
      ]
    };
    
    // Gerar hash do conteúdo
    const contentHash = HashGeneratorService.generateQueryResultHash(mockResult);
    mockResult.contentHash = contentHash.hash;
    
    return mockResult;
  }
  
  /**
   * Processa persistência e detecção de novidades
   */
  private async processNovelties(
    cnj: CNJProcessNumber,
    tribunal: TribunalConfig,
    queryResult: ProcessQueryResult,
    config: QueryConfig
  ): Promise<{
    newMovements: number;
    totalMovements: number;
    novelties: Novelty[];
  }> {
    if (!config.enablePersistence || !config.enableNoveltyDetection || !queryResult.movements) {
      return {
        newMovements: 0,
        totalMovements: queryResult.movements?.length || 0,
        novelties: []
      };
    }
    
    try {
      // 1. Buscar ou criar processo monitorado
      let monitoredProcess = await TribunalDatabaseService.getMonitoredProcess(cnj.formattedNumber);
      
      if (!monitoredProcess) {
        monitoredProcess = await TribunalDatabaseService.addMonitoredProcess(cnj, tribunal.code);
        console.log(`📋 Processo adicionado ao monitoramento: ${cnj.formattedNumber}`);
      }
      
      // 2. Persistir movimentações
      const persistResult = await TribunalDatabaseService.persistMovements(
        monitoredProcess.id,
        queryResult.movements,
        tribunal.code
      );
      
      console.log(`💾 Movimentações persistidas: ${persistResult.persisted} (${persistResult.newMovements} novas)`);
      
      // 3. Processar novidades
      let novelties: Novelty[] = [];
      if (persistResult.newMovements > 0) {
        const noveltiesResult = await this.noveltyService.processMovements(
          monitoredProcess.id,
          queryResult.movements,
          cnj.formattedNumber,
          tribunal.name
        );
        
        novelties = noveltiesResult.noveltiesCreated;
        console.log(`🆕 Novidades criadas: ${noveltiesResult.newNoveltiesCount}`);
      }
      
      // 4. Atualizar informações básicas do processo
      if (queryResult.basicInfo && queryResult.contentHash) {
        await TribunalDatabaseService.updateProcessBasicInfo(
          monitoredProcess.id,
          queryResult.basicInfo,
          queryResult.contentHash
        );
      }
      
      return {
        newMovements: persistResult.newMovements,
        totalMovements: queryResult.movements.length,
        novelties
      };
      
    } catch (error) {
      console.error('❌ Erro ao processar novidades:', error);
      return {
        newMovements: 0,
        totalMovements: queryResult.movements?.length || 0,
        novelties: []
      };
    }
  }
}

export default TribunalMovementsService;
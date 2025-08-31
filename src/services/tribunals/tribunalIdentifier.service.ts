// src/services/tribunals/tribunalIdentifier.service.ts

import { CNJParser, CNJProcessNumber } from './parsers/cnj.parser';

/**
 * Configuração de um tribunal para consulta
 */
export interface TribunalConfig {
  code: string;
  name: string;
  segment: string;
  segmentName: string;
  region?: string;
  baseUrl: string;
  queryPath: string;
  isActive: boolean;
  scraperClass: string;
  priority: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  metadata?: {
    supportedFormats?: string[];
    requiresLogin?: boolean;
    hasAntiBot?: boolean;
    difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  };
}

/**
 * Resultado da identificação do tribunal
 */
export interface TribunalIdentificationResult {
  success: boolean;
  tribunal?: TribunalConfig;
  processNumber?: CNJProcessNumber;
  error?: string;
  suggestions?: TribunalConfig[];
}

/**
 * Service responsável por identificar qual tribunal consultar baseado no número CNJ
 */
export class TribunalIdentifierService {
  
  private static tribunalConfigs: Map<string, TribunalConfig> = new Map();
  
  /**
   * Inicializa as configurações dos tribunais
   */
  static async initialize(): Promise<void> {
    // Carregar configurações dos tribunais
    await this.loadTribunalConfigurations();
  }
  
  /**
   * Identifica qual tribunal consultar baseado no número do processo
   */
  static async identifyTribunal(processNumber: string): Promise<TribunalIdentificationResult> {
    try {
      // Parse do número CNJ
      const parseResult = CNJParser.parse(processNumber);
      
      if (!parseResult.isValid || !parseResult.processNumber) {
        return {
          success: false,
          error: parseResult.error || 'Número do processo inválido'
        };
      }
      
      const cnj = parseResult.processNumber;
      
      // Gerar chave do tribunal (segmento + código)
      const tribunalKey = cnj.judiciarySegment + cnj.tribunalCode;
      
      // Buscar configuração do tribunal
      const tribunalConfig = this.tribunalConfigs.get(tribunalKey);
      
      if (!tribunalConfig) {
        // Buscar tribunais similares como sugestões
        const suggestions = this.findSimilarTribunals(cnj);
        
        return {
          success: false,
          error: `Tribunal não configurado: ${cnj.tribunalName}`,
          processNumber: cnj,
          suggestions
        };
      }
      
      // Verificar se o tribunal está ativo
      if (!tribunalConfig.isActive) {
        return {
          success: false,
          error: `Tribunal temporariamente indisponível: ${tribunalConfig.name}`,
          processNumber: cnj,
          tribunal: tribunalConfig
        };
      }
      
      return {
        success: true,
        tribunal: tribunalConfig,
        processNumber: cnj
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Erro na identificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
  
  /**
   * Lista todos os tribunais configurados
   */
  static getAllTribunals(): TribunalConfig[] {
    return Array.from(this.tribunalConfigs.values())
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Lista tribunais ativos por segmento
   */
  static getTribunalsBySegment(segment: string): TribunalConfig[] {
    return Array.from(this.tribunalConfigs.values())
      .filter(t => t.segment === segment && t.isActive)
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Busca tribunal por código específico
   */
  static getTribunalByCode(code: string): TribunalConfig | null {
    return this.tribunalConfigs.get(code) || null;
  }
  
  /**
   * Verifica se um tribunal está ativo e disponível
   */
  static isTribunalActive(code: string): boolean {
    const tribunal = this.getTribunalByCode(code);
    return tribunal?.isActive || false;
  }
  
  /**
   * Atualiza configuração de um tribunal
   */
  static updateTribunalConfig(code: string, updates: Partial<TribunalConfig>): boolean {
    const tribunal = this.tribunalConfigs.get(code);
    if (!tribunal) return false;
    
    const updatedTribunal = { ...tribunal, ...updates };
    this.tribunalConfigs.set(code, updatedTribunal);
    return true;
  }
  
  /**
   * Busca tribunais similares para sugestões
   */
  private static findSimilarTribunals(cnj: CNJProcessNumber): TribunalConfig[] {
    return Array.from(this.tribunalConfigs.values())
      .filter(t => t.segment === cnj.judiciarySegment)
      .slice(0, 3);
  }
  
  /**
   * Carrega configurações dos tribunais do sistema
   */
  private static async loadTribunalConfigurations(): Promise<void> {
    // Configurações dos Tribunais de Justiça Estadual (Segmento 8)
    const tjConfigs: TribunalConfig[] = [
      {
        code: '825',
        name: 'Tribunal de Justiça de São Paulo',
        segment: '8',
        segmentName: 'Justiça Estadual',
        baseUrl: 'https://esaj.tjsp.jus.br',
        queryPath: '/cpopg/search.do',
        isActive: true,
        scraperClass: 'TJSPScraper',
        priority: 1,
        rateLimit: {
          requestsPerMinute: 10,
          requestsPerHour: 100
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        metadata: {
          supportedFormats: ['html', 'pdf'],
          requiresLogin: false,
          hasAntiBot: true,
          difficulty: 'DIFICIL'
        }
      },
      {
        code: '819',
        name: 'Tribunal de Justiça do Rio de Janeiro',
        segment: '8',
        segmentName: 'Justiça Estadual',
        baseUrl: 'http://www4.tjrj.jus.br',
        queryPath: '/consultaProcessoWebV2/consultaMov.do',
        isActive: true,
        scraperClass: 'TJRJScraper',
        priority: 2,
        rateLimit: {
          requestsPerMinute: 15,
          requestsPerHour: 150
        },
        metadata: {
          difficulty: 'MEDIO'
        }
      },
      {
        code: '813',
        name: 'Tribunal de Justiça de Minas Gerais',
        segment: '8',
        segmentName: 'Justiça Estadual',
        baseUrl: 'https://pje.tjmg.jus.br',
        queryPath: '/pje/ConsultaPublica/listView.seam',
        isActive: true,
        scraperClass: 'TJMGScraper',
        priority: 3,
        rateLimit: {
          requestsPerMinute: 12,
          requestsPerHour: 120
        },
        metadata: {
          difficulty: 'MEDIO'
        }
      },
      {
        code: '821',
        name: 'Tribunal de Justiça do Rio Grande do Sul',
        segment: '8',
        segmentName: 'Justiça Estadual',
        baseUrl: 'https://www.tjrs.jus.br',
        queryPath: '/site_php/consulta/human_check/humancheck_showcode.php',
        isActive: true,
        scraperClass: 'TJRSScraper',
        priority: 4,
        rateLimit: {
          requestsPerMinute: 8,
          requestsPerHour: 80
        },
        metadata: {
          hasAntiBot: true,
          difficulty: 'DIFICIL'
        }
      },
      {
        code: '816',
        name: 'Tribunal de Justiça do Paraná',
        segment: '8',
        segmentName: 'Justiça Estadual',
        baseUrl: 'https://portal.tjpr.jus.br',
        queryPath: '/consulta-publica',
        isActive: true,
        scraperClass: 'TJPRScraper',
        priority: 5,
        rateLimit: {
          requestsPerMinute: 10,
          requestsPerHour: 100
        },
        metadata: {
          difficulty: 'MEDIO'
        }
      }
    ];
    
    // Configurações dos Tribunais Regionais do Trabalho (Segmento 5)
    const trtConfigs: TribunalConfig[] = [
      {
        code: '502',
        name: 'Tribunal Regional do Trabalho da 2ª Região',
        segment: '5',
        segmentName: 'Justiça do Trabalho',
        region: '2ª Região',
        baseUrl: 'https://pje.trt2.jus.br',
        queryPath: '/consultaprocessual/detalhe-processo/',
        isActive: true,
        scraperClass: 'TRT2Scraper',
        priority: 10,
        rateLimit: {
          requestsPerMinute: 15,
          requestsPerHour: 150
        },
        metadata: {
          difficulty: 'MEDIO'
        }
      },
      {
        code: '515',
        name: 'Tribunal Regional do Trabalho da 15ª Região',
        segment: '5',
        segmentName: 'Justiça do Trabalho',
        region: '15ª Região',
        baseUrl: 'https://pje.trt15.jus.br',
        queryPath: '/consultaprocessual/',
        isActive: true,
        scraperClass: 'TRT15Scraper',
        priority: 11,
        rateLimit: {
          requestsPerMinute: 12,
          requestsPerHour: 120
        },
        metadata: {
          difficulty: 'FACIL'
        }
      }
    ];
    
    // Configurações dos Tribunais Regionais Federais (Segmento 4)
    const trfConfigs: TribunalConfig[] = [
      {
        code: '403',
        name: 'Tribunal Regional Federal da 3ª Região',
        segment: '4',
        segmentName: 'Justiça Federal',
        region: '3ª Região',
        baseUrl: 'https://consultaprocessual.trf3.jus.br',
        queryPath: '/consultaProcessual/consulta.php',
        isActive: true,
        scraperClass: 'TRF3Scraper',
        priority: 20,
        rateLimit: {
          requestsPerMinute: 10,
          requestsPerHour: 100
        },
        metadata: {
          difficulty: 'MEDIO'
        }
      }
    ];
    
    // Configurações dos Tribunais Superiores
    const superiorConfigs: TribunalConfig[] = [
      {
        code: '301',
        name: 'Superior Tribunal de Justiça',
        segment: '3',
        segmentName: 'Superior Tribunal de Justiça',
        baseUrl: 'https://processo.stj.jus.br',
        queryPath: '/repetitivos/temas_repetitivos/pesquisar.php',
        isActive: true,
        scraperClass: 'STJScraper',
        priority: 30,
        rateLimit: {
          requestsPerMinute: 5,
          requestsPerHour: 50
        },
        metadata: {
          difficulty: 'DIFICIL'
        }
      },
      {
        code: '590',
        name: 'Tribunal Superior do Trabalho',
        segment: '5',
        segmentName: 'Justiça do Trabalho',
        baseUrl: 'https://consultaunificada.tst.jus.br',
        queryPath: '/consultaunificada/consulta.do',
        isActive: true,
        scraperClass: 'TSTScraper',
        priority: 31,
        rateLimit: {
          requestsPerMinute: 8,
          requestsPerHour: 80
        },
        metadata: {
          difficulty: 'DIFICIL'
        }
      }
    ];
    
    // Registrar todas as configurações
    const allConfigs = [
      ...tjConfigs,
      ...trtConfigs,
      ...trfConfigs,
      ...superiorConfigs
    ];
    
    allConfigs.forEach(config => {
      this.tribunalConfigs.set(config.code, config);
    });
    
    console.log(`✅ Carregadas ${allConfigs.length} configurações de tribunais`);
  }
  
  /**
   * Gera estatísticas dos tribunais configurados
   */
  static getStatistics(): {
    total: number;
    active: number;
    inactive: number;
    bySegment: Record<string, number>;
    byDifficulty: Record<string, number>;
  } {
    const tribunals = Array.from(this.tribunalConfigs.values());
    
    const stats = {
      total: tribunals.length,
      active: tribunals.filter(t => t.isActive).length,
      inactive: tribunals.filter(t => !t.isActive).length,
      bySegment: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>
    };
    
    // Contar por segmento
    tribunals.forEach(tribunal => {
      stats.bySegment[tribunal.segmentName] = (stats.bySegment[tribunal.segmentName] || 0) + 1;
    });
    
    // Contar por dificuldade
    tribunals.forEach(tribunal => {
      const difficulty = tribunal.metadata?.difficulty || 'MEDIO';
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
    });
    
    return stats;
  }
}

export default TribunalIdentifierService;
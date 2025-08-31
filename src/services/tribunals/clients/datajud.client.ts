import { TribunalMovement } from '../../../types/tribunal.types';
import { CNJDatajudMapper } from '../mappers/cnj-datajud.mapper';
import { DatajudParser } from '../parsers/datajud.parser';

interface DatajudConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  rateLimitMs: number;
}

interface DatajudResponse {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: DatajudHit[];
  };
}

interface DatajudHit {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: DatajudProcess;
  sort?: number[];
}

interface DatajudProcess {
  numeroProcesso: string;
  tribunal: string;
  dataAjuizamento: string;
  grau: string;
  nivelSigilo: number;
  formato: {
    codigo: number;
    nome: string;
  };
  sistema: {
    codigo: number;
    nome: string;
  };
  classe: {
    codigo: number;
    nome: string;
  };
  assuntos: Array<{
    codigo: number;
    nome: string;
  }>;
  orgaoJulgador: {
    codigo: number;
    nome: string;
    codigoMunicipioIBGE: number;
  };
  movimentos: DatajudMovement[];
  dataHoraUltimaAtualizacao: string;
  '@timestamp': string;
  id: string;
}

interface DatajudMovement {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{
    codigo: number;
    descricao: string;
    valor: number;
    nome: string;
  }>;
  orgaoJulgador?: {
    codigoOrgao: number;
    nomeOrgao: string;
  };
}

interface DatajudQueryResult {
  success: boolean;
  processNumber: string;
  tribunal: string;
  movements: TribunalMovement[];
  totalMovements: number;
  newMovements: number;
  queryDuration: number;
  fromCache: false;
  source: 'datajud';
  error?: string;
  rawData?: DatajudProcess;
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
 * Cliente real para API DataJud do CNJ
 * Implementa consultas HTTP reais para https://api-publica.datajud.cnj.jus.br
 */
export class DatajudClient {
  private config: DatajudConfig;
  private static instance: DatajudClient;
  private lastRequestTime: number = 0;

  private constructor() {
    this.config = {
      baseUrl: process.env.DATAJUD_BASE_URL || 'https://api-publica.datajud.cnj.jus.br',
      apiKey: process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==',
      timeout: parseInt(process.env.DATAJUD_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.DATAJUD_MAX_RETRIES || '3'),
      rateLimitMs: parseInt(process.env.DATAJUD_RATE_LIMIT_MS || '1000')
    };

    console.log('[DataJud] Configuração inicializada:', {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      rateLimitMs: this.config.rateLimitMs,
      apiKeySet: !!this.config.apiKey
    });
  }

  static getInstance(): DatajudClient {
    if (!DatajudClient.instance) {
      DatajudClient.instance = new DatajudClient();
    }
    return DatajudClient.instance;
  }

  /**
   * Mapeia código do tribunal para endpoint DataJud
   */
  private getEndpointByTribunal(tribunalCode: string): string | null {
    // Usar mapeamento centralizado CNJDatajudMapper
    const mapping = CNJDatajudMapper.mapTribunalCodeToDatajud(tribunalCode);
    
    if (mapping.success && mapping.endpoint) {
      return mapping.endpoint;
    }
    
    console.warn(`[DataJud] Tribunal ${tribunalCode} não encontrado no mapeamento`);
    return null;
  }

  /**
   * Aplica rate limiting entre requests
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.rateLimitMs) {
      const waitTime = this.config.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Executa requisição HTTP para API DataJud
   */
  private async makeRequest(endpoint: string, numeroProcesso: string): Promise<DatajudResponse> {
    await this.applyRateLimit();
    
    const url = `${this.config.baseUrl}/${endpoint}/_search`;
    const cleanNumber = numeroProcesso.replace(/\D/g, '');
    
    const payload = {
      query: {
        match: {
          numeroProcesso: cleanNumber
        }
      },
      size: 10,
      sort: [
        { '@timestamp': { order: 'desc' } }
      ]
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `APIKey ${this.config.apiKey}`,
      'User-Agent': 'AutumnusJuris-v1.1.0-DataJud-Client'
    };

    console.log(`[DataJud] POST ${url}`);
    console.log(`[DataJud] Query:`, JSON.stringify(payload, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DatajudResponse = await response.json();
      console.log(`[DataJud] Response: ${data.hits.total.value} hits found`);
      
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Timeout após ${this.config.timeout}ms`);
        }
        throw error;
      }
      
      throw new Error('Erro desconhecido na requisição DataJud');
    }
  }



  /**
   * Consulta processo por número CNJ em tribunal específico
   */
  async consultarProcesso(numeroProcesso: string, tribunalCode: string): Promise<DatajudQueryResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[DataJud] Iniciando consulta: ${numeroProcesso} no tribunal ${tribunalCode}`);

      // Determinar endpoint do tribunal
      const endpoint = this.getEndpointByTribunal(tribunalCode);
      if (!endpoint) {
        throw new Error(`Tribunal ${tribunalCode} não disponível na API DataJud`);
      }

      let lastError: Error | null = null;
      
      // Retry loop
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          console.log(`[DataJud] Tentativa ${attempt}/${this.config.maxRetries}`);
          
          const response = await this.makeRequest(endpoint, numeroProcesso);
          
          if (response.hits.total.value === 0) {
            return {
              success: false,
              processNumber: numeroProcesso,
              tribunal: tribunalCode,
              movements: [],
              totalMovements: 0,
              newMovements: 0,
              queryDuration: Date.now() - startTime,
              fromCache: false,
              source: 'datajud',
              error: 'Processo não encontrado na base DataJud',
              metadata: {
                tribunal: tribunalCode,
                processNumber: numeroProcesso,
                consultationDate: new Date(),
                responseTime: Date.now() - startTime,
                totalMovements: 0,
                source: 'api-publica.datajud.cnj.jus.br'
              }
            };
          }

          // Processar primeiro resultado
          const firstHit = response.hits.hits[0];
          const process = firstHit._source;
          
          // Usar parser para converter processo completo
          const parseResult = DatajudParser.parseProcess(process);
          
          if (!parseResult.success) {
            throw new Error(parseResult.error || 'Erro ao processar dados DataJud');
          }
          
          const movements = parseResult.movements || [];
          
          console.log(`[DataJud] Sucesso: ${movements.length} movimentos encontrados`);

          return {
            success: true,
            processNumber: numeroProcesso,
            tribunal: process.tribunal || tribunalCode,
            movements,
            totalMovements: movements.length,
            newMovements: movements.length, // Todos são "novos" na primeira consulta
            queryDuration: Date.now() - startTime,
            fromCache: false,
            source: 'datajud',
            rawData: process,
            metadata: {
              tribunal: process.tribunal || tribunalCode,
              processNumber: numeroProcesso,
              consultationDate: new Date(),
              responseTime: Date.now() - startTime,
              totalMovements: movements.length,
              source: 'api-publica.datajud.cnj.jus.br',
              dataSource: {
                hit: firstHit,
                processMetadata: parseResult.metadata
              }
            }
          };
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Erro desconhecido');
          console.error(`[DataJud] Tentativa ${attempt} falhou:`, lastError.message);
          
          if (attempt < this.config.maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
            console.log(`[DataJud] Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Todas as tentativas falharam
      throw lastError || new Error('Falha na consulta DataJud após todas as tentativas');
      
    } catch (error) {
      console.error(`[DataJud] Erro final:`, error);
      
      return {
        success: false,
        processNumber: numeroProcesso,
        tribunal: tribunalCode,
        movements: [],
        totalMovements: 0,
        newMovements: 0,
        queryDuration: Date.now() - startTime,
        fromCache: false,
        source: 'datajud',
        error: error instanceof Error ? error.message : 'Erro desconhecido na consulta DataJud',
        metadata: {
          tribunal: tribunalCode,
          processNumber: numeroProcesso,
          consultationDate: new Date(),
          responseTime: Date.now() - startTime,
          totalMovements: 0,
          source: 'api-publica.datajud.cnj.jus.br'
        }
      };
    }
  }

  /**
   * Obter tribunais disponíveis na API DataJud
   */
  getTribunaisDisponiveis(): Array<{
    code: string;
    name: string;
    type: string;
    endpoint: string;
  }> {
    return CNJDatajudMapper.getAllTribunals().map(tribunal => ({
      code: tribunal.datajudCode,
      name: tribunal.name,
      type: tribunal.type,
      endpoint: `api_publica_${tribunal.datajudCode.toLowerCase()}`
    }));
  }

  /**
   * Processar múltiplos processos em lote
   */
  async processarLote(processNumbers: string[]): Promise<{
    success: boolean;
    results: DatajudQueryResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalMovements: number;
      tribunals: string[];
    };
    errors: string[];
  }> {
    console.log(`[DataJud] Processando lote de ${processNumbers.length} processos`);
    
    const results: DatajudQueryResult[] = [];
    const errors: string[] = [];
    const tribunalsSet = new Set<string>();
    let totalMovements = 0;
    
    // Processar sequencialmente para respeitar rate limit
    for (const processNumber of processNumbers) {
      try {
        // Identificar tribunal pelo número CNJ
        const mapping = CNJDatajudMapper.mapCNJToDatajud(processNumber);
        
        if (!mapping.success) {
          const errorMsg = `${processNumber}: ${mapping.error}`;
          errors.push(errorMsg);
          console.warn(`[DataJud] ${errorMsg}`);
          continue;
        }

        const result = await this.consultarProcesso(processNumber, mapping.tribunalCode!);
        results.push(result);
        
        if (result.success) {
          totalMovements += result.totalMovements;
          tribunalsSet.add(result.tribunal);
        } else {
          errors.push(`${processNumber}: ${result.error}`);
        }

      } catch (error) {
        const errorMsg = `${processNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        errors.push(errorMsg);
        console.error(`[DataJud] Erro no lote:`, error);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      success: errors.length < processNumbers.length, // Sucesso se pelo menos um processo foi processado
      results,
      summary: {
        total: processNumbers.length,
        successful,
        failed,
        totalMovements,
        tribunals: Array.from(tribunalsSet)
      },
      errors
    };
  }

  /**
   * Testa conectividade com API DataJud
   */
  async testConnection(): Promise<{ success: boolean; message: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      // Teste simples com endpoint TRF1
      const response = await fetch(`${this.config.baseUrl}/api_publica_trf1/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `APIKey ${this.config.apiKey}`
        },
        body: JSON.stringify({
          query: { match_all: {} },
          size: 1
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          success: true,
          message: 'Conexão com API DataJud estabelecida com sucesso',
          responseTime
        };
      } else {
        return {
          success: false,
          message: `Erro HTTP ${response.status}: ${response.statusText}`,
          responseTime
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        responseTime: Date.now() - startTime
      };
    }
  }
}

export default DatajudClient;
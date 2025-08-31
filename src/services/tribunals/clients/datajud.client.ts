import { TribunalMovement, ScrapingResult } from '../../../types/tribunal.types';

interface DatajudConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
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

export class DatajudClient {
  private config: DatajudConfig;
  private static instance: DatajudClient;

  private constructor() {
    this.config = {
      baseUrl: 'https://api-publica.datajud.cnj.jus.br',
      apiKey: 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==',
      timeout: 30000,
      maxRetries: 3
    };
  }

  static getInstance(): DatajudClient {
    if (!DatajudClient.instance) {
      DatajudClient.instance = new DatajudClient();
    }
    return DatajudClient.instance;
  }

  /**
   * Consulta processo por número CNJ em tribunal específico
   */
  async consultarProcesso(numeroProcesso: string, tribunalCode: string): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[DataJud] Consultando processo ${numeroProcesso} no ${tribunalCode}`);

      // Determinar endpoint do tribunal
      const endpoint = this.getEndpointByTribunal(tribunalCode);
      if (!endpoint) {
        throw new Error(`Tribunal ${tribunalCode} não disponível na API DataJud`);
      }

      // Limpar número do processo (remover formatação)
      const cleanProcessNumber = numeroProcesso.replace(/[^0-9]/g, '');

      // Construir query para busca
      const query = {
        query: {
          match: {
            numeroProcesso: cleanProcessNumber
          }
        },
        size: 1 // Esperamos apenas 1 resultado para consulta específica
      };

      // Realizar consulta
      const response = await this.makeRequest(endpoint, query);
      
      if (!response.hits?.hits?.length) {
        return {
          success: false,
          error: `Processo ${numeroProcesso} não encontrado no ${tribunalCode}`,
          movements: [],
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

      // Processar resultado
      const processData = response.hits.hits[0]._source;
      const movements = this.parseMovements(processData, numeroProcesso);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`[DataJud] Consulta concluída: ${movements.length} movimentações em ${responseTime}ms`);

      return {
        success: true,
        movements,
        metadata: {
          tribunal: tribunalCode,
          processNumber: numeroProcesso,
          consultationDate: new Date(),
          responseTime,
          totalMovements: movements.length,
          source: 'api-publica.datajud.cnj.jus.br',
          lastUpdate: new Date(processData.dataHoraUltimaAtualizacao),
          dataSource: processData
        }
      };

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.error(`[DataJud] Erro na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na API DataJud',
        movements: [],
        metadata: {
          tribunal: tribunalCode,
          processNumber: numeroProcesso,
          consultationDate: new Date(),
          responseTime,
          totalMovements: 0,
          source: 'api-publica.datajud.cnj.jus.br'
        }
      };
    }
  }

  /**
   * Consulta múltiplos processos de um tribunal (com paginação)
   */
  async consultarMultiplosProcessos(
    tribunalCode: string, 
    options: {
      size?: number;
      searchAfter?: number[];
      filters?: any;
    } = {}
  ): Promise<{
    success: boolean;
    processes: DatajudProcess[];
    searchAfter?: number[];
    total: number;
    error?: string;
  }> {
    try {
      const endpoint = this.getEndpointByTribunal(tribunalCode);
      if (!endpoint) {
        throw new Error(`Tribunal ${tribunalCode} não disponível na API DataJud`);
      }

      const query: any = {
        size: options.size || 100,
        query: options.filters || { match_all: {} },
        sort: [
          {
            '@timestamp': {
              order: 'asc'
            }
          }
        ]
      };

      // Adicionar paginação se fornecida
      if (options.searchAfter) {
        query.search_after = options.searchAfter;
      }

      const response = await this.makeRequest(endpoint, query);

      const processes = response.hits.hits.map(hit => hit._source);
      const lastHit = response.hits.hits[response.hits.hits.length - 1];
      const nextSearchAfter = lastHit?.sort;

      return {
        success: true,
        processes,
        searchAfter: nextSearchAfter,
        total: response.hits.total.value
      };

    } catch (error) {
      return {
        success: false,
        processes: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Realizar requisição HTTP para API DataJud
   */
  private async makeRequest(endpoint: string, query: any): Promise<DatajudResponse> {
    const url = `${this.config.baseUrl}/${endpoint}/_search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `APIKey ${this.config.apiKey}`
      },
      body: JSON.stringify(query),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Erro na API DataJud: ${JSON.stringify(data.error)}`);
    }

    return data;
  }

  /**
   * Converter movimentações DataJud para formato interno
   */
  private parseMovements(processData: DatajudProcess, numeroProcesso: string): TribunalMovement[] {
    if (!processData.movimentos || !Array.isArray(processData.movimentos)) {
      return [];
    }

    return processData.movimentos.map((mov, index) => {
      // Converter data/hora
      const movementDate = new Date(mov.dataHora);
      
      // Gerar hash único para deduplicação
      const hash = this.generateMovementHash({
        processNumber: numeroProcesso,
        date: movementDate,
        code: mov.codigo,
        name: mov.nome
      });

      // Determinar se é movimento judicial
      const isJudicial = this.isJudicialMovement(mov.nome, mov.codigo);

      return {
        id: `datajud-${processData.tribunal}-${numeroProcesso}-${mov.codigo}-${index}`,
        processNumber: numeroProcesso,
        tribunal: processData.tribunal,
        movementDate,
        movementCode: mov.codigo.toString(),
        title: mov.nome,
        description: this.buildMovementDescription(mov),
        isJudicial,
        hash,
        source: 'api-publica.datajud.cnj.jus.br',
        discoveredAt: new Date(),
        isNew: true,
        metadata: {
          orgaoJulgador: mov.orgaoJulgador,
          complementos: mov.complementosTabelados,
          codigoTPU: mov.codigo
        }
      } as TribunalMovement;
    }).sort((a, b) => b.movementDate.getTime() - a.movementDate.getTime());
  }

  /**
   * Construir descrição detalhada da movimentação
   */
  private buildMovementDescription(mov: DatajudMovement): string {
    let description = mov.nome;

    // Adicionar complementos tabelados se existirem
    if (mov.complementosTabelados && mov.complementosTabelados.length > 0) {
      const complementos = mov.complementosTabelados
        .map(comp => `${comp.descricao}: ${comp.nome}`)
        .join('; ');
      description += `\nComplementos: ${complementos}`;
    }

    // Adicionar órgão julgador se diferente do principal
    if (mov.orgaoJulgador && mov.orgaoJulgador.nomeOrgao) {
      description += `\nÓrgão: ${mov.orgaoJulgador.nomeOrgao}`;
    }

    return description;
  }

  /**
   * Determinar se é movimento judicial baseado no código TPU
   */
  private isJudicialMovement(nome: string, codigo: number): boolean {
    // Códigos TPU conhecidos para movimentos judiciais
    const judicialCodes = [
      123, // Decisão
      132, // Recebimento
      193, // Intimação
      246, // Juntada
      60,  // Expedição
      51,  // Audiência
      85,  // Baixa
      11,  // Distribuição
      26   // Conclusão
    ];

    // Palavras-chave judiciais
    const judicialKeywords = [
      'decisão', 'sentença', 'despacho', 'acórdão', 'liminar',
      'tutela', 'embargo', 'agravo', 'recurso', 'apelação',
      'audiência', 'citação', 'intimação', 'conclusão'
    ];

    // Verificar por código
    if (judicialCodes.includes(codigo)) {
      return true;
    }

    // Verificar por palavras-chave
    const lowerName = nome.toLowerCase();
    return judicialKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Gerar hash MD5 para deduplicação
   */
  private generateMovementHash(data: {
    processNumber: string;
    date: Date;
    code: number;
    name: string;
  }): string {
    const crypto = require('crypto');
    const hashInput = `${data.processNumber}-${data.date.toISOString()}-${data.code}-${data.name}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  /**
   * Mapear código tribunal CNJ para endpoint DataJud
   */
  private getEndpointByTribunal(tribunalCode: string): string | null {
    const mapping: { [key: string]: string } = {
      // Tribunais Superiores
      'TST': 'api_publica_tst',
      'TSE': 'api_publica_tse', 
      'STJ': 'api_publica_stj',
      'STM': 'api_publica_stm',

      // Justiça Federal
      'TRF1': 'api_publica_trf1',
      'TRF2': 'api_publica_trf2',
      'TRF3': 'api_publica_trf3',
      'TRF4': 'api_publica_trf4',
      'TRF5': 'api_publica_trf5',
      'TRF6': 'api_publica_trf6',

      // Justiça Estadual
      'TJAC': 'api_publica_tjac',
      'TJAL': 'api_publica_tjal',
      'TJAM': 'api_publica_tjam',
      'TJAP': 'api_publica_tjap',
      'TJBA': 'api_publica_tjba',
      'TJCE': 'api_publica_tjce',
      'TJDFT': 'api_publica_tjdft',
      'TJES': 'api_publica_tjes',
      'TJGO': 'api_publica_tjgo',
      'TJMA': 'api_publica_tjma',
      'TJMG': 'api_publica_tjmg',
      'TJMS': 'api_publica_tjms',
      'TJMT': 'api_publica_tjmt',
      'TJPA': 'api_publica_tjpa',
      'TJPB': 'api_publica_tjpb',
      'TJPE': 'api_publica_tjpe',
      'TJPI': 'api_publica_tjpi',
      'TJPR': 'api_publica_tjpr',
      'TJRJ': 'api_publica_tjrj',
      'TJRN': 'api_publica_tjrn',
      'TJRO': 'api_publica_tjro',
      'TJRR': 'api_publica_tjrr',
      'TJRS': 'api_publica_tjrs',
      'TJSC': 'api_publica_tjsc',
      'TJSE': 'api_publica_tjse',
      'TJSP': 'api_publica_tjsp',
      'TJTO': 'api_publica_tjto'
    };

    return mapping[tribunalCode] || null;
  }

  /**
   * Obter lista de todos os tribunais disponíveis
   */
  getTribunaisDisponiveis(): Array<{ code: string; name: string; endpoint: string }> {
    return [
      // Tribunais Superiores
      { code: 'TST', name: 'Tribunal Superior do Trabalho', endpoint: 'api_publica_tst' },
      { code: 'TSE', name: 'Tribunal Superior Eleitoral', endpoint: 'api_publica_tse' },
      { code: 'STJ', name: 'Superior Tribunal de Justiça', endpoint: 'api_publica_stj' },
      { code: 'STM', name: 'Superior Tribunal Militar', endpoint: 'api_publica_stm' },

      // Justiça Federal
      { code: 'TRF1', name: 'Tribunal Regional Federal da 1ª Região', endpoint: 'api_publica_trf1' },
      { code: 'TRF2', name: 'Tribunal Regional Federal da 2ª Região', endpoint: 'api_publica_trf2' },
      { code: 'TRF3', name: 'Tribunal Regional Federal da 3ª Região', endpoint: 'api_publica_trf3' },
      { code: 'TRF4', name: 'Tribunal Regional Federal da 4ª Região', endpoint: 'api_publica_trf4' },
      { code: 'TRF5', name: 'Tribunal Regional Federal da 5ª Região', endpoint: 'api_publica_trf5' },
      { code: 'TRF6', name: 'Tribunal Regional Federal da 6ª Região', endpoint: 'api_publica_trf6' },

      // Justiça Estadual (27 tribunais)
      { code: 'TJAC', name: 'Tribunal de Justiça do Acre', endpoint: 'api_publica_tjac' },
      { code: 'TJAL', name: 'Tribunal de Justiça de Alagoas', endpoint: 'api_publica_tjal' },
      { code: 'TJAM', name: 'Tribunal de Justiça do Amazonas', endpoint: 'api_publica_tjam' },
      { code: 'TJAP', name: 'Tribunal de Justiça do Amapá', endpoint: 'api_publica_tjap' },
      { code: 'TJBA', name: 'Tribunal de Justiça da Bahia', endpoint: 'api_publica_tjba' },
      { code: 'TJCE', name: 'Tribunal de Justiça do Ceará', endpoint: 'api_publica_tjce' },
      { code: 'TJDFT', name: 'TJ do Distrito Federal e Territórios', endpoint: 'api_publica_tjdft' },
      { code: 'TJES', name: 'Tribunal de Justiça do Espírito Santo', endpoint: 'api_publica_tjes' },
      { code: 'TJGO', name: 'Tribunal de Justiça do Goiás', endpoint: 'api_publica_tjgo' },
      { code: 'TJMA', name: 'Tribunal de Justiça do Maranhão', endpoint: 'api_publica_tjma' },
      { code: 'TJMG', name: 'Tribunal de Justiça de Minas Gerais', endpoint: 'api_publica_tjmg' },
      { code: 'TJMS', name: 'TJ do Mato Grosso do Sul', endpoint: 'api_publica_tjms' },
      { code: 'TJMT', name: 'Tribunal de Justiça do Mato Grosso', endpoint: 'api_publica_tjmt' },
      { code: 'TJPA', name: 'Tribunal de Justiça do Pará', endpoint: 'api_publica_tjpa' },
      { code: 'TJPB', name: 'Tribunal de Justiça da Paraíba', endpoint: 'api_publica_tjpb' },
      { code: 'TJPE', name: 'Tribunal de Justiça de Pernambuco', endpoint: 'api_publica_tjpe' },
      { code: 'TJPI', name: 'Tribunal de Justiça do Piauí', endpoint: 'api_publica_tjpi' },
      { code: 'TJPR', name: 'Tribunal de Justiça do Paraná', endpoint: 'api_publica_tjpr' },
      { code: 'TJRJ', name: 'Tribunal de Justiça do Rio de Janeiro', endpoint: 'api_publica_tjrj' },
      { code: 'TJRN', name: 'Tribunal de Justiça do Rio Grande do Norte', endpoint: 'api_publica_tjrn' },
      { code: 'TJRO', name: 'Tribunal de Justiça de Rondônia', endpoint: 'api_publica_tjro' },
      { code: 'TJRR', name: 'Tribunal de Justiça de Roraima', endpoint: 'api_publica_tjrr' },
      { code: 'TJRS', name: 'Tribunal de Justiça do Rio Grande do Sul', endpoint: 'api_publica_tjrs' },
      { code: 'TJSC', name: 'Tribunal de Justiça de Santa Catarina', endpoint: 'api_publica_tjsc' },
      { code: 'TJSE', name: 'Tribunal de Justiça de Sergipe', endpoint: 'api_publica_tjse' },
      { code: 'TJSP', name: 'Tribunal de Justiça de São Paulo', endpoint: 'api_publica_tjsp' },
      { code: 'TJTO', name: 'Tribunal de Justiça do Tocantins', endpoint: 'api_publica_tjto' }
    ];
  }
}
interface PaginationConfig {
  size: number;
  maxPages: number;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    searchAfter?: number[];
    totalPages?: number;
  };
  success: boolean;
  error?: string;
}

interface ElasticsearchQuery {
  size: number;
  query: any;
  sort: Array<{ [field: string]: { order: string } }>;
  search_after?: number[];
}

export class DatajudPaginatorService {
  private static readonly DEFAULT_CONFIG: PaginationConfig = {
    size: 100,
    maxPages: 100, // Máximo 10.000 registros (100 páginas * 100 itens)
    sortField: '@timestamp',
    sortOrder: 'asc'
  };

  /**
   * Paginar consulta simples com search_after
   */
  static async paginateQuery<T>(
    executeQuery: (query: ElasticsearchQuery) => Promise<{
      hits: {
        total: { value: number; relation: string };
        hits: Array<{ _source: T; sort?: number[] }>;
      };
    }>,
    baseQuery: any,
    config: Partial<PaginationConfig> = {}
  ): Promise<PaginationResult<T>> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      let allData: T[] = [];
      let currentPage = 1;
      let searchAfter: number[] | undefined;
      let totalItems = 0;
      let hasNextPage = true;

      console.log(`[DatajudPaginator] Iniciando paginação com ${finalConfig.size} itens por página`);

      while (hasNextPage && currentPage <= finalConfig.maxPages) {
        // Construir query com paginação
        const query: ElasticsearchQuery = {
          size: finalConfig.size,
          query: baseQuery,
          sort: [{
            [finalConfig.sortField]: {
              order: finalConfig.sortOrder
            }
          }]
        };

        // Adicionar search_after se não for a primeira página
        if (searchAfter) {
          query.search_after = searchAfter;
        }

        console.log(`[DatajudPaginator] Buscando página ${currentPage}...`);

        // Executar query
        const response = await executeQuery(query);

        // Processar resultados
        const hits = response.hits.hits;
        if (hits.length === 0) {
          hasNextPage = false;
          break;
        }

        // Extrair dados
        const pageData = hits.map(hit => hit._source);
        allData = allData.concat(pageData);

        // Atualizar informações de paginação
        totalItems = response.hits.total.value;
        const lastHit = hits[hits.length - 1];
        searchAfter = lastHit.sort;
        
        // Verificar se há próxima página
        hasNextPage = hits.length === finalConfig.size && currentPage < finalConfig.maxPages;

        console.log(`[DatajudPaginator] Página ${currentPage}: ${hits.length} itens (Total: ${allData.length})`);
        
        currentPage++;

        // Delay entre páginas para não sobrecarregar a API
        if (hasNextPage) {
          await this.delay(100); // 100ms entre páginas
        }
      }

      console.log(`[DatajudPaginator] Paginação concluída: ${allData.length} itens em ${currentPage - 1} páginas`);

      return {
        data: allData,
        pagination: {
          currentPage: currentPage - 1,
          totalItems: Math.min(totalItems, allData.length),
          itemsPerPage: finalConfig.size,
          hasNextPage: false,
          searchAfter,
          totalPages: Math.ceil(Math.min(totalItems, finalConfig.maxPages * finalConfig.size) / finalConfig.size)
        },
        success: true
      };

    } catch (error) {
      console.error('[DatajudPaginator] Erro na paginação:', error);
      
      return {
        data: [],
        pagination: {
          currentPage: 0,
          totalItems: 0,
          itemsPerPage: finalConfig.size,
          hasNextPage: false
        },
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na paginação'
      };
    }
  }

  /**
   * Paginar consulta específica por lotes (batch pagination)
   */
  static async paginateInBatches<T>(
    executeQuery: (query: ElasticsearchQuery) => Promise<{
      hits: {
        total: { value: number; relation: string };
        hits: Array<{ _source: T; sort?: number[] }>;
      };
    }>,
    baseQuery: any,
    options: {
      batchSize?: number;
      maxBatches?: number;
      onBatch?: (batch: T[], batchNumber: number) => Promise<void>;
      config?: Partial<PaginationConfig>;
    } = {}
  ): Promise<PaginationResult<T>> {
    const batchSize = options.batchSize || 50;
    const maxBatches = options.maxBatches || 200;
    const config = { ...this.DEFAULT_CONFIG, size: batchSize, ...options.config };

    try {
      let allData: T[] = [];
      let batchNumber = 1;
      let searchAfter: number[] | undefined;
      let totalItems = 0;
      let hasNextPage = true;

      console.log(`[DatajudPaginator] Iniciando paginação em lotes: ${batchSize} itens por lote`);

      while (hasNextPage && batchNumber <= maxBatches) {
        // Construir query
        const query: ElasticsearchQuery = {
          size: batchSize,
          query: baseQuery,
          sort: [{
            [config.sortField]: {
              order: config.sortOrder
            }
          }]
        };

        if (searchAfter) {
          query.search_after = searchAfter;
        }

        // Executar query
        const response = await executeQuery(query);
        const hits = response.hits.hits;

        if (hits.length === 0) {
          break;
        }

        // Processar lote
        const batchData = hits.map(hit => hit._source);
        allData = allData.concat(batchData);
        totalItems = response.hits.total.value;

        // Callback opcional para processar lote
        if (options.onBatch) {
          await options.onBatch(batchData, batchNumber);
        }

        // Atualizar paginação
        const lastHit = hits[hits.length - 1];
        searchAfter = lastHit.sort;
        hasNextPage = hits.length === batchSize && batchNumber < maxBatches;

        console.log(`[DatajudPaginator] Lote ${batchNumber}: ${hits.length} itens processados`);
        
        batchNumber++;

        // Delay entre lotes
        if (hasNextPage) {
          await this.delay(200);
        }
      }

      return {
        data: allData,
        pagination: {
          currentPage: batchNumber - 1,
          totalItems: Math.min(totalItems, allData.length),
          itemsPerPage: batchSize,
          hasNextPage: false,
          searchAfter
        },
        success: true
      };

    } catch (error) {
      return {
        data: [],
        pagination: {
          currentPage: 0,
          totalItems: 0,
          itemsPerPage: batchSize,
          hasNextPage: false
        },
        success: false,
        error: error instanceof Error ? error.message : 'Erro na paginação em lotes'
      };
    }
  }

  /**
   * Buscar próxima página específica usando search_after
   */
  static async getNextPage<T>(
    executeQuery: (query: ElasticsearchQuery) => Promise<{
      hits: {
        total: { value: number; relation: string };
        hits: Array<{ _source: T; sort?: number[] }>;
      };
    }>,
    baseQuery: any,
    searchAfter: number[],
    config: Partial<PaginationConfig> = {}
  ): Promise<{
    data: T[];
    searchAfter?: number[];
    hasNextPage: boolean;
    success: boolean;
    error?: string;
  }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      const query: ElasticsearchQuery = {
        size: finalConfig.size,
        query: baseQuery,
        sort: [{
          [finalConfig.sortField]: {
            order: finalConfig.sortOrder
          }
        }],
        search_after: searchAfter
      };

      const response = await executeQuery(query);
      const hits = response.hits.hits;
      
      const data = hits.map(hit => hit._source);
      const lastHit = hits[hits.length - 1];
      const nextSearchAfter = lastHit?.sort;
      const hasNextPage = hits.length === finalConfig.size;

      return {
        data,
        searchAfter: nextSearchAfter,
        hasNextPage,
        success: true
      };

    } catch (error) {
      return {
        data: [],
        hasNextPage: false,
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar próxima página'
      };
    }
  }

  /**
   * Estimar total de páginas baseado no limit da API
   */
  static estimateTotalPages(totalItems: number, itemsPerPage: number): number {
    const maxApiItems = 10000; // Limit da API DataJud
    const effectiveTotal = Math.min(totalItems, maxApiItems);
    return Math.ceil(effectiveTotal / itemsPerPage);
  }

  /**
   * Criar query base para diferentes tipos de consulta
   */
  static createBaseQuery(
    type: 'numero_processo' | 'tribunal' | 'classe_orgao' | 'match_all',
    params: any
  ): any {
    switch (type) {
      case 'numero_processo':
        return {
          match: {
            numeroProcesso: params.numeroProcesso
          }
        };

      case 'tribunal':
        return {
          match: {
            tribunal: params.tribunal
          }
        };

      case 'classe_orgao':
        return {
          bool: {
            must: [
              { match: { 'classe.codigo': params.classeCode } },
              { match: { 'orgaoJulgador.codigo': params.orgaoCode } }
            ]
          }
        };

      case 'match_all':
      default:
        return { match_all: {} };
    }
  }

  /**
   * Validar parâmetros de paginação
   */
  static validatePaginationParams(params: {
    size?: number;
    searchAfter?: number[];
    maxPages?: number;
  }): { valid: boolean; error?: string } {
    // Validar size
    if (params.size !== undefined) {
      if (params.size < 1 || params.size > 10000) {
        return {
          valid: false,
          error: 'Size deve estar entre 1 e 10.000'
        };
      }
    }

    // Validar searchAfter
    if (params.searchAfter !== undefined) {
      if (!Array.isArray(params.searchAfter) || params.searchAfter.length === 0) {
        return {
          valid: false,
          error: 'searchAfter deve ser um array não-vazio'
        };
      }
    }

    // Validar maxPages
    if (params.maxPages !== undefined) {
      if (params.maxPages < 1 || params.maxPages > 1000) {
        return {
          valid: false,
          error: 'maxPages deve estar entre 1 e 1.000'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Obter estatísticas de performance da paginação
   */
  static getPerformanceStats(
    startTime: number,
    endTime: number,
    totalItems: number,
    pages: number
  ): {
    totalTime: number;
    itemsPerSecond: number;
    averagePageTime: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const totalTime = endTime - startTime;
    const itemsPerSecond = totalItems / (totalTime / 1000);
    const averagePageTime = pages > 0 ? totalTime / pages : 0;

    let performance: 'excellent' | 'good' | 'fair' | 'poor';
    if (itemsPerSecond > 100) performance = 'excellent';
    else if (itemsPerSecond > 50) performance = 'good';
    else if (itemsPerSecond > 20) performance = 'fair';
    else performance = 'poor';

    return {
      totalTime,
      itemsPerSecond,
      averagePageTime,
      performance
    };
  }

  /**
   * Delay entre páginas
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
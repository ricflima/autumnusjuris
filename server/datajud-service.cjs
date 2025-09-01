// DataJud Service para servidor CJS
const { config } = require('dotenv');
config({ path: '.env.local' });
const MovementEnricher = require('./movement-enricher.cjs');

class DatajudService {
  constructor() {
    this.config = {
      baseUrl: process.env.DATAJUD_BASE_URL || 'https://api-publica.datajud.cnj.jus.br',
      apiKey: process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==',
      timeout: parseInt(process.env.DATAJUD_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.DATAJUD_MAX_RETRIES || '3'),
      rateLimitMs: parseInt(process.env.DATAJUD_RATE_LIMIT_MS || '1000')
    };
    
    this.lastRequestTime = 0;
    this.enricher = new MovementEnricher();
    
    console.log('[DatajudService] Inicializado com configuração:');
    console.log(`  Base URL: ${this.config.baseUrl}`);
    console.log(`  Timeout: ${this.config.timeout}ms`);
    console.log(`  Rate Limit: ${this.config.rateLimitMs}ms`);
  }

  // Mapeamento simples CNJ -> DataJud
  mapCNJToDatajud(numeroProcessoCNJ) {
    const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.(\d)\.(\d{2})\.\d{4}$/;
    const match = numeroProcessoCNJ.match(cnjRegex);
    
    if (!match) {
      return { success: false, error: 'Formato CNJ inválido' };
    }

    const [, segmento, tribunal] = match;
    const codigoCompleto = segmento + tribunal;
    
    // Mapeamento básico dos principais tribunais
    const tribunalMap = {
      // TRFs
      '401': { code: 'TRF1', name: 'TRF da 1ª Região', endpoint: 'api_publica_trf1' },
      '402': { code: 'TRF2', name: 'TRF da 2ª Região', endpoint: 'api_publica_trf2' },
      '403': { code: 'TRF3', name: 'TRF da 3ª Região', endpoint: 'api_publica_trf3' },
      '404': { code: 'TRF4', name: 'TRF da 4ª Região', endpoint: 'api_publica_trf4' },
      '405': { code: 'TRF5', name: 'TRF da 5ª Região', endpoint: 'api_publica_trf5' },
      '406': { code: 'TRF6', name: 'TRF da 6ª Região', endpoint: 'api_publica_trf6' },
      
      // TJs principais
      '825': { code: 'TJSP', name: 'TJ de São Paulo', endpoint: 'api_publica_tjsp' },
      '826': { code: 'TJSP', name: 'TJ de São Paulo', endpoint: 'api_publica_tjsp' },
      '819': { code: 'TJRJ', name: 'TJ do Rio de Janeiro', endpoint: 'api_publica_tjrj' },
      '813': { code: 'TJMG', name: 'TJ de Minas Gerais', endpoint: 'api_publica_tjmg' },
      '821': { code: 'TJRS', name: 'TJ do Rio Grande do Sul', endpoint: 'api_publica_tjrs' },
      '816': { code: 'TJPR', name: 'TJ do Paraná', endpoint: 'api_publica_tjpr' },
      '807': { code: 'TJSC', name: 'TJ de Santa Catarina', endpoint: 'api_publica_tjsc' },
      '805': { code: 'TJBA', name: 'TJ da Bahia', endpoint: 'api_publica_tjba' },
      '803': { code: 'TJCE', name: 'TJ do Ceará', endpoint: 'api_publica_tjce' },
      
      // TRTs principais
      '501': { code: 'TRT1', name: 'TRT da 1ª Região (RJ)', endpoint: 'api_publica_trt1' },
      '502': { code: 'TRT2', name: 'TRT da 2ª Região (SP)', endpoint: 'api_publica_trt2' },
      '503': { code: 'TRT3', name: 'TRT da 3ª Região (MG)', endpoint: 'api_publica_trt3' },
      '504': { code: 'TRT4', name: 'TRT da 4ª Região (RS)', endpoint: 'api_publica_trt4' },
      '509': { code: 'TRT9', name: 'TRT da 9ª Região (PR)', endpoint: 'api_publica_trt9' }
    };

    const tribunalInfo = tribunalMap[codigoCompleto];
    if (!tribunalInfo) {
      return { 
        success: false, 
        error: `Tribunal ${codigoCompleto} não disponível (segmento: ${segmento}, tribunal: ${tribunal})` 
      };
    }

    return {
      success: true,
      tribunalCode: tribunalInfo.code,
      tribunalName: tribunalInfo.name,
      endpoint: tribunalInfo.endpoint
    };
  }

  // Rate limiting
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.config.rateLimitMs) {
      const waitTime = this.config.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Gerar hash determinístico baseado no conteúdo
  generateHash(processNumber, tribunal, date, code, name, index = 0) {
    const hashInput = `${processNumber}|${date}|${code}|${name}|${index}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Converter movimentos DataJud para nossa estrutura
  convertMovements(datajudMovements, processNumber, tribunal) {
    const now = new Date();
    
    const basicMovements = datajudMovements.map((mov, index) => ({
      id: `datajud-${tribunal}-${processNumber}-${mov.codigo}-${index}`,
      processNumber,
      tribunal,
      movementDate: mov.dataHora,
      movementCode: mov.codigo.toString(),
      title: mov.nome,
      description: this.buildDescription(mov),
      isJudicial: this.classifyMovement(mov),
      hash: this.generateHash(processNumber, tribunal, mov.dataHora, mov.codigo, mov.nome, index),
      source: 'datajud',
      discoveredAt: now,
      isNew: true,
      metadata: {
        codigoTPU: mov.codigo,
        orgaoJulgador: mov.orgaoJulgador,
        complementosTabelados: mov.complementosTabelados
      }
    }));

    // Enriquecer movimentações com detalhes
    return this.enricher.enrichBatch(basicMovements);
  }

  // Construir descrição
  buildDescription(movement) {
    let description = movement.nome;

    if (movement.complementosTabelados && movement.complementosTabelados.length > 0) {
      const complementos = movement.complementosTabelados
        .map(comp => `${comp.descricao || 'Complemento'}: ${comp.nome || comp.valor || 'N/A'}`)
        .join('; ');
      description += `\n\nComplementos: ${complementos}`;
    }

    if (movement.orgaoJulgador?.nomeOrgao) {
      description += `\n\nÓrgão Julgador: ${movement.orgaoJulgador.nomeOrgao}`;
    }

    return description.trim();
  }

  // Classificar movimento
  classifyMovement(movement) {
    const codigo = movement.codigo;
    const nome = movement.nome.toLowerCase();

    // Códigos TPU judiciais conhecidos
    const codigosJudiciais = [123, 132, 193, 246, 60, 51, 85, 11, 26, 854, 14732];
    if (codigosJudiciais.includes(codigo)) return true;

    // Códigos administrativos
    const codigosAdministrativos = [245, 999, 1000];
    if (codigosAdministrativos.includes(codigo)) return false;

    // Palavras-chave judiciais
    const palavrasJudiciais = [
      'decisão', 'sentença', 'despacho', 'acórdão', 'liminar', 'tutela',
      'embargo', 'agravo', 'recurso', 'apelação', 'audiência', 'citação',
      'intimação', 'conclusão', 'julgado', 'transitado', 'expedição'
    ];

    return palavrasJudiciais.some(palavra => nome.includes(palavra));
  }

  // Consulta principal
  async consultarProcesso(numeroProcesso, maxRetries = 3) {
    const startTime = Date.now();
    
    console.log(`[DatajudService] Consultando processo: ${numeroProcesso}`);

    try {
      // Mapear tribunal
      const mapping = this.mapCNJToDatajud(numeroProcesso);
      if (!mapping.success) {
        throw new Error(mapping.error);
      }

      console.log(`[DatajudService] Tribunal identificado: ${mapping.tribunalCode} - ${mapping.tribunalName}`);

      const endpoint = mapping.endpoint;
      const url = `${this.config.baseUrl}/${endpoint}/_search`;
      const numeroLimpo = numeroProcesso.replace(/\D/g, '');

      const payload = {
        query: {
          match: {
            numeroProcesso: numeroLimpo
          }
        },
        size: 10,
        sort: [{ '@timestamp': { order: 'desc' } }]
      };

      let lastError = null;

      // Retry loop
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[DatajudService] Tentativa ${attempt}/${maxRetries}`);
          
          await this.applyRateLimit();

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `APIKey ${this.config.apiKey}`,
              'User-Agent': 'AutumnusJuris-v1.1.0-Server'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log(`[DatajudService] Resposta: ${data.hits.total.value} hits encontrados`);

          const queryDuration = Date.now() - startTime;

          if (data.hits.total.value === 0) {
            return {
              success: true, // Consulta foi bem-sucedida, apenas sem resultados
              processNumber: numeroProcesso,
              tribunal: mapping.tribunalCode,
              movements: [],
              totalMovements: 0,
              newMovements: 0,
              queryDuration,
              fromCache: false,
              source: 'datajud',
              message: 'Processo não encontrado na base DataJud'
            };
          }

          // Processar resultado
          const firstHit = data.hits.hits[0];
          const process = firstHit._source;

          let movements = [];
          if (process.movimentos && process.movimentos.length > 0) {
            movements = this.convertMovements(process.movimentos, numeroProcesso, mapping.tribunalCode);
          }

          console.log(`[DatajudService] Sucesso: ${movements.length} movimentações convertidas`);

          return {
            success: true,
            processNumber: numeroProcesso,
            tribunal: process.tribunal || mapping.tribunalCode,
            movements,
            totalMovements: movements.length,
            newMovements: movements.length,
            queryDuration,
            fromCache: false,
            source: 'datajud',
            processInfo: {
              dataAjuizamento: process.dataAjuizamento,
              grau: process.grau,
              sistema: process.sistema?.nome,
              classe: process.classe?.nome,
              assuntos: process.assuntos?.map(a => a.nome).join(', '),
              orgaoJulgador: process.orgaoJulgador?.nome
            }
          };

        } catch (error) {
          lastError = error;
          console.error(`[DatajudService] Tentativa ${attempt} falhou:`, error.message);
          
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`[DatajudService] Aguardando ${delay}ms antes da próxima tentativa`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError || new Error('Todas as tentativas falharam');

    } catch (error) {
      const queryDuration = Date.now() - startTime;
      console.error(`[DatajudService] Erro final:`, error);

      return {
        success: false,
        processNumber: numeroProcesso,
        tribunal: 'UNKNOWN',
        movements: [],
        totalMovements: 0,
        newMovements: 0,
        queryDuration,
        fromCache: false,
        source: 'datajud',
        error: error.message || 'Erro desconhecido na consulta DataJud'
      };
    }
  }

  // Processar lote
  async processarLote(processNumbers) {
    console.log(`[DatajudService] Processando lote de ${processNumbers.length} processos`);
    
    const results = [];
    const errors = [];
    let totalMovements = 0;
    const tribunalsSet = new Set();

    for (const processNumber of processNumbers) {
      try {
        const result = await this.consultarProcesso(processNumber);
        results.push(result);
        
        if (result.success) {
          totalMovements += result.totalMovements;
          tribunalsSet.add(result.tribunal);
        } else {
          errors.push(`${processNumber}: ${result.error}`);
        }

      } catch (error) {
        const errorMsg = `${processNumber}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`[DatajudService] Erro no lote:`, error);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      success: errors.length < processNumbers.length,
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

  // Teste de conectividade
  async testConnection() {
    const startTime = Date.now();
    
    try {
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
        message: error.message || 'Erro desconhecido',
        responseTime: Date.now() - startTime
      };
    }
  }
}

module.exports = DatajudService;
import {
  TribunalType,
  TribunalConfig,
  TribunalOperation,
  ConsultaTribunal,
  ConsultaResult,
  ConsultaResponse,
  BatchConsultaRequest,
  BatchConsultaResponse,
  TribunalMonitoringConfig,
  TribunalStats,
  ProcessoTribunalData,
  MovimentacaoTribunal,
  RecurringConfig,
  TRIBUNAL_NAMES,
  // Legacy imports para compatibilidade
  ProcessMovement,
  TribunalNotification,
  ProcessConsultation,
  HearingSchedule,
  PetitionFiling,
  TribunalSyncStatus
} from '../types/tribunalIntegration';

class TribunalIntegrationService {
  private apiClient: any;
  private configs: Map<TribunalType, TribunalConfig> = new Map();
  private activeConsultas: Map<string, ConsultaTribunal> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  // Configuração inicial dos tribunais
  private initializeConfigs(): void {
    // Configurações dos principais tribunais brasileiros
    const tribunalConfigs: TribunalConfig[] = [
      // Tribunais Estaduais - São Paulo
      {
        id: 'tjsp',
        nome: 'Tribunal de Justiça de São Paulo',
        uf: 'SP',
        jurisdicao: 'estadual',
        apiType: 'esaj',
        baseUrl: 'https://esaj.tjsp.jus.br/cpopg/open.do',
        certificateRequired: false,
        rateLimit: 60,
        timeout: 30000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias',
          'consulta_partes'
        ]
      },
      // Tribunais Estaduais - Rio de Janeiro  
      {
        id: 'tjrj',
        nome: 'Tribunal de Justiça do Rio de Janeiro',
        uf: 'RJ',
        jurisdicao: 'estadual',
        apiType: 'scraping',
        baseUrl: 'https://www4.tjrj.jus.br/consultaProcessoWebV2/consultaProc.do',
        certificateRequired: false,
        rateLimit: 60,
        timeout: 30000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      // Tribunais Estaduais - Minas Gerais
      {
        id: 'tjmg',
        nome: 'Tribunal de Justiça de Minas Gerais',
        uf: 'MG',
        jurisdicao: 'estadual',
        apiType: 'scraping',
        baseUrl: 'https://www4.tjmg.jus.br/juridico/sf/proc_complemento/proc_consulta_publica.jsp',
        certificateRequired: false,
        rateLimit: 60,
        timeout: 30000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes'
        ]
      },
      // Tribunais Estaduais - Rio Grande do Sul
      {
        id: 'tjrs',
        nome: 'Tribunal de Justiça do Rio Grande do Sul',
        uf: 'RS',
        jurisdicao: 'estadual', 
        apiType: 'scraping',
        baseUrl: 'https://www1.tjrs.jus.br/busca/?tb=proc',
        certificateRequired: false,
        rateLimit: 60,
        timeout: 30000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes'
        ]
      },
      // Tribunais Estaduais - Amapá
      {
        id: 'tjap',
        nome: 'Tribunal de Justiça do Amapá',
        uf: 'AP',
        jurisdicao: 'estadual',
        apiType: 'scraping',
        baseUrl: 'https://tucujuris.tjap.jus.br/tucujuris/pages/consultas/publico/consulta-publica-simples.jsf',
        certificateRequired: false,
        rateLimit: 60,
        timeout: 30000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes'
        ]
      },
      // Tribunais Federais - TRF1
      {
        id: 'trf1',
        nome: 'Tribunal Regional Federal da 1ª Região',
        uf: 'DF',
        jurisdicao: 'federal',
        apiType: 'pje',
        baseUrl: 'https://pje1g.trf1.jus.br/pje/ConsultaPublica/listView.seam',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias',
          'consulta_documentos'
        ]
      },
      // Tribunais Trabalhistas - TST
      {
        id: 'tst',
        nome: 'Tribunal Superior do Trabalho',
        uf: 'DF',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.tst.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      // Órgãos Federais - Receita Federal
      {
        id: 'receita_federal',
        nome: 'Receita Federal do Brasil',
        uf: 'DF',
        jurisdicao: 'administrativa',
        apiType: 'rest',
        baseUrl: 'https://cav.receita.fazenda.gov.br/api/v1/consulta',
        certificateRequired: true,
        rateLimit: 20,
        timeout: 60000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes'
        ]
      },
      // INSS
      {
        id: 'inss',
        nome: 'Instituto Nacional do Seguro Social',
        uf: 'DF',
        jurisdicao: 'administrativa',
        apiType: 'soap',
        baseUrl: 'https://meu.inss.gov.br/central/index.html',
        certificateRequired: true,
        rateLimit: 15,
        timeout: 60000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes'
        ]
      },
      
      // Tribunais Regionais do Trabalho
      
      // TRT 1ª Região - Rio de Janeiro
      {
        id: 'trt01',
        nome: 'TRT 1ª Região - Rio de Janeiro',
        uf: 'RJ',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt1.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 2ª Região - São Paulo
      {
        id: 'trt02',
        nome: 'TRT 2ª Região - São Paulo',
        uf: 'SP',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt2.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 3ª Região - Minas Gerais
      {
        id: 'trt03',
        nome: 'TRT 3ª Região - Minas Gerais',
        uf: 'MG',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt3.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 4ª Região - Rio Grande do Sul
      {
        id: 'trt04',
        nome: 'TRT 4ª Região - Rio Grande do Sul',
        uf: 'RS',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt4.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 5ª Região - Bahia
      {
        id: 'trt05',
        nome: 'TRT 5ª Região - Bahia',
        uf: 'BA',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt5.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 6ª Região - Pernambuco
      {
        id: 'trt06',
        nome: 'TRT 6ª Região - Pernambuco',
        uf: 'PE',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt6.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 7ª Região - Ceará
      {
        id: 'trt07',
        nome: 'TRT 7ª Região - Ceará',
        uf: 'CE',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt7.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 8ª Região - Pará e Amapá
      {
        id: 'trt08',
        nome: 'TRT 8ª Região - Pará e Amapá',
        uf: 'PA',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt8.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 9ª Região - Paraná
      {
        id: 'trt09',
        nome: 'TRT 9ª Região - Paraná',
        uf: 'PR',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt9.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 10ª Região - Distrito Federal e Tocantins
      {
        id: 'trt10',
        nome: 'TRT 10ª Região - DF e Tocantins',
        uf: 'DF',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt10.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 11ª Região - Amazonas e Roraima
      {
        id: 'trt11',
        nome: 'TRT 11ª Região - Amazonas e Roraima',
        uf: 'AM',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt11.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 12ª Região - Santa Catarina
      {
        id: 'trt12',
        nome: 'TRT 12ª Região - Santa Catarina',
        uf: 'SC',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt12.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 13ª Região - Paraíba
      {
        id: 'trt13',
        nome: 'TRT 13ª Região - Paraíba',
        uf: 'PB',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt13.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 14ª Região - Rondônia e Acre
      {
        id: 'trt14',
        nome: 'TRT 14ª Região - Rondônia e Acre',
        uf: 'RO',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt14.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 15ª Região - Interior de São Paulo
      {
        id: 'trt15',
        nome: 'TRT 15ª Região - Interior de SP',
        uf: 'SP',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt15.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 16ª Região - Maranhão
      {
        id: 'trt16',
        nome: 'TRT 16ª Região - Maranhão',
        uf: 'MA',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt16.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 17ª Região - Espírito Santo
      {
        id: 'trt17',
        nome: 'TRT 17ª Região - Espírito Santo',
        uf: 'ES',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt17.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 18ª Região - Goiás
      {
        id: 'trt18',
        nome: 'TRT 18ª Região - Goiás',
        uf: 'GO',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt18.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 19ª Região - Alagoas
      {
        id: 'trt19',
        nome: 'TRT 19ª Região - Alagoas',
        uf: 'AL',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt19.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 20ª Região - Sergipe
      {
        id: 'trt20',
        nome: 'TRT 20ª Região - Sergipe',
        uf: 'SE',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt20.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 21ª Região - Rio Grande do Norte
      {
        id: 'trt21',
        nome: 'TRT 21ª Região - Rio Grande do Norte',
        uf: 'RN',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt21.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 22ª Região - Piauí
      {
        id: 'trt22',
        nome: 'TRT 22ª Região - Piauí',
        uf: 'PI',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt22.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 23ª Região - Mato Grosso
      {
        id: 'trt23',
        nome: 'TRT 23ª Região - Mato Grosso',
        uf: 'MT',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt23.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TRT 24ª Região - Mato Grosso do Sul
      {
        id: 'trt24',
        nome: 'TRT 24ª Região - Mato Grosso do Sul',
        uf: 'MS',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.trt24.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 30,
        timeout: 45000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias'
        ]
      },
      
      // TST - Tribunal Superior do Trabalho
      {
        id: 'tst',
        nome: 'TST - Tribunal Superior do Trabalho',
        uf: 'DF',
        jurisdicao: 'trabalhista',
        apiType: 'pje',
        baseUrl: 'https://pje.tst.jus.br/consultaprocessual/detalhe-processo',
        certificateRequired: false,
        rateLimit: 20,
        timeout: 60000,
        active: true,
        supportedOperations: [
          'consulta_processo',
          'consulta_movimentacoes',
          'consulta_audiencias',
          'consulta_documentos'
        ]
      }
    ];

    tribunalConfigs.forEach(config => {
      this.configs.set(config.id, config);
    });
  }

  // Consulta individual de processo
  async consultarProcesso(
    processId: string,
    processNumber: string,
    tribunalType: TribunalType,
    operations: TribunalOperation[] = ['consulta_movimentacoes']
  ): Promise<ConsultaResponse> {
    try {
      const config = this.configs.get(tribunalType);
      if (!config) {
        throw new Error(`Tribunal ${tribunalType} não configurado`);
      }

      if (!config.active) {
        throw new Error(`Tribunal ${config.nome} está inativo`);
      }

      // Fazer consulta via backend API
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.25.132.0:3001/api';
      const response = await fetch(`${API_BASE_URL}/tribunals/consulta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processId,
          processNumber,
          tribunalType,
          operations
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      const consultaResponse: ConsultaResponse = await response.json();
      
      // Armazenar consulta no cache local
      this.activeConsultas.set(consultaResponse.consulta.id, consultaResponse.consulta);

      return consultaResponse;

    } catch (error) {
      throw new Error(`Erro na consulta do tribunal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Execução da consulta específica para cada tipo de tribunal
  private async executeConsulta(
    config: TribunalConfig,
    processNumber: string,
    operations: TribunalOperation[]
  ): Promise<ConsultaResult> {
    const startTime = Date.now();

    try {
      // Simular diferentes tipos de API
      switch (config.apiType) {
        case 'esaj':
          return await this.consultarESAJ(config, processNumber, operations);
        case 'pje':
          return await this.consultarPJE(config, processNumber, operations);
        case 'soap':
          return await this.consultarSOAP(config, processNumber, operations);
        case 'rest':
          return await this.consultarREST(config, processNumber, operations);
        case 'scraping':
          return await this.consultarScraping(config, processNumber, operations);
        default:
          throw new Error(`Tipo de API ${config.apiType} não suportado`);
      }
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        responseTime: Date.now() - startTime,
        tribunal: config.id,
        operation: operations[0],
        hasChanges: false
      };
    }
  }

  // Implementações específicas por tipo de API
  private async consultarESAJ(
    config: TribunalConfig,
    processNumber: string,
    operations: TribunalOperation[]
  ): Promise<ConsultaResult> {
    try {
      // Usar o serviço real do TJSP
      const { TJSPService } = await import('./tribunals/tjsp.service');
      const tjspService = new TJSPService();

      const startTime = Date.now();
      const result = await tjspService.consultarProcesso(processNumber);
      const responseTime = Date.now() - startTime;

      // Converter resultado para formato esperado
      const consultaResult: ConsultaResult = {
        success: true,
        timestamp: new Date().toISOString(),
        data: result,
        responseTime,
        tribunal: config.id,
        operation: operations[0],
        newMovements: result.movimentacoes || [],
        hasChanges: (result.movimentacoes?.length || 0) > 0
      };

      await tjspService.cleanup();
      return consultaResult;

    } catch (error) {
      console.error('Erro na consulta ESAJ real:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro na consulta TJSP',
        responseTime: 0,
        tribunal: config.id,
        operation: operations[0],
        hasChanges: false
      };
    }
  }

  private async consultarPJE(
    config: TribunalConfig,
    processNumber: string,
    operations: TribunalOperation[]
  ): Promise<ConsultaResult> {
    try {
      // Usar o serviço real do PJe
      const { PJeFactory } = await import('./tribunals/pje.service');
      
      let pjeService;
      
      // Determinar qual serviço PJe usar baseado no tribunal
      switch (config.id) {
        case 'trf1':
          pjeService = PJeFactory.createTRF1Service();
          break;
        case 'trf2':
          pjeService = PJeFactory.createTRF2Service();
          break;
        case 'trf3':
          pjeService = PJeFactory.createTRF3Service();
          break;
        case 'trf4':
          pjeService = PJeFactory.createTRF4Service();
          break;
        case 'trf5':
          pjeService = PJeFactory.createTRF5Service();
          break;
        case 'trf6':
          pjeService = PJeFactory.createTRF6Service();
          break;
        // TRTs - Tribunais Regionais do Trabalho
        case 'trt01':
        case 'trt02':
        case 'trt03':
        case 'trt04':
        case 'trt05':
        case 'trt06':
        case 'trt07':
        case 'trt08':
        case 'trt09':
        case 'trt10':
        case 'trt11':
        case 'trt12':
        case 'trt13':
        case 'trt14':
        case 'trt15':
        case 'trt16':
        case 'trt17':
        case 'trt18':
        case 'trt19':
        case 'trt20':
        case 'trt21':
        case 'trt22':
        case 'trt23':
        case 'trt24':
          // Extrair número da região do tribunal (ex: trt02 -> 02)
          const trtRegion = config.id.replace('trt', '');
          pjeService = PJeFactory.createTRTService(trtRegion);
          break;
        case 'tst':
          pjeService = PJeFactory.createTSTService();
          break;
        default:
          // Para outros tribunais PJe
          pjeService = PJeFactory.createTRF1Service(); // Usar TRF1 como padrão
      }

      const startTime = Date.now();
      const result = await pjeService.consultarProcesso(processNumber);
      const responseTime = Date.now() - startTime;

      const consultaResult: ConsultaResult = {
        success: true,
        timestamp: new Date().toISOString(),
        data: result,
        responseTime,
        tribunal: config.id,
        operation: operations[0],
        newMovements: result.movimentacoes || [],
        hasChanges: (result.movimentacoes?.length || 0) > 0
      };

      await pjeService.cleanup();
      return consultaResult;

    } catch (error) {
      console.error('Erro na consulta PJe real:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro na consulta PJe',
        responseTime: 0,
        tribunal: config.id,
        operation: operations[0],
        hasChanges: false
      };
    }
  }

  private async consultarSOAP(
    config: TribunalConfig,
    processNumber: string,
    operations: TribunalOperation[]
  ): Promise<ConsultaResult> {
    try {
      // Usar o serviço real do INSS
      const { INSSService } = await import('./tribunals/inss.service');
      const inssService = new INSSService();

      const startTime = Date.now();
      
      // Simular CPF para consulta (em produção, viria dos dados do processo)
      const cpfSimulado = '12345678900';
      const result = await inssService.consultarProcesso(processNumber, cpfSimulado);
      const responseTime = Date.now() - startTime;

      const consultaResult: ConsultaResult = {
        success: true,
        timestamp: new Date().toISOString(),
        data: result,
        responseTime,
        tribunal: config.id,
        operation: operations[0],
        newMovements: result.movimentacoes || [],
        hasChanges: (result.movimentacoes?.length || 0) > 0
      };

      await inssService.cleanup();
      return consultaResult;

    } catch (error) {
      console.error('Erro na consulta INSS real:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro na consulta INSS',
        responseTime: 0,
        tribunal: config.id,
        operation: operations[0],
        hasChanges: false
      };
    }
  }

  private async consultarREST(
    config: TribunalConfig,
    processNumber: string,
    operations: TribunalOperation[]
  ): Promise<ConsultaResult> {
    try {
      // Usar o serviço real da Receita Federal
      const { ReceitaFederalService } = await import('./tribunals/receitaFederal.service');
      const receitaService = new ReceitaFederalService();

      const startTime = Date.now();
      
      // Simular CPF/CNPJ para consulta (em produção, viria dos dados do processo)
      const cpfCnpjSimulado = '12345678900';
      const result = await receitaService.consultarProcesso(processNumber, cpfCnpjSimulado);
      const responseTime = Date.now() - startTime;

      const consultaResult: ConsultaResult = {
        success: true,
        timestamp: new Date().toISOString(),
        data: result,
        responseTime,
        tribunal: config.id,
        operation: operations[0],
        newMovements: result.movimentacoes || [],
        hasChanges: (result.movimentacoes?.length || 0) > 0
      };

      await receitaService.cleanup();
      return consultaResult;

    } catch (error) {
      console.error('Erro na consulta Receita Federal real:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro na consulta Receita Federal',
        responseTime: 0,
        tribunal: config.id,
        operation: operations[0],
        hasChanges: false
      };
    }
  }

  private async consultarScraping(
    config: TribunalConfig,
    processNumber: string,
    operations: TribunalOperation[]
  ): Promise<ConsultaResult> {
    try {
      // Usar o serviço real de scraping
      const { TribunalScraper } = await import('./tribunalScraper.service');
      const scraper = new TribunalScraper();

      const startTime = Date.now();
      const result = await scraper.scrapeProcess(config.id as any, processNumber);
      const responseTime = Date.now() - startTime;

      const consultaResult: ConsultaResult = {
        success: true,
        timestamp: new Date().toISOString(),
        data: result,
        responseTime,
        tribunal: config.id,
        operation: operations[0],
        newMovements: result.movimentacoes || [],
        hasChanges: (result.movimentacoes?.length || 0) > 0
      };

      await scraper.cleanup();
      return consultaResult;

    } catch (error) {
      console.error('Erro no scraping real:', error);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro no scraping do tribunal',
        responseTime: 0,
        tribunal: config.id,
        operation: operations[0],
        hasChanges: false
      };
    }
  }

  // Consulta em lote
  async consultarProcessosLote(request: BatchConsultaRequest): Promise<BatchConsultaResponse> {
    const batchId = this.generateBatchId();
    const consultas: ConsultaTribunal[] = [];

    for (const processId of request.processIds) {
      for (const tribunal of request.tribunais) {
        const consulta: ConsultaTribunal = {
          id: this.generateConsultaId(),
          processId,
          processNumber: `${processId}-processo`, // Simular número do processo
          tribunalType: tribunal,
          operation: request.operations[0],
          status: 'pending',
          scheduledAt: request.scheduleFor || new Date().toISOString(),
          attempts: 0,
          maxAttempts: 3,
          priority: request.priority,
          recurring: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        consultas.push(consulta);
      }
    }

    // Simular processamento em background
    setTimeout(() => {
      this.processBatchConsultas(consultas);
    }, 1000);

    return {
      batchId,
      consultas,
      estimatedCompletion: new Date(Date.now() + consultas.length * 3000).toISOString(),
      totalProcesses: request.processIds.length,
      status: 'queued'
    };
  }

  // Processamento das consultas em lote
  private async processBatchConsultas(consultas: ConsultaTribunal[]): Promise<void> {
    for (const consulta of consultas) {
      try {
        const config = this.configs.get(consulta.tribunalType);
        if (!config) continue;

        consulta.status = 'in_progress';
        consulta.startedAt = new Date().toISOString();

        const result = await this.executeConsulta(config, consulta.processNumber, [consulta.operation]);
        
        consulta.status = result.success ? 'completed' : 'failed';
        consulta.completedAt = new Date().toISOString();
        consulta.result = result;

        this.activeConsultas.set(consulta.id, consulta);

        // Simular delay entre consultas para respeitar rate limiting
        await this.delay(1000);
      } catch (error) {
        consulta.status = 'failed';
        consulta.lastError = error instanceof Error ? error.message : 'Erro desconhecido';
        consulta.completedAt = new Date().toISOString();
      }
    }
  }

  // Configurar monitoramento recorrente
  async configurarMonitoramento(config: TribunalMonitoringConfig): Promise<void> {
    const jobId = `${config.processId}-${config.tribunalType}`;
    
    // Cancelar job anterior se existir
    if (this.scheduledJobs.has(jobId)) {
      clearInterval(this.scheduledJobs.get(jobId)!);
    }

    if (!config.active) {
      this.scheduledJobs.delete(jobId);
      return;
    }

    // Calcular intervalo em milissegundos
    const intervalMs = this.calculateIntervalMs(config.recurringConfig);
    
    const intervalId = setInterval(async () => {
      try {
        await this.consultarProcesso(
          config.processId,
          `${config.processId}-processo`, // Simular número do processo
          config.tribunalType,
          config.operations
        );
      } catch (error) {
        console.error(`Erro na consulta recorrente: ${error}`);
      }
    }, intervalMs);

    this.scheduledJobs.set(jobId, intervalId);
  }

  // Calcular intervalo em milissegundos
  private calculateIntervalMs(config: RecurringConfig): number {
    const baseMs = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    return baseMs[config.interval] * config.frequency;
  }

  // Obter estatísticas do tribunal
  getTribunalStats(tribunalType: TribunalType): TribunalStats {
    return {
      tribunalType,
      totalConsultas: Math.floor(Math.random() * 1000) + 100,
      consultasRealizadas: Math.floor(Math.random() * 900) + 80,
      consultasFalharam: Math.floor(Math.random() * 50) + 5,
      ultimaConsulta: new Date().toISOString(),
      tempoMedioResposta: Math.floor(Math.random() * 5000) + 1000,
      taxaSucesso: Math.random() * 0.3 + 0.7, // 70-100%
      movimentacoesEncontradas: Math.floor(Math.random() * 500) + 50,
      processosMonitorados: Math.floor(Math.random() * 100) + 10,
      status: Math.random() > 0.1 ? 'online' : 'instavel',
      proximaManutencao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Obter configurações disponíveis
  getTribunaisDisponiveis(): TribunalConfig[] {
    return Array.from(this.configs.values());
  }

  // Obter configuração específica
  getTribunalConfig(tribunalType: TribunalType): TribunalConfig | undefined {
    return this.configs.get(tribunalType);
  }

  // Atualizar configuração
  updateTribunalConfigNew(tribunalType: TribunalType, updates: Partial<TribunalConfig>): void {
    const existing = this.configs.get(tribunalType);
    if (existing) {
      this.configs.set(tribunalType, { ...existing, ...updates });
    }
  }

  // Utilities
  private generateConsultaId(): string {
    return `consulta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  destroy(): void {
    this.scheduledJobs.forEach(job => clearInterval(job));
    this.scheduledJobs.clear();
    this.activeConsultas.clear();
  }

  // ===== MÉTODOS LEGADOS PARA COMPATIBILIDADE =====
  // Mock data para demonstração
  private mockConfigs: any[] = [
    {
      id: 'tjsp-001',
      name: 'TJSP - Tribunal de Justiça de São Paulo',
      type: 'tjsp',
      apiUrl: 'https://esaj.tjsp.jus.br/esaj',
      isActive: true,
      supportedFeatures: [
        'process_consultation',
        'movement_tracking',
        'document_download',
        'hearing_schedule'
      ]
    },
    {
      id: 'tjrj-001',
      name: 'TJRJ - Tribunal de Justiça do Rio de Janeiro',
      type: 'tjrj',
      apiUrl: 'https://www4.tjrj.jus.br',
      isActive: false,
      supportedFeatures: [
        'process_consultation',
        'movement_tracking',
        'notification_receipt'
      ]
    }
  ];

  private mockNotifications: TribunalNotification[] = [
    {
      id: 'notif-1',
      processNumber: '1001234-12.2025.8.26.0100',
      tribunal: 'TJSP',
      type: 'intimation',
      title: 'Intimação para apresentar defesa',
      content: 'Fica a parte intimada para apresentar defesa no prazo de 15 dias.',
      deadline: '2025-02-10T23:59:59Z',
      isRead: false,
      receivedAt: '2025-01-26T09:00:00Z',
      documentUrl: '/documents/intimacao-123.pdf'
    },
    {
      id: 'notif-2',
      processNumber: '2002345-23.2025.8.26.0200',
      tribunal: 'TJSP',
      type: 'decision',
      title: 'Decisão Interlocutória',
      content: 'Foi proferida decisão interlocutória nos autos.',
      isRead: true,
      receivedAt: '2025-01-25T14:30:00Z',
      documentUrl: '/documents/decisao-456.pdf'
    }
  ];

  private mockMovements: ProcessMovement[] = [
    {
      id: 'mov-1',
      processNumber: '1001234-12.2025.8.26.0100',
      date: '2025-01-26T09:00:00Z',
      description: 'Juntada de petição inicial',
      type: 'petition',
      tribunal: 'TJSP',
      lastSync: '2025-01-26T09:05:00Z'
    },
    {
      id: 'mov-2',
      processNumber: '1001234-12.2025.8.26.0100',
      date: '2025-01-25T16:30:00Z',
      description: 'Decisão de recebimento da inicial',
      type: 'decision',
      documentUrl: '/documents/decisao-recebimento.pdf',
      tribunal: 'TJSP',
      lastSync: '2025-01-26T09:05:00Z'
    }
  ];

  private mockHearings: HearingSchedule[] = [
    {
      id: 'hearing-1',
      processNumber: '1001234-12.2025.8.26.0100',
      tribunal: 'TJSP',
      date: '2025-02-15',
      time: '14:00',
      type: 'conciliation',
      location: 'Sala 205 - Fórum Central',
      judge: 'Dr. João Silva',
      status: 'scheduled',
      observations: 'Audiência de conciliação designada'
    }
  ];

  async getTribunalConfigs(): Promise<TribunalConfig[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.mockConfigs]), 300);
    });
  }

  async updateTribunalConfig(config: TribunalConfig): Promise<TribunalConfig> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.mockConfigs.findIndex(c => c.id === config.id);
        if (index > -1) {
          this.mockConfigs[index] = config;
        } else {
          this.mockConfigs.push(config);
        }
        resolve(config);
      }, 500);
    });
  }

  async testTribunalConnection(tribunalId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.mockConfigs.find(c => c.id === tribunalId);
        if (!config) {
          resolve({ success: false, message: 'Configuração de tribunal não encontrada' });
          return;
        }
        
        if (!config.isActive) {
          resolve({ success: false, message: 'Tribunal não está ativo' });
          return;
        }

        // Simulação de teste de conexão
        resolve({ success: true, message: 'Conexão estabelecida com sucesso' });
      }, 1500);
    });
  }

  async consultProcess(processNumber: string, tribunal?: string): Promise<ProcessConsultation> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!processNumber.match(/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/)) {
          reject(new Error('Número de processo inválido'));
          return;
        }

        const consultation: ProcessConsultation = {
          processNumber,
          tribunal: tribunal || 'TJSP',
          status: 'active',
          subject: 'Ação de Cobrança',
          distributionDate: '2025-01-20T10:00:00Z',
          judge: 'Dr. João Silva',
          court: '1ª Vara Cível Central',
          parties: [
            {
              name: 'João da Silva Advocacia LTDA',
              type: 'author',
              lawyer: 'João Silva',
              oab: 'OAB/SP 123456'
            },
            {
              name: 'Maria Santos',
              type: 'defendant'
            }
          ],
          movements: this.mockMovements.filter(m => m.processNumber === processNumber),
          lastMovement: this.mockMovements.find(m => m.processNumber === processNumber)
        };

        resolve(consultation);
      }, 1000);
    });
  }

  async getProcessMovements(processNumber: string): Promise<ProcessMovement[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const movements = this.mockMovements.filter(m => m.processNumber === processNumber);
        resolve(movements);
      }, 500);
    });
  }

  async getTribunalNotifications(isRead?: boolean): Promise<TribunalNotification[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let notifications = [...this.mockNotifications];
        if (typeof isRead === 'boolean') {
          notifications = notifications.filter(n => n.isRead === isRead);
        }
        resolve(notifications);
      }, 300);
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notification = this.mockNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }

  async getHearingSchedule(processNumber?: string): Promise<HearingSchedule[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let hearings = [...this.mockHearings];
        if (processNumber) {
          hearings = hearings.filter(h => h.processNumber === processNumber);
        }
        resolve(hearings);
      }, 400);
    });
  }

  async syncTribunalData(tribunalId: string): Promise<TribunalSyncStatus> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const config = this.mockConfigs.find(c => c.id === tribunalId);
        if (!config) {
          resolve({
            tribunal: tribunalId,
            lastSync: new Date().toISOString(),
            status: 'error',
            processesUpdated: 0,
            notificationsReceived: 0,
            errors: ['Configuração de tribunal não encontrada']
          });
          return;
        }

        // Simulação de sincronização
        resolve({
          tribunal: config.name,
          lastSync: new Date().toISOString(),
          status: 'success',
          processesUpdated: Math.floor(Math.random() * 10) + 1,
          notificationsReceived: Math.floor(Math.random() * 5) + 1
        });
      }, 3000);
    });
  }

  async syncAllTribunals(): Promise<TribunalSyncStatus[]> {
    const activeConfigs = this.mockConfigs.filter(c => c.isActive);
    const syncPromises = activeConfigs.map(config => this.syncTribunalData(config.id));
    return Promise.all(syncPromises);
  }

  // Funcionalidade de peticionamento eletrônico (estrutura básica)
  async submitPetition(petition: Omit<PetitionFiling, 'id' | 'status' | 'submittedAt'>): Promise<PetitionFiling> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filedPetition: PetitionFiling = {
          ...petition,
          id: `petition-${Date.now()}`,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          protocolNumber: `${Date.now()}`
        };
        resolve(filedPetition);
      }, 2000);
    });
  }

  async getPetitionStatus(petitionId: string): Promise<PetitionFiling | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock de consulta de status de petição
        if (Math.random() > 0.3) {
          resolve({
            id: petitionId,
            processNumber: '1001234-12.2025.8.26.0100',
            tribunal: 'TJSP',
            type: 'petition',
            title: 'Petição de Defesa',
            documents: [],
            status: 'accepted',
            submittedAt: '2025-01-26T10:00:00Z',
            protocolNumber: '123456789'
          });
        } else {
          resolve(null);
        }
      }, 800);
    });
  }
}

export const tribunalIntegrationService = new TribunalIntegrationService();
export default tribunalIntegrationService;
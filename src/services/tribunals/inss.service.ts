// src/services/tribunals/inss.service.ts

import { RealTribunalClient } from '../realTribunalClient.service';
import { ProcessoTribunalData, MovimentacaoTribunal } from '@/types/tribunalIntegration';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

interface ConsultaINSS {
  numeroProcesso: string;
  cpf: string;
  nit?: string;
}

interface BeneficioINSS {
  numeroProcesso: string;
  numerobeneficio: string;
  situacao: string;
  especieBeneficio: string;
  dataInicio: string;
  dataFim?: string;
  valorRenda: number;
}

interface ProcessoINSS {
  numeroProcesso: string;
  protocolo: string;
  situacao: string;
  dataProtocolizacao: string;
  orgaoProtocolizador: string;
  assunto: string;
  interessado: string;
  movimentacoes: MovimentacaoINSS[];
}

interface MovimentacaoINSS {
  data: string;
  descricao: string;
  orgao: string;
  situacao: string;
}

class INSSService {
  private client: RealTribunalClient;

  constructor() {
    this.client = new RealTribunalClient({
      baseURL: 'https://meu.inss.gov.br',
      timeout: 60000, // INSS pode ser lento
      rateLimitDelay: 3000, // 3 segundos entre requisições
      retryAttempts: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      enableCookies: true
    });
  }

  // Consultar processo administrativo no INSS
  async consultarProcesso(numeroProcesso: string, cpf: string): Promise<ProcessoTribunalData> {
    try {
      // Primeiro, acessar a página de login/consulta
      const initialResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/portal/login'
      });

      // Para consultas públicas, usar o sistema DATAPREV
      const consultaResponse = await this.client.makeRequest({
        method: 'GET',
        url: `/dataprev/ConsultaProcesso?numero=${numeroProcesso}&cpf=${cpf}`
      });

      return this.parseProcessINSS(consultaResponse.data, numeroProcesso);
    } catch (error) {
      throw new Error(`Erro na consulta INSS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar benefícios vinculados ao CPF
  async consultarBeneficios(cpf: string, nit?: string): Promise<BeneficioINSS[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'POST',
        url: '/portal/beneficio/consulta',
        data: new URLSearchParams({
          'cpf': cpf,
          'nit': nit || '',
          'consulta': 'beneficios'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      return this.parseBeneficiosINSS(response.data);
    } catch (error) {
      throw new Error(`Erro na consulta de benefícios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar extrato de contribuições
  async consultarExtratoContribuicoes(cpf: string): Promise<any[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/cnis/extrato?cpf=${cpf}`
      });

      const $ = cheerio.load(response.data);
      const contribuicoes: any[] = [];

      $('.extrato-contribuicao tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');

        if (cells.length >= 4) {
          contribuicoes.push({
            competencia: cells.eq(0).text().trim(),
            salarioContribuicao: this.parseValor(cells.eq(1).text().trim()),
            empresa: cells.eq(2).text().trim(),
            situacao: cells.eq(3).text().trim()
          });
        }
      });

      return contribuicoes;
    } catch (error) {
      throw new Error(`Erro na consulta de contribuições: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar períodos de carência
  async consultarCarencia(cpf: string): Promise<any> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/carencia/consulta?cpf=${cpf}`
      });

      const $ = cheerio.load(response.data);
      
      return {
        carenciaAposentadoria: this.extractNumber($('.carencia-aposentadoria').text()),
        carenciaAuxilioDoenca: this.extractNumber($('.carencia-auxilio').text()),
        tempoContribuicao: this.extractNumber($('.tempo-contribuicao').text()),
        proximaRevisao: this.parseDate($('.proxima-revisao').text())
      };
    } catch (error) {
      throw new Error(`Erro na consulta de carência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar requerimentos em andamento
  async consultarRequerimentos(cpf: string): Promise<ProcessoTribunalData[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/requerimentos/consulta?cpf=${cpf}`
      });

      const $ = cheerio.load(response.data);
      const requerimentos: ProcessoTribunalData[] = [];

      $('.requerimento-item').each((i, item) => {
        const $item = $(item);
        
        const processo: ProcessoTribunalData = {
          numero: $item.find('.numero-requerimento').text().trim(),
          classe: 'Requerimento Administrativo',
          assunto: $item.find('.tipo-beneficio').text().trim(),
          dataAjuizamento: this.parseDate($item.find('.data-protocolo').text().trim()),
          situacao: $item.find('.situacao-requerimento').text().trim(),
          localizacao: 'INSS',
          orgaoJulgador: 'Instituto Nacional do Seguro Social',
          partes: [{
            nome: 'Segurado',
            tipo: 'autor',
            documento: cpf
          }],
          advogados: [],
          movimentacoes: this.extractMovimentacoesRequerimento($item),
          audiencias: [],
          documentos: [],
          recursos: []
        };

        requerimentos.push(processo);
      });

      return requerimentos;
    } catch (error) {
      throw new Error(`Erro na consulta de requerimentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar perícia médica agendada
  async consultarPericia(cpf: string): Promise<any[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/pericia/consulta?cpf=${cpf}`
      });

      const $ = cheerio.load(response.data);
      const pericias: any[] = [];

      $('.pericia-agendada').each((i, item) => {
        const $item = $(item);
        
        pericias.push({
          numeroRequerimento: $item.find('.numero-req').text().trim(),
          dataPericia: this.parseDate($item.find('.data-pericia').text().trim()),
          horaPericia: $item.find('.hora-pericia').text().trim(),
          localPericia: $item.find('.local-pericia').text().trim(),
          tipoPericia: $item.find('.tipo-pericia').text().trim(),
          medicoPeritoResponsavel: $item.find('.medico-perito').text().trim()
        });
      });

      return pericias;
    } catch (error) {
      throw new Error(`Erro na consulta de perícia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private parseProcessINSS(html: string, numeroProcesso: string): ProcessoTribunalData {
    const $ = cheerio.load(html);

    // Verificar se encontrou o processo
    if ($('.erro-consulta').length > 0 || $('span:contains("não foi encontrado")').length > 0) {
      throw new Error('Processo não encontrado no INSS');
    }

    const dados: ProcessoTribunalData = {
      numero: numeroProcesso,
      classe: 'Processo Administrativo',
      assunto: '',
      dataAjuizamento: '',
      situacao: 'Em andamento',
      localizacao: 'INSS',
      orgaoJulgador: 'Instituto Nacional do Seguro Social',
      partes: [],
      advogados: [],
      movimentacoes: [],
      audiencias: [],
      documentos: [],
      recursos: []
    };

    // Extrair informações básicas
    $('.dados-processo tr, .info-requerimento tr').each((i, row) => {
      const $row = $(row);
      const label = $row.find('td:first-child, th:first-child').text().trim().toLowerCase();
      const value = $row.find('td:last-child').text().trim();

      switch (label) {
        case 'situação':
        case 'status':
          dados.situacao = value;
          break;
        case 'assunto':
        case 'tipo de benefício':
        case 'espécie':
          dados.assunto = value;
          break;
        case 'data de protocolo':
        case 'data protocolização':
          dados.dataAjuizamento = this.parseDate(value);
          break;
        case 'órgão':
        case 'unidade protocolizadora':
          dados.orgaoJulgador = value;
          dados.localizacao = value;
          break;
        case 'interessado':
        case 'segurado':
          dados.partes.push({
            nome: value,
            tipo: 'autor',
            documento: this.extractCPF(value)
          });
          break;
      }
    });

    // Extrair movimentações
    dados.movimentacoes = this.extractMovimentacoesINSS($);

    return dados;
  }

  private parseBeneficiosINSS(html: string): BeneficioINSS[] {
    const $ = cheerio.load(html);
    const beneficios: BeneficioINSS[] = [];

    $('.beneficio-item, .lista-beneficios tr').each((i, item) => {
      const $item = $(item);
      
      // Pular cabeçalho se for tabela
      if ($item.find('th').length > 0) return;

      const numero = $item.find('.numero-beneficio, td:nth-child(1)').text().trim();
      if (numero) {
        beneficios.push({
          numeroProcesso: '', // Será preenchido se disponível
          numerobeneficio: numero,
          situacao: $item.find('.situacao-beneficio, td:nth-child(2)').text().trim(),
          especieBeneficio: $item.find('.especie-beneficio, td:nth-child(3)').text().trim(),
          dataInicio: this.parseDate($item.find('.data-inicio, td:nth-child(4)').text().trim()),
          dataFim: this.parseDate($item.find('.data-fim, td:nth-child(5)').text().trim()) || undefined,
          valorRenda: this.parseValor($item.find('.valor-renda, td:nth-child(6)').text().trim())
        });
      }
    });

    return beneficios;
  }

  private extractMovimentacoesINSS($: cheerio.CheerioAPI): MovimentacaoTribunal[] {
    const movimentacoes: MovimentacaoTribunal[] = [];

    // Procurar tabela de histórico/movimentações
    $('.historico-processo tr, .movimentacoes-inss tr, .timeline-inss .evento').each((i, row) => {
      const $row = $(row);
      
      // Para linha de tabela
      const cells = $row.find('td');
      if (cells.length >= 2) {
        const data = cells.eq(0).text().trim();
        const descricao = cells.eq(1).text().trim();
        const orgao = cells.length > 2 ? cells.eq(2).text().trim() : 'INSS';

        if (data && descricao && this.isValidDate(data)) {
          movimentacoes.push({
            id: `inss-mov-${i}`,
            data: this.parseDate(data),
            titulo: this.extractTitulo(descricao),
            descricao: `${descricao} - Órgão: ${orgao}`,
            oficial: true
          });
        }
      }
      
      // Para formato timeline
      const data = $row.find('.data-evento').text().trim();
      const descricao = $row.find('.descricao-evento').text().trim();
      
      if (data && descricao && this.isValidDate(data)) {
        movimentacoes.push({
          id: `inss-mov-${i}`,
          data: this.parseDate(data),
          titulo: this.extractTitulo(descricao),
          descricao,
          oficial: true
        });
      }
    });

    return movimentacoes.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }

  private extractMovimentacoesRequerimento($item: cheerio.Cheerio<any>): MovimentacaoTribunal[] {
    const movimentacoes: MovimentacaoTribunal[] = [];

    $item.find('.historico-req .movimento').each((i, mov) => {
      const $mov = $(mov);
      const data = $mov.find('.data').text().trim();
      const descricao = $mov.find('.descricao').text().trim();

      if (data && descricao && this.isValidDate(data)) {
        movimentacoes.push({
          id: `inss-req-${i}`,
          data: this.parseDate(data),
          titulo: this.extractTitulo(descricao),
          descricao,
          oficial: true
        });
      }
    });

    return movimentacoes;
  }

  // Consultar agendamentos disponíveis
  async consultarAgendamentos(cpf: string, servico: string): Promise<any[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/agendamento/disponibilidade?cpf=${cpf}&servico=${servico}`
      });

      const $ = cheerio.load(response.data);
      const agendamentos: any[] = [];

      $('.agenda-disponivel').each((i, item) => {
        const $item = $(item);
        
        agendamentos.push({
          data: this.parseDate($item.find('.data-agenda').text().trim()),
          hora: $item.find('.hora-agenda').text().trim(),
          unidade: $item.find('.unidade-agenda').text().trim(),
          endereco: $item.find('.endereco-agenda').text().trim(),
          telefone: $item.find('.telefone-agenda').text().trim()
        });
      });

      return agendamentos;
    } catch (error) {
      throw new Error(`Erro na consulta de agendamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Métodos utilitários
  private parseDate(dateString: string): string {
    if (!dateString) return '';
    
    const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, dia, mes, ano] = match;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    return '';
  }

  private parseValor(valorString: string): number {
    if (!valorString) return 0;
    return parseFloat(valorString.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }

  private isValidDate(dateString: string): boolean {
    const match = dateString.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    return !!match;
  }

  private extractTitulo(descricao: string): string {
    const linhas = descricao.split('\n');
    let titulo = linhas[0].trim();
    
    if (titulo.length > 100) {
      titulo = titulo.substring(0, 100) + '...';
    }
    
    return titulo || 'Movimentação INSS';
  }

  private extractCPF(texto: string): string | undefined {
    const cpfMatch = texto.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
    return cpfMatch ? cpfMatch[0] : undefined;
  }

  private extractNumber(texto: string): number {
    const match = texto.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  async verificarDisponibilidade(): Promise<boolean> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: '/',
        timeout: 10000
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.client.cleanup();
  }
}

export { INSSService };
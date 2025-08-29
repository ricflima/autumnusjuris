// src/services/tribunals/receitaFederal.service.ts

import { RealTribunalClient } from '../realTribunalClient.service';
import { ProcessoTribunalData, MovimentacaoTribunal } from '@/types/tribunalIntegration';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

interface ConsultaCAV {
  numeroProcesso: string;
  cpfCnpj: string;
  palavraChave?: string;
}

interface ProcessoCAV {
  numeroProcesso: string;
  situacao: string;
  orgaoJulgador: string;
  dataAbertura: string;
  assunto: string;
  interessado: string;
  movimentacoes: MovimentacaoCAV[];
}

interface MovimentacaoCAV {
  data: string;
  descricao: string;
  responsavel: string;
  situacao: string;
}

class ReceitaFederalService {
  private client: RealTribunalClient;

  constructor() {
    this.client = new RealTribunalClient({
      baseURL: 'https://cav.receita.fazenda.gov.br',
      timeout: 60000, // Receita Federal é mais lenta
      rateLimitDelay: 5000, // 5 segundos entre requisições
      retryAttempts: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      enableCookies: true
    });
  }

  // Consultar processo administrativo fiscal
  async consultarProcesso(numeroProcesso: string, cpfCnpj: string): Promise<ProcessoTribunalData> {
    try {
      // Primeiro, acessar a página de consulta
      const initialResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/aplicacoes/atidc/sicav/ConsultaPublicaProcessos/paginas/ConsultaPublica.aspx'
      });

      const $ = cheerio.load(initialResponse.data);
      
      // Extrair tokens necessários
      const viewState = $('input[name="__VIEWSTATE"]').val() || '';
      const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val() || '';
      const eventValidation = $('input[name="__EVENTVALIDATION"]').val() || '';

      // Preparar dados da consulta
      const formData = new URLSearchParams({
        '__EVENTTARGET': '',
        '__EVENTARGUMENT': '',
        '__VIEWSTATE': viewState as string,
        '__VIEWSTATEGENERATOR': viewStateGenerator as string,
        '__EVENTVALIDATION': eventValidation as string,
        'ctl00$cphConteudo$txtNumeroProcesso': numeroProcesso,
        'ctl00$cphConteudo$txtCpfCnpj': cpfCnpj,
        'ctl00$cphConteudo$btnConsultar': 'Consultar'
      });

      // Fazer a consulta
      const consultaResponse = await this.client.makeRequest({
        method: 'POST',
        url: '/aplicacoes/atidc/sicav/ConsultaPublicaProcessos/paginas/ConsultaPublica.aspx',
        data: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://cav.receita.fazenda.gov.br/aplicacoes/atidc/sicav/ConsultaPublicaProcessos/paginas/ConsultaPublica.aspx'
        }
      });

      return this.parseProcessCAV(consultaResponse.data, numeroProcesso);
    } catch (error) {
      throw new Error(`Erro na consulta Receita Federal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar CARF (Conselho Administrativo de Recursos Fiscais)
  async consultarCARP(numeroProcesso: string): Promise<ProcessoTribunalData> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/aplicacoes/atidc/carf/consulta/consultaPublica.aspx?numProc=${numeroProcesso}`
      });

      return this.parseProcessCARP(response.data, numeroProcesso);
    } catch (error) {
      throw new Error(`Erro na consulta CARF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private parseProcessCAV(html: string, numeroProcesso: string): ProcessoTribunalData {
    const $ = cheerio.load(html);

    // Verificar se encontrou o processo
    if ($('.erro, .mensagem-erro').length > 0 || $('span:contains("Não foram encontrados")').length > 0) {
      throw new Error('Processo não encontrado na Receita Federal');
    }

    const dados: ProcessoTribunalData = {
      numero: numeroProcesso,
      classe: 'Processo Administrativo Fiscal',
      assunto: '',
      dataAjuizamento: '',
      situacao: 'Em andamento',
      localizacao: 'Receita Federal do Brasil',
      orgaoJulgador: 'Receita Federal',
      partes: [],
      advogados: [],
      movimentacoes: [],
      audiencias: [],
      documentos: [],
      recursos: []
    };

    // Extrair informações básicas
    $('table.dados-processo tr, .info-processo tr').each((i, row) => {
      const $row = $(row);
      const label = $row.find('td:first-child, th:first-child').text().trim();
      const value = $row.find('td:last-child').text().trim();

      switch (label.toLowerCase()) {
        case 'situação':
        case 'status':
          dados.situacao = value;
          break;
        case 'assunto':
        case 'matéria':
          dados.assunto = value;
          break;
        case 'data de abertura':
        case 'data autuação':
          dados.dataAjuizamento = this.parseDate(value);
          break;
        case 'órgão':
        case 'unidade':
          dados.orgaoJulgador = value;
          dados.localizacao = value;
          break;
        case 'interessado':
        case 'contribuinte':
          dados.partes.push({
            nome: value,
            tipo: 'autor',
            documento: this.extractDocumento(value)
          });
          break;
      }
    });

    // Extrair movimentações
    dados.movimentacoes = this.extractMovimentacoesCAV($);

    return dados;
  }

  private parseProcessCARP(html: string, numeroProcesso: string): ProcessoTribunalData {
    const $ = cheerio.load(html);

    const dados: ProcessoTribunalData = {
      numero: numeroProcesso,
      classe: 'Recurso Administrativo',
      assunto: '',
      dataAjuizamento: '',
      situacao: 'Em andamento',
      localizacao: 'CARF',
      orgaoJulgador: 'Conselho Administrativo de Recursos Fiscais',
      partes: [],
      advogados: [],
      movimentacoes: [],
      audiencias: [],
      documentos: [],
      recursos: []
    };

    // Extrair dados do CARF
    $('.dados-processo, .info-recurso').find('tr').each((i, row) => {
      const $row = $(row);
      const label = $row.find('td:first-child').text().trim();
      const value = $row.find('td:last-child').text().trim();

      if (label.toLowerCase().includes('situação')) {
        dados.situacao = value;
      } else if (label.toLowerCase().includes('assunto')) {
        dados.assunto = value;
      } else if (label.toLowerCase().includes('data')) {
        dados.dataAjuizamento = this.parseDate(value);
      }
    });

    // Extrair movimentações do CARF
    dados.movimentacoes = this.extractMovimentacoesCARP($);

    return dados;
  }

  private extractMovimentacoesCAV($: cheerio.CheerioAPI): MovimentacaoTribunal[] {
    const movimentacoes: MovimentacaoTribunal[] = [];

    // Procurar tabela de movimentações
    $('.movimentacoes table tr, .historico table tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length >= 3) {
        const data = cells.eq(0).text().trim();
        const descricao = cells.eq(1).text().trim();
        const responsavel = cells.eq(2).text().trim();

        if (data && descricao && this.isValidDate(data)) {
          movimentacoes.push({
            id: `rf-mov-${i}`,
            data: this.parseDate(data),
            titulo: this.extractTitulo(descricao),
            descricao: `${descricao} - Responsável: ${responsavel}`,
            oficial: true
          });
        }
      }
    });

    return movimentacoes.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }

  private extractMovimentacoesCARP($: cheerio.CheerioAPI): MovimentacaoTribunal[] {
    const movimentacoes: MovimentacaoTribunal[] = [];

    $('.timeline-carf .evento, .movimentacoes-carf tr').each((i, el) => {
      const $el = $(el);
      const data = $el.find('.data-evento, td:first-child').text().trim();
      const descricao = $el.find('.descricao-evento, td:nth-child(2)').text().trim();

      if (data && descricao && this.isValidDate(data)) {
        movimentacoes.push({
          id: `carf-mov-${i}`,
          data: this.parseDate(data),
          titulo: this.extractTitulo(descricao),
          descricao,
          oficial: true
        });
      }
    });

    return movimentacoes;
  }

  // Consulta específica para débitos em dívida ativa
  async consultarDividaAtiva(cpfCnpj: string): Promise<any[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/aplicacoes/atidc/certidao/CndConjuntaInter/paginas/ConsultaSituacao.aspx?CPF=${cpfCnpj}`
      });

      const $ = cheerio.load(response.data);
      const debitos: any[] = [];

      $('.debito-ativo').each((i, el) => {
        const $debito = $(el);
        debitos.push({
          numeroInscricao: $debito.find('.numero-inscricao').text().trim(),
          valor: this.parseValor($debito.find('.valor-debito').text().trim()),
          situacao: $debito.find('.situacao-debito').text().trim(),
          dataInscricao: this.parseDate($debito.find('.data-inscricao').text().trim())
        });
      });

      return debitos;
    } catch (error) {
      throw new Error(`Erro na consulta de dívida ativa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar certidões
  async consultarCertidoes(cpfCnpj: string): Promise<any> {
    try {
      // Gerar hash para consulta
      const hash = this.generateConsultaHash(cpfCnpj);
      
      const response = await this.client.makeRequest({
        method: 'POST',
        url: '/aplicacoes/atidc/certidao/CndConjuntaInter/paginas/InformaNICertidao.aspx',
        data: new URLSearchParams({
          'ni': cpfCnpj,
          'hash': hash
        })
      });

      const $ = cheerio.load(response.data);
      
      return {
        situacao: $('.situacao-certidao').text().trim(),
        validadeAte: this.parseDate($('.validade-certidao').text().trim()),
        observacoes: $('.obs-certidao').text().trim()
      };
    } catch (error) {
      throw new Error(`Erro na consulta de certidões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
    
    return titulo || 'Movimentação administrativa';
  }

  private extractDocumento(texto: string): string | undefined {
    // Procurar CPF
    const cpfMatch = texto.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
    if (cpfMatch) return cpfMatch[0];
    
    // Procurar CNPJ
    const cnpjMatch = texto.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
    if (cnpjMatch) return cnpjMatch[0];
    
    return undefined;
  }

  private generateConsultaHash(cpfCnpj: string): string {
    // Gerar hash simples para consulta (implementação específica da Receita)
    const timestamp = Date.now().toString();
    return crypto.createHash('md5').update(cpfCnpj + timestamp).digest('hex').substring(0, 16);
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

export { ReceitaFederalService };
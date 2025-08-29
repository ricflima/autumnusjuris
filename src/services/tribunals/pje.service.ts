// src/services/tribunals/pje.service.ts

import { RealTribunalClient } from '../realTribunalClient.service';
import { ProcessoTribunalData, MovimentacaoTribunal, ParteTribunal, AdvogadoTribunal, AudioenciaTribunal } from '@/types/tribunalIntegration';
import * as cheerio from 'cheerio';

interface PJeConfig {
  baseUrl: string;
  tribunal: string;
  grau: '1' | '2';
  requiresCertificate?: boolean;
}

class PJeService {
  private client: RealTribunalClient;
  private config: PJeConfig;

  constructor(config: PJeConfig) {
    this.config = config;
    this.client = new RealTribunalClient({
      baseURL: config.baseUrl,
      timeout: 45000,
      rateLimitDelay: 3000, // PJe é mais lento
      retryAttempts: 5,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      enableCookies: true
    });
  }

  async consultarProcesso(numeroProcesso: string): Promise<ProcessoTribunalData> {
    try {
      // PJe tem consulta pública e consulta com certificado
      if (this.config.requiresCertificate) {
        return await this.consultarComCertificado(numeroProcesso);
      } else {
        return await this.consultarPublica(numeroProcesso);
      }
    } catch (error) {
      throw new Error(`Erro na consulta PJe ${this.config.tribunal}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async consultarPublica(numeroProcesso: string): Promise<ProcessoTribunalData> {
    // Acessar página de consulta pública
    const consultaUrl = `/pje/ConsultaPublica/listView.seam`;
    
    const initialResponse = await this.client.makeRequest({
      method: 'GET',
      url: consultaUrl
    });

    const $ = cheerio.load(initialResponse.data);
    
    // Extrair parâmetros do formulário
    const viewState = $('input[name="javax.faces.ViewState"]').val() || '';
    const windowId = $('input[name="javax.faces.WindowId"]').val() || '';
    const formId = $('.ui-form').attr('id') || 'formConsultaPublica';

    // Montar dados do formulário
    const numeroLimpo = numeroProcesso.replace(/\D/g, '');
    const numeroSequencial = numeroLimpo.substring(0, 7);
    const digitoVerificador = numeroLimpo.substring(7, 9);
    const anoAjuizamento = numeroLimpo.substring(9, 13);
    const orgaoJudiciario = numeroLimpo.substring(13, 14);
    const tribunal = numeroLimpo.substring(14, 16);
    const orgaoOrigem = numeroLimpo.substring(16, 20);

    const formData = new URLSearchParams({
      [formId]: formId,
      [`${formId}:numeroSequencial`]: numeroSequencial,
      [`${formId}:digitoVerificador`]: digitoVerificador,
      [`${formId}:anoAjuizamento`]: anoAjuizamento,
      [`${formId}:orgaoJudiciario`]: orgaoJudiciario,
      [`${formId}:tribunal`]: tribunal,
      [`${formId}:orgaoOrigem`]: orgaoOrigem,
      [`${formId}:botaoConsultarProcessos`]: 'Consultar',
      'javax.faces.ViewState': viewState as string,
      'javax.faces.WindowId': windowId as string
    });

    // Fazer a consulta
    const resultResponse = await this.client.makeRequest({
      method: 'POST',
      url: consultaUrl,
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Faces-Request': 'partial/ajax',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    return this.parseProcessData(resultResponse.data, numeroProcesso);
  }

  private async consultarComCertificado(numeroProcesso: string): Promise<ProcessoTribunalData> {
    // Para consulta com certificado digital
    const consultaUrl = `/pje/Processo/ConsultaProcesso/listView.seam`;
    
    // Implementação específica para consulta autenticada
    // Requer certificado digital configurado no client
    
    const response = await this.client.makeRequest({
      method: 'GET',
      url: consultaUrl
    });

    // Seguir fluxo similar à consulta pública, mas com mais dados disponíveis
    return this.parseProcessData(response.data, numeroProcesso);
  }

  private parseProcessData(html: string, numeroProcesso: string): ProcessoTribunalData {
    const $ = cheerio.load(html);

    // Verificar se encontrou o processo
    if ($('.mensagem-erro, .ui-messages-error').length > 0) {
      throw new Error(`Processo não encontrado no ${this.config.tribunal}`);
    }

    const dados: ProcessoTribunalData = {
      numero: numeroProcesso,
      classe: '',
      assunto: '',
      dataAjuizamento: '',
      situacao: 'Em andamento',
      localizacao: '',
      orgaoJulgador: '',
      partes: [],
      advogados: [],
      movimentacoes: [],
      audiencias: [],
      documentos: [],
      recursos: []
    };

    // Extrair dados básicos do processo
    dados.classe = this.extractValue($, 'Classe') || 'Não informado';
    dados.assunto = this.extractValue($, 'Assunto') || 'Não informado';
    dados.orgaoJulgador = this.extractValue($, 'Órgão julgador') || 
                         this.extractValue($, 'Vara') || 
                         this.extractValue($, 'Juízo') || 'Não informado';

    // Extrair data de distribuição/autuação
    const dataDistribuicao = this.extractValue($, 'Data de autuação') || 
                            this.extractValue($, 'Distribuição');
    if (dataDistribuicao) {
      dados.dataAjuizamento = this.parseDate(dataDistribuicao);
    }

    // Extrair valor da causa
    const valorCausa = this.extractValue($, 'Valor da causa');
    if (valorCausa) {
      dados.valorCausa = this.parseValor(valorCausa);
    }

    // Extrair magistrado
    dados.magistrado = this.extractValue($, 'Magistrado') || 
                      this.extractValue($, 'Juiz') || 
                      this.extractValue($, 'Relator');

    // Extrair partes
    dados.partes = this.extractPartes($);
    
    // Extrair advogados
    dados.advogados = this.extractAdvogados($);
    
    // Extrair movimentações
    dados.movimentacoes = this.extractMovimentacoes($);

    // Extrair audiências
    dados.audiencias = this.extractAudiencias($);

    // Definir localização atual
    dados.localizacao = dados.orgaoJulgador;

    // Definir situação baseada nas movimentações
    const ultimaMovimentacao = dados.movimentacoes[0];
    if (ultimaMovimentacao) {
      dados.ultimaMovimentacao = ultimaMovimentacao.data;
      
      // Determinar situação baseada no conteúdo da movimentação
      const descricao = ultimaMovimentacao.descricao.toLowerCase();
      if (descricao.includes('sentença') || descricao.includes('julgado')) {
        dados.situacao = 'Julgado';
      } else if (descricao.includes('arquivado')) {
        dados.situacao = 'Arquivado';
      } else if (descricao.includes('suspen')) {
        dados.situacao = 'Suspenso';
      }
    }

    return dados;
  }

  private extractValue($: cheerio.CheerioAPI, label: string): string {
    let value = '';

    // Padrões específicos do PJe
    $(`.detail-row .label:contains("${label}")`, '.detail-row').next('.value').each((i, el) => {
      value = $(el).text().trim();
    });

    // Tabelas de informações
    $(`td:contains("${label}")`, 'table').next('td').each((i, el) => {
      if (!value) value = $(el).text().trim();
    });

    // Spans com labels
    $(`.info-process span:contains("${label}")`).each((i, el) => {
      const text = $(el).parent().text();
      const match = text.match(new RegExp(`${label}:?\\s*([^\\n]+)`));
      if (match && !value) value = match[1].trim();
    });

    return value;
  }

  private extractPartes($: cheerio.CheerioAPI): ParteTribunal[] {
    const partes: ParteTribunal[] = [];

    // Procurar na seção de partes
    $('.partes-processo .parte, .party-info, .processo-parte').each((i, el) => {
      const $parte = $(el);
      const tipoTexto = $parte.find('.tipo-parte, .party-type').text().trim().toLowerCase();
      const nome = $parte.find('.nome-parte, .party-name').text().trim();

      if (nome) {
        let tipo: ParteTribunal['tipo'] = 'outros';
        
        if (tipoTexto.includes('autor') || tipoTexto.includes('requerente') || tipoTexto.includes('impetrante')) {
          tipo = 'autor';
        } else if (tipoTexto.includes('réu') || tipoTexto.includes('requerido') || tipoTexto.includes('impetrado')) {
          tipo = 'reu';
        } else if (tipoTexto.includes('terceiro')) {
          tipo = 'terceiro';
        }

        partes.push({
          nome,
          tipo,
          documento: this.extractDocumento(nome)
        });
      }
    });

    // Fallback: procurar em tabelas
    if (partes.length === 0) {
      $('table tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 2) {
          const tipoTexto = cells.eq(0).text().trim().toLowerCase();
          const nome = cells.eq(1).text().trim();
          
          if (nome && (tipoTexto.includes('autor') || tipoTexto.includes('réu'))) {
            const tipo = tipoTexto.includes('autor') ? 'autor' : 'reu';
            
            partes.push({
              nome,
              tipo,
              documento: this.extractDocumento(nome)
            });
          }
        }
      });
    }

    return partes;
  }

  private extractAdvogados($: cheerio.CheerioAPI): AdvogadoTribunal[] {
    const advogados: AdvogadoTribunal[] = [];

    // Procurar advogados nas informações das partes
    $('.advogado-info, .lawyer-info').each((i, el) => {
      const texto = $(el).text();
      const oabMatch = texto.match(/OAB[\/\s]*([A-Z]{2})[\/\s]*(\d+)/i);
      
      if (oabMatch) {
        const nome = texto.replace(/OAB[\/\s]*[A-Z]{2}[\/\s]*\d+/i, '').trim();
        
        advogados.push({
          nome,
          oab: oabMatch[2],
          uf: oabMatch[1],
          tipo: 'parte_autora',
          ativo: true
        });
      }
    });

    return advogados;
  }

  private extractMovimentacoes($: cheerio.CheerioAPI): MovimentacaoTribunal[] {
    const movimentacoes: MovimentacaoTribunal[] = [];

    // PJe geralmente tem uma seção específica para movimentações
    $('.movimentacao, .movement-item, .timeline-item').each((i, el) => {
      const $mov = $(el);
      
      const dataTexto = $mov.find('.data-movimentacao, .movement-date, .date').text().trim();
      const descricao = $mov.find('.descricao-movimentacao, .movement-description, .description').text().trim();
      
      if (dataTexto && descricao) {
        const data = this.parseDate(dataTexto);
        const horaMatch = dataTexto.match(/(\d{2}:\d{2})/);
        
        movimentacoes.push({
          id: `pje-mov-${i}`,
          data,
          dataHora: horaMatch ? `${data}T${horaMatch[1]}:00` : undefined,
          titulo: this.extractTitulo(descricao),
          descricao: descricao.trim(),
          oficial: true
        });
      }
    });

    // Ordenar por data (mais recente primeiro)
    return movimentacoes.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }

  private extractAudiencias($: cheerio.CheerioAPI): AudioenciaTribunal[] {
    const audiencias: AudioenciaTribunal[] = [];

    $('.audiencia, .hearing-info').each((i, el) => {
      const $aud = $(el);
      const dataTexto = $aud.find('.data-audiencia, .hearing-date').text().trim();
      const tipo = $aud.find('.tipo-audiencia, .hearing-type').text().trim();
      const local = $aud.find('.local-audiencia, .hearing-location').text().trim();
      
      if (dataTexto) {
        const data = this.parseDate(dataTexto);
        const horaMatch = dataTexto.match(/(\d{2}:\d{2})/);
        
        audiencias.push({
          id: `pje-aud-${i}`,
          data,
          hora: horaMatch ? horaMatch[1] : '09:00',
          tipo: tipo || 'Não especificado',
          situacao: 'agendada',
          local: local || 'Não informado'
        });
      }
    });

    return audiencias;
  }

  private parseDate(dateString: string): string {
    // Converter data brasileira para ISO
    const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, dia, mes, ano] = match;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    // Se já estiver no formato ISO
    const isoMatch = dateString.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      return isoMatch[1];
    }
    
    return new Date().toISOString().split('T')[0]; // Fallback para hoje
  }

  private parseValor(valorString: string): number {
    const numero = valorString.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numero) || 0;
  }

  private extractTitulo(descricao: string): string {
    const linhas = descricao.split('\n');
    let titulo = linhas[0].trim();
    
    if (titulo.length > 150) {
      titulo = titulo.substring(0, 150) + '...';
    }
    
    return titulo || 'Movimentação processual';
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

  async verificarDisponibilidade(): Promise<boolean> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: '/pje/ConsultaPublica/listView.seam',
        timeout: 10000
      });
      
      return response.status === 200 && response.data.includes('Consulta Pública');
    } catch (error) {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.client.cleanup();
  }
}

// Factory para criar serviços PJe específicos por tribunal
export class PJeFactory {
  static createTRF1Service(): PJeService {
    return new PJeService({
      baseUrl: 'https://pje1g.trf1.jus.br',
      tribunal: 'TRF1',
      grau: '1'
    });
  }

  static createTRF2Service(): PJeService {
    return new PJeService({
      baseUrl: 'https://pje.trf2.jus.br',
      tribunal: 'TRF2',
      grau: '1'
    });
  }

  static createTRF3Service(): PJeService {
    return new PJeService({
      baseUrl: 'https://pje1g.trf3.jus.br',
      tribunal: 'TRF3',
      grau: '1'
    });
  }

  static createTRF4Service(): PJeService {
    return new PJeService({
      baseUrl: 'https://pje1g.trf4.jus.br',
      tribunal: 'TRF4',
      grau: '1'
    });
  }

  static createTRF5Service(): PJeService {
    return new PJeService({
      baseUrl: 'https://pje1g.trf5.jus.br',
      tribunal: 'TRF5',
      grau: '1'
    });
  }

  static createTRF6Service(): PJeService {
    return new PJeService({
      baseUrl: 'https://pje1g.trf6.jus.br',
      tribunal: 'TRF6',
      grau: '1'
    });
  }

  // Tribunais do Trabalho
  static createTSTService(): PJeService {
    return new PJeService({
      baseUrl: 'https://pje.tst.jus.br',
      tribunal: 'TST',
      grau: '1',
      requiresCertificate: true
    });
  }

  static createTRTService(regiao: string): PJeService {
    const baseUrls: Record<string, string> = {
      '01': 'https://pje.trt1.jus.br',
      '02': 'https://pje.trt2.jus.br',
      '03': 'https://pje.trt3.jus.br',
      '04': 'https://pje.trt4.jus.br',
      '05': 'https://pje.trt5.jus.br',
      '06': 'https://pje.trt6.jus.br',
      '07': 'https://pje.trt7.jus.br',
      '08': 'https://pje.trt8.jus.br',
      '09': 'https://pje.trt9.jus.br',
      '10': 'https://pje.trt10.jus.br',
      '11': 'https://pje.trt11.jus.br',
      '12': 'https://pje.trt12.jus.br',
      '13': 'https://pje.trt13.jus.br',
      '14': 'https://pje.trt14.jus.br',
      '15': 'https://pje.trt15.jus.br',
      '16': 'https://pje.trt16.jus.br',
      '17': 'https://pje.trt17.jus.br',
      '18': 'https://pje.trt18.jus.br',
      '19': 'https://pje.trt19.jus.br',
      '20': 'https://pje.trt20.jus.br',
      '21': 'https://pje.trt21.jus.br',
      '22': 'https://pje.trt22.jus.br',
      '23': 'https://pje.trt23.jus.br',
      '24': 'https://pje.trt24.jus.br'
    };

    return new PJeService({
      baseUrl: baseUrls[regiao] || `https://pje.trt${regiao}.jus.br`,
      tribunal: `TRT${regiao}`,
      grau: '1'
    });
  }
}

export { PJeService };
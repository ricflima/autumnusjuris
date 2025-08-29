// src/services/tribunais/stf.service.ts

import { RealTribunalClient } from '../realTribunalClient.service';
import { ProcessoTribunalData, MovimentacaoTribunal, ParteTribunal, AdvogadoTribunal } from '@/types/tribunalIntegration';
import * as cheerio from 'cheerio';

class STFService {
  private client: RealTribunalClient;

  constructor() {
    this.client = new RealTribunalClient({
      baseURL: 'https://portal.stf.jus.br',
      timeout: 30000,
      rateLimitDelay: 3000, // 3 segundos entre requisições
      retryAttempts: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }

  async consultarProcesso(numeroProcesso: string): Promise<ProcessoTribunalData> {
    try {
      // Primeiro, acessar a página de consulta
      const consultaResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/transparencia/processos/consulta'
      });

      // Extrair parâmetros do formulário se necessário
      const $ = cheerio.load(consultaResponse.data);
      
      // Limpar e formatar número do processo
      const numeroLimpo = numeroProcesso.replace(/\D/g, '');
      const numeroFormatado = RealTribunalClient.formatarNumeroProcesso(numeroLimpo);

      // Fazer a consulta do processo
      const formData = new URLSearchParams({
        'numero': numeroFormatado,
        'consulta': 'processos'
      });

      const resultadoResponse = await this.client.makeRequest({
        method: 'POST',
        url: '/transparencia/processos/consulta',
        data: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://portal.stf.jus.br/transparencia/processos/consulta'
        }
      });

      return this.parseProcessData(resultadoResponse.data, numeroFormatado);
    } catch (error) {
      throw new Error(`Erro na consulta STF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar repercussão geral
  async consultarRepercussaoGeral(tema: string): Promise<any[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/repercussao-geral/consulta?tema=${encodeURIComponent(tema)}`
      });

      const $ = cheerio.load(response.data);
      const repercussoes: any[] = [];

      $('.tema-repercussao').each((i, item) => {
        const $item = $(item);
        
        repercussoes.push({
          numeroTema: $item.find('.numero-tema').text().trim(),
          assunto: $item.find('.assunto-tema').text().trim(),
          tese: $item.find('.tese-fixada').text().trim(),
          relator: $item.find('.relator').text().trim(),
          dataJulgamento: this.parseDate($item.find('.data-julgamento').text().trim()),
          situacao: $item.find('.situacao-tema').text().trim(),
          leading_case: $item.find('.leading-case').text().trim(),
          processosMultiplicados: this.extractProcessosMultiplicados($item)
        });
      });

      return repercussoes;
    } catch (error) {
      throw new Error(`Erro na consulta de repercussão geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar súmulas vinculantes
  async consultarSumulasVinculantes(assunto?: string): Promise<any[]> {
    try {
      const url = assunto ? 
        `/sumulas-vinculantes?q=${encodeURIComponent(assunto)}` : 
        '/sumulas-vinculantes';

      const response = await this.client.makeRequest({
        method: 'GET',
        url
      });

      const $ = cheerio.load(response.data);
      const sumulas: any[] = [];

      $('.sumula-vinculante').each((i, item) => {
        const $item = $(item);
        
        sumulas.push({
          numeroSumula: $item.find('.numero-sumula').text().trim(),
          enunciado: $item.find('.enunciado').text().trim(),
          dataAprovacao: this.parseDate($item.find('.data-aprovacao').text().trim()),
          situacao: $item.find('.situacao-sumula').text().trim(),
          precedentes: this.extractPrecedentes($item)
        });
      });

      return sumulas;
    } catch (error) {
      throw new Error(`Erro na consulta de súmulas vinculantes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar pautas de julgamento
  async consultarPautas(): Promise<any[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: '/pautas'
      });

      const $ = cheerio.load(response.data);
      const pautas: any[] = [];

      $('.pauta-julgamento').each((i, item) => {
        const $item = $(item);
        
        pautas.push({
          dataJulgamento: this.parseDate($item.find('.data-julgamento').text().trim()),
          orgao: $item.find('.orgao-julgador').text().trim(),
          processos: this.extractProcessosPauta($item)
        });
      });

      return pautas;
    } catch (error) {
      throw new Error(`Erro na consulta de pautas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Consultar jurisprudência
  async consultarJurisprudencia(assunto: string): Promise<any[]> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/jurisprudencia/consulta?q=${encodeURIComponent(assunto)}`
      });

      const $ = cheerio.load(response.data);
      const jurisprudencia: any[] = [];

      $('.resultado-jurisprudencia').each((i, item) => {
        const $item = $(item);
        
        jurisprudencia.push({
          numeroAcordao: $item.find('.numero-acordao').text().trim(),
          classe: $item.find('.classe-acordao').text().trim(),
          relator: $item.find('.relator-acordao').text().trim(),
          orgaoJulgador: $item.find('.orgao-julgador').text().trim(),
          dataJulgamento: this.parseDate($item.find('.data-julgamento').text().trim()),
          ementa: $item.find('.ementa').text().trim(),
          acesso: $item.find('.link-acesso').attr('href') || ''
        });
      });

      return jurisprudencia;
    } catch (error) {
      throw new Error(`Erro na consulta de jurisprudência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private parseProcessData(html: string, numeroProcesso: string): ProcessoTribunalData {
    const $ = cheerio.load(html);
    
    // Verificar se encontrou o processo
    if ($('.mensagem-erro').length > 0 || $('span:contains("não foi encontrado")').length > 0) {
      throw new Error('Processo não encontrado no STF');
    }

    const dados: ProcessoTribunalData = {
      numero: numeroProcesso,
      classe: '',
      assunto: '',
      dataAjuizamento: '',
      situacao: 'Em andamento',
      localizacao: '',
      orgaoJulgador: 'Supremo Tribunal Federal',
      partes: [],
      advogados: [],
      movimentacoes: [],
      audiencias: [],
      documentos: [],
      recursos: []
    };

    // Extrair dados básicos
    dados.classe = this.extractFieldValue($, 'Classe') || 'Não informado';
    dados.assunto = this.extractFieldValue($, 'Assunto') || 'Não informado';
    dados.localizacao = this.extractFieldValue($, 'Localização') || 'STF';

    // Extrair relator
    const relator = this.extractFieldValue($, 'Relator');
    if (relator) {
      dados.orgaoJulgador = `Supremo Tribunal Federal - Rel. Min. ${relator}`;
    }

    // Extrair data de autuação
    const dataAutuacao = this.extractFieldValue($, 'Data de Autuação') || 
                         this.extractFieldValue($, 'Distribuição');
    if (dataAutuacao) {
      const match = dataAutuacao.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) {
        const [dia, mes, ano] = match[1].split('/');
        dados.dataAjuizamento = `${ano}-${mes}-${dia}`;
      }
    }

    // Extrair situação atual
    const situacao = this.extractFieldValue($, 'Situação') || 
                     this.extractFieldValue($, 'Status');
    if (situacao) {
      dados.situacao = situacao;
    }

    // Extrair partes
    dados.partes = this.extractPartes($);
    
    // Extrair advogados
    dados.advogados = this.extractAdvogados($);
    
    // Extrair movimentações
    dados.movimentacoes = this.extractMovimentacoes($);

    return dados;
  }

  private extractFieldValue($: cheerio.CheerioAPI, fieldName: string): string {
    let value = '';
    
    // Procurar em diferentes padrões de layout do STF
    $(`span.rotulo:contains("${fieldName}")`, '.dados-processo').next('span.conteudo').each((i, el) => {
      value = $(el).text().trim();
    });

    // Padrão em tabelas
    $(`th:contains("${fieldName}")`).next('td').each((i, el) => {
      if (!value) value = $(el).text().trim();
    });

    // Padrão em labels
    $(`.campo-label:contains("${fieldName}")`).next('.campo-valor').each((i, el) => {
      if (!value) value = $(el).text().trim();
    });

    return value;
  }

  private extractPartes($: cheerio.CheerioAPI): ParteTribunal[] {
    const partes: ParteTribunal[] = [];

    // Extrair requerente/impetrante
    $('.requerente, .impetrante, .parte-ativa').each((i, el) => {
      const nome = $(el).text().trim();
      if (nome) {
        partes.push({
          nome,
          tipo: 'autor',
          documento: this.extractDocumentFromText(nome)
        });
      }
    });

    // Extrair requerido/impetrado
    $('.requerido, .impetrado, .parte-passiva').each((i, el) => {
      const nome = $(el).text().trim();
      if (nome) {
        partes.push({
          nome,
          tipo: 'reu',
          documento: this.extractDocumentFromText(nome)
        });
      }
    });

    // Padrão em tabela de partes
    $('.tabela-partes tr, .partes-processo tr').each((i, row) => {
      const $row = $(row);
      const tipoTexto = $row.find('td:first-child').text().trim().toLowerCase();
      const nome = $row.find('td:nth-child(2)').text().trim();
      
      if (nome && !nome.includes('Advogado')) {
        let tipo: ParteTribunal['tipo'] = 'outros';
        
        if (tipoTexto.includes('requerente') || tipoTexto.includes('impetrante')) {
          tipo = 'autor';
        } else if (tipoTexto.includes('requerido') || tipoTexto.includes('impetrado')) {
          tipo = 'reu';
        }

        partes.push({
          nome,
          tipo,
          documento: this.extractDocumentFromText(nome)
        });
      }
    });

    return partes;
  }

  private extractAdvogados($: cheerio.CheerioAPI): AdvogadoTribunal[] {
    const advogados: AdvogadoTribunal[] = [];

    $('.advogado-processo, .advogados tr, .procurador').each((i, el) => {
      const texto = $(el).text();
      const oabMatch = texto.match(/OAB[\\/\s]*([A-Z]{2})[\\/\s]*(\d+)/i);
      
      if (oabMatch) {
        const nomeMatch = texto.match(/^(.+?)(?:OAB|$)/i);
        const nome = nomeMatch ? nomeMatch[1].trim() : 'Nome não identificado';
        
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

    $('.movimentacoes tr, .historico-processo tr, .andamentos .andamento').each((i, row) => {
      const $row = $(row);
      
      // Pular cabeçalho
      if ($row.find('th').length > 0) return;

      let data = '';
      let descricao = '';

      // Formato tabela
      const cells = $row.find('td');
      if (cells.length >= 2) {
        data = cells.eq(0).text().trim();
        descricao = cells.eq(1).text().trim();
      }

      // Formato andamento
      const dataEl = $row.find('.data-andamento');
      const descEl = $row.find('.descricao-andamento');
      if (dataEl.length && descEl.length) {
        data = dataEl.text().trim();
        descricao = descEl.text().trim();
      }

      if (data && descricao) {
        // Extrair data
        const dataMatch = data.match(/(\d{2}\/\d{2}\/\d{4})/);
        let dataFormatada = '';
        
        if (dataMatch) {
          const [dia, mes, ano] = dataMatch[1].split('/');
          dataFormatada = `${ano}-${mes}-${dia}`;
        }

        // Extrair hora se disponível
        const horaMatch = data.match(/(\d{2}:\d{2})/);
        const dataHora = horaMatch ? `${dataFormatada}T${horaMatch[1]}:00` : undefined;

        movimentacoes.push({
          id: `stf-mov-${i}`,
          data: dataFormatada,
          dataHora,
          titulo: this.extractTituloMovimentacao(descricao),
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

  private extractProcessosMultiplicados($item: cheerio.Cheerio<any>): string[] {
    const processos: string[] = [];
    
    $item.find('.processo-multiplicado').each((i, el) => {
      const numero = $(el).text().trim();
      if (numero) {
        processos.push(numero);
      }
    });

    return processos;
  }

  private extractPrecedentes($item: cheerio.Cheerio<any>): string[] {
    const precedentes: string[] = [];
    
    $item.find('.precedente').each((i, el) => {
      const processo = $(el).text().trim();
      if (processo) {
        precedentes.push(processo);
      }
    });

    return precedentes;
  }

  private extractProcessosPauta($item: cheerio.Cheerio<any>): any[] {
    const processos: any[] = [];
    
    $item.find('.processo-pauta').each((i, el) => {
      const $proc = $(el);
      processos.push({
        numero: $proc.find('.numero-processo').text().trim(),
        classe: $proc.find('.classe-processo').text().trim(),
        relator: $proc.find('.relator-processo').text().trim(),
        assunto: $proc.find('.assunto-processo').text().trim()
      });
    });

    return processos;
  }

  private extractTituloMovimentacao(descricao: string): string {
    const linhas = descricao.split('\n');
    let titulo = linhas[0].trim();
    
    // Remover códigos no início se houver
    titulo = titulo.replace(/^\d+\s*-\s*/, '');
    
    if (titulo.length > 100) {
      titulo = titulo.substring(0, 100) + '...';
    }
    
    return titulo || 'Movimentação STF';
  }

  private extractDocumentFromText(text: string): string | undefined {
    // Procurar CPF
    const cpfMatch = text.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/);
    if (cpfMatch) return cpfMatch[1];
    
    // Procurar CNPJ
    const cnpjMatch = text.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/);
    if (cnpjMatch) return cnpjMatch[1];
    
    return undefined;
  }

  private parseDate(dateString: string): string {
    if (!dateString) return '';
    
    const match = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, dia, mes, ano] = match;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    return '';
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

export { STFService };
// src/services/tribunals/tjsp.service.ts

import { RealTribunalClient } from '../realTribunalClient.service';
import { ProcessoTribunalData, MovimentacaoTribunal, ParteTribunal, AdvogadoTribunal } from '@/types/tribunalIntegration';
import * as cheerio from 'cheerio';

class TJSPService {
  private client: RealTribunalClient;

  constructor() {
    this.client = new RealTribunalClient({
      baseURL: 'https://esaj.tjsp.jus.br',
      timeout: 30000,
      rateLimitDelay: 2000, // 2 segundos entre requisições
      retryAttempts: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
  }

  async consultarProcesso(numeroProcesso: string): Promise<ProcessoTribunalData> {
    try {
      // Primeiro, fazer a consulta inicial
      const consultaResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/cpopg/open.do'
      });

      // Extrair parâmetros necessários do formulário
      const $ = cheerio.load(consultaResponse.data);
      const conversationId = $('input[name="conversationId"]').val() || '';
      const _csrf = $('input[name="_csrf"]').val() || '';

      // Fazer a consulta do processo
      const numeroLimpo = numeroProcesso.replace(/\D/g, '');
      const numeroFormatado = RealTribunalClient.formatarNumeroProcesso(numeroLimpo);

      const formData = new URLSearchParams({
        'conversationId': conversationId as string,
        'dadosConsulta.valorConsultaNuUnificado': numeroFormatado,
        'dadosConsulta.valorConsulta': '',
        'dadosConsulta.tipoNuProcesso': 'UNIFICADO',
        'dadosConsulta.segredoJustica': 'false',
        'uuidCaptcha': '',
        '_csrf': _csrf as string
      });

      const resultadoResponse = await this.client.makeRequest({
        method: 'POST',
        url: '/cpopg/search.do',
        data: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://esaj.tjsp.jus.br/cpopg/open.do'
        }
      });

      // Parsear o resultado
      return this.parseProcessData(resultadoResponse.data, numeroFormatado);
    } catch (error) {
      throw new Error(`Erro na consulta TJSP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private parseProcessData(html: string, numeroProcesso: string): ProcessoTribunalData {
    const $ = cheerio.load(html);
    
    // Verificar se encontrou o processo
    if ($('.mensagemExibindo').text().includes('não foi possível localizar')) {
      throw new Error('Processo não encontrado no TJSP');
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

    // Extrair dados básicos
    dados.classe = this.extractFieldValue($, 'Classe') || 'Não informado';
    dados.assunto = this.extractFieldValue($, 'Assunto') || 'Não informado';
    dados.orgaoJulgador = this.extractFieldValue($, 'Órgão julgador') || 
                         this.extractFieldValue($, 'Vara') || 'Não informado';
    
    // Extrair data de distribuição
    const dataDistribuicao = this.extractFieldValue($, 'Distribuição');
    if (dataDistribuicao) {
      const match = dataDistribuicao.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) {
        const [dia, mes, ano] = match[1].split('/');
        dados.dataAjuizamento = `${ano}-${mes}-${dia}`;
      }
    }

    // Extrair valor da causa
    const valorCausa = this.extractFieldValue($, 'Valor da ação');
    if (valorCausa) {
      const valor = valorCausa.replace(/[^\d,]/g, '').replace(',', '.');
      dados.valorCausa = parseFloat(valor) || 0;
    }

    // Extrair partes
    dados.partes = this.extractPartes($);
    
    // Extrair advogados
    dados.advogados = this.extractAdvogados($);
    
    // Extrair movimentações
    dados.movimentacoes = this.extractMovimentacoes($);

    // Extrair localização atual
    dados.localizacao = this.extractFieldValue($, 'Localização') || 
                       dados.orgaoJulgador || 'Não informado';

    return dados;
  }

  private extractFieldValue($: cheerio.CheerioAPI, fieldName: string): string {
    // Procurar por diferentes padrões de layout
    let value = '';
    
    // Padrão 1: span com class específica
    $(`.label:contains("${fieldName}")`, '.unj-entity-header').next('.value').each((i, el) => {
      value = $(el).text().trim();
    });

    // Padrão 2: td seguida de td
    $(`td:contains("${fieldName}")`).next('td').each((i, el) => {
      if (!value) value = $(el).text().trim();
    });

    // Padrão 3: span seguida de span
    $(`span:contains("${fieldName}")`).next('span').each((i, el) => {
      if (!value) value = $(el).text().trim();
    });

    // Padrão 4: th seguida de td
    $(`th:contains("${fieldName}")`).next('td').each((i, el) => {
      if (!value) value = $(el).text().trim();
    });

    return value;
  }

  private extractPartes($: cheerio.CheerioAPI): ParteTribunal[] {
    const partes: ParteTribunal[] = [];

    // Extrair autores
    $('#tableTodasPartes tr, .partes tr').each((i, row) => {
      const $row = $(row);
      const tipoTexto = $row.find('td:first-child, th:first-child').text().trim().toLowerCase();
      const nomeElement = $row.find('td:nth-child(2), td:last-child');
      
      if (tipoTexto && nomeElement.length) {
        const nome = nomeElement.text().trim();
        
        if (nome && !nome.includes('Advogado')) {
          let tipo: ParteTribunal['tipo'] = 'outros';
          
          if (tipoTexto.includes('autor') || tipoTexto.includes('requerente') || tipoTexto.includes('exequente')) {
            tipo = 'autor';
          } else if (tipoTexto.includes('réu') || tipoTexto.includes('requerido') || tipoTexto.includes('executado')) {
            tipo = 'reu';
          } else if (tipoTexto.includes('terceiro')) {
            tipo = 'terceiro';
          }

          partes.push({
            nome,
            tipo,
            documento: this.extractDocumentFromText(nome)
          });
        }
      }
    });

    return partes;
  }

  private extractAdvogados($: cheerio.CheerioAPI): AdvogadoTribunal[] {
    const advogados: AdvogadoTribunal[] = [];

    // Procurar advogados em diferentes seções
    $('.advogado, .lawyer').each((i, el) => {
      const texto = $(el).text().trim();
      const oabMatch = texto.match(/OAB[\/\s]*([A-Z]{2})[\/\s]*(\d+)/i);
      
      if (oabMatch) {
        const nome = texto.replace(/OAB[\/\s]*[A-Z]{2}[\/\s]*\d+/i, '').trim();
        
        advogados.push({
          nome,
          oab: oabMatch[2],
          uf: oabMatch[1],
          tipo: 'parte_autora', // Determinar dinamicamente se possível
          ativo: true
        });
      }
    });

    // Procurar em tabelas de partes
    $('#tableTodasPartes tr, .partes tr').each((i, row) => {
      const $row = $(row);
      const texto = $row.text();
      const oabMatch = texto.match(/Advogad[ao].*?OAB[\/\s]*([A-Z]{2})[\/\s]*(\d+)/i);
      
      if (oabMatch) {
        const nomeMatch = texto.match(/Advogad[ao][:\s]*(.*?)(?:OAB|$)/i);
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

    // Extrair da tabela de movimentações
    $('#tabelaTodasMovimentacoes tr, .movimentacoes tr, .timeline .movimento').each((i, row) => {
      const $row = $(row);
      
      // Pular cabeçalho
      if ($row.find('th').length > 0) return;

      const dataElement = $row.find('.dataMovimentacao, td:first-child, .data');
      const descricaoElement = $row.find('.descricaoMovimentacao, td:last-child, .descricao');
      
      if (dataElement.length && descricaoElement.length) {
        const dataTexto = dataElement.text().trim();
        const descricao = descricaoElement.text().trim();
        
        if (dataTexto && descricao) {
          // Extrair data
          const dataMatch = dataTexto.match(/(\d{2}\/\d{2}\/\d{4})/);
          let dataFormatada = '';
          
          if (dataMatch) {
            const [dia, mes, ano] = dataMatch[1].split('/');
            dataFormatada = `${ano}-${mes}-${dia}`;
          }

          // Extrair hora se disponível
          const horaMatch = dataTexto.match(/(\d{2}:\d{2})/);
          const dataHora = horaMatch ? `${dataFormatada}T${horaMatch[1]}:00` : undefined;

          movimentacoes.push({
            id: `tjsp-mov-${i}`,
            data: dataFormatada,
            dataHora,
            titulo: this.extractTituloMovimentacao(descricao),
            descricao: descricao.trim(),
            oficial: true
          });
        }
      }
    });

    // Ordenar por data (mais recente primeiro)
    return movimentacoes.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }

  private extractTituloMovimentacao(descricao: string): string {
    // Extrair primeira linha como título
    const linhas = descricao.split('\n');
    let titulo = linhas[0].trim();
    
    // Remover códigos no início se houver
    titulo = titulo.replace(/^\d+\s*-\s*/, '');
    
    // Limitar tamanho do título
    if (titulo.length > 100) {
      titulo = titulo.substring(0, 100) + '...';
    }
    
    return titulo || 'Movimentação processual';
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

  // Método para consultar múltiplos processos
  async consultarMultiplosProcessos(numerosProcesso: string[]): Promise<ProcessoTribunalData[]> {
    const resultados: ProcessoTribunalData[] = [];
    
    for (const numero of numerosProcesso) {
      try {
        const resultado = await this.consultarProcesso(numero);
        resultados.push(resultado);
        
        // Delay entre consultas para respeitar rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Erro na consulta do processo ${numero}:`, error);
        // Continuar com próximos processos mesmo se um falhar
      }
    }
    
    return resultados;
  }

  // Método para verificar se o serviço está disponível
  async verificarDisponibilidade(): Promise<boolean> {
    try {
      const response = await this.client.makeRequest({
        method: 'GET',
        url: '/cpopg/open.do',
        timeout: 10000
      });
      
      return response.status === 200 && response.data.includes('Consulta de Processos');
    } catch (error) {
      return false;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.client.cleanup();
  }
}

export { TJSPService };
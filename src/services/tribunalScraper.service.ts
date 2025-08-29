// src/services/tribunalScraper.service.ts

import { RealTribunalClient, RealTribunalClientConfig } from './realTribunalClient.service';
import { ProcessoTribunalData, MovimentacaoTribunal, TribunalType } from '@/types/tribunalIntegration';
import * as cheerio from 'cheerio';
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

export interface ScrapingRule {
  tribunal: TribunalType;
  name: string;
  baseURL: string;
  searchPath: string;
  searchMethod: 'GET' | 'POST';
  searchParams: Record<string, string>;
  selectors: {
    processNumber: string;
    className: string;
    subject: string;
    distributionDate: string;
    situation: string;
    location: string;
    judge: string;
    parties: string;
    lawyers: string;
    movements: string;
    movementDate: string;
    movementDescription: string;
    errorMessage?: string;
    nextPage?: string;
  };
  requiresCaptcha: boolean;
  requiresCertificate: boolean;
  rateLimit: number;
  userAgent?: string;
}

class TribunalScraper {
  private client: RealTribunalClient;
  private rules: Map<TribunalType, ScrapingRule> = new Map();

  constructor() {
    this.client = new RealTribunalClient({
      baseURL: '',
      timeout: 60000,
      rateLimitDelay: 2000,
      retryAttempts: 3,
      enableStealth: true
    });

    this.loadScrapingRules();
  }

  private loadScrapingRules(): void {
    // Regras para diferentes tribunais que não possuem APIs públicas
    
    // TJMG - Tribunal de Justiça de Minas Gerais
    this.rules.set('tjmg', {
      tribunal: 'tjmg',
      name: 'TJMG - Tribunal de Justiça de MG',
      baseURL: 'https://www4.tjmg.jus.br',
      searchPath: '/juridico/sf/proc_complemento/proc_consulta_publica.jsp',
      searchMethod: 'POST',
      searchParams: {
        'txtNum': '{numeroProcesso}',
        'cmbGrau': '1',
        'Submit': 'Pesquisar'
      },
      selectors: {
        processNumber: '.numero-processo, .proc-numero',
        className: '.classe-processual',
        subject: '.assunto-processo',
        distributionDate: '.data-distribuicao',
        situation: '.situacao-processo',
        location: '.localizacao-processo',
        judge: '.juiz-processo',
        parties: '.parte-processo',
        lawyers: '.advogado-processo',
        movements: '.movimentacao-processual',
        movementDate: '.data-movimentacao',
        movementDescription: '.descricao-movimentacao',
        errorMessage: '.mensagem-erro'
      },
      requiresCaptcha: false,
      requiresCertificate: false,
      rateLimit: 3000
    });

    // TJRJ - Tribunal de Justiça do Rio de Janeiro
    this.rules.set('tjrj', {
      tribunal: 'tjrj',
      name: 'TJRJ - Tribunal de Justiça do RJ',
      baseURL: 'http://www4.tjrj.jus.br',
      searchPath: '/ConsultaPublica/',
      searchMethod: 'POST',
      searchParams: {
        'numeroProcesso': '{numeroProcesso}',
        'tipoProcesso': 'publica'
      },
      selectors: {
        processNumber: '.numero-processo',
        className: '.classe',
        subject: '.assunto',
        distributionDate: '.distribuicao',
        situation: '.situacao',
        location: '.vara',
        judge: '.magistrado',
        parties: '.partes tbody tr',
        lawyers: '.advogado',
        movements: '.movimentacoes tbody tr',
        movementDate: 'td:first-child',
        movementDescription: 'td:last-child',
        errorMessage: '.alert-danger'
      },
      requiresCaptcha: true,
      requiresCertificate: false,
      rateLimit: 4000
    });

    // TJRS - Tribunal de Justiça do Rio Grande do Sul
    this.rules.set('tjrs', {
      tribunal: 'tjrs',
      name: 'TJRS - Tribunal de Justiça do RS',
      baseURL: 'https://www1.tjrs.jus.br',
      searchPath: '/busca/?tb=proc',
      searchMethod: 'GET',
      searchParams: {
        'q': '{numeroProcesso}',
        'partialfields': 'tribunal:Tribunal%20de%20Justica%20do%20RS'
      },
      selectors: {
        processNumber: '.numero-processo',
        className: '.classe-processual',
        subject: '.assunto-processo',
        distributionDate: '.data-autuacao',
        situation: '.situacao-atual',
        location: '.orgao-julgador',
        judge: '.magistrado',
        parties: '.partes .parte',
        lawyers: '.advogados .advogado',
        movements: '.andamentos .andamento',
        movementDate: '.data-andamento',
        movementDescription: '.texto-andamento',
        errorMessage: '.sem-resultados'
      },
      requiresCaptcha: false,
      requiresCertificate: false,
      rateLimit: 2000
    });

    // TST - Tribunal Superior do Trabalho
    this.rules.set('tst', {
      tribunal: 'tst',
      name: 'TST - Tribunal Superior do Trabalho',
      baseURL: 'https://consultaunificada.tst.jus.br',
      searchPath: '/consulta.do',
      searchMethod: 'POST',
      searchParams: {
        'conscsjt.numeroTST': '{numeroProcesso}',
        'conscsjt.digito': '',
        'conscsjt.ano': '',
        'conscsjt.orgao': '',
        'conscsjt.tribunal': '',
        'conscsjt.origem': '',
        'conscsjt.tipoProcesso': '1',
        'conscsjt.proximaIteracao': 'false',
        'conscsjt.ordemIteracao': 'false'
      },
      selectors: {
        processNumber: '.numero-unico',
        className: '.classe-judicial',
        subject: '.assunto-principal',
        distributionDate: '.data-autuacao',
        situation: '.situacao-processo',
        location: '.orgao-julgador-atual',
        judge: '.magistrado',
        parties: '.partes-processo tbody tr',
        lawyers: '.representantes tbody tr',
        movements: '.movimentacoes tbody tr',
        movementDate: 'td:nth-child(1)',
        movementDescription: 'td:nth-child(2)',
        errorMessage: '.aviso'
      },
      requiresCaptcha: false,
      requiresCertificate: false,
      rateLimit: 3000
    });
  }

  async scrapeProcess(tribunal: TribunalType, numeroProcesso: string): Promise<ProcessoTribunalData> {
    const rule = this.rules.get(tribunal);
    
    if (!rule) {
      throw new Error(`Regras de scraping não encontradas para o tribunal: ${tribunal}`);
    }

    // Configurar cliente para o tribunal específico
    this.client = new RealTribunalClient({
      baseURL: rule.baseURL,
      timeout: 60000,
      rateLimitDelay: rule.rateLimit,
      retryAttempts: 3,
      enableStealth: true,
      userAgent: rule.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    try {
      let html: string;

      if (rule.requiresCaptcha || rule.requiresCertificate) {
        // Usar Puppeteer para casos complexos
        html = await this.scrapeWithPuppeteer(rule, numeroProcesso);
      } else {
        // Usar requisição HTTP simples
        html = await this.scrapeWithHTTP(rule, numeroProcesso);
      }

      return this.parseProcessData(html, rule, numeroProcesso);
    } catch (error) {
      throw new Error(`Erro no scraping do ${tribunal}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async scrapeWithHTTP(rule: ScrapingRule, numeroProcesso: string): Promise<string> {
    if (rule.searchMethod === 'GET') {
      // Substituir parâmetros na URL
      const params = new URLSearchParams();
      Object.entries(rule.searchParams).forEach(([key, value]) => {
        params.append(key, value.replace('{numeroProcesso}', numeroProcesso));
      });

      const response = await this.client.makeRequest({
        method: 'GET',
        url: `${rule.searchPath}?${params.toString()}`
      });

      return response.data;
    } else {
      // POST request
      const formData = new URLSearchParams();
      Object.entries(rule.searchParams).forEach(([key, value]) => {
        formData.append(key, value.replace('{numeroProcesso}', numeroProcesso));
      });

      const response = await this.client.makeRequest({
        method: 'POST',
        url: rule.searchPath,
        data: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    }
  }

  private async scrapeWithPuppeteer(rule: ScrapingRule, numeroProcesso: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Configurar user agent
      await page.setUserAgent(rule.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navegar para a página
      await page.goto(`${rule.baseURL}${rule.searchPath}`, { 
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      // Preencher formulário
      if (rule.searchMethod === 'POST') {
        for (const [key, value] of Object.entries(rule.searchParams)) {
          const inputValue = value.replace('{numeroProcesso}', numeroProcesso);
          
          // Tentar diferentes seletores para o campo
          const selectors = [
            `input[name="${key}"]`,
            `input[id="${key}"]`,
            `select[name="${key}"]`,
            `textarea[name="${key}"]`
          ];

          let fieldFound = false;
          for (const selector of selectors) {
            try {
              await page.waitForSelector(selector, { timeout: 5000 });
              await page.type(selector, inputValue);
              fieldFound = true;
              break;
            } catch (error) {
              // Continuar tentando outros seletores
            }
          }

          if (!fieldFound) {
            console.warn(`Campo não encontrado: ${key}`);
          }
        }

        // Resolver CAPTCHA se necessário
        if (rule.requiresCaptcha) {
          await this.solveCaptcha(page);
        }

        // Submeter formulário
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
          page.click('input[type="submit"], button[type="submit"], .btn-submit')
        ]);
      }

      // Aguardar carregamento dos resultados
      await page.waitForTimeout(2000);

      const content = await page.content();
      return content;
    } finally {
      await browser.close();
    }
  }

  private async solveCaptcha(page: any): Promise<void> {
    // Implementação básica - em produção seria necessário usar serviços de resolução de CAPTCHA
    // como 2captcha, Anti-Captcha, etc.
    
    try {
      // Procurar por CAPTCHA na página
      const captchaImg = await page.$('img[src*="captcha"], img[src*="verificacao"]');
      
      if (captchaImg) {
        console.log('CAPTCHA detectado - implementação de resolução necessária');
        
        // Aguardar um tempo para simular resolução manual
        await page.waitForTimeout(5000);
        
        // Em uma implementação real, aqui seria feita a integração com serviços de CAPTCHA
        // const captchaText = await solveCaptchaService(captchaImage);
        // await page.type('input[name="captcha"]', captchaText);
      }
    } catch (error) {
      console.warn('Erro ao processar CAPTCHA:', error);
    }
  }

  private parseProcessData(html: string, rule: ScrapingRule, numeroProcesso: string): ProcessoTribunalData {
    const $ = cheerio.load(html);

    // Verificar se houve erro na consulta
    if (rule.selectors.errorMessage) {
      const errorElement = $(rule.selectors.errorMessage);
      if (errorElement.length > 0) {
        throw new Error('Processo não encontrado ou erro na consulta');
      }
    }

    const dados: ProcessoTribunalData = {
      numero: numeroProcesso,
      classe: this.extractText($, rule.selectors.className),
      assunto: this.extractText($, rule.selectors.subject),
      dataAjuizamento: this.parseDate(this.extractText($, rule.selectors.distributionDate)),
      situacao: this.extractText($, rule.selectors.situation) || 'Em andamento',
      localizacao: this.extractText($, rule.selectors.location),
      orgaoJulgador: this.extractText($, rule.selectors.judge) || rule.name,
      partes: this.extractParties($, rule.selectors.parties),
      advogados: this.extractLawyers($, rule.selectors.lawyers),
      movimentacoes: this.extractMovements($, rule),
      audiencias: [],
      documentos: [],
      recursos: []
    };

    return dados;
  }

  private extractText($: cheerio.CheerioAPI, selector: string): string {
    return $(selector).first().text().trim();
  }

  private extractParties($: cheerio.CheerioAPI, selector: string): any[] {
    const parties: any[] = [];
    
    $(selector).each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        parties.push({
          nome: text,
          tipo: 'outros',
          documento: this.extractDocumentFromText(text)
        });
      }
    });

    return parties;
  }

  private extractLawyers($: cheerio.CheerioAPI, selector: string): any[] {
    const lawyers: any[] = [];
    
    $(selector).each((i, el) => {
      const text = $(el).text().trim();
      const oabMatch = text.match(/OAB[\\/\s]*([A-Z]{2})[\\/\s]*(\d+)/i);
      
      if (oabMatch) {
        const nome = text.replace(/OAB[\\/\s]*[A-Z]{2}[\\/\s]*\d+/i, '').trim();
        
        lawyers.push({
          nome,
          oab: oabMatch[2],
          uf: oabMatch[1],
          tipo: 'parte_autora',
          ativo: true
        });
      }
    });

    return lawyers;
  }

  private extractMovements($: cheerio.CheerioAPI, rule: ScrapingRule): MovimentacaoTribunal[] {
    const movements: MovimentacaoTribunal[] = [];
    
    $(rule.selectors.movements).each((i, el) => {
      const $el = $(el);
      const data = $el.find(rule.selectors.movementDate).text().trim();
      const descricao = $el.find(rule.selectors.movementDescription).text().trim();
      
      if (data && descricao) {
        movements.push({
          id: `${rule.tribunal}-mov-${i}`,
          data: this.parseDate(data),
          titulo: this.extractTitle(descricao),
          descricao,
          oficial: true
        });
      }
    });

    return movements.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
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

  private extractTitle(description: string): string {
    const lines = description.split('\n');
    let title = lines[0].trim();
    
    if (title.length > 100) {
      title = title.substring(0, 100) + '...';
    }
    
    return title || 'Movimentação processual';
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

  // Adicionar nova regra de scraping
  addScrapingRule(rule: ScrapingRule): void {
    this.rules.set(rule.tribunal, rule);
  }

  // Listar tribunais suportados
  getSupportedTribunals(): TribunalType[] {
    return Array.from(this.rules.keys());
  }

  // Verificar se um tribunal é suportado
  isSupported(tribunal: TribunalType): boolean {
    return this.rules.has(tribunal);
  }

  // Testar conectividade com um tribunal
  async testTribunal(tribunal: TribunalType): Promise<boolean> {
    const rule = this.rules.get(tribunal);
    
    if (!rule) {
      return false;
    }

    try {
      const testClient = new RealTribunalClient({
        baseURL: rule.baseURL,
        timeout: 10000
      });

      const response = await testClient.makeRequest({
        method: 'GET',
        url: '/'
      });

      await testClient.cleanup();
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.client.cleanup();
  }
}

export { TribunalScraper };
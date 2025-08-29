// src/services/realTribunalClient.service.ts

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { parseString } from 'xml2js';
// Browser compatibility - these will be mocked or handled differently
// import * as https from 'https';
// import * as fs from 'fs';
import * as forge from 'node-forge';

// Puppeteer para scraping quando necessário
let puppeteer: any;
try {
  puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());
} catch (error) {
  console.warn('Puppeteer não disponível:', error);
}

interface CertificateConfig {
  cert?: string;
  key?: string;
  passphrase?: string;
  ca?: string[];
}

interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

interface RealTribunalClientConfig {
  baseURL: string;
  timeout?: number;
  certificates?: CertificateConfig;
  proxy?: ProxyConfig;
  userAgent?: string;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimitDelay?: number;
  enableCookies?: boolean;
  enableStealth?: boolean;
}

class RealTribunalClient {
  private axiosClient: AxiosInstance;
  private cookieJar: CookieJar;
  private config: RealTribunalClientConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private parseXML = (data: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      parseString(data, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };

  constructor(config: RealTribunalClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimitDelay: 1000,
      enableCookies: true,
      enableStealth: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...config
    };

    this.cookieJar = new CookieJar();
    this.axiosClient = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const axiosConfig: AxiosRequestConfig = {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    };

    // Configurar HTTPS com certificados se necessário (apenas em Node.js)
    if (this.config.certificates && typeof window === 'undefined') {
      // Esta funcionalidade só está disponível no servidor/backend
      console.warn('Certificados HTTPS não são suportados no browser');
    }

    // Configurar proxy se necessário
    if (this.config.proxy) {
      axiosConfig.proxy = {
        host: this.config.proxy.host,
        port: this.config.proxy.port,
        auth: this.config.proxy.auth
      };
    }

    let client = axios.create(axiosConfig);

    // Adicionar suporte a cookies se habilitado
    if (this.config.enableCookies) {
      client = wrapper(client);
      (client.defaults as any).jar = this.cookieJar;
    }

    // Adicionar interceptors para retry automático
    client.interceptors.response.use(
      response => response,
      async error => {
        const config = error.config;
        
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < this.config.retryAttempts!) {
          config.retry++;
          
          // Delay exponencial
          const delay = this.config.retryDelay! * Math.pow(2, config.retry - 1);
          await this.sleep(delay);
          
          return client.request(config);
        }

        return Promise.reject(error);
      }
    );

    return client;
  }

  // Fazer requisição HTTP com rate limiting
  async makeRequest(config: AxiosRequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Implementar rate limiting
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          
          if (timeSinceLastRequest < this.config.rateLimitDelay!) {
            await this.sleep(this.config.rateLimitDelay! - timeSinceLastRequest);
          }

          this.lastRequestTime = Date.now();
          
          const response = await this.axiosClient.request(config);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      await request();
    }

    this.isProcessingQueue = false;
  }

  // Fazer scraping com Puppeteer quando necessário
  async scrapePage(url: string, options: any = {}): Promise<any> {
    if (!puppeteer) {
      throw new Error('Puppeteer não está disponível');
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ],
      ...options.launchOptions
    });

    try {
      const page = await browser.newPage();
      
      // Configurar user agent e outras headers
      await page.setUserAgent(this.config.userAgent!);
      
      // Adicionar stealth se habilitado
      if (this.config.enableStealth) {
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
        });
      }

      // Navegar para a página
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: this.config.timeout 
      });

      // Executar ações customizadas se fornecidas
      if (options.actions) {
        await options.actions(page);
      }

      // Extrair conteúdo
      const content = await page.content();
      
      await browser.close();
      return content;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // Parser para diferentes formatos de resposta
  async parseResponse(data: string, format: 'html' | 'xml' | 'json' = 'html'): Promise<any> {
    switch (format) {
      case 'html':
        return cheerio.load(data);
        
      case 'xml':
        return await this.parseXML(data);
        
      case 'json':
        return JSON.parse(data);
        
      default:
        return data;
    }
  }

  // Carregar certificado digital A1/A3 (apenas no servidor)
  async loadCertificate(certPath: string, password?: string): Promise<CertificateConfig> {
    if (typeof window !== 'undefined') {
      throw new Error('Certificados digitais não são suportados no browser');
    }
    
    // Em um ambiente real de produção, isso seria implementado no backend
    throw new Error('Funcionalidade de certificados deve ser implementada no backend');
  }

  // Utilitários
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Limpar recursos
  async cleanup(): Promise<void> {
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Métodos específicos para diferentes tipos de consulta

  // Consulta via formulário POST (E-SAJ, TJSP)
  async consultarFormulario(params: Record<string, string>, formSelector?: string): Promise<any> {
    const response = await this.makeRequest({
      method: 'POST',
      url: '',
      data: new URLSearchParams(params),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return this.parseResponse(response.data, 'html');
  }

  // Consulta via API REST
  async consultarAPI(endpoint: string, params: any = {}, method: 'GET' | 'POST' = 'GET'): Promise<any> {
    const response = await this.makeRequest({
      method,
      url: endpoint,
      [method === 'GET' ? 'params' : 'data']: params,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined
    });

    return response.data;
  }

  // Consulta via SOAP
  async consultarSOAP(soapAction: string, xmlBody: string): Promise<any> {
    const response = await this.makeRequest({
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soapAction
      },
      data: xmlBody
    });

    return this.parseResponse(response.data, 'xml');
  }

  // Consulta via scraping com navegação complexa
  async consultarComNavegacao(url: string, steps: Array<(page: any) => Promise<void>>): Promise<any> {
    if (!puppeteer) {
      throw new Error('Puppeteer necessário para navegação complexa');
    }

    const browser = await puppeteer.launch({ headless: true });
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      
      await page.goto(url);
      
      // Executar passos de navegação
      for (const step of steps) {
        await step(page);
        await page.waitForTimeout(1000); // Aguardar entre passos
      }
      
      const content = await page.content();
      await browser.close();
      
      return this.parseResponse(content, 'html');
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  // Métodos de validação e formatação
  static validarNumeroProcesso(numero: string): boolean {
    // Validar formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
    const regex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
    return regex.test(numero);
  }

  static formatarNumeroProcesso(numero: string): string {
    // Remover caracteres especiais e formatar
    const digits = numero.replace(/\D/g, '');
    if (digits.length === 20) {
      return `${digits.substr(0, 7)}-${digits.substr(7, 2)}.${digits.substr(9, 4)}.${digits.substr(13, 1)}.${digits.substr(14, 2)}.${digits.substr(16, 4)}`;
    }
    return numero;
  }

  static extrairDadosProcesso(html: string): any {
    const $ = cheerio.load(html);
    
    // Padrões comuns para extrair dados
    const dados: any = {
      numero: null,
      classe: null,
      assunto: null,
      distribuicao: null,
      juiz: null,
      valor: null,
      partes: [],
      movimentacoes: []
    };

    // Extrair informações básicas (padrões comuns)
    dados.numero = $('*:contains("Processo")').first().text().match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)?.[0];
    dados.classe = $('*:contains("Classe")').next().text().trim();
    dados.assunto = $('*:contains("Assunto")').next().text().trim();
    dados.distribuicao = $('*:contains("Distribuição")').next().text().match(/\d{2}\/\d{2}\/\d{4}/)?.[0];

    // Extrair partes do processo
    $('*:contains("Autor"), *:contains("Requerente")').each((i, el) => {
      const nome = $(el).next().text().trim();
      if (nome) {
        dados.partes.push({ tipo: 'autor', nome });
      }
    });

    $('*:contains("Réu"), *:contains("Requerido")').each((i, el) => {
      const nome = $(el).next().text().trim();
      if (nome) {
        dados.partes.push({ tipo: 'reu', nome });
      }
    });

    return dados;
  }
}

export { RealTribunalClient, type RealTribunalClientConfig, type CertificateConfig, type ProxyConfig };
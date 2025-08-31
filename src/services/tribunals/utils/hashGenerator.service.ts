// src/services/tribunals/utils/hashGenerator.service.ts

import { ProcessMovement, ProcessBasicInfo, ProcessQueryResult } from '../scrapers/baseScraper';

/**
 * Tipo de conteúdo para hash
 */
export type HashContentType = 
  | 'movement'
  | 'process'
  | 'query_result'
  | 'content'
  | 'combined';

/**
 * Configuração do hash
 */
export interface HashConfig {
  algorithm: 'md5' | 'sha256' | 'simple';
  includeTimestamp: boolean;
  normalizeDates: boolean;
  ignoreWhitespace: boolean;
  caseSensitive: boolean;
  includeMetadata: boolean;
}

/**
 * Resultado da geração de hash
 */
export interface HashResult {
  hash: string;
  algorithm: string;
  inputSize: number;
  contentType: HashContentType;
  config: HashConfig;
  generatedAt: string;
  debugInfo?: {
    originalContent: string;
    normalizedContent: string;
    components: string[];
  };
}

/**
 * Service para geração de hashes MD5 e outros algoritmos
 * Focado na detecção de duplicatas e mudanças em movimentações processuais
 */
export class HashGeneratorService {
  
  private static defaultConfig: HashConfig = {
    algorithm: 'md5',
    includeTimestamp: false,
    normalizeDates: true,
    ignoreWhitespace: true,
    caseSensitive: false,
    includeMetadata: false
  };
  
  /**
   * Gera hash de uma movimentação processual
   */
  static generateMovementHash(
    movement: ProcessMovement,
    config?: Partial<HashConfig>
  ): HashResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Componentes principais da movimentação
    const components = [
      this.normalizeDate(movement.date, finalConfig),
      this.normalizeText(movement.title, finalConfig),
      this.normalizeText(movement.description || '', finalConfig),
      this.normalizeText(movement.author || '', finalConfig),
      movement.type || 'outros'
    ];
    
    // Incluir anexos se relevantes
    if (movement.attachments && movement.attachments.length > 0) {
      const attachmentInfo = movement.attachments
        .map(att => `${att.name}:${att.type}`)
        .sort()
        .join('|');
      components.push(this.normalizeText(attachmentInfo, finalConfig));
    }
    
    const content = components.filter(c => c.length > 0).join('|');
    const hash = this.calculateHash(content, finalConfig.algorithm);
    
    return {
      hash,
      algorithm: finalConfig.algorithm,
      inputSize: content.length,
      contentType: 'movement',
      config: finalConfig,
      generatedAt: new Date().toISOString(),
      debugInfo: finalConfig.includeMetadata ? {
        originalContent: JSON.stringify(movement, null, 2),
        normalizedContent: content,
        components
      } : undefined
    };
  }
  
  /**
   * Gera hash das informações básicas do processo
   */
  static generateProcessHash(
    processInfo: ProcessBasicInfo,
    config?: Partial<HashConfig>
  ): HashResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const components = [
      this.normalizeText(processInfo.number, finalConfig),
      this.normalizeText(processInfo.court, finalConfig),
      this.normalizeText(processInfo.subject, finalConfig),
      this.normalizeText(processInfo.status, finalConfig),
      this.normalizeText(processInfo.judge || '', finalConfig),
      this.normalizeText(processInfo.courtRoom || '', finalConfig),
      this.normalizeText(processInfo.processClass || '', finalConfig),
      processInfo.value || ''
    ];
    
    // Incluir partes (ordenadas para consistência)
    if (processInfo.parties) {
      components.push(
        processInfo.parties.plaintiffs.sort().join(';'),
        processInfo.parties.defendants.sort().join(';'),
        processInfo.parties.lawyers.sort().join(';')
      );
    }
    
    // Incluir datas normalizadas
    if (processInfo.distributionDate) {
      components.push(this.normalizeDate(processInfo.distributionDate, finalConfig));
    }
    
    const content = components.filter(c => c.length > 0).join('|');
    const hash = this.calculateHash(content, finalConfig.algorithm);
    
    return {
      hash,
      algorithm: finalConfig.algorithm,
      inputSize: content.length,
      contentType: 'process',
      config: finalConfig,
      generatedAt: new Date().toISOString(),
      debugInfo: finalConfig.includeMetadata ? {
        originalContent: JSON.stringify(processInfo, null, 2),
        normalizedContent: content,
        components
      } : undefined
    };
  }
  
  /**
   * Gera hash do resultado completo da consulta
   */
  static generateQueryResultHash(
    queryResult: ProcessQueryResult,
    config?: Partial<HashConfig>
  ): HashResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const components = [
      queryResult.status,
      queryResult.processNumber,
      queryResult.tribunal
    ];
    
    // Incluir informações básicas se disponíveis
    if (queryResult.basicInfo) {
      const processHash = this.generateProcessHash(queryResult.basicInfo, finalConfig);
      components.push(processHash.hash);
    }
    
    // Incluir hash das movimentações
    if (queryResult.movements && queryResult.movements.length > 0) {
      const movementHashes = queryResult.movements
        .map(mov => this.generateMovementHash(mov, finalConfig).hash)
        .sort(); // Ordenar para consistência
      components.push(movementHashes.join(';'));
      components.push(`movements_count:${queryResult.movements.length}`);
    }
    
    // Incluir timestamp apenas se configurado
    if (finalConfig.includeTimestamp) {
      components.push(queryResult.queryTimestamp);
    }
    
    const content = components.filter(c => c.length > 0).join('|');
    const hash = this.calculateHash(content, finalConfig.algorithm);
    
    return {
      hash,
      algorithm: finalConfig.algorithm,
      inputSize: content.length,
      contentType: 'query_result',
      config: finalConfig,
      generatedAt: new Date().toISOString(),
      debugInfo: finalConfig.includeMetadata ? {
        originalContent: JSON.stringify(queryResult, null, 2),
        normalizedContent: content,
        components
      } : undefined
    };
  }
  
  /**
   * Gera hash de conteúdo texto genérico
   */
  static generateContentHash(
    content: string,
    contentType: HashContentType = 'content',
    config?: Partial<HashConfig>
  ): HashResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const normalizedContent = this.normalizeText(content, finalConfig);
    const hash = this.calculateHash(normalizedContent, finalConfig.algorithm);
    
    return {
      hash,
      algorithm: finalConfig.algorithm,
      inputSize: normalizedContent.length,
      contentType,
      config: finalConfig,
      generatedAt: new Date().toISOString(),
      debugInfo: finalConfig.includeMetadata ? {
        originalContent: content,
        normalizedContent,
        components: [normalizedContent]
      } : undefined
    };
  }
  
  /**
   * Gera hash combinado de múltiplos elementos
   */
  static generateCombinedHash(
    elements: Array<{
      content: string;
      weight?: number;
    }>,
    config?: Partial<HashConfig>
  ): HashResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const components = elements
      .map(elem => {
        const normalized = this.normalizeText(elem.content, finalConfig);
        const weight = elem.weight || 1;
        return weight > 1 ? `${normalized}:w${weight}` : normalized;
      })
      .filter(c => c.length > 0);
    
    const content = components.join('|');
    const hash = this.calculateHash(content, finalConfig.algorithm);
    
    return {
      hash,
      algorithm: finalConfig.algorithm,
      inputSize: content.length,
      contentType: 'combined',
      config: finalConfig,
      generatedAt: new Date().toISOString(),
      debugInfo: finalConfig.includeMetadata ? {
        originalContent: JSON.stringify(elements, null, 2),
        normalizedContent: content,
        components
      } : undefined
    };
  }
  
  /**
   * Compara dois hashes e retorna se são iguais
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    return hash1.toLowerCase() === hash2.toLowerCase();
  }
  
  /**
   * Valida se um hash tem formato válido
   */
  static validateHash(hash: string, algorithm: 'md5' | 'sha256' | 'simple' = 'md5'): boolean {
    if (!hash || typeof hash !== 'string') return false;
    
    switch (algorithm) {
      case 'md5':
        return /^[a-f0-9]{32}$/i.test(hash);
      case 'sha256':
        return /^[a-f0-9]{64}$/i.test(hash);
      case 'simple':
        return /^[a-f0-9]{8,16}$/i.test(hash);
      default:
        return false;
    }
  }
  
  /**
   * Gera hash curto (8 caracteres) para identificação rápida
   */
  static generateShortHash(content: string): string {
    const fullHash = this.calculateHash(content, 'md5');
    return fullHash.substring(0, 8);
  }
  
  /**
   * Detecta mudanças entre dois objetos baseado em hash
   */
  static detectChanges<T>(
    oldData: T,
    newData: T,
    hashFunction: (data: T) => HashResult
  ): {
    hasChanged: boolean;
    oldHash: string;
    newHash: string;
    similarity: number;
  } {
    const oldHash = hashFunction(oldData);
    const newHash = hashFunction(newData);
    
    const hasChanged = !this.compareHashes(oldHash.hash, newHash.hash);
    const similarity = hasChanged ? 0 : 100;
    
    return {
      hasChanged,
      oldHash: oldHash.hash,
      newHash: newHash.hash,
      similarity
    };
  }
  
  /**
   * Normaliza texto baseado na configuração
   */
  private static normalizeText(text: string, config: HashConfig): string {
    if (!text) return '';
    
    let normalized = text;
    
    // Remover espaços em branco extras se configurado
    if (config.ignoreWhitespace) {
      normalized = normalized.replace(/\s+/g, ' ').trim();
    }
    
    // Case sensitivity
    if (!config.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    
    // Normalizar acentos
    normalized = normalized
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    return normalized;
  }
  
  /**
   * Normaliza data para formato consistente
   */
  private static normalizeDate(dateStr: string, config: HashConfig): string {
    if (!dateStr || !config.normalizeDates) return dateStr;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Tentar parse de formato brasileiro
        const brazilianFormat = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (brazilianFormat) {
          const [, day, month, year] = brazilianFormat;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
      }
      
      // Retornar apenas a data (sem horário)
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }
  
  /**
   * Calcula hash usando algoritmo especificado
   */
  private static calculateHash(content: string, algorithm: 'md5' | 'sha256' | 'simple'): string {
    switch (algorithm) {
      case 'md5':
        return this.md5(content);
      case 'sha256':
        return this.sha256(content);
      case 'simple':
        return this.simpleHash(content);
      default:
        return this.md5(content);
    }
  }
  
  /**
   * Implementação MD5 simplificada (para ambiente browser/Node)
   */
  private static md5(content: string): string {
    // Implementação simplificada baseada em hash numérico
    // Em produção, usar biblioteca crypto real
    const hash1 = this.simpleHash(content);
    const hash2 = this.simpleHash(content.split('').reverse().join(''));
    const hash3 = this.simpleHash(content + content.length);
    const hash4 = this.simpleHash(content.toLowerCase() + content.toUpperCase());
    
    return (hash1 + hash2 + hash3 + hash4).padStart(32, '0');
  }
  
  /**
   * Implementação SHA256 simplificada
   */
  private static sha256(content: string): string {
    // Implementação simplificada - em produção usar crypto real
    const md5Hash = this.md5(content);
    const reverseHash = this.md5(content.split('').reverse().join(''));
    return (md5Hash + reverseHash).padStart(64, '0');
  }
  
  /**
   * Hash simples baseado em algoritmo de string
   */
  private static simpleHash(content: string): string {
    let hash = 0;
    if (content.length === 0) return '00000000';
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

export default HashGeneratorService;
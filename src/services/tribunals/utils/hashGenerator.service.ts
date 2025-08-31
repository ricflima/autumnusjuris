// src/services/tribunals/utils/hashGenerator.service.ts

import { TribunalMovement } from '../../../types/tribunal.types';
import { MovementQueryResult } from '../../tribunalMovements.service';

/**
 * Tipo de conteúdo para hash
 */
export type HashContentType = 
  | 'movement'
  | 'process'
  | 'query'
  | 'custom';

/**
 * Configuração do hash
 */
export interface HashConfig {
  algorithm: 'md5' | 'sha256' | 'simple';
  includeMetadata: boolean;
  normalizeContent: boolean;
  excludeFields?: string[];
}

/**
 * Resultado do hash
 */
export interface HashResult {
  hash: string;
  algorithm: string;
  contentType: HashContentType;
  createdAt: Date;
  metadata?: {
    originalContent: string;
    normalizedContent: string;
    components: string[];
  };
}

/**
 * Service para geração de hashes de conteúdo
 * Versão simplificada para o sistema DataJud
 */
export class HashGeneratorService {
  
  /**
   * Gera hash de uma movimentação específica
   */
  static generateMovementHash(
    movement: TribunalMovement,
    config: Partial<HashConfig> = {}
  ): HashResult {
    const finalConfig: HashConfig = {
      algorithm: 'simple',
      includeMetadata: false,
      normalizeContent: true,
      ...config
    };

    const content = [
      movement.movementDate.toISOString(),
      movement.title,
      movement.description || '',
      movement.isJudicial ? 'judicial' : 'administrative'
    ].join('|');

    const hash = this.simpleHash(content);

    return {
      hash,
      algorithm: finalConfig.algorithm,
      contentType: 'movement',
      createdAt: new Date(),
      metadata: finalConfig.includeMetadata ? {
        originalContent: content,
        normalizedContent: content,
        components: [movement.title, movement.description || '']
      } : undefined
    };
  }

  /**
   * Gera hash do conteúdo das movimentações (método principal)
   */
  static generateContentHash(movements: TribunalMovement[]): string {
    if (!movements || movements.length === 0) return '';
    
    const content = movements
      .sort((a, b) => a.movementDate.getTime() - b.movementDate.getTime())
      .map(mov => `${mov.title}-${mov.movementDate.toISOString()}-${mov.hash}`)
      .join('|');
    
    return this.simpleHash(content);
  }

  /**
   * Gera hash das informações básicas do processo
   */
  static generateProcessHash(
    processInfo: any,
    config?: Partial<HashConfig>
  ): string {
    if (!processInfo) return '';

    const content = [
      processInfo.number || '',
      processInfo.court || '',
      processInfo.subject || '',
      JSON.stringify(processInfo.parties || {}),
      processInfo.status || ''
    ].join('|');

    return this.simpleHash(content);
  }

  /**
   * Gera hash de resultado de consulta
   */
  static generateQueryHash(
    queryResult: MovementQueryResult,
    config?: Partial<HashConfig>
  ): string {
    const content = JSON.stringify({
      success: queryResult.success,
      processInfo: queryResult.processInfo,
      movementCount: queryResult.movements?.length || 0,
      tribunal: queryResult.tribunal
    });

    return this.simpleHash(content);
  }

  /**
   * Implementação simples de hash (compatível com sistema anterior)
   */
  static simpleHash(content: string): string {
    let hash = 0;
    if (content.length === 0) return hash.toString(16);

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Verifica se dois hashes são iguais
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    return hash1 === hash2;
  }

  /**
   * Gera hash com timestamp para garantir unicidade
   */
  static generateUniqueHash(content: string): string {
    const timestamp = Date.now().toString();
    const combined = `${content}-${timestamp}`;
    return this.simpleHash(combined);
  }
}

export default HashGeneratorService;
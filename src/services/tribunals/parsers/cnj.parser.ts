// src/services/tribunals/parsers/cnj.parser.ts

/**
 * Parser CNJ - Sistema de reconhecimento e validação de números processuais CNJ
 * 
 * Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
 * - NNNNNNN: Número sequencial do processo
 * - DD: Dígito verificador
 * - AAAA: Ano do ajuizamento
 * - J: Segmento do Poder Judiciário
 * - TR: Tribunal do respectivo segmento
 * - OOOO: Código da unidade de origem
 */

export interface CNJProcessNumber {
  // Número completo formatado
  fullNumber: string;
  
  // Componentes do número
  sequentialNumber: string;
  verificationDigit: string;
  year: string;
  judiciarySegment: string;
  tribunalCode: string;
  originUnit: string;
  
  // Informações derivadas
  isValid: boolean;
  tribunalName: string;
  judiciarySegmentName: string;
  region?: string;
  
  // Dados para consulta
  cleanNumber: string; // Apenas números
  formattedNumber: string; // Com formatação CNJ
}

export interface CNJValidationResult {
  isValid: boolean;
  error?: string;
  processNumber?: CNJProcessNumber;
}

/**
 * Mapeamento dos segmentos do Poder Judiciário
 */
const JUDICIARY_SEGMENTS = {
  '1': 'Supremo Tribunal Federal',
  '2': 'Conselho Nacional de Justiça',
  '3': 'Superior Tribunal de Justiça',
  '4': 'Justiça Federal',
  '5': 'Justiça do Trabalho',
  '6': 'Justiça Eleitoral',
  '7': 'Justiça Militar da União',
  '8': 'Justiça Estadual',
  '9': 'Justiça Militar Estadual'
} as const;

/**
 * Mapeamento dos tribunais por segmento
 */
const TRIBUNAL_CODES = {
  // Segmento 1 - STF
  '1': {
    '01': 'Supremo Tribunal Federal'
  },
  
  // Segmento 3 - STJ
  '3': {
    '01': 'Superior Tribunal de Justiça'
  },
  
  // Segmento 4 - Justiça Federal
  '4': {
    '01': 'Tribunal Regional Federal da 1ª Região',
    '02': 'Tribunal Regional Federal da 2ª Região', 
    '03': 'Tribunal Regional Federal da 3ª Região',
    '04': 'Tribunal Regional Federal da 4ª Região',
    '05': 'Tribunal Regional Federal da 5ª Região',
    '06': 'Tribunal Regional Federal da 6ª Região'
  },
  
  // Segmento 5 - Justiça do Trabalho
  '5': {
    '01': 'Tribunal Regional do Trabalho da 1ª Região',
    '02': 'Tribunal Regional do Trabalho da 2ª Região',
    '03': 'Tribunal Regional do Trabalho da 3ª Região',
    '04': 'Tribunal Regional do Trabalho da 4ª Região',
    '05': 'Tribunal Regional do Trabalho da 5ª Região',
    '06': 'Tribunal Regional do Trabalho da 6ª Região',
    '07': 'Tribunal Regional do Trabalho da 7ª Região',
    '08': 'Tribunal Regional do Trabalho da 8ª Região',
    '09': 'Tribunal Regional do Trabalho da 9ª Região',
    '10': 'Tribunal Regional do Trabalho da 10ª Região',
    '11': 'Tribunal Regional do Trabalho da 11ª Região',
    '12': 'Tribunal Regional do Trabalho da 12ª Região',
    '13': 'Tribunal Regional do Trabalho da 13ª Região',
    '14': 'Tribunal Regional do Trabalho da 14ª Região',
    '15': 'Tribunal Regional do Trabalho da 15ª Região',
    '16': 'Tribunal Regional do Trabalho da 16ª Região',
    '17': 'Tribunal Regional do Trabalho da 17ª Região',
    '18': 'Tribunal Regional do Trabalho da 18ª Região',
    '19': 'Tribunal Regional do Trabalho da 19ª Região',
    '20': 'Tribunal Regional do Trabalho da 20ª Região',
    '21': 'Tribunal Regional do Trabalho da 21ª Região',
    '22': 'Tribunal Regional do Trabalho da 22ª Região',
    '23': 'Tribunal Regional do Trabalho da 23ª Região',
    '24': 'Tribunal Regional do Trabalho da 24ª Região',
    '90': 'Tribunal Superior do Trabalho'
  },
  
  // Segmento 8 - Justiça Estadual (Numeração Oficial CNJ)
  '8': {
    '01': 'Tribunal de Justiça do Acre', // TJAC
    '02': 'Tribunal de Justiça de Alagoas', // TJAL  
    '03': 'Tribunal de Justiça do Amapá', // TJAP
    '04': 'Tribunal de Justiça do Amazonas', // TJAM
    '05': 'Tribunal de Justiça da Bahia', // TJBA
    '06': 'Tribunal de Justiça do Ceará', // TJCE
    '07': 'Tribunal de Justiça do Distrito Federal e Territórios', // TJDF
    '08': 'Tribunal de Justiça do Espírito Santo', // TJES
    '09': 'Tribunal de Justiça de Goiás', // TJGO
    '10': 'Tribunal de Justiça do Maranhão', // TJMA
    '11': 'Tribunal de Justiça de Mato Grosso', // TJMT
    '12': 'Tribunal de Justiça de Mato Grosso do Sul', // TJMS
    '13': 'Tribunal de Justiça de Minas Gerais', // TJMG
    '14': 'Tribunal de Justiça do Pará', // TJPA
    '15': 'Tribunal de Justiça da Paraíba', // TJPB
    '16': 'Tribunal de Justiça do Paraná', // TJPR
    '17': 'Tribunal de Justiça de Pernambuco', // TJPE
    '18': 'Tribunal de Justiça do Piauí', // TJPI
    '19': 'Tribunal de Justiça do Rio de Janeiro', // TJRJ
    '20': 'Tribunal de Justiça do Rio Grande do Norte', // TJRN
    '21': 'Tribunal de Justiça do Rio Grande do Sul', // TJRS
    '22': 'Tribunal de Justiça de Rondônia', // TJRO
    '23': 'Tribunal de Justiça de Roraima', // TJRR
    '24': 'Tribunal de Justiça de Santa Catarina', // TJSC
    '25': 'Tribunal de Justiça de Sergipe', // TJSE
    '26': 'Tribunal de Justiça de São Paulo', // TJSP
    '27': 'Tribunal de Justiça do Tocantins' // TJTO
  }
} as const;

export class CNJParser {
  
  /**
   * Regex para validar formato CNJ
   */
  private static readonly CNJ_REGEX = /^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;
  
  /**
   * Regex para extrair apenas números
   */
  private static readonly NUMBERS_ONLY_REGEX = /\D/g;
  
  /**
   * Valida e parseia um número processual CNJ
   */
  static parse(processNumber: string): CNJValidationResult {
    try {
      // Limpar e normalizar o número
      const cleanInput = processNumber.trim();
      
      if (!cleanInput) {
        return {
          isValid: false,
          error: 'Número do processo não pode estar vazio'
        };
      }
      
      // Tentar fazer match com o regex CNJ
      const match = cleanInput.match(this.CNJ_REGEX);
      
      if (!match) {
        return {
          isValid: false,
          error: 'Formato do número processual inválido. Esperado: NNNNNNN-DD.AAAA.J.TR.OOOO'
        };
      }
      
      const [
        fullMatch,
        sequentialNumber,
        verificationDigit,
        year,
        judiciarySegment,
        tribunalCode,
        originUnit
      ] = match;
      
      // Validar dígito verificador
      const calculatedDigit = this.calculateVerificationDigit(
        sequentialNumber + year + judiciarySegment + tribunalCode + originUnit + '00'
      );
      
      if (verificationDigit !== calculatedDigit) {
        return {
          isValid: false,
          error: `Dígito verificador inválido. Esperado: ${calculatedDigit}, encontrado: ${verificationDigit}`
        };
      }
      
      // Validar segmento do judiciário
      const judiciarySegmentName = JUDICIARY_SEGMENTS[judiciarySegment as keyof typeof JUDICIARY_SEGMENTS];
      if (!judiciarySegmentName) {
        return {
          isValid: false,
          error: `Segmento do Poder Judiciário inválido: ${judiciarySegment}`
        };
      }
      
      // Validar tribunal
      const tribunalInfo = TRIBUNAL_CODES[judiciarySegment as keyof typeof TRIBUNAL_CODES];
      if (!tribunalInfo) {
        return {
          isValid: false,
          error: `Segmento do judiciário não mapeado: ${judiciarySegment}`
        };
      }
      
      const tribunalName = tribunalInfo[tribunalCode as keyof typeof tribunalInfo];
      if (!tribunalName) {
        return {
          isValid: false,
          error: `Código do tribunal inválido: ${tribunalCode} para segmento ${judiciarySegment}`
        };
      }
      
      // Validar ano (deve ser razoável)
      const yearNum = parseInt(year);
      const currentYear = new Date().getFullYear();
      if (yearNum < 1990 || yearNum > currentYear + 1) {
        return {
          isValid: false,
          error: `Ano do processo inválido: ${year}. Deve estar entre 1990 e ${currentYear + 1}`
        };
      }
      
      // Extrair região se aplicável
      let region: string | undefined;
      if (judiciarySegment === '4' || judiciarySegment === '5') {
        const regionMatch = tribunalName.match(/(\d+)ª Região/);
        if (regionMatch) {
          region = regionMatch[1] + 'ª Região';
        }
      }
      
      const processNumberData: CNJProcessNumber = {
        fullNumber: cleanInput,
        sequentialNumber,
        verificationDigit,
        year,
        judiciarySegment,
        tribunalCode,
        originUnit,
        isValid: true,
        tribunalName,
        judiciarySegmentName,
        region,
        cleanNumber: cleanInput.replace(this.NUMBERS_ONLY_REGEX, ''),
        formattedNumber: cleanInput
      };
      
      return {
        isValid: true,
        processNumber: processNumberData
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Erro ao processar número: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
  
  /**
   * Calcula o dígito verificador CNJ usando algoritmo módulo 97
   */
  private static calculateVerificationDigit(numberString: string): string {
    // Converter para número inteiro grande
    const remainder = this.mod97(numberString);
    
    // Calcular dígito verificador
    const digit = 98 - remainder;
    
    // Retornar com zero à esquerda se necessário
    return digit.toString().padStart(2, '0');
  }
  
  /**
   * Implementa módulo 97 para números grandes (string)
   */
  private static mod97(numberString: string): number {
    let remainder = 0;
    
    for (let i = 0; i < numberString.length; i++) {
      remainder = (remainder * 10 + parseInt(numberString[i])) % 97;
    }
    
    return remainder;
  }
  
  /**
   * Formata um número processual limpo para o padrão CNJ
   */
  static format(cleanNumber: string): string | null {
    // Remover tudo que não é número
    const numbers = cleanNumber.replace(this.NUMBERS_ONLY_REGEX, '');
    
    // Deve ter exatamente 20 dígitos
    if (numbers.length !== 20) {
      return null;
    }
    
    // Aplicar formatação CNJ
    return `${numbers.substr(0, 7)}-${numbers.substr(7, 2)}.${numbers.substr(9, 4)}.${numbers.substr(13, 1)}.${numbers.substr(14, 2)}.${numbers.substr(16, 4)}`;
  }
  
  /**
   * Extrai apenas números de uma string
   */
  static extractNumbers(input: string): string {
    return input.replace(this.NUMBERS_ONLY_REGEX, '');
  }
  
  /**
   * Verifica se uma string parece ser um número processual
   */
  static looksLikeProcessNumber(input: string): boolean {
    const numbers = this.extractNumbers(input);
    return numbers.length === 20;
  }
  
  /**
   * Lista todos os tribunais disponíveis
   */
  static getAllTribunals(): Array<{
    code: string;
    name: string;
    segment: string;
    segmentName: string;
  }> {
    const tribunals: Array<{
      code: string;
      name: string;
      segment: string;
      segmentName: string;
    }> = [];
    
    Object.entries(TRIBUNAL_CODES).forEach(([segment, tribunalMap]) => {
      const segmentName = JUDICIARY_SEGMENTS[segment as keyof typeof JUDICIARY_SEGMENTS];
      
      Object.entries(tribunalMap).forEach(([code, name]) => {
        tribunals.push({
          code: segment + code,
          name,
          segment,
          segmentName
        });
      });
    });
    
    return tribunals;
  }
  
  /**
   * Busca tribunal por código completo (segmento + código)
   */
  static findTribunalByCode(code: string): {
    name: string;
    segment: string;
    segmentName: string;
  } | null {
    if (code.length !== 3) return null;
    
    const segment = code.substr(0, 1);
    const tribunalCode = code.substr(1, 2);
    
    const tribunalMap = TRIBUNAL_CODES[segment as keyof typeof TRIBUNAL_CODES];
    if (!tribunalMap) return null;
    
    const tribunalName = tribunalMap[tribunalCode as keyof typeof tribunalMap];
    if (!tribunalName) return null;
    
    const segmentName = JUDICIARY_SEGMENTS[segment as keyof typeof JUDICIARY_SEGMENTS];
    
    return {
      name: tribunalName,
      segment,
      segmentName
    };
  }
}

export default CNJParser;
// src/services/processNumberParser.service.ts

import { TribunalType } from '@/types/tribunalIntegration';

interface ProcessNumberInfo {
  isValid: boolean;
  tribunal?: TribunalType;
  tribunalName?: string;
  court?: string;
  year?: number;
  segment?: string;
  origin?: string;
  sequential?: string;
  verificationDigit?: string;
}

class ProcessNumberParserService {
  // Padrão do número do processo brasileiro: NNNNNNN-DD.AAAA.J.TR.OOOO
  private readonly PROCESS_NUMBER_PATTERN = /^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;

  // Mapeamento de códigos de tribunal para tipos de tribunal
  private readonly TRIBUNAL_CODES: Record<string, { type: TribunalType; name: string; segment: string }> = {
    // Justiça Estadual
    '01': { type: 'tjac', name: 'Tribunal de Justiça do Acre', segment: 'Estadual' },
    '02': { type: 'tjal', name: 'Tribunal de Justiça de Alagoas', segment: 'Estadual' },
    '03': { type: 'tjap', name: 'Tribunal de Justiça do Amapá', segment: 'Estadual' },
    '04': { type: 'tjam', name: 'Tribunal de Justiça do Amazonas', segment: 'Estadual' },
    '05': { type: 'tjba', name: 'Tribunal de Justiça da Bahia', segment: 'Estadual' },
    '06': { type: 'tjce', name: 'Tribunal de Justiça do Ceará', segment: 'Estadual' },
    '07': { type: 'tjdf', name: 'Tribunal de Justiça do Distrito Federal', segment: 'Estadual' },
    '08': { type: 'tjes', name: 'Tribunal de Justiça do Espírito Santo', segment: 'Estadual' },
    '09': { type: 'tjgo', name: 'Tribunal de Justiça de Goiás', segment: 'Estadual' },
    '10': { type: 'tjma', name: 'Tribunal de Justiça do Maranhão', segment: 'Estadual' },
    '11': { type: 'tjmt', name: 'Tribunal de Justiça de Mato Grosso', segment: 'Estadual' },
    '12': { type: 'tjms', name: 'Tribunal de Justiça de Mato Grosso do Sul', segment: 'Estadual' },
    '13': { type: 'tjmg', name: 'Tribunal de Justiça de Minas Gerais', segment: 'Estadual' },
    '14': { type: 'tjpa', name: 'Tribunal de Justiça do Pará', segment: 'Estadual' },
    '15': { type: 'tjpb', name: 'Tribunal de Justiça da Paraíba', segment: 'Estadual' },
    '16': { type: 'tjpr', name: 'Tribunal de Justiça do Paraná', segment: 'Estadual' },
    '17': { type: 'tjpe', name: 'Tribunal de Justiça de Pernambuco', segment: 'Estadual' },
    '18': { type: 'tjpi', name: 'Tribunal de Justiça do Piauí', segment: 'Estadual' },
    '19': { type: 'tjrj', name: 'Tribunal de Justiça do Rio de Janeiro', segment: 'Estadual' },
    '20': { type: 'tjrn', name: 'Tribunal de Justiça do Rio Grande do Norte', segment: 'Estadual' },
    '21': { type: 'tjrs', name: 'Tribunal de Justiça do Rio Grande do Sul', segment: 'Estadual' },
    '22': { type: 'tjro', name: 'Tribunal de Justiça de Rondônia', segment: 'Estadual' },
    '23': { type: 'tjrr', name: 'Tribunal de Justiça de Roraima', segment: 'Estadual' },
    '24': { type: 'tjsc', name: 'Tribunal de Justiça de Santa Catarina', segment: 'Estadual' },
    '25': { type: 'tjse', name: 'Tribunal de Justiça de Sergipe', segment: 'Estadual' },
    '26': { type: 'tjsp', name: 'Tribunal de Justiça de São Paulo', segment: 'Estadual' },
    '27': { type: 'tjto', name: 'Tribunal de Justiça do Tocantins', segment: 'Estadual' },

    // Justiça Federal
    '30': { type: 'trf1', name: 'Tribunal Regional Federal da 1ª Região', segment: 'Federal' },
    '31': { type: 'trf2', name: 'Tribunal Regional Federal da 2ª Região', segment: 'Federal' },
    '32': { type: 'trf3', name: 'Tribunal Regional Federal da 3ª Região', segment: 'Federal' },
    '33': { type: 'trf4', name: 'Tribunal Regional Federal da 4ª Região', segment: 'Federal' },
    '34': { type: 'trf5', name: 'Tribunal Regional Federal da 5ª Região', segment: 'Federal' },

    // Justiça do Trabalho
    '01_5': { type: 'trt01', name: 'Tribunal Regional do Trabalho da 1ª Região', segment: 'Trabalho' },
    '02_5': { type: 'trt02', name: 'Tribunal Regional do Trabalho da 2ª Região', segment: 'Trabalho' },
    '03_5': { type: 'trt03', name: 'Tribunal Regional do Trabalho da 3ª Região', segment: 'Trabalho' },
    '04_5': { type: 'trt04', name: 'Tribunal Regional do Trabalho da 4ª Região', segment: 'Trabalho' },
    '05_5': { type: 'trt05', name: 'Tribunal Regional do Trabalho da 5ª Região', segment: 'Trabalho' },
    '06_5': { type: 'trt06', name: 'Tribunal Regional do Trabalho da 6ª Região', segment: 'Trabalho' },
    '07_5': { type: 'trt07', name: 'Tribunal Regional do Trabalho da 7ª Região', segment: 'Trabalho' },
    '08_5': { type: 'trt08', name: 'Tribunal Regional do Trabalho da 8ª Região', segment: 'Trabalho' },
    '09_5': { type: 'trt09', name: 'Tribunal Regional do Trabalho da 9ª Região', segment: 'Trabalho' },
    '10_5': { type: 'trt10', name: 'Tribunal Regional do Trabalho da 10ª Região', segment: 'Trabalho' },
    '11_5': { type: 'trt11', name: 'Tribunal Regional do Trabalho da 11ª Região', segment: 'Trabalho' },
    '12_5': { type: 'trt12', name: 'Tribunal Regional do Trabalho da 12ª Região', segment: 'Trabalho' },
    '13_5': { type: 'trt13', name: 'Tribunal Regional do Trabalho da 13ª Região', segment: 'Trabalho' },
    '14_5': { type: 'trt14', name: 'Tribunal Regional do Trabalho da 14ª Região', segment: 'Trabalho' },
    '15_5': { type: 'trt15', name: 'Tribunal Regional do Trabalho da 15ª Região', segment: 'Trabalho' },
    '16_5': { type: 'trt16', name: 'Tribunal Regional do Trabalho da 16ª Região', segment: 'Trabalho' },
    '17_5': { type: 'trt17', name: 'Tribunal Regional do Trabalho da 17ª Região', segment: 'Trabalho' },
    '18_5': { type: 'trt18', name: 'Tribunal Regional do Trabalho da 18ª Região', segment: 'Trabalho' },
    '19_5': { type: 'trt19', name: 'Tribunal Regional do Trabalho da 19ª Região', segment: 'Trabalho' },
    '20_5': { type: 'trt20', name: 'Tribunal Regional do Trabalho da 20ª Região', segment: 'Trabalho' },
    '21_5': { type: 'trt21', name: 'Tribunal Regional do Trabalho da 21ª Região', segment: 'Trabalho' },
    '22_5': { type: 'trt22', name: 'Tribunal Regional do Trabalho da 22ª Região', segment: 'Trabalho' },
    '23_5': { type: 'trt23', name: 'Tribunal Regional do Trabalho da 23ª Região', segment: 'Trabalho' },
    '24_5': { type: 'trt24', name: 'Tribunal Regional do Trabalho da 24ª Região', segment: 'Trabalho' }
  };

  // Mapeamento de segmentos do judiciário
  private readonly JUDICIAL_SEGMENTS: Record<string, string> = {
    '1': 'Supremo Tribunal Federal',
    '2': 'Conselho Nacional de Justiça',
    '3': 'Superior Tribunal de Justiça',
    '4': 'Justiça Federal',
    '5': 'Justiça do Trabalho',
    '6': 'Justiça Eleitoral',
    '7': 'Justiça Militar da União',
    '8': 'Justiça dos Estados e do Distrito Federal',
    '9': 'Justiça Militar Estadual'
  };

  parseProcessNumber(processNumber: string): ProcessNumberInfo {
    // Limpar e normalizar o número
    const cleanNumber = processNumber.replace(/[^\d\-\.]/g, '').trim();
    
    if (!cleanNumber) {
      return { isValid: false };
    }

    // Verificar se corresponde ao padrão brasileiro
    const match = cleanNumber.match(this.PROCESS_NUMBER_PATTERN);
    
    if (!match) {
      return { isValid: false };
    }

    const [, sequential, verificationDigit, year, segment, tribunalCode, origin] = match;

    const segmentName = this.JUDICIAL_SEGMENTS[segment];
    
    // Para Justiça do Trabalho (segmento 5)
    if (segment === '5') {
      const tribunalKey = `${tribunalCode}_5`;
      const tribunalInfo = this.TRIBUNAL_CODES[tribunalKey];
      
      if (tribunalInfo) {
        return {
          isValid: true,
          tribunal: tribunalInfo.type,
          tribunalName: tribunalInfo.name,
          court: tribunalInfo.name,
          year: parseInt(year),
          segment: segmentName,
          origin,
          sequential,
          verificationDigit
        };
      }
    }

    // Para outros segmentos (principalmente Justiça Estadual)
    const tribunalInfo = this.TRIBUNAL_CODES[tribunalCode];
    
    if (tribunalInfo) {
      return {
        isValid: true,
        tribunal: tribunalInfo.type,
        tribunalName: tribunalInfo.name,
        court: tribunalInfo.name,
        year: parseInt(year),
        segment: segmentName,
        origin,
        sequential,
        verificationDigit
      };
    }

    // Se não encontrou correspondência específica, retorna informações básicas
    return {
      isValid: true,
      year: parseInt(year),
      segment: segmentName,
      origin,
      sequential,
      verificationDigit
    };
  }

  // Método específico para identificar se é um processo trabalhista
  isLaborProcess(processNumber: string): boolean {
    const info = this.parseProcessNumber(processNumber);
    return info.isValid && info.segment === 'Justiça do Trabalho';
  }

  // Método para obter informações simplificadas
  getBasicInfo(processNumber: string): { tribunal?: TribunalType; tribunalName?: string; isValid: boolean } {
    const info = this.parseProcessNumber(processNumber);
    return {
      tribunal: info.tribunal,
      tribunalName: info.tribunalName,
      isValid: info.isValid
    };
  }

  // Método para formatar número de processo
  formatProcessNumber(processNumber: string): string {
    const cleanNumber = processNumber.replace(/[^\d]/g, '');
    
    if (cleanNumber.length !== 20) {
      return processNumber; // Retorna original se não tem 20 dígitos
    }

    // Aplica máscara: NNNNNNN-DD.AAAA.J.TR.OOOO
    return `${cleanNumber.substring(0, 7)}-${cleanNumber.substring(7, 9)}.${cleanNumber.substring(9, 13)}.${cleanNumber.substring(13, 14)}.${cleanNumber.substring(14, 16)}.${cleanNumber.substring(16, 20)}`;
  }

  // Método para validar se o número de processo está no formato correto
  isValidFormat(processNumber: string): boolean {
    const cleanNumber = processNumber.replace(/[^\d\-\.]/g, '');
    return this.PROCESS_NUMBER_PATTERN.test(cleanNumber);
  }

  // Método para obter todos os tribunais suportados
  getSupportedTribunals(): Array<{ code: string; type: TribunalType; name: string; segment: string }> {
    return Object.entries(this.TRIBUNAL_CODES).map(([code, info]) => ({
      code,
      type: info.type,
      name: info.name,
      segment: info.segment
    }));
  }
}

export const processNumberParserService = new ProcessNumberParserService();
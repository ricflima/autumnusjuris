interface TribunalMapping {
  cnjCode: string;
  datajudCode: string;
  name: string;
  type: 'estadual' | 'federal' | 'trabalhista' | 'superior' | 'especial';
  region?: string;
}

/**
 * Mapeamento completo CNJ → DataJud
 * Converte códigos de tribunal do padrão CNJ para endpoints da API DataJud
 */
export class CNJDatajudMapper {
  
  private static readonly TRIBUNAL_MAPPINGS: TribunalMapping[] = [
    // TRIBUNAIS SUPERIORES
    { cnjCode: '90', datajudCode: 'STJ', name: 'Superior Tribunal de Justiça', type: 'superior' },
    { cnjCode: '91', datajudCode: 'TST', name: 'Tribunal Superior do Trabalho', type: 'superior' },
    { cnjCode: '92', datajudCode: 'TSE', name: 'Tribunal Superior Eleitoral', type: 'superior' },
    { cnjCode: '93', datajudCode: 'STM', name: 'Superior Tribunal Militar', type: 'superior' },
    
    // JUSTIÇA FEDERAL (TRFs) - Segmento Judiciário = 4
    { cnjCode: '401', datajudCode: 'TRF1', name: 'Tribunal Regional Federal da 1ª Região', type: 'federal', region: '1' },
    { cnjCode: '402', datajudCode: 'TRF2', name: 'Tribunal Regional Federal da 2ª Região', type: 'federal', region: '2' },
    { cnjCode: '403', datajudCode: 'TRF3', name: 'Tribunal Regional Federal da 3ª Região', type: 'federal', region: '3' },
    { cnjCode: '404', datajudCode: 'TRF4', name: 'Tribunal Regional Federal da 4ª Região', type: 'federal', region: '4' },
    { cnjCode: '405', datajudCode: 'TRF5', name: 'Tribunal Regional Federal da 5ª Região', type: 'federal', region: '5' },
    { cnjCode: '406', datajudCode: 'TRF6', name: 'Tribunal Regional Federal da 6ª Região', type: 'federal', region: '6' },

    // JUSTIÇA ESTADUAL (TJs) - Segmento Judiciário = 8
    { cnjCode: '801', datajudCode: 'TJAC', name: 'Tribunal de Justiça do Acre', type: 'estadual', region: 'AC' },
    { cnjCode: '802', datajudCode: 'TJAL', name: 'Tribunal de Justiça de Alagoas', type: 'estadual', region: 'AL' },
    { cnjCode: '803', datajudCode: 'TJAP', name: 'Tribunal de Justiça do Amapá', type: 'estadual', region: 'AP' },
    { cnjCode: '804', datajudCode: 'TJAM', name: 'Tribunal de Justiça do Amazonas', type: 'estadual', region: 'AM' },
    { cnjCode: '805', datajudCode: 'TJBA', name: 'Tribunal de Justiça da Bahia', type: 'estadual', region: 'BA' },
    { cnjCode: '806', datajudCode: 'TJCE', name: 'Tribunal de Justiça do Ceará', type: 'estadual', region: 'CE' },
    { cnjCode: '807', datajudCode: 'TJDFT', name: 'TJ do Distrito Federal e Territórios', type: 'estadual', region: 'DF' },
    { cnjCode: '808', datajudCode: 'TJES', name: 'Tribunal de Justiça do Espírito Santo', type: 'estadual', region: 'ES' },
    { cnjCode: '809', datajudCode: 'TJGO', name: 'Tribunal de Justiça de Goiás', type: 'estadual', region: 'GO' },
    { cnjCode: '810', datajudCode: 'TJMA', name: 'Tribunal de Justiça do Maranhão', type: 'estadual', region: 'MA' },
    { cnjCode: '811', datajudCode: 'TJMT', name: 'Tribunal de Justiça de Mato Grosso', type: 'estadual', region: 'MT' },
    { cnjCode: '812', datajudCode: 'TJMS', name: 'TJ do Mato Grosso do Sul', type: 'estadual', region: 'MS' },
    { cnjCode: '813', datajudCode: 'TJMG', name: 'Tribunal de Justiça de Minas Gerais', type: 'estadual', region: 'MG' },
    { cnjCode: '814', datajudCode: 'TJPA', name: 'Tribunal de Justiça do Pará', type: 'estadual', region: 'PA' },
    { cnjCode: '815', datajudCode: 'TJPB', name: 'Tribunal de Justiça da Paraíba', type: 'estadual', region: 'PB' },
    { cnjCode: '816', datajudCode: 'TJPR', name: 'Tribunal de Justiça do Paraná', type: 'estadual', region: 'PR' },
    { cnjCode: '817', datajudCode: 'TJPE', name: 'Tribunal de Justiça de Pernambuco', type: 'estadual', region: 'PE' },
    { cnjCode: '818', datajudCode: 'TJPI', name: 'Tribunal de Justiça do Piauí', type: 'estadual', region: 'PI' },
    { cnjCode: '819', datajudCode: 'TJRJ', name: 'Tribunal de Justiça do Rio de Janeiro', type: 'estadual', region: 'RJ' },
    { cnjCode: '820', datajudCode: 'TJRN', name: 'Tribunal de Justiça do Rio Grande do Norte', type: 'estadual', region: 'RN' },
    { cnjCode: '821', datajudCode: 'TJRS', name: 'Tribunal de Justiça do Rio Grande do Sul', type: 'estadual', region: 'RS' },
    { cnjCode: '822', datajudCode: 'TJRO', name: 'Tribunal de Justiça de Rondônia', type: 'estadual', region: 'RO' },
    { cnjCode: '823', datajudCode: 'TJRR', name: 'Tribunal de Justiça de Roraima', type: 'estadual', region: 'RR' },
    { cnjCode: '824', datajudCode: 'TJSC', name: 'Tribunal de Justiça de Santa Catarina', type: 'estadual', region: 'SC' },
    { cnjCode: '825', datajudCode: 'TJSE', name: 'Tribunal de Justiça de Sergipe', type: 'estadual', region: 'SE' },
    { cnjCode: '826', datajudCode: 'TJSP', name: 'Tribunal de Justiça de São Paulo', type: 'estadual', region: 'SP' },
    { cnjCode: '827', datajudCode: 'TJTO', name: 'Tribunal de Justiça do Tocantins', type: 'estadual', region: 'TO' }
  ];

  /**
   * Mapear número CNJ completo para código DataJud
   * Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
   * J = Segmento Judiciário, TR = Tribunal
   */
  static mapCNJToDatajud(numeroProcessoCNJ: string): {
    success: boolean;
    tribunalCode?: string;
    tribunalName?: string;
    type?: string;
    error?: string;
  } {
    try {
      // Validar formato básico CNJ
      const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
      if (!cnjRegex.test(numeroProcessoCNJ)) {
        return {
          success: false,
          error: 'Formato de número CNJ inválido'
        };
      }

      // Extrair segmento judiciário e tribunal
      const parts = numeroProcessoCNJ.split('.');
      if (parts.length < 4) {
        return {
          success: false,
          error: 'Não foi possível extrair informações do número CNJ'
        };
      }

      const segmentoJudiciario = parts[2]; // J
      const tribunalCNJ = parts[3].substring(0, 2); // TR (primeiros 2 dígitos)

      // Construir código completo para busca
      const codigoCompleto = segmentoJudiciario + tribunalCNJ;

      // Buscar mapeamento
      const mapping = this.TRIBUNAL_MAPPINGS.find(map => map.cnjCode === codigoCompleto);

      if (!mapping) {
        return {
          success: false,
          error: `Tribunal não encontrado para código CNJ ${codigoCompleto} (segmento: ${segmentoJudiciario}, tribunal: ${tribunalCNJ})`
        };
      }

      return {
        success: true,
        tribunalCode: mapping.datajudCode,
        tribunalName: mapping.name,
        type: mapping.type
      };

    } catch (error) {
      return {
        success: false,
        error: `Erro ao processar número CNJ: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Mapear código de tribunal direto (ex: TJSP, TRF1) para endpoint DataJud
   */
  static mapTribunalCodeToDatajud(tribunalCode: string): {
    success: boolean;
    datajudCode?: string;
    name?: string;
    endpoint?: string;
    error?: string;
  } {
    const mapping = this.TRIBUNAL_MAPPINGS.find(map => map.datajudCode === tribunalCode);

    if (!mapping) {
      return {
        success: false,
        error: `Tribunal ${tribunalCode} não encontrado nos mapeamentos`
      };
    }

    return {
      success: true,
      datajudCode: mapping.datajudCode,
      name: mapping.name,
      endpoint: this.getDatajudEndpoint(mapping.datajudCode)
    };
  }

  /**
   * Obter endpoint DataJud para tribunal
   */
  private static getDatajudEndpoint(tribunalCode: string): string {
    return `api_publica_${tribunalCode.toLowerCase()}`;
  }

  /**
   * Obter todos os tribunais mapeados
   */
  static getAllTribunals(): TribunalMapping[] {
    return [...this.TRIBUNAL_MAPPINGS];
  }

  /**
   * Obter tribunais por tipo
   */
  static getTribunalsByType(type: TribunalMapping['type']): TribunalMapping[] {
    return this.TRIBUNAL_MAPPINGS.filter(mapping => mapping.type === type);
  }

  /**
   * Validar se tribunal está disponível na API DataJud
   */
  static isTribunalAvailable(tribunalCode: string): boolean {
    return this.TRIBUNAL_MAPPINGS.some(mapping => mapping.datajudCode === tribunalCode);
  }

  /**
   * Obter informações completas de um tribunal pelo código CNJ
   */
  static getTribunalInfo(numeroProcessoCNJ: string): {
    success: boolean;
    tribunal?: {
      cnjCode: string;
      datajudCode: string;
      name: string;
      type: string;
      region?: string;
      endpoint: string;
    };
    error?: string;
  } {
    const mappingResult = this.mapCNJToDatajud(numeroProcessoCNJ);
    
    if (!mappingResult.success) {
      return {
        success: false,
        error: mappingResult.error
      };
    }

    const mapping = this.TRIBUNAL_MAPPINGS.find(map => map.datajudCode === mappingResult.tribunalCode);
    
    if (!mapping) {
      return {
        success: false,
        error: 'Mapeamento não encontrado'
      };
    }

    return {
      success: true,
      tribunal: {
        cnjCode: mapping.cnjCode,
        datajudCode: mapping.datajudCode,
        name: mapping.name,
        type: mapping.type,
        region: mapping.region,
        endpoint: this.getDatajudEndpoint(mapping.datajudCode)
      }
    };
  }

  /**
   * Estatísticas dos tribunais disponíveis
   */
  static getStatistics(): {
    total: number;
    byType: { [key: string]: number };
    available: number;
    coverage: number;
  } {
    const byType = this.TRIBUNAL_MAPPINGS.reduce((acc, mapping) => {
      acc[mapping.type] = (acc[mapping.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      total: this.TRIBUNAL_MAPPINGS.length,
      byType,
      available: this.TRIBUNAL_MAPPINGS.length,
      coverage: 100 // 100% dos tribunais mapeados estão disponíveis na API DataJud
    };
  }
}
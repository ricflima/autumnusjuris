import { TribunalMovement } from '../../../types/tribunal.types';

interface DatajudMovement {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{
    codigo: number;
    descricao: string;
    valor: number;
    nome: string;
  }>;
  orgaoJulgador?: {
    codigoOrgao: number;
    nomeOrgao: string;
  };
}

interface DatajudProcess {
  numeroProcesso: string;
  tribunal: string;
  dataAjuizamento: string;
  grau: string;
  nivelSigilo: number;
  formato: {
    codigo: number;
    nome: string;
  };
  sistema: {
    codigo: number;
    nome: string;
  };
  classe: {
    codigo: number;
    nome: string;
  };
  assuntos: Array<{
    codigo: number;
    nome: string;
  }>;
  orgaoJulgador: {
    codigo: number;
    nome: string;
    codigoMunicipioIBGE: number;
  };
  movimentos: DatajudMovement[];
  dataHoraUltimaAtualizacao: string;
  '@timestamp': string;
  id: string;
}

export class DatajudParser {
  
  /**
   * Converter processo DataJud para formato interno
   */
  static parseProcess(datajudProcess: DatajudProcess): {
    success: boolean;
    movements?: TribunalMovement[];
    metadata?: any;
    error?: string;
  } {
    try {
      if (!datajudProcess.movimentos || !Array.isArray(datajudProcess.movimentos)) {
        return {
          success: true,
          movements: [],
          metadata: this.extractMetadata(datajudProcess)
        };
      }

      const movements = datajudProcess.movimentos
        .map((mov, index) => this.parseMovement(mov, datajudProcess, index))
        .filter(movement => movement !== null) as TribunalMovement[];

      // Ordenar por data (mais recente primeiro)
      movements.sort((a, b) => b.movementDate.getTime() - a.movementDate.getTime());

      return {
        success: true,
        movements,
        metadata: this.extractMetadata(datajudProcess)
      };

    } catch (error) {
      return {
        success: false,
        error: `Erro ao processar dados DataJud: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Converter movimentação individual DataJud para formato interno
   */
  private static parseMovement(
    movement: DatajudMovement,
    process: DatajudProcess,
    index: number
  ): TribunalMovement | null {
    try {
      // Validar dados obrigatórios
      if (!movement.dataHora || !movement.nome) {
        console.warn('Movimento inválido - dados obrigatórios ausentes:', movement);
        return null;
      }

      // Converter data
      const movementDate = new Date(movement.dataHora);
      if (isNaN(movementDate.getTime())) {
        console.warn('Data de movimento inválida:', movement.dataHora);
        return null;
      }

      // Gerar hash único
      const hash = this.generateMovementHash({
        processNumber: process.numeroProcesso,
        tribunal: process.tribunal,
        date: movementDate,
        code: movement.codigo,
        name: movement.nome
      });

      // Classificar movimento
      const isJudicial = this.classifyMovement(movement);
      
      // Construir descrição completa
      const description = this.buildDescription(movement);

      // Extrair título
      const title = this.extractTitle(movement.nome);

      return {
        id: `datajud-${process.tribunal}-${process.numeroProcesso}-${movement.codigo}-${index}`,
        processNumber: process.numeroProcesso,
        tribunal: process.tribunal,
        movementDate,
        movementCode: movement.codigo.toString(),
        title,
        description,
        isJudicial,
        hash,
        source: 'api-publica.datajud.cnj.jus.br',
        discoveredAt: new Date(),
        isNew: true,
        metadata: {
          codigoTPU: movement.codigo,
          grauProcesso: process.grau,
          sistemaProcessual: process.sistema.nome,
          orgaoJulgadorMovimento: movement.orgaoJulgador,
          complementosTabelados: movement.complementosTabelados,
          classeProcessual: process.classe,
          assuntosProcesso: process.assuntos,
          orgaoJulgadorPrincipal: process.orgaoJulgador,
          dataAjuizamento: process.dataAjuizamento,
          ultimaAtualizacao: process.dataHoraUltimaAtualizacao
        }
      };

    } catch (error) {
      console.error('Erro ao processar movimento:', error, movement);
      return null;
    }
  }

  /**
   * Extrair metadados do processo
   */
  private static extractMetadata(process: DatajudProcess): any {
    return {
      dataAjuizamento: process.dataAjuizamento,
      grau: process.grau,
      nivelSigilo: process.nivelSigilo,
      formato: process.formato,
      sistema: process.sistema,
      classe: process.classe,
      assuntos: process.assuntos,
      orgaoJulgador: process.orgaoJulgador,
      dataHoraUltimaAtualizacao: process.dataHoraUltimaAtualizacao,
      timestampDatajud: process['@timestamp'],
      idDatajud: process.id,
      tribunal: process.tribunal
    };
  }

  /**
   * Construir descrição completa da movimentação
   */
  private static buildDescription(movement: DatajudMovement): string {
    let description = movement.nome;

    // Adicionar complementos tabelados
    if (movement.complementosTabelados && movement.complementosTabelados.length > 0) {
      const complementos = movement.complementosTabelados
        .map(comp => {
          const descricao = comp.descricao || 'Complemento';
          const valor = comp.nome || comp.valor?.toString() || 'N/A';
          return `${descricao}: ${valor}`;
        })
        .join('; ');
      
      description += `\n\nComplementos: ${complementos}`;
    }

    // Adicionar órgão julgador específico se diferente
    if (movement.orgaoJulgador?.nomeOrgao) {
      description += `\n\nÓrgão Julgador: ${movement.orgaoJulgador.nomeOrgao}`;
    }

    return description.trim();
  }

  /**
   * Extrair título da movimentação
   */
  private static extractTitle(nome: string): string {
    // Limitar título a 100 caracteres
    return nome.length > 100 ? nome.substring(0, 100) + '...' : nome;
  }

  /**
   * Classificar movimento como judicial ou administrativo
   */
  private static classifyMovement(movement: DatajudMovement): boolean {
    const codigo = movement.codigo;
    const nome = movement.nome.toLowerCase();

    // Códigos TPU conhecidos para movimentos judiciais
    const codigosJudiciais = [
      123,   // Decisão
      132,   // Recebimento
      193,   // Intimação
      246,   // Juntada
      60,    // Expedição
      51,    // Audiência
      85,    // Baixa
      11,    // Distribuição
      26,    // Conclusão
      854,   // Intimação pelo Diário Eletrônico
      14732  // Conversão de Autos
    ];

    // Verificar por código TPU
    if (codigosJudiciais.includes(codigo)) {
      return true;
    }

    // Códigos administrativos conhecidos
    const codigosAdministrativos = [
      245,  // Provisório
      999,  // Diversos
      1000  // Outros
    ];

    if (codigosAdministrativos.includes(codigo)) {
      return false;
    }

    // Classificar por palavras-chave no nome
    const palavrasJudiciais = [
      'decisão', 'sentença', 'despacho', 'acórdão', 'liminar',
      'tutela', 'embargo', 'agravo', 'recurso', 'apelação',
      'audiência', 'citação', 'intimação', 'conclusão',
      'julgado', 'transitado', 'expedição', 'mandado',
      'vista', 'carga', 'baixa'
    ];

    const palavrasAdministrativas = [
      'cadastro', 'alteração', 'correção', 'retificação',
      'inclusão', 'exclusão', 'atualização', 'registro',
      'protocolo', 'recebimento', 'distribuição', 'autuação'
    ];

    // Verificar palavras judiciais
    if (palavrasJudiciais.some(palavra => nome.includes(palavra))) {
      return true;
    }

    // Verificar palavras administrativas
    if (palavrasAdministrativas.some(palavra => nome.includes(palavra))) {
      return false;
    }

    // Por padrão, considerar judicial se não identificado
    return true;
  }

  /**
   * Gerar hash MD5 para deduplicação
   */
  private static generateMovementHash(data: {
    processNumber: string;
    tribunal: string;
    date: Date;
    code: number;
    name: string;
  }): string {
    const crypto = require('crypto');
    const hashInput = `${data.tribunal}-${data.processNumber}-${data.date.toISOString()}-${data.code}-${data.name}`;
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  /**
   * Validar movimento processado
   */
  static validateMovement(movement: TribunalMovement): boolean {
    // Validações obrigatórias
    if (!movement.processNumber || 
        !movement.tribunal || 
        !movement.movementDate || 
        !movement.title || 
        !movement.description) {
      return false;
    }

    // Validar formato do número do processo
    if (!/^\d+$/.test(movement.processNumber.replace(/[^0-9]/g, ''))) {
      return false;
    }

    // Validar data (não pode ser muito futura ou muito antiga)
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const tenYearsAgo = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);

    if (movement.movementDate > oneYearFromNow || movement.movementDate < tenYearsAgo) {
      return false;
    }

    // Validar hash
    if (!movement.hash || movement.hash.length !== 32) {
      return false;
    }

    return true;
  }

  /**
   * Obter estatísticas dos movimentos parseados
   */
  static getParsingStats(movements: TribunalMovement[]): {
    total: number;
    judiciais: number;
    administrativos: number;
    porTribunal: { [tribunal: string]: number };
    ultimaMovimentacao?: Date;
    primeiraMovimentacao?: Date;
  } {
    const stats = {
      total: movements.length,
      judiciais: movements.filter(m => m.isJudicial).length,
      administrativos: movements.filter(m => !m.isJudicial).length,
      porTribunal: {} as { [tribunal: string]: number },
      ultimaMovimentacao: undefined as Date | undefined,
      primeiraMovimentacao: undefined as Date | undefined
    };

    // Contar por tribunal
    movements.forEach(mov => {
      stats.porTribunal[mov.tribunal] = (stats.porTribunal[mov.tribunal] || 0) + 1;
    });

    // Encontrar datas extremas
    if (movements.length > 0) {
      const dates = movements.map(m => m.movementDate);
      stats.ultimaMovimentacao = new Date(Math.max(...dates.map(d => d.getTime())));
      stats.primeiraMovimentacao = new Date(Math.min(...dates.map(d => d.getTime())));
    }

    return stats;
  }

  /**
   * Filtrar movimentos por critérios
   */
  static filterMovements(
    movements: TribunalMovement[],
    filters: {
      judicial?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      tribunal?: string;
      searchText?: string;
    }
  ): TribunalMovement[] {
    return movements.filter(movement => {
      // Filtro judicial/administrativo
      if (filters.judicial !== undefined && movement.isJudicial !== filters.judicial) {
        return false;
      }

      // Filtro por data
      if (filters.dateFrom && movement.movementDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && movement.movementDate > filters.dateTo) {
        return false;
      }

      // Filtro por tribunal
      if (filters.tribunal && movement.tribunal !== filters.tribunal) {
        return false;
      }

      // Filtro por texto
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchTitle = movement.title.toLowerCase().includes(searchLower);
        const matchDescription = movement.description.toLowerCase().includes(searchLower);
        if (!matchTitle && !matchDescription) {
          return false;
        }
      }

      return true;
    });
  }
}
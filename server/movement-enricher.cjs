// Sistema de enriquecimento de movimentações com detalhes processuais
class MovementEnricher {
  constructor() {
    // Dicionário TPU com explicações detalhadas
    this.tpuExplanations = {
      // Distribuição e Autuação
      '26': {
        name: 'Distribuição',
        category: 'Distribuição e Autuação',
        explanation: 'O processo foi distribuído por sorteio ou critério específico para uma vara/gabinete.',
        importance: 'medium',
        nextSteps: 'Aguardar análise inicial pelo magistrado e possível despacho.',
        legalImplications: 'Define competência e início do prazo para contestação/resposta.'
      },
      '11': {
        name: 'Recebimento dos Autos',
        category: 'Distribuição e Autuação',
        explanation: 'Os autos físicos ou digitais foram recebidos pela vara/gabinete.',
        importance: 'low',
        nextSteps: 'Processo seguirá para análise inicial.',
        legalImplications: 'Início formal da tramitação no órgão jurisdicional.'
      },

      // Decisões e Despachos
      '51': {
        name: 'Conclusão',
        category: 'Decisões e Despachos',
        explanation: 'Os autos foram conclusos ao magistrado para análise e decisão sobre determinada questão.',
        importance: 'high',
        nextSteps: 'Aguardar decisão judicial que pode ser: despacho, decisão interlocutória ou sentença.',
        legalImplications: 'Momento crítico - decisão judicial iminente que pode afetar o rumo do processo.'
      },
      '3': {
        name: 'Decisão',
        category: 'Decisões e Despachos',
        explanation: 'Foi proferida decisão judicial pelo magistrado sobre questão processual específica.',
        importance: 'urgent',
        nextSteps: 'Verificar teor da decisão e avaliar necessidade de recurso ou cumprimento.',
        legalImplications: 'Decisão com força judicial - pode gerar prazos recursais ou obrigações.'
      },
      '4': {
        name: 'Sentença',
        category: 'Decisões e Despachos',
        explanation: 'Sentença de mérito proferida pelo juiz, decidindo o pedido principal da ação.',
        importance: 'urgent',
        nextSteps: 'CRÍTICO: Verificar se procedente/improcedente e prazo recursal (15 dias).',
        legalImplications: 'Resolução do mérito - início do prazo para apelação (15 dias úteis).'
      },

      // Intimações e Citações
      '90': {
        name: 'Intimação',
        category: 'Intimações e Citações',
        explanation: 'Comunicação oficial para ciência de ato processual ou cumprimento de determinação.',
        importance: 'high',
        nextSteps: 'Verificar conteúdo da intimação e prazos para manifestação.',
        legalImplications: 'Pode gerar prazos processuais - não cumprimento pode causar preclusão.'
      },
      '20': {
        name: 'Citação',
        category: 'Intimações e Citações',
        explanation: 'Ato pelo qual se dá ciência ao réu da existência do processo, chamando-o para integrar a relação processual.',
        importance: 'urgent',
        nextSteps: 'Réu deve apresentar contestação no prazo legal (15 dias úteis).',
        legalImplications: 'Marco inicial para defesa - não contestação pode gerar revelia.'
      },

      // Recursos
      '62': {
        name: 'Recurso',
        category: 'Recursos',
        explanation: 'Foi interposto recurso contra decisão proferida nos autos.',
        importance: 'high',
        nextSteps: 'Aguardar análise da admissibilidade e possível contra-razões.',
        legalImplications: 'Suspende efeitos da decisão recorrida até julgamento do recurso.'
      },

      // Audiências
      '25': {
        name: 'Audiência',
        category: 'Audiências',
        explanation: 'Designação ou realização de audiência para instrução, conciliação ou outros atos processuais.',
        importance: 'high',
        nextSteps: 'Comparecer à audiência na data/hora designada ou verificar resultado.',
        legalImplications: 'Não comparecimento pode gerar confissão ficta ou arquivamento.'
      },

      // Publicações
      '92': {
        name: 'Publicação',
        category: 'Publicações',
        explanation: 'Ato processual foi publicado no Diário Oficial ou meio eletrônico oficial.',
        importance: 'medium',
        nextSteps: 'Tomar ciência do ato publicado e verificar se gera prazos.',
        legalImplications: 'Marco inicial para contagem de prazos processuais.'
      },

      // Expedição de Documentos
      '60': {
        name: 'Expedição de Documento',
        category: 'Expedição de Documentos',
        explanation: 'Foi expedido documento oficial como certidão, mandado, ofício ou carta.',
        importance: 'medium',
        nextSteps: 'Aguardar entrega/cumprimento do documento ou retirar se necessário.',
        legalImplications: 'Documento tem força oficial e pode gerar obrigações.'
      },

      // Juntada de Documentos
      '581': {
        name: 'Juntada de Documento',
        category: 'Juntada de Documentos',
        explanation: 'Documento foi juntado aos autos do processo.',
        importance: 'medium',
        nextSteps: 'Verificar natureza do documento juntado e possíveis manifestações.',
        legalImplications: 'Documento integra os autos e pode afetar o julgamento.'
      },

      // Remessas
      '123': {
        name: 'Remessa',
        category: 'Remessas',
        explanation: 'Os autos foram remetidos para outro órgão, instância ou setor.',
        importance: 'medium',
        nextSteps: 'Acompanhar tramitação no órgão de destino.',
        legalImplications: 'Mudança de competência ou encaminhamento para cumprimento.'
      },

      // Perícias
      '12306': {
        name: 'Nomeação de Perito',
        category: 'Perícias e Diligências',
        explanation: 'Foi nomeado perito oficial para realizar exame técnico no processo.',
        importance: 'high',
        nextSteps: 'Acompanhar prazo para apresentação do laudo pericial.',
        legalImplications: 'Prova técnica que pode ser decisiva para o julgamento do mérito.'
      }
    };

    // Categorias com cores e ícones
    this.categoryInfo = {
      'Distribuição e Autuação': { color: 'blue', icon: '📋', priority: 'low' },
      'Decisões e Despachos': { color: 'red', icon: '⚖️', priority: 'urgent' },
      'Intimações e Citações': { color: 'orange', icon: '📬', priority: 'high' },
      'Recursos': { color: 'purple', icon: '📈', priority: 'high' },
      'Audiências': { color: 'green', icon: '👥', priority: 'high' },
      'Publicações': { color: 'gray', icon: '📰', priority: 'medium' },
      'Expedição de Documentos': { color: 'yellow', icon: '📄', priority: 'medium' },
      'Juntada de Documentos': { color: 'cyan', icon: '📎', priority: 'medium' },
      'Remessas': { color: 'indigo', icon: '📤', priority: 'medium' },
      'Perícias e Diligências': { color: 'pink', icon: '🔬', priority: 'high' }
    };
  }

  // Enriquecer movimentação com detalhes
  enrichMovement(movement) {
    const code = movement.movementCode || movement.metadata?.codigoTPU?.toString();
    const enrichment = this.tpuExplanations[code];
    
    if (!enrichment) {
      return {
        ...movement,
        enriched: {
          category: 'Outros',
          explanation: 'Movimentação processual registrada no sistema.',
          importance: 'medium',
          nextSteps: 'Verificar detalhes da movimentação no sistema do tribunal.',
          legalImplications: 'Consulte o andamento completo no tribunal de origem.',
          categoryInfo: { color: 'gray', icon: '📄', priority: 'medium' }
        }
      };
    }

    const categoryInfo = this.categoryInfo[enrichment.category] || this.categoryInfo['Outros'];

    return {
      ...movement,
      enriched: {
        ...enrichment,
        categoryInfo,
        detailedDescription: this.buildDetailedDescription(movement, enrichment),
        actionRequired: this.determineActionRequired(movement, enrichment),
        timeline: this.buildTimeline(movement, enrichment)
      }
    };
  }

  // Construir descrição detalhada
  buildDetailedDescription(movement, enrichment) {
    let detailed = enrichment.explanation;

    // Adicionar informações específicas dos complementos
    if (movement.metadata?.complementosTabelados) {
      const complementos = movement.metadata.complementosTabelados
        .map(comp => {
          const desc = comp.descricao || 'Complemento';
          const valor = comp.nome || comp.valor || 'N/A';
          return `${desc}: ${valor}`;
        })
        .join('; ');
      
      detailed += `\n\n📋 Detalhes específicos: ${complementos}`;
    }

    // Adicionar contexto temporal
    const movDate = new Date(movement.movementDate);
    const daysDiff = Math.floor((Date.now() - movDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      detailed += '\n\n⏰ Esta movimentação aconteceu hoje.';
    } else if (daysDiff === 1) {
      detailed += '\n\n⏰ Esta movimentação aconteceu ontem.';
    } else if (daysDiff <= 7) {
      detailed += `\n\n⏰ Esta movimentação aconteceu há ${daysDiff} dias.`;
    } else if (daysDiff <= 30) {
      detailed += `\n\n⏰ Esta movimentação aconteceu há ${Math.floor(daysDiff/7)} semana(s).`;
    } else {
      detailed += `\n\n⏰ Esta movimentação aconteceu há ${Math.floor(daysDiff/30)} mês(es).`;
    }

    return detailed;
  }

  // Determinar ação requerida
  determineActionRequired(movement, enrichment) {
    const urgentCodes = ['3', '4', '20', '90', '25']; // Decisão, Sentença, Citação, Intimação, Audiência
    const code = movement.movementCode || movement.metadata?.codigoTPU?.toString();
    
    if (urgentCodes.includes(code)) {
      return {
        required: true,
        urgency: enrichment.importance,
        deadline: this.calculateDeadline(movement, enrichment),
        action: enrichment.nextSteps
      };
    }

    return {
      required: false,
      urgency: 'low',
      action: 'Acompanhar andamento do processo.'
    };
  }

  // Calcular prazo estimado
  calculateDeadline(movement, enrichment) {
    const code = movement.movementCode || movement.metadata?.codigoTPU?.toString();
    const movDate = new Date(movement.movementDate);
    
    switch (code) {
      case '3': // Decisão
      case '4': // Sentença
        const appealDeadline = new Date(movDate);
        appealDeadline.setDate(appealDeadline.getDate() + 15); // 15 dias úteis
        return {
          date: appealDeadline,
          description: 'Prazo para recurso (15 dias úteis)',
          type: 'appeal'
        };
      
      case '20': // Citação
        const defenseDeadline = new Date(movDate);
        defenseDeadline.setDate(defenseDeadline.getDate() + 15); // 15 dias úteis
        return {
          date: defenseDeadline,
          description: 'Prazo para contestação (15 dias úteis)',
          type: 'defense'
        };
      
      case '90': // Intimação
        const responseDeadline = new Date(movDate);
        responseDeadline.setDate(responseDeadline.getDate() + 15); // 15 dias úteis
        return {
          date: responseDeadline,
          description: 'Prazo para manifestação (15 dias úteis)',
          type: 'response'
        };
      
      default:
        return null;
    }
  }

  // Construir timeline processual
  buildTimeline(movement, enrichment) {
    const code = movement.movementCode || movement.metadata?.codigoTPU?.toString();
    
    const timelineSteps = {
      '26': ['Distribuição', 'Análise inicial', 'Citação/Intimação', 'Resposta', 'Instrução', 'Sentença'],
      '20': ['Citação', 'Contestação', 'Tréplica', 'Saneamento', 'Instrução', 'Sentença'],
      '51': ['Conclusão', 'Análise', 'Decisão/Despacho', 'Publicação', 'Cumprimento'],
      '3': ['Decisão', 'Publicação', 'Prazo recursal', 'Recurso/Trânsito', 'Cumprimento'],
      '4': ['Sentença', 'Publicação', 'Prazo recursal', 'Apelação/Trânsito', 'Execução']
    };

    return timelineSteps[code] || ['Movimentação registrada', 'Análise', 'Prosseguimento'];
  }

  // Enriquecer lote de movimentações
  enrichBatch(movements) {
    return movements.map(movement => this.enrichMovement(movement));
  }

  // Obter estatísticas de movimentações enriquecidas
  getEnrichmentStats(enrichedMovements) {
    const stats = {
      byCategory: {},
      byImportance: {},
      actionsRequired: 0,
      urgentActions: 0,
      withDeadlines: 0
    };

    enrichedMovements.forEach(movement => {
      const category = movement.enriched.category;
      const importance = movement.enriched.importance;
      
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      stats.byImportance[importance] = (stats.byImportance[importance] || 0) + 1;
      
      if (movement.enriched.actionRequired?.required) {
        stats.actionsRequired++;
        if (movement.enriched.actionRequired.urgency === 'urgent') {
          stats.urgentActions++;
        }
      }
      
      if (movement.enriched.actionRequired?.deadline) {
        stats.withDeadlines++;
      }
    });

    return stats;
  }
}

module.exports = MovementEnricher;
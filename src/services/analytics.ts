// src/services/analytics.ts

import type {
  AnalyticsFilters,
  BusinessIntelligenceData,
  PredictiveInsight,
  KPITarget,
  ReportConfiguration,
  GeneratedReport,
  ReportTemplate,
  RevenueProjectionData,
  ClientProfitabilityData,
  CashFlowProjectionData,
} from '@/types/analytics';

class AnalyticsService {
  private baseUrl = '/api'; // Removido process.env

  async getAnalyticsData(filters: AnalyticsFilters): Promise<BusinessIntelligenceData> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      insights: [
        {
          id: '1',
          title: 'Oportunidade de Crescimento - Q4',
          description: 'Modelo prevê crescimento de 23% na receita baseado em sazonalidade histórica.',
          type: 'opportunity',
          confidence: 87,
          impact: 'high',
          timeframe: 'Próximos 90 dias',
          action: 'Aumentar equipe comercial',
          metrics: { current: 67000, predicted: 82410, change: 23 },
          category: 'financial',
          priority: 'high',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Risco de Inadimplência - Cliente ABC',
          description: 'Análise comportamental indica 72% de probabilidade de atraso no pagamento.',
          type: 'risk',
          confidence: 72,
          impact: 'medium',
          timeframe: 'Próximos 30 dias',
          action: 'Contato preventivo',
          metrics: { current: 25000, predicted: 18000, change: -28 },
          category: 'financial',
          priority: 'high',
          createdAt: new Date(),
        },
        {
          id: '3',
          title: 'Tendência - Área Trabalhista',
          description: 'Demanda por casos trabalhistas cresceu 45% nos últimos 3 meses.',
          type: 'trend',
          confidence: 94,
          impact: 'high',
          timeframe: 'Tendência contínua',
          action: 'Especializar mais 1 advogado',
          metrics: { current: 15, predicted: 22, change: 47 },
          category: 'operational',
          priority: 'medium',
          createdAt: new Date(),
        },
        {
          id: '4',
          title: 'Recomendação - Otimização de Preços',
          description: 'Casos de direito empresarial podem ter aumento de 15% sem impacto na conversão.',
          type: 'recommendation',
          confidence: 81,
          impact: 'medium',
          timeframe: 'Implementação gradual',
          action: 'Testar novo pricing',
          metrics: { current: 100, predicted: 115, change: 15 },
          category: 'strategic',
          priority: 'low',
          createdAt: new Date(),
        }
      ],
      kpiTargets: [
        {
          id: '1',
          name: 'Receita Mensal',
          current: 67000,
          target: 75000,
          unit: 'BRL',
          trend: 'up',
          status: 'on-track',
          daysToTarget: 45,
          category: 'financial',
          lastUpdated: new Date(),
        },
        {
          id: '2',
          name: 'Novos Clientes',
          current: 8,
          target: 12,
          unit: 'clientes',
          trend: 'up',
          status: 'at-risk',
          daysToTarget: 30,
          category: 'operational',
          lastUpdated: new Date(),
        },
        {
          id: '3',
          name: 'Taxa de Conversão',
          current: 24,
          target: 30,
          unit: '%',
          trend: 'stable',
          status: 'at-risk',
          daysToTarget: 60,
          category: 'operational',
          lastUpdated: new Date(),
        },
        {
          id: '4',
          name: 'NPS Score',
          current: 72,
          target: 80,
          unit: 'pontos',
          trend: 'up',
          status: 'on-track',
          daysToTarget: 90,
          category: 'customer',
          lastUpdated: new Date(),
        }
      ],
      revenueProjection: [
        { month: 'Jul', atual: null, projetado: 70000, tendencia: 68500 },
        { month: 'Ago', atual: null, projetado: 72000, tendencia: 71000 },
        { month: 'Set', atual: null, projetado: 75000, tendencia: 73500 },
        { month: 'Out', atual: null, projetado: 78000, tendencia: 76500 },
        { month: 'Nov', atual: null, projetado: 81000, tendencia: 79500 },
        { month: 'Dez', atual: null, projetado: 85000, tendencia: 83000 },
      ],
      clientProfitability: [
        { 
          cliente: 'Empresa ABC Ltda', 
          receita: 25000, 
          custos: 5000, 
          roi: 400,
          casos: 5,
          tempoMedioColeta: 45
        },
        { 
          cliente: 'João Silva', 
          receita: 15000, 
          custos: 3000, 
          roi: 400,
          casos: 3,
          tempoMedioColeta: 30
        },
        { 
          cliente: 'Tech Solutions', 
          receita: 35000, 
          custos: 8000, 
          roi: 337.5,
          casos: 7,
          tempoMedioColeta: 60
        },
        { 
          cliente: 'Maria Santos', 
          receita: 12000, 
          custos: 3500, 
          roi: 242.8,
          casos: 2,
          tempoMedioColeta: 25
        }
      ],
      customerSegments: [
        {
          name: 'Champions',
          description: 'Alto valor, alta frequência',
          count: 12,
          revenue: 180000,
          averageClv: 15000,
          retentionRate: 95,
          color: 'bg-green-500',
          recommendedActions: ['Manter satisfação', 'Programa VIP']
        },
        {
          name: 'Loyal Customers',
          description: 'Consistentes, médio valor',
          count: 28,
          revenue: 145000,
          averageClv: 5200,
          retentionRate: 88,
          color: 'bg-blue-500',
          recommendedActions: ['Upsell/Cross-sell', 'Programa de fidelidade']
        },
        {
          name: 'At Risk',
          description: 'Diminuindo atividade',
          count: 8,
          revenue: 42000,
          averageClv: 5250,
          retentionRate: 45,
          color: 'bg-yellow-500',
          recommendedActions: ['Campanha retenção', 'Contato direto']
        },
        {
          name: 'Lost',
          description: 'Inativos há 6+ meses',
          count: 15,
          revenue: 0,
          averageClv: 0,
          retentionRate: 0,
          color: 'bg-red-500',
          recommendedActions: ['Campanha reconquista', 'Pesquisa de satisfação']
        }
      ],
      marketingROI: [
        { 
          canal: 'Google Ads', 
          investimento: 12000, 
          retorno: 45000, 
          roi: 275,
          conversions: 23,
          cac: 521,
          ltv: 15000
        },
        { 
          canal: 'LinkedIn', 
          investimento: 8000, 
          retorno: 28000, 
          roi: 250,
          conversions: 18,
          cac: 444,
          ltv: 12000
        },
        { 
          canal: 'Indicações', 
          investimento: 3000, 
          retorno: 35000, 
          roi: 1067,
          conversions: 15,
          cac: 200,
          ltv: 18000
        },
        { 
          canal: 'SEO/Content', 
          investimento: 5000, 
          retorno: 18000, 
          roi: 260,
          conversions: 12,
          cac: 417,
          ltv: 14000
        }
      ],
      generatedAt: new Date(),
      confidence: 89,
    };
  }

  async getRevenueProjection(filters: AnalyticsFilters): Promise<RevenueProjectionData[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { month: 'Jan', atual: 45000, projetado: 47000, tendencia: 45500 },
      { month: 'Fev', atual: 52000, projetado: 54000, tendencia: 53000 },
      { month: 'Mar', atual: 48000, projetado: 51000, tendencia: 49500 },
      { month: 'Abr', atual: 61000, projetado: 58000, tendencia: 59500 },
      { month: 'Mai', atual: 58000, projetado: 62000, tendencia: 60000 },
      { month: 'Jun', atual: 67000, projetado: 65000, tendencia: 66000 },
      { month: 'Jul', atual: null, projetado: 70000, tendencia: 68500 },
      { month: 'Ago', atual: null, projetado: 72000, tendencia: 71000 },
      { month: 'Set', atual: null, projetado: 75000, tendencia: 73500 },
      { month: 'Out', atual: null, projetado: 78000, tendencia: 76500 },
      { month: 'Nov', atual: null, projetado: 81000, tendencia: 79500 },
      { month: 'Dez', atual: null, projetado: 85000, tendencia: 83000 },
    ];
  }

  async getClientProfitability(filters: AnalyticsFilters): Promise<ClientProfitabilityData[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { cliente: 'Empresa ABC Ltda', receita: 25000, custos: 5000, roi: 400, casos: 5, tempoMedioColeta: 45 },
      { cliente: 'João Silva', receita: 15000, custos: 3000, roi: 400, casos: 3, tempoMedioColeta: 30 },
      { cliente: 'Tech Solutions', receita: 35000, custos: 8000, roi: 337.5, casos: 7, tempoMedioColeta: 60 },
      { cliente: 'Maria Santos', receita: 12000, custos: 3500, roi: 242.8, casos: 2, tempoMedioColeta: 25 },
      { cliente: 'Construtora XYZ', receita: 28000, custos: 9000, roi: 211.1, casos: 4, tempoMedioColeta: 55 },
      { cliente: 'Advogados Associados', receita: 42000, custos: 12000, roi: 250, casos: 8, tempoMedioColeta: 50 },
      { cliente: 'Indústria Beta', receita: 38000, custos: 11500, roi: 230.4, casos: 6, tempoMedioColeta: 65 },
    ];
  }

  async getCashFlowProjection(filters: AnalyticsFilters): Promise<CashFlowProjectionData[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { mes: 'Jul', entrada: 65000, saida: 18000, saldo: 47000, projecao: 48000 },
      { mes: 'Ago', entrada: 72000, saida: 19500, saldo: 52500, projecao: 53000 },
      { mes: 'Set', entrada: 68000, saida: 17800, saldo: 50200, projecao: 51000 },
      { mes: 'Out', entrada: 75000, saida: 21000, saldo: 54000, projecao: 55000 },
      { mes: 'Nov', entrada: 71000, saida: 19200, saldo: 51800, projecao: 52500 },
      { mes: 'Dez', entrada: 78000, saida: 22500, saldo: 55500, projecao: 56000 },
    ];
  }

  async getPredictiveInsights(): Promise<PredictiveInsight[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      {
        id: '1',
        title: 'Oportunidade de Crescimento - Q4',
        description: 'Modelo prevê crescimento de 23% na receita baseado em sazonalidade histórica e pipeline atual.',
        type: 'opportunity',
        confidence: 87,
        impact: 'high',
        timeframe: 'Próximos 90 dias',
        action: 'Aumentar equipe comercial em 1 pessoa',
        metrics: { current: 67000, predicted: 82410, change: 23 },
        category: 'financial',
        priority: 'high',
        createdAt: new Date(),
      },
      {
        id: '2',
        title: 'Risco de Inadimplência - Cliente ABC',
        description: 'Análise comportamental indica 72% de probabilidade de atraso no pagamento.',
        type: 'risk',
        confidence: 72,
        impact: 'medium',
        timeframe: 'Próximos 30 dias',
        action: 'Contato preventivo para renegociação',
        metrics: { current: 25000, predicted: 18000, change: -28 },
        category: 'financial',
        priority: 'high',
        createdAt: new Date(),
      },
      {
        id: '3',
        title: 'Tendência - Área Trabalhista',
        description: 'Demanda por casos trabalhistas cresceu 45% nos últimos 3 meses.',
        type: 'trend',
        confidence: 94,
        impact: 'high',
        timeframe: 'Tendência contínua',
        action: 'Especializar mais 1 advogado na área',
        metrics: { current: 15, predicted: 22, change: 47 },
        category: 'operational',
        priority: 'medium',
        createdAt: new Date(),
      },
      {
        id: '4',
        title: 'Recomendação - Otimização de Preços',
        description: 'Casos de direito empresarial podem ter aumento de 15% sem impacto na conversão.',
        type: 'recommendation',
        confidence: 81,
        impact: 'medium',
        timeframe: 'Implementação gradual',
        action: 'Testar novo pricing em novos clientes',
        metrics: { current: 100, predicted: 115, change: 15 },
        category: 'strategic',
        priority: 'low',
        createdAt: new Date(),
      }
    ];
  }

  async getKPITargets(): Promise<KPITarget[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      {
        id: '1',
        name: 'Receita Mensal',
        current: 67000,
        target: 75000,
        unit: 'BRL',
        trend: 'up',
        status: 'on-track',
        daysToTarget: 45,
        category: 'financial',
        owner: 'Diretor Financeiro',
        lastUpdated: new Date(),
      },
      {
        id: '2',
        name: 'Novos Clientes',
        current: 8,
        target: 12,
        unit: 'clientes',
        trend: 'up',
        status: 'at-risk',
        daysToTarget: 30,
        category: 'operational',
        owner: 'Gerente Comercial',
        lastUpdated: new Date(),
      },
      {
        id: '3',
        name: 'Taxa de Conversão',
        current: 24,
        target: 30,
        unit: '%',
        trend: 'stable',
        status: 'at-risk',
        daysToTarget: 60,
        category: 'operational',
        owner: 'Diretor de Operações',
        lastUpdated: new Date(),
      },
      {
        id: '4',
        name: 'NPS Score',
        current: 72,
        target: 80,
        unit: 'pontos',
        trend: 'up',
        status: 'on-track',
        daysToTarget: 90,
        category: 'customer',
        owner: 'Gerente de Atendimento',
        lastUpdated: new Date(),
      },
      {
        id: '5',
        name: 'Tempo Médio de Resolução',
        current: 45,
        target: 35,
        unit: 'dias',
        trend: 'down',
        status: 'on-track',
        daysToTarget: 60,
        category: 'operational',
        owner: 'Coordenador Jurídico',
        lastUpdated: new Date(),
      }
    ];
  }

  async generateReport(config: ReportConfiguration): Promise<GeneratedReport> {
    // Simular processamento do relatório
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      id: crypto.randomUUID(),
      name: config.name,
      type: 'analytical',
      generatedAt: new Date(),
      size: '2.3 MB',
      downloads: 0,
      format: 'pdf',
      url: '/reports/generated-report.pdf',
      sharedWith: [],
    };
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      // Templates serão retornados do component por enquanto
      // Em produção, viriam do backend
    ];
  }

  async saveReportTemplate(template: ReportTemplate): Promise<ReportTemplate> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { 
      ...template, 
      id: crypto.randomUUID() 
    };
  }

  async getGeneratedReports(): Promise<GeneratedReport[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: '1',
        name: 'Demonstrativo de Resultados - Agosto 2025',
        type: 'financial',
        generatedAt: new Date('2025-08-25T10:30:00'),
        size: '2.3 MB',
        downloads: 5,
        format: 'pdf',
        url: '/reports/demo-agosto-2025.pdf',
        sharedWith: ['admin@escritorio.com', 'financeiro@escritorio.com']
      },
      {
        id: '2',
        name: 'Fluxo de Caixa - Semana 34',
        type: 'financial',
        generatedAt: new Date('2025-08-23T08:15:00'),
        size: '1.8 MB',
        downloads: 3,
        format: 'excel',
        url: '/reports/fluxo-semana-34.xlsx',
        sharedWith: ['gestor@escritorio.com']
      },
      {
        id: '3',
        name: 'Análise de Performance - Q2 2025',
        type: 'analytical',
        generatedAt: new Date('2025-08-20T16:45:00'),
        size: '4.1 MB',
        downloads: 8,
        format: 'pdf',
        url: '/reports/performance-q2-2025.pdf',
        sharedWith: ['diretoria@escritorio.com', 'rh@escritorio.com']
      },
      {
        id: '4',
        name: 'Rentabilidade por Cliente - Julho 2025',
        type: 'analytical',
        generatedAt: new Date('2025-08-15T14:20:00'),
        size: '3.2 MB',
        downloads: 12,
        format: 'pdf',
        url: '/reports/rentabilidade-julho-2025.pdf',
        sharedWith: ['comercial@escritorio.com']
      },
      {
        id: '5',
        name: 'Aging de Recebíveis - Agosto 2025',
        type: 'financial',
        generatedAt: new Date('2025-08-10T09:30:00'),
        size: '1.5 MB',
        downloads: 6,
        format: 'excel',
        url: '/reports/aging-agosto-2025.xlsx',
        sharedWith: ['cobranca@escritorio.com', 'financeiro@escritorio.com']
      }
    ];
  }

  // Método para quando integrar com API real
  async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // Métodos utilitários
  formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
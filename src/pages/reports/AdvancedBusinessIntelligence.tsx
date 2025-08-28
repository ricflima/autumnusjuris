import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Brain, 
  AlertCircle,
  Plus,
  Filter,
  Download,
  Share,
  Settings
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';

export function AdvancedBusinessIntelligence() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data for demonstration
  const kpis = [
    {
      id: '1',
      name: 'Receita Mensal',
      currentValue: 125000,
      target: 150000,
      previousValue: 118000,
      trend: 'up' as const,
      status: 'warning' as const,
      unit: 'R$',
      category: 'Financeiro'
    },
    {
      id: '2',
      name: 'Casos Fechados',
      currentValue: 45,
      target: 50,
      previousValue: 42,
      trend: 'up' as const,
      status: 'good' as const,
      unit: 'casos',
      category: 'Operacional'
    },
    {
      id: '3',
      name: 'Satisfação Cliente',
      currentValue: 4.6,
      target: 4.8,
      previousValue: 4.4,
      trend: 'up' as const,
      status: 'good' as const,
      unit: '/5',
      category: 'Qualidade'
    },
    {
      id: '4',
      name: 'Tempo Médio Resolução',
      currentValue: 12.5,
      target: 10,
      previousValue: 15.2,
      trend: 'down' as const,
      status: 'critical' as const,
      unit: 'dias',
      category: 'Eficiência'
    }
  ];

  const insights = [
    {
      id: '1',
      title: 'Pico de Demanda em Casos Trabalhistas',
      description: 'Identificado aumento de 35% em casos trabalhistas no último mês, principalmente relacionados a rescisões contratuais.',
      category: 'trend' as const,
      priority: 'high' as const,
      impact: 85,
      confidence: 92,
      recommendations: [
        'Considerar contratação temporária de especialista trabalhista',
        'Criar templates específicos para rescisões contratuais',
        'Implementar automação para documentos trabalhistas'
      ]
    },
    {
      id: '2',
      title: 'Oportunidade de Upselling',
      description: 'Clientes com contratos básicos apresentam 78% de interesse em serviços adicionais após 3 meses.',
      category: 'opportunity' as const,
      priority: 'medium' as const,
      impact: 72,
      confidence: 88,
      recommendations: [
        'Criar campanha de upselling após 3 meses',
        'Desenvolver pacotes de serviços complementares',
        'Treinar equipe comercial para identificação de oportunidades'
      ]
    }
  ];

  const predictions = [
    {
      id: '1',
      name: 'Receita Próximos 6 Meses',
      predictions: [
        { period: 'Fev 2025', predictedValue: 135000, confidence: 87 },
        { period: 'Mar 2025', predictedValue: 142000, confidence: 82 },
        { period: 'Abr 2025', predictedValue: 148000, confidence: 79 },
        { period: 'Mai 2025', predictedValue: 155000, confidence: 75 },
        { period: 'Jun 2025', predictedValue: 162000, confidence: 71 },
        { period: 'Jul 2025', predictedValue: 158000, confidence: 68 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            Business Intelligence
          </h1>
          <p className="text-muted-foreground">
            Insights avançados e análises preditivas para tomada de decisão
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Dashboard
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">Período de Análise:</span>
              <div className="flex gap-2">
                {[
                  { value: 'week', label: 'Última Semana' },
                  { value: 'month', label: 'Último Mês' },
                  { value: 'quarter', label: 'Último Trimestre' },
                  { value: 'year', label: 'Último Ano' }
                ].map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period.value)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="kpis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">KPIs Principais</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-6">
          {/* KPIs Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {kpi.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">
                          {kpi.unit === 'R$' 
                            ? `R$ ${(kpi.currentValue / 1000).toFixed(0)}k`
                            : `${kpi.currentValue}${kpi.unit}`
                          }
                        </p>
                        <span className="text-lg">{getTrendIcon(kpi.trend)}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(kpi.status)}>
                      {kpi.status === 'good' && 'Bom'}
                      {kpi.status === 'warning' && 'Atenção'}
                      {kpi.status === 'critical' && 'Crítico'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Meta: {kpi.unit === 'R$' ? `R$ ${(kpi.target / 1000).toFixed(0)}k` : `${kpi.target}${kpi.unit}`}</span>
                      <span>{Math.round((kpi.currentValue / kpi.target) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(kpi.currentValue / kpi.target) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>vs. anterior</span>
                    <span className={
                      kpi.currentValue > kpi.previousValue 
                        ? 'text-green-600' 
                        : kpi.currentValue < kpi.previousValue
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }>
                      {kpi.currentValue > kpi.previousValue ? '+' : ''}
                      {Math.round(((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* KPI Trends Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução dos KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-muted-foreground">Gráfico de evolução dos KPIs seria renderizado aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {insight.category} • {insight.confidence}% confiança
                      </p>
                    </div>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority === 'high' ? 'Alta' : 
                       insight.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{insight.description}</p>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Impacto Potencial</span>
                      <span>{insight.impact}%</span>
                    </div>
                    <Progress value={insight.impact} className="h-2" />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Recomendações:</p>
                    <ul className="text-sm space-y-1">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions.map((prediction) => (
            <Card key={prediction.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  {prediction.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {prediction.predictions.map((pred, index) => (
                      <div key={index} className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-muted-foreground mb-1">{pred.period}</p>
                        <p className="text-lg font-semibold">
                          R$ {(pred.predictedValue / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pred.confidence}% confiança
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-muted-foreground">Gráfico de previsões seria renderizado aqui</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Dashboard Financeiro', description: 'Análise completa de receitas, despesas e fluxo de caixa', widgets: 12 },
              { name: 'Performance Operacional', description: 'Métricas de produtividade e eficiência operacional', widgets: 8 },
              { name: 'Satisfação do Cliente', description: 'Análise de feedback e satisfação dos clientes', widgets: 6 },
              { name: 'Análise de Processos', description: 'Acompanhamento de processos judiciais e prazos', widgets: 10 }
            ].map((dashboard, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{dashboard.name}</span>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>{dashboard.widgets} widgets</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Share className="w-4 h-4 mr-1" />
                        Compartilhar
                      </Button>
                      <Button size="sm">Ver</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from 'react';
import { 
  BarChart3, 
  Brain, 
  TrendingUp, 
  Target, 
  AlertCircle,
  Plus,
  Filter,
  Download,
  Share,
  Settings,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function UnifiedAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data combinando ambas as implementações
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
      category: 'Financeiro',
      icon: DollarSign,
      color: 'text-green-600'
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
      category: 'Operacional',
      icon: CheckCircle,
      color: 'text-blue-600'
    },
    {
      id: '3',
      name: 'Clientes Ativos',
      currentValue: 128,
      target: 140,
      previousValue: 125,
      trend: 'up' as const,
      status: 'good' as const,
      unit: 'clientes',
      category: 'CRM',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      id: '4',
      name: 'Taxa Sucesso',
      currentValue: 87,
      target: 90,
      previousValue: 84,
      trend: 'up' as const,
      status: 'good' as const,
      unit: '%',
      category: 'Performance',
      icon: Target,
      color: 'text-orange-600'
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
    },
    {
      id: '3',
      title: 'Prazo de Resposta Acima do Ideal',
      description: 'Tempo médio de resposta aos clientes aumentou 23% no último trimestre.',
      category: 'risk' as const,
      priority: 'high' as const,
      impact: 68,
      confidence: 95,
      recommendations: [
        'Implementar sistema de tickets automatizado',
        'Definir SLAs por tipo de solicitação',
        'Treinar equipe em gestão de tempo'
      ]
    }
  ];

  const predictions = [
    {
      id: '1',
      name: 'Receita Próximos 6 Meses',
      predictions: [
        { period: 'Fev 2025', predictedValue: 135000, confidence: 87, change: 8 },
        { period: 'Mar 2025', predictedValue: 142000, confidence: 82, change: 5.2 },
        { period: 'Abr 2025', predictedValue: 148000, confidence: 79, change: 4.2 },
        { period: 'Mai 2025', predictedValue: 155000, confidence: 75, change: 4.7 },
        { period: 'Jun 2025', predictedValue: 162000, confidence: 71, change: 4.5 },
        { period: 'Jul 2025', predictedValue: 158000, confidence: 68, change: -2.5 }
      ]
    }
  ];

  const reports = [
    {
      id: '1',
      name: 'Dashboard Executivo',
      description: 'Visão geral das métricas principais do escritório',
      type: 'dashboard',
      frequency: 'Diário',
      lastUpdate: '2025-01-28 09:00',
      status: 'active'
    },
    {
      id: '2',
      name: 'Relatório Financeiro Completo',
      description: 'Análise detalhada de receitas, despesas e rentabilidade',
      type: 'report',
      frequency: 'Mensal',
      lastUpdate: '2025-01-01 08:00',
      status: 'active'
    },
    {
      id: '3',
      name: 'Performance por Advogado',
      description: 'Métricas individuais de produtividade e eficiência',
      type: 'analysis',
      frequency: 'Semanal',
      lastUpdate: '2025-01-22 10:00',
      status: 'scheduled'
    },
    {
      id: '4',
      name: 'Análise de Satisfação do Cliente',
      description: 'Feedback e NPS dos clientes atendidos',
      type: 'survey',
      frequency: 'Trimestral',
      lastUpdate: '2025-01-01 12:00',
      status: 'pending'
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
      {/* Header Unificado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Analytics & Business Intelligence
          </h1>
          <p className="text-muted-foreground">
            Dashboards, insights inteligentes e análises preditivas em uma plataforma unificada
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
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

      {/* Unified Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="kpis">KPIs & Métricas</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const progress = (kpi.currentValue / kpi.target) * 100;
              const change = ((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100;
              
              return (
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
                              : `${kpi.currentValue}${kpi.unit === '%' ? '%' : ''}`
                            }
                          </p>
                          <span className="text-sm text-green-600">
                            +{change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Icon className={`w-8 h-8 ${kpi.color}`} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Meta: {kpi.unit === 'R$' ? `R$ ${(kpi.target / 1000).toFixed(0)}k` : `${kpi.target}${kpi.unit === '%' ? '%' : ''}`}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <Badge className={`${getStatusColor(kpi.status)} mt-3`}>
                      {kpi.status === 'good' && 'No Objetivo'}
                      {kpi.status === 'warning' && 'Atenção'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Insights Principais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority === 'high' ? 'Alta' : 'Média'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {insight.confidence}% confiança
                      </span>
                      <Button variant="ghost" size="sm">
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Previsão de Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictions[0].predictions.slice(0, 3).map((pred, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{pred.period}</p>
                        <p className="text-sm text-muted-foreground">
                          {pred.confidence}% confiança
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {(pred.predictedValue / 1000).toFixed(0)}k
                        </p>
                        <p className={`text-sm ${pred.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pred.change > 0 ? '+' : ''}{pred.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const progress = (kpi.currentValue / kpi.target) * 100;
              const change = ((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100;
              
              return (
                <Card key={kpi.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${kpi.color}`} />
                        {kpi.name}
                      </span>
                      <Badge className={getStatusColor(kpi.status)}>
                        {kpi.status === 'good' && 'Ótimo'}
                        {kpi.status === 'warning' && 'Atenção'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold mb-1">
                        {kpi.unit === 'R$' 
                          ? `R$ ${kpi.currentValue.toLocaleString()}`
                          : `${kpi.currentValue}${kpi.unit === '%' ? '%' : ''}`
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Meta: {kpi.unit === 'R$' 
                          ? `R$ ${kpi.target.toLocaleString()}`
                          : `${kpi.target}${kpi.unit === '%' ? '%' : ''}`
                        }
                      </p>
                    </div>

                    <Progress value={progress} className="h-3" />

                    <div className="flex justify-between items-center text-sm">
                      <span>Progresso: {Math.round(progress)}%</span>
                      <span className={`font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>Categoria: {kpi.category}</p>
                      <p>Período anterior: {kpi.previousValue}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
                      <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">{pred.period}</p>
                        <p className="text-xl font-semibold">
                          R$ {(pred.predictedValue / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {pred.confidence}% confiança
                        </p>
                        <p className={`text-sm mt-1 ${pred.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pred.change > 0 ? '+' : ''}{pred.change}%
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

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{report.name}</span>
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.status === 'active' && 'Ativo'}
                      {report.status === 'scheduled' && 'Agendado'}
                      {report.status === 'pending' && 'Pendente'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">Frequência: {report.frequency}</p>
                      <p className="text-muted-foreground">
                        Última atualização: {report.lastUpdate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Baixar
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
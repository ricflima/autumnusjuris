// src/pages/analytics/BusinessIntelligence.tsx

import React, { useState, useMemo } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Filter,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  BarChart,
  AreaChart,
  ComposedChart,
  ResponsiveContainer,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Scatter,
  ScatterChart
} from 'recharts';

import { useFinancialStats, useFinancialFormatters } from '@/hooks/useFinancial';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  action?: string;
  metrics?: {
    current: number;
    predicted: number;
    change: number;
  };
}

interface KPITarget {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'on-track' | 'at-risk' | 'critical';
  daysToTarget: number;
}

const BusinessIntelligence: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedView, setSelectedView] = useState('overview');
  
  const { formatCurrency, formatPercentage, formatNumber } = useFinancialFormatters();
  const { month: monthStats, year: yearStats, isLoading } = useFinancialStats();

  // Mock data para demonstração - Em produção viria de APIs de ML/IA
  const predictiveData = useMemo(() => ({
    revenueProjection: [
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
    ],
    clientLifetimeValue: [
      { segmento: 'Empresarial', clv: 125000, acquisitionCost: 8000, roi: 1462 },
      { segmento: 'Pessoa Física Premium', clv: 45000, acquisitionCost: 3000, roi: 1400 },
      { segmento: 'Trabalhista', clv: 25000, acquisitionCost: 2000, roi: 1150 },
      { segmento: 'Pessoa Física Standard', clv: 15000, acquisitionCost: 1500, roi: 900 },
    ],
    marketingROI: [
      { canal: 'Google Ads', investimento: 12000, retorno: 45000, roi: 275 },
      { canal: 'LinkedIn', investimento: 8000, retorno: 28000, roi: 250 },
      { canal: 'Indicações', investimento: 3000, retorno: 35000, roi: 1067 },
      { canal: 'SEO/Content', investimento: 5000, retorno: 18000, roi: 260 },
    ]
  }), []);

  const insights: PredictiveInsight[] = [
    {
      id: '1',
      title: 'Oportunidade de Crescimento - Q4',
      description: 'Modelo prevê crescimento de 23% na receita baseado em sazonalidade histórica e pipeline atual.',
      type: 'opportunity',
      confidence: 87,
      impact: 'high',
      timeframe: 'Próximos 90 dias',
      action: 'Aumentar equipe comercial em 1 pessoa',
      metrics: { current: 67000, predicted: 82410, change: 23 }
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
      metrics: { current: 25000, predicted: 18000, change: -28 }
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
      metrics: { current: 15, predicted: 22, change: 47 }
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
      metrics: { current: 100, predicted: 115, change: 15 }
    }
  ];

  const kpiTargets: KPITarget[] = [
    {
      id: '1',
      name: 'Receita Mensal',
      current: 67000,
      target: 75000,
      unit: 'BRL',
      trend: 'up',
      status: 'on-track',
      daysToTarget: 45
    },
    {
      id: '2',
      name: 'Novos Clientes',
      current: 8,
      target: 12,
      unit: 'clientes',
      trend: 'up',
      status: 'at-risk',
      daysToTarget: 30
    },
    {
      id: '3',
      name: 'Taxa de Conversão',
      current: 24,
      target: 30,
      unit: '%',
      trend: 'stable',
      status: 'at-risk',
      daysToTarget: 60
    },
    {
      id: '4',
      name: 'NPS Score',
      current: 72,
      target: 80,
      unit: 'pontos',
      trend: 'up',
      status: 'on-track',
      daysToTarget: 90
    }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'risk': return AlertTriangle;
      case 'trend': return Activity;
      case 'recommendation': return Lightbulb;
      default: return Eye;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'risk': return 'border-red-200 bg-red-50';
      case 'trend': return 'border-blue-200 bg-blue-50';
      case 'recommendation': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getKPIStatus = (status: string) => {
    switch (status) {
      case 'on-track': return { color: 'bg-green-500', badge: 'default' };
      case 'at-risk': return { color: 'bg-yellow-500', badge: 'secondary' };
      case 'critical': return { color: 'bg-red-500', badge: 'destructive' };
      default: return { color: 'bg-gray-500', badge: 'outline' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            Business Intelligence
          </h1>
          <p className="text-gray-600">Análises preditivas e insights baseados em IA</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Últimos 12 meses</SelectItem>
              <SelectItem value="24months">Últimos 24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurar IA
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Insights Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Insights Inteligentes
              <Badge variant="secondary" className="ml-2">4 Novos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div key={insight.id} className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.confidence}% confiança
                      </Badge>
                      <Badge variant={insight.impact === 'high' ? 'default' : 
                        insight.impact === 'medium' ? 'secondary' : 'outline'} 
                        className="text-xs"
                      >
                        {insight.impact === 'high' ? 'Alto' : 
                         insight.impact === 'medium' ? 'Médio' : 'Baixo'} impacto
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                  
                  {insight.metrics && (
                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <span>Atual: {insight.metrics.current > 1000 ? 
                        formatCurrency(insight.metrics.current) : insight.metrics.current}</span>
                      <span>Projetado: {insight.metrics.predicted > 1000 ? 
                        formatCurrency(insight.metrics.predicted) : insight.metrics.predicted}</span>
                      <span className={insight.metrics.change > 0 ? 'text-green-600' : 'text-red-600'}>
                        {insight.metrics.change > 0 ? '+' : ''}{insight.metrics.change}%
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{insight.timeframe}</span>
                    {insight.action && (
                      <Button size="sm" variant="outline" className="text-xs">
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* KPIs e Metas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Metas e KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpiTargets.map((kpi) => {
              const progress = (kpi.current / kpi.target) * 100;
              const status = getKPIStatus(kpi.status);
              
              return (
                <div key={kpi.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      <span className="font-medium">{kpi.name}</span>
                    </div>
                    <Badge variant={status.badge as any} className="text-xs">
                      {kpi.status === 'on-track' ? 'No prazo' :
                       kpi.status === 'at-risk' ? 'Risco' : 'Crítico'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {kpi.unit === 'BRL' ? formatCurrency(kpi.current) : 
                         kpi.unit === '%' ? formatPercentage(kpi.current) :
                         `${kpi.current} ${kpi.unit}`}
                      </span>
                      <span className="text-gray-500">
                        Meta: {kpi.unit === 'BRL' ? formatCurrency(kpi.target) :
                               kpi.unit === '%' ? formatPercentage(kpi.target) :
                               `${kpi.target} ${kpi.unit}`}
                      </span>
                    </div>
                    
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatPercentage(progress)} concluído</span>
                      <span>{kpi.daysToTarget} dias restantes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Análises Avançadas */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-2/3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="predictive">Preditiva</TabsTrigger>
          <TabsTrigger value="customer">Cliente</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Análise de Tendências */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Análise de Tendências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={predictiveData.revenueProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value, 'BRL').replace('R$', 'R$')} />
                    <Tooltip formatter={(value: any, name) => [
                      formatCurrency(value),
                      name === 'atual' ? 'Receita Atual' :
                      name === 'projetado' ? 'Projeção IA' : 'Tendência'
                    ]} />
                    <Legend />
                    <Bar dataKey="atual" fill="#3b82f6" name="Receita Atual" />
                    <Line type="monotone" dataKey="projetado" stroke="#10b981" strokeWidth={3} name="Projeção IA" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="tendencia" stroke="#f59e0b" strokeWidth={2} name="Tendência" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Matriz de Risco-Oportunidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Matriz Risco × Oportunidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="risco" name="Risco" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <YAxis type="number" dataKey="oportunidade" name="Oportunidade" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: any, name) => [`${value}%`, name === 'risco' ? 'Risco' : 'Oportunidade']} />
                    <Scatter name="Projetos/Clientes" data={[
                      { risco: 20, oportunidade: 80, name: 'Cliente A' },
                      { risco: 45, oportunidade: 60, name: 'Cliente B' },
                      { risco: 70, oportunidade: 30, name: 'Cliente C' },
                      { risco: 15, oportunidade: 90, name: 'Novo Mercado' },
                      { risco: 55, oportunidade: 85, name: 'Expansão' }
                    ]} fill="#8884d8" />
                    <ReferenceLine x={50} stroke="#red" strokeDasharray="3 3" />
                    <ReferenceLine y={50} stroke="#red" strokeDasharray="3 3" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cenários de Projeção */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Cenários de Receita (ML)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={predictiveData.revenueProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value, 'BRL').replace('R$', 'R$')} />
                      <Tooltip formatter={(value: any, name) => [
                        formatCurrency(value),
                        name === 'atual' ? 'Receita Atual' :
                        name === 'projetado' ? 'Cenário Base' : 'Cenário Conservador'
                      ]} />
                      <Legend />
                      <Area type="monotone" dataKey="atual" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Receita Atual" />
                      <Area type="monotone" dataKey="projetado" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.4} name="Cenário Base" />
                      <Area type="monotone" dataKey="tendencia" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="Cenário Conservador" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Probabilidades */}
            <Card>
              <CardHeader>
                <CardTitle>Probabilidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { evento: 'Atingir meta trimestral', prob: 78, color: 'bg-green-500' },
                  { evento: 'Novo cliente grande', prob: 45, color: 'bg-yellow-500' },
                  { evento: 'Perda de cliente key', prob: 23, color: 'bg-red-500' },
                  { evento: 'Expansão para nova área', prob: 67, color: 'bg-blue-500' }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.evento}</span>
                      <span className="text-sm font-bold">{item.prob}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.prob}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Lifetime Value */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Lifetime Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={predictiveData.clientLifetimeValue} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis dataKey="segmento" type="category" width={120} />
                    <Tooltip formatter={(value: any, name) => [
                      formatCurrency(value),
                      name === 'clv' ? 'CLV' :
                      name === 'acquisitionCost' ? 'CAC' : 'ROI'
                    ]} />
                    <Legend />
                    <Bar dataKey="clv" fill="#3b82f6" name="CLV" />
                    <Bar dataKey="acquisitionCost" fill="#ef4444" name="CAC" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Segmentação de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Segmentação Inteligente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { 
                    nome: 'Champions', 
                    descrição: 'Alto valor, alta frequência', 
                    quantidade: 12, 
                    receita: 180000, 
                    cor: 'bg-green-500',
                    acao: 'Manter satisfação' 
                  },
                  { 
                    nome: 'Loyal Customers', 
                    descrição: 'Consistentes, médio valor', 
                    quantidade: 28, 
                    receita: 145000, 
                    cor: 'bg-blue-500',
                    acao: 'Upsell/Cross-sell' 
                  },
                  { 
                    nome: 'At Risk', 
                    descrição: 'Diminuindo atividade', 
                    quantidade: 8, 
                    receita: 42000, 
                    cor: 'bg-yellow-500',
                    acao: 'Campanha retenção' 
                  },
                  { 
                    nome: 'Lost', 
                    descrição: 'Inativos há 6+ meses', 
                    quantidade: 15, 
                    receita: 0, 
                    cor: 'bg-red-500',
                    acao: 'Campanha reconquista' 
                  }
                ].map((segmento, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${segmento.cor}`} />
                        <div>
                          <h4 className="font-semibold">{segmento.nome}</h4>
                          <p className="text-sm text-gray-600">{segmento.descrição}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{segmento.quantidade} clientes</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm font-medium">
                        Receita: {formatCurrency(segmento.receita)}
                      </span>
                      <Button size="sm" variant="outline" className="text-xs">
                        {segmento.acao}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI por Canal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  ROI por Canal de Marketing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={predictiveData.marketingROI}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="canal" />
                    <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: any, name) => [
                      name === 'roi' ? `${value}%` : formatCurrency(value),
                      name === 'investimento' ? 'Investimento' :
                      name === 'retorno' ? 'Retorno' : 'ROI'
                    ]} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="investimento" fill="#ef4444" name="Investimento" />
                    <Bar yAxisId="left" dataKey="retorno" fill="#10b981" name="Retorno" />
                    <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#3b82f6" strokeWidth={3} name="ROI %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recomendações de Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Recomendações de Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    canal: 'Indicações',
                    atual: 3000,
                    recomendado: 5000,
                    impacto: '+67% ROI esperado',
                    acao: 'Programa de referência',
                    prioridade: 'alta'
                  },
                  {
                    canal: 'Google Ads',
                    atual: 12000,
                    recomendado: 15000,
                    impacto: '+25% conversões',
                    acao: 'Expandir palavras-chave',
                    prioridade: 'média'
                  },
                  {
                    canal: 'LinkedIn',
                    atual: 8000,
                    recomendado: 6000,
                    impacto: 'Realocação estratégica',
                    acao: 'Focar em content marketing',
                    prioridade: 'baixa'
                  },
                  {
                    canal: 'SEO/Content',
                    atual: 5000,
                    recomendado: 8000,
                    impacto: '+40% tráfego orgânico',
                    acao: 'Mais conteúdo especializado',
                    prioridade: 'alta'
                  }
                ].map((recomendacao, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{recomendacao.canal}</h4>
                        <p className="text-sm text-gray-600">{recomendacao.acao}</p>
                      </div>
                      <Badge variant={
                        recomendacao.prioridade === 'alta' ? 'default' :
                        recomendacao.prioridade === 'média' ? 'secondary' : 'outline'
                      }>
                        {recomendacao.prioridade}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      <div>
                        <span className="text-gray-500">Atual: </span>
                        <span className="font-medium">{formatCurrency(recomendacao.atual)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Recomendado: </span>
                        <span className="font-medium">{formatCurrency(recomendacao.recomendado)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-blue-600 font-medium">{recomendacao.impacto}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Summary */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            Resumo Executivo IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Principais Sucessos
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Receita 23% acima da projeção</li>
                <li>• ROI de indicações excepcional (1067%)</li>
                <li>• Taxa de retenção de clientes em 94%</li>
                <li>• NPS score melhorando consistentemente</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Pontos de Atenção
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• 3 clientes com risco de inadimplência</li>
                <li>• Meta de novos clientes 33% abaixo</li>
                <li>• Capacidade próxima do limite</li>
                <li>• Concorrência crescendo 15%</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                Próximos Passos
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Contratar 1 advogado trabalhista</li>
                <li>• Implementar programa de referência</li>
                <li>• Revisar pricing área empresarial</li>
                <li>• Campanha retenção clientes at-risk</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Confiança da IA:</span>
                <Badge variant="default">89% Alta</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Última atualização:</span>
                <span className="text-sm font-medium">27 Ago 2025, 14:32</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessIntelligence;
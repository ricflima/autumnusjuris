// src/pages/analytics/AnalyticsDashboard.tsx

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  Target,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  AreaChart,
  ComposedChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { useFinancialStats, useFinancialFormatters } from '@/hooks/useFinancial';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface AnalyticsFilters {
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  compareWith?: 'previous' | 'lastYear';
  groupBy: 'day' | 'week' | 'month' | 'quarter';
}

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

const AnalyticsDashboard: React.FC = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'month',
    groupBy: 'day',
    compareWith: 'previous'
  });

  const { formatCurrency, formatPercentage, formatNumber } = useFinancialFormatters();
  const { month: monthStats, year: yearStats, isLoading } = useFinancialStats();

  // Mock data for analytics - Em produção, viria das APIs
  const revenueData = [
    { period: 'Jan', receitas: 45000, despesas: 12000, lucro: 33000 },
    { period: 'Fev', receitas: 52000, despesas: 15000, lucro: 37000 },
    { period: 'Mar', receitas: 48000, despesas: 13500, lucro: 34500 },
    { period: 'Abr', receitas: 61000, despesas: 16000, lucro: 45000 },
    { period: 'Mai', receitas: 58000, despesas: 14200, lucro: 43800 },
    { period: 'Jun', receitas: 67000, despesas: 17500, lucro: 49500 },
  ];

  const clientProfitabilityData = [
    { cliente: 'Empresa ABC Ltda', receita: 25000, custos: 5000, roi: 400 },
    { cliente: 'João Silva', receita: 15000, custos: 3000, roi: 400 },
    { cliente: 'Tech Solutions', receita: 35000, custos: 8000, roi: 337.5 },
    { cliente: 'Maria Santos', receita: 12000, custos: 3500, roi: 242.8 },
    { cliente: 'Construtora XYZ', receita: 28000, custos: 9000, roi: 211.1 },
  ];

  const caseCategoryData = [
    { name: 'Trabalhista', value: 35, color: '#3b82f6' },
    { name: 'Cível', value: 25, color: '#10b981' },
    { name: 'Empresarial', value: 20, color: '#f59e0b' },
    { name: 'Tributário', value: 15, color: '#ef4444' },
    { name: 'Criminal', value: 5, color: '#8b5cf6' }
  ];

  const performanceMetrics: MetricCard[] = [
    {
      title: 'Receita Total',
      value: formatCurrency(67000),
      change: 12.5,
      changeLabel: 'vs mês anterior',
      icon: DollarSign,
      color: 'text-green-600',
      trend: 'up'
    },
    {
      title: 'Casos Ativos',
      value: formatNumber(47),
      change: 8.2,
      changeLabel: 'novos este mês',
      icon: Briefcase,
      color: 'text-blue-600',
      trend: 'up'
    },
    {
      title: 'Clientes Ativos',
      value: formatNumber(32),
      change: 5.8,
      changeLabel: 'crescimento',
      icon: Users,
      color: 'text-purple-600',
      trend: 'up'
    },
    {
      title: 'Taxa de Sucesso',
      value: formatPercentage(87.5),
      change: -2.1,
      changeLabel: 'casos resolvidos',
      icon: Target,
      color: 'text-orange-600',
      trend: 'down'
    }
  ];

  const cashFlowProjection = [
    { mes: 'Jul', entrada: 65000, saida: 18000, saldo: 47000 },
    { mes: 'Ago', entrada: 72000, saida: 19500, saldo: 52500 },
    { mes: 'Set', entrada: 68000, saida: 17800, saldo: 50200 },
    { mes: 'Out', entrada: 75000, saida: 21000, saldo: 54000 },
    { mes: 'Nov', entrada: 71000, saida: 19200, saldo: 51800 },
    { mes: 'Dez', entrada: 78000, saida: 22500, saldo: 55500 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-end gap-3">
        <Select value={filters.period} onValueChange={(value: any) => 
          setFilters(prev => ({ ...prev, period: value }))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="year">Último Ano</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                </div>
                <div className="flex items-center mt-3">
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">{metric.changeLabel}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos Principais */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="cases">Casos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receitas vs Despesas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Receitas vs Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => formatCurrency(value, 'BRL').replace('R$', 'R$')} />
                    <Tooltip 
                      formatter={(value: any, name) => [
                        formatCurrency(value), 
                        name === 'receitas' ? 'Receitas' : 
                        name === 'despesas' ? 'Despesas' : 'Lucro'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                    <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                    <Line type="monotone" dataKey="lucro" stroke="#3b82f6" strokeWidth={3} name="Lucro" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Projeção de Fluxo de Caixa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Projeção Fluxo de Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cashFlowProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value, 'BRL').replace('R$', 'R$')} />
                    <Tooltip 
                      formatter={(value: any, name) => [
                        formatCurrency(value), 
                        name === 'entrada' ? 'Entradas' : 
                        name === 'saida' ? 'Saídas' : 'Saldo'
                      ]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="saldo" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Saldo" />
                    <Area type="monotone" dataKey="entrada" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.5} name="Entradas" />
                    <Area type="monotone" dataKey="saida" stackId="3" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} name="Saídas" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rentabilidade por Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top 5 - Rentabilidade por Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientProfitabilityData.map((client, index) => (
                    <div key={client.cliente} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.cliente}</p>
                          <p className="text-sm text-gray-500">
                            ROI: {formatPercentage(client.roi)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(client.receita)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Custos: {formatCurrency(client.custos)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Tipo de Caso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribuição por Área do Direito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={caseCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {caseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status dos Casos */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Casos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { status: 'Em Andamento', count: 28, color: 'bg-blue-500' },
                  { status: 'Aguardando', count: 12, color: 'bg-yellow-500' },
                  { status: 'Finalizados', count: 7, color: 'bg-green-500' },
                  { status: 'Suspensos', count: 3, color: 'bg-red-500' }
                ].map(item => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm text-gray-600">{item.status}</span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Prazos Próximos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Prazos Próximos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { caso: 'Processo 123456', prazo: '2 dias', urgencia: 'alta' },
                  { caso: 'Recurso ABC', prazo: '5 dias', urgencia: 'média' },
                  { caso: 'Petição XYZ', prazo: '7 dias', urgencia: 'baixa' },
                  { caso: 'Contestação 789', prazo: '12 dias', urgencia: 'média' }
                ].map(item => (
                  <div key={item.caso} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{item.caso}</p>
                      <p className="text-xs text-gray-500">Vence em {item.prazo}</p>
                    </div>
                    <Badge variant={
                      item.urgencia === 'alta' ? 'destructive' : 
                      item.urgencia === 'média' ? 'secondary' : 'default'
                    }>
                      {item.urgencia}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Metas vs Realizado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { meta: 'Novos Casos', atual: 8, objetivo: 10, percent: 80 },
                  { meta: 'Receita', atual: 67000, objetivo: 70000, percent: 95.7 },
                  { meta: 'Satisfação', atual: 4.3, objetivo: 4.5, percent: 95.5 }
                ].map(item => (
                  <div key={item.meta}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{item.meta}</span>
                      <span className="text-sm text-gray-600">
                        {formatPercentage(item.percent)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.percent >= 90 ? 'bg-green-500' :
                          item.percent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Atual: {typeof item.atual === 'number' && item.atual > 1000 ? 
                        formatCurrency(item.atual) : item.atual} / 
                      Meta: {typeof item.objetivo === 'number' && item.objetivo > 1000 ? 
                        formatCurrency(item.objetivo) : item.objetivo}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produtividade por Advogado */}
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Advogado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nome: 'Dr. João Silva', casos: 15, horas: 120, eficiencia: 92 },
                    { nome: 'Dra. Maria Santos', casos: 12, horas: 95, eficiencia: 88 },
                    { nome: 'Dr. Pedro Costa', casos: 10, horas: 85, eficiencia: 85 },
                    { nome: 'Dra. Ana Oliveira', casos: 8, horas: 70, eficiencia: 80 }
                  ].map(advogado => (
                    <div key={advogado.nome} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{advogado.nome}</h4>
                        <Badge variant={
                          advogado.eficiencia >= 90 ? 'default' :
                          advogado.eficiencia >= 85 ? 'secondary' : 'outline'
                        }>
                          {advogado.eficiencia}% eficiência
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-900">{advogado.casos}</span> casos ativos
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{advogado.horas}h</span> trabalhadas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alertas e Recomendações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas e Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Prazo Crítico</p>
                    <p className="text-sm text-red-600">3 processos vencem em menos de 48h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Cobrança Pendente</p>
                    <p className="text-sm text-yellow-600">R$ 25.000 em faturas vencidas</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Meta Atingida</p>
                    <p className="text-sm text-green-600">Receita do mês superou a projeção</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Oportunidade</p>
                    <p className="text-sm text-blue-600">Cliente ABC pode gerar +30% receita</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
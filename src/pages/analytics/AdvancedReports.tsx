// src/pages/analytics/AdvancedReports.tsx

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Settings,
  Share2,
  Mail,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Target,
  Zap,
  Save,
  Play,
  Pause,
  Plus,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { useFinancialFormatters } from '@/hooks/useFinancial';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'analytical';
  icon: React.ElementType;
  estimatedTime: string;
  features: string[];
  lastGenerated?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  isActive?: boolean;
}

interface CustomReportConfig {
  name: string;
  description: string;
  period: {
    type: 'fixed' | 'relative';
    startDate?: Date;
    endDate?: Date;
    relativePeriod?: 'last7days' | 'last30days' | 'lastQuarter' | 'lastYear';
  };
  metrics: string[];
  groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year';
  chartTypes: string[];
  filters: {
    clients?: string[];
    cases?: string[];
    categories?: string[];
    status?: string[];
  };
  scheduling: {
    enabled: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    recipients?: string[];
    nextRun?: Date;
  };
}

const AdvancedReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customConfig, setCustomConfig] = useState<CustomReportConfig>({
    name: '',
    description: '',
    period: { type: 'relative', relativePeriod: 'last30days' },
    metrics: [],
    groupBy: 'month',
    chartTypes: [],
    filters: {},
    scheduling: { enabled: false }
  });

  const { formatCurrency, formatDate } = useFinancialFormatters();

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'income-statement',
      name: 'Demonstrativo de Resultados',
      description: 'Receitas, despesas e lucro líquido por período',
      type: 'financial',
      icon: TrendingUp,
      estimatedTime: '2-3 min',
      features: ['Receitas detalhadas', 'Despesas categorizadas', 'Margem de lucro', 'Comparação temporal'],
      lastGenerated: '2025-08-25',
      frequency: 'monthly',
      isActive: true
    },
    {
      id: 'cash-flow',
      name: 'Fluxo de Caixa',
      description: 'Projeções de entrada e saída de recursos',
      type: 'financial',
      icon: BarChart3,
      estimatedTime: '1-2 min',
      features: ['Projeções futuras', 'Histórico de movimentações', 'Análise de tendências', 'Alertas de liquidez'],
      lastGenerated: '2025-08-26',
      frequency: 'weekly',
      isActive: true
    },
    {
      id: 'client-profitability',
      name: 'Rentabilidade por Cliente',
      description: 'ROI e análise de lucratividade por cliente',
      type: 'analytical',
      icon: Users,
      estimatedTime: '3-5 min',
      features: ['ROI por cliente', 'Honorários vs custos', 'Ranking de lucratividade', 'Histórico de pagamentos'],
      lastGenerated: '2025-08-20',
      frequency: 'monthly'
    },
    {
      id: 'expense-analysis',
      name: 'Análise de Despesas',
      description: 'Detalhamento e categorização de todas as despesas',
      type: 'operational',
      icon: PieChart,
      estimatedTime: '2-3 min',
      features: ['Despesas por categoria', 'Fornecedores principais', 'Despesas reembolsáveis', 'Tendências mensais'],
      lastGenerated: '2025-08-22',
      frequency: 'monthly'
    },
    {
      id: 'receivables-aging',
      name: 'Aging de Recebíveis',
      description: 'Análise de faturas pendentes por vencimento',
      type: 'financial',
      icon: Clock,
      estimatedTime: '1-2 min',
      features: ['Faturas por vencimento', 'Risco de inadimplência', 'Histórico de cobranças', 'Ações recomendadas']
    },
    {
      id: 'performance-kpis',
      name: 'KPIs de Performance',
      description: 'Indicadores-chave de desempenho do escritório',
      type: 'analytical',
      icon: Target,
      estimatedTime: '2-4 min',
      features: ['Métricas de produtividade', 'Taxa de conversão', 'Tempo médio de caso', 'Satisfação do cliente']
    }
  ];

  const availableMetrics = [
    { id: 'revenue', name: 'Receitas Totais', category: 'financial' },
    { id: 'expenses', name: 'Despesas Totais', category: 'financial' },
    { id: 'profit', name: 'Lucro Líquido', category: 'financial' },
    { id: 'margin', name: 'Margem de Lucro', category: 'financial' },
    { id: 'active_cases', name: 'Casos Ativos', category: 'operational' },
    { id: 'new_cases', name: 'Novos Casos', category: 'operational' },
    { id: 'closed_cases', name: 'Casos Finalizados', category: 'operational' },
    { id: 'active_clients', name: 'Clientes Ativos', category: 'operational' },
    { id: 'new_clients', name: 'Novos Clientes', category: 'operational' },
    { id: 'client_retention', name: 'Taxa de Retenção', category: 'analytical' },
    { id: 'avg_case_value', name: 'Valor Médio por Caso', category: 'analytical' },
    { id: 'productivity_score', name: 'Score de Produtividade', category: 'analytical' }
  ];

  const chartTypeOptions = [
    { id: 'line', name: 'Gráfico de Linha', icon: LineChart },
    { id: 'bar', name: 'Gráfico de Barras', icon: BarChart3 },
    { id: 'pie', name: 'Gráfico de Pizza', icon: PieChart },
    { id: 'area', name: 'Gráfico de Área', icon: TrendingUp }
  ];

  const handleGenerateReport = async (templateId: string) => {
    setIsGenerating(true);
    // Simular geração do relatório
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    
    // Em produção, aqui faria a chamada real para a API
    console.log(`Generating report: ${templateId}`);
  };

  const handleSaveCustomReport = () => {
    // Validação básica
    if (!customConfig.name || customConfig.metrics.length === 0) {
      alert('Nome e pelo menos uma métrica são obrigatórios');
      return;
    }

    // Em produção, salvaria no backend
    console.log('Saving custom report:', customConfig);
    setShowCustomDialog(false);
    
    // Reset form
    setCustomConfig({
      name: '',
      description: '',
      period: { type: 'relative', relativePeriod: 'last30days' },
      metrics: [],
      groupBy: 'month',
      chartTypes: [],
      filters: {},
      scheduling: { enabled: false }
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-blue-100 text-blue-800';
      case 'analytical': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyColor = (frequency?: string) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800';
      case 'weekly': return 'bg-yellow-100 text-yellow-800';
      case 'monthly': return 'bg-green-100 text-green-800';
      case 'quarterly': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Avançados</h1>
          <p className="text-gray-600">Relatórios personalizáveis e automáticos para Business Intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Relatório Customizado</DialogTitle>
                <DialogDescription>
                  Configure um relatório personalizado com suas métricas e filtros preferidos
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-name">Nome do Relatório *</Label>
                    <Input
                      id="report-name"
                      value={customConfig.name}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Análise Mensal de Performance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-by">Agrupar Por</Label>
                    <Select value={customConfig.groupBy} onValueChange={(value: any) => 
                      setCustomConfig(prev => ({ ...prev, groupBy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Dia</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mês</SelectItem>
                        <SelectItem value="quarter">Trimestre</SelectItem>
                        <SelectItem value="year">Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-description">Descrição</Label>
                  <Textarea
                    id="report-description"
                    value={customConfig.description}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo deste relatório..."
                    rows={2}
                  />
                </div>

                {/* Período */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Período de Análise</Label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={customConfig.period.type === 'relative'}
                        onChange={() => setCustomConfig(prev => ({
                          ...prev,
                          period: { ...prev.period, type: 'relative' }
                        }))}
                      />
                      <span>Período Relativo</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={customConfig.period.type === 'fixed'}
                        onChange={() => setCustomConfig(prev => ({
                          ...prev,
                          period: { ...prev.period, type: 'fixed' }
                        }))}
                      />
                      <span>Período Fixo</span>
                    </label>
                  </div>

                  {customConfig.period.type === 'relative' ? (
                    <Select 
                      value={customConfig.period.relativePeriod} 
                      onValueChange={(value: any) => setCustomConfig(prev => ({
                        ...prev,
                        period: { ...prev.period, relativePeriod: value }
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                        <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                        <SelectItem value="lastQuarter">Último trimestre</SelectItem>
                        <SelectItem value="lastYear">Último ano</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Inicial</Label>
                        <DatePicker
                          value={customConfig.period.startDate}
                          onChange={(date) => setCustomConfig(prev => ({
                            ...prev,
                            period: { ...prev.period, startDate: date }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Final</Label>
                        <DatePicker
                          value={customConfig.period.endDate}
                          onChange={(date) => setCustomConfig(prev => ({
                            ...prev,
                            period: { ...prev.period, endDate: date }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Métricas */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Métricas a Incluir *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['financial', 'operational', 'analytical'].map(category => (
                      <Collapsible key={category}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <span className="font-medium capitalize">{category}</span>
                          <ChevronDown className="w-4 h-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2">
                          {availableMetrics
                            .filter(metric => metric.category === category)
                            .map(metric => (
                              <div key={metric.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={metric.id}
                                  checked={customConfig.metrics.includes(metric.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setCustomConfig(prev => ({
                                        ...prev,
                                        metrics: [...prev.metrics, metric.id]
                                      }));
                                    } else {
                                      setCustomConfig(prev => ({
                                        ...prev,
                                        metrics: prev.metrics.filter(id => id !== metric.id)
                                      }));
                                    }
                                  }}
                                />
                                <Label htmlFor={metric.id} className="text-sm">{metric.name}</Label>
                              </div>
                            ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>

                {/* Tipos de Gráfico */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Tipos de Visualização</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {chartTypeOptions.map(chart => {
                      const Icon = chart.icon;
                      return (
                        <div
                          key={chart.id}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            customConfig.chartTypes.includes(chart.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const isSelected = customConfig.chartTypes.includes(chart.id);
                            setCustomConfig(prev => ({
                              ...prev,
                              chartTypes: isSelected
                                ? prev.chartTypes.filter(id => id !== chart.id)
                                : [...prev.chartTypes, chart.id]
                            }));
                          }}
                        >
                          <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                          <p className="text-sm text-center">{chart.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Agendamento */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Relatório Automático</Label>
                    <Switch
                      checked={customConfig.scheduling.enabled}
                      onCheckedChange={(checked) => setCustomConfig(prev => ({
                        ...prev,
                        scheduling: { ...prev.scheduling, enabled: checked }
                      }))}
                    />
                  </div>

                  {customConfig.scheduling.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select 
                          value={customConfig.scheduling.frequency} 
                          onValueChange={(value: any) => setCustomConfig(prev => ({
                            ...prev,
                            scheduling: { ...prev.scheduling, frequency: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Email para Envio</Label>
                        <Input placeholder="email@exemplo.com" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCustomReport} disabled={!customConfig.name || customConfig.metrics.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Relatório
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        </div>
                      </div>
                      {template.isActive && (
                        <Badge variant="default" className="text-xs">Ativo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={getTypeColor(template.type)}>
                        {template.type}
                      </Badge>
                      <span className="text-sm text-gray-500">{template.estimatedTime}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Recursos inclusos:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {template.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {template.lastGenerated && (
                      <p className="text-xs text-gray-500">
                        Última geração: {formatDate(template.lastGenerated)}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleGenerateReport(template.id)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Gerar
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Relatórios Agendados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Demonstrativo Mensal',
                    frequency: 'monthly',
                    nextRun: '2025-09-01',
                    lastRun: '2025-08-01',
                    status: 'active',
                    recipients: ['admin@escritorio.com']
                  },
                  {
                    name: 'Fluxo de Caixa Semanal',
                    frequency: 'weekly',
                    nextRun: '2025-08-30',
                    lastRun: '2025-08-23',
                    status: 'active',
                    recipients: ['financeiro@escritorio.com', 'gestor@escritorio.com']
                  },
                  {
                    name: 'Análise de Clientes',
                    frequency: 'quarterly',
                    nextRun: '2025-10-01',
                    lastRun: '2025-07-01',
                    status: 'paused',
                    recipients: ['comercial@escritorio.com']
                  }
                ].map((scheduled, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        scheduled.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">{scheduled.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>
                            <Badge className={getFrequencyColor(scheduled.frequency)}>
                              {scheduled.frequency}
                            </Badge>
                          </span>
                          <span>Próxima: {formatDate(scheduled.nextRun)}</span>
                          <span>{scheduled.recipients.length} destinatários</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        {scheduled.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Histórico de Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: 'Demonstrativo de Resultados - Agosto 2025',
                    type: 'financial',
                    generatedAt: '2025-08-25T10:30:00',
                    size: '2.3 MB',
                    downloads: 5
                  },
                  {
                    name: 'Fluxo de Caixa - Semana 34',
                    type: 'financial',
                    generatedAt: '2025-08-23T08:15:00',
                    size: '1.8 MB',
                    downloads: 3
                  },
                  {
                    name: 'Análise de Performance - Q2 2025',
                    type: 'analytical',
                    generatedAt: '2025-08-20T16:45:00',
                    size: '4.1 MB',
                    downloads: 8
                  },
                  {
                    name: 'Rentabilidade por Cliente - Julho 2025',
                    type: 'analytical',
                    generatedAt: '2025-08-15T14:20:00',
                    size: '3.2 MB',
                    downloads: 12
                  },
                  {
                    name: 'Aging de Recebíveis - Agosto 2025',
                    type: 'financial',
                    generatedAt: '2025-08-10T09:30:00',
                    size: '1.5 MB',
                    downloads: 6
                  }
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <Badge className={getTypeColor(report.type)}>
                            {report.type}
                          </Badge>
                          <span>Gerado em {formatDate(report.generatedAt)}</span>
                          <span>{report.size}</span>
                          <span>{report.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Relatórios Este Mês</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">+15% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agendamentos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">2 novos esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">2.4min</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">-30% otimização</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Downloads Totais</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">+45% compartilhamentos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedReports;
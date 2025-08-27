// src/pages/financial/FinancialReports.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  PieChart,
  BarChart3,
  Users,
  DollarSign,
  Clock,
  Settings,
  Share2,
  Mail,
  Eye,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useFinancialSummary,
  useCashFlowProjection,
  useFinancialFormatters,
  useFinancialStats
} from '@/hooks/useFinancial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'analytical';
  icon: React.ElementType;
  estimatedTime: string;
  features: string[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'income-statement',
    name: 'Demonstrativo de Resultados',
    description: 'Receitas, despesas e lucro líquido por período',
    type: 'financial',
    icon: TrendingUp,
    estimatedTime: '2-3 min',
    features: ['Receitas detalhadas', 'Despesas categorizadas', 'Margem de lucro', 'Comparação temporal']
  },
  {
    id: 'cash-flow',
    name: 'Fluxo de Caixa',
    description: 'Projeções de entrada e saída de recursos',
    type: 'financial',
    icon: BarChart3,
    estimatedTime: '1-2 min',
    features: ['Projeções futuras', 'Histórico de movimentações', 'Análise de tendências', 'Alertas de liquidez']
  },
  {
    id: 'client-profitability',
    name: 'Rentabilidade por Cliente',
    description: 'ROI e análise de lucratividade por cliente',
    type: 'analytical',
    icon: Users,
    estimatedTime: '3-5 min',
    features: ['ROI por cliente', 'Honorários vs custos', 'Ranking de lucratividade', 'Histórico de pagamentos']
  },
  {
    id: 'expense-analysis',
    name: 'Análise de Despesas',
    description: 'Detalhamento e categorização de todas as despesas',
    type: 'operational',
    icon: PieChart,
    estimatedTime: '2-3 min',
    features: ['Despesas por categoria', 'Fornecedores principais', 'Despesas reembolsáveis', 'Tendências mensais']
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
    id: 'custom-report',
    name: 'Relatório Customizado',
    description: 'Configure seus próprios parâmetros e métricas',
    type: 'analytical',
    icon: Settings,
    estimatedTime: '5-10 min',
    features: ['Filtros personalizados', 'Métricas customizáveis', 'Múltiplas visualizações', 'Agendamento automático']
  }
];

const FinancialReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const { formatCurrency, formatPercentage, formatDate } = useFinancialFormatters();
  const financialStats = useFinancialStats();

  // Calcular datas baseadas no período selecionado
  const getPeriodDates = (period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'current-month':
        return {
          start: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
      case 'last-month':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return {
          start: `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`,
          end: new Date(lastMonthYear, lastMonth + 1, 0).toISOString().split('T')[0]
        };
      case 'current-quarter':
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return {
          start: `${currentYear}-${String(quarterStart + 1).padStart(2, '0')}-01`,
          end: new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]
        };
      case 'current-year':
        return {
          start: `${currentYear}-01-01`,
          end: `${currentYear}-12-31`
        };
      case 'custom':
        return { start: startDate, end: endDate };
      default:
        return {
          start: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
    }
  };

  const { start, end } = getPeriodDates(selectedPeriod);
  const summary = useFinancialSummary(start, end);
  const cashFlow = useCashFlowProjection(start, end);

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    
    // Simular geração de relatório
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aqui seria feita a chamada real para gerar o relatório
    console.log(`Gerando relatório: ${reportId} para período ${start} a ${end}`);
    
    setIsGenerating(null);
    
    // Simular download do relatório
    // Em produção, isso seria um blob ou URL do arquivo gerado
    const blob = new Blob(['Conteúdo do relatório...'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportId}-${start}-${end}.pdf`;
    a.click();
  };

  const getTypeColor = (type: string) => {
    const colors = {
      financial: 'bg-green-100 text-green-800',
      operational: 'bg-blue-100 text-blue-800',
      analytical: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      financial: 'Financeiro',
      operational: 'Operacional',
      analytical: 'Analítico'
    };
    return labels[type as keyof typeof labels] || 'Outro';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-gray-600">
            Gere relatórios detalhados para análise e tomada de decisões
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Dados
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Agendar Envio
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="period">Período Predefinido</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Mês Atual</SelectItem>
                  <SelectItem value="last-month">Mês Anterior</SelectItem>
                  <SelectItem value="current-quarter">Trimestre Atual</SelectItem>
                  <SelectItem value="current-year">Ano Atual</SelectItem>
                  <SelectItem value="custom">Período Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Resumo do período selecionado */}
          {summary.data && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Resumo do Período ({formatDate(start)} a {formatDate(end)})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Receitas</p>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(summary.data.totalReceived)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Despesas</p>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(summary.data.totalExpenses)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Lucro Líquido</p>
                  <p className="font-semibold text-blue-900">
                    {formatCurrency(summary.data.netIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Margem</p>
                  <p className="font-semibold text-blue-900">
                    {formatPercentage(summary.data.profitMargin)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates de Relatório */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Templates de Relatórios</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REPORT_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const generating = isGenerating === template.id;
            
            return (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTypeColor(template.type)}>
                            {getTypeLabel(template.type)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {template.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    {template.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Inclui:
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {template.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(template.id)}
                        disabled={generating || !start || !end}
                        className="flex-1"
                      >
                        {generating ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Gerar PDF
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Seção de relatórios recentes/agendados */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nenhum relatório gerado ainda"
            description="Os relatórios gerados aparecerão aqui para download e compartilhamento"
            action={
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Ver Histórico
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;
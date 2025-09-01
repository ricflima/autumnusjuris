// src/pages/reports/AdvancedReports.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Settings,
  Share2,
  Printer,
  Mail
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// Mock data para demonstração
const REPORT_TEMPLATES = [
  {
    id: 'case-performance',
    name: 'Performance de Casos',
    description: 'Análise detalhada do desempenho dos casos jurídicos',
    category: 'operational',
    lastGenerated: '2025-01-26T10:30:00Z',
    format: 'PDF',
    icon: Activity,
    color: 'bg-blue-500'
  },
  {
    id: 'financial-summary',
    name: 'Resumo Financeiro',
    description: 'Relatório completo de receitas, despesas e lucros',
    category: 'financial',
    lastGenerated: '2025-01-25T16:20:00Z',
    format: 'Excel',
    icon: DollarSign,
    color: 'bg-green-500'
  },
  {
    id: 'client-analysis',
    name: 'Análise de Clientes',
    description: 'Insights sobre satisfação e engajamento dos clientes',
    category: 'client',
    lastGenerated: '2025-01-24T14:15:00Z',
    format: 'PDF',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    id: 'productivity-metrics',
    name: 'Métricas de Produtividade',
    description: 'Análise da produtividade da equipe e processos',
    category: 'operational',
    lastGenerated: '2025-01-23T11:45:00Z',
    format: 'Dashboard',
    icon: Target,
    color: 'bg-orange-500'
  },
];

const QUICK_REPORTS = [
  {
    id: 'cases-this-month',
    name: 'Casos deste Mês',
    value: '47',
    change: '+12%',
    trend: 'up'
  },
  {
    id: 'revenue-this-month',
    name: 'Receita do Mês',
    value: 'R$ 158.500',
    change: '+8%',
    trend: 'up'
  },
  {
    id: 'pending-deadlines',
    name: 'Prazos Pendentes',
    value: '12',
    change: '-5%',
    trend: 'down'
  },
  {
    id: 'client-satisfaction',
    name: 'Satisfação do Cliente',
    value: '94.2%',
    change: '+2%',
    trend: 'up'
  },
];

const CATEGORY_COLORS = {
  operational: 'bg-blue-100 text-blue-800',
  financial: 'bg-green-100 text-green-800',
  client: 'bg-purple-100 text-purple-800',
  legal: 'bg-orange-100 text-orange-800',
};

export function AdvancedReports() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last-30-days');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(true);
    // Simular geração de relatório
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    
    // Simular download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `relatorio-${reportId}-${Date.now()}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Relatórios Avançados
          </h1>
          <p className="text-gray-600">
            Análises detalhadas e insights do seu escritório
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {QUICK_REPORTS.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {report.name}
                  </p>
                  <p className="text-2xl font-bold">{report.value}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  report.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${
                    report.trend === 'down' ? 'rotate-180' : ''
                  }`} />
                  {report.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Personalizado</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Templates de Relatórios */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="operational">Operacional</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="legal">Jurídico</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Últimos 7 dias</SelectItem>
                <SelectItem value="last-30-days">Últimos 30 dias</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="last-year">Último ano</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Mais Filtros
            </Button>
          </div>

          {/* Grid de Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TEMPLATES.map((template) => {
              const Icon = template.icon;
              
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${template.color} rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={CATEGORY_COLORS[template.category as keyof typeof CATEGORY_COLORS]}
                        >
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Formato: {template.format}</span>
                      <span>Última: Ontem</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleGenerateReport(template.id)}
                        disabled={isGenerating}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isGenerating ? 'Gerando...' : 'Gerar'}
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

        {/* Relatório Personalizado */}
        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Relatório Personalizado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Nome do Relatório
                      </label>
                      <Input placeholder="Ex: Análise Mensal de Cases" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Formato
                      </label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecionar formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="dashboard">Dashboard Interativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Dados a Incluir
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'Casos por Status',
                        'Receitas e Despesas',
                        'Clientes Ativos',
                        'Prazos e Deadlines',
                        'Produtividade da Equipe',
                        'Satisfação do Cliente',
                        'Andamentos Processuais',
                        'Análise de Lucros'
                      ].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox id={item} onCheckedChange={() => {}} />
                          <label
                            htmlFor={item}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {item}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Período de Análise
                    </label>
                    <div className="mt-1">
                      <Input placeholder="Selecionar período" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">
                      Salvar Template
                    </Button>
                    <Button>
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Relatório
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visualização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Prévia do relatório aparecerá aqui
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Gráficos interativos</p>
                      <p>• Análises comparativas</p>
                      <p>• Insights automatizados</p>
                      <p>• Exportação em múltiplos formatos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Relatórios Agendados */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Relatórios Agendados</CardTitle>
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum relatório agendado
                </h3>
                <p className="text-gray-600 mb-4">
                  Configure relatórios para serem gerados automaticamente
                </p>
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Primeiro Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: 'Performance de Casos - Janeiro 2025',
                    date: '26/01/2025 10:30',
                    format: 'PDF',
                    size: '2.4 MB'
                  },
                  {
                    name: 'Resumo Financeiro - Dezembro 2024',
                    date: '25/01/2025 16:20',
                    format: 'Excel',
                    size: '1.8 MB'
                  },
                  {
                    name: 'Análise de Clientes - Q4 2024',
                    date: '24/01/2025 14:15',
                    format: 'PDF',
                    size: '3.1 MB'
                  },
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{report.name}</h4>
                        <p className="text-xs text-gray-500">
                          {report.date} • {report.format} • {report.size}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
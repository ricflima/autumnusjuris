// src/pages/dashboard/Dashboard.tsx
import { useState } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Plus,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados para demonstração
  const stats = {
    totalCases: 156,
    activeCases: 89,
    clients: 45,
    revenue: 125000,
    pendingTasks: 12,
    upcomingHearings: 8
  };

  const recentCases = [
    {
      id: '1',
      title: 'Processo Trabalhista - Silva vs Empresa XYZ',
      client: 'João Silva',
      status: 'Em andamento',
      priority: 'Alta',
      lastUpdate: '2 horas atrás',
      nextAction: 'Audiência em 15/03/2024'
    },
    {
      id: '2',
      title: 'Divórcio Consensual - Maria Santos',
      client: 'Maria Santos',
      status: 'Aguardando documentos',
      priority: 'Média',
      lastUpdate: '1 dia atrás',
      nextAction: 'Aguardando certidões'
    },
    {
      id: '3',
      title: 'Ação de Cobrança - Contrato Comercial',
      client: 'Empresa ABC Ltda',
      status: 'Em recurso',
      priority: 'Baixa',
      lastUpdate: '3 dias atrás',
      nextAction: 'Prazo para recurso: 20/03/2024'
    }
  ];

  const quickActions = [
    { icon: Plus, label: 'Novo Caso', action: 'create-case', color: 'bg-blue-500' },
    { icon: Users, label: 'Novo Cliente', action: 'create-client', color: 'bg-green-500' },
    { icon: Calendar, label: 'Agendar', action: 'schedule', color: 'bg-purple-500' },
    { icon: FileText, label: 'Relatório', action: 'report', color: 'bg-orange-500' }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'em andamento':
        return 'bg-green-100 text-green-800';
      case 'aguardando documentos':
        return 'bg-yellow-100 text-yellow-800';
      case 'em recurso':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'alta':
        return 'text-red-600';
      case 'média':
        return 'text-yellow-600';
      case 'baixa':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Olá, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Aqui está um resumo das suas atividades jurídicas hoje.
          </p>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Pesquisar casos, clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Casos Ativos
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeCases}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600">+12%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600">+3</span> novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita do Mês
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {stats.revenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600">+8%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tarefas Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-red-600">4</span> vencendo hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.action}
                  variant="outline"
                  className="h-20 flex flex-col items-center gap-2 hover:bg-gray-50 border-2 hover:border-gray-300 transition-colors"
                  onClick={() => console.log(`Ação: ${action.action}`)}
                >
                  <div className={`p-2 rounded-full ${action.color} text-white`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {action.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grid principal com duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Casos recentes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Casos Recentes
                </CardTitle>
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentCases.map((case_) => (
                <div key={case_.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {case_.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                      {case_.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Cliente: <span className="font-medium">{case_.client}</span></span>
                      <span className={`font-medium ${getPriorityColor(case_.priority)}`}>
                        {case_.priority} prioridade
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Última atualização: {case_.lastUpdate}
                      </span>
                    </div>
                    
                    <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                      <p className="text-xs text-blue-700">
                        <strong>Próxima ação:</strong> {case_.nextAction}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com informações extras */}
        <div className="space-y-6">
          {/* Próximas audiências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
                Próximas Audiências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-l-4 border-red-400 pl-3">
                <p className="font-medium text-sm text-gray-900">Audiência Trabalhista</p>
                <p className="text-xs text-gray-600">Hoje, 14:30</p>
                <p className="text-xs text-red-600">Caso: Silva vs Empresa XYZ</p>
              </div>
              
              <div className="border-l-4 border-yellow-400 pl-3">
                <p className="font-medium text-sm text-gray-900">Conciliação</p>
                <p className="text-xs text-gray-600">Amanhã, 10:00</p>
                <p className="text-xs text-yellow-600">Caso: Divórcio Santos</p>
              </div>
              
              <div className="border-l-4 border-blue-400 pl-3">
                <p className="font-medium text-sm text-gray-900">Sessão de Julgamento</p>
                <p className="text-xs text-gray-600">15/03, 15:00</p>
                <p className="text-xs text-blue-600">Caso: Ação de Cobrança ABC</p>
              </div>
              
              <Button variant="outline" className="w-full" size="sm">
                Ver agenda completa
              </Button>
            </CardContent>
          </Card>

          {/* Tarefas importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-orange-600" />
                Tarefas Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-red-50 border border-red-200 rounded">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Contestação - Prazo hoje</p>
                  <p className="text-xs text-red-600">Vence às 17:00</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Documentos cliente</p>
                  <p className="text-xs text-yellow-600">Vence amanhã</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Relatório mensal</p>
                  <p className="text-xs text-blue-600">Em 3 dias</p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" size="sm">
                Ver todas as tarefas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
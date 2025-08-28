// src/pages/dashboard/Dashboard.tsx - VERSÃO COMPLETA CORRIGIDA PARA FASE 4
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Plus,
  Search,
  ArrowUpRight,
  Building,
  User,
  Gavel
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { casesService } from '@/services/cases.service';
import { clientsService } from '@/services/clients.service';
import { processesService } from '@/services/processes.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import { formatCurrencyCompact, formatDate } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      // Implementar busca global - navegar para uma página de resultados
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Query para buscar casos recentes
  const { data: casesData } = useQuery({
    queryKey: ['dashboard-cases'],
    queryFn: () => casesService.getCases({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
    staleTime: 2 * 60 * 1000,
  });

  // Query para buscar clientes recentes
  const { data: clientsData } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: () => clientsService.getClients({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    staleTime: 2 * 60 * 1000,
  });

  // Query para buscar todos os casos (para estatísticas)
  const { data: allCasesData } = useQuery({
    queryKey: ['dashboard-all-cases'],
    queryFn: () => casesService.getCases({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para buscar todos os clientes (para estatísticas)
  const { data: allClientsData } = useQuery({
    queryKey: ['dashboard-all-clients'],
    queryFn: () => clientsService.getClients({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para processos - MOVIDA PARA ANTES DO USO
  const { data: processStatsData } = useQuery({
    queryKey: ['dashboard-process-stats'],
    queryFn: () => processesService.getProcessStatistics(),
    staleTime: 5 * 60 * 1000,
  });

  // Calcular estatísticas - AGORA processStatsData JÁ ESTÁ DEFINIDA
  const stats = {
    totalCases: allCasesData?.total || 0,
    activeCases: allCasesData?.cases.filter(c => ['active', 'in_court'].includes(c.status)).length || 0,
    totalClients: allClientsData?.total || 0,
    activeClients: allClientsData?.clients.filter(c => c.status === 'active').length || 0,
    prospects: allClientsData?.clients.filter(c => c.status === 'prospect').length || 0,
    revenue: allClientsData?.clients.reduce((sum, c) => sum + c.totalBilled, 0) || 0,
    totalProcesses: processStatsData?.totalProcesses || 0,
    activeProcesses: processStatsData?.activeProcesses || 0,
    overdueDeadlines: processStatsData?.overdueDeadlines || 0,
    pendingTasks: 12, // Será implementado em fases futuras
    upcomingHearings: 8 // Será implementado em fases futuras
  };

  const quickActions = [
    { 
      icon: FileText, 
      label: 'Novo Caso', 
      href: '/cases/new',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    { 
      icon: Users, 
      label: 'Novo Cliente', 
      href: '/clients/new',
      color: 'bg-green-500 hover:bg-green-600',
    },
    { 
      icon: Gavel, 
      label: 'Novo Processo', 
      href: '/processes/new',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    { 
      icon: Calendar, 
      label: 'Ver Calendário', 
      href: '/calendar',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  const recentCases = casesData?.cases || [];
  const recentClients = clientsData?.clients || [];

  // Se ainda estamos carregando dados essenciais, mostre loading
  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo de volta, {user.name}!
          </h1>
          <p className="text-gray-600">
            Aqui está um resumo das suas atividades jurídicas
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar casos, clientes, processos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-10 w-full md:w-80"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              to={action.href}
              className="group"
            >
              <Card className="border-2 border-transparent hover:border-gray-200 transition-all duration-200 hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-gray-700">
                    {action.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        {/* Total Cases */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Casos Ativos
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeCases}</div>
            <p className="text-xs text-gray-500 mt-1">
              de {stats.totalCases} casos totais
            </p>
            <Link to="/cases" className="inline-flex items-center text-xs text-blue-600 hover:underline mt-1">
              Ver todos <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeClients}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.prospects} prospects • {stats.totalClients} total
            </p>
            <Link to="/clients" className="inline-flex items-center text-xs text-green-600 hover:underline mt-1">
              Ver todos <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrencyCompact(stats.revenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Acumulado histórico
            </p>
            <Link to="/financial" className="inline-flex items-center text-xs text-purple-600 hover:underline mt-1">
              Ver detalhes <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
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
            <Link to="/calendar" className="inline-flex items-center text-xs text-orange-600 hover:underline mt-1">
              Ver agenda <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Processos Ativos
            </CardTitle>
            <Gavel className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.activeProcesses}</div>
            <p className="text-xs text-gray-500 mt-1">
              de {stats.totalProcesses} processos totais
            </p>
            <Link to="/processes" className="inline-flex items-center text-xs text-orange-600 hover:underline mt-1">
              Ver todos <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prazos Vencidos
            </CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueDeadlines}</div>
            <p className="text-xs text-gray-500 mt-1">
              Requer atenção urgente
            </p>
            <Link to="/processes" className="inline-flex items-center text-xs text-red-600 hover:underline mt-1">
              Ver prazos <ArrowUpRight className="w-3 h-3 ml-1" />
            </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/cases/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Novo Caso</h4>
                <p className="text-xs text-gray-500">Cadastrar novo caso</p>
              </div>
            </Link>

            <Link
              to="/clients/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Novo Cliente</h4>
                <p className="text-xs text-gray-500">Cadastrar cliente</p>
              </div>
            </Link>

            <Link
              to="/processes/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Plus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Novo Processo</h4>
                <p className="text-xs text-gray-500">Cadastrar processo</p>
              </div>
            </Link>

            <Link
              to="/calendar"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Ver Agenda</h4>
                <p className="text-xs text-gray-500">Compromissos e prazos</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Casos Recentes</CardTitle>
            <Link to="/cases">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCases.length > 0 ? (
              recentCases.map((case_) => (
                <div
                  key={case_.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {case_.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {case_.clientId ? `Cliente ID: ${case_.clientId}` : 'Cliente não informado'}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(case_.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${case_.status === 'active' ? 'bg-green-100 text-green-800' : 
                        case_.status === 'in_court' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {case_.status === 'active' ? 'Ativo' : 
                       case_.status === 'in_court' ? 'Em Tribunal' : 
                       case_.status}
                    </span>
                    <Link to={`/cases/${case_.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Nenhum caso encontrado</p>
                <Link to="/cases/new">
                  <Button className="mt-2" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeiro caso
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Clientes Recentes</CardTitle>
            <Link to="/clients">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {client.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          {client.type === 'individual' ? (
                            <User className="w-3 h-3 text-gray-400" />
                          ) : (
                            <Building className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="text-xs text-gray-500">
                            {client.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(client.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${client.status === 'active' ? 'bg-green-100 text-green-800' : 
                        client.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {client.status === 'active' ? 'Ativo' : 
                       client.status === 'prospect' ? 'Prospect' : 
                       client.status}
                    </span>
                    <Link to={`/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Nenhum cliente encontrado</p>
                <Link to="/clients/new" className="inline-flex items-center text-blue-600 hover:underline text-sm">
                  Cadastrar primeiro cliente
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximas audiências e tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas audiências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              Próximas Audiências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border-l-4 border-red-400 pl-3 py-2">
              <p className="font-medium text-sm text-gray-900">Audiência Trabalhista</p>
              <p className="text-xs text-gray-600">Hoje, 14:30</p>
              <p className="text-xs text-red-600">Caso: Silva vs Empresa XYZ</p>
            </div>
            
            <div className="border-l-4 border-yellow-400 pl-3 py-2">
              <p className="font-medium text-sm text-gray-900">Conciliação</p>
              <p className="text-xs text-gray-600">Amanhã, 10:00</p>
              <p className="text-xs text-yellow-600">Caso: Divórcio Santos</p>
            </div>
            
            <div className="border-l-4 border-blue-400 pl-3 py-2">
              <p className="font-medium text-sm text-gray-900">Sessão de Julgamento</p>
              <p className="text-xs text-gray-600">15/03, 15:00</p>
              <p className="text-xs text-blue-600">Caso: Ação de Cobrança ABC</p>
            </div>
            
            <Link to="/calendar">
              <Button variant="outline" className="w-full" size="sm">
                Ver agenda completa
              </Button>
            </Link>
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
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Contestação - Prazo hoje</p>
                <p className="text-xs text-red-600">Vence às 17:00</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Documentos cliente</p>
                <p className="text-xs text-yellow-600">Vence amanhã</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Relatório mensal</p>
                <p className="text-xs text-blue-600">Em 3 dias</p>
              </div>
            </div>
            
            <Link to="/tasks">
              <Button variant="outline" className="w-full" size="sm">
                Ver todas as tarefas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
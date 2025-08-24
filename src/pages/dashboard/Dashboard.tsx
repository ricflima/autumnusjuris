// src/pages/dashboard/Dashboard.tsx - ATUALIZADO PARA FASE 3
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { casesService } from '@/services/cases.service';
import { clientsService } from '@/services/clients.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/common/LoadingScreen';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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

  // Calcular estatísticas
  const stats = {
    totalCases: allCasesData?.total || 0,
    activeCases: allCasesData?.cases.filter(c => ['active', 'in_court'].includes(c.status)).length || 0,
    totalClients: allClientsData?.total || 0,
    activeClients: allClientsData?.clients.filter(c => c.status === 'active').length || 0,
    prospects: allClientsData?.clients.filter(c => c.status === 'prospect').length || 0,
    revenue: allClientsData?.clients.reduce((sum, c) => sum + c.totalBilled, 0) || 0,
    pendingTasks: 12, // Será implementado em fases futuras
    upcomingHearings: 8 // Será implementado em fases futuras
  };

  const quickActions = [
    { 
      icon: FileText, 
      label: 'Novo Caso', 
      href: '/cases/new',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Criar um novo caso jurídico'
    },
    { 
      icon: Users, 
      label: 'Novo Cliente', 
      href: '/clients/new',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Cadastrar novo cliente'
    },
    { 
      icon: Calendar, 
      label: 'Agendar', 
      href: '/calendar',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Agendar compromisso'
    },
    { 
      icon: DollarSign, 
      label: 'Financeiro', 
      href: '/financial',
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Ver relatórios financeiros'
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'prospect': 'bg-blue-100 text-blue-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'former': 'bg-yellow-100 text-yellow-800',
      'waiting_documents': 'bg-yellow-100 text-yellow-800',
      'in_court': 'bg-purple-100 text-purple-800',
      'concluded': 'bg-emerald-100 text-emerald-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
        
        {/* Barra de pesquisa global */}
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

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              {formatCurrency(stats.revenue)}
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
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link key={action.href} to={action.href}>
                  <div className="group p-6 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-full ${action.color} text-white transition-colors`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.label}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grid principal com duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Casos recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Casos Recentes
              </CardTitle>
              <Link to="/cases">
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!casesData ? (
              <div className="text-center py-4">
                <LoadingSpinner message="Carregando casos..." />
              </div>
            ) : casesData.cases.length > 0 ? (
              <div className="space-y-4">
                {casesData.cases.map((case_) => (
                  <Link key={case_.id} to={`/cases/${case_.id}`}>
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {case_.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)} ml-2 whitespace-nowrap`}>
                          {casesService.getStatusLabel(case_.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="flex items-center gap-1">
                            {case_.clientType === 'company' ? (
                              <Building className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            <span className="font-medium">{case_.clientName}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Atualizado: {formatDate(case_.lastUpdate)}</span>
                          <span className={`font-medium ${casesService.getPriorityColor(case_.priority)}`}>
                            {casesService.getPriorityLabel(case_.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum caso encontrado</p>
                <Link to="/cases/new" className="text-blue-600 hover:underline text-sm">
                  Criar primeiro caso
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clientes recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Clientes Recentes
              </CardTitle>
              <Link to="/clients">
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!clientsData ? (
              <div className="text-center py-4">
                <LoadingSpinner message="Carregando clientes..." />
              </div>
            ) : clientsData.clients.length > 0 ? (
              <div className="space-y-4">
                {clientsData.clients.map((client) => (
                  <Link key={client.id} to={`/clients/${client.id}`}>
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {client.type === 'company' ? (
                            <Building className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {client.name}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${clientsService.getStatusColor(client.status)} ml-2 whitespace-nowrap`}>
                              {clientsService.getStatusLabel(client.status)}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <p>{client.email}</p>
                            <div className="flex items-center justify-between">
                              <span>{client.address.city}, {client.address.state}</span>
                              <span className="font-medium text-green-600">
                                {client.activeCases} casos ativos
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum cliente encontrado</p>
                <Link to="/clients/new" className="text-green-600 hover:underline text-sm">
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
            
            <Button variant="outline" className="w-full" size="sm">
              Ver todas as tarefas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
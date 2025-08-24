// src/pages/clients/ClientsList.tsx - CORRIGIDO
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone,
  Mail,
  MapPin,
  User,
  Building,
  AlertCircle,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { clientsService, type ClientFilters, type ClientStatus, type ClientClassification } from '@/services/clients.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import toast from 'react-hot-toast';

export default function ClientsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ClientFilters>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Query para buscar clientes
  const { 
    data: clientsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientsService.getClients(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Aplicar filtros
  const handleSearch = () => {
    setFilters(prev => ({ 
      ...prev, 
      search: searchTerm, 
      page: 1 
    }));
  };

  const handleFilterChange = (key: keyof ClientFilters, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value, 
      page: 1 
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja deletar o cliente "${clientName}"? Esta ação não pode ser desfeita.`)) {
      toast.promise(
        clientsService.deleteClient(clientId),
        {
          loading: 'Deletando cliente...',
          success: 'Cliente deletado com sucesso!',
          error: 'Erro ao deletar cliente',
        }
      ).then(() => refetch());
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar clientes</h3>
        <p className="text-gray-500 mb-4">Não foi possível carregar a lista de clientes.</p>
        <Button onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            {clientsData ? `${clientsData.total} clientes encontrados` : 'Carregando...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          
          <Link to="/clients/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumo estatístico */}
      {clientsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Clientes</p>
                  <p className="text-2xl font-bold text-blue-600">{clientsData.total}</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {clientsData.clients.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prospects</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {clientsData.clients.filter(c => c.status === 'prospect').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faturamento Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(clientsData.clients.reduce((sum, c) => sum + c.totalBilled, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barra de pesquisa e filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Pesquisa */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Pesquisar por nome, email, documento, cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                Pesquisar
              </Button>
            </div>
            
            {/* Ordenação */}
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="name">Nome</option>
                <option value="createdAt">Data de cadastro</option>
                <option value="lastContact">Último contato</option>
                <option value="totalCases">Total de casos</option>
                <option value="totalBilled">Faturamento</option>
              </select>
              
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Filtro de Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    multiple
                    value={filters.status || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value) as ClientStatus[];
                      handleFilterChange('status', values);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    size={4}
                  >
                    <option value="active">Ativo</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inativo</option>
                    <option value="former">Ex-cliente</option>
                  </select>
                </div>

                {/* Filtro de Classificação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classificação
                  </label>
                  <select
                    multiple
                    value={filters.classification || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value) as ClientClassification[];
                      handleFilterChange('classification', values);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    size={4}
                  >
                    <option value="vip">VIP</option>
                    <option value="premium">Premium</option>
                    <option value="standard">Padrão</option>
                    <option value="basic">Básico</option>
                  </select>
                </div>

                {/* Filtro de Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    multiple
                    value={filters.type || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value) as ('individual' | 'company')[];
                      handleFilterChange('type', values);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    size={2}
                  >
                    <option value="individual">Pessoa Física</option>
                    <option value="company">Pessoa Jurídica</option>
                  </select>
                </div>

                {/* Botões de filtro */}
                <div className="flex flex-col justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        page: 1,
                        limit: 10,
                        sortBy: 'name',
                        sortOrder: 'asc'
                      });
                      setSearchTerm('');
                    }}
                    className="text-sm"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      {isLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" message="Carregando clientes..." />
        </div>
      ) : (
        <div className="space-y-4">
          {clientsData?.clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Conteúdo principal */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Avatar e info básica */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {client.type === 'company' ? (
                            <Building className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>
                      
                      {/* Informações do cliente */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {client.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${clientsService.getStatusColor(client.status)}`}>
                            {clientsService.getStatusLabel(client.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${clientsService.getClassificationColor(client.classification)}`}>
                            {clientsService.getClassificationLabel(client.classification)}
                          </span>
                        </div>
                        
                        {/* Informações de contato */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{client.email}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{clientsService.formatPhone(client.phone)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{clientsService.formatDocument(client.document, client.documentType)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{client.address.city}, {client.address.state}</span>
                          </div>
                        </div>
                        
                        {/* Informações de negócio */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-blue-600 font-medium">Casos Ativos</p>
                            <p className="text-blue-800 font-semibold">{client.activeCases}</p>
                          </div>
                          
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-green-600 font-medium">Total de Casos</p>
                            <p className="text-green-800 font-semibold">{client.totalCases}</p>
                          </div>
                          
                          <div className="bg-purple-50 p-2 rounded">
                            <p className="text-purple-600 font-medium">Faturamento</p>
                            <p className="text-purple-800 font-semibold">{formatCurrency(client.totalBilled)}</p>
                          </div>
                          
                          <div className="bg-yellow-50 p-2 rounded">
                            <p className="text-yellow-600 font-medium">Último Contato</p>
                            <p className="text-yellow-800 font-semibold">
                              {client.lastContact ? formatDate(client.lastContact) : 'Nunca'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Informações adicionais */}
                        {client.type === 'individual' && client.profession && (
                          <div className="mt-3 text-sm text-gray-500">
                            <span>Profissão: {client.profession}</span>
                            {client.maritalStatus && <span> • Estado Civil: {client.maritalStatus}</span>}
                          </div>
                        )}
                        
                        {client.type === 'company' && client.contactPerson && (
                          <div className="mt-3 text-sm text-gray-500">
                            <span>Contato: {client.contactPerson}</span>
                          </div>
                        )}
                        
                        {/* Notas */}
                        {client.notes && (
                          <div className="mt-3 p-2 bg-gray-50 border-l-4 border-gray-400 rounded text-sm text-gray-700">
                            <p className="line-clamp-2">{client.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </Link>
                    
                    <Link to={`/clients/${client.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </Button>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {clientsData && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Mostrando {((clientsData.page - 1) * clientsData.limit) + 1} até {Math.min(clientsData.page * clientsData.limit, clientsData.total)} de {clientsData.total} clientes
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(clientsData.page - 1)}
              disabled={clientsData.page === 1}
            >
              Anterior
            </Button>
            
            <span className="px-3 py-1 bg-slate-900 text-white rounded text-sm">
              {clientsData.page}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(clientsData.page + 1)}
              disabled={!clientsData.hasMore}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
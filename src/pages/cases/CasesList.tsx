// src/pages/cases/CasesList.tsx
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
  Calendar,
  User,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { casesService, type CaseFilters, type CasePriority, type CaseStatus } from '@/services/cases.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function CasesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CaseFilters>({
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Query para buscar casos
  const { 
    data: casesData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['cases', filters],
    queryFn: () => casesService.getCases(filters),
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

  const handleFilterChange = (key: keyof CaseFilters, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value, 
      page: 1 
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar casos</h3>
        <p className="text-gray-500 mb-4">Não foi possível carregar a lista de casos.</p>
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
            Casos Jurídicos
          </h1>
          <p className="text-gray-600 mt-1">
            {casesData ? `${casesData.total} casos encontrados` : 'Carregando...'}
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
          
          <Link to="/cases/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Caso
            </Button>
          </Link>
        </div>
      </div>

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
                  placeholder="Pesquisar por título, cliente, número do processo..."
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
                <option value="updatedAt">Última atualização</option>
                <option value="createdAt">Data de criação</option>
                <option value="title">Título</option>
                <option value="priority">Prioridade</option>
                <option value="status">Status</option>
              </select>
              
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>

          {/* Filtros expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro de Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    multiple
                    value={filters.status || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value) as CaseStatus[];
                      handleFilterChange('status', values);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    size={4}
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Em andamento</option>
                    <option value="waiting_documents">Aguardando documentos</option>
                    <option value="in_court">Em tribunal</option>
                    <option value="appealing">Em recurso</option>
                    <option value="concluded">Concluído</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>

                {/* Filtro de Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <select
                    multiple
                    value={filters.priority || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value) as CasePriority[];
                      handleFilterChange('priority', values);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    size={4}
                  >
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
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
                        sortBy: 'updatedAt',
                        sortOrder: 'desc'
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

      {/* Lista de casos */}
      {isLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" message="Carregando casos..." />
        </div>
      ) : (
        <div className="space-y-4">
          {casesData?.cases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Conteúdo principal */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Informações básicas */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {case_.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${casesService.getStatusColor(case_.status)}`}>
                            {casesService.getStatusLabel(case_.status)}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {case_.description}
                        </p>
                        
                        {/* Metadados */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Cliente: <span className="font-medium">{case_.clientName}</span></span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Atualizado: {formatDate(case_.lastUpdate)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <AlertCircle className={`w-4 h-4 ${casesService.getPriorityColor(case_.priority)}`} />
                            <span className={casesService.getPriorityColor(case_.priority)}>
                              {casesService.getPriorityLabel(case_.priority)} prioridade
                            </span>
                          </div>
                        </div>
                        
                        {/* Informações adicionais */}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                          {case_.processNumber && (
                            <span>Processo: {case_.processNumber}</span>
                          )}
                          {case_.court && (
                            <span>Vara: {case_.court}</span>
                          )}
                          {case_.value && (
                            <span>Valor: {formatCurrency(case_.value)}</span>
                          )}
                        </div>
                        
                        {/* Próxima ação */}
                        {case_.nextAction && (
                          <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <p className="text-xs text-blue-700">
                              <strong>Próxima ação:</strong> {case_.nextAction}
                              {case_.nextActionDate && (
                                <span> - {formatDate(case_.nextActionDate)}</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/cases/${case_.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    </Link>
                    
                    <Link to={`/cases/${case_.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar este caso?')) {
                          toast.promise(
                            casesService.deleteCase(case_.id),
                            {
                              loading: 'Deletando caso...',
                              success: 'Caso deletado com sucesso!',
                              error: 'Erro ao deletar caso',
                            }
                          ).then(() => refetch());
                        }
                      }}
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
      {casesData && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Mostrando {((casesData.page - 1) * casesData.limit) + 1} até {Math.min(casesData.page * casesData.limit, casesData.total)} de {casesData.total} casos
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(casesData.page - 1)}
              disabled={casesData.page === 1}
            >
              Anterior
            </Button>
            
            <span className="px-3 py-1 bg-slate-900 text-white rounded text-sm">
              {casesData.page}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(casesData.page + 1)}
              disabled={!casesData.hasMore}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

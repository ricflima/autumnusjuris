// src/pages/processes/ProcessesList.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  FileText, 
  User, 
  Building2,
  Gavel,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { processesService } from '@/services/processes.service';
import { 
  Process, 
  ProcessFilters,
  PROCESS_STATUS_LABELS,
  PROCESS_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS
} from '@/types/processes';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ProcessesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados do filtro
  const [filters, setFilters] = useState<ProcessFilters>({
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: 10,
    sortBy: 'filingDate',
    sortOrder: 'desc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);

  // Query para buscar processos
  const { 
    data: processesData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['processes', filters],
    queryFn: () => processesService.getProcesses(filters),
     placeholderData: (previousData) => previousData,
  });

  // Mutation para deletar processo
  const deleteProcessMutation = useMutation({
    mutationFn: processesService.deleteProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast.success('Processo excluído com sucesso!');
      setSelectedProcesses([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir processo');
    },
  });

  // Atualizar URL quando filtros mudarem
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
    
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (sortBy: ProcessFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteProcess = (processId: string) => {
    if (confirm('Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.')) {
      deleteProcessMutation.mutate(processId);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedProcesses.length === 0) {
      toast.error('Selecione pelo menos um processo');
      return;
    }

    switch (action) {
      case 'delete':
        if (confirm(`Tem certeza que deseja excluir ${selectedProcesses.length} processo(s)? Esta ação não pode ser desfeita.`)) {
          selectedProcesses.forEach(id => deleteProcessMutation.mutate(id));
        }
        break;
      case 'export':
        toast.success('Exportação iniciada. O arquivo será baixado em breve.');
        break;
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
      concluded: 'bg-blue-100 text-blue-800',
      appealed: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar processos</h2>
            <p className="text-gray-600 mb-4">
              {(error as any)?.message || 'Ocorreu um erro inesperado'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Gavel className="h-8 w-8 text-blue-600" />
                Processos Judiciais
              </h1>
              <p className="mt-1 text-gray-600">
                Gerencie todos os processos judiciais do escritório
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              
              <Button
                onClick={() => navigate('/processes/create')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Processo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra de busca e filtros */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por número, título, cliente ou parte contrária..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={filters.sortBy || 'filingDate'}
                  onChange={(e) => handleSort(e.target.value as ProcessFilters['sortBy'])}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="filingDate">Data de Distribuição</option>
                  <option value="title">Título</option>
                  <option value="number">Número</option>
                  <option value="lastMovementDate">Última Movimentação</option>
                  <option value="nextDeadline">Próximo Prazo</option>
                  <option value="priority">Prioridade</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ 
                    ...prev, 
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                  }))}
                  className="px-2"
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Filtros expandidos */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters(prev => ({ ...prev, status: values as any, page: 1 }));
                      }}
                    >
                      {Object.entries(PROCESS_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters(prev => ({ ...prev, type: values as any, page: 1 }));
                      }}
                    >
                      {Object.entries(PROCESS_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      multiple
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters(prev => ({ ...prev, priority: values as any, page: 1 }));
                      }}
                    >
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prazos Vencidos
                    </label>
                    <input
                      type="checkbox"
                      className="mt-2"
                      onChange={(e) => 
                        setFilters(prev => ({ 
                          ...prev, 
                          hasOverdueDeadlines: e.target.checked || undefined,
                          page: 1 
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({
                        search: '',
                        page: 1,
                        limit: 10,
                        sortBy: 'filingDate',
                        sortOrder: 'desc'
                      })}
                      className="w-full"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Ações em lote */}
        {selectedProcesses.length > 0 && (
          <Card className="mb-4">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedProcesses.length} processo(s) selecionado(s)
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('export')}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de processos */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : processesData?.processes?.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum processo encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search || Object.keys(filters).length > 3
                ? 'Nenhum processo corresponde aos filtros aplicados.'
                : 'Comece criando seu primeiro processo judicial.'}
            </p>
            <Button
              onClick={() => navigate('/processes/create')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Processo
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {processesData?.processes.map((process) => (
              <Card key={process.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedProcesses.includes(process.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProcesses(prev => [...prev, process.id]);
                        } else {
                          setSelectedProcesses(prev => prev.filter(id => id !== process.id));
                        }
                      }}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {process.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Processo: {process.number}
                            {process.internalNumber && (
                              <span className="ml-2">
                                • Interno: {process.internalNumber}
                              </span>
                            )}
                          </p>
                          
                          {process.description && (
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {process.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Badge className={getPriorityColor(process.priority)}>
                            {PRIORITY_LABELS[process.priority]}
                          </Badge>
                          <Badge className={getStatusColor(process.status)}>
                            {PROCESS_STATUS_LABELS[process.status]}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{process.court.court}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{process.opposingParty || 'Não informado'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Distribuído em {formatDate(process.filingDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {process.processValue && (
                            <>
                              <FileText className="h-4 w-4" />
                              <span>{formatCurrency(process.processValue.amount)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Informações de prazos */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          {process.nextDeadline && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                Próximo prazo: {formatDate(process.nextDeadline.dueDate)}
                              </span>
                            </div>
                          )}
                          
                          {process.pendingDeadlines > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{process.pendingDeadlines} prazos pendentes</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/processes/${process.id}`)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/processes/${process.id}/edit`)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProcess(process.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Paginação */}
        {processesData && processesData.total > processesData.limit && (
          <Card className="mt-6">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {((processesData.page - 1) * processesData.limit) + 1} a{' '}
                  {Math.min(processesData.page * processesData.limit, processesData.total)} de{' '}
                  {processesData.total} processos
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(processesData.page - 1)}
                    disabled={processesData.page === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(processesData.total / processesData.limit) },
                      (_, i) => i + 1
                    )
                      .filter(page => 
                        page === 1 || 
                        page === Math.ceil(processesData.total / processesData.limit) ||
                        Math.abs(page - processesData.page) <= 2
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] < page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={page === processesData.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(processesData.page + 1)}
                    disabled={!processesData.hasMore}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
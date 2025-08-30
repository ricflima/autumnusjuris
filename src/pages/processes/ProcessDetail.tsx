// src/pages/processes/ProcessDetail.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Building2,
  User,
  DollarSign,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Gavel,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { processesService } from '@/services/processes.service';
import { 
  ProcessDeadline, 
  PROCESS_STATUS_LABELS,
  PROCESS_TYPE_LABELS,
  PROCESS_PHASE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  DEADLINE_TYPE_LABELS
} from '@/types/processes';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';

export default function ProcessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'deadlines' | 'hearings' | 'movements'>('overview');

  // Query para buscar detalhes do processo
  const { 
    data: process, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['process', id],
    queryFn: () => processesService.getProcess(id!),
    enabled: !!id,
  });

  // Query para buscar prazos do processo
  const { data: deadlines } = useQuery({
    queryKey: ['process-deadlines', id],
    queryFn: () => processesService.getProcessDeadlines(id!),
    enabled: !!id,
  });

  // Query para buscar audiências do processo
  const { data: hearings } = useQuery({
    queryKey: ['process-hearings', id],
    queryFn: () => processesService.getProcessHearings(id!),
    enabled: !!id,
  });


  // Mutation para deletar processo
  const deleteProcessMutation = useMutation({
    mutationFn: processesService.deleteProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast.success('Processo excluído com sucesso!');
      navigate('/processes');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir processo');
    },
  });

  const handleDeleteProcess = () => {
    if (confirm('Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.')) {
      deleteProcessMutation.mutate(id!);
    }
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

  const getPhaseColor = (phase: string) => {
    const colors = {
      initial: 'bg-blue-100 text-blue-800',
      instruction: 'bg-orange-100 text-orange-800',
      judgment: 'bg-purple-100 text-purple-800',
      appeal: 'bg-yellow-100 text-yellow-800',
      execution: 'bg-green-100 text-green-800'
    };
    return colors[phase as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDeadlineStatusColor = (deadline: ProcessDeadline) => {
    const now = new Date();
    const dueDate = new Date(deadline.dueDate);
    
    if (deadline.status === 'completed') {
      return 'bg-green-100 text-green-800';
    } else if (deadline.status === 'cancelled') {
      return 'bg-gray-100 text-gray-800';
    } else if (dueDate < now) {
      return 'bg-red-100 text-red-800';
    } else if (dueDate.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !process) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processo não encontrado</h2>
            <p className="text-gray-600 mb-4">
              O processo solicitado não foi encontrado ou você não tem permissão para acessá-lo.
            </p>
            <Button onClick={() => navigate('/processes')}>
              Voltar para Processos
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/processes')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {process.title}
                  </h1>
                  {process.isConfidential && (
                    <Badge className="bg-red-100 text-red-800">
                      Confidencial
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Processo: {process.number}</span>
                  {process.internalNumber && (
                    <span>• Interno: {process.internalNumber}</span>
                  )}
                  <span>• Distribuído em {formatDate(process.filingDate)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/processes/${process.id}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDeleteProcess}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(process.status)}>
                  {PROCESS_STATUS_LABELS[process.status]}
                </Badge>
              </div>
              <Gavel className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fase</p>
                <Badge className={getPhaseColor(process.phase)}>
                  {PROCESS_PHASE_LABELS[process.phase]}
                </Badge>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prazos Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{process.pendingDeadlines}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dias Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{process.daysActive}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Eye },
              { id: 'deadlines', label: 'Prazos', icon: Clock },
              { id: 'hearings', label: 'Audiências', icon: Calendar },
              { id: 'movements', label: 'Movimentações', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'deadlines' && process.pendingDeadlines > 0 && (
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {process.pendingDeadlines}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações Principais */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Básicas */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <p className="mt-1 text-sm text-gray-900">{PROCESS_TYPE_LABELS[process.type]}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                    <Badge className={PRIORITY_COLORS[process.priority]}>
                      {PRIORITY_LABELS[process.priority]}
                    </Badge>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {process.description || 'Nenhuma descrição fornecida'}
                    </p>
                  </div>
                  
                  {process.tags && process.tags.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Tags</label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {process.tags.map(tag => (
                          <Badge key={tag} className="bg-gray-100 text-gray-800">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Tribunal */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Tribunal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tribunal/Vara</label>
                    <p className="mt-1 text-sm text-gray-900">{process.court.court}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comarca/Foro</label>
                    <p className="mt-1 text-sm text-gray-900">{process.court.district}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {process.court.city}, {process.court.state}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Partes Processuais */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Partes Processuais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parte Contrária</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {process.opposingParty || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Advogado Contrário</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {process.opposingLawyer || 'Não informado'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Valores */}
              {process.processValue && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Valores
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Valor da Causa</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(process.processValue.amount)}
                      </p>
                      {process.processValue.description && (
                        <p className="text-sm text-gray-600">{process.processValue.description}</p>
                      )}
                    </div>
                    
                    {process.costs && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Custas Totais</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(process.costs.totalCosts.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Observações */}
              {process.notes && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Observações
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {process.notes}
                  </p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Próximo Prazo */}
              {process.nextDeadline && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Próximo Prazo
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{process.nextDeadline.title}</h4>
                      <p className="text-sm text-gray-600">
                        {DEADLINE_TYPE_LABELS[process.nextDeadline.type]}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vencimento:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(process.nextDeadline.dueDate)}
                      </span>
                    </div>
                    
                    <Badge className={getDeadlineStatusColor(process.nextDeadline)}>
                      {new Date(process.nextDeadline.dueDate) < new Date() ? 'Vencido' : 'Pendente'}
                    </Badge>
                  </div>
                </Card>
              )}

              {/* Datas Importantes */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Datas Importantes
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Distribuição:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(process.filingDate)}
                    </span>
                  </div>
                  
                  {process.citationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Citação:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(process.citationDate)}
                      </span>
                    </div>
                  )}
                  
                  {process.lastMovementDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Última Movimentação:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(process.lastMovementDate)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Criado em:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(process.createdAt)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Movimentações Recentes */}
              {process.recentMovements && process.recentMovements.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Movimentações Recentes
                  </h3>
                  
                  <div className="space-y-3">
                    {process.recentMovements.slice(0, 3).map(movement => (
                      <div key={movement.id} className="border-l-2 border-blue-200 pl-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {movement.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(movement.date)}
                            </p>
                          </div>
                          {movement.official && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Oficial
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('movements')}
                      className="w-full mt-3"
                    >
                      Ver todas as movimentações
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Prazos do Processo</h3>
              <Button
                onClick={() => navigate(`/processes/${process.id}/deadlines/create`)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Prazo
              </Button>
            </div>
            
            {deadlines && deadlines.length > 0 ? (
              <div className="space-y-4">
                {deadlines.map(deadline => (
                  <Card key={deadline.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                          <Badge className={getDeadlineStatusColor(deadline)}>
                            {deadline.status === 'completed' ? 'Cumprido' : 
                             deadline.status === 'cancelled' ? 'Cancelado' :
                             new Date(deadline.dueDate) < new Date() ? 'Vencido' : 'Pendente'}
                          </Badge>
                          <Badge className={PRIORITY_COLORS[deadline.priority]}>
                            {PRIORITY_LABELS[deadline.priority]}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {DEADLINE_TYPE_LABELS[deadline.type]}
                        </p>
                        
                        {deadline.description && (
                          <p className="text-sm text-gray-700 mb-3">
                            {deadline.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Vencimento: {formatDate(deadline.dueDate)}</span>
                          </div>
                          
                          {deadline.completedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Cumprido em {formatDate(deadline.completedAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        {deadline.notes && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            {deadline.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum prazo cadastrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Adicione prazos para acompanhar as datas importantes do processo.
                </p>
                <Button
                  onClick={() => navigate(`/processes/${process.id}/deadlines/create`)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Primeiro Prazo
                </Button>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'hearings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Audiências do Processo</h3>
              <Button
                onClick={() => navigate(`/processes/${process.id}/hearings/create`)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Audiência
              </Button>
            </div>
            
            {hearings && hearings.length > 0 ? (
              <div className="space-y-4">
                {hearings.map(hearing => (
                  <Card key={hearing.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{hearing.title}</h4>
                          <Badge className={
                            hearing.status === 'completed' ? 'bg-green-100 text-green-800' :
                            hearing.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            hearing.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {hearing.status === 'scheduled' ? 'Agendada' :
                             hearing.status === 'completed' ? 'Realizada' :
                             hearing.status === 'cancelled' ? 'Cancelada' : 'Reagendada'}
                          </Badge>
                        </div>
                        
                        {hearing.description && (
                          <p className="text-sm text-gray-700 mb-3">
                            {hearing.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(hearing.date)} às {hearing.time}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{hearing.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{hearing.participants.length} participante(s)</span>
                          </div>
                        </div>
                        
                        {hearing.outcome && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm font-medium text-gray-900 mb-1">Resultado:</p>
                            <p className="text-sm text-gray-700">{hearing.outcome}</p>
                            {hearing.nextSteps && (
                              <>
                                <p className="text-sm font-medium text-gray-900 mb-1 mt-2">Próximos Passos:</p>
                                <p className="text-sm text-gray-700">{hearing.nextSteps}</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma audiência cadastrada
                </h3>
                <Button
                  onClick={() => navigate(`/processes/${process.id}/hearings/create`)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Primeira Audiência
                </Button>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Movimentações do Processo</h3>
              <p className="text-gray-600">
                Funcionalidade de consulta aos tribunais será reimplementada em breve.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
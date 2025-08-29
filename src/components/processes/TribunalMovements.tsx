// src/components/processes/TribunalMovements.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  Settings,
  Play,
  Pause,
  Plus,
  Eye,
  Filter,
  Download,
  Bell,
  BellOff
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';

import {
  TribunalType,
  TribunalOperation,
  MovimentacaoTribunal,
  ConsultaResponse,
  TribunalMonitoringConfig,
  RecurringConfig,
  NotificationConfig,
  TRIBUNAL_NAMES,
  OPERATION_LABELS,
  STATUS_LABELS
} from '@/types/tribunalIntegration';
import { tribunalIntegrationService } from '@/services/tribunalIntegration.service';
import { tribunalSchedulerService } from '@/services/tribunalScheduler.service';
import { useTribunalNotifications } from '@/hooks/useTribunalNotifications';
import { processNumberParserService } from '@/services/processNumberParser.service';
import { formatDateTime } from '@/lib/utils';

interface TribunalMovementsProps {
  processId: string;
  processNumber: string;
  currentMovements?: any[];
}

export default function TribunalMovements({ 
  processId, 
  processNumber, 
  currentMovements = [] 
}: TribunalMovementsProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useTribunalNotifications();
  
  // Identificar tribunal automaticamente baseado no número do processo
  const processInfo = React.useMemo(() => {
    return processNumberParserService.parseProcessNumber(processNumber);
  }, [processNumber]);
  
  // Estados para controle manual (removidos os seletores de tribunal e operação)
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedTribunals, setSelectedTribunals] = useState<TribunalType[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedOperations, setSelectedOperations] = useState<TribunalOperation[]>(['consulta_movimentacoes']);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [monitoringConfig, setMonitoringConfig] = useState<TribunalMonitoringConfig>({
    processId,
    tribunalType: 'tjsp',
    active: false,
    operations: ['consulta_movimentacoes'],
    recurringConfig: {
      interval: 'daily',
      frequency: 1,
      timeOfDay: '09:00'
    },
    notifications: {
      onNewMovement: true,
      onNewAudience: true,
      onNewDeadline: true,
      onError: true,
      email: true,
      whatsapp: false,
      push: true,
      recipients: ['user@email.com']
    },
    errorCount: 0,
    maxErrors: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Query para consultas manuais
  const { 
    data: consultaResults, 
    isLoading: isQuerying, 
    refetch: executeManualQuery,
    error 
  } = useQuery({
    queryKey: ['tribunal-movements', processId, selectedTribunals, selectedOperations, selectAll],
    queryFn: async () => {
      const results: ConsultaResponse[] = [];
      
      // Determinar quais tribunais consultar
      let tribunalsToQuery: TribunalType[];
      
      if (isManualMode) {
        // Modo manual: usar tribunais selecionados
        tribunalsToQuery = selectAll || selectedTribunals.length === tribunaisDisponiveis.length 
          ? tribunaisDisponiveis.map(t => t.id as TribunalType)
          : selectedTribunals;
      } else {
        // Modo automático: usar tribunal identificado pelo número do processo
        if (processInfo.isValid && processInfo.tribunal) {
          tribunalsToQuery = [processInfo.tribunal];
        } else {
          throw new Error('Não foi possível identificar o tribunal automaticamente. Número do processo pode estar inválido.');
        }
      }
      
      // Buscar todas as operações disponíveis em vez de apenas as selecionadas
      const operationsToQuery: TribunalOperation[] = isManualMode ? selectedOperations : [
        'consulta_movimentacoes',
        'consulta_audiencias', 
        'consulta_prazos',
        'consulta_documentos'
      ];
      
      for (const tribunal of tribunalsToQuery) {
        try {
          const response = await tribunalIntegrationService.consultarProcesso(
            processId,
            processNumber,
            tribunal,
            operationsToQuery
          );
          results.push(response);
          
          // Gerar notificações para novas movimentações
          if (response.result?.success && response.result?.hasChanges && response.result?.newMovements) {
            response.result.newMovements.forEach(movement => {
              addNotification(
                processId,
                processNumber,
                tribunal,
                movement,
                movement.oficial ? 'high' : 'medium'
              );
            });
          }
        } catch (error) {
          console.error(`Erro na consulta do tribunal ${tribunal}:`, error);
        }
      }
      
      return results;
    },
    enabled: false // Executar apenas manualmente
  });

  // Query para jobs agendados
  const { data: scheduledJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['scheduled-jobs', processId],
    queryFn: () => {
      const allJobs = tribunalSchedulerService.getScheduledJobs();
      return allJobs.filter(job => job.processId === processId);
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  // Mutation para configurar monitoramento
  const configureMonitoringMutation = useMutation({
    mutationFn: async (config: TribunalMonitoringConfig) => {
      return await tribunalSchedulerService.scheduleMonitoring(config);
    },
    onSuccess: () => {
      toast.success('Monitoramento configurado com sucesso!');
      refetchJobs();
      setShowConfigDialog(false);
    },
    onError: (error) => {
      toast.error('Erro ao configurar monitoramento');
      console.error(error);
    }
  });

  // Mutation para pausar/retomar job
  const toggleJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await tribunalSchedulerService.toggleJobStatus(jobId);
    },
    onSuccess: () => {
      refetchJobs();
      toast.success('Status do monitoramento alterado');
    },
    onError: () => {
      toast.error('Erro ao alterar status do monitoramento');
    }
  });

  // Executar consulta (automática ou manual)
  const handleQuery = () => {
    if (isManualMode && selectedTribunals.length === 0 && !selectAll) {
      toast.error('Selecione pelo menos um tribunal');
      return;
    }
    
    if (!isManualMode && (!processInfo.isValid || !processInfo.tribunal)) {
      toast.error('Não foi possível identificar o tribunal automaticamente. Verifique o número do processo.');
      return;
    }
    
    executeManualQuery();
  };

  // Configurar monitoramento automático
  const handleConfigureMonitoring = () => {
    configureMonitoringMutation.mutate(monitoringConfig);
  };

  // Pausar/retomar job
  const handleToggleJob = (jobId: string) => {
    toggleJobMutation.mutate(jobId);
  };

  // Executar job imediatamente
  const handleExecuteJobNow = async (jobId: string) => {
    try {
      const success = await tribunalSchedulerService.executeJobNow(jobId);
      if (success) {
        toast.success('Consulta executada com sucesso');
        refetchJobs();
      } else {
        toast.error('Erro ao executar consulta');
      }
    } catch (error) {
      toast.error('Erro ao executar consulta');
    }
  };

  // Combinar movimentações locais e do tribunal
  const allMovements = React.useMemo(() => {
    const tribunalMovements: any[] = [];
    
    consultaResults?.forEach(result => {
      if (result.result?.success && result.result?.data?.movimentacoes) {
        result.result.data.movimentacoes.forEach(movement => {
          tribunalMovements.push({
            ...movement,
            tribunal: result.result?.tribunal,
            tribunalName: TRIBUNAL_NAMES[result.result?.tribunal as TribunalType] || result.result?.tribunal,
            source: 'tribunal',
            lastSync: result.result?.timestamp
          });
        });
      }
    });

    // Combinar com movimentações locais
    const localMovements = currentMovements.map(movement => ({
      ...movement,
      source: 'local'
    }));

    // Ordenar por data (mais recente primeiro)
    return [...tribunalMovements, ...localMovements].sort((a, b) => 
      new Date(b.data || b.date).getTime() - new Date(a.data || a.date).getTime()
    );
  }, [consultaResults, currentMovements]);

  const tribunaisDisponiveis = tribunalIntegrationService.getTribunaisDisponiveis();

  // Preparar opções para o multi-select
  const tribunalOptions: MultiSelectOption[] = [
    { label: 'Todos', value: 'todos' },
    ...tribunaisDisponiveis.map(tribunal => ({
      label: tribunal.nome,
      value: tribunal.id
    }))
  ];

  // Função para lidar com seleção de tribunais
  const handleTribunalSelection = (values: string[]) => {
    if (values.includes('todos')) {
      if (!selectAll) {
        // Se "Todos" foi selecionado, selecionar todos os tribunais
        const allTribunals = tribunaisDisponiveis.map(t => t.id);
        setSelectedTribunals(allTribunals);
        setSelectAll(true);
      } else {
        // Se "Todos" foi desmarcado, limpar seleção
        setSelectedTribunals([]);
        setSelectAll(false);
      }
    } else {
      // Seleção normal de tribunais individuais
      const tribunals = values.filter(v => v !== 'todos') as TribunalType[];
      setSelectedTribunals(tribunals);
      setSelectAll(tribunals.length === tribunaisDisponiveis.length);
    }
  };

  // Determinar valores selecionados para o multi-select
  const getSelectedValues = () => {
    if (selectAll || selectedTribunals.length === tribunaisDisponiveis.length) {
      return ['todos'];
    }
    return selectedTribunals;
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Consulta Automática aos Tribunais</h3>
          <div className="flex items-center gap-2">
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurar Monitoramento Automático</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tribunal</label>
                    <Select
                      value={monitoringConfig.tribunalType}
                      onValueChange={(value: TribunalType) =>
                        setMonitoringConfig(prev => ({ ...prev, tribunalType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tribunaisDisponiveis.map(tribunal => (
                          <SelectItem key={tribunal.id} value={tribunal.id}>
                            {tribunal.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Frequência</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        value={monitoringConfig.recurringConfig.interval}
                        onValueChange={(value: any) =>
                          setMonitoringConfig(prev => ({
                            ...prev,
                            recurringConfig: { ...prev.recurringConfig, interval: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">A cada hora</SelectItem>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <input
                        type="number"
                        value={monitoringConfig.recurringConfig.frequency}
                        onChange={(e) =>
                          setMonitoringConfig(prev => ({
                            ...prev,
                            recurringConfig: { 
                              ...prev.recurringConfig, 
                              frequency: parseInt(e.target.value) || 1 
                            }
                          }))
                        }
                        className="px-3 py-2 border rounded-md"
                        min="1"
                        max="24"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <Switch
                          checked={monitoringConfig.notifications.onNewMovement}
                          onCheckedChange={(checked) =>
                            setMonitoringConfig(prev => ({
                              ...prev,
                              notifications: { 
                                ...prev.notifications, 
                                onNewMovement: checked 
                              }
                            }))
                          }
                        />
                        <span className="text-sm">Notificar novas movimentações</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2">
                        <Switch
                          checked={monitoringConfig.notifications.push}
                          onCheckedChange={(checked) =>
                            setMonitoringConfig(prev => ({
                              ...prev,
                              notifications: { 
                                ...prev.notifications, 
                                push: checked 
                              }
                            }))
                          }
                        />
                        <span className="text-sm">Notificações push</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowConfigDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleConfigureMonitoring}
                      disabled={configureMonitoringMutation.isPending}
                    >
                      {configureMonitoringMutation.isPending ? 'Configurando...' : 'Configurar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Informações do processo e modo de consulta */}
        <div className="mb-4 space-y-4">
          {/* Informações automáticas do processo */}
          {processInfo.isValid && processInfo.tribunal ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900 mb-1">
                    Tribunal identificado automaticamente
                  </h4>
                  <p className="text-sm text-green-800">
                    <strong>{processInfo.tribunalName}</strong>
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Segmento: {processInfo.segment} • Ano: {processInfo.year}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    O sistema consultará automaticamente todas as operações disponíveis neste tribunal.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-orange-900 mb-1">
                    Tribunal não identificado automaticamente
                  </h4>
                  <p className="text-sm text-orange-800">
                    Número do processo: <code className="bg-white px-1 py-0.5 rounded">{processNumber}</code>
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Use o modo manual para selecionar tribunais específicos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alternar entre modo automático e manual */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isManualMode}
                onCheckedChange={setIsManualMode}
              />
              <label htmlFor="manual-mode" className="text-sm font-medium">
                Modo manual {isManualMode ? '(ativado)' : '(desativado)'}
              </label>
            </div>
            
            {isManualMode && (
              <Badge className="bg-blue-100 text-blue-800">
                Configuração manual
              </Badge>
            )}
          </div>

          {/* Seleção manual de tribunais e operações */}
          {isManualMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="block text-sm font-medium mb-2">Tribunais</label>
                <MultiSelect
                  options={tribunalOptions}
                  value={getSelectedValues()}
                  onChange={handleTribunalSelection}
                  placeholder="Selecione os tribunais..."
                  maxCount={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Operações</label>
                <Select
                  value={selectedOperations[0]}
                  onValueChange={(value: TribunalOperation) => setSelectedOperations([value])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleQuery}
          disabled={isQuerying || (!isManualMode && !processInfo.tribunal)}
          className="w-full"
        >
          {isQuerying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Consultando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {isManualMode ? 'Consultar Tribunais Selecionados' : `Consultar ${processInfo.tribunalName || 'Tribunal'}`}
            </>
          )}
        </Button>
      </Card>

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements">
            Movimentações ({allMovements.length})
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            Monitoramento ({scheduledJobs?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          {/* Status da última consulta */}
          {consultaResults && consultaResults.length > 0 && (
            <Card className="p-4 bg-blue-50">
              <h4 className="font-medium mb-2">Última Consulta</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {consultaResults.map(result => (
                  <div key={result.consulta.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {TRIBUNAL_NAMES[result.consulta.tribunalType]}
                      </p>
                      <p className="text-xs text-gray-600">
                        {result.result?.success ? 'Sucesso' : 'Falhou'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        result.result?.success 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {result.result?.hasChanges ? 'Novidades' : 'Sem alterações'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Lista de movimentações */}
          <div className="space-y-4">
            {allMovements.length > 0 ? (
              allMovements.map((movement, index) => (
                <Card key={`${movement.id}-${index}`} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          movement.oficial || movement.official ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="text-sm text-gray-600">
                          {formatDateTime(movement.data || movement.date)}
                        </span>
                        {movement.source === 'tribunal' && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {movement.tribunalName}
                          </Badge>
                        )}
                        {(movement.oficial || movement.official) && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Oficial
                          </Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-1">
                        {movement.titulo || movement.description}
                      </h4>
                      
                      <p className="text-gray-700 text-sm">
                        {movement.descricao || movement.description}
                      </p>
                      
                      {movement.complemento && (
                        <p className="text-gray-600 text-sm mt-1">
                          {movement.complemento}
                        </p>
                      )}

                      {movement.source === 'tribunal' && movement.lastSync && (
                        <p className="text-xs text-gray-500 mt-2">
                          Sincronizado em: {formatDateTime(movement.lastSync)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {movement.source === 'tribunal' && (
                        <Building2 className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma movimentação encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  Execute uma consulta aos tribunais para buscar movimentações.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {scheduledJobs && scheduledJobs.length > 0 ? (
            <div className="space-y-4">
              {scheduledJobs.map(job => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{job.tribunalName}</h4>
                        <Badge className={
                          job.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {job.active ? 'Ativo' : 'Pausado'}
                        </Badge>
                        {job.errorCount > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {job.errorCount} erros
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Próxima execução:</span>
                          <br />
                          {formatDateTime(job.nextExecution)}
                        </div>
                        
                        {job.lastExecution && (
                          <div>
                            <span className="font-medium">Última execução:</span>
                            <br />
                            {formatDateTime(job.lastExecution)}
                          </div>
                        )}
                        
                        {job.lastResult && (
                          <div>
                            <span className="font-medium">Resultado:</span>
                            <br />
                            <Badge className={
                              job.lastResult === 'success' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }>
                              {job.lastResult}
                            </Badge>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium">Operações:</span>
                          <br />
                          {job.operations.map(op => OPERATION_LABELS[op]).join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteJobNow(job.id)}
                        disabled={!job.active}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleJob(job.id)}
                        disabled={toggleJobMutation.isPending}
                      >
                        {job.active ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
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
                Nenhum monitoramento configurado
              </h3>
              <p className="text-gray-600 mb-4">
                Configure o monitoramento automático para receber atualizações dos tribunais.
              </p>
              <Button onClick={() => setShowConfigDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Configurar Monitoramento
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
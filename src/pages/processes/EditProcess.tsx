import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Save, AlertCircle, Building2, Calendar, 
  DollarSign, Users, MapPin, FileText, Clock, Tag
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { processesService } from '@/services/processes.service';
import { casesService } from '@/services/cases.service';
import { clientsService } from '@/services/clients.service';
import { Process, UpdateProcessRequest } from '@/types/processes';
import { updateProcessSchema, UpdateProcessFormData } from '@/schemas/processes.schema';

const PROCESS_TYPES = [
  { value: 'civil', label: 'Cível' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'labor', label: 'Trabalhista' },
  { value: 'administrative', label: 'Administrativo' },
  { value: 'tax', label: 'Tributário' },
  { value: 'family', label: 'Família' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'consumer', label: 'Consumidor' },
  { value: 'environmental', label: 'Ambiental' },
  { value: 'constitutional', label: 'Constitucional' },
] as const;

const PROCESS_PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },  
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const;

const PROCESS_STATUS = [
  { value: 'active', label: 'Ativo' },
  { value: 'suspended', label: 'Suspenso' },
  { value: 'archived', label: 'Arquivado' },
  { value: 'concluded', label: 'Concluído' },
  { value: 'appealed', label: 'Em recurso' },
] as const;

const PROCESS_PHASES = [
  { value: 'initial', label: 'Inicial' },
  { value: 'investigation', label: 'Instrução' },
  { value: 'decision', label: 'Decisão' },
  { value: 'appeal', label: 'Recurso' },
  { value: 'execution', label: 'Execução' },
  { value: 'final', label: 'Final' },
] as const;

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function EditProcess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar dados do processo
  const { data: process, isLoading, isError, error } = useQuery({
    queryKey: ['process', id],
    queryFn: () => processesService.getProcess(id!),
    enabled: !!id,
  });

  // Buscar casos para dropdown
  const { data: casesData } = useQuery({
    queryKey: ['cases'],
    queryFn: () => casesService.getCases({ limit: 100 }),
  });

  // Buscar clientes para dropdown
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getClients({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty },
  } = useForm<UpdateProcessFormData>({
    resolver: zodResolver(updateProcessSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'civil',
      status: 'active',
      phase: 'initial',
      priority: 'medium',
      court: '',
      district: '',
      city: '',
      state: 'SP',
      country: 'Brasil',
      isConfidential: false,
    },
    mode: 'onChange',
  });

  // Atualizar valores do formulário quando os dados chegarem
  React.useEffect(() => {
    if (process) {
      setValue('number', process.number);
      setValue('internalNumber', process.internalNumber || '');
      setValue('title', process.title);
      setValue('description', process.description || '');
      setValue('type', process.type);
      setValue('status', process.status);
      setValue('phase', process.phase);
      setValue('priority', process.priority);
      setValue('caseId', process.caseId || '');
      setValue('clientIds', process.clientIds || []);
      setValue('responsibleLawyerId', process.responsibleLawyerId);
      setValue('court', process.court.court);
      setValue('district', process.court.district || '');
      setValue('city', process.court.city || '');
      setValue('state', process.court.state || 'SP');
      setValue('country', process.court.country || 'Brasil');
      setValue('opposingParty', process.opposingParty || '');
      setValue('opposingLawyer', process.opposingLawyer || '');
      setValue('processValue', process.processValue ? 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.processValue.amount) : '');
      setValue('processValueDescription', process.processValue?.description || '');
      setValue('filingDate', process.filingDate.split('T')[0]);
      setValue('citationDate', process.citationDate ? process.citationDate.split('T')[0] : '');
      setValue('notes', process.notes || '');
      setValue('tags', process.tags?.join(', ') || '');
      setValue('isConfidential', process.isConfidential);
    }
  }, [process, setValue]);

  const watchCaseId = watch('caseId');
  const watchClientIds = watch('clientIds');

  // Atualizar clientes quando caso é selecionado
  React.useEffect(() => {
    if (watchCaseId && casesData) {
      const selectedCase = casesData.cases.find(c => c.id === watchCaseId);
      if (selectedCase?.clientId && !watchClientIds?.includes(selectedCase.clientId)) {
        setValue('clientIds', [...(watchClientIds || []), selectedCase.clientId]);
      }
    }
  }, [watchCaseId, casesData, watchClientIds, setValue]);

  // Mutation para atualizar processo
  const updateProcessMutation = useMutation({
    mutationFn: (data: UpdateProcessRequest) => processesService.updateProcess(id!, data),
    onSuccess: (updatedProcess) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.setQueryData(['process', id], updatedProcess);
      
      toast.success('Processo atualizado com sucesso!');
      
      navigate(`/processes/${id}`);
    },
    onError: (error: any) => {
      const message = error.message || 'Erro ao atualizar processo. Tente novamente.';
      toast.error(message);
    },
  });

  const onSubmit = async (data: UpdateProcessFormData) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      // Validação extra para processValue
      let processValueObj: { amount: number; description?: string } | undefined = undefined;
      if (data.processValue) {
        const numeric = parseFloat(
          data.processValue.replace(/[^\d,]/g, '').replace(',', '.')
        );
        if (!isNaN(numeric)) {
          processValueObj = {
            amount: numeric,
            description: data.processValueDescription,
          };
        }
      }

      const requestData: UpdateProcessRequest = {
        number: data.number,
        internalNumber: data.internalNumber,
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status,
        phase: data.phase,
        priority: data.priority,
        caseId: data.caseId,
        clientIds: data.clientIds,
        responsibleLawyerId: data.responsibleLawyerId,
        court: {
          court: data.court || '',
          district: data.district || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
        },
        opposingParty: data.opposingParty,
        opposingLawyer: data.opposingLawyer,
        processValue: processValueObj,
        filingDate: data.filingDate ? data.filingDate + 'T10:00:00Z' : undefined,
        citationDate: data.citationDate ? data.citationDate + 'T10:00:00Z' : undefined,
        notes: data.notes,
        tags: data.tags
          ? data.tags
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean)
          : undefined,
        isConfidential: data.isConfidential,
      };
      
      await updateProcessMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm('Tem certeza que deseja cancelar? Todas as alterações serão perdidas.')) {
      return;
    }
    navigate(`/processes/${id}`);
  };

  // Formatação de moeda
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const number = parseInt(value) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(isNaN(number) ? 0 : number);
    setValue('processValue', formatted, { shouldValidate: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError || !process) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processo não encontrado</h2>
            <p className="text-gray-600 mb-4">
              {(error as any)?.message || 'O processo solicitado não foi encontrado ou você não tem permissão para acessá-lo.'}
            </p>
            <Button onClick={() => navigate('/processes')}>
              Voltar para processos
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/processes/${id}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Processo</h1>
                <p className="text-gray-600 mt-1">
                  {process.title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={!isValid || !isDirty || isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Número do Processo *</Label>
                <Input
                  id="number"
                  {...register('number')}
                  placeholder="Ex: 1234567-89.2024.8.26.0001"
                  error={errors.number?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="internalNumber">Número Interno</Label>
                <Input
                  id="internalNumber"
                  {...register('internalNumber')}
                  placeholder="Ex: PROC-2024-001"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="title">Título do Processo *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Ex: Ação de Cobrança - Cliente vs Devedor"
                  error={errors.title?.message}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva os detalhes do processo..."
                />
              </div>
            </div>
          </Card>

          {/* Classificação */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Classificação
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <select
                  id="type"
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="civil">Cível</option>
                  <option value="criminal">Criminal</option>
                  <option value="labor">Trabalhista</option>
                  <option value="administrative">Administrativo</option>
                  <option value="tax">Tributário</option>
                  <option value="family">Família</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PROCESS_STATUS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="phase">Fase *</Label>
                <select
                  id="phase"
                  {...register('phase')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="initial">Inicial</option>
                  <option value="instruction">Instrução</option>
                  <option value="judgment">Julgamento</option>
                  <option value="appeal">Recurso</option>
                  <option value="execution">Execução</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade *</Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PROCESS_PRIORITIES.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Relacionamentos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Relacionamentos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="caseId">Caso Relacionado</Label>
                <select
                  id="caseId"
                  {...register('caseId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um caso</option>
                  {casesData?.cases.map(case_ => (
                    <option key={case_.id} value={case_.id}>
                      {case_.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Clientes Envolvidos</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                  {clientsData?.clients.map(client => (
                    <label key={client.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        value={client.id}
                        {...register('clientIds')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {client.type === 'individual' ? client.name : (client as any).companyName || client.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Informações do Tribunal */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Tribunal/Foro
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="court">Nome do Tribunal/Foro *</Label>
                <Input
                  id="court"
                  {...register('court')}
                  placeholder="Ex: 1ª Vara Cível Central"
                  error={errors.court?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="district">Comarca</Label>
                <Input
                  id="district"
                  {...register('district')}
                  placeholder="Ex: Comarca de São Paulo"
                />
              </div>
              
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Ex: São Paulo"
                />
              </div>
              
              <div>
                <Label htmlFor="state">Estado</Label>
                <select
                  id="state"
                  {...register('state')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {BRAZILIAN_STATES.map(state => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  {...register('country')}
                  value="Brasil"
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          </Card>

          {/* Partes Adversas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Partes Adversas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opposingParty">Parte Contrária</Label>
                <Input
                  id="opposingParty"
                  {...register('opposingParty')}
                  placeholder="Ex: Empresa XYZ Ltda"
                />
              </div>
              
              <div>
                <Label htmlFor="opposingLawyer">Advogado da Parte Contrária</Label>
                <Input
                  id="opposingLawyer"
                  {...register('opposingLawyer')}
                  placeholder="Ex: Dr. João Silva - OAB/SP 123456"
                />
              </div>
            </div>
          </Card>

          {/* Valores */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Valores
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="processValue">Valor da Causa</Label>
                <Input
                  id="processValue"
                  {...register('processValue')}
                  onChange={handleCurrencyChange}
                  placeholder="R$ 0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="processValueDescription">Descrição do Valor</Label>
                <Input
                  id="processValueDescription"
                  {...register('processValueDescription')}
                  placeholder="Ex: Danos materiais e morais"
                />
              </div>
            </div>
          </Card>

          {/* Datas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Datas Importantes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filingDate">Data de Ajuizamento</Label>
                <Input
                  id="filingDate"
                  {...register('filingDate')}
                  type="date"
                />
              </div>
              
              <div>
                <Label htmlFor="citationDate">Data da Citação</Label>
                <Input
                  id="citationDate"
                  {...register('citationDate')}
                  type="date"
                />
              </div>
            </div>
          </Card>

          {/* Observações */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Observações e Configurações
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adicione observações importantes sobre o processo..."
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  {...register('tags')}
                  placeholder="Ex: urgente, cliente-vip, recurso"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isConfidential"
                  {...register('isConfidential')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isConfidential" className="cursor-pointer">
                  Processo confidencial
                </Label>
              </div>
            </div>
          </Card>

          {/* Status atual */}
          {process && (
            <Card className="p-6 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Status do Processo</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Criado em:</span> {new Date(process.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <span className="font-medium">Última atualização:</span> {new Date(process.updatedAt).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <span className="font-medium">Dias ativos:</span> {process.daysActive} dias
                </div>
                {process.pendingDeadlines > 0 && (
                  <div className="text-red-600">
                    <span className="font-medium">Prazos pendentes:</span> {process.pendingDeadlines}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Botões de ação no final */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={!isValid || !isDirty || isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
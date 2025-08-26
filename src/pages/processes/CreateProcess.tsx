// src/pages/processes/CreateProcess.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { ArrowLeft, Save, X, CalendarDays, Building2, User, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { processesService } from '@/services/processes.service';
import { casesService } from '@/services/cases.service';
import { clientsService } from '@/services/clients.service';
import { 
  CreateProcessRequest,
  ProcessType,
  ProcessPriority,
  PROCESS_TYPE_LABELS,
  PRIORITY_LABELS
} from '@/types/processes';

// Schema de validação
const createProcessSchema = z.object({
  number: z.string().min(1, 'Número do processo é obrigatório'),
  internalNumber: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['civil', 'criminal', 'labor', 'tax', 'family', 'administrative']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  caseId: z.string().optional(),
  clientIds: z.array(z.string()).min(1, 'Selecione pelo menos um cliente'),
  responsibleLawyerId: z.string().min(1, 'Advogado responsável é obrigatório'),
  
  // Informações do tribunal
  court: z.string().min(1, 'Nome do tribunal é obrigatório'),
  district: z.string().min(1, 'Comarca/Foro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2, 'Use a sigla do estado'),
  country: z.string().default('Brasil'),
  
  // Partes processuais
  opposingParty: z.string().optional(),
  opposingLawyer: z.string().optional(),
  
  // Valores
  processValue: z.string().optional(),
  processValueDescription: z.string().optional(),
  
  // Datas
  filingDate: z.string().min(1, 'Data de distribuição é obrigatória'),
  citationDate: z.string().optional(),
  
  // Observações
  notes: z.string().optional(),
  tags: z.string().optional(),
  isConfidential: z.boolean().default(false),
});

type CreateProcessFormData = z.infer<typeof createProcessSchema>;

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const LAWYERS = [
  { id: 'lawyer-1', name: 'Dr. João Silva - OAB/SP 123456' },
  { id: 'lawyer-2', name: 'Dra. Maria Santos - OAB/SP 789012' },
  { id: 'lawyer-3', name: 'Dr. Pedro Costa - OAB/SP 345678' },
];

export default function CreateProcess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<CreateProcessFormData>({
    resolver: zodResolver(createProcessSchema),
    defaultValues: {
      type: 'civil',
      priority: 'medium',
      country: 'Brasil',
      state: 'SP',
      isConfidential: false,
      filingDate: new Date().toISOString().split('T')[0],
      clientIds: [],
    },
    mode: 'onChange',
  });

  const watchCaseId = watch('caseId');
  const watchClientIds = watch('clientIds');

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

  // Buscar clientes do caso selecionado
  React.useEffect(() => {
    if (watchCaseId && casesData) {
      const selectedCase = casesData.cases.find(c => c.id === watchCaseId);
      if (selectedCase?.clientId) {
        setValue('clientIds', [selectedCase.clientId]);
      }
    }
  }, [watchCaseId, casesData, setValue]);

  // Mutation para criar processo
  const createProcessMutation = useMutation({
    mutationFn: (data: CreateProcessRequest) => processesService.createProcess(data),
    onSuccess: (newProcess) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });

      toast.success('Processo criado com sucesso!', {
        duration: 4000,
        icon: '⚖️',
      });

      navigate(`/processes/${newProcess.id}`);
    },
    onError: (error: any) => {
      const message = error.message || 'Erro ao criar processo. Tente novamente.';
      toast.error(message, {
        duration: 5000,
        icon: '❌',
      });
    },
  });

  const onSubmit = async (data: CreateProcessFormData) => {
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

      const requestData: CreateProcessRequest = {
        number: data.number,
        internalNumber: data.internalNumber,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        caseId: data.caseId,
        clientIds: data.clientIds,
        responsibleLawyerId: data.responsibleLawyerId,
        court: {
          court: data.court,
          district: data.district,
          city: data.city,
          state: data.state,
          country: data.country,
        },
        opposingParty: data.opposingParty,
        opposingLawyer: data.opposingLawyer,
        processValue: processValueObj,
        filingDate: data.filingDate + 'T10:00:00Z',
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

      await createProcessMutation.mutateAsync(requestData);
    } catch (error: any) {
      toast.error(
        error?.message || 'Erro ao criar processo. Tente novamente.',
        { duration: 5000, icon: '❌' }
      );
      console.error('Erro ao criar processo:', error);
    }
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
      navigate('/processes');
    }
  };

  // Armazenar valor numérico no estado do formulário, exibir formatado
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const number = parseInt(value) / 100;
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(isNaN(number) ? 0 : number);
    setValue('processValue', formatted, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <h1 className="text-2xl font-bold text-gray-900">Novo Processo</h1>
                <p className="mt-1 text-gray-600">
                  Cadastre um novo processo judicial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>

              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={!isValid || createProcessMutation.isPending}
                className="flex items-center gap-2"
              >
                {createProcessMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Criar Processo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações básicas */}
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
                  placeholder="Descrição detalhada do objeto do processo..."
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo de Processo *</Label>
                <select
                  id="type"
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PROCESS_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade *</Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Relacionamentos */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Relacionamentos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="caseId">Caso Relacionado</Label>
                <select
                  id="caseId"
                  {...register('caseId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um caso (opcional)</option>
                  {casesData?.cases.map(case_ => (
                    <option key={case_.id} value={case_.id}>
                      {case_.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="responsibleLawyerId">Advogado Responsável *</Label>
                <select
                  id="responsibleLawyerId"
                  {...register('responsibleLawyerId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o advogado</option>
                  {LAWYERS.map(lawyer => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {lawyer.name}
                    </option>
                  ))}
                </select>
                {errors.responsibleLawyerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.responsibleLawyerId.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Clientes *</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {clientsData?.clients.map(client => (
                    <label key={client.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar cliente ${client.name}`}
                        checked={watchClientIds?.includes(client.id)}
                        onChange={(e) => {
                          let newIds: string[] = [];
                          if (e.target.checked) {
                            newIds = [...(watchClientIds || []), client.id];
                          } else {
                            newIds = (watchClientIds || []).filter(id => id !== client.id);
                          }
                          setValue('clientIds', newIds, { shouldValidate: true });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{client.name}</span>
                    </label>
                  ))}
                </div>
                {errors.clientIds && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientIds.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Informações do Tribunal */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Tribunal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="court">Nome do Tribunal/Vara *</Label>
                <Input
                  id="court"
                  {...register('court')}
                  placeholder="Ex: 1ª Vara Cível"
                  error={errors.court?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="district">Comarca/Foro *</Label>
                <Input
                  id="district"
                  {...register('district')}
                  placeholder="Ex: Foro Central"
                  error={errors.district?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Ex: São Paulo"
                  error={errors.city?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="state">Estado *</Label>
                <select
                  id="state"
                  {...register('state')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BRAZILIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Partes Processuais */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Partes Processuais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="opposingParty">Parte Contrária</Label>
                <Input
                  id="opposingParty"
                  {...register('opposingParty')}
                  placeholder="Nome da parte contrária"
                />
              </div>
              
              <div>
                <Label htmlFor="opposingLawyer">Advogado da Parte Contrária</Label>
                <Input
                  id="opposingLawyer"
                  {...register('opposingLawyer')}
                  placeholder="Nome e OAB do advogado contrário"
                />
              </div>
            </div>
          </Card>

          {/* Valores e Datas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Valores e Datas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="processValue">Valor da Causa</Label>
                <Input
                  id="processValue"
                  {...register('processValue')}
                  placeholder="R$ 0,00"
                  onChange={handleCurrencyChange}
                />
              </div>
              
              <div>
                <Label htmlFor="processValueDescription">Descrição do Valor</Label>
                <Input
                  id="processValueDescription"
                  {...register('processValueDescription')}
                  placeholder="Ex: Valor principal + juros"
                />
              </div>
              
              <div>
                <Label htmlFor="filingDate">Data de Distribuição *</Label>
                <Input
                  id="filingDate"
                  type="date"
                  {...register('filingDate')}
                  error={errors.filingDate?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="citationDate">Data da Citação</Label>
                <Input
                  id="citationDate"
                  type="date"
                  {...register('citationDate')}
                />
              </div>
            </div>
          </Card>

          {/* Observações */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Observações
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações, estratégias e anotações importantes sobre o processo..."
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  {...register('tags')}
                  placeholder="cobrança, urgente, empresarial (separadas por vírgula)"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  id="isConfidential"
                  type="checkbox"
                  {...register('isConfidential')}
                  className="rounded"
                />
                <Label htmlFor="isConfidential" className="text-sm">
                  Processo confidencial
                </Label>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
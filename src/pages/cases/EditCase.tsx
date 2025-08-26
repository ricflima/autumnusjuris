import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Trash2, User, AlertCircle, Calendar, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { casesService } from '@/services/cases.service';
import { Case, UpdateCaseRequest } from '@/services/cases.service';
import { updateCaseSchema, UpdateCaseFormData } from '@/schemas/cases.schema';

const CASE_PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const;

const CASE_STATUS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Em andamento' },
  { value: 'waiting_documents', label: 'Aguardando documentos' },
  { value: 'in_court', label: 'Em tribunal' },
  { value: 'appealing', label: 'Em recurso' },
  { value: 'concluded', label: 'Concluído' },
  { value: 'archived', label: 'Arquivado' },
] as const;

const LEGAL_SUBJECTS = [
  'Direito Civil',
  'Direito do Trabalho',
  'Direito Penal',
  'Direito de Família',
  'Direito Empresarial',
  'Direito do Consumidor',
  'Direito Previdenciário',
  'Direito Tributário',
  'Direito Imobiliário',
  'Direito Ambiental',
];

export default function EditCase() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar dados do caso
  const { data: case_, isLoading, isError, error } = useQuery({
    queryKey: ['case', id],
    queryFn: () => casesService.getCaseById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<UpdateCaseFormData>({
    resolver: zodResolver(updateCaseSchema),
    defaultValues: {
      title: case_?.title || '',
      description: case_?.description || '',
      status: case_?.status || 'draft',
      priority: case_?.priority || 'medium',
      subject: case_?.subject || '',
      court: case_?.court || '',
      processNumber: case_?.processNumber || '',
      value: case_?.value || undefined,
      expectedEndDate: case_?.expectedEndDate ? case_.expectedEndDate.split('T')[0] : '',
      nextAction: case_?.nextAction || '',
      nextActionDate: case_?.nextActionDate ? case_.nextActionDate.split('T')[0] : '',
    },
    mode: 'onChange',
  });

  // Atualizar valores do formulário quando os dados chegarem
  React.useEffect(() => {
    if (case_) {
      setValue('title', case_.title);
      setValue('description', case_.description || '');
      setValue('status', case_.status);
      setValue('priority', case_.priority);
      setValue('subject', case_.subject || '');
      setValue('court', case_.court || '');
      setValue('processNumber', case_.processNumber || '');
      setValue('value', case_.value || undefined);
      setValue('expectedEndDate', case_.expectedEndDate ? case_.expectedEndDate.split('T')[0] : '');
      setValue('nextAction', case_.nextAction || '');
      setValue('nextActionDate', case_.nextActionDate ? case_.nextActionDate.split('T')[0] : '');
    }
  }, [case_, setValue]);

  // Mutation para atualizar caso
  const updateCaseMutation = useMutation({
    mutationFn: (data: UpdateCaseRequest) => casesService.updateCase(id!, data),
    onSuccess: (updatedCase) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.setQueryData(['case', id], updatedCase);
      
      toast.success('Caso atualizado com sucesso!');
      
      navigate(`/cases/${id}`);
    },
    onError: (error: any) => {
      const message = error.message || 'Erro ao atualizar caso. Tente novamente.';
      toast.error(message);
    },
  });

  const onSubmit = async (data: UpdateCaseFormData) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      const requestData: UpdateCaseRequest = {
        ...data,
        value: data.value || undefined,
      };
      
      await updateCaseMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Erro ao atualizar caso:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm('Tem certeza que deseja cancelar? Todas as alterações serão perdidas.')) {
      return;
    }
    navigate(`/cases/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError || !case_) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Caso não encontrado</h2>
            <p className="text-gray-600 mb-4">
              {(error as any)?.message || 'O caso solicitado não foi encontrado ou você não tem permissão para acessá-lo.'}
            </p>
            <Button onClick={() => navigate('/cases')}>
              Voltar para casos
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
                onClick={() => navigate(`/cases/${id}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Caso</h1>
                <p className="text-gray-600 mt-1">
                  {case_.title}
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
              <User className="h-5 w-5 text-blue-600" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Título do Caso *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Ex: Processo Trabalhista - João Silva"
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
                  placeholder="Descreva os detalhes do caso..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CASE_STATUS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="priority">Prioridade *</Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CASE_PRIORITIES.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Informações Legais */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Informações Legais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Área Jurídica</Label>
                <select
                  id="subject"
                  {...register('subject')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione a área</option>
                  {LEGAL_SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="court">Tribunal/Foro</Label>
                <Input
                  id="court"
                  {...register('court')}
                  placeholder="Ex: 1ª Vara Cível de São Paulo"
                />
              </div>
              
              <div>
                <Label htmlFor="processNumber">Número do Processo</Label>
                <Input
                  id="processNumber"
                  {...register('processNumber')}
                  placeholder="Ex: 1234567-89.2024.8.26.0001"
                />
              </div>
              
              <div>
                <Label htmlFor="value">Valor da Causa</Label>
                <Input
                  id="value"
                  {...register('value', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </Card>

          {/* Cronograma */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Cronograma
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expectedEndDate">Data Prevista de Conclusão</Label>
                <Input
                  id="expectedEndDate"
                  {...register('expectedEndDate')}
                  type="date"
                />
              </div>
              
              <div>
                <Label htmlFor="nextActionDate">Data da Próxima Ação</Label>
                <Input
                  id="nextActionDate"
                  {...register('nextActionDate')}
                  type="date"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="nextAction">Próxima Ação</Label>
                <Input
                  id="nextAction"
                  {...register('nextAction')}
                  placeholder="Ex: Protocolar petição inicial"
                />
              </div>
            </div>
          </Card>

          {/* Status atual */}
          {case_ && (
            <Card className="p-6 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Status Atual</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Criado em:</span> {new Date(case_.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div>
                  <span className="font-medium">Última atualização:</span> {new Date(case_.updatedAt).toLocaleDateString('pt-BR')}
                </div>
                {case_.clientId && (
                  <div>
                    <span className="font-medium">Cliente:</span> {case_.clientName || 'N/A'}
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
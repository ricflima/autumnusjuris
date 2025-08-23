// src/pages/cases/CreateCase.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { casesService, type CreateCaseRequest } from '@/services/cases.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

const createCaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  
  clientId: z
    .string()
    .min(1, 'Cliente é obrigatório'),
  
  subject: z
    .string()
    .min(1, 'Área jurídica é obrigatória'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' }),
  }),
  
  processNumber: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      // Validação básica do número do processo (formato CNJ)
      const processRegex = /^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$/;
      return processRegex.test(val);
    }, 'Formato do número do processo inválido (use: 1234567-12.2024.1.23.4567)'),
  
  court: z
    .string()
    .optional(),
  
  value: z
    .number()
    .min(0, 'Valor deve ser positivo')
    .optional(),
  
  expectedEndDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return date > new Date();
    }, 'Data prevista deve ser futura'),
  
  nextAction: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return val.length <= 200;
    }, 'Próxima ação deve ter no máximo 200 caracteres'),
  
  nextActionDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return date >= new Date();
    }, 'Data da próxima ação deve ser atual ou futura'),
});

type CreateCaseFormData = z.infer<typeof createCaseSchema>;

// Mock de clientes para desenvolvimento
const MOCK_CLIENTS = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Santos' },
  { id: '3', name: 'Empresa ABC Ltda' },
  { id: '4', name: 'Pedro Oliveira' },
  { id: '5', name: 'Ana Costa' },
];

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

export default function CreateCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateCaseFormData>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: '',
      description: '',
      clientId: '',
      subject: '',
      priority: 'medium',
      processNumber: '',
      court: '',
      value: undefined,
      expectedEndDate: '',
      nextAction: '',
      nextActionDate: '',
    },
    mode: 'onChange',
  });

  // Mutation para criar caso
  const createCaseMutation = useMutation({
    mutationFn: (data: CreateCaseRequest) => casesService.createCase(data),
    onSuccess: (newCase) => {
      // Invalidar cache de casos
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      
      toast.success('Caso criado com sucesso!', {
        duration: 4000,
        icon: '✅',
      });
      
      // Navegar para o caso criado
      navigate(`/cases/${newCase.id}`);
    },
    onError: (error: any) => {
      const message = error.message || 'Erro ao criar caso. Tente novamente.';
      toast.error(message, {
        duration: 5000,
        icon: '❌',
      });
    },
  });

  const onSubmit = async (data: CreateCaseFormData) => {
    setIsSubmitting(true);
    
    try {
      // Preparar dados para envio
      const requestData: CreateCaseRequest = {
        ...data,
        value: data.value || undefined,
      };
      
      await createCaseMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Erro ao criar caso:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
      navigate('/cases');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/cases')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              Novo Caso Jurídico
            </h1>
            <p className="text-gray-600 mt-1">
              Preencha as informações básicas do novo caso
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
            disabled={!isValid || isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Caso'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="md:col-span-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Título do Caso *
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Ex: Ação Trabalhista - Silva vs Empresa XYZ"
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Cliente */}
              <div>
                <Label htmlFor="clientId" className="text-sm font-medium text-gray-700">
                  Cliente *
                </Label>
                <select
                  id="clientId"
                  {...register('clientId')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Selecione um cliente</option>
                  {MOCK_CLIENTS.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="text-sm text-red-600 mt-1">{errors.clientId.message}</p>
                )}
              </div>

              {/* Área Jurídica */}
              <div>
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Área Jurídica *
                </Label>
                <select
                  id="subject"
                  {...register('subject')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Selecione uma área</option>
                  {LEGAL_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
                )}
              </div>

              {/* Prioridade */}
              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Prioridade *
                </Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
                {errors.priority && (
                  <p className="text-sm text-red-600 mt-1">{errors.priority.message}</p>
                )}
              </div>

              {/* Valor da Causa */}
              <div>
                <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                  Valor da Causa (R$)
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('value', { valueAsNumber: true })}
                  placeholder="0,00"
                  className="mt-1"
                />
                {errors.value && (
                  <p className="text-sm text-red-600 mt-1">{errors.value.message}</p>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Descrição do Caso *
              </Label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                placeholder="Descreva detalhadamente o caso, incluindo fatos relevantes, objetivos e estratégias..."
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-vertical"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Processuais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Processuais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Número do Processo */}
              <div>
                <Label htmlFor="processNumber" className="text-sm font-medium text-gray-700">
                  Número do Processo
                </Label>
                <Input
                  id="processNumber"
                  {...register('processNumber')}
                  placeholder="1234567-12.2024.1.23.4567"
                  className="mt-1"
                />
                {errors.processNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.processNumber.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
                </p>
              </div>

              {/* Vara/Tribunal */}
              <div>
                <Label htmlFor="court" className="text-sm font-medium text-gray-700">
                  Vara/Tribunal
                </Label>
                <Input
                  id="court"
                  {...register('court')}
                  placeholder="Ex: 1ª Vara Cível de São Paulo"
                  className="mt-1"
                />
                {errors.court && (
                  <p className="text-sm text-red-600 mt-1">{errors.court.message}</p>
                )}
              </div>

              {/* Data Prevista de Conclusão */}
              <div>
                <Label htmlFor="expectedEndDate" className="text-sm font-medium text-gray-700">
                  Data Prevista de Conclusão
                </Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  {...register('expectedEndDate')}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
                {errors.expectedEndDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.expectedEndDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Próxima Ação */}
              <div className="md:col-span-1">
                <Label htmlFor="nextAction" className="text-sm font-medium text-gray-700">
                  Próxima Ação
                </Label>
                <Input
                  id="nextAction"
                  {...register('nextAction')}
                  placeholder="Ex: Elaborar contestação, Agendar audiência..."
                  className="mt-1"
                />
                {errors.nextAction && (
                  <p className="text-sm text-red-600 mt-1">{errors.nextAction.message}</p>
                )}
              </div>

              {/* Data da Próxima Ação */}
              <div>
                <Label htmlFor="nextActionDate" className="text-sm font-medium text-gray-700">
                  Data da Próxima Ação
                </Label>
                <Input
                  id="nextActionDate"
                  type="datetime-local"
                  {...register('nextActionDate')}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
                {errors.nextActionDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.nextActionDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação (duplicados no final) */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
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
            disabled={!isValid || isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Salvando...' : 'Criar Caso'}
          </Button>
        </div>
      </form>
    </div>
  );
}

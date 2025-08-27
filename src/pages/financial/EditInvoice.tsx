// src/pages/financial/EditInvoice.tsx - VERSÃO SEGURA
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Save,
  Send,
  User,
  Briefcase,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useInvoice, useUpdateInvoice } from '@/hooks/useFinancial';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { useFinancialFormatters, useFinancialValidation } from '@/hooks/useFinancial';
import { UpdateInvoiceRequest } from '@/types/financial';

// Schema de validação
const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  caseId: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paymentTerms: z.string().min(1, 'Condições de pagamento são obrigatórias'),
  items: z.array(z.object({
    description: z.string().min(1, 'Descrição do item é obrigatória'),
    quantity: z.number().min(1, 'Quantidade deve ser maior que zero'),
    unitPrice: z.number().min(0, 'Preço unitário deve ser positivo'),
  })).min(1, 'Pelo menos um item é obrigatório'),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurrenceEndDate: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const EditInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Early return se não há ID
  if (!id) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/financial/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Fatura</h1>
            <p className="text-red-600">ID da fatura não fornecido</p>
          </div>
        </div>
      </div>
    );
  }

  // Hooks
  const { data: invoice, isLoading: loadingInvoice, error: invoiceError } = useInvoice(id);
  const updateInvoiceMutation = useUpdateInvoice();
  const { formatCurrency } = useFinancialFormatters();
  const { validateDueDate, validateAmount } = useFinancialValidation();
  
  const { data: clientsData } = useClients();
  const { data: casesData } = useCases();

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      isRecurring: false,
      paymentTerms: '30 dias'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  // Watches
  const watchedItems = form.watch('items');
  const watchedClientId = form.watch('clientId');
  const watchedIsRecurring = form.watch('isRecurring');

  // Populate form when invoice loads - VERSÃO SEGURA
  useEffect(() => {
    if (invoice && !invoiceError && !isFormInitialized) {
      try {
        // Filtrar apenas tipos de recorrência válidos
        let validRecurrenceType: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | undefined;
        if (invoice.recurrenceType && ['weekly', 'monthly', 'quarterly', 'yearly'].includes(invoice.recurrenceType)) {
          validRecurrenceType = invoice.recurrenceType as 'weekly' | 'monthly' | 'quarterly' | 'yearly';
        }

        form.reset({
          clientId: invoice.clientId,
          caseId: invoice.caseId || undefined,
          description: invoice.description,
          dueDate: invoice.dueDate.split('T')[0],
          paymentTerms: invoice.paymentTerms,
          items: invoice.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          notes: invoice.notes || '',
          isRecurring: invoice.isRecurring || false,
          recurrenceType: validRecurrenceType,
          recurrenceEndDate: invoice.recurrenceEndDate?.split('T')[0] || ''
        });

        setIsFormInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar formulário:', error);
      }
    }
  }, [invoice, invoiceError, form, isFormInitialized]);

  // Calculate totals
  const subtotal = watchedItems?.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + (quantity * unitPrice);
  }, 0) || 0;

  const total = subtotal;

  // Filter cases for selected client
  const clientCases = casesData?.cases.filter(
    caseItem => caseItem.clientId === watchedClientId
  ) || [];

  // Check if invoice can be edited
  const canEdit = invoice && ['draft', 'sent'].includes(invoice.status);

  const onSubmit = async (data: InvoiceFormData) => {
    if (!id || !canEdit) return;

    try {
      setIsSubmitting(true);

      const invoiceData: Partial<UpdateInvoiceRequest> = {
        clientId: data.clientId,
        caseId: data.caseId || undefined,
        title: data.description,
        description: data.description,
        dueDate: data.dueDate,
        paymentTerms: data.paymentTerms,
        items: data.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        })),
        notes: data.notes,
        isRecurring: data.isRecurring || false,
        recurrenceType: data.recurrenceType,
        recurrenceEndDate: data.recurrenceEndDate
      };

      if (saveAsDraft) {
        invoiceData.status = 'draft';
      }

      await updateInvoiceMutation.mutateAsync({
        id,
        data: invoiceData as UpdateInvoiceRequest
      });
      
      navigate('/financial/invoices');
    } catch (error) {
      // Error é tratado no hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({ description: '', quantity: 1, unitPrice: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Loading states
  if (loadingInvoice || !isFormInitialized) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/financial/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Fatura</h1>
            <p className="text-gray-600">Carregando dados da fatura...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error states
  if (invoiceError || !invoice) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/financial/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Fatura</h1>
            <p className="text-red-600">Fatura não encontrada ou erro ao carregar</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {invoiceError?.message || 'Não foi possível carregar os dados da fatura.'}
          </p>
          <Link to="/financial/invoices">
            <Button>Voltar para Faturas</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if can edit
  if (!canEdit) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/financial/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Fatura</h1>
            <p className="text-amber-600">
              Esta fatura não pode ser editada. Status: {invoice.status}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/financial/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Editar Fatura #{invoice.invoiceNumber}
          </h1>
          <p className="text-gray-600">Atualize os dados da fatura</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  value={form.watch('clientId')}
                  onValueChange={(value) => {
                    form.setValue('clientId', value);
                    form.setValue('caseId', undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente">
                      {form.watch('clientId') && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {clientsData?.clients.find(c => c.id === form.watch('clientId'))?.name}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.clientId && (
                  <p className="text-sm text-red-500">{form.formState.errors.clientId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="caseId">Caso (Opcional)</Label>
                <Select
                  value={form.watch('caseId') || 'none'}
                  onValueChange={(value) => form.setValue('caseId', value === 'none' ? undefined : value)}
                  disabled={!watchedClientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caso">
                      {form.watch('caseId') && form.watch('caseId') !== 'none' && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {clientCases.find(c => c.id === form.watch('caseId'))?.title}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum caso selecionado</SelectItem>
                    {clientCases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {caseItem.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição da Fatura *</Label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Ex: Honorários advocatícios - Janeiro 2024"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="dueDate"
                    type="date"
                    {...form.register('dueDate')}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentTerms">Condições de Pagamento *</Label>
                <Select
                  value={form.watch('paymentTerms')}
                  onValueChange={(value) => form.setValue('paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="À vista">À vista</SelectItem>
                    <SelectItem value="7 dias">7 dias</SelectItem>
                    <SelectItem value="15 dias">15 dias</SelectItem>
                    <SelectItem value="30 dias">30 dias</SelectItem>
                    <SelectItem value="45 dias">45 dias</SelectItem>
                    <SelectItem value="60 dias">60 dias</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.paymentTerms && (
                  <p className="text-sm text-red-500">{form.formState.errors.paymentTerms.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens da Fatura */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Itens da Fatura
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`items.${index}.description`}>Descrição *</Label>
                    <Input
                      {...form.register(`items.${index}.description`)}
                      placeholder="Descrição do serviço"
                    />
                    {form.formState.errors.items?.[index]?.description && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`items.${index}.quantity`}>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {form.formState.errors.items?.[index]?.quantity && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`items.${index}.unitPrice`}>Preço Unitário *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      placeholder="0,00"
                    />
                    {form.formState.errors.items?.[index]?.unitPrice && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items[index]?.unitPrice?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total do item */}
                <div className="text-right">
                  <span className="text-sm text-gray-600">Total do item: </span>
                  <span className="font-semibold">
                    {formatCurrency((field.quantity || 0) * (field.unitPrice || 0))}
                  </span>
                </div>
              </div>
            ))}

            {/* Total geral */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Geral:</span>
                <span className="text-2xl text-green-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recorrência */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Recorrência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                id="isRecurring"
                type="checkbox"
                checked={watchedIsRecurring}
                onChange={(e) => form.setValue('isRecurring', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isRecurring">Esta é uma fatura recorrente</Label>
            </div>

            {watchedIsRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrenceType">Frequência</Label>
                  <Select
                    value={form.watch('recurrenceType') || 'monthly'}
                    onValueChange={(value) => form.setValue('recurrenceType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recurrenceEndDate">Data de Término (Opcional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    {...form.register('recurrenceEndDate')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes">Observações Adicionais</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Digite observações adicionais sobre esta fatura..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Link to="/financial/invoices">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setSaveAsDraft(true)}
            >
              {isSubmitting && saveAsDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mr-2" />
                </>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSaveAsDraft(false)}
            >
              {isSubmitting && !saveAsDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mr-2" />
                </>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Salvar e Enviar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditInvoice;
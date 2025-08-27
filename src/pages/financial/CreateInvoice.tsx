// src/pages/financial/CreateInvoice.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  User,
  Calendar,
  FileText,
  DollarSign,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { 
  useCreateInvoice,
  useFinancialFormatters,
  useFinancialValidation 
} from '@/hooks/useFinancial';
import { useCases } from '@/hooks/useCases';
import { useClients } from '@/hooks/useClients';
import { 
  CreateInvoiceRequest, 
  PAYMENT_METHOD_LABELS,
  RECURRENCE_TYPE_LABELS 
} from '@/types/financial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.coerce.number().min(0.01, 'Quantidade deve ser maior que 0'),
  unitPrice: z.coerce.number().min(0.01, 'Preço unitário deve ser maior que 0'),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  caseId: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paymentTerms: z.string().min(1, 'Condições de pagamento são obrigatórias'),
  items: z.array(invoiceItemSchema).min(1, 'Pelo menos um item é obrigatório'),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurrenceEndDate: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  const createInvoiceMutation = useCreateInvoice();
  const { formatCurrency } = useFinancialFormatters();
  const { validateDueDate, validateAmount } = useFinancialValidation();
  
  const { data: clientsData } = useClients();
  const { data: casesData } = useCases();

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

  const watchedItems = form.watch('items');
  const watchedClientId = form.watch('clientId');
  const watchedIsRecurring = form.watch('isRecurring');

  // Calcular totais
  const subtotal = watchedItems?.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + (quantity * unitPrice);
  }, 0) || 0;

  const total = subtotal; // Por enquanto sem impostos ou descontos

  // Filtrar casos do cliente selecionado
  const clientCases = casesData?.cases.filter(
    caseItem => caseItem.clientId === watchedClientId
  ) || [];

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setIsSubmitting(true);

      const invoiceData: CreateInvoiceRequest = {
        clientId: data.clientId,
        caseId: data.caseId || undefined,
        title: data.description, // Usar descrição como título
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

      const createdInvoice = await createInvoiceMutation.mutateAsync(invoiceData);
      
      // Se não for salvar como rascunho, navegar para a lista
      if (!saveAsDraft) {
        navigate('/financial/invoices');
      } else {
        // Se salvar como rascunho, navegar para visualização
        navigate(`/financial/invoices/${createdInvoice.id}`);
      }
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
          <h1 className="text-3xl font-bold text-gray-900">Nova Fatura</h1>
          <p className="text-gray-600">Crie uma nova fatura para um cliente</p>
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
              {/* Cliente */}
              <div>
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  value={form.watch('clientId') || ''}
                  onValueChange={(value) => {
                    form.setValue('clientId', value);
                    form.setValue('caseId', ''); // Reset case when client changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{client.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.clientId && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.clientId.message}
                  </p>
                )}
              </div>

              {/* Caso (opcional) */}
              <div>
                <Label htmlFor="caseId">Caso (Opcional)</Label>
                <Select
                  value={form.watch('caseId') || ''}
                  onValueChange={(value) => form.setValue('caseId', value)}
                  disabled={!watchedClientId || clientCases.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !watchedClientId 
                        ? "Selecione um cliente primeiro"
                        : clientCases.length === 0 
                        ? "Nenhum caso disponível"
                        : "Selecione um caso"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {clientCases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Ex: Honorários advocatícios - Processo Trabalhista"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register('dueDate')}
                  min={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentTerms">Condições de Pagamento *</Label>
                <Select
                  value={form.watch('paymentTerms') || ''}
                  onValueChange={(value) => form.setValue('paymentTerms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="À vista">À vista</SelectItem>
                    <SelectItem value="15 dias">15 dias</SelectItem>
                    <SelectItem value="30 dias">30 dias</SelectItem>
                    <SelectItem value="45 dias">45 dias</SelectItem>
                    <SelectItem value="60 dias">60 dias</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.paymentTerms && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.paymentTerms.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens da fatura */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Itens da Fatura
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <Label>Descrição *</Label>
                    <Input
                      {...form.register(`items.${index}.description`)}
                      placeholder="Descrição do serviço"
                    />
                    {form.formState.errors.items?.[index]?.description && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.items?.[index]?.quantity && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Preço Unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      placeholder="0,00"
                    />
                    {form.formState.errors.items?.[index]?.unitPrice && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.items[index]?.unitPrice?.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Total</Label>
                    <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                      <span className="font-medium">
                        {formatCurrency(
                          (Number(watchedItems?.[index]?.quantity) || 0) * 
                          (Number(watchedItems?.[index]?.unitPrice) || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {index < fields.length - 1 && <Separator />}
              </div>
            ))}

            {form.formState.errors.items && (
              <p className="text-sm text-red-600">
                {form.formState.errors.items.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Totais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impostos:</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recorrência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Configurações de Recorrência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                {...form.register('isRecurring')}
                className="rounded"
              />
              <Label htmlFor="isRecurring">Esta fatura é recorrente</Label>
            </div>

            {watchedIsRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recurrenceType">Frequência</Label>
                  <Select
                    value={form.watch('recurrenceType') || ''}
                    onValueChange={(value: any) => form.setValue('recurrenceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_TYPE_LABELS)
                        .filter(([key]) => key !== 'none')
                        .map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
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
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Rascunho
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setSaveAsDraft(false)}
            >
              {isSubmitting && !saveAsDraft ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Criar e Enviar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;
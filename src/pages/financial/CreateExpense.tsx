// src/pages/financial/CreateExpense.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  DollarSign,
  Tag,
  Calendar,
  CreditCard,
  Building,
  FileText,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { 
  useCreateExpense,
  useBankAccounts,
  useFinancialValidation 
} from '@/hooks/useFinancial';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { 
  CreateExpenseRequest, 
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  RECURRENCE_TYPE_LABELS
} from '@/types/financial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const expenseSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.enum(['court_fees', 'office_supplies', 'travel', 'professional_services', 'software', 'marketing', 'utilities', 'rent', 'other']),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'check', 'boleto']),
  caseId: z.string().optional(),
  clientId: z.string().optional(),
  supplierName: z.string().optional(),
  isReimbursable: z.boolean().optional(),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  recurrenceEndDate: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const CreateExpense: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createExpenseMutation = useCreateExpense();
  const { validateAmount, validateDate } = useFinancialValidation();
  
  const { data: clientsData } = useClients();
  const { data: casesData } = useCases();
  const { data: bankAccountsData } = useBankAccounts();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      isReimbursable: false,
      isRecurring: false
    }
  });

  const watchedClientId = form.watch('clientId');
  const watchedPaymentMethod = form.watch('paymentMethod');
  const watchedIsRecurring = form.watch('isRecurring');

  // Filtrar casos do cliente selecionado
  const clientCases = casesData?.cases.filter(
    caseItem => watchedClientId && caseItem.clientId === watchedClientId
  ) || [];

  const needsBankAccount = ['bank_transfer', 'pix'].includes(watchedPaymentMethod);

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setIsSubmitting(true);

      const expenseData: CreateExpenseRequest = {
        date: data.date,
        description: data.description,
        category: data.category,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        caseId: data.caseId || undefined,
        clientId: data.clientId || undefined,
        supplierName: data.supplierName || undefined,
        isReimbursable: data.isReimbursable || false,
        bankAccountId: data.bankAccountId || undefined,
        notes: data.notes,
        isRecurring: data.isRecurring || false,
        recurrenceType: data.recurrenceType,
        recurrenceEndDate: data.recurrenceEndDate
      };

      await createExpenseMutation.mutateAsync(expenseData);
      navigate('/financial/expenses');
    } catch (error) {
      // Error é tratado no hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/financial/expenses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Despesa</h1>
          <p className="text-gray-600">Registre uma nova despesa do escritório</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Informações da Despesa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Ex: Material de escritório, Aluguel do escritório"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={form.watch('category') || ''}
                  onValueChange={(value: any) => form.setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...form.register('amount', { valueAsNumber: true })}
                  placeholder="0,00"
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register('date')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento *</Label>
                <Select
                  value={form.watch('paymentMethod') || ''}
                  onValueChange={(value: any) => form.setValue('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.paymentMethod && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.paymentMethod.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="supplierName">Fornecedor (Opcional)</Label>
              <Input
                id="supplierName"
                {...form.register('supplierName')}
                placeholder="Nome do fornecedor ou empresa"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conta bancária (se necessário) */}
        {needsBankAccount && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Conta Bancária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="bankAccountId">Conta Debitada</Label>
                <Select
                  value={form.watch('bankAccountId') || ''}
                  onValueChange={(value) => form.setValue('bankAccountId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta bancária" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccountsData?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-gray-600">
                            {account.bank} - {account.account}
                          </p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Relacionamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Relacionamentos (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientId">Cliente Relacionado</Label>
              <Select
                value={form.watch('clientId') || ''}
                onValueChange={(value) => {
                  form.setValue('clientId', value);
                  form.setValue('caseId', ''); // Reset case when client changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {clientsData?.clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="caseId">Caso Relacionado</Label>
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
                      : "Selecione um caso (opcional)"
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isReimbursable"
                {...form.register('isReimbursable')}
                className="rounded"
              />
              <Label htmlFor="isReimbursable">Esta despesa é reembolsável</Label>
            </div>
          </CardContent>
        </Card>

        {/* Recorrência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
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
              <Label htmlFor="isRecurring">Esta despesa é recorrente</Label>
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
                placeholder="Digite observações sobre esta despesa..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Link to="/financial/expenses">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Registrar Despesa
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateExpense;
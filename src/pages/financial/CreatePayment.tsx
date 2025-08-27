// src/pages/financial/CreatePayment.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  DollarSign,
  User,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  Building
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
  useCreatePayment,
  useInvoices,
  useBankAccounts,
  useFinancialFormatters,
  useFinancialValidation 
} from '@/hooks/useFinancial';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { 
  CreatePaymentRequest, 
  PAYMENT_METHOD_LABELS
} from '@/types/financial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const paymentSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  caseId: z.string().optional(),
  invoiceId: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  paymentDate: z.string().min(1, 'Data do pagamento é obrigatória'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'pix', 'check', 'boleto']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const CreatePayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPaymentMutation = useCreatePayment();
  const { formatCurrency } = useFinancialFormatters();
  const { validateAmount, validateDate, bankAccounts } = useFinancialValidation();
  
  const { data: clientsData } = useClients();
  const { data: casesData } = useCases();
  const { data: invoicesData } = useInvoices({ status: ['sent', 'partial'] });
  const { data: bankAccountsData } = useBankAccounts();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'pix'
    }
  });

  const watchedClientId = form.watch('clientId');
  const watchedInvoiceId = form.watch('invoiceId');
  const watchedPaymentMethod = form.watch('paymentMethod');

  // Pré-preencher com dados da URL (quando vem de uma fatura)
  useEffect(() => {
    const invoiceId = searchParams.get('invoiceId');
    const clientId = searchParams.get('clientId');
    const amount = searchParams.get('amount');

    if (invoiceId) form.setValue('invoiceId', invoiceId);
    if (clientId) form.setValue('clientId', clientId);
    if (amount) form.setValue('amount', parseFloat(amount));
  }, [searchParams, form]);

  // Filtrar dados baseados no cliente selecionado
  const clientCases = casesData?.cases.filter(
    caseItem => caseItem.clientId === watchedClientId
  ) || [];

  const clientInvoices = invoicesData?.invoices.filter(
    invoice => invoice.clientId === watchedClientId
  ) || [];

  const selectedInvoice = clientInvoices.find(
    invoice => invoice.id === watchedInvoiceId
  );

  const selectedClient = clientsData?.clients.find(
    client => client.id === watchedClientId
  );

  const needsBankAccount = ['bank_transfer', 'pix'].includes(watchedPaymentMethod);

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);

      const paymentData: CreatePaymentRequest = {
        clientId: data.clientId,
        caseId: data.caseId || undefined,
        invoiceId: data.invoiceId || undefined,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        description: data.description,
        bankAccountId: data.bankAccountId || undefined,
        notes: data.notes
      };

      await createPaymentMutation.mutateAsync(paymentData);
      navigate('/financial/payments');
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
        <Link to="/financial/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registrar Pagamento</h1>
          <p className="text-gray-600">Registre um novo pagamento recebido</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações do pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Informações do Pagamento
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
                    form.setValue('caseId', ''); // Reset case
                    form.setValue('invoiceId', ''); // Reset invoice
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

              {/* Valor */}
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
              {/* Data do pagamento */}
              <div>
                <Label htmlFor="paymentDate">Data do Pagamento *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  {...form.register('paymentDate')}
                  max={new Date().toISOString().split('T')[0]}
                />
                {form.formState.errors.paymentDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.paymentDate.message}
                  </p>
                )}
              </div>

              {/* Método de pagamento */}
              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento *</Label>
                <Select
                  value={form.watch('paymentMethod') || ''}
                  onValueChange={(value: any) => form.setValue('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Ex: Pagamento da fatura FAT-2024-001"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
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
                <Label htmlFor="bankAccountId">Conta de Destino</Label>
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
            {/* Fatura relacionada */}
            <div>
              <Label htmlFor="invoiceId">Fatura Relacionada</Label>
              <Select
                value={form.watch('invoiceId') || ''}
                onValueChange={(value) => form.setValue('invoiceId', value)}
                disabled={!watchedClientId || clientInvoices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !watchedClientId 
                      ? "Selecione um cliente primeiro"
                      : clientInvoices.length === 0 
                      ? "Nenhuma fatura pendente"
                      : "Selecione uma fatura"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {clientInvoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          {invoice.description} - {formatCurrency(invoice.remainingAmount)} pendente
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Caso relacionado */}
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
          </CardContent>
        </Card>

        {/* Informações da fatura selecionada */}
        {selectedInvoice && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Fatura Selecionada</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Número:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p>
                </div>
                <div>
                  <p><strong>Pendente:</strong> {formatCurrency(selectedInvoice.remainingAmount)}</p>
                  <p><strong>Vencimento:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                placeholder="Digite observações sobre este pagamento..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <Link to="/financial/payments">
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
            Registrar Pagamento
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePayment;
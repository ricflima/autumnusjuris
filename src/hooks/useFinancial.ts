// src/hooks/useFinancial.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { financialService } from '@/services/financial.service';
import { 
  Invoice,
  Payment,
  Expense,
  FinancialSummary,
  CashFlowProjection,
  BankAccount,
  FinancialTransaction,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreatePaymentRequest,
  CreateExpenseRequest,
  FinancialFilters
} from '@/types/financial';

// === QUERY KEYS ===
export const FINANCIAL_KEYS = {
  all: ['financial'] as const,
  invoices: () => [...FINANCIAL_KEYS.all, 'invoices'] as const,
  invoice: (id: string) => [...FINANCIAL_KEYS.invoices(), id] as const,
  payments: () => [...FINANCIAL_KEYS.all, 'payments'] as const,
  payment: (id: string) => [...FINANCIAL_KEYS.payments(), id] as const,
  expenses: () => [...FINANCIAL_KEYS.all, 'expenses'] as const,
  expense: (id: string) => [...FINANCIAL_KEYS.expenses(), id] as const,
  summary: (startDate: string, endDate: string) => [...FINANCIAL_KEYS.all, 'summary', startDate, endDate] as const,
  cashFlow: (startDate: string, endDate: string) => [...FINANCIAL_KEYS.all, 'cashFlow', startDate, endDate] as const,
  bankAccounts: () => [...FINANCIAL_KEYS.all, 'bankAccounts'] as const,
  transactions: () => [...FINANCIAL_KEYS.all, 'transactions'] as const,
};

// === INVOICES HOOKS ===
export function useInvoices(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: [...FINANCIAL_KEYS.invoices(), filters],
    queryFn: () => financialService.getInvoices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: FINANCIAL_KEYS.invoice(id),
    queryFn: () => financialService.getInvoiceById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.message?.includes('não encontrada')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => financialService.createInvoice(data),
    onSuccess: (newInvoice) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.summary('', '') });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.transactions() });
      
      // Adicionar à cache
      queryClient.setQueryData(FINANCIAL_KEYS.invoice(newInvoice.id), newInvoice);
      
      toast.success('Fatura criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar fatura');
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceRequest }) => 
      financialService.updateInvoice(id, data),
    onSuccess: (updatedInvoice) => {
      // Atualizar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.summary('', '') });
      
      // Atualizar cache específica
      queryClient.setQueryData(FINANCIAL_KEYS.invoice(updatedInvoice.id), updatedInvoice);
      
      toast.success('Fatura atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar fatura');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financialService.deleteInvoice(id),
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.summary('', '') });
      
      // Remover da cache
      queryClient.removeQueries({ queryKey: FINANCIAL_KEYS.invoice(deletedId) });
      
      toast.success('Fatura excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir fatura');
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financialService.sendInvoice(id),
    onSuccess: (updatedInvoice) => {
      // Atualizar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.invoices() });
      
      // Atualizar cache específica
      queryClient.setQueryData(FINANCIAL_KEYS.invoice(updatedInvoice.id), updatedInvoice);
      
      toast.success('Fatura enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar fatura');
    },
  });
}

// === PAYMENTS HOOKS ===
export function usePayments(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: [...FINANCIAL_KEYS.payments(), filters],
    queryFn: () => financialService.getPayments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: FINANCIAL_KEYS.payment(id),
    queryFn: () => financialService.getPaymentById(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => financialService.createPayment(data),
    onSuccess: (newPayment) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.payments() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.summary('', '') });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.transactions() });
      
      // Se está vinculado a uma fatura, invalidar a fatura específica
      if (newPayment.invoiceId) {
        queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.invoice(newPayment.invoiceId) });
      }
      
      // Adicionar à cache
      queryClient.setQueryData(FINANCIAL_KEYS.payment(newPayment.id), newPayment);
      
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar pagamento');
    },
  });
}

// === EXPENSES HOOKS ===
export function useExpenses(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: [...FINANCIAL_KEYS.expenses(), filters],
    queryFn: () => financialService.getExpenses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: FINANCIAL_KEYS.expense(id),
    queryFn: () => financialService.getExpenseById(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => financialService.createExpense(data),
    onSuccess: (newExpense) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.expenses() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.summary('', '') });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.transactions() });
      
      // Adicionar à cache
      queryClient.setQueryData(FINANCIAL_KEYS.expense(newExpense.id), newExpense);
      
      toast.success('Despesa registrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar despesa');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseRequest> }) => 
      financialService.updateExpense(id, data),
    onSuccess: (updatedExpense) => {
      // Atualizar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.expenses() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.summary('', '') });
      
      // Atualizar cache específica
      queryClient.setQueryData(FINANCIAL_KEYS.expense(updatedExpense.id), updatedExpense);
      
      toast.success('Despesa atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar despesa');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => financialService.deleteExpense(id),
    onSuccess: (_, deletedId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.expenses() });
      queryClient.invalidateQueries({ queryKey: FINANCIAL_KEYS.summary('', '') });
      
      // Remover da cache
      queryClient.removeQueries({ queryKey: FINANCIAL_KEYS.expense(deletedId) });
      
      toast.success('Despesa excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir despesa');
    },
  });
}

// === SUMMARY AND REPORTS HOOKS ===
export function useFinancialSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: FINANCIAL_KEYS.summary(startDate, endDate),
    queryFn: () => financialService.getFinancialSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCashFlowProjection(startDate: string, endDate: string) {
  return useQuery({
    queryKey: FINANCIAL_KEYS.cashFlow(startDate, endDate),
    queryFn: () => financialService.getCashFlowProjection(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// === BANK ACCOUNTS HOOKS ===
export function useBankAccounts() {
  return useQuery({
    queryKey: FINANCIAL_KEYS.bankAccounts(),
    queryFn: () => financialService.getBankAccounts(),
    staleTime: 30 * 60 * 1000, // 30 minutes - dados mais estáveis
  });
}

// === TRANSACTIONS HOOKS ===
export function useTransactions(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: [...FINANCIAL_KEYS.transactions(), filters],
    queryFn: () => financialService.getTransactions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// === CUSTOM HOOKS FOR COMMON USE CASES ===

/**
 * Hook para obter resumo do dashboard financeiro
 */
export function useFinancialDashboard() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const startDate = `${currentMonth}-01`;
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString().slice(0, 10); // Último dia do mês

  const summary = useFinancialSummary(startDate, endDate);
  const cashFlow = useCashFlowProjection(startDate, endDate);
  const recentTransactions = useTransactions({ 
    limit: 10, 
    sortBy: 'date', 
    sortOrder: 'desc' 
  });

  return {
    summary,
    cashFlow,
    recentTransactions,
    isLoading: summary.isLoading || cashFlow.isLoading || recentTransactions.isLoading,
    error: summary.error || cashFlow.error || recentTransactions.error,
  };
}

/**
 * Hook para obter faturas em atraso
 */
export function useOverdueInvoices() {
  return useInvoices({ 
    status: ['overdue'],
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });
}

/**
 * Hook para obter receitas pendentes
 */
export function usePendingReceivables() {
  return useInvoices({ 
    status: ['sent', 'partial'],
    sortBy: 'dueDate',
    sortOrder: 'asc'
  });
}

/**
 * Hook para obter despesas reembolsáveis
 */
export function useReimbursableExpenses() {
  return useExpenses({
    // Filtro customizado será aplicado no service
    // Por enquanto retornamos todas e filtramos no componente
  });
}

/**
 * Hook personalizado para validação de formulários financeiros
 */
export function useFinancialValidation() {
  const bankAccounts = useBankAccounts();

  const validateAmount = (amount: number): string | null => {
    if (!amount || amount <= 0) {
      return 'Valor deve ser maior que zero';
    }
    if (amount > 999999.99) {
      return 'Valor muito alto';
    }
    return null;
  };

  const validateBankAccount = (accountId: string): string | null => {
    if (!accountId) return null; // Opcional
    
    const account = bankAccounts.data?.find(acc => acc.id === accountId);
    if (!account) {
      return 'Conta bancária inválida';
    }
    if (!account.isActive) {
      return 'Conta bancária inativa';
    }
    return null;
  };

  const validateDate = (date: string): string | null => {
    if (!date) {
      return 'Data é obrigatória';
    }
    
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate > today) {
      return 'Data não pode ser futura';
    }
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    if (inputDate < oneYearAgo) {
      return 'Data não pode ser anterior a 1 ano';
    }
    
    return null;
  };

  const validateDueDate = (dueDate: string, issueDate?: string): string | null => {
    if (!dueDate) {
      return 'Data de vencimento é obrigatória';
    }
    
    if (issueDate) {
      const due = new Date(dueDate);
      const issue = new Date(issueDate);
      
      if (due < issue) {
        return 'Data de vencimento não pode ser anterior à data de emissão';
      }
    }
    
    return null;
  };

  return {
    validateAmount,
    validateBankAccount,
    validateDate,
    validateDueDate,
    bankAccounts: bankAccounts.data || [],
  };
}

/**
 * Hook para calcular estatísticas em tempo real
 */
export function useFinancialStats() {
  const currentYear = new Date().getFullYear();
  const startOfYear = `${currentYear}-01-01`;
  const endOfYear = `${currentYear}-12-31`;
  
  const yearSummary = useFinancialSummary(startOfYear, endOfYear);
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const startOfMonth = `${currentMonth}-01`;
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString().slice(0, 10);
  
  const monthSummary = useFinancialSummary(startOfMonth, endOfMonth);
  
  return {
    year: yearSummary,
    month: monthSummary,
    isLoading: yearSummary.isLoading || monthSummary.isLoading,
    error: yearSummary.error || monthSummary.error,
  };
}

/**
 * Hook para formatação de moeda e números
 */
export function useFinancialFormatters() {
  const formatCurrency = (amount: number, currency: string = 'BRL'): string => {
    return financialService.formatCurrency(amount, currency);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (date: string): string => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const formatDateRelative = (date: string): string => {
    const now = new Date();
    const target = new Date(date);
    const diffInDays = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Amanhã';
    if (diffInDays === -1) return 'Ontem';
    if (diffInDays > 1) return `Em ${diffInDays} dias`;
    if (diffInDays < -1) return `Há ${Math.abs(diffInDays)} dias`;

    return formatDate(date);
  };

  const getStatusColor = (status: string): string => {
    return financialService.getStatusColor(status as any);
  };

  return {
    formatCurrency,
    formatPercentage,
    formatNumber,
    formatDate,
    formatDateRelative,
    getStatusColor,
  };
}
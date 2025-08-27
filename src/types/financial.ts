// src/types/financial.ts

export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'partial' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled';

export type ExpenseCategory = 
  | 'court_fees' 
  | 'office_supplies' 
  | 'travel' 
  | 'professional_services' 
  | 'software' 
  | 'marketing' 
  | 'utilities' 
  | 'rent' 
  | 'other';

export type TransactionType = 
  | 'income' 
  | 'expense' 
  | 'transfer';

export type PaymentMethod = 
  | 'cash' 
  | 'bank_transfer' 
  | 'credit_card' 
  | 'debit_card' 
  | 'pix' 
  | 'check' 
  | 'boleto';

export type RecurrenceType = 
  | 'none' 
  | 'weekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'yearly';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  agency: string;
  account: string;
  accountType: 'checking' | 'savings' | 'business';
  balance: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  address?: Address;
}

export interface Case {
  id: string;
  title: string;
  caseNumber: string;
  clientId: string;
  clientName: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  
  // Numeração e Identificação
  invoiceNumber: string;
  series?: string;
  
  // Relacionamentos
  clientId: string;
  client: Client;
  caseId?: string;
  case?: Case;
  
  // Informações Básicas
  issueDate: string;
  dueDate: string;
  description: string;
  notes?: string;
  
  // Itens e Valores
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Status e Controle
  status: InvoiceStatus;
  sentDate?: string;
  
  // Pagamento
  paymentTerms: string; // Ex: "30 dias", "À vista"
  paymentMethod?: PaymentMethod;
  
  // Recorrência
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
  parentInvoiceId?: string; // Para faturas recorrentes
  
  // Auditoria
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  
  // Campos Calculados
  isPaid: boolean;
  isOverdue: boolean;
  daysOverdue: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface Payment {
  id: string;
  
  // Relacionamentos
  invoiceId?: string;
  invoice?: Invoice;
  clientId: string;
  client: Client;
  caseId?: string;
  case?: Case;
  
  // Informações Básicas
  paymentDate: string;
  description: string;
  notes?: string;
  
  // Valores
  amount: number;
  currency: string; // BRL, USD, etc.
  
  // Status e Método
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  
  // Detalhes do Pagamento
  transactionId?: string; // ID da transação no gateway
  bankAccountId?: string;
  bankAccount?: BankAccount;
  
  // Comprovantes
  receiptUrl?: string;
  attachments?: string[];
  
  // Auditoria
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  processedAt?: string;
}

export interface Expense {
  id: string;
  
  // Informações Básicas
  date: string;
  description: string;
  category: ExpenseCategory;
  notes?: string;
  
  // Valores
  amount: number;
  currency: string;
  
  // Relacionamentos
  caseId?: string;
  case?: Case;
  clientId?: string; // Para despesas reembolsáveis
  client?: Client;
  supplierId?: string;
  supplierName?: string;
  
  // Pagamento
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  bankAccount?: BankAccount;
  
  // Controle
  isReimbursable: boolean;
  isReimbursed: boolean;
  reimbursedDate?: string;
  reimbursedAmount?: number;
  
  // Comprovantes
  receiptUrl?: string;
  attachments?: string[];
  
  // Recorrência
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
  
  // Auditoria
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  date: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  invoiceId?: string;
  expenseId?: string;
  paymentId?: string;
  caseId?: string;
  clientId?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
}

export interface FinancialSummary {
  // Período
  startDate: string;
  endDate: string;
  
  // Receitas
  totalIncome: number;
  totalInvoiced: number;
  totalReceived: number;
  pendingReceivables: number;
  overdueReceivables: number;
  
  // Despesas
  totalExpenses: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  reimbursableExpenses: number;
  
  // Resultado
  netIncome: number;
  profitMargin: number;
  
  // Estatísticas
  invoicesCount: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  
  // Comparação com período anterior
  growthRate: {
    income: number;
    expenses: number;
    netIncome: number;
  };
}

export interface CashFlowProjection {
  date: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
  actualIncome?: number;
  actualExpenses?: number;
  actualBalance?: number;
}

export interface FinancialReport {
  id: string;
  name: string;
  type: 'income_statement' | 'cash_flow' | 'receivables' | 'expenses' | 'custom';
  startDate: string;
  endDate: string;
  filters: Record<string, any>;
  data: any;
  generatedBy: string;
  generatedAt: string;
}

// Request Types - Tipos específicos para API requests
export interface InvoiceItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceRequest {
  clientId: string;
  caseId?: string;
  title: string;
  description: string;
  dueDate: string;
  items: InvoiceItemRequest[];
  paymentTerms: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
}

export interface UpdateInvoiceRequest {
  clientId?: string;
  caseId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  items?: InvoiceItemRequest[];
  paymentTerms?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
  status?: InvoiceStatus;
  sentDate?: string;
}

export interface CreatePaymentRequest {
  invoiceId?: string;
  clientId: string;
  caseId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  description: string;
  bankAccountId?: string;
  notes?: string;
}

export interface CreateExpenseRequest {
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  caseId?: string;
  clientId?: string;
  supplierName?: string;
  isReimbursable?: boolean;
  bankAccountId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: string;
}

export interface FinancialFilters {
  startDate?: string;
  endDate?: string;
  clientIds?: string[];
  caseIds?: string[];
  status?: string[];
  categories?: string[];
  paymentMethods?: PaymentMethod[];
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ExpensesResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Labels para UI
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  partial: 'Parcial',
  paid: 'Paga',
  overdue: 'Vencida',
  cancelled: 'Cancelada'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado'
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  court_fees: 'Custas Processuais',
  office_supplies: 'Material de Escritório',
  travel: 'Viagem',
  professional_services: 'Serviços Profissionais',
  software: 'Software',
  marketing: 'Marketing',
  utilities: 'Utilidades',
  rent: 'Aluguel',
  other: 'Outros'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  bank_transfer: 'Transferência Bancária',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  check: 'Cheque',
  boleto: 'Boleto'
};

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  none: 'Sem recorrência',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual'
};
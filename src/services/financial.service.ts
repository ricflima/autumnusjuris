// src/services/financial.service.ts

import { 
  Invoice,
  Payment,
  Expense,
  FinancialTransaction,
  FinancialSummary,
  CashFlowProjection,
  BankAccount,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreatePaymentRequest,
  CreateExpenseRequest,
  InvoicesResponse,
  PaymentsResponse,
  ExpensesResponse,
  FinancialFilters,
  InvoiceStatus,
  PaymentStatus,
  ExpenseCategory,
  PaymentMethod
} from '@/types/financial';

// Mock data para desenvolvimento
const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: '1',
    name: 'Conta Principal',
    bank: 'Banco do Brasil',
    agency: '1234-5',
    account: '12345-6',
    accountType: 'business',
    balance: 45000,
    isActive: true,
    isDefault: true
  },
  {
    id: '2',
    name: 'Conta Poupança',
    bank: 'Caixa Econômica',
    agency: '9876',
    account: '98765-4',
    accountType: 'savings',
    balance: 15000,
    isActive: true,
    isDefault: false
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'FAT-2024-001',
    clientId: '1',
    client: {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      document: '123.456.789-00',
      documentType: 'cpf'
    },
    caseId: '1',
    case: {
      id: '1',
      title: 'Processo Trabalhista',
      caseNumber: '5001234-12.2024.5.02.0001',
      clientId: '1',
      clientName: 'João Silva'
    },
    issueDate: '2024-03-01',
    dueDate: '2024-03-31',
    description: 'Honorários advocatícios - Processo Trabalhista',
    items: [
      {
        id: '1',
        description: 'Acompanhamento processual',
        quantity: 1,
        unitPrice: 5000,
        total: 5000
      },
      {
        id: '2',
        description: 'Audiência inicial',
        quantity: 1,
        unitPrice: 1500,
        total: 1500
      }
    ],
    subtotal: 6500,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 6500,
    status: 'sent',
    paymentTerms: '30 dias',
    isRecurring: false,
    createdBy: 'user-1',
    createdAt: '2025-07-25T10:00:00Z',
    isPaid: false,
    isOverdue: false,
    daysOverdue: 0,
    paidAmount: 0,
    remainingAmount: 6500
  },
  {
    id: '2',
    invoiceNumber: 'FAT-2024-002',
    clientId: '2',
    client: {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      document: '987.654.321-00',
      documentType: 'cpf'
    },
    caseId: '2',
    case: {
      id: '2',
      title: 'Divórcio Consensual',
      caseNumber: 'DIV-2024-002',
      clientId: '2',
      clientName: 'Maria Santos'
    },
    issueDate: '2024-02-15',
    dueDate: '2024-03-15',
    description: 'Honorários advocatícios - Divórcio Consensual',
    items: [
      {
        id: '3',
        description: 'Elaboração de petição',
        quantity: 1,
        unitPrice: 2500,
        total: 2500
      },
      {
        id: '4',
        description: 'Acompanhamento processual',
        quantity: 1,
        unitPrice: 1500,
        total: 1500
      }
    ],
    subtotal: 4000,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 4000,
    status: 'paid',
    paymentTerms: '30 dias',
    paymentMethod: 'pix',
    isRecurring: false,
    createdBy: 'user-1',
    createdAt: '2024-02-15T10:00:00Z',
    isPaid: true,
    isOverdue: false,
    daysOverdue: 0,
    paidAmount: 4000,
    remainingAmount: 0
  },
  {
    id: '3',
    invoiceNumber: 'FAT-2024-003',
    clientId: '3',
    client: {
      id: '3',
      name: 'Empresa ABC Ltda',
      email: 'contato@empresaabc.com',
      document: '12.345.678/0001-90',
      documentType: 'cnpj'
    },
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    description: 'Consultoria jurídica mensal',
    items: [
      {
        id: '5',
        description: 'Consultoria jurídica',
        quantity: 1,
        unitPrice: 8000,
        total: 8000
      }
    ],
    subtotal: 8000,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 8000,
    status: 'overdue',
    paymentTerms: '30 dias',
    isRecurring: true,
    recurrenceType: 'monthly',
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    isPaid: false,
    isOverdue: true,
    daysOverdue: 15,
    paidAmount: 0,
    remainingAmount: 8000
  }
];

const MOCK_PAYMENTS: Payment[] = [
  {
    id: '1',
    invoiceId: '2',
    invoice: MOCK_INVOICES[1],
    clientId: '2',
    client: {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      document: '987.654.321-00',
      documentType: 'cpf'
    },
    caseId: '2',
    paymentDate: '2024-03-10',
    description: 'Pagamento fatura FAT-2024-002',
    amount: 4000,
    currency: 'BRL',
    status: 'completed',
    paymentMethod: 'pix',
    transactionId: 'PIX123456789',
    bankAccountId: '1',
    createdBy: 'user-1',
    createdAt: '2024-03-10T15:30:00Z',
    processedAt: '2024-03-10T15:35:00Z'
  },
  {
    id: '2',
    clientId: '1',
    client: {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      document: '123.456.789-00',
      documentType: 'cpf'
    },
    caseId: '1',
    paymentDate: '2024-03-20',
    description: 'Sinal - Processo Trabalhista',
    amount: 2000,
    currency: 'BRL',
    status: 'completed',
    paymentMethod: 'bank_transfer',
    bankAccountId: '1',
    createdBy: 'user-1',
    createdAt: '2024-03-20T14:00:00Z',
    processedAt: '2024-03-20T14:30:00Z'
  }
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    date: '2025-08-15',
    description: 'Custas processuais - Processo Trabalhista',
    category: 'court_fees',
    amount: 450,
    currency: 'BRL',
    caseId: '1',
    case: {
      id: '1',
      title: 'Processo Trabalhista',
      caseNumber: '5001234-12.2024.5.02.0001',
      clientId: '1',
      clientName: 'João Silva'
    },
    clientId: '1',
    client: {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      document: '123.456.789-00',
      documentType: 'cpf'
    },
    paymentMethod: 'bank_transfer',
    bankAccountId: '1',
    isReimbursable: true,
    isReimbursed: false,
    isRecurring: false,
    createdBy: 'user-1',
    createdAt: '2025-08-15T10:00:00Z'
  },
  {
    id: '2',
    date: '2025-08-10',
    description: 'Material de escritório',
    category: 'office_supplies',
    amount: 250,
    currency: 'BRL',
    supplierName: 'Papelaria Central',
    paymentMethod: 'credit_card',
    isReimbursable: false,
    isReimbursed: false,
    isRecurring: false,
    createdBy: 'user-1',
    createdAt: '2025-08-10T14:30:00Z'
  },
  {
    id: '3',
    date: '2025-07-25',
    description: 'Aluguel do escritório',
    category: 'rent',
    amount: 3500,
    currency: 'BRL',
    paymentMethod: 'bank_transfer',
    bankAccountId: '1',
    isReimbursable: false,
    isReimbursed: false,
    isRecurring: true,
    recurrenceType: 'monthly',
    createdBy: 'user-1',
    createdAt: '2024-03-01T08:00:00Z'
  }
];

class FinancialService {
  // === INVOICES ===
  async getInvoices(filters: FinancialFilters = {}): Promise<InvoicesResponse> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredInvoices = [...MOCK_INVOICES];
    
    // Aplicar filtros
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(search) ||
        invoice.client.name.toLowerCase().includes(search) ||
        invoice.description.toLowerCase().includes(search)
      );
    }
    
    if (filters.status && filters.status.length > 0) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        filters.status!.includes(invoice.status)
      );
    }
    
    if (filters.clientIds && filters.clientIds.length > 0) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        filters.clientIds!.includes(invoice.clientId)
      );
    }
    
    if (filters.startDate) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.issueDate >= filters.startDate!
      );
    }
    
    if (filters.endDate) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.issueDate <= filters.endDate!
      );
    }
    
    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
    
    return {
      invoices: paginatedInvoices,
      total: filteredInvoices.length,
      page,
      limit,
      hasMore: endIndex < filteredInvoices.length
    };
  }
  
  // src/services/financial.service.ts - Método getInvoiceById CORRIGIDO

    async getInvoiceById(id: string): Promise<Invoice> {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const invoice = MOCK_INVOICES.find(invoice => invoice.id === id);
      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }
      
      // Calcular campos dinâmicos de forma segura
      const now = new Date();
      const dueDate = new Date(invoice.dueDate);
      const isOverdue = now > dueDate && !invoice.isPaid;
      const daysOverdue = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        ...invoice,
        isOverdue,
        daysOverdue,
        paidAmount: invoice.paidAmount || 0,
        remainingAmount: invoice.totalAmount - (invoice.paidAmount || 0)
      };
    }
  
  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calcular valores dos itens
    const items = data.items.map((item, index) => ({
      ...item,
      id: `item-${Date.now()}-${index}`,
      total: item.quantity * item.unitPrice
    }));
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    
    const newInvoice: Invoice = {
      id: `invoice-${Date.now()}`,
      invoiceNumber: `FAT-${new Date().getFullYear()}-${String(MOCK_INVOICES.length + 1).padStart(3, '0')}`,
      clientId: data.clientId,
      client: {
        id: data.clientId,
        name: 'Cliente Teste',
        email: 'cliente@teste.com',
        document: '000.000.000-00',
        documentType: 'cpf'
      },
      caseId: data.caseId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      description: data.description,
      notes: data.notes,
      items,
      subtotal,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: subtotal,
      status: 'draft',
      paymentTerms: data.paymentTerms,
      isRecurring: data.isRecurring || false,
      recurrenceType: data.recurrenceType,
      recurrenceEndDate: data.recurrenceEndDate,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      isPaid: false,
      isOverdue: false,
      daysOverdue: 0,
      paidAmount: 0,
      remainingAmount: subtotal
    };
    
    MOCK_INVOICES.push(newInvoice);
    return newInvoice;
  }
  
  async updateInvoice(id: string, data: UpdateInvoiceRequest): Promise<Invoice> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const invoiceIndex = MOCK_INVOICES.findIndex(invoice => invoice.id === id);
    if (invoiceIndex === -1) {
      throw new Error('Fatura não encontrada');
    }
    
    const invoice = MOCK_INVOICES[invoiceIndex];
    
    // Se atualizando itens, garantir que tenham IDs e totais calculados
    let processedData: any = { ...data };
    if (data.items) {
      processedData.items = data.items.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      }));
    }
    
    const updatedInvoice = {
      ...invoice,
      ...processedData,
      updatedAt: new Date().toISOString()
    };
    
    MOCK_INVOICES[invoiceIndex] = updatedInvoice;
    return updatedInvoice;
  }
  
  async deleteInvoice(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const invoiceIndex = MOCK_INVOICES.findIndex(invoice => invoice.id === id);
    if (invoiceIndex === -1) {
      throw new Error('Fatura não encontrada');
    }
    
    MOCK_INVOICES.splice(invoiceIndex, 1);
  }
  
  async sendInvoice(id: string): Promise<Invoice> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const invoice = await this.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }
    
    return this.updateInvoice(id, {
      status: 'sent',
      sentDate: new Date().toISOString()
    });
  }
  
  // === PAYMENTS ===
  async getPayments(filters: FinancialFilters = {}): Promise<PaymentsResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredPayments = [...MOCK_PAYMENTS];
    
    // Aplicar filtros
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredPayments = filteredPayments.filter(payment =>
        payment.description.toLowerCase().includes(search) ||
        payment.client.name.toLowerCase().includes(search) ||
        (payment.transactionId && payment.transactionId.toLowerCase().includes(search))
      );
    }
    
    if (filters.status && filters.status.length > 0) {
      filteredPayments = filteredPayments.filter(payment =>
        filters.status!.includes(payment.status)
      );
    }
    
    if (filters.clientIds && filters.clientIds.length > 0) {
      filteredPayments = filteredPayments.filter(payment =>
        filters.clientIds!.includes(payment.clientId)
      );
    }
    
    if (filters.startDate) {
      filteredPayments = filteredPayments.filter(payment =>
        payment.paymentDate >= filters.startDate!
      );
    }
    
    if (filters.endDate) {
      filteredPayments = filteredPayments.filter(payment =>
        payment.paymentDate <= filters.endDate!
      );
    }
    
    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
    
    return {
      payments: paginatedPayments,
      total: filteredPayments.length,
      page,
      limit,
      hasMore: endIndex < filteredPayments.length
    };
  }
  
  async getPaymentById(id: string): Promise<Payment | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_PAYMENTS.find(payment => payment.id === id) || null;
  }
  
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      invoiceId: data.invoiceId,
      clientId: data.clientId,
      client: {
        id: data.clientId,
        name: 'Cliente Teste',
        email: 'cliente@teste.com',
        document: '000.000.000-00',
        documentType: 'cpf'
      },
      caseId: data.caseId,
      paymentDate: data.paymentDate,
      description: data.description,
      amount: data.amount,
      currency: 'BRL',
      status: 'completed',
      paymentMethod: data.paymentMethod,
      bankAccountId: data.bankAccountId,
      notes: data.notes,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
    
    MOCK_PAYMENTS.push(newPayment);
    
    // Se o pagamento está vinculado a uma fatura, atualizar o status da fatura
    if (data.invoiceId) {
      const invoice = await this.getInvoiceById(data.invoiceId);
      if (invoice) {
        const totalPaid = invoice.paidAmount + data.amount;
        const newStatus: InvoiceStatus = totalPaid >= invoice.totalAmount ? 'paid' : 'partial';
        
        await this.updateInvoice(data.invoiceId, {
          status: newStatus
        });
      }
    }
    
    return newPayment;
  }
  
  // === EXPENSES ===
  async getExpenses(filters: FinancialFilters = {}): Promise<ExpensesResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredExpenses = [...MOCK_EXPENSES];
    
    // Aplicar filtros
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredExpenses = filteredExpenses.filter(expense =>
        expense.description.toLowerCase().includes(search) ||
        (expense.supplierName && expense.supplierName.toLowerCase().includes(search))
      );
    }
    
    if (filters.categories && filters.categories.length > 0) {
      filteredExpenses = filteredExpenses.filter(expense =>
        filters.categories!.includes(expense.category)
      );
    }
    
    if (filters.caseIds && filters.caseIds.length > 0) {
      filteredExpenses = filteredExpenses.filter(expense =>
        expense.caseId && filters.caseIds!.includes(expense.caseId)
      );
    }
    
    if (filters.startDate) {
      filteredExpenses = filteredExpenses.filter(expense =>
        expense.date >= filters.startDate!
      );
    }
    
    if (filters.endDate) {
      filteredExpenses = filteredExpenses.filter(expense =>
        expense.date <= filters.endDate!
      );
    }
    
    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
    
    return {
      expenses: paginatedExpenses,
      total: filteredExpenses.length,
      page,
      limit,
      hasMore: endIndex < filteredExpenses.length
    };
  }
  
  async getExpenseById(id: string): Promise<Expense | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_EXPENSES.find(expense => expense.id === id) || null;
  }
  
  async createExpense(data: CreateExpenseRequest): Promise<Expense> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      date: data.date,
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency: 'BRL',
      caseId: data.caseId,
      clientId: data.clientId,
      supplierName: data.supplierName,
      paymentMethod: data.paymentMethod,
      bankAccountId: data.bankAccountId,
      isReimbursable: data.isReimbursable || false,
      isReimbursed: false,
      notes: data.notes,
      isRecurring: data.isRecurring || false,
      recurrenceType: data.recurrenceType,
      recurrenceEndDate: data.recurrenceEndDate,
      createdBy: 'user-1',
      createdAt: new Date().toISOString()
    };
    
    MOCK_EXPENSES.push(newExpense);
    return newExpense;
  }
  
  async updateExpense(id: string, data: Partial<CreateExpenseRequest>): Promise<Expense> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const expenseIndex = MOCK_EXPENSES.findIndex(expense => expense.id === id);
    if (expenseIndex === -1) {
      throw new Error('Despesa não encontrada');
    }
    
    const expense = MOCK_EXPENSES[expenseIndex];
    const updatedExpense = {
      ...expense,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    MOCK_EXPENSES[expenseIndex] = updatedExpense;
    return updatedExpense;
  }
  
  async deleteExpense(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const expenseIndex = MOCK_EXPENSES.findIndex(expense => expense.id === id);
    if (expenseIndex === -1) {
      throw new Error('Despesa não encontrada');
    }
    
    MOCK_EXPENSES.splice(expenseIndex, 1);
  }
  
  // === BANK ACCOUNTS ===
  async getBankAccounts(): Promise<BankAccount[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...MOCK_BANK_ACCOUNTS];
  }
  
  // === FINANCIAL SUMMARY ===
  async getFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Filtrar dados pelo período
    const invoices = MOCK_INVOICES.filter(invoice => 
      invoice.issueDate >= startDate && invoice.issueDate <= endDate
    );
    
    const payments = MOCK_PAYMENTS.filter(payment => 
      payment.paymentDate >= startDate && payment.paymentDate <= endDate
    );
    
    const expenses = MOCK_EXPENSES.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
    
    // Calcular totais
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const pendingReceivables = invoices
      .filter(invoice => invoice.status === 'sent' || invoice.status === 'partial')
      .reduce((sum, invoice) => sum + invoice.remainingAmount, 0);
    
    const overdueReceivables = invoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.remainingAmount, 0);
    
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);
    
    const reimbursableExpenses = expenses
      .filter(expense => expense.isReimbursable && !expense.isReimbursed)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const netIncome = totalReceived - totalExpenses;
    const profitMargin = totalReceived > 0 ? (netIncome / totalReceived) * 100 : 0;
    
    const invoicesCount = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'sent' || i.status === 'partial').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    };
    
    return {
      startDate,
      endDate,
      totalIncome: totalReceived,
      totalInvoiced,
      totalReceived,
      pendingReceivables,
      overdueReceivables,
      totalExpenses,
      expensesByCategory,
      reimbursableExpenses,
      netIncome,
      profitMargin,
      invoicesCount,
      growthRate: {
        income: 15.5, // Mock data
        expenses: 8.2,
        netIncome: 22.3
      }
    };
  }
  
  // === CASH FLOW PROJECTION ===
  async getCashFlowProjection(startDate: string, endDate: string): Promise<CashFlowProjection[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data para projeção de fluxo de caixa
    const projections: CashFlowProjection[] = [
      {
        date: '2024-03-01',
        projectedIncome: 12000,
        projectedExpenses: 5500,
        projectedBalance: 45000 + 6500,
        actualIncome: 11500,
        actualExpenses: 5200,
        actualBalance: 45000 + 6300
      },
      {
        date: '2024-04-01',
        projectedIncome: 15000,
        projectedExpenses: 6000,
        projectedBalance: 45000 + 6500 + 9000,
        actualIncome: 14200,
        actualExpenses: 5800,
        actualBalance: 45000 + 6300 + 8400
      },
      {
        date: '2024-05-01',
        projectedIncome: 13500,
        projectedExpenses: 5800,
        projectedBalance: 45000 + 6500 + 9000 + 7700,
        actualIncome: undefined,
        actualExpenses: undefined,
        actualBalance: undefined
      }
    ];
    
    return projections;
  }
  
  // === TRANSACTIONS ===
  async getTransactions(filters: FinancialFilters = {}): Promise<FinancialTransaction[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const transactions: FinancialTransaction[] = [];
    
    // Converter pagamentos em transações
    MOCK_PAYMENTS.forEach(payment => {
      transactions.push({
        id: `transaction-payment-${payment.id}`,
        type: 'income',
        date: payment.paymentDate,
        description: payment.description,
        amount: payment.amount,
        category: 'Honorários',
        paymentMethod: payment.paymentMethod,
        bankAccountId: payment.bankAccountId,
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        caseId: payment.caseId,
        clientId: payment.clientId,
        createdAt: payment.createdAt
      });
    });
    
    // Converter despesas em transações
    MOCK_EXPENSES.forEach(expense => {
      transactions.push({
        id: `transaction-expense-${expense.id}`,
        type: 'expense',
        date: expense.date,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        bankAccountId: expense.bankAccountId,
        expenseId: expense.id,
        caseId: expense.caseId,
        clientId: expense.clientId,
        createdAt: expense.createdAt
      });
    });
    
    // Ordenar por data (mais recente primeiro)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return transactions;
  }
  
  // === UTILITY METHODS ===
  formatCurrency(amount: number, currency: string = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  getStatusColor(status: InvoiceStatus | PaymentStatus): string {
    const colors: Record<string, string> = {
      // Invoice status
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      
      // Payment status
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
  
  calculateDaysOverdue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
  
  isOverdue(dueDate: string): boolean {
    return this.calculateDaysOverdue(dueDate) > 0;
  }
  
  generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const nextNumber = MOCK_INVOICES.length + 1;
    return `FAT-${year}-${String(nextNumber).padStart(3, '0')}`;
  }
}

export const financialService = new FinancialService();
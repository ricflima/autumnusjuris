// src/pages/financial/TransactionsList.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Wallet,
  Building,
  User,
  Clock,
  MoreHorizontal
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data para transações
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: string;
  reference?: string;
  clientId?: string;
  clientName?: string;
  invoiceId?: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'income',
    category: 'Honorários',
    description: 'Pagamento Caso Silva vs. Empresa XYZ',
    amount: 15000,
    date: '2025-08-15T10:00:00Z',
    status: 'completed',
    paymentMethod: 'Transferência Bancária',
    reference: 'TED-001234',
    clientId: '1',
    clientName: 'João Silva'
  },
  {
    id: '2',
    type: 'expense',
    category: 'Custas Processuais',
    description: 'Taxa de distribuição - Processo 1001234-56',
    amount: 250,
    date: '2025-08-14T14:30:00Z',
    status: 'completed',
    paymentMethod: 'Cartão de Crédito',
    reference: 'CC-9876'
  },
  {
    id: '3',
    type: 'income',
    category: 'Consultoria',
    description: 'Consultoria jurídica - Empresa ABC',
    amount: 5000,
    date: '2025-08-12T16:45:00Z',
    status: 'pending',
    paymentMethod: 'Boleto Bancário',
    clientId: '3',
    clientName: 'Empresa ABC Ltda'
  },
  {
    id: '4',
    type: 'expense',
    category: 'Despesas Administrativas',
    description: 'Material de escritório',
    amount: 350,
    date: '2025-08-10T09:15:00Z',
    status: 'completed',
    paymentMethod: 'Dinheiro'
  },
  {
    id: '5',
    type: 'income',
    category: 'Honorários',
    description: 'Acordo extrajudicial - Caso Santos',
    amount: 8000,
    date: '2025-08-08T11:30:00Z',
    status: 'completed',
    paymentMethod: 'PIX',
    reference: 'PIX-7890',
    clientId: '2',
    clientName: 'Maria Santos'
  },
  {
    id: '6',
    type: 'expense',
    category: 'Viagem',
    description: 'Deslocamento para audiência - Salvador',
    amount: 1200,
    date: '2025-08-05T07:00:00Z',
    status: 'completed',
    paymentMethod: 'Cartão Corporativo'
  },
  {
    id: '7',
    type: 'income',
    category: 'Retenção',
    description: 'Pagamento de retenção - Contrato de Prestação de Serviços',
    amount: 12000,
    date: '2025-07-30T15:20:00Z',
    status: 'completed',
    paymentMethod: 'Transferência Bancária',
    clientId: '3',
    clientName: 'Empresa ABC Ltda'
  },
  {
    id: '8',
    type: 'expense',
    category: 'Tecnologia',
    description: 'Licença software jurídico - mensal',
    amount: 450,
    date: '2025-07-28T10:00:00Z',
    status: 'completed',
    paymentMethod: 'Débito Automático'
  }
];

const CATEGORIES = {
  income: ['Honorários', 'Consultoria', 'Retenção', 'Sucumbenciais', 'Outras Receitas'],
  expense: ['Custas Processuais', 'Despesas Administrativas', 'Viagem', 'Tecnologia', 'Marketing', 'Impostos', 'Outras Despesas']
};

const PAYMENT_METHODS = [
  'Transferência Bancária',
  'PIX',
  'Boleto Bancário',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Cheque'
];

export default function TransactionsList() {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    status: 'all',
    paymentMethod: 'all',
    dateRange: 'all',
    page: 1,
    limit: 20
  });
  
  const [viewMode, setViewMode] = useState<'all' | 'income' | 'expense'>('all');

  // Simular query de transações
  const filteredTransactions = MOCK_TRANSACTIONS.filter(transaction => {
    if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (viewMode !== 'all' && transaction.type !== viewMode) {
      return false;
    }
    if (filters.category !== 'all' && transaction.category !== filters.category) {
      return false;
    }
    if (filters.status !== 'all' && transaction.status !== filters.status) {
      return false;
    }
    if (filters.paymentMethod !== 'all' && transaction.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    return true;
  });

  // Calcular estatísticas
  const stats = {
    totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    totalPending: filteredTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
    transactionCount: filteredTransactions.length
  };

  const getTransactionIcon = (type: string, category: string) => {
    if (type === 'income') {
      return <ArrowUp className="w-4 h-4 text-green-600" />;
    }
    if (category === 'Custas Processuais') {
      return <Receipt className="w-4 h-4 text-red-600" />;
    }
    if (category === 'Viagem') {
      return <Calendar className="w-4 h-4 text-red-600" />;
    }
    return <ArrowDown className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Histórico completo de receitas e despesas</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            alert('Exportação será implementada em breve!');
          }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Link to="/financial/payments/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalExpense)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Líquido</p>
                <p className={`text-2xl font-bold ${
                  stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.totalIncome - stats.totalExpense)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.totalPending)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar transações..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.category} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, category: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {[...CATEGORIES.income, ...CATEGORIES.expense].map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.paymentMethod} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, paymentMethod: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Forma de Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas</SelectItem>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Todas ({MOCK_TRANSACTIONS.length})</TabsTrigger>
            <TabsTrigger value="income" className="text-green-600">
              Receitas ({MOCK_TRANSACTIONS.filter(t => t.type === 'income').length})
            </TabsTrigger>
            <TabsTrigger value="expense" className="text-red-600">
              Despesas ({MOCK_TRANSACTIONS.filter(t => t.type === 'expense').length})
            </TabsTrigger>
          </TabsList>

          <div className="text-sm text-gray-600">
            {filteredTransactions.length} transação(ões) encontrada(s)
          </div>
        </div>

        <TabsContent value={viewMode} className="mt-6">
          {/* Transactions List */}
          <Card>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma transação encontrada
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Não encontramos transações com os filtros selecionados.
                    </p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-6 hover:bg-gray-50 transition-colors ${
                        index !== filteredTransactions.length - 1 ? 'border-b border-gray-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction.type, transaction.category)}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            {getStatusBadge(transaction.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{transaction.paymentMethod}</span>
                            {transaction.clientName && (
                              <>
                                <span>•</span>
                                <span>{transaction.clientName}</span>
                              </>
                            )}
                            {transaction.reference && (
                              <>
                                <span>•</span>
                                <span>Ref: {transaction.reference}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.date)}
                          </p>
                        </div>

                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
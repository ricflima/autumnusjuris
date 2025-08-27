// src/pages/financial/ExpensesList.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Tag,
  Building,
  CreditCard,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { 
  useExpenses,
  useDeleteExpense,
  useFinancialFormatters 
} from '@/hooks/useFinancial';
import { 
  Expense,
  FinancialFilters, 
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS
} from '@/types/financial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const ExpensesList: React.FC = () => {
  const [filters, setFilters] = useState<FinancialFilters>({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const { data: expensesData, isLoading, error } = useExpenses(filters);
  const deleteExpenseMutation = useDeleteExpense();
  const { formatCurrency, formatDate } = useFinancialFormatters();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: category === 'all' ? undefined : [category],
      page: 1
    }));
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await deleteExpenseMutation.mutateAsync(expense.id);
      setExpenseToDelete(null);
    } catch (error) {
      // Error é tratado no hook
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      court_fees: 'bg-red-100 text-red-800',
      office_supplies: 'bg-blue-100 text-blue-800',
      travel: 'bg-green-100 text-green-800',
      professional_services: 'bg-purple-100 text-purple-800',
      software: 'bg-indigo-100 text-indigo-800',
      marketing: 'bg-pink-100 text-pink-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      rent: 'bg-gray-100 text-gray-800',
      other: 'bg-slate-100 text-slate-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar despesas"
        description="Não foi possível carregar a lista de despesas. Tente novamente."
        action={
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const expenses = expensesData?.expenses || [];
  const totalExpenses = expensesData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600">
            Controle todas as despesas do escritório
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Link to="/financial/expenses/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total do Mês</p>
                <p className="text-xl font-bold">
                  {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reembolsáveis</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    expenses
                      .filter(exp => exp.isReimbursable && !exp.isReimbursed)
                      .reduce((sum, exp) => sum + exp.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Despesas</p>
                <p className="text-xl font-bold">{totalExpenses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {totalExpenses} despesa{totalExpenses !== 1 ? 's' : ''} encontrada{totalExpenses !== 1 ? 's' : ''}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Barra de busca */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Data inicial
                </label>
                <Input
                  type="date"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    startDate: e.target.value || undefined,
                    page: 1
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Data final
                </label>
                <Input
                  type="date"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    endDate: e.target.value || undefined,
                    page: 1
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Valor mínimo
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    page: 1
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Valor máximo
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    page: 1
                  }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de despesas */}
      {expenses.length === 0 ? (
        <EmptyState
          title="Nenhuma despesa encontrada"
          description={searchTerm ? "Tente ajustar os filtros de busca" : "Comece registrando sua primeira despesa"}
          action={
            <Link to="/financial/expenses/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Despesa
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método de Pagamento</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        {expense.case && (
                          <p className="text-sm text-gray-600">
                            Caso: {expense.case.title}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(expense.category)}>
                        <Tag className="w-3 h-3 mr-1" />
                        {EXPENSE_CATEGORY_LABELS[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span>{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {expense.supplierName ? (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{expense.supplierName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expense.isReimbursable && (
                          <Badge
                            variant={expense.isReimbursed ? "default" : "secondary"}
                            className={expense.isReimbursed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                          >
                            {expense.isReimbursed ? "Reembolsado" : "A Reembolsar"}
                          </Badge>
                        )}
                        {expense.isRecurring && (
                          <Badge variant="outline">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Recorrente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar Detalhes
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download Comprovante
                          </DropdownMenuItem>
                          
                          {expense.isReimbursable && !expense.isReimbursed && (
                            <DropdownMenuItem>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Marcar como Reembolsado
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={() => setExpenseToDelete(expense)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {expensesData && expensesData.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({
              ...prev,
              page: (prev.page || 1) + 1
            }))}
          >
            Carregar mais
          </Button>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => expenseToDelete && handleDeleteExpense(expenseToDelete)}
        title="Excluir Despesa"
        description={`Tem certeza que deseja excluir a despesa "${expenseToDelete?.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};

export default ExpensesList;
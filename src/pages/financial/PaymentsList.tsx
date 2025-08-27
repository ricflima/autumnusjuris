// src/pages/financial/PaymentsList.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard
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
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { 
  usePayments,
  useFinancialFormatters 
} from '@/hooks/useFinancial';
import { 
  FinancialFilters, 
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS
} from '@/types/financial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

const PaymentsList: React.FC = () => {
  const [filters, setFilters] = useState<FinancialFilters>({
    page: 1,
    limit: 20,
    sortBy: 'paymentDate',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: paymentsData, isLoading, error } = usePayments(filters);
  const { formatCurrency, formatDate, getStatusColor } = useFinancialFormatters();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : [status],
      page: 1
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
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
        title="Erro ao carregar pagamentos"
        description="Não foi possível carregar a lista de pagamentos. Tente novamente."
        action={
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const payments = paymentsData?.payments || [];
  const totalPayments = paymentsData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-gray-600">
            Acompanhe todos os pagamentos recebidos
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Link to="/financial/payments/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pagamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {totalPayments} pagamento{totalPayments !== 1 ? 's' : ''} encontrado{totalPayments !== 1 ? 's' : ''}
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
                placeholder="Buscar por cliente, descrição ou ID da transação..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
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
                  Método de pagamento
                </label>
                <Select
                  onValueChange={(method) => setFilters(prev => ({
                    ...prev,
                    paymentMethods: method === 'all' ? undefined : [method as any],
                    page: 1
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os métodos</SelectItem>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de pagamentos */}
      {payments.length === 0 ? (
        <EmptyState
          title="Nenhum pagamento encontrado"
          description={searchTerm ? "Tente ajustar os filtros de busca" : "Quando você receber pagamentos, eles aparecerão aqui"}
          action={
            <Link to="/financial/payments/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Pagamento
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data do Pagamento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{payment.client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payment.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(payment.paymentDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          <span>{PAYMENT_STATUS_LABELS[payment.status]}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.invoiceId ? (
                        <Link 
                          to={`/financial/invoices/${payment.invoiceId}`}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {payment.invoice?.invoiceNumber || 'Ver Fatura'}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
                            <Download className="w-4 h-4 mr-2" />
                            Download Comprovante
                          </DropdownMenuItem>
                          {payment.transactionId && (
                            <DropdownMenuItem>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Ver Transação
                            </DropdownMenuItem>
                          )}
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
      {paymentsData && paymentsData.hasMore && (
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
    </div>
  );
};

export default PaymentsList;
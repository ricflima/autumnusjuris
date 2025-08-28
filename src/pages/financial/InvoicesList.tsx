// src/pages/financial/InvoicesList.tsx

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
  Send,
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
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
  useInvoices, 
  useDeleteInvoice, 
  useSendInvoice,
  useFinancialFormatters 
} from '@/hooks/useFinancial';
import { 
  Invoice, 
  FinancialFilters, 
  INVOICE_STATUS_LABELS 
} from '@/types/financial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const InvoicesList: React.FC = () => {
  const [filters, setFilters] = useState<FinancialFilters>({
    page: 1,
    limit: 20,
    sortBy: 'issueDate',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { data: invoicesData, isLoading, error } = useInvoices(filters);
  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();
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

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await deleteInvoiceMutation.mutateAsync(invoice.id);
      setInvoiceToDelete(null);
    } catch (error) {
      // Error é tratado no hook
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoiceMutation.mutateAsync(invoiceId);
    } catch (error) {
      // Error é tratado no hook
    }
  };

  const generateInvoicePDF = async (invoice: Invoice) => {
    try {
      const jsPDF = await import('jspdf');
      const doc = new jsPDF.default();

      // Header
      doc.setFontSize(20);
      doc.text('FATURA', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('AutumnusJuris - Sistema de Gestão Jurídica', 105, 30, { align: 'center' });
      
      // Invoice details
      doc.setFontSize(14);
      doc.text(`Fatura #${invoice.invoiceNumber}`, 20, 50);
      
      doc.setFontSize(10);
      doc.text(`Data de Emissão: ${formatDate(invoice.createdAt)}`, 20, 60);
      doc.text(`Data de Vencimento: ${formatDate(invoice.dueDate)}`, 20, 70);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 80);
      
      // Client info
      doc.setFontSize(12);
      doc.text('DADOS DO CLIENTE', 20, 100);
      doc.setFontSize(10);
      doc.text(`Cliente: ${invoice.client?.name || 'Cliente não encontrado'}`, 20, 110);
      
      // Case info
      if (invoice.case?.title) {
        doc.text(`Caso: ${invoice.case.title}`, 20, 120);
      }
      
      // Items header
      doc.setFontSize(12);
      doc.text('ITENS DA FATURA', 20, 140);
      
      // Items table
      let yPos = 155;
      doc.setFontSize(9);
      doc.text('Descrição', 20, yPos);
      doc.text('Qtd', 120, yPos);
      doc.text('Valor Unit.', 140, yPos);
      doc.text('Total', 170, yPos);
      
      // Line under header
      doc.line(20, yPos + 2, 190, yPos + 2);
      yPos += 10;
      
      // Items
      invoice.items.forEach((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        doc.text(item.description.substring(0, 40), 20, yPos);
        doc.text(item.quantity.toString(), 120, yPos);
        doc.text(formatCurrency(item.unitPrice), 140, yPos);
        doc.text(formatCurrency(itemTotal), 170, yPos);
        yPos += 8;
      });
      
      // Total
      yPos += 10;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text(`TOTAL: ${formatCurrency(invoice.totalAmount)}`, 170, yPos, { align: 'right' });
      
      // Notes
      if (invoice.notes) {
        yPos += 20;
        doc.setFontSize(10);
        doc.text('OBSERVAÇÕES:', 20, yPos);
        yPos += 10;
        const splitNotes = doc.splitTextToSize(invoice.notes, 170);
        doc.text(splitNotes, 20, yPos);
      }
      
      // Footer
      doc.setFontSize(8);
      doc.text('Gerado pelo AutumnusJuris', 105, 280, { align: 'center' });
      doc.text(new Date().toLocaleString('pt-BR'), 105, 285, { align: 'center' });
      
      // Save
      doc.save(`fatura-${invoice.invoiceNumber}.pdf`);
      toast.success('PDF gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'sent':
      case 'partial':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Edit className="w-4 h-4" />;
    }
  };

  const canSendInvoice = (invoice: Invoice) => {
    return invoice.status === 'draft';
  };

  const canEditInvoice = (invoice: Invoice) => {
    return ['draft', 'sent'].includes(invoice.status);
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
        title="Erro ao carregar faturas"
        description="Não foi possível carregar a lista de faturas. Tente novamente."
        action={
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const invoices = invoicesData?.invoices || [];
  const totalInvoices = invoicesData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faturas</h1>
          <p className="text-gray-600">
            Gerencie todas as faturas do escritório
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Link to="/financial/invoices/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Fatura
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {totalInvoices} fatura{totalInvoices !== 1 ? 's' : ''} encontrada{totalInvoices !== 1 ? 's' : ''}
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
                placeholder="Buscar por número, cliente ou descrição..."
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
                {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros avançados (colapsáveis) */}
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
                  Ordenar por
                </label>
                <Select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-');
                    setFilters(prev => ({
                      ...prev,
                      sortBy: sortBy as any,
                      sortOrder: sortOrder as 'asc' | 'desc',
                      page: 1
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issueDate-desc">Mais recentes</SelectItem>
                    <SelectItem value="issueDate-asc">Mais antigas</SelectItem>
                    <SelectItem value="dueDate-asc">Vencimento próximo</SelectItem>
                    <SelectItem value="totalAmount-desc">Maior valor</SelectItem>
                    <SelectItem value="totalAmount-asc">Menor valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de faturas */}
      {invoices.length === 0 ? (
        <EmptyState
          title="Nenhuma fatura encontrada"
          description={searchTerm ? "Tente ajustar os filtros de busca" : "Comece criando sua primeira fatura"}
          action={
            <Link to="/financial/invoices/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Fatura
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
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => window.location.href = `/financial/invoices/${invoice.id}`}
                  >
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{invoice.client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {invoice.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(invoice.issueDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${
                        invoice.isOverdue ? 'text-red-600' : ''
                      }`}>
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(invoice.dueDate)}</span>
                        {invoice.isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            {invoice.daysOverdue}d atraso
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(invoice.status)}
                          <span>{INVOICE_STATUS_LABELS[invoice.status]}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/financial/invoices/${invoice.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          
                          {canEditInvoice(invoice) && (
                            <DropdownMenuItem asChild>
                              <Link to={`/financial/invoices/${invoice.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          {canSendInvoice(invoice) && (
                            <DropdownMenuItem
                              onClick={() => handleSendInvoice(invoice.id)}
                              disabled={sendInvoiceMutation.isPending}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Enviar
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => generateInvoicePDF(invoice)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {invoice.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => setInvoiceToDelete(invoice)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
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
      {invoicesData && invoicesData.hasMore && (
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
        open={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete)}
        title="Excluir Fatura"
        description={`Tem certeza que deseja excluir a fatura ${invoiceToDelete?.invoiceNumber}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={deleteInvoiceMutation.isPending}
      />
    </div>
  );
};

export default InvoicesList;
// src/pages/financial/ViewInvoice.tsx - CORRIGIDO
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Download,
  FileText,
  User,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Copy,
  Eye
} from 'lucide-react';
import {
  useInvoice,
  useDeleteInvoice,
  useSendInvoice,
  useFinancialFormatters
} from '@/hooks/useFinancial';
import { useClients } from '@/hooks/useClients';
import { useCases } from '@/hooks/useCases';
import { Invoice } from '@/types/financial';
import toast from 'react-hot-toast';

// Componente de Empty State simples
const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="text-center py-12">
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    {action}
  </div>
);

// Componente de Confirm Dialog simples
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isLoading?: boolean;
  variant?: 'default' | 'destructive';
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  isLoading = false,
  variant = 'default'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ViewInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Hooks
  const { data: invoice, isLoading, error } = useInvoice(id!);
  const deleteInvoiceMutation = useDeleteInvoice();
  const sendInvoiceMutation = useSendInvoice();
  const { formatCurrency, formatDate } = useFinancialFormatters();
  
  const { data: clientsData } = useClients();
  const { data: casesData } = useCases();

  // Get client and case info
  const client = clientsData?.clients.find(c => c.id === invoice?.clientId);
  const caseInfo = casesData?.cases.find(c => c.id === invoice?.caseId);

  const handleDelete = async () => {
    if (!invoice) return;
    
    try {
      await deleteInvoiceMutation.mutateAsync(invoice.id);
      navigate('/financial/invoices');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSend = async () => {
    if (!invoice) return;
    
    try {
      await sendInvoiceMutation.mutateAsync(invoice.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const copyInvoiceNumber = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
    }
  };

  const generatePDF = async () => {
    if (!invoice || !client) return;

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
      doc.text(`Nome: ${client.name}`, 20, 110);
      doc.text(`E-mail: ${client.email}`, 20, 120);
      doc.text(`Telefone: ${client.phone}`, 20, 130);
      
      // Case info
      if (caseInfo) {
        doc.text(`Caso: ${caseInfo.title}`, 20, 140);
      }
      
      // Items header
      doc.setFontSize(12);
      doc.text('ITENS DA FATURA', 20, 160);
      
      // Items table
      let yPos = 175;
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sent':
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <Edit className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Rascunho',
      sent: 'Enviada',
      paid: 'Paga',
      partial: 'Parcial',
      overdue: 'Vencida',
      cancelled: 'Cancelada'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const canEdit = invoice && ['draft', 'sent'].includes(invoice.status);
  const canSend = invoice && invoice.status === 'draft';
  const canDelete = invoice && ['draft'].includes(invoice.status);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/financial/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visualizar Fatura</h1>
            <p className="text-red-600">Fatura não encontrada ou erro ao carregar</p>
          </div>
        </div>
        <EmptyState
          title="Fatura não encontrada"
          description="A fatura solicitada não foi encontrada ou ocorreu um erro ao carregá-la."
          action={
            <Link to="/financial/invoices">
              <Button>Voltar para Faturas</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/financial/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Fatura #{invoice.invoiceNumber}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyInvoiceNumber}
                className="text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(invoice.status)}
              <Badge className={getStatusColor(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
              {invoice.isOverdue && (
                <span className="text-red-600 text-sm font-medium">
                  {invoice.daysOverdue} dias em atraso
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          
          {canSend && (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sendInvoiceMutation.isPending}
            >
              {sendInvoiceMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mr-2" />
                </>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          )}

          {canEdit && (
            <Link to={`/financial/invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </Link>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detalhes da Fatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Título/Descrição</label>
                  <p className="mt-1 text-gray-900">{invoice.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Data de Vencimento</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Condições de Pagamento</label>
                  <p className="mt-1 text-gray-900">{invoice.paymentTerms}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                  <p className="mt-1 text-gray-900">{formatDate(invoice.createdAt)}</p>
                </div>
                {invoice.sentDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Data de Envio</label>
                    <p className="mt-1 text-gray-900">{formatDate(invoice.sentDate)}</p>
                  </div>
                )}
              </div>

              {invoice.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Observações</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice.isRecurring && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Fatura Recorrente</h4>
                  <div className="text-sm text-blue-700">
                    <p>Frequência: {invoice.recurrenceType}</p>
                    {invoice.recurrenceEndDate && (
                      <p>Data de término: {formatDate(invoice.recurrenceEndDate)}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Itens da Fatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-gray-600">Descrição</th>
                      <th className="text-center py-2 font-medium text-gray-600">Qtd</th>
                      <th className="text-right py-2 font-medium text-gray-600">Preço Unit.</th>
                      <th className="text-right py-2 font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3">{item.description}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {invoice.discountAmount && invoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    {client.document && (
                      <p className="text-sm text-gray-600">{client.document}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Badge variant="outline">
                      {client.documentType === 'cpf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </Badge>
                    <Link to={`/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Cliente
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Cliente não encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Case Information */}
          {caseInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Caso Relacionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{caseInfo.title}</p>
                    <p className="text-sm text-gray-600">{caseInfo.caseNumber}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">
                      Caso vinculado
                    </span>
                    <Link to={`/cases/${caseInfo.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Caso
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Situação do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Pago:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.paidAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Restante:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(invoice.remainingAmount || invoice.totalAmount)}
                  </span>
                </div>
                
                {invoice.status === 'paid' && (
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-sm text-green-700 font-medium">
                      Fatura paga integralmente
                    </p>
                  </div>
                )}

                {invoice.status === 'partial' && (
                  <div className="p-3 bg-yellow-50 rounded-lg text-center">
                    <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                    <p className="text-sm text-yellow-700 font-medium">
                      Pagamento parcial recebido
                    </p>
                  </div>
                )}

                {invoice.isOverdue && (
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-sm text-red-700 font-medium">
                      Fatura vencida há {invoice.daysOverdue} dias
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Excluir Fatura"
        description={`Tem certeza que deseja excluir a fatura #${invoice.invoiceNumber}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={deleteInvoiceMutation.isPending}
        variant="destructive"
      />
    </div>
  );
};

export default ViewInvoice;
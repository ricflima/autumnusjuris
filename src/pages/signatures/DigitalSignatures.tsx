import React, { useState } from 'react';
import { Plus, FileText, Clock, CheckCircle, XCircle, Eye, Send, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useDigitalSignature } from '../../hooks/useDigitalSignature';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { SignatureRequest } from '../../types/digitalSignature';
import { CreateSignatureRequestDialog } from './CreateSignatureRequestDialog';
import { SignatureDetailsDialog } from './SignatureDetailsDialog';

export function DigitalSignatures() {
  const {
    signatures,
    signatureRequests,
    isLoading,
    sendRequest,
    deleteRequest,
    isSendingRequest,
    isDeleting
  } = useDigitalSignature();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      signed: 'default',
      rejected: 'destructive',
      expired: 'secondary',
      draft: 'outline',
      sent: 'default',
      completed: 'default',
      cancelled: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      signed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      draft: 'bg-blue-100 text-blue-800',
      sent: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    } as const;

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status === 'pending' && 'Pendente'}
        {status === 'signed' && 'Assinado'}
        {status === 'rejected' && 'Rejeitado'}
        {status === 'expired' && 'Expirado'}
        {status === 'draft' && 'Rascunho'}
        {status === 'sent' && 'Enviado'}
        {status === 'completed' && 'Concluído'}
        {status === 'cancelled' && 'Cancelado'}
      </Badge>
    );
  };

  const handleSendRequest = async (requestId: string) => {
    try {
      await sendRequest(requestId);
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
      try {
        await deleteRequest(requestId);
      } catch (error) {
        console.error('Erro ao excluir solicitação:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Assinaturas Digitais</h1>
          <p className="text-muted-foreground">
            Gerencie solicitações de assinatura e validações
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Pendentes
                </p>
                <p className="text-2xl font-bold">
                  {signatureRequests.filter(r => r.status === 'sent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Concluídas
                </p>
                <p className="text-2xl font-bold">
                  {signatureRequests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Rascunhos
                </p>
                <p className="text-2xl font-bold">
                  {signatureRequests.filter(r => r.status === 'draft').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Canceladas
                </p>
                <p className="text-2xl font-bold">
                  {signatureRequests.filter(r => r.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {signatureRequests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma solicitação encontrada"
              description="Crie sua primeira solicitação de assinatura digital."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {signatureRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{request.title}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {request.message || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Signatários: {request.signers.length}
                          </span>
                          <span>
                            Assinados: {request.signers.filter(s => s.status === 'signed').length}
                          </span>
                          {request.deadline && (
                            <span>
                              Prazo: {new Date(request.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSignature(request);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {request.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(request.id)}
                            disabled={isSendingRequest}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Enviar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRequest(request.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="signatures" className="space-y-4">
          {signatures.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Nenhuma assinatura encontrada"
              description="As assinaturas aparecerão aqui quando os documentos forem assinados."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {signatures.map((signature) => (
                <Card key={signature.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {signature.signerName}
                          </h3>
                          {getStatusBadge(signature.status)}
                          <Badge variant="outline">
                            {signature.signatureType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {signature.signerEmail}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Data: {new Date(signature.timestamp).toLocaleString()}
                          </span>
                          <span>
                            Hash: {signature.signatureHash.slice(0, 20)}...
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSignature(signature);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateSignatureRequestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <SignatureDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        data={selectedSignature}
      />
    </div>
  );
}
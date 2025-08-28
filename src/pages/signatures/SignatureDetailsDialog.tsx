import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  User, 
  Calendar,
  Shield,
  Hash
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { DigitalSignature, SignatureRequest } from '../../types/digitalSignature';

interface SignatureDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SignatureRequest | DigitalSignature | null;
}

export function SignatureDetailsDialog({
  open,
  onOpenChange,
  data
}: SignatureDetailsDialogProps) {
  if (!data) return null;

  const isSignatureRequest = 'signers' in data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
      case 'sent':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(data.status)}
            {isSignatureRequest ? 'Detalhes da Solicitação' : 'Detalhes da Assinatura'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {isSignatureRequest ? data.title : `Assinatura de ${data.signerName}`}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {isSignatureRequest 
                        ? `Criado em ${new Date(data.createdAt).toLocaleString()}`
                        : `Assinado em ${new Date(data.timestamp).toLocaleString()}`
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documento: {data.documentId}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(data.status)}
                  {!isSignatureRequest && (
                    <Badge variant="outline">
                      {data.signatureType}
                    </Badge>
                  )}
                </div>
              </div>

              {isSignatureRequest && data.message && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-2">Mensagem:</p>
                    <p className="text-sm text-muted-foreground">{data.message}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Signature Request Details */}
          {isSignatureRequest && (
            <>
              {/* Request Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações da Solicitação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Fluxo de Assinatura</p>
                      <p className="text-sm text-muted-foreground">
                        {data.signatureFlow === 'parallel' ? 'Paralelo' : 'Sequencial'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Total de Signatários</p>
                      <p className="text-sm text-muted-foreground">
                        {data.signers.length}
                      </p>
                    </div>
                  </div>

                  {data.deadline && (
                    <div>
                      <p className="text-sm font-medium mb-1">Prazo Final</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(data.deadline).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Signers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Signatários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.signers.map((signer, index) => (
                      <div key={signer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{signer.name}</p>
                            <p className="text-sm text-muted-foreground">{signer.email}</p>
                            {data.signatureFlow === 'sequential' && (
                              <p className="text-xs text-muted-foreground">
                                Ordem: {signer.order}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(signer.status)}
                          {signer.signedAt && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(signer.signedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Digital Signature Details */}
          {!isSignatureRequest && (
            <>
              {/* Signer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Signatário</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Nome</p>
                      <p className="text-sm text-muted-foreground">{data.signerName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Email</p>
                      <p className="text-sm text-muted-foreground">{data.signerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">IP Address</p>
                      <p className="text-sm text-muted-foreground">{data.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Tipo de Assinatura</p>
                      <p className="text-sm text-muted-foreground">
                        {data.signatureType === 'simple' && 'Simples'}
                        {data.signatureType === 'advanced' && 'Avançada'}
                        {data.signatureType === 'qualified' && 'Qualificada'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Detalhes Técnicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Hash da Assinatura
                    </p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {data.signatureHash}
                    </p>
                  </div>

                  {data.certificateInfo && (
                    <div>
                      <p className="text-sm font-medium mb-2">Certificado Digital</p>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Emissor: </span>
                          <span className="text-muted-foreground">{data.certificateInfo.issuer}</span>
                        </div>
                        <div>
                          <span className="font-medium">Titular: </span>
                          <span className="text-muted-foreground">{data.certificateInfo.subject}</span>
                        </div>
                        <div>
                          <span className="font-medium">Número de Série: </span>
                          <span className="text-muted-foreground">{data.certificateInfo.serialNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium">Válido de: </span>
                          <span className="text-muted-foreground">
                            {new Date(data.certificateInfo.validFrom).toLocaleDateString()} até {' '}
                            {new Date(data.certificateInfo.validTo).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
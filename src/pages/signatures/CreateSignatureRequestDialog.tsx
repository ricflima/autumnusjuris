import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, Calendar, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useDigitalSignature } from '../../hooks/useDigitalSignature';

const signatureRequestSchema = z.object({
  documentId: z.string().min(1, 'Documento é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  message: z.string().optional(),
  deadline: z.string().optional(),
  signatureFlow: z.enum(['parallel', 'sequential']),
  signers: z.array(z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    order: z.number()
  })).min(1, 'Pelo menos um signatário é obrigatório')
});

type SignatureRequestForm = z.infer<typeof signatureRequestSchema>;

interface CreateSignatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSignatureRequestDialog({
  open,
  onOpenChange
}: CreateSignatureRequestDialogProps) {
  const { createRequest, isCreatingRequest } = useDigitalSignature();
  const [step, setStep] = useState(1);

  const form = useForm<SignatureRequestForm>({
    resolver: zodResolver(signatureRequestSchema),
    defaultValues: {
      documentId: '',
      title: '',
      message: '',
      signatureFlow: 'parallel',
      signers: [{ name: '', email: '', order: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'signers'
  });

  const onSubmit = async (data: SignatureRequestForm) => {
    try {
      await createRequest({
        documentId: data.documentId,
        requestedBy: 'current-user',
        title: data.title,
        message: data.message,
        deadline: data.deadline,
        signatureFlow: data.signatureFlow,
        signers: data.signers.map((signer, index) => ({
          id: `signer-${index}`,
          ...signer,
          status: 'pending' as const
        }))
      });
      
      form.reset();
      setStep(1);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
    }
  };

  const addSigner = () => {
    append({
      name: '',
      email: '',
      order: fields.length + 1
    });
  };

  const removeSigner = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Assinatura</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações do Documento</h3>
              
              <div>
                <Label htmlFor="documentId">Documento</Label>
                <Select 
                  value={form.watch('documentId')}
                  onValueChange={(value) => form.setValue('documentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doc-1">Contrato de Prestação de Serviços</SelectItem>
                    <SelectItem value="doc-2">Procuração Ad Judicia</SelectItem>
                    <SelectItem value="doc-3">Termo de Compromisso</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.documentId && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.documentId.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Título da Solicitação</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  placeholder="Ex: Assinatura do Contrato de Prestação de Serviços"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="message">Mensagem (Opcional)</Label>
                <Textarea
                  id="message"
                  {...form.register('message')}
                  placeholder="Mensagem personalizada para os signatários..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="deadline">Prazo (Opcional)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="deadline"
                    type="datetime-local"
                    {...form.register('deadline')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Fluxo de Assinatura</Label>
                <Select
                  value={form.watch('signatureFlow')}
                  onValueChange={(value: 'parallel' | 'sequential') => 
                    form.setValue('signatureFlow', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parallel">
                      Paralelo - Todos podem assinar simultaneamente
                    </SelectItem>
                    <SelectItem value="sequential">
                      Sequencial - Assinatura por ordem específica
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>
                  Próximo: Signatários
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Signatários</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSigner}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Signatário
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Signatário {index + 1}
                        </CardTitle>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSigner(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          {...form.register(`signers.${index}.name`)}
                          placeholder="Nome completo do signatário"
                        />
                        {form.formState.errors.signers?.[index]?.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.signers[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          {...form.register(`signers.${index}.email`)}
                          placeholder="email@exemplo.com"
                        />
                        {form.formState.errors.signers?.[index]?.email && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.signers[index]?.email?.message}
                          </p>
                        )}
                      </div>

                      {form.watch('signatureFlow') === 'sequential' && (
                        <div>
                          <Label>Ordem de Assinatura</Label>
                          <Input
                            type="number"
                            min="1"
                            {...form.register(`signers.${index}.order`, {
                              valueAsNumber: true
                            })}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={isCreatingRequest}>
                  {isCreatingRequest ? 'Criando...' : 'Criar Solicitação'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
import { Checkbox } from '../../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAIDocumentAnalysis } from '../../hooks/useAIDocumentAnalysis';
import { AnalysisType } from '../../types/aiDocumentAnalysis';

const startAnalysisSchema = z.object({
  documentId: z.string().min(1, 'Documento é obrigatório'),
  documentName: z.string().min(1, 'Nome do documento é obrigatório'),
  templateId: z.string().optional(),
  analysisTypes: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de análise')
});

type StartAnalysisForm = z.infer<typeof startAnalysisSchema>;

interface StartAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartAnalysisDialog({
  open,
  onOpenChange
}: StartAnalysisDialogProps) {
  const { templates, startAnalysis, isStartingAnalysis } = useAIDocumentAnalysis();
  const [selectedTypes, setSelectedTypes] = useState<AnalysisType[]>([]);

  const form = useForm<StartAnalysisForm>({
    resolver: zodResolver(startAnalysisSchema),
    defaultValues: {
      documentId: '',
      documentName: '',
      templateId: '',
      analysisTypes: []
    }
  });

  const analysisTypeOptions: { value: AnalysisType; label: string; description: string }[] = [
    { value: 'text_extraction', label: 'Extração de Texto', description: 'Extrai e organiza o texto do documento' },
    { value: 'contract_analysis', label: 'Análise de Contrato', description: 'Identifica cláusulas, riscos e obrigações' },
    { value: 'legal_classification', label: 'Classificação Legal', description: 'Classifica o tipo de documento jurídico' },
    { value: 'entity_recognition', label: 'Reconhecimento de Entidades', description: 'Identifica pessoas, organizações, datas e valores' },
    { value: 'sentiment_analysis', label: 'Análise de Sentimento', description: 'Avalia o tom e sentimento do documento' },
    { value: 'compliance_check', label: 'Verificação de Conformidade', description: 'Verifica conformidade com regulamentações' },
    { value: 'risk_assessment', label: 'Avaliação de Riscos', description: 'Identifica potenciais riscos legais' },
    { value: 'clause_extraction', label: 'Extração de Cláusulas', description: 'Extrai e categoriza cláusulas contratuais' },
    { value: 'date_extraction', label: 'Extração de Datas', description: 'Identifica datas importantes e prazos' },
    { value: 'signature_verification', label: 'Verificação de Assinatura', description: 'Verifica assinaturas e certificados' }
  ];

  const mockDocuments = [
    { id: 'doc-1', name: 'Contrato de Prestação de Serviços.pdf' },
    { id: 'doc-2', name: 'Procuração Ad Judicia.pdf' },
    { id: 'doc-3', name: 'Termo de Compromisso.pdf' },
    { id: 'doc-4', name: 'Petição Inicial.pdf' }
  ];

  const handleTypeToggle = (type: AnalysisType, checked: boolean) => {
    const newTypes = checked 
      ? [...selectedTypes, type]
      : selectedTypes.filter(t => t !== type);
    
    setSelectedTypes(newTypes);
    form.setValue('analysisTypes', newTypes);
  };

  const handleTemplateChange = (templateId: string) => {
    form.setValue('templateId', templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTypes(template.analysisTypes);
        form.setValue('analysisTypes', template.analysisTypes);
      }
    }
  };

  const onSubmit = async (data: StartAnalysisForm) => {
    try {
      await startAnalysis({
        documentId: data.documentId,
        documentName: data.documentName,
        analysisTypes: selectedTypes,
        templateId: data.templateId || undefined
      });
      
      form.reset();
      setSelectedTypes([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao iniciar análise:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Nova Análise com IA
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Documento */}
          <div className="space-y-3">
            <Label>Documento para Análise</Label>
            <Select
              value={form.watch('documentId')}
              onValueChange={(value) => {
                form.setValue('documentId', value);
                const doc = mockDocuments.find(d => d.id === value);
                if (doc) {
                  form.setValue('documentName', doc.name);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um documento" />
              </SelectTrigger>
              <SelectContent>
                {mockDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {doc.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.documentId && (
              <p className="text-sm text-red-600">
                {form.formState.errors.documentId.message}
              </p>
            )}
          </div>

          {/* Template */}
          <div className="space-y-3">
            <Label>Template de Análise (Opcional)</Label>
            <Select
              value={form.watch('templateId')}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template ou configure manualmente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  Configuração manual
                </SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.analysisTypes.length} tipos de análise
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipos de Análise */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Tipos de Análise</Label>
              <p className="text-sm text-muted-foreground">
                Selecione os tipos de análise que deseja executar
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisTypeOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`cursor-pointer transition-colors ${
                    selectedTypes.includes(option.value) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTypeToggle(
                    option.value, 
                    !selectedTypes.includes(option.value)
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTypes.includes(option.value)}
                        onCheckedChange={() => {}}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{option.label}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {form.formState.errors.analysisTypes && (
              <p className="text-sm text-red-600">
                {form.formState.errors.analysisTypes.message}
              </p>
            )}
          </div>

          {/* Summary */}
          {selectedTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Resumo da Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>{selectedTypes.length}</strong> tipos de análise selecionados
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedTypes.map((type) => {
                    const option = analysisTypeOptions.find(o => o.value === type);
                    return (
                      <span
                        key={type}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {option?.label}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempo estimado: 3-5 minutos
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isStartingAnalysis || selectedTypes.length === 0}>
              {isStartingAnalysis ? 'Iniciando...' : 'Iniciar Análise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import React from 'react';
import { 
  Brain, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Download,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  DollarSign
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { Separator } from '../../components/ui/separator';
import { DocumentAnalysis, ContractAnalysisResult } from '../../types/aiDocumentAnalysis';

interface AnalysisResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: DocumentAnalysis | null;
}

export function AnalysisResultsDialog({
  open,
  onOpenChange,
  analysis
}: AnalysisResultsDialogProps) {
  if (!analysis) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    const color = confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                  confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800';
    
    return (
      <Badge className={color}>
        {Math.round(confidence * 100)}% confiança
      </Badge>
    );
  };

  const contractResult = analysis.results.find(r => r.type === 'contract_analysis');
  const entityResult = analysis.results.find(r => r.type === 'entity_recognition');
  const sentimentResult = analysis.results.find(r => r.type === 'sentiment_analysis');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Resultados da Análise - {analysis.documentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Análise Concluída
                  </h3>
                  <p className="text-muted-foreground">
                    Processamento concluído em {Math.round(analysis.processingTime / 1000)}s
                  </p>
                </div>
                <div className="text-right">
                  {getConfidenceBadge(analysis.confidence)}
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysis.completedAt && new Date(analysis.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{analysis.results.length}</p>
                  <p className="text-sm text-muted-foreground">Análises</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{Math.round(analysis.confidence * 100)}%</p>
                  <p className="text-sm text-muted-foreground">Confiança</p>
                </div>
                <div className="text-center">
                  <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {contractResult?.data?.clauses?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Cláusulas</p>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {contractResult?.data?.parties?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Partes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="contract" disabled={!contractResult}>Contrato</TabsTrigger>
              <TabsTrigger value="entities" disabled={!entityResult}>Entidades</TabsTrigger>
              <TabsTrigger value="highlights">Destaques</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.results.map((result, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="capitalize">
                          {result.type.replace('_', ' ')}
                        </span>
                        {getConfidenceBadge(result.confidence)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {result.summary}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Confiança:</span>
                          <span className={getConfidenceColor(result.confidence)}>
                            {Math.round(result.confidence * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={result.confidence * 100} 
                          className="h-2"
                        />
                      </div>

                      {result.highlights.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium mb-1">
                            {result.highlights.length} destaque(s) encontrado(s)
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {result.highlights[0].text.substring(0, 100)}...
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {contractResult && (
              <TabsContent value="contract" className="space-y-4">
                <ContractAnalysisTab result={contractResult.data as ContractAnalysisResult} />
              </TabsContent>
            )}

            {entityResult && (
              <TabsContent value="entities" className="space-y-4">
                <EntityAnalysisTab result={entityResult.data} />
              </TabsContent>
            )}

            <TabsContent value="highlights" className="space-y-4">
              <HighlightsTab results={analysis.results} />
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Ver Documento
              </Button>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContractAnalysisTab({ result }: { result: ContractAnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Tipo</p>
            <p className="text-sm text-muted-foreground">{result.contractType}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total de Cláusulas</p>
            <p className="text-sm text-muted-foreground">{result.clauses?.length || 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* Parties */}
      {result.parties && result.parties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Partes do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.parties.map((party, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{party.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{party.role}</p>
                  {party.document && (
                    <p className="text-xs text-muted-foreground">{party.document}</p>
                  )}
                </div>
                <Badge variant="outline">
                  {party.type === 'company' ? 'Empresa' : 'Pessoa Física'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Important Dates */}
      {result.dates && result.dates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Datas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.dates.map((date, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{date.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(date.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {date.isUrgent && (
                    <Badge variant="destructive" className="mb-1">Urgente</Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {date.daysFromNow > 0 ? `Em ${date.daysFromNow} dias` : 'Expirado'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risks */}
      {result.risks && result.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Riscos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.risks.map((risk, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{risk.description}</h4>
                  <Badge 
                    variant={risk.level === 'high' ? 'destructive' : 'secondary'}
                    className={
                      risk.level === 'high' ? 'bg-red-100 text-red-800' :
                      risk.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }
                  >
                    {risk.level === 'high' ? 'Alto' : risk.level === 'medium' ? 'Médio' : 'Baixo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{risk.impact}</p>
                {risk.mitigation && risk.mitigation.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Mitigações:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {risk.mitigation.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EntityAnalysisTab({ result }: { result: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Entidades Reconhecidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{result.summary}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.entities?.map((entity: any, index: number) => (
              <div key={index} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{entity.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(entity.confidence * 100)}%
                  </span>
                </div>
                <p className="font-medium text-sm">{entity.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HighlightsTab({ results }: { results: any[] }) {
  const allHighlights = results.flatMap(result => 
    result.highlights?.map((h: any) => ({ ...h, analysisType: result.type })) || []
  );

  return (
    <div className="space-y-4">
      {allHighlights.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum destaque encontrado</p>
          </CardContent>
        </Card>
      ) : (
        allHighlights.map((highlight, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="capitalize">
                  {highlight.type.replace('_', ' ')}
                </Badge>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {highlight.analysisType.replace('_', ' ')}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(highlight.confidence * 100)}% confiança
                  </p>
                </div>
              </div>
              <p className="text-sm bg-gray-50 p-2 rounded">{highlight.text}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Posição: {highlight.startPosition} - {highlight.endPosition}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
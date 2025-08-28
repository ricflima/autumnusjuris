import React, { useState } from 'react';
import { 
  Brain, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  Eye,
  Trash2,
  Zap,
  BarChart3
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { useAIDocumentAnalysis } from '../../hooks/useAIDocumentAnalysis';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { DocumentAnalysis } from '../../types/aiDocumentAnalysis';
import { StartAnalysisDialog } from './StartAnalysisDialog';
import { AnalysisResultsDialog } from './AnalysisResultsDialog';

export function AIDocumentAnalysis() {
  const {
    analyses,
    models,
    templates,
    isLoading,
    deleteAnalysis,
    exportReport,
    isDeletingAnalysis,
    isExportingReport
  } = useAIDocumentAnalysis();

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<DocumentAnalysis | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    } as const;

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.processing}>
        {status === 'processing' && 'Processando'}
        {status === 'completed' && 'Concluído'}
        {status === 'failed' && 'Falhou'}
      </Badge>
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewResults = (analysis: DocumentAnalysis) => {
    setSelectedAnalysis(analysis);
    setShowResultsDialog(true);
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta análise?')) {
      try {
        await deleteAnalysis(analysisId);
      } catch (error) {
        console.error('Erro ao excluir análise:', error);
      }
    }
  };

  const handleExportReport = async (analysisId: string, format: 'pdf' | 'docx' | 'json') => {
    try {
      const reportUrl = await exportReport({ analysisId, format });
      // Simular download
      window.open(reportUrl, '_blank');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  const completedAnalyses = analyses.filter(a => a.status === 'completed');
  const processingAnalyses = analyses.filter(a => a.status === 'processing');
  const failedAnalyses = analyses.filter(a => a.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-blue-600" />
            IA para Análise de Documentos
          </h1>
          <p className="text-muted-foreground">
            Análise inteligente de contratos, petições e documentos jurídicos
          </p>
        </div>
        <Button onClick={() => setShowStartDialog(true)}>
          <Zap className="w-4 h-4 mr-2" />
          Nova Análise
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Concluídas
                </p>
                <p className="text-2xl font-bold">{completedAnalyses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Processando
                </p>
                <p className="text-2xl font-bold">{processingAnalyses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Modelos IA
                </p>
                <p className="text-2xl font-bold">{models.filter(m => m.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Confiança Média
                </p>
                <p className="text-2xl font-bold">
                  {completedAnalyses.length > 0 
                    ? Math.round(
                        completedAnalyses.reduce((acc, a) => acc + a.confidence, 0) / 
                        completedAnalyses.length * 100
                      ) + '%'
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="analyses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analyses">Análises</TabsTrigger>
          <TabsTrigger value="models">Modelos IA</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="space-y-4">
          {analyses.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="Nenhuma análise encontrada"
              description="Inicie sua primeira análise de documento com IA."
            />
          ) : (
            <div className="space-y-4">
              {/* Processing Analyses */}
              {processingAnalyses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Processando</h3>
                  {processingAnalyses.map((analysis) => (
                    <Card key={analysis.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(analysis.status)}
                              <h3 className="text-lg font-semibold">{analysis.documentName}</h3>
                              {getStatusBadge(analysis.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>Tipos: {analysis.analysisType.join(', ')}</span>
                              <span>Iniciado: {new Date(analysis.createdAt).toLocaleString()}</span>
                            </div>
                            <Progress value={65} className="w-full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Completed Analyses */}
              {completedAnalyses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Concluídas</h3>
                  {completedAnalyses.map((analysis) => (
                    <Card key={analysis.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(analysis.status)}
                              <h3 className="text-lg font-semibold">{analysis.documentName}</h3>
                              {getStatusBadge(analysis.status)}
                              <Badge variant="outline">
                                <span className={getConfidenceColor(analysis.confidence)}>
                                  {Math.round(analysis.confidence * 100)}% confiança
                                </span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span>Tipos: {analysis.analysisType.join(', ')}</span>
                              <span>Concluído: {analysis.completedAt && new Date(analysis.completedAt).toLocaleString()}</span>
                              <span>Tempo: {Math.round(analysis.processingTime / 1000)}s</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {analysis.results.length} resultados de análise
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResults(analysis)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportReport(analysis.id, 'pdf')}
                              disabled={isExportingReport}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAnalysis(analysis.id)}
                              disabled={isDeletingAnalysis}
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

              {/* Failed Analyses */}
              {failedAnalyses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Com Falha</h3>
                  {failedAnalyses.map((analysis) => (
                    <Card key={analysis.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(analysis.status)}
                              <h3 className="text-lg font-semibold">{analysis.documentName}</h3>
                              {getStatusBadge(analysis.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span>Tipos: {analysis.analysisType.join(', ')}</span>
                              <span>Falhou em: {new Date(analysis.createdAt).toLocaleString()}</span>
                            </div>
                            {analysis.error && (
                              <p className="text-sm text-red-600">{analysis.error}</p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            disabled={isDeletingAnalysis}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge variant={model.isActive ? 'default' : 'secondary'}>
                      {model.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Versão</p>
                      <p className="text-muted-foreground">{model.version}</p>
                    </div>
                    <div>
                      <p className="font-medium">Precisão</p>
                      <p className="text-muted-foreground">{Math.round(model.accuracy * 100)}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">Idiomas</p>
                    <div className="flex flex-wrap gap-1">
                      {model.supportedLanguages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tipo</p>
                    <p className="text-muted-foreground text-sm">{model.type}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Badge>Padrão</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div>
                    <p className="font-medium text-sm mb-2">Tipos de Análise</p>
                    <div className="flex flex-wrap gap-1">
                      {template.analysisTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-2">Tipos de Documento</p>
                    <div className="flex flex-wrap gap-1">
                      {template.documentTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <StartAnalysisDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
      />

      <AnalysisResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        analysis={selectedAnalysis}
      />
    </div>
  );
}
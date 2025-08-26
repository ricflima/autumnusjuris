// src/pages/documents/DocumentViewer.tsx

import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share2,
  Edit,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  FileText,
  Lock,
  Calendar,
  User,
  FolderOpen,
  Tag,
  Eye,
  MessageCircle,
  Star,
  MoreHorizontal,
  ExternalLink,
  Copy,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

import { useDocument, useDeleteDocument, useProcessOcr } from '@/hooks/useDocuments';
import { documentsService } from '@/services/documents.service';

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('viewer');

  const { data: document, isLoading, error, refetch } = useDocument(id);
  const deleteDocumentMutation = useDeleteDocument();
  const processOcrMutation = useProcessOcr();

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      deleteDocumentMutation.mutate(id!, {
        onSuccess: () => {
          navigate('/documents');
        }
      });
    }
  };

  const handleDownload = () => {
    if (document?.downloadUrl) {
      window.open(document.downloadUrl, '_blank');
    }
  };

  const handleShare = () => {
    // Implementar modal de compartilhamento
    console.log('Share document', document?.id);
  };

  const handleProcessOcr = () => {
    if (id) {
      processOcrMutation.mutate(id);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return documentsService.formatFileSize(bytes);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Documento não encontrado
        </h2>
        <p className="text-gray-600 mb-4">
          O documento solicitado não existe ou foi removido.
        </p>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Documentos
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const renderViewer = () => {
    if (document.fileType === 'pdf') {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`${document.viewUrl}#zoom=${zoom}&rotate=${rotation}`}
            className="w-full h-full border-0"
            title={document.title}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />
        </div>
      );
    }

    if (document.fileType.startsWith('image')) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src={document.url}
            alt={document.title}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />
        </div>
      );
    }

    // Para outros tipos de arquivo
    return (
      <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Visualização não disponível
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Este tipo de arquivo não pode ser visualizado no navegador.
          <br />
          Faça o download para abrir em um aplicativo apropriado.
        </p>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/documents')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              
              <div>
                <h1 className="font-semibold text-gray-900 truncate max-w-md">
                  {document.title}
                </h1>
                <p className="text-sm text-gray-500 truncate">
                  {document.fileName} • {formatFileSize(document.fileSize)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Viewer Controls */}
            {(document.fileType === 'pdf' || document.fileType.startsWith('image')) && (
              <>
                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            {/* Action Buttons */}
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/documents/${id}/edit`}>
                <Edit className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewer Area */}
        <div className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mb-4 w-fit">
              <TabsTrigger value="viewer">Visualizar</TabsTrigger>
              {document.ocrText && (
                <TabsTrigger value="text">Texto</TabsTrigger>
              )}
              <TabsTrigger value="versions">Versões</TabsTrigger>
            </TabsList>

            <div className="flex-1">
              <TabsContent value="viewer" className="h-full m-0">
                {renderViewer()}
              </TabsContent>

              <TabsContent value="text" className="h-full m-0">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Texto Extraído (OCR)</CardTitle>
                      {!document.isOcrProcessed && (
                        <Button
                          size="sm"
                          onClick={handleProcessOcr}
                          disabled={processOcrMutation.isPending}
                        >
                          {processOcrMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            'Processar OCR'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    {document.ocrText ? (
                      <div className="whitespace-pre-wrap text-sm">
                        {document.ocrText}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {processOcrMutation.isPending ? (
                          <div>
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p>Processando texto do documento...</p>
                          </div>
                        ) : (
                          <div>
                            <FileText className="w-8 h-8 mx-auto mb-2" />
                            <p>Texto não extraído ainda.</p>
                            <p className="text-sm">Clique em "Processar OCR" para extrair o texto.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="h-full m-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Histórico de Versões</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {document.versions.map((version, index) => (
                      <div
                        key={version.id}
                        className={`
                          flex items-center p-3 border rounded-lg
                          ${version.isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}
                        `}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              Versão {version.version}
                            </span>
                            {version.isActive && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                Atual
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            {formatFileSize(version.fileSize)} • {formatDate(version.uploadedAt)}
                          </p>
                          
                          {version.changes && (
                            <p className="text-sm text-gray-500 mt-1">
                              {version.changes}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(version.fileUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l p-4 overflow-auto">
          <div className="space-y-6">
            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge 
                      className={`ml-2 ${documentsService.getStatusColor(document.status)}`}
                    >
                      {documentsService.getStatusLabel(document.status)}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Segurança:</span>
                    <Badge 
                      className={`ml-2 ${documentsService.getSecurityColor(document.security)}`}
                    >
                      {document.security === 'restricted' && <Lock className="w-3 h-3 mr-1" />}
                      {documentsService.getSecurityLabel(document.security)}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-gray-500">Categoria:</span>
                    <span className="ml-2 font-medium">
                      {documentsService.getCategoryLabel(document.category)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div>Criado em {formatDate(document.createdAt)}</div>
                      {document.updatedAt !== document.createdAt && (
                        <div className="text-gray-500">
                          Modificado em {formatDate(document.updatedAt ?? "")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Criado por {document.createdBy}</span>
                  </div>

                  {document.folderId && (
                    <div className="flex items-center">
                      <FolderOpen className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{document.folderPath}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Eye className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{document.accessCount} visualizações</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {document.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-sm">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Cases */}
            {document.caseId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Casos Relacionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Link
                      to={`/cases/${document.caseId}`}
                      className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        {document.caseName}
                      </span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Digital Signature */}
            {document.isDigitallySigned && document.signatureInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-green-600" />
                    Assinatura Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Assinado por:</span>
                    <span className="ml-2 font-medium">{document.signatureInfo.signedBy}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <span className="ml-2">{formatDate(document.signatureInfo.signedAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">Status:</span>
                    <Badge 
                      className={`ml-2 ${document.signatureInfo.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {document.signatureInfo.isValid ? 'Válida' : 'Inválida'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {document.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {document.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
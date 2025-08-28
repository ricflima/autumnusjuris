// src/pages/documents/DocumentViewer.tsx - VERSÃO CORRIGIDA

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

  // CORRIGIDO: Renomear para documentData para evitar conflito
  const { data: documentData, isLoading, error, refetch } = useDocument(id);
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

  const handleDownload = async () => {
    if (!documentData) return;
    
    try {
      // Simular download criando um arquivo mock
      const mockContent = `Documento: ${documentData.title}\n\nTipo: ${documentData.category}\nTamanho: ${formatFileSize(documentData.fileSize)}\nCriado em: ${formatDate(documentData.createdAt)}\n\nEste é um documento simulado do sistema AutumnusJuris.\nO conteúdo real seria carregado do servidor.`;
      
      const blob = new Blob([mockContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${documentData.fileName || documentData.title}.txt`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // No toast here since this is just functionality
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const handleShare = () => {
    if (!documentData) return;
    
    const shareUrl = `${window.location.origin}/documents/${documentData.id}`;
    const shareText = `Documento: ${documentData.title}\nTipo: ${documentData.category}\nTamanho: ${formatFileSize(documentData.fileSize)}\n\nVisualize em: ${shareUrl}`;
    
    const shareData = {
      title: `Documento - ${documentData.title}`,
      text: shareText,
      url: shareUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).then(() => {
        console.log('Documento compartilhado com sucesso!');
      }).catch((error) => {
        console.log('Erro ao compartilhar:', error);
        fallbackShare(documentData, shareUrl, shareText);
      });
    } else {
      fallbackShare(documentData, shareUrl, shareText);
    }
  };

  const fallbackShare = (document: any, shareUrl: string, shareText: string) => {
    // Criar modal de compartilhamento
    const shareModal = window.document.createElement('div');
    shareModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    shareModal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Compartilhar Documento</h3>
        <p style="margin: 0 0 16px 0; color: #666;">${document.title}</p>
        <textarea readonly style="width: 100%; height: 120px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px; resize: none; margin-bottom: 16px;">${shareText}</textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button onclick="navigator.clipboard.writeText('${shareText}').then(() => { alert('Texto copiado!'); this.parentElement.parentElement.parentElement.remove(); })" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Copiar Texto</button>
          <button onclick="navigator.clipboard.writeText('${shareUrl}').then(() => { alert('Link copiado!'); this.parentElement.parentElement.parentElement.remove(); })" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Copiar Link</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar</button>
        </div>
      </div>
    `;
    
    window.document.body.appendChild(shareModal);
    
    // Remover modal ao clicar fora
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        shareModal.remove();
      }
    });
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

  // CORRIGIDO: Usar window.document para acessar APIs do DOM
  const toggleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      window.document.exitFullscreen?.();
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

  if (error || !documentData) {
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
    if (documentData.fileType === 'pdf') {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`${documentData.viewUrl}#zoom=${zoom}&rotate=${rotation}`}
            className="w-full h-full border-0"
            title={documentData.title}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />
        </div>
      );
    }

    if (documentData.fileType.startsWith('image')) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src={documentData.url}
            alt={documentData.title}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gray-50 rounded-lg flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Visualização não disponível
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Este tipo de arquivo não pode ser visualizado no navegador.<br />
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
                  {documentData.title}
                </h1>
                <p className="text-sm text-gray-500 truncate">
                  {documentData.fileName} • {formatFileSize(documentData.fileSize)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Viewer Controls */}
            {(documentData.fileType === 'pdf' || documentData.fileType.startsWith('image')) && (
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
        <div className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mb-4 w-fit">
              <TabsTrigger value="viewer">Visualizar</TabsTrigger>
              {documentData.ocrText && (
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
                      {!documentData.isOcrProcessed && (
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
                            'Extrair Texto'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="h-full overflow-auto">
                    {documentData.ocrText ? (
                      <pre className="whitespace-pre-wrap text-sm">
                        {documentData.ocrText}
                      </pre>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Texto ainda não extraído.</p>
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
                  <CardContent className="overflow-auto">
                    <div className="space-y-4">
                      {documentData.versions.map((version) => (
                        <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${version.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div>
                              <p className="font-medium">Versão {version.version}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(version.uploadedAt)} por {version.uploadedBy}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {formatFileSize(version.fileSize)}
                            </span>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sidebar com informações do documento */}
        <div className="w-80 bg-white border-l p-4 overflow-auto">
          <div className="space-y-4">
            {/* Informações básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <span className="text-gray-500">Status:</span>
                    <Badge className={`ml-2 ${documentsService.getStatusColor(documentData.status)}`}>
                      {documentsService.getStatusLabel(documentData.status)}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-gray-500">Prioridade:</span>
                    <span className={`ml-2 font-medium ${documentsService.getPriorityColor(documentData.priority)}`}>
                      {documentsService.getPriorityLabel(documentData.priority)}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-gray-500">Segurança:</span>
                    <Badge 
                      className={`ml-2 ${documentsService.getSecurityColor(documentData.security)}`}
                    >
                      {documentData.security === 'restricted' && <Lock className="w-3 h-3 mr-1" />}
                      {documentsService.getSecurityLabel(documentData.security)}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-gray-500">Categoria:</span>
                    <span className="ml-2 font-medium">
                      {documentsService.getCategoryLabel(documentData.category)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div>Criado em {formatDate(documentData.createdAt)}</div>
                      {documentData.updatedAt !== documentData.createdAt && (
                        <div className="text-gray-500">
                          Modificado em {formatDate(documentData.updatedAt ?? "")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Criado por {documentData.createdBy}</span>
                  </div>

                  {documentData.folderId && (
                    <div className="flex items-center">
                      <FolderOpen className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{documentData.folderPath}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Eye className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{documentData.accessCount} visualizações</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {documentData.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {documentData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assinatura digital - CORRIGIDO: Verificação de undefined */}
            {documentData.isDigitallySigned && documentData.signatureInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assinatura Digital</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Assinado por:</span>
                      <span className="ml-2 font-medium">{documentData.signatureInfo.signedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Data:</span>
                      <span className="ml-2">{formatDate(documentData.signatureInfo.signedAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500">Status:</span>
                      <Badge 
                        className={`ml-2 ${documentData.signatureInfo.isValid 
                          ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {documentData.signatureInfo.isValid ? 'Válida' : 'Inválida'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {documentData.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {documentData.description}
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
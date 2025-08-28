// src/pages/documents/DocumentsList.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Search,
  Filter,
  FolderPlus,
  List,
  Download,
  Share2,
  Trash2,
  Eye,
  MoreHorizontal,
  Star,
  Lock,
  FileIcon,
  Calendar,
  User,
  Tag,
  ChevronRight,
  FolderOpen,
  Plus,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

import { useDocuments, useFolders, useDeleteDocument, useDocumentStats, useCreateFolder } from '@/hooks/useDocuments';
import { documentsService } from '@/services/documents.service';
import { DocumentFilters, Document, DocumentFolder } from '@/types/documents';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Data de Criação' },
  { value: 'updatedAt', label: 'Última Modificação' },
  { value: 'fileName', label: 'Nome do Arquivo' },
  { value: 'title', label: 'Título' },
  { value: 'fileSize', label: 'Tamanho' },
  { value: 'category', label: 'Categoria' },
];

export default function DocumentsList() {
  const [filters, setFilters] = useState<DocumentFilters>({
    page: 1,
    limit: 24,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [viewMode] = useState<'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  const { data: documentsData, isLoading, error, refetch } = useDocuments(filters);
  const { data: foldersData } = useFolders();
  const { data: stats } = useDocumentStats();
  const deleteDocumentMutation = useDeleteDocument();
  const createFolderMutation = useCreateFolder();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  const handleFolderSelect = (folderId: string | undefined) => {
    setSelectedFolder(folderId);
    setFilters(prev => ({
      ...prev,
      folderId,
      page: 1
    }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      // Simular download criando um arquivo mock
      const mockContent = `Documento: ${document.title}\n\nTipo: ${document.category}\nTamanho: ${formatFileSize(document.fileSize)}\nCriado em: ${formatDate(document.createdAt)}\n\nEste é um documento simulado do sistema AutumnusJuris.\nO conteúdo real seria carregado do servidor.`;
      
      const blob = new Blob([mockContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.fileName || document.title}.txt`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast.error('Erro ao fazer download do documento');
    }
  };

  const handleShareDocument = (document: Document) => {
    const shareUrl = `${window.location.origin}/documents/${document.id}`;
    const shareText = `Documento: ${document.title}\nTipo: ${document.category}\nTamanho: ${formatFileSize(document.fileSize)}\n\nVisualize em: ${shareUrl}`;
    
    const shareData = {
      title: `Documento - ${document.title}`,
      text: shareText,
      url: shareUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).then(() => {
        toast.success('Documento compartilhado com sucesso!');
      }).catch((error) => {
        console.log('Erro ao compartilhar:', error);
        fallbackShare(document, shareUrl, shareText);
      });
    } else {
      fallbackShare(document, shareUrl, shareText);
    }
  };

  const fallbackShare = (document: Document, shareUrl: string, shareText: string) => {
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
    
    toast.success('Modal de compartilhamento aberto!');
  };

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments(prev =>
      prev.includes(id)
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
  };

  const selectAllDocuments = () => {
    if (!documentsData?.documents) return;
    
    const allIds = documentsData.documents.map(doc => doc.id);
    setSelectedDocuments(prev =>
      prev.length === allIds.length ? [] : allIds
    );
  };

  const formatFileSize = (bytes: number) => {
    return documentsService.formatFileSize(bytes);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
        parentId: selectedFolder
      });
      
      setShowNewFolderModal(false);
      setNewFolderName('');
      setNewFolderDescription('');
      toast.success('Pasta criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar pasta');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderBreadcrumb = () => {
    const folder = foldersData?.folders.find(f => f.id === selectedFolder);
    
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <button
          onClick={() => handleFolderSelect(undefined)}
          className="hover:text-gray-900 transition-colors"
        >
          Todos os Documentos
        </button>
        {folder && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">{folder.name}</span>
          </>
        )}
      </div>
    );
  };

  const renderDocumentCard = (document: Document) => {
    const isSelected = selectedDocuments.includes(document.id);
    
    if (viewMode === 'list') {
      return (
        <div
          key={document.id}
          className={`
            flex items-center p-4 bg-white rounded-lg border hover:border-blue-300 transition-all
            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          `}
        >
          <div className="flex items-center flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleDocumentSelection(document.id)}
              className="mr-3 rounded"
            />
            
            <div className="flex-shrink-0 mr-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {document.title}
                </h3>
                <Badge
                  variant="secondary"
                  className={documentsService.getStatusColor(document.status)}
                >
                  {documentsService.getStatusLabel(document.status)}
                </Badge>
                {document.isDigitallySigned && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <Lock className="w-3 h-3 mr-1" />
                    Assinado
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span>{document.fileName}</span>
                <span>{formatFileSize(document.fileSize)}</span>
                <span>{documentsService.getCategoryLabel(document.category)}</span>
                <span>{formatDate(document.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/documents/${document.id}`}>
                <Eye className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownloadDocument(document);
              }}
              type="button"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleShareDocument(document)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDocument(document.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Card
        key={document.id}
        className={`
          relative group cursor-pointer transition-all hover:shadow-lg
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        `}
      >
        <CardContent className="p-4">
          <div className="absolute top-3 right-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleDocumentSelection(document.id)}
              className="rounded"
            />
          </div>
          
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <FileIcon className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {document.title}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {document.fileName}
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatFileSize(document.fileSize)}</span>
              <span>{formatDate(document.createdAt)}</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              <Badge
                variant="secondary"
                className={`text-xs ${documentsService.getStatusColor(document.status)}`}
              >
                {documentsService.getStatusLabel(document.status)}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {documentsService.getCategoryLabel(document.category)}
              </Badge>
              
              {document.isDigitallySigned && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  <Lock className="w-3 h-3 mr-1" />
                  Assinado
                </Badge>
              )}
            </div>
            
            {document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {document.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{document.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/documents/${document.id}`}>
                  <Eye className="w-4 h-4" />
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownloadDocument(document);
                }}
                type="button"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleShareDocument(document)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDocument(document.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">Erro ao carregar documentos</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">
            Gerencie todos os seus documentos jurídicos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link to="/documents/upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Link>
          </Button>
          
          <Button variant="outline" onClick={() => setShowNewFolderModal(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Nova Pasta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Upload className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                  <p className="text-2xl font-bold">{stats.recentUploads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FolderOpen className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pastas</p>
                  <p className="text-2xl font-bold">{foldersData?.folders.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">MB</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tamanho Total</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(stats.totalSize)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
        </div>
      </div>

      {/* Folders Navigation */}
      {foldersData?.folders && foldersData.folders.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Button
            variant={!selectedFolder ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFolderSelect(undefined)}
            className="whitespace-nowrap"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Todos
          </Button>
          
          {foldersData.folders.map(folder => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFolderSelect(folder.id)}
              className="whitespace-nowrap"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {folder.name}
              <Badge variant="secondary" className="ml-2">
                {folder.documentsCount}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Filtros Expandidos */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Filtros Avançados</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use a busca acima para filtrar documentos por nome, ou selecione uma pasta específica.
            </p>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {selectedDocuments.length} documento(s) selecionado(s)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDocuments([])}>
                Limpar seleção
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download em Lote
              </Button>
              
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <div className="flex items-center space-x-1">
            {SORT_OPTIONS.map(option => (
              <Button
                key={option.value}
                variant={filters.sortBy === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSortChange(option.value)}
                className="text-xs"
              >
                {option.label}
                {filters.sortBy === option.value && (
                  filters.sortOrder === 'desc' ? 
                    <SortDesc className="w-3 h-3 ml-1" /> : 
                    <SortAsc className="w-3 h-3 ml-1" />
                )}
              </Button>
            ))}
          </div>
        </div>
        
        {documentsData && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllDocuments}
            >
              {selectedDocuments.length === documentsData.documents.length ? 
                'Desmarcar Todos' : 'Selecionar Todos'
              }
            </Button>
            
            <span className="text-sm text-gray-600">
              {documentsData.documents.length} de {documentsData.total} documento(s)
            </span>
          </div>
        )}
      </div>

      {/* Documents Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documentsData?.documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum documento encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedFolder 
              ? 'Tente ajustar os filtros de busca.'
              : 'Faça upload do seu primeiro documento para começar.'
            }
          </p>
          
          {!searchTerm && !selectedFolder && (
            <Button asChild>
              <Link to="/documents/upload">
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {documentsData?.documents.map(renderDocumentCard)}
          </div>

          {/* Pagination */}
          {documentsData && documentsData.total > (filters.limit || 24) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Itens por página:</span>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    limit: Number(e.target.value),
                    page: 1 
                  }))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({
                    length: Math.min(5, Math.ceil(documentsData.total / (filters.limit || 24)))
                  }, (_, i) => {
                    const currentPage = filters.page || 1;
                    const totalPages = Math.ceil(documentsData.total / (filters.limit || 24));
                    
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!documentsData.hasMore}
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                >
                  Próxima
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                Mostrando {((filters.page || 1) - 1) * (filters.limit || 24) + 1} até{' '}
                {Math.min((filters.page || 1) * (filters.limit || 24), documentsData.total)} de{' '}
                {documentsData.total} documentos
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal para criar nova pasta */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5" />
                  Nova Pasta
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                    setNewFolderDescription('');
                  }}
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newFolderName">Nome da Pasta *</Label>
                <Input
                  id="newFolderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Digite o nome da pasta"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="newFolderDescription">Descrição (Opcional)</Label>
                <Input
                  id="newFolderDescription"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="Digite uma descrição para a pasta"
                />
              </div>
              {selectedFolder && (
                <div className="text-sm text-gray-600">
                  Pasta será criada em: <Badge variant="secondary">{foldersData?.folders.find(f => f.id === selectedFolder)?.name || 'Pasta atual'}</Badge>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                    setNewFolderDescription('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? 'Criando...' : 'Criar Pasta'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
// src/components/documents/CaseDocumentsManager.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  FileText,
  FolderIcon,
  FolderPlus,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';

import { documentsService } from '@/services/documents.service';
import { 
  Document, 
  DocumentFolder, 
  DocumentFilters,
  CreateFolderRequest,
  FolderContext 
} from '@/types/documents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CaseDocumentsManagerProps {
  caseId: string;
  caseName: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';

interface CreateFolderFormData {
  name: string;
  description: string;
}

export function CaseDocumentsManager({ 
  caseId, 
  caseName, 
  className = '' 
}: CaseDocumentsManagerProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderData, setNewFolderData] = useState<CreateFolderFormData>({
    name: '',
    description: ''
  });

  // Buscar pastas do caso
  const { 
    data: foldersData,
    isLoading: foldersLoading 
  } = useQuery({
    queryKey: ['case-folders', caseId],
    queryFn: () => documentsService.getFolders({
      context: 'case',
      contextId: caseId
    })
  });

  // Buscar documentos do caso
  const { 
    data: documentsData,
    isLoading: documentsLoading,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ['case-documents', caseId, selectedFolder, searchTerm],
    queryFn: () => {
      const filters: DocumentFilters = {
        caseId,
        folderContext: 'case',
        folderId: selectedFolder || undefined,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      return documentsService.getDocuments(filters);
    }
  });

  // Criar nova pasta
  const createFolderMutation = useMutation({
    mutationFn: (data: CreateFolderRequest) => documentsService.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-folders', caseId] });
      setShowCreateFolderDialog(false);
      setNewFolderData({ name: '', description: '' });
      toast.success('Pasta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar pasta');
    }
  });

  // Excluir documento
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => documentsService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-documents', caseId] });
      toast.success('Documento excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir documento');
    }
  });

  const folders = foldersData?.folders || [];
  const documents = documentsData?.documents || [];
  const isLoading = foldersLoading || documentsLoading;

  const handleCreateFolder = () => {
    if (!newFolderData.name.trim()) {
      toast.error('Nome da pasta é obrigatório');
      return;
    }

    createFolderMutation.mutate({
      name: newFolderData.name.trim(),
      description: newFolderData.description.trim(),
      context: 'case',
      contextId: caseId,
      parentId: selectedFolder || undefined
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Raiz';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Pasta Desconhecida';
  };

  const handleUploadDocument = () => {
    // Navegar para página de upload com parâmetros do caso
    navigate(`/documents/upload?caseId=${caseId}&folderId=${selectedFolder || ''}`);
  };

  const handleAddDocument = () => {
    // Mesma funcionalidade do upload
    handleUploadDocument();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Documentos do Caso
          </h3>
          <p className="text-sm text-gray-600">
            {caseName} • {documents.length} documento(s)
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowCreateFolderDialog(true)}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Nova Pasta
          </Button>
          
          <Button size="sm" onClick={handleUploadDocument}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumb atual */}
      {selectedFolder && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setSelectedFolder(null)}
            className="hover:text-gray-900"
          >
            Raiz
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {getFolderName(selectedFolder)}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pastas */}
          {folders.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Pastas</h4>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                {folders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FolderIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate">
                            {folder.name}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1">
                            {folder.documentsCount} documento(s)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          {documents.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Documentos {selectedFolder && `em ${getFolderName(selectedFolder)}`}
              </h4>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documents.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <FileText className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm leading-tight">
                                {document.title}
                              </h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {documentsService.formatFileSize(document.fileSize)}
                              </p>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Baixar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteDocument(document.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {documentsService.getCategoryLabel(document.category)}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${documentsService.getStatusColor(document.status)}`}
                            >
                              {documentsService.getStatusLabel(document.status)}
                            </Badge>
                          </div>

                          <div className="text-xs text-gray-500">
                            {formatDate(document.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((document) => (
                    <Card key={document.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900 truncate">
                                {document.title}
                              </h5>
                              <Badge variant="outline" className="text-xs">
                                {documentsService.getCategoryLabel(document.category)}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${documentsService.getStatusColor(document.status)}`}
                              >
                                {documentsService.getStatusLabel(document.status)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{documentsService.formatFileSize(document.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(document.createdAt)}</span>
                              <span>•</span>
                              <span>por {document.createdBy}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteDocument(document.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum documento encontrado
              </h4>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 
                  'Nenhum documento corresponde aos critérios de busca.' :
                  selectedFolder ?
                  'Esta pasta não contém documentos.' :
                  'Adicione documentos a este caso para começar.'
                }
              </p>
              <Button onClick={handleAddDocument}>
                <Upload className="w-4 h-4 mr-2" />
                Adicionar Documento
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog para criar pasta */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Criar uma nova pasta para organizar os documentos deste caso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <Input
                value={newFolderData.name}
                onChange={(e) => setNewFolderData({
                  ...newFolderData,
                  name: e.target.value
                })}
                placeholder="Ex: Contratos, Evidências..."
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
              <Textarea
                value={newFolderData.description}
                onChange={(e) => setNewFolderData({
                  ...newFolderData,
                  description: e.target.value
                })}
                placeholder="Descrição da pasta..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateFolderDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? 'Criando...' : 'Criar Pasta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
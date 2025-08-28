// src/pages/documents/DocumentUpload.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  FileIcon,
  FolderOpen,
  Tag,
  Lock,
  Loader2,
  ArrowLeft,
  Camera,
  Paperclip
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { 
  useUploadDocument, 
  useFolders, 
  useCreateFolder,
  useFileValidation, 
  useDragAndDrop,
  useClipboardFiles 
} from '@/hooks/useDocuments';
import { documentsService } from '@/services/documents.service';
import { 
  CreateDocumentRequest,
  DocumentCategory,
  DocumentSecurity,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_SECURITY_LABELS,
  UploadProgressEvent
} from '@/types/documents';
import toast from 'react-hot-toast';

const uploadSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  category: z.nativeEnum(Object.keys(DOCUMENT_CATEGORY_LABELS).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {} as Record<string, string>) as any),
  security: z.nativeEnum(Object.keys(DOCUMENT_SECURITY_LABELS).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {} as Record<string, string>) as any),
  folderId: z.string().optional(),
  tags: z.string().optional(),
  caseId: z.string().optional(),
  clientIds: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

export default function DocumentUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadFiles, setUploadFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  // Parâmetros da URL para caso específico
  const caseId = searchParams.get('caseId');
  const initialFolderId = searchParams.get('folderId');

  const { data: foldersData } = useFolders(
    caseId ? { context: 'case', contextId: caseId } : { context: 'general' }
  );
  const uploadMutation = useUploadDocument();
  const createFolderMutation = useCreateFolder();
  const { validateFiles } = useFileValidation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      security: 'internal',
      category: 'other',
      folderId: initialFolderId || undefined,
      caseId: caseId || undefined
    }
  });

  // Configurar valores iniciais quando há parâmetros da URL
  useEffect(() => {
    if (initialFolderId) {
      setValue('folderId', initialFolderId);
    }
    if (caseId) {
      setValue('caseId', caseId);
    }
  }, [initialFolderId, caseId, setValue]);

  const onFilesDrop = useCallback((files: File[]) => {
    const { validFiles, invalidFiles } = validateFiles(files);
    
    // Mostrar erros para arquivos inválidos
    invalidFiles.forEach(({ file, errors }) => {
      console.error(`Arquivo ${file.name}:`, errors.join(', '));
    });
    
    // Adicionar arquivos válidos à lista
    const newUploadFiles = validFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'pending' as const
    }));
    
    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [validateFiles]);

  const { isDragOver, dragProps } = useDragAndDrop(onFilesDrop);
  useClipboardFiles(onFilesDrop);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onFilesDrop(files);
    
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    return documentsService.formatFileSize(bytes);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (uploadFiles.length === 0) {
      alert('Selecione ao menos um arquivo para upload');
      return;
    }

    setIsUploading(true);
    setCurrentUploadIndex(0);

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const fileItem = uploadFiles[i];
        setCurrentUploadIndex(i);
        
        // Atualizar status para uploading
        setUploadFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        const uploadData: CreateDocumentRequest = {
          fileName: fileItem.file.name,
          fileSize: fileItem.file.size,
          fileType: documentsService.getFileType(fileItem.file.name),
          mimeType: fileItem.file.type,
          title: data.title || fileItem.file.name,
          description: data.description,
          category: data.category as DocumentCategory,
          security: data.security as DocumentSecurity,
          folderId: data.folderId,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
          caseId: data.caseId,
          clientIds: data.clientIds ? [data.clientIds] : [],
        };

        try {
          const document = await uploadMutation.mutateAsync({
            file: fileItem.file,
            data: uploadData,
            onProgress: (progress: UploadProgressEvent) => {
              setUploadFiles(prev => prev.map(f => 
                f.id === fileItem.id 
                  ? { ...f, progress: progress.progress }
                  : f
              ));
            }
          });

          // Marcar como sucesso
          setUploadFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'success', progress: 100, documentId: document.id }
              : f
          ));

        } catch (error) {
          // Marcar como erro
          setUploadFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Erro no upload' }
              : f
          ));
        }
      }

      // Verificar se todos foram bem-sucedidos
      const allSuccess = uploadFiles.every(f => f.status === 'success');
      if (allSuccess) {
        setTimeout(() => {
          navigate('/documents');
        }, 2000);
      }

    } finally {
      setIsUploading(false);
      setCurrentUploadIndex(-1);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const newFolder = await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
        parentId: undefined,
        context: caseId ? 'case' : 'general',
        contextId: caseId || undefined
      });
      
      setValue('folderId', newFolder.id);
      setShowNewFolderModal(false);
      setNewFolderName('');
      setNewFolderDescription('');
      toast.success('Pasta criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar pasta');
    }
  };

  const totalFiles = uploadFiles.length;
  const completedFiles = uploadFiles.filter(f => f.status === 'success' || f.status === 'error').length;
  const successFiles = uploadFiles.filter(f => f.status === 'success').length;
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/documents')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload de Documentos</h1>
          <p className="text-gray-600">
            Faça upload de múltiplos documentos de uma só vez
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drag & Drop Area */}
          <Card 
            className={`
              border-2 border-dashed transition-all
              ${isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <CardContent 
              className="p-12 text-center"
              {...dragProps}
            >
              <div className="space-y-4">
                <div className={`
                  w-16 h-16 mx-auto rounded-full flex items-center justify-center
                  ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}
                `}>
                  <Upload className={`
                    w-8 h-8
                    ${isDragOver ? 'text-blue-600' : 'text-gray-400'}
                  `} />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragOver 
                      ? 'Solte os arquivos aqui'
                      : 'Arraste arquivos ou clique para selecionar'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Suporte para PDF, Word, Excel, PowerPoint e imagens (até 50MB cada)
                  </p>
                </div>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Selecionar Arquivos
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.svg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Files List */}
          {uploadFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Arquivos Selecionados ({uploadFiles.length})</span>
                  
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadFiles([])}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Todos
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {uploadFiles.map((fileItem, index) => (
                  <div
                    key={fileItem.id}
                    className={`
                      flex items-center p-3 border rounded-lg
                      ${fileItem.status === 'success' ? 'border-green-200 bg-green-50' : 
                        fileItem.status === 'error' ? 'border-red-200 bg-red-50' :
                        fileItem.status === 'uploading' ? 'border-blue-200 bg-blue-50' :
                        'border-gray-200'
                      }
                    `}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="text-2xl mr-3">
                        {getFileIcon(fileItem.file.name)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                        
                        {fileItem.status === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={fileItem.progress} className="h-1" />
                            <p className="text-xs text-gray-500 mt-1">
                              {fileItem.progress}% concluído
                            </p>
                          </div>
                        )}
                        
                        {fileItem.status === 'error' && fileItem.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {fileItem.error}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {fileItem.status === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      {fileItem.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      
                      {!isUploading && fileItem.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileItem.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Progresso do Upload
                    </span>
                    <span className="text-sm text-gray-500">
                      {completedFiles} de {totalFiles} arquivos
                    </span>
                  </div>
                  
                  <Progress 
                    value={(completedFiles / totalFiles) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{successFiles} sucessos</span>
                    {errorFiles > 0 && <span className="text-red-600">{errorFiles} erros</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Título do documento"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição opcional"
                    rows={3}
                    {...register('description')}
                  />
                </div>

                <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                    onValueChange={(value) => setValue('category', value as DocumentCategory)}
                    value={watch('category')} // mantém o valor selecionado
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                    {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                        {label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>

                {errors.category?.message && typeof errors.category.message === 'string' && (
                    <p className="text-sm text-red-600 mt-1">
                    {errors.category.message}
                    </p>
                )}
                </div>


                <div>
                  <Label htmlFor="security">Nível de Segurança</Label>
                  <Select onValueChange={(value) => setValue('security', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOCUMENT_SECURITY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            {key === 'restricted' && <Lock className="w-4 h-4 mr-2" />}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="folderId">Pasta</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewFolderModal(true)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Pasta
                    </Button>
                  </div>
                  <Select onValueChange={(value) => setValue('folderId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pasta ou crie uma nova" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma pasta</SelectItem>
                      {foldersData?.folders?.map(folder => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center">
                            <FolderOpen className="w-4 h-4 mr-2" />
                            {folder.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="tag1, tag2, tag3"
                    {...register('tags')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separe as tags por vírgula
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={isUploading || uploadFiles.length === 0}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar ({uploadFiles.length})
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Upload Tips */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Dicas de Upload</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use nomes descritivos para os arquivos</li>
                <li>• Adicione tags para facilitar a busca</li>
                <li>• Escolha a categoria correta</li>
                <li>• Configure o nível de segurança adequado</li>
                <li>• Você pode colar imagens (Ctrl+V)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal para criar nova pasta */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
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
                  <X className="w-4 h-4" />
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
                <Textarea
                  id="newFolderDescription"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="Digite uma descrição para a pasta"
                  rows={3}
                />
              </div>
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
                  {createFolderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Pasta
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
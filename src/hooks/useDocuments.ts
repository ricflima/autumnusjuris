// src/hooks/useDocuments.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { documentsService } from '@/services/documents.service';
import {
  DocumentFilters,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  CreateFolderRequest,
  UpdateFolderRequest,
  CreateShareRequest,
  CreateTemplateRequest,
  UploadProgressEvent
} from '@/types/documents';

// Queries para documentos
export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentsService.getDocuments(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsService.getDocumentById(id!),
    enabled: !!id,
  });
}

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: () => documentsService.getFolders(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => documentsService.getTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['document-stats'],
    queryFn: () => documentsService.getDocumentStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Mutations para documentos
export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      file, 
      data, 
      onProgress 
    }: { 
      file: File; 
      data: CreateDocumentRequest; 
      onProgress?: (progress: UploadProgressEvent) => void;
    }) => {
      return documentsService.uploadDocument(file, data, onProgress);
    },
    onSuccess: (newDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      
      // Atualizar cache da pasta se necessário
      if (newDocument.folderId) {
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      }
      
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar documento');
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentRequest }) => {
      return documentsService.updateDocument(id, data);
    },
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', updatedDocument.id] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      
      toast.success('Documento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar documento');
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => documentsService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      
      toast.success('Documento excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir documento');
    },
  });
}

// Mutations para pastas
export function useCreateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFolderRequest) => {
      return documentsService.createFolder(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Pasta criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar pasta');
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFolderRequest }) => {
      return documentsService.updateFolder(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Pasta atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar pasta');
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => documentsService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Pasta excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir pasta');
    },
  });
}

// Mutations para templates
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTemplateRequest) => {
      return documentsService.createTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar template');
    },
  });
}

// Mutations para compartilhamento
export function useCreateShare() {
  return useMutation({
    mutationFn: (data: CreateShareRequest) => {
      return documentsService.createShare(data);
    },
    onSuccess: (share) => {
      toast.success('Link de compartilhamento criado com sucesso!');
      
      // Copiar para clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(share.shareUrl).then(() => {
          toast.success('Link copiado para a área de transferência!');
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar compartilhamento');
    },
  });
}

// Mutations para OCR
export function useProcessOcr() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (documentId: string) => {
      return documentsService.processOcr(documentId);
    },
    onSuccess: (result, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      toast.success('OCR processado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao processar OCR');
    },
  });
}

// Mutation para busca avançada
export function useSearchDocuments() {
  return useMutation({
    mutationFn: ({ query, filters }: { query: string; filters?: Partial<DocumentFilters> }) => {
      return documentsService.searchDocuments(query, filters);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro na busca');
    },
  });
}

// Hook personalizado para gerenciar upload com progresso
export function useDocumentUpload() {
  const uploadMutation = useUploadDocument();
  
  const uploadWithProgress = (
    file: File, 
    data: CreateDocumentRequest,
    onProgress?: (progress: UploadProgressEvent) => void
  ) => {
    return uploadMutation.mutateAsync({ file, data, onProgress });
  };
  
  return {
    upload: uploadWithProgress,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
    reset: uploadMutation.reset,
  };
}

// Hook para gerenciar estado de múltiplos uploads
export function useMultipleUploads() {
  const uploadMutation = useUploadDocument();
  
  const uploadMultiple = async (
    files: { file: File; data: CreateDocumentRequest }[],
    onProgress?: (fileIndex: number, progress: UploadProgressEvent) => void,
    onFileComplete?: (fileIndex: number, document: any) => void
  ) => {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const { file, data } = files[i];
      
      try {
        const document = await uploadMutation.mutateAsync({
          file,
          data,
          onProgress: (progress) => onProgress?.(i, progress)
        });
        
        results.push({ success: true, document });
        onFileComplete?.(i, document);
      } catch (error) {
        results.push({ success: false, error });
      }
    }
    
    return results;
  };
  
  return {
    uploadMultiple,
    isUploading: uploadMutation.isPending,
    reset: uploadMutation.reset,
  };
}

// Hook para gerenciar filtros de documentos
export function useDocumentFilters(initialFilters: DocumentFilters = {}) {
  const [filters, setFilters] = useState<DocumentFilters>(initialFilters);
  const { data: documents, isLoading, error } = useDocuments(filters);
  
  const updateFilter = (key: keyof DocumentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset page when filter changes
    }));
  };
  
  const clearFilters = () => {
    setFilters({ page: 1, limit: filters.limit });
  };
  
  const setPage = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  
  const setLimit = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };
  
  return {
    filters,
    documents,
    isLoading,
    error,
    updateFilter,
    clearFilters,
    setPage,
    setLimit,
    hasFilters: Object.keys(filters).some(key => 
      key !== 'page' && key !== 'limit' && filters[key as keyof DocumentFilters]
    ),
  };
}

// Hook para gerenciar seleção de documentos
export function useDocumentSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const selectDocument = (id: string) => {
    setSelectedIds(prev => [...prev, id]);
  };
  
  const deselectDocument = (id: string) => {
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };
  
  const toggleDocument = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };
  
  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };
  
  const clearSelection = () => {
    setSelectedIds([]);
  };
  
  const isSelected = (id: string) => selectedIds.includes(id);
  
  return {
    selectedIds,
    selectedCount: selectedIds.length,
    selectDocument,
    deselectDocument,
    toggleDocument,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selectedIds.length > 0,
  };
}

// Hook para gerenciar visualização de documentos
export function useDocumentViewer() {
  const [currentDocument, setCurrentDocument] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  const openViewer = (documentId: string) => {
    setCurrentDocument(documentId);
    setIsViewerOpen(true);
  };
  
  const closeViewer = () => {
    setIsViewerOpen(false);
    setCurrentDocument(null);
  };
  
  const viewNext = (documents: { id: string }[], currentId: string) => {
    const currentIndex = documents.findIndex(doc => doc.id === currentId);
    const nextIndex = (currentIndex + 1) % documents.length;
    setCurrentDocument(documents[nextIndex].id);
  };
  
  const viewPrevious = (documents: { id: string }[], currentId: string) => {
    const currentIndex = documents.findIndex(doc => doc.id === currentId);
    const prevIndex = currentIndex === 0 ? documents.length - 1 : currentIndex - 1;
    setCurrentDocument(documents[prevIndex].id);
  };
  
  return {
    currentDocument,
    isViewerOpen,
    openViewer,
    closeViewer,
    viewNext,
    viewPrevious,
  };
}

// Hook para validação de arquivos antes do upload
export function useFileValidation() {
  const validateFile = (file: File) => {
    const errors: string[] = [];
    
    // Verificar tamanho do arquivo (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('Arquivo muito grande. Tamanho máximo: 50MB');
    }
    
    // Verificar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/rtf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Tipo de arquivo não suportado');
    }
    
    // Verificar nome do arquivo
    if (file.name.length > 255) {
      errors.push('Nome do arquivo muito longo (máximo 255 caracteres)');
    }
    
    if (!/^[a-zA-Z0-9\s\-_.()]+\.[a-zA-Z0-9]+$/.test(file.name)) {
      errors.push('Nome do arquivo contém caracteres inválidos');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  const validateFiles = (files: File[]) => {
    const results = files.map(file => ({
      file,
      ...validateFile(file)
    }));
    
    return {
      validFiles: results.filter(r => r.isValid).map(r => r.file),
      invalidFiles: results.filter(r => !r.isValid),
      allValid: results.every(r => r.isValid)
    };
  };
  
  return {
    validateFile,
    validateFiles
  };
}

// Hook para drag and drop
export function useDragAndDrop(onFilesDrop: (files: File[]) => void) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    dragCounterRef.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesDrop(files);
    }
  }, [onFilesDrop]);
  
  return {
    isDragOver,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}

// Hook para clipboard/paste de arquivos
export function useClipboardFiles(onFilesPaste: (files: File[]) => void) {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files);
        onFilesPaste(files);
      }
    };
    
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [onFilesPaste]);
}
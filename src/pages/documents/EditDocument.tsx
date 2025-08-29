// src/pages/documents/EditDocument.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
  Plus,
  Tag as TagIcon,
  FolderOpen
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useDocument, useUpdateDocument, useFolders } from '@/hooks/useDocuments';
import { documentsService } from '@/services/documents.service';
import { DocumentCategory, DocumentSecurity, DocumentStatus } from '@/types/documents';
import toast from 'react-hot-toast';

const documentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  category: z.enum(['contract', 'petition', 'evidence', 'certificate', 'correspondence', 'report', 'template', 'personal_document', 'court_decision', 'legal_opinion', 'invoice', 'receipt', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  security: z.enum(['public', 'internal', 'confidential', 'restricted']),
  status: z.enum(['draft', 'final', 'archived']), // Match database enum
  folderId: z.string().optional(),
  tags: z.array(z.string()).default([])
});

type DocumentFormData = z.infer<typeof documentSchema>;

export default function EditDocument() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newTag, setNewTag] = useState('');

  const { data: document, isLoading, error, refetch } = useDocument(id);
  const { data: foldersData } = useFolders();
  const updateDocumentMutation = useUpdateDocument();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty }
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      security: 'internal',
      status: 'draft', // This matches the database enum
      folderId: 'root',
      tags: []
    }
  });

  // Update form when document loads
  useEffect(() => {
    if (document) {
      setValue('title', document.title);
      setValue('description', document.description || '');
      setValue('category', document.category);
      setValue('priority', document.priority);
      setValue('security', document.security);
      setValue('status', document.status);
      setValue('folderId', document.folderId || 'root');
      setValue('tags', document.tags || []);
    }
  }, [document, setValue]);

  const watchedTags = watch('tags') || [];

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !watchedTags.includes(tag)) {
      setValue('tags', [...watchedTags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!id) return;

    try {
      await updateDocumentMutation.mutateAsync({
        id,
        data: {
          ...data,
          folderId: data.folderId || undefined
        }
      });

      toast.success('Documento atualizado com sucesso!');
      navigate(`/documents/${id}`);
    } catch (error) {
      toast.error('Erro ao atualizar documento');
      console.error('Erro ao atualizar documento:', error);
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/documents/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar Documento
              </h1>
              <p className="text-gray-600">
                {document.fileName} • {documentsService.formatFileSize(document.fileSize)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <a href={`/documents/${id}`}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </a>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Digite o título do documento"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Digite uma descrição para o documento (opcional)"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Adicionar nova tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || watchedTags.includes(newTag.trim())}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Classification */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={watch('category')}
                    onValueChange={(value) => setValue('category', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentsService.getCategoryOptions())
                        .filter(([value, label]) => value && value.trim() !== '' && label && label.trim() !== '')
                        .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade *</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(value) => setValue('priority', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentsService.getPriorityOptions())
                        .filter(([value, label]) => value && value.trim() !== '' && label && label.trim() !== '')
                        .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-red-600 mt-1">{errors.priority.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="security">Segurança *</Label>
                  <Select
                    value={watch('security')}
                    onValueChange={(value) => setValue('security', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível de segurança" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentsService.getSecurityOptions())
                        .filter(([value, label]) => value && value.trim() !== '' && label && label.trim() !== '')
                        .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.security && (
                    <p className="text-sm text-red-600 mt-1">{errors.security.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentsService.getStatusOptions())
                        .filter(([value, label]) => value && value.trim() !== '' && label && label.trim() !== '')
                        .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organization */}
            <Card>
              <CardHeader>
                <CardTitle>Organização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="folderId">Pasta</Label>
                  <Select
                    value={watch('folderId') || 'root'}
                    onValueChange={(value) => setValue('folderId', value === 'root' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pasta (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">
                        <div className="flex items-center">
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Raiz (sem pasta)
                        </div>
                      </SelectItem>
                      {foldersData?.folders.map((folder) => (
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
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isDirty || !isValid || updateDocumentMutation.isPending}
                  >
                    {updateDocumentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/documents/${id}`)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
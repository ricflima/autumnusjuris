// src/components/documents/UploadZone.tsx

import React, { useRef } from 'react';
import { Upload, FileText, Image, X, Plus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDragAndDrop, useFileValidation } from '@/hooks/useDocuments';

interface FileUploadItem {
  file: File;
  id: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadZoneProps {
  files: FileUploadItem[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (fileId: string) => void;
  isUploading?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

export default function UploadZone({
  files,
  onFilesAdd,
  onFileRemove,
  isUploading = false,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.rtf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg'
  ],
  className = ''
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateFiles } = useFileValidation();

  const handleFilesDrop = (droppedFiles: File[]) => {
    if (files.length + droppedFiles.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitido`);
      return;
    }

    const { validFiles, invalidFiles } = validateFiles(droppedFiles);
    
    // Mostrar erros dos arquivos inválidos
    invalidFiles.forEach(({ file, errors }) => {
      console.error(`Erro no arquivo ${file.name}:`, errors);
      alert(`Erro no arquivo ${file.name}: ${errors.join(', ')}`);
    });

    if (validFiles.length > 0) {
      onFilesAdd(validFiles);
    }
  };

  const { isDragOver, dragProps } = useDragAndDrop(handleFilesDrop);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFilesDrop(selectedFiles);
    
    // Limpar input para permitir selecionar o mesmo arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg'].includes(extension || '')) {
      return <Image className="w-5 h-5" />;
    }
    
    return <FileText className="w-5 h-5" />;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'uploading': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card 
        className={`
          border-2 border-dashed transition-all cursor-pointer
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <CardContent 
          className="p-8 text-center"
          {...dragProps}
          onClick={() => fileInputRef.current?.click()}
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
                  : files.length === 0
                    ? 'Arraste arquivos ou clique para selecionar'
                    : 'Arraste mais arquivos ou clique para selecionar'
                }
              </p>
              
              <p className="text-sm text-gray-500 mb-4">
                Suporte para PDF, Word, Excel, PowerPoint e imagens
                <br />
                Máximo {formatFileSize(maxFileSize)} por arquivo • {maxFiles - files.length} arquivo{maxFiles - files.length !== 1 ? 's' : ''} restante{maxFiles - files.length !== 1 ? 's' : ''}
              </p>
              
              <Button 
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading || files.length >= maxFiles}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Selecionar Arquivos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading || files.length >= maxFiles}
      />

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                Arquivos Selecionados ({files.length}/{maxFiles})
              </h3>
              
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => files.forEach(f => onFileRemove(f.id))}
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Todos
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={`
                    flex items-center p-3 border rounded-lg transition-all
                    ${getStatusColor(fileItem.status)}
                  `}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="mr-3 text-gray-500">
                      {getFileIcon(fileItem.file.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(fileItem.file.size)}</span>
                        <span>•</span>
                        <span>{fileItem.file.type || 'Tipo desconhecido'}</span>
                        
                        {fileItem.status && (
                          <>
                            <span>•</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                fileItem.status === 'success' ? 'text-green-600 border-green-200' :
                                fileItem.status === 'error' ? 'text-red-600 border-red-200' :
                                fileItem.status === 'uploading' ? 'text-blue-600 border-blue-200' :
                                'text-gray-600'
                              }`}
                            >
                              {fileItem.status === 'success' && 'Sucesso'}
                              {fileItem.status === 'error' && 'Erro'}
                              {fileItem.status === 'uploading' && 'Enviando'}
                              {fileItem.status === 'pending' && 'Pendente'}
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      {fileItem.status === 'uploading' && typeof fileItem.progress === 'number' && (
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
                  
                  {!isUploading && fileItem.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(fileItem.id)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Summary */}
            {isUploading && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Progresso do Upload
                  </span>
                  <span className="text-sm text-blue-700">
                    {files.filter(f => f.status === 'success' || f.status === 'error').length} / {files.length}
                  </span>
                </div>
                
                <Progress 
                  value={(files.filter(f => f.status === 'success' || f.status === 'error').length / files.length) * 100}
                  className="h-2"
                />
                
                <div className="flex justify-between text-xs text-blue-700 mt-2">
                  <span>{files.filter(f => f.status === 'success').length} sucessos</span>
                  <span>{files.filter(f => f.status === 'error').length} erros</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Tips */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Dicas de Upload</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Arraste múltiplos arquivos de uma só vez</li>
            <li>• Use Ctrl+V para colar imagens da área de transferência</li>
            <li>• Arquivos grandes podem demorar mais para enviar</li>
            <li>• Certifique-se de que os arquivos não estão corrompidos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
// src/types/documents.ts

export type DocumentType = 
  | 'pdf' 
  | 'doc' 
  | 'docx' 
  | 'xls' 
  | 'xlsx' 
  | 'ppt' 
  | 'pptx'
  | 'txt' 
  | 'rtf'
  | 'jpg' 
  | 'jpeg' 
  | 'png' 
  | 'gif' 
  | 'bmp'
  | 'tiff'
  | 'svg'
  | 'other';

export type DocumentStatus = 
  | 'draft' 
  | 'active' 
  | 'archived' 
  | 'deleted'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export type DocumentCategory = 
  | 'contract' 
  | 'petition' 
  | 'evidence' 
  | 'certificate' 
  | 'correspondence'
  | 'report'
  | 'template'
  | 'personal_document'
  | 'court_decision'
  | 'legal_opinion'
  | 'invoice'
  | 'receipt'
  | 'other';

export type DocumentSecurity = 
  | 'public' 
  | 'internal' 
  | 'confidential' 
  | 'restricted';

export type AccessLevel = 
  | 'read' 
  | 'write' 
  | 'admin' 
  | 'owner';

export interface DocumentVersion {
  id: string;
  version: number;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  isActive: boolean;
  changes?: string;
}

export interface DocumentAccess {
  userId: string;
  userName: string;
  level: AccessLevel;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  level: number;
  documentsCount: number;
  subFoldersCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isSystemFolder: boolean;
  permissions: any[];
}

export interface DocumentMetadata {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  customFields?: Record<string, any>;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  shareToken: string;
  shareUrl: string;
  expiresAt?: string;
  password?: boolean;
  downloadAllowed: boolean;
  viewCount: number;
  maxViews?: number;
  createdBy: string;
  createdAt: string;
  lastAccessedAt?: string;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  isResolved: boolean;
  parentId?: string; // Para respostas
  replies?: DocumentComment[];
}

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  type: 'highlight' | 'note' | 'bookmark' | 'signature';
  content: string;
  position: {
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  color?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  fileType: DocumentType;
  mimeType: string;
  
  // Organização
  folderId?: string;
  folderPath?: string;
  category: DocumentCategory;
  tags: string[];
  
  // Classificação
  status: DocumentStatus;
  security: DocumentSecurity;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Relacionamentos
  caseId?: string;
  caseName?: string;
  clientIds?: string[];
  processIds?: string[];
  
  // Conteúdo
  title: string;
  description?: string;
  metadata: DocumentMetadata;
  
  // Versões
  currentVersion: number;
  versions: DocumentVersion[];
  
  // Acesso e Segurança
  permissions: DocumentAccess[];
  isEncrypted: boolean;
  checksum?: string;
  
  // OCR e Busca
  ocrText?: string;
  isOcrProcessed: boolean;
  ocrProcessedAt?: string;
  searchableText?: string;
  
  // Assinatura Digital
  isDigitallySigned: boolean;
  signatureInfo?: {
    signedBy: string;
    signedAt: string;
    certificate?: string;
    isValid: boolean;
  };
  
  // Auditoria
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  lastAccessedBy?: string;
  lastAccessedAt?: string;
  accessCount: number;
  
  // Compartilhamento
  shares?: DocumentShare[];
  
  // Interação
  comments?: DocumentComment[];
  annotations?: DocumentAnnotation[];
  
  // Campos calculados
  url: string;
  thumbnailUrl?: string;
  downloadUrl: string;
  viewUrl: string;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

// Request/Response Types para API
export interface CreateDocumentRequest {
  fileName: string;
  fileSize: number;
  fileType: DocumentType;
  mimeType: string;
  folderId?: string;
  category: DocumentCategory;
  tags?: string[];
  status?: DocumentStatus;
  security?: DocumentSecurity;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  caseId?: string;
  clientIds?: string[];
  processIds?: string[];
  title: string;
  description?: string;
  metadata?: Partial<DocumentMetadata>;
}

export interface UpdateDocumentRequest {
  fileName?: string;
  folderId?: string;
  category?: DocumentCategory;
  tags?: string[];
  status?: DocumentStatus;
  security?: DocumentSecurity;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  caseId?: string;
  clientIds?: string[];
  processIds?: string[];
  title?: string;
  description?: string;
  metadata?: Partial<DocumentMetadata>;
}

export interface DocumentsResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DocumentFilters {
  folderId?: string;
  category?: DocumentCategory[];
  status?: DocumentStatus[];
  security?: DocumentSecurity[];
  fileType?: DocumentType[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  caseId?: string;
  clientId?: string;
  processId?: string;
  tags?: string[];
  search?: string;
  createdBy?: string[];
  createdFrom?: string;
  createdTo?: string;
  fileSizeMin?: number;
  fileSizeMax?: number;
  hasOcr?: boolean;
  isDigitallySigned?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'fileName' | 'title' | 'createdAt' | 'updatedAt' | 'fileSize' | 'category' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  parentId?: string;
}

export interface FoldersResponse {
  folders: DocumentFolder[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateShareRequest {
  documentId: string;
  expiresAt?: string;
  password?: string;
  downloadAllowed?: boolean;
  maxViews?: number;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  progress: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  fileName: string;
  fileType: DocumentType;
  fileSize: number;
  thumbnailUrl?: string;
  downloadUrl: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: DocumentCategory;
  fileName: string;
  fileType: DocumentType;
  tags?: string[];
  isPublic?: boolean;
}

// Constantes úteis
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  pdf: 'PDF',
  doc: 'Word 97-2003',
  docx: 'Word',
  xls: 'Excel 97-2003',
  xlsx: 'Excel',
  ppt: 'PowerPoint 97-2003',
  pptx: 'PowerPoint',
  txt: 'Texto',
  rtf: 'Rich Text',
  jpg: 'JPEG',
  jpeg: 'JPEG',
  png: 'PNG',
  gif: 'GIF',
  bmp: 'Bitmap',
  tiff: 'TIFF',
  svg: 'SVG',
  other: 'Outro'
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: 'Contrato',
  petition: 'Petição',
  evidence: 'Prova',
  certificate: 'Certidão',
  correspondence: 'Correspondência',
  report: 'Relatório',
  template: 'Modelo',
  personal_document: 'Documento Pessoal',
  court_decision: 'Decisão Judicial',
  legal_opinion: 'Parecer Jurídico',
  invoice: 'Nota Fiscal',
  receipt: 'Recibo',
  other: 'Outro'
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
  deleted: 'Excluído',
  pending_review: 'Aguardando Revisão',
  approved: 'Aprovado',
  rejected: 'Rejeitado'
};

export const DOCUMENT_SECURITY_LABELS: Record<DocumentSecurity, string> = {
  public: 'Público',
  internal: 'Interno',
  confidential: 'Confidencial',
  restricted: 'Restrito'
};

export const DOCUMENT_PRIORITY_LABELS: Record<'low' | 'medium' | 'high' | 'urgent', string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_FILE_TYPES = [
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

export const DOCUMENT_ICONS: Record<DocumentType, string> = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  ppt: '📽️',
  pptx: '📽️',
  txt: '📄',
  rtf: '📄',
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
  bmp: '🖼️',
  tiff: '🖼️',
  svg: '🖼️',
  other: '📎'
};

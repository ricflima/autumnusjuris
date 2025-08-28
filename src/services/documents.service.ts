// src/services/documents.service.ts

import { 
  Document, 
  DocumentFolder,
  DocumentTemplate,
  DocumentShare,
  DocumentsResponse,
  FoldersResponse,
  DocumentFilters,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  CreateFolderRequest,
  UpdateFolderRequest,
  CreateShareRequest,
  CreateTemplateRequest,
  UploadProgressEvent,
  DocumentType,
  DocumentCategory,
  DocumentStatus,
  DocumentSecurity,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_SECURITY_LABELS,
  DOCUMENT_PRIORITY_LABELS
} from '@/types/documents';

// Cliente API será usado quando integrar com backend real
// import { documentsApi, foldersApi, templatesApi } from '@/lib/api';

// Mock data para desenvolvimento
const MOCK_FOLDERS: DocumentFolder[] = [
  // Pastas gerais
  {
    id: '1',
    name: 'Contratos',
    description: 'Contratos e acordos jurídicos',
    path: '/Contratos',
    level: 1,
    documentsCount: 15,
    subFoldersCount: 3,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T10:30:00Z',
    isSystemFolder: true,
    permissions: [],
    context: 'general'
  },
  {
    id: '2',
    name: 'Petições',
    description: 'Petições iniciais e intermediárias',
    path: '/Petições',
    level: 1,
    documentsCount: 28,
    subFoldersCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-20T14:15:00Z',
    isSystemFolder: true,
    permissions: [],
    context: 'general'
  },
  {
    id: '3',
    name: 'Evidências',
    description: 'Provas e documentos comprobatórios',
    path: '/Evidências',
    level: 1,
    documentsCount: 42,
    subFoldersCount: 5,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-25T09:45:00Z',
    isSystemFolder: true,
    permissions: [],
    context: 'general'
  },
  {
    id: '4',
    name: 'Modelos',
    description: 'Templates e modelos de documentos',
    path: '/Modelos',
    level: 1,
    documentsCount: 12,
    subFoldersCount: 2,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-10T16:20:00Z',
    isSystemFolder: true,
    permissions: [],
    context: 'general'
  },
  // Pastas específicas do caso 1
  {
    id: 'case-1-folder-1',
    name: 'Documentos Iniciais',
    description: 'Contratos e documentos do início do caso',
    path: '/Documentos Iniciais',
    level: 1,
    documentsCount: 2,
    subFoldersCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
    isSystemFolder: false,
    permissions: [],
    context: 'case',
    contextId: '1'
  },
  {
    id: 'case-1-folder-2',
    name: 'Provas e Evidências',
    description: 'Evidências coletadas para o caso',
    path: '/Provas e Evidências',
    level: 1,
    documentsCount: 1,
    subFoldersCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-02-05T16:00:00Z',
    updatedAt: '2024-02-05T16:20:00Z',
    isSystemFolder: false,
    permissions: [],
    context: 'case',
    contextId: '1'
  }
];

const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    fileName: 'contrato-prestacao-servicos-001.pdf',
    originalFileName: 'Contrato de Prestação de Serviços - Cliente Silva.pdf',
    fileSize: 2456789,
    fileType: 'pdf',
    mimeType: 'application/pdf',
    folderId: 'case-1-folder-1',
    folderPath: '/Documentos Iniciais',
    category: 'contract',
    tags: ['contrato', 'prestação-serviços', 'silva'],
    status: 'active',
    security: 'internal',
    priority: 'high',
    caseId: '1',
    caseName: 'Processo Trabalhista - Silva vs Empresa XYZ',
    clientIds: ['1'],
    title: 'Contrato de Prestação de Serviços - João Silva',
    description: 'Contrato de prestação de serviços advocatícios para processo trabalhista',
    metadata: {
      title: 'Contrato de Prestação de Serviços',
      author: 'Dr. Advogado',
      subject: 'Prestação de serviços jurídicos',
      keywords: ['contrato', 'serviços', 'trabalhista'],
      pageCount: 8,
      creationDate: '2024-01-15T10:00:00Z',
      language: 'pt-BR'
    },
    currentVersion: 2,
    versions: [
      {
        id: 'v1',
        version: 1,
        fileName: 'contrato-prestacao-servicos-001-v1.pdf',
        fileSize: 2356789,
        fileUrl: '/documents/contrato-prestacao-servicos-001-v1.pdf',
        uploadedBy: 'user-1',
        uploadedAt: '2024-01-15T10:00:00Z',
        isActive: false
      },
      {
        id: 'v2',
        version: 2,
        fileName: 'contrato-prestacao-servicos-001-v2.pdf',
        fileSize: 2456789,
        fileUrl: '/documents/contrato-prestacao-servicos-001-v2.pdf',
        uploadedBy: 'user-1',
        uploadedAt: '2024-02-01T14:30:00Z',
        changes: 'Atualizada cláusula de honorários',
        isActive: true
      }
    ],
    permissions: [],
    isEncrypted: false,
    ocrText: 'Contrato de prestação de serviços advocatícios entre...',
    isOcrProcessed: true,
    ocrProcessedAt: '2024-01-15T11:00:00Z',
    searchableText: 'contrato prestação serviços advocatícios joão silva',
    isDigitallySigned: true,
    signatureInfo: {
      signedBy: 'Dr. Advogado',
      signedAt: '2024-02-01T14:30:00Z',
      isValid: true
    },
    createdBy: 'user-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedBy: 'user-1',
    updatedAt: '2024-02-01T14:30:00Z',
    lastAccessedBy: 'user-1',
    lastAccessedAt: '2024-03-25T09:15:00Z',
    accessCount: 12,
    url: '/api/documents/1/download',
    thumbnailUrl: '/api/documents/1/thumbnail',
    downloadUrl: '/api/documents/1/download',
    viewUrl: '/api/documents/1/view',
    canEdit: true,
    canDelete: true,
    canShare: true
  },
  {
    id: '2',
    fileName: 'peticao-inicial-processo-001.pdf',
    originalFileName: 'Petição Inicial - Ação Trabalhista Silva.pdf',
    fileSize: 1789456,
    fileType: 'pdf',
    mimeType: 'application/pdf',
    folderId: 'case-1-folder-1',
    folderPath: '/Documentos Iniciais',
    category: 'petition',
    tags: ['petição', 'inicial', 'trabalhista', 'silva'],
    status: 'active',
    security: 'confidential',
    priority: 'urgent',
    caseId: '1',
    caseName: 'Processo Trabalhista - Silva vs Empresa XYZ',
    clientIds: ['1'],
    processIds: ['1'],
    title: 'Petição Inicial - Ação Trabalhista João Silva',
    description: 'Petição inicial para ação de rescisão indireta e danos morais',
    metadata: {
      title: 'Petição Inicial - Ação Trabalhista',
      author: 'Dr. Advogado',
      subject: 'Rescisão indireta e danos morais',
      keywords: ['petição', 'trabalhista', 'rescisão', 'danos morais'],
      pageCount: 12,
      creationDate: '2024-02-10T08:30:00Z',
      language: 'pt-BR'
    },
    currentVersion: 1,
    versions: [
      {
        id: 'v1',
        version: 1,
        fileName: 'peticao-inicial-processo-001.pdf',
        fileSize: 1789456,
        fileUrl: '/documents/peticao-inicial-processo-001.pdf',
        uploadedBy: 'user-1',
        uploadedAt: '2024-02-10T08:30:00Z',
        isActive: true
      }
    ],
    permissions: [],
    isEncrypted: true,
    ocrText: 'Excelentíssimo Senhor Doutor Juiz do Trabalho...',
    isOcrProcessed: true,
    ocrProcessedAt: '2024-02-10T09:00:00Z',
    searchableText: 'petição inicial ação trabalhista rescisão indireta danos morais',
    isDigitallySigned: true,
    signatureInfo: {
      signedBy: 'Dr. Advogado',
      signedAt: '2024-02-10T08:30:00Z',
      isValid: true
    },
    createdBy: 'user-1',
    createdAt: '2024-02-10T08:30:00Z',
    lastAccessedBy: 'user-1',
    lastAccessedAt: '2024-03-20T15:45:00Z',
    accessCount: 8,
    url: '/api/documents/2/download',
    thumbnailUrl: '/api/documents/2/thumbnail',
    downloadUrl: '/api/documents/2/download',
    viewUrl: '/api/documents/2/view',
    canEdit: true,
    canDelete: true,
    canShare: true
  },
  {
    id: '3',
    fileName: 'evidencia-cartao-ponto.xlsx',
    originalFileName: 'Cartão de Ponto - Silva - Janeiro 2024.xlsx',
    fileSize: 98765,
    fileType: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    folderId: 'case-1-folder-2',
    folderPath: '/Provas e Evidências',
    category: 'evidence',
    tags: ['evidência', 'cartão-ponto', 'horas-extras'],
    status: 'active',
    security: 'confidential',
    priority: 'high',
    caseId: '1',
    caseName: 'Processo Trabalhista - Silva vs Empresa XYZ',
    clientIds: ['1'],
    processIds: ['1'],
    title: 'Evidência - Cartão de Ponto Janeiro 2024',
    description: 'Cartão de ponto demonstrando horas extras não pagas',
    metadata: {
      title: 'Cartão de Ponto - Janeiro 2024',
      author: 'Sistema RH',
      subject: 'Controle de ponto eletrônico',
      keywords: ['cartão', 'ponto', 'horas extras', 'janeiro'],
      creationDate: '2024-02-05T16:20:00Z',
      language: 'pt-BR'
    },
    currentVersion: 1,
    versions: [
      {
        id: 'v1',
        version: 1,
        fileName: 'evidencia-cartao-ponto.xlsx',
        fileSize: 98765,
        fileUrl: '/documents/evidencia-cartao-ponto.xlsx',
        uploadedBy: 'user-1',
        uploadedAt: '2024-02-05T16:20:00Z',
        isActive: true
      }
    ],
    permissions: [],
    isEncrypted: false,
    isOcrProcessed: false,
    isDigitallySigned: false,
    createdBy: 'user-1',
    createdAt: '2024-02-05T16:20:00Z',
    lastAccessedBy: 'user-1',
    lastAccessedAt: '2024-03-18T11:30:00Z',
    accessCount: 5,
    url: '/api/documents/3/download',
    thumbnailUrl: '/api/documents/3/thumbnail',
    downloadUrl: '/api/documents/3/download',
    viewUrl: '/api/documents/3/view',
    canEdit: true,
    canDelete: true,
    canShare: true
  }
];

const MOCK_TEMPLATES: DocumentTemplate[] = [
  {
    id: '1',
    name: 'Contrato de Prestação de Serviços Advocatícios',
    description: 'Modelo padrão de contrato para prestação de serviços advocatícios',
    category: 'contract',
    fileName: 'template-contrato-prestacao-servicos.docx',
    fileType: 'docx',
    fileSize: 45678,
    thumbnailUrl: '/templates/template-contrato-prestacao-servicos-thumb.png',
    downloadUrl: '/api/templates/1/download',
    tags: ['contrato', 'prestação-serviços', 'advocatícios'],
    isPublic: true,
    usageCount: 28,
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Petição Inicial Trabalhista',
    description: 'Template para petições iniciais em processos trabalhistas',
    category: 'petition',
    fileName: 'template-peticao-inicial-trabalhista.docx',
    fileType: 'docx',
    fileSize: 67890,
    thumbnailUrl: '/templates/template-peticao-inicial-trabalhista-thumb.png',
    downloadUrl: '/api/templates/2/download',
    tags: ['petição', 'inicial', 'trabalhista'],
    isPublic: true,
    usageCount: 45,
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-01T14:20:00Z'
  }
];

class DocumentsService {
  // CRUD Documentos
  async getDocuments(filters: DocumentFilters = {}): Promise<DocumentsResponse> {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let filteredDocuments = [...MOCK_DOCUMENTS];
      
      // Aplicar filtros
      if (filters.folderId) {
        filteredDocuments = filteredDocuments.filter(doc => doc.folderId === filters.folderId);
      }
      
      if (filters.folderContext) {
        // Buscar pastas do contexto específico
        const contextFolders = MOCK_FOLDERS
          .filter(f => f.context === filters.folderContext)
          .map(f => f.id);
        
        if (filters.folderContext === 'case' && filters.caseId) {
          // Para contexto de caso, filtrar pastas específicas do caso
          const caseFolders = MOCK_FOLDERS
            .filter(f => f.context === 'case' && f.contextId === filters.caseId)
            .map(f => f.id);
          filteredDocuments = filteredDocuments.filter(doc => 
            caseFolders.includes(doc.folderId || '') || doc.caseId === filters.caseId
          );
        } else {
          filteredDocuments = filteredDocuments.filter(doc =>
            contextFolders.includes(doc.folderId || '') ||
            (filters.folderContext === 'general' && !doc.caseId)
          );
        }
      }
      
      if (filters.category?.length) {
        filteredDocuments = filteredDocuments.filter(doc => filters.category!.includes(doc.category));
      }
      
      if (filters.status?.length) {
        filteredDocuments = filteredDocuments.filter(doc => filters.status!.includes(doc.status));
      }
      
      if (filters.fileType?.length) {
        filteredDocuments = filteredDocuments.filter(doc => filters.fileType!.includes(doc.fileType));
      }
      
      if (filters.caseId) {
        filteredDocuments = filteredDocuments.filter(doc => doc.caseId === filters.caseId);
      }
      
      if (filters.clientId) {
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.clientIds?.includes(filters.clientId!)
        );
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredDocuments = filteredDocuments.filter(doc => 
          doc.title.toLowerCase().includes(searchTerm) ||
          doc.fileName.toLowerCase().includes(searchTerm) ||
          doc.description?.toLowerCase().includes(searchTerm) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          doc.searchableText?.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.tags?.length) {
        filteredDocuments = filteredDocuments.filter(doc =>
          filters.tags!.some(tag => doc.tags.includes(tag))
        );
      }
      
      // Ordenação
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      filteredDocuments.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Document];
        let bValue: any = b[sortBy as keyof Document];
        
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Paginação
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);
      
      return {
        documents: paginatedDocuments,
        total: filteredDocuments.length,
        page,
        limit,
        hasMore: endIndex < filteredDocuments.length
      };
    } catch (error) {
      throw new Error('Erro ao buscar documentos');
    }
  }
  
  async getDocumentById(id: string): Promise<Document> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const document = MOCK_DOCUMENTS.find(doc => doc.id === id);
      if (!document) {
        throw new Error('Documento não encontrado');
      }
      
      return document;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar documento');
    }
  }
  
  async uploadDocument(
    file: File,
    data: CreateDocumentRequest,
    onProgress?: (progress: UploadProgressEvent) => void
  ): Promise<Document> {
    try {
      // Simular upload com progresso
      const totalSize = file.size;
      let loaded = 0;
      
      const uploadProgress = setInterval(() => {
        loaded += Math.random() * (totalSize * 0.1);
        if (loaded >= totalSize) {
          loaded = totalSize;
          clearInterval(uploadProgress);
        }
        
        if (onProgress) {
          onProgress({
            loaded,
            total: totalSize,
            progress: Math.round((loaded / totalSize) * 100)
          });
        }
      }, 100);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument: Document = {
        id: Date.now().toString(),
        fileName: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
        originalFileName: file.name,
        fileSize: file.size,
        fileType: this.getFileType(file.name),
        mimeType: file.type,
        folderId: data.folderId,
        folderPath: data.folderId ? this.getFolderPath(data.folderId) : '/',
        category: data.category,
        tags: data.tags || [],
        status: data.status || 'active',
        security: data.security || 'internal',
        priority: data.priority || 'medium',
        caseId: data.caseId,
        clientIds: data.clientIds,
        processIds: data.processIds,
        title: data.title,
        description: data.description,
        metadata: {
          title: data.title,
          ...data.metadata
        },
        currentVersion: 1,
        versions: [{
          id: 'v1',
          version: 1,
          fileName: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
          fileSize: file.size,
          fileUrl: `/documents/${Date.now()}-${file.name}`,
          uploadedBy: 'current-user',
          uploadedAt: new Date().toISOString(),
          isActive: true
        }],
        permissions: [],
        isEncrypted: false,
        isOcrProcessed: false,
        isDigitallySigned: false,
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        accessCount: 0,
        url: `/api/documents/${Date.now()}/download`,
        downloadUrl: `/api/documents/${Date.now()}/download`,
        viewUrl: `/api/documents/${Date.now()}/view`,
        canEdit: true,
        canDelete: true,
        canShare: true
      };
      
      MOCK_DOCUMENTS.unshift(newDocument);
      
      return newDocument;
    } catch (error) {
      throw new Error('Erro ao fazer upload do documento');
    }
  }
  
  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<Document> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const documentIndex = MOCK_DOCUMENTS.findIndex(doc => doc.id === id);
      if (documentIndex === -1) {
        throw new Error('Documento não encontrado');
      }
      
      const currentDoc = MOCK_DOCUMENTS[documentIndex];

      const updatedDocument: Document = {
        ...currentDoc,
        ...data,
        title: data.title || currentDoc.title || 'Sem título',
        metadata: {
          ...currentDoc.metadata,
          title: data.title || data.metadata?.title || currentDoc.title || 'Sem título',
          ...data.metadata
        },
        updatedBy: 'current-user',
        updatedAt: new Date().toISOString()
      };
      
      MOCK_DOCUMENTS[documentIndex] = updatedDocument;
      
      return updatedDocument;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar documento');
    }
  }
  
  async deleteDocument(id: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const documentIndex = MOCK_DOCUMENTS.findIndex(doc => doc.id === id);
      if (documentIndex === -1) {
        throw new Error('Documento não encontrado');
      }
      
      MOCK_DOCUMENTS.splice(documentIndex, 1);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao excluir documento');
    }
  }
  
  // CRUD Pastas
  async getFolders(filters: import('@/types/documents').FoldersFilters = {}): Promise<FoldersResponse> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredFolders = [...MOCK_FOLDERS];
      
      // Filtrar por contexto
      if (filters.context) {
        filteredFolders = filteredFolders.filter(folder => 
          folder.context === filters.context
        );
      }
      
      // Filtrar por ID do contexto (caso)
      if (filters.contextId) {
        filteredFolders = filteredFolders.filter(folder => 
          folder.contextId === filters.contextId
        );
      }
      
      // Filtrar por pasta pai
      if (filters.parentId) {
        filteredFolders = filteredFolders.filter(folder => 
          folder.parentId === filters.parentId
        );
      }
      
      // Busca por nome
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredFolders = filteredFolders.filter(folder =>
          folder.name.toLowerCase().includes(searchTerm) ||
          folder.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Paginação
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFolders = filteredFolders.slice(startIndex, endIndex);
      
      return {
        folders: paginatedFolders,
        total: filteredFolders.length,
        page,
        limit,
        hasMore: endIndex < filteredFolders.length
      };
    } catch (error) {
      throw new Error('Erro ao buscar pastas');
    }
  }
  
  async createFolder(data: CreateFolderRequest): Promise<DocumentFolder> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const parentFolder = data.parentId ? 
        MOCK_FOLDERS.find(f => f.id === data.parentId) : null;
      
      const newFolder: DocumentFolder = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        path: parentFolder ? `${parentFolder.path}/${data.name}` : `/${data.name}`,
        level: parentFolder ? parentFolder.level + 1 : 1,
        documentsCount: 0,
        subFoldersCount: 0,
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSystemFolder: false,
        permissions: [],
        context: data.context,
        contextId: data.contextId
      };
      
      MOCK_FOLDERS.push(newFolder);
      
      return newFolder;
    } catch (error) {
      throw new Error('Erro ao criar pasta');
    }
  }
  
  async updateFolder(id: string, data: UpdateFolderRequest): Promise<DocumentFolder> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const folderIndex = MOCK_FOLDERS.findIndex(f => f.id === id);
      if (folderIndex === -1) {
        throw new Error('Pasta não encontrada');
      }
      
      const updatedFolder = {
        ...MOCK_FOLDERS[folderIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      MOCK_FOLDERS[folderIndex] = updatedFolder;
      
      return updatedFolder;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar pasta');
    }
  }
  
  async deleteFolder(id: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const folderIndex = MOCK_FOLDERS.findIndex(f => f.id === id);
      if (folderIndex === -1) {
        throw new Error('Pasta não encontrada');
      }
      
      // Verificar se há documentos na pasta
      const hasDocuments = MOCK_DOCUMENTS.some(doc => doc.folderId === id);
      if (hasDocuments) {
        throw new Error('Não é possível excluir pasta que contém documentos');
      }
      
      MOCK_FOLDERS.splice(folderIndex, 1);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao excluir pasta');
    }
  }
  
  // Templates
  async getTemplates(): Promise<DocumentTemplate[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      return MOCK_TEMPLATES;
    } catch (error) {
      throw new Error('Erro ao buscar templates');
    }
  }
  
  async createTemplate(data: CreateTemplateRequest): Promise<DocumentTemplate> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate: DocumentTemplate = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description,
        category: data.category,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: 0,
        downloadUrl: `/api/templates/${Date.now()}/download`,
        tags: data.tags || [],
        isPublic: data.isPublic || false,
        usageCount: 0,
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      MOCK_TEMPLATES.push(newTemplate);
      
      return newTemplate;
    } catch (error) {
      throw new Error('Erro ao criar template');
    }
  }
  
  // Compartilhamento
  async createShare(data: CreateShareRequest): Promise<DocumentShare> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const shareToken = Math.random().toString(36).substring(2, 15);
      
      const share: DocumentShare = {
        id: Date.now().toString(),
        documentId: data.documentId,
        shareToken,
        shareUrl: `${window.location.origin}/shared/${shareToken}`,
        expiresAt: data.expiresAt,
        password: !!data.password,
        downloadAllowed: data.downloadAllowed || true,
        viewCount: 0,
        maxViews: data.maxViews,
        createdBy: 'current-user',
        createdAt: new Date().toISOString()
      };
      
      return share;
    } catch (error) {
      throw new Error('Erro ao criar compartilhamento');
    }
  }
  
  // Busca avançada
  async searchDocuments(query: string, filters?: Partial<DocumentFilters>): Promise<DocumentsResponse> {
    const searchFilters: DocumentFilters = {
      search: query,
      ...filters
    };
    
    return this.getDocuments(searchFilters);
  }
  
  // OCR
  async processOcr(documentId: string): Promise<{ text: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simular processamento OCR
      
      const document = MOCK_DOCUMENTS.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Documento não encontrado');
      }
      
      const mockOcrText = `Texto extraído do documento ${document.title} através de OCR...`;
      
      // Atualizar documento com resultado do OCR
      document.ocrText = mockOcrText;
      document.isOcrProcessed = true;
      document.ocrProcessedAt = new Date().toISOString();
      document.searchableText = mockOcrText.toLowerCase();
      
      return { text: mockOcrText };
    } catch (error) {
      throw new Error('Erro ao processar OCR');
    }
  }
  
  // Estatísticas
  async getDocumentStats(): Promise<{
    total: number;
    byCategory: Record<DocumentCategory, number>;
    byStatus: Record<DocumentStatus, number>;
    byFileType: Record<DocumentType, number>;
    totalSize: number;
    recentUploads: number;
  }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const stats = {
        total: MOCK_DOCUMENTS.length,
        byCategory: {} as Record<DocumentCategory, number>,
        byStatus: {} as Record<DocumentStatus, number>,
        byFileType: {} as Record<DocumentType, number>,
        totalSize: MOCK_DOCUMENTS.reduce((sum, doc) => sum + doc.fileSize, 0),
        recentUploads: MOCK_DOCUMENTS.filter(doc => {
          const createdAt = new Date(doc.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt >= weekAgo;
        }).length
      };
      
      // Inicializar contadores
      Object.keys(DOCUMENT_CATEGORY_LABELS).forEach(category => {
        stats.byCategory[category as DocumentCategory] = 0;
      });
      Object.keys(DOCUMENT_STATUS_LABELS).forEach(status => {
        stats.byStatus[status as DocumentStatus] = 0;
      });
      Object.keys(DOCUMENT_TYPE_LABELS).forEach(type => {
        stats.byFileType[type as DocumentType] = 0;
      });
      
      // Contar documentos
      MOCK_DOCUMENTS.forEach(doc => {
        stats.byCategory[doc.category]++;
        stats.byStatus[doc.status]++;
        stats.byFileType[doc.fileType]++;
      });
      
      return stats;
    } catch (error) {
      throw new Error('Erro ao obter estatísticas');
    }
  }
  
  // Funções utilitárias
  getFileType(fileName: string): DocumentType {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc': return 'doc';
      case 'docx': return 'docx';
      case 'xls': return 'xls';
      case 'xlsx': return 'xlsx';
      case 'ppt': return 'ppt';
      case 'pptx': return 'pptx';
      case 'txt': return 'txt';
      case 'rtf': return 'rtf';
      case 'jpg': case 'jpeg': return 'jpeg';
      case 'png': return 'png';
      case 'gif': return 'gif';
      case 'bmp': return 'bmp';
      case 'tiff': return 'tiff';
      case 'svg': return 'svg';
      default: return 'other';
    }
  }
  
  getFolderPath(folderId: string): string {
    const folder = MOCK_FOLDERS.find(f => f.id === folderId);
    return folder ? folder.path : '/';
  }
  
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
  
  getDocumentIcon(document: Document): string {
    if (document.fileType.startsWith('image/')) {
      return '🖼️';
    }
    
    switch (document.fileType) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📽️';
      default: return '📎';
    }
  }
  
  getCategoryLabel(category: DocumentCategory): string {
    return DOCUMENT_CATEGORY_LABELS[category];
  }
  
  getStatusLabel(status: DocumentStatus): string {
    return DOCUMENT_STATUS_LABELS[status];
  }
  
  getSecurityLabel(security: DocumentSecurity): string {
    return DOCUMENT_SECURITY_LABELS[security];
  }
  
  getPriorityLabel(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
    return DOCUMENT_PRIORITY_LABELS[priority];
  }
  
  getStatusColor(status: DocumentStatus): string {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      archived: 'bg-blue-100 text-blue-800',
      deleted: 'bg-red-100 text-red-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status];
  }
  
  getSecurityColor(security: DocumentSecurity): string {
    const colors = {
      public: 'bg-green-100 text-green-800',
      internal: 'bg-blue-100 text-blue-800',
      confidential: 'bg-orange-100 text-orange-800',
      restricted: 'bg-red-100 text-red-800'
    };
    return colors[security];
  }
  
  getPriorityColor(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority];
  }
  
  // Options methods for form selects
  getCategoryOptions(): Record<string, string> {
    return DOCUMENT_CATEGORY_LABELS;
  }
  
  getStatusOptions(): Record<string, string> {
    return DOCUMENT_STATUS_LABELS;
  }
  
  getSecurityOptions(): Record<string, string> {
    return DOCUMENT_SECURITY_LABELS;
  }
  
  getPriorityOptions(): Record<string, string> {
    return DOCUMENT_PRIORITY_LABELS;
  }
}

export const documentsService = new DocumentsService();
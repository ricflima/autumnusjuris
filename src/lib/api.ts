// src/lib/api.ts

import axios from 'axios';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Criar instância do Axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erros específicos
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    if (error.response?.status >= 500) {
      console.error('Erro interno do servidor:', error);
    }
    
    return Promise.reject(error);
  }
);

// Tipos para as respostas da API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Funções utilitárias para chamadas da API
export const apiClient = {
  // GET
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
    return api.get(url, { params }).then(response => response.data);
  },
  
  // POST
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return api.post(url, data).then(response => response.data);
  },
  
  // PUT
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return api.put(url, data).then(response => response.data);
  },
  
  // PATCH
  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
    return api.patch(url, data).then(response => response.data);
  },
  
  // DELETE
  delete: <T = any>(url: string): Promise<ApiResponse<T>> => {
    return api.delete(url).then(response => response.data);
  },
  
  // Upload de arquivos
  upload: <T = any>(
    url: string, 
    file: File, 
    data?: any,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Adicionar dados extras se fornecidos
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          if (typeof data[key] === 'object') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });
    }
    
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    }).then(response => response.data);
  },
  
  // Download de arquivos
  download: (url: string, filename?: string): Promise<void> => {
    return api.get(url, {
      responseType: 'blob',
    }).then(response => {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    });
  }
};

// Endpoints específicos para documentos
export const documentsApi = {
  // Listar documentos
  list: (params?: any): Promise<PaginatedResponse> => {
  return apiClient.get<PaginatedResponse>('/documents', params).then(res => res.data);
  },
  
  // Obter documento por ID
  getById: (id: string) => {
    return apiClient.get(`/documents/${id}`);
  },
  
  // Upload de documento
  upload: (file: File, data: any, onProgress?: (progress: number) => void) => {
    return apiClient.upload('/documents/upload', file, data, onProgress);
  },
  
  // Atualizar documento
  update: (id: string, data: any) => {
    return apiClient.patch(`/documents/${id}`, data);
  },
  
  // Deletar documento
  delete: (id: string) => {
    return apiClient.delete(`/documents/${id}`);
  },
  
  // Download de documento
  download: (id: string, filename?: string) => {
    return apiClient.download(`/documents/${id}/download`, filename);
  },
  
  // Processar OCR
  processOcr: (id: string) => {
    return apiClient.post(`/documents/${id}/ocr`);
  },
  
  // Criar compartilhamento
  createShare: (id: string, data: any) => {
    return apiClient.post(`/documents/${id}/share`, data);
  },
  
  // Estatísticas
  getStats: () => {
    return apiClient.get('/documents/stats');
  }
};

// Endpoints para pastas
export const foldersApi = {
  list: () => apiClient.get('/folders'),
  create: (data: any) => apiClient.post('/folders', data),
  update: (id: string, data: any) => apiClient.patch(`/folders/${id}`, data),
  delete: (id: string) => apiClient.delete(`/folders/${id}`)
};

// Endpoints para templates
export const templatesApi = {
  list: () => apiClient.get('/templates'),
  create: (data: any) => apiClient.post('/templates', data),
  download: (id: string, filename?: string) => apiClient.download(`/templates/${id}/download`, filename)
};

export default api;
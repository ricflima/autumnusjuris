// src/lib/apiClient.ts - Simplified API client
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

// Environment configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://172.25.132.0:3001/api',
  timeout: 15000,
  retryAttempts: 2,
};

// Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = authService.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle responses and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            if (authService.getRefreshToken()) {
              const newToken = await authService.refreshToken();
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            console.error('Token refresh failed:', refreshError);
            await authService.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        const apiError: ApiError = {
          message: (error.response?.data as any)?.message || error.message || 'Erro desconhecido',
          code: error.code || 'UNKNOWN_ERROR',
          status: error.response?.status || 0,
          details: (error.response?.data as any)?.details,
        };

        if (import.meta.env.DEV) {
          console.error('🚨 API Error:', apiError);
        }

        // Show toast for user errors (4xx)
        if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          toast.error(apiError.message);
        }

        return Promise.reject(apiError);
      }
    );
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, config);
      return {
        data: response.data,
        success: true,
        message: response.data?.message,
        meta: response.data?.meta,
      };
    } catch (error) {
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data, config);
      return {
        data: response.data,
        success: true,
        message: response.data?.message,
        meta: response.data?.meta,
      };
    } catch (error) {
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return {
        data: response.data,
        success: true,
        message: response.data?.message,
        meta: response.data?.meta,
      };
    } catch (error) {
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(url, data, config);
      return {
        data: response.data,
        success: true,
        message: response.data?.message,
        meta: response.data?.meta,
      };
    } catch (error) {
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return {
        data: response.data,
        success: true,
        message: response.data?.message,
        meta: response.data?.meta,
      };
    } catch (error) {
      throw error;
    }
  }

  // Utility methods
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  getBaseURL(): string {
    return API_CONFIG.baseURL;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
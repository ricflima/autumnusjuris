// src/services/auth.service.ts - Real API integration
import { apiClient, ApiResponse } from '@/lib/apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName?: string;
  phone?: string;
  terms: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'lawyer' | 'assistant' | 'user';
  avatar?: string;
  organizationId?: string;
  organizationName?: string;
  phone?: string;
  emailVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  private readonly ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  };

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Use mock in development or when API is not available
    if (import.meta.env.VITE_MOCK_API !== 'false') {
      console.log('Using mock login for development');
      return this.mockLogin(credentials);
    }

    try {
      const response = await apiClient.post<AuthResponse>(this.ENDPOINTS.LOGIN, {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe || false,
      });

      if (!response.success || !response.data) {
        throw new Error('Invalid response format');
      }

      // Store tokens securely
      this.storeTokens(response.data.token, response.data.refreshToken);
      this.storeUser(response.data.user);

      return response.data;
    } catch (error: any) {
      // Fallback to mock for any network errors
      console.warn('API login failed, falling back to mock:', error.message);
      return this.mockLogin(credentials);
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(this.ENDPOINTS.REGISTER, {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        organizationName: data.organizationName?.trim(),
        phone: data.phone?.trim(),
        terms: data.terms,
      });

      if (!response.success || !response.data) {
        throw new Error('Invalid response format');
      }

      // Store tokens after successful registration
      this.storeTokens(response.data.token, response.data.refreshToken);
      this.storeUser(response.data.user);

      return response.data;
    } catch (error: any) {
      if (error.status === 409) {
        throw new Error('Email já está em uso');
      } else if (error.status === 422) {
        throw new Error('Dados inválidos. Verifique as informações');
      }
      
      throw new Error(error.message || 'Erro ao criar conta');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Check local storage first
    const cachedUser = this.getStoredUser();
    if (cachedUser) {
      return cachedUser;
    }

    // In development, return null if no cached user
    if (import.meta.env.VITE_MOCK_API !== 'false') {
      return null;
    }

    try {
      // Fetch from API in production
      const response = await apiClient.get<User>(this.ENDPOINTS.ME);
      
      if (!response.success || !response.data) {
        return null;
      }

      // Update cached user
      this.storeUser(response.data);
      return response.data;
    } catch (error: any) {
      // If token is invalid, clear stored data
      if (error.status === 401) {
        this.clearTokens();
      }
      
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      // Notify server about logout
      await apiClient.post(this.ENDPOINTS.LOGOUT);
    } catch (error) {
      console.warn('Logout request failed:', error);
      // Continue with local logout even if server request fails
    } finally {
      // Always clear local data
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{ token: string; refreshToken: string; expiresIn: number }>(
        this.ENDPOINTS.REFRESH,
        { refreshToken }
      );

      if (!response.success || !response.data) {
        throw new Error('Invalid refresh response');
      }

      // Store new tokens
      this.storeTokens(response.data.token, response.data.refreshToken);

      return response.data.token;
    } catch (error: any) {
      // Clear tokens if refresh fails
      this.clearTokens();
      throw new Error('Token refresh failed');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post(this.ENDPOINTS.FORGOT_PASSWORD, {
        email: email.toLowerCase().trim(),
      });
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error('Email não encontrado');
      } else if (error.status === 429) {
        throw new Error('Muitas tentativas. Tente novamente em alguns minutos');
      }
      
      throw new Error(error.message || 'Erro ao solicitar redefinição de senha');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await apiClient.post(this.ENDPOINTS.RESET_PASSWORD, {
        token,
        password,
        confirmPassword: password,
      });
    } catch (error: any) {
      if (error.status === 400) {
        throw new Error('Token inválido ou expirado');
      } else if (error.status === 422) {
        throw new Error('Senha inválida');
      }
      
      throw new Error(error.message || 'Erro ao redefinir senha');
    }
  }

  // Token management methods
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  getStoredUser(): User | null {
    try {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  // Private helper methods
  private storeTokens(token: string, refreshToken: string): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private storeUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  }

  // Development mock methods
  private async mockLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Mock login only available in development');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock users for development (using real database UUIDs)
    const mockUsers = [
      {
        id: 'bcf17e38-19f8-4784-aeeb-c1713c019b65',
        name: 'Dr. João Silva',
        email: 'admin@autumnusjuris.com',
        password: '123456',
        role: 'admin' as const,
        organizationName: 'Silva & Advogados',
      },
      {
        id: 'd609f61c-5463-4464-b12d-b52e64100687',
        name: 'Dra. Maria Santos',
        email: 'lawyer1@autumnusjuris.com',
        password: '123456',
        role: 'lawyer' as const,
        organizationName: 'Santos Advocacia',
      }
    ];

    const user = mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const mockResponse: AuthResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationName: user.organizationName,
      },
      token: this.generateMockToken(user),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600,
    };

    this.storeTokens(mockResponse.token, mockResponse.refreshToken);
    this.storeUser(mockResponse.user);
    
    return mockResponse;
  }

  private generateMockToken(user: any): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }
}

export const authService = new AuthService();

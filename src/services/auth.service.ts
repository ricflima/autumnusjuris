// src/services/auth.service.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Simulação de usuários para desenvolvimento (remover em produção)
const MOCK_USERS = [
  {
    id: '1',
    name: 'Dr. João Silva',
    email: 'joao@autumnusjuris.com',
    password: '123456',
    role: 'admin',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    email: 'maria@autumnusjuris.com',
    password: '123456',
    role: 'lawyer',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
];

// Simular delay de rede
const simulateDelay = (ms: number = 1500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Gerar JWT token simples (apenas para desenvolvimento)
const generateMockToken = (user: any): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    userId: user.id, 
    email: user.email,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
  }));
  const signature = btoa('mock_signature');
  return `${header}.${payload}.${signature}`;
};

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Em produção, remover esta simulação e usar API real
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay();
        
        const user = MOCK_USERS.find(
          u => u.email === credentials.email && u.password === credentials.password
        );

        if (!user) {
          throw new Error('Credenciais inválidas');
        }

        const token = generateMockToken(user);
        const { password, ...userWithoutPassword } = user;
        
        const response: AuthResponse = {
          user: userWithoutPassword,
          token,
          refreshToken: `refresh_${token}`,
        };

        // Salvar no localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));

        return response;
      }

      // API real (implementar quando backend estiver pronto)
      const response = await api.post('/auth/login', credentials);
      const { user, token, refreshToken } = response.data;

      // Salvar no localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      return { user, token, refreshToken };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Erro no login');
    }
  }

  async logout(): Promise<void> {
    try {
      // Em produção, chamar API para invalidar token
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        await simulateDelay(500);
      } else {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar dados locais sempre
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      // Verificar se tem dados salvos localmente
      const savedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('Token não encontrado');
      }

      if (savedUser) {
        return JSON.parse(savedUser);
      }

      // Em produção, buscar dados atualizados da API
      if (import.meta.env.VITE_MOCK_API !== 'false') {
        throw new Error('Usuário não encontrado');
      }

      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw new Error('Falha ao obter dados do usuário');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      if (import.meta.env.VITE_MOCK_API !== 'false') {
        // Simulação para desenvolvimento
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          const newToken = generateMockToken(user);
          
          localStorage.setItem('auth_token', newToken);
          
          return {
            user,
            token: newToken,
            refreshToken: `refresh_${newToken}`,
          };
        }
        throw new Error('Usuário não encontrado');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      const { user, token, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      return { user, token, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Falha ao renovar token');
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    return !!(token && user);
  }

  getStoredUser(): User | null {
    try {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();

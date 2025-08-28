// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  
  // Helper methods for external usage
  getToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (token: string, refreshToken: string) => void;
}

const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true 
        });
      },

      setToken: (token: string) => {
        set({ token });
      },

      clearUser: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        // Limpar localStorage também
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Limpar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      },

      // Helper methods for external usage
      getToken: () => get().token,
      getRefreshToken: () => localStorage.getItem('refresh_token'),
      setTokens: (token: string, refreshToken: string) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        set({ token });
      },
    }),
    {
      name: 'auth-storage',
      // Apenas persistir dados essenciais
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Export hook for React components
export const useAuthStore = authStore;

// Export store instance for external usage
export { authStore };

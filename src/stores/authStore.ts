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
}

export const useAuthStore = create<AuthState>()(
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

// src/App.tsx - ATUALIZADO PARA FASE 4
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Query Client
import { queryClient } from '@/lib/queryClient';

// Components
import { ProtectedRoute, PublicRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import Dashboard from '@/pages/dashboard/Dashboard';

// Cases
import CasesList from '@/pages/cases/CasesList';
import CreateCase from '@/pages/cases/CreateCase';

// Clients
import ClientsList from '@/pages/clients/ClientsList';
import CreateClient from '@/pages/clients/CreateClient';
import ClientDetail from '@/pages/clients/ClientDetail';

// Processes - NOVOS PARA FASE 4
import ProcessesList from '@/pages/processes/ProcessesList';
import CreateProcess from '@/pages/processes/CreateProcess';
import ProcessDetail from '@/pages/processes/ProcessDetail';
import ProcessCalendar from '@/pages/calendar/ProcessCalendar';

// Error Pages
import NotFound from '@/pages/errors/NotFound';
import Unauthorized from '@/pages/errors/Unauthorized';

// Placeholder pages
import ComingSoon from '@/pages/common/ComingSoon';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Rotas públicas (apenas para usuários NÃO logados) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Redirect da raiz para dashboard se logado, senão para login */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Rotas protegidas (apenas para usuários logados) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === CASOS === */}
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <Layout>
                <CasesList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateCase />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon 
                  title="Visualizar Caso" 
                  message="A página de detalhes do caso está em desenvolvimento"
                  estimatedDate="Fase 5"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon 
                  title="Editar Caso" 
                  message="A página de edição do caso está em desenvolvimento"
                  estimatedDate="Fase 5"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === CLIENTES === */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientsList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateClient />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon 
                  title="Editar Cliente" 
                  message="A página de edição do cliente está em desenvolvimento"
                  estimatedDate="Próxima atualização"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === PROCESSOS - NOVOS PARA FASE 4 === */}
        <Route
          path="/processes"
          element={
            <ProtectedRoute>
              <Layout>
                <ProcessesList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/processes/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateProcess />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/processes/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ProcessDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/processes/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon 
                  title="Editar Processo" 
                  message="A página de edição do processo está em desenvolvimento"
                  estimatedDate="Próxima atualização"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === CALENDÁRIO - ATUALIZADO PARA FASE 4 === */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <ProcessCalendar />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === OUTROS MÓDULOS === */}
        <Route
          path="/financial"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon 
                  title="Financeiro" 
                  message="O módulo financeiro está em desenvolvimento" 
                  estimatedDate="Fase 6"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon 
                  title="Configurações" 
                  message="A página de configurações está em desenvolvimento" 
                  estimatedDate="Fase 7"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon 
                  title="Meu Perfil" 
                  message="A página de perfil está em desenvolvimento" 
                  estimatedDate="Fase 7"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Páginas de erro */}
        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        {/* 404 - Página não encontrada */}
        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            padding: '12px 16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#ef4444',
            },
          },
          loading: {
            iconTheme: {
              primary: '#6366f1',
              secondary: '#fff',
            },
            style: {
              background: '#6366f1',
            },
          },
        }}
      />

      {/* React Query DevTools (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom" // painel sempre "top" | "bottom" | "left" | "right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
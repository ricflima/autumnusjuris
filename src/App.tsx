// src/App.tsx - ATUALIZADO PARA FASE 6 - GESTÃO FINANCEIRA
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
import CaseDetail from '@/pages/cases/CaseDetail';
import EditCase from '@/pages/cases/EditCase';

// Clients
import ClientsList from '@/pages/clients/ClientsList';
import CreateClient from '@/pages/clients/CreateClient';
import ClientDetail from '@/pages/clients/ClientDetail';

// Processes
import ProcessesList from '@/pages/processes/ProcessesList';
import CreateProcess from '@/pages/processes/CreateProcess';
import ProcessDetail from '@/pages/processes/ProcessDetail';
import ProcessCalendar from '@/pages/calendar/ProcessCalendar';
import EditProcess from '@/pages/processes/EditProcess';

// Documents
import DocumentsList from '@/pages/documents/DocumentsList';
import DocumentUpload from '@/pages/documents/DocumentUpload';
import DocumentViewer from '@/pages/documents/DocumentViewer';
import TemplateLibrary from '@/pages/documents/TemplateLibrary';

// Financial - NOVO PARA FASE 6
import FinancialDashboard from '@/pages/financial/FinancialDashboard';
import InvoicesList from '@/pages/financial/InvoicesList';
import CreateInvoice from '@/pages/financial/CreateInvoice';
import PaymentsList from '@/pages/financial/PaymentsList';
import CreatePayment from '@/pages/financial/CreatePayment';
import ExpensesList from '@/pages/financial/ExpensesList';
import CreateExpense from '@/pages/financial/CreateExpense';
import FinancialReports from '@/pages/financial/FinancialReports';
import EditInvoice from '@/pages/financial/EditInvoice';
import ViewInvoice from '@/pages/financial/ViewInvoice';
import TransactionsList from '@/pages/financial/TransactionsList';

// Analytics
import Analytics from '@/pages/analytics/Analytics';

// Settings
import Settings from '@/pages/settings/Settings';

// Tasks
import TasksList from '@/pages/tasks/TasksList';

// Search
import SearchResults from '@/pages/search/SearchResults';

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
                <CaseDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <EditCase />
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

        {/* === PROCESSOS === */}
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
                <EditProcess />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === CALENDÁRIO === */}
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

        {/* === DOCUMENTOS === */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentUpload />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/documents/templates"
          element={
            <ProtectedRoute>
              <Layout>
                <TemplateLibrary />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/documents/:id/view"
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentViewer />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === FINANCEIRO - NOVO PARA FASE 6 === */}
        <Route
          path="/financial"
          element={
            <ProtectedRoute>
              <Layout>
                <FinancialDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Faturas */}
        <Route
          path="/financial/invoices"
          element={
            <ProtectedRoute>
              <Layout>
                <InvoicesList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial/invoices/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateInvoice />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial/invoices/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ViewInvoice />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial/invoices/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <EditInvoice />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Pagamentos */}
        <Route
          path="/financial/payments"
          element={
            <ProtectedRoute>
              <Layout>
                <PaymentsList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial/payments/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreatePayment />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Despesas */}
        <Route
          path="/financial/expenses"
          element={
            <ProtectedRoute>
              <Layout>
                <ExpensesList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/financial/expenses/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateExpense />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Relatórios Financeiros */}
        <Route
          path="/financial/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <FinancialReports />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Transações */}
        <Route
          path="/financial/transactions"
          element={
            <ProtectedRoute>
              <Layout>
                <TransactionsList />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === OUTROS MÓDULOS === */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
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
                  title="Perfil" 
                  message="A página de perfil está em desenvolvimento" 
                  estimatedDate="Fase 7"
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        // No App.tsx - uma rota que captura todas as subrotas:
        <Route path="/analytics/*" element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
          } 
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <TasksList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Layout>
                <SearchResults />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* === PÁGINAS DE ERRO === */}
        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

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
          },
        }}
      />

      {/* React Query DevTools - apenas em desenvolvimento */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
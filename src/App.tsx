// src/App.tsx - Sistema de Gestão Jurídica
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Query Client
import { queryClient } from '@/lib/queryClient';

// Components
import { ProtectedRoute, PublicRoute } from '@/components/common/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

// Pages - Direct imports for better UX and reliability
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
import EditClient from '@/pages/clients/EditClient';
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
import EditDocument from '@/pages/documents/EditDocument';
import TemplateLibrary from '@/pages/documents/TemplateLibrary';

// Financial
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
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
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

        {/* Cases Routes */}
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

        {/* Clients Routes */}
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
          path="/clients/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <EditClient />
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

        {/* Processes Routes */}
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

        {/* Documents Routes */}
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
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentViewer />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <EditDocument />
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

        {/* Financial Routes */}
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
          path="/financial/invoices/new"
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
          path="/financial/payments/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CreatePayment />
              </Layout>
            </ProtectedRoute>
          }
        />
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
          path="/financial/expenses/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateExpense />
              </Layout>
            </ProtectedRoute>
          }
        />
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

        {/* Analytics Routes */}
        <Route
          path="/analytics/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settings Routes */}
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

        {/* Tasks Routes */}
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

        {/* Search Routes */}
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

        {/* Coming Soon Routes */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <ComingSoon title="Relatórios" message="Esta funcionalidade está em desenvolvimento" />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route
          path="/unauthorized"
          element={
            <ProtectedRoute>
              <Layout>
                <Unauthorized />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

        {/* Global Components */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Development Tools */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
    </QueryClientProvider>
  );
}

export default App;
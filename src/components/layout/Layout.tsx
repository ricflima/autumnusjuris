// src/components/layout/Layout.tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Scale,
  Home,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  BarChart3,
  ChevronDown,
  Gavel,
  PenTool,
  Brain,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Casos', href: '/cases', icon: FileText },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Processos', href: '/processes', icon: Gavel },
  // v1.1.0 Phase 0 - Sistema de Consulta de Movimentações
  { name: 'Movimentações', href: '/integrations/tribunals', icon: Building2, badge: 'NOVO' },
  { name: 'Documentos', href: '/documents', icon: FileText },
  { name: 'Calendário', href: '/calendar', icon: Calendar },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Analytics & BI', href: '/analytics', icon: BarChart3, badge: 'NOVO' },
  // Fase 9 - Funcionalidades Avançadas
  { name: 'Assinaturas', href: '/signatures', icon: PenTool, badge: 'NOVO' },
  { name: 'IA Documentos', href: '/ai/document-analysis', icon: Brain, badge: 'NOVO' },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isLogoutLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Autumnus Juris</h1>
                <p className="text-xs text-gray-500">Sistema Jurídico</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isCurrentPath(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${isActive 
                        ? 'bg-slate-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Icon className={`
                        mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200
                        ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                      `} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User section */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-gray-900">Autumnus Juris</h1>
                </div>
              </div>
              
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = isCurrentPath(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center justify-between px-2 py-2 text-base font-medium rounded-md transition-colors
                        ${isActive 
                          ? 'bg-slate-900 text-white' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <Icon className={`
                          mr-4 flex-shrink-0 h-5 w-5
                          ${isActive ? 'text-white' : 'text-gray-400'}
                        `} />
                        {item.name}
                      </div>
                      {item.badge && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-slate-900 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-gray-700">
                    {user?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          {/* Mobile menu button */}
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-end items-center">
            {/* Right side */}
            <div className="ml-4 flex items-center md:ml-6 gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  3
                </span>
              </Button>
              
              {/* User menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3"
                >
                  <div className="h-6 w-6 bg-slate-900 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
                
                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="inline w-4 h-4 mr-2" />
                        Meu Perfil
                      </button>
                      
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/settings');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="inline w-4 h-4 mr-2" />
                        Configurações
                      </button>
                      
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          disabled={isLogoutLoading}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <LogOut className="inline w-4 h-4 mr-2" />
                          {isLogoutLoading ? 'Saindo...' : 'Sair'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}

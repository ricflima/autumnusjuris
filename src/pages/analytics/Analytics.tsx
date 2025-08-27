// src/pages/analytics/Analytics.tsx
// Componente principal que unifica todo o sistema de Analytics da Fase 7

import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  Settings,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Importar os componentes criados
import AnalyticsDashboard from './AnalyticsDashboard';
import AdvancedReports from './AdvancedReports';
import BusinessIntelligence from './BusinessIntelligence';

// Componente principal de navegação
const AnalyticsNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveTab = () => {
    if (location.pathname.includes('/dashboard')) return 'dashboard';
    if (location.pathname.includes('/reports')) return 'reports';
    if (location.pathname.includes('/intelligence')) return 'intelligence';
    return 'dashboard';
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        navigate('/analytics/dashboard');
        break;
      case 'reports':
        navigate('/analytics/reports');
        break;
      case 'intelligence':
        navigate('/analytics/intelligence');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Analytics Avançado
          </h1>
          <p className="text-gray-600">
            Sistema completo de Business Intelligence e relatórios customizáveis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Fase 7 - Implementada
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Navegação por tabs */}
      <div className="border-b border-gray-200">
        <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-2/3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              BI & IA
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo das rotas */}
      <Routes>
        <Route path="/" element={<Navigate to="/analytics/dashboard" replace />} />
        <Route path="/dashboard" element={<AnalyticsDashboard />} />
        <Route path="/reports" element={<AdvancedReports />} />
        <Route path="/intelligence" element={<BusinessIntelligence />} />
      </Routes>
    </div>
  );
};

export default AnalyticsNavigation;
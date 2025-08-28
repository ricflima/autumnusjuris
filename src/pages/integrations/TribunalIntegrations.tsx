// src/pages/integrations/TribunalIntegrations.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Globe,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  Eye,
  Download,
  Upload,
  Zap,
  Shield,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

// Mock data para demonstração
const TRIBUNAL_INTEGRATIONS = [
  {
    id: 'pje',
    name: 'PJe - Processo Judicial Eletrônico',
    description: 'Sistema do Conselho Nacional de Justiça',
    status: 'connected',
    lastSync: '2025-01-28T10:30:00Z',
    processesCount: 156,
    icon: Building2,
    color: 'bg-blue-500',
  },
  {
    id: 'esaj',
    name: 'ESAJ - Sistema de Automação da Justiça',
    description: 'Tribunal de Justiça de São Paulo',
    status: 'pending',
    lastSync: null,
    processesCount: 0,
    icon: Globe,
    color: 'bg-orange-500',
  },
  {
    id: 'projudi',
    name: 'PROJUDI - Processo Judicial Digital',
    description: 'Sistema dos Tribunais Federais',
    status: 'error',
    lastSync: '2025-01-27T15:20:00Z',
    processesCount: 23,
    icon: Shield,
    color: 'bg-red-500',
  },
];

const STATUS_CONFIG = {
  connected: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Conectado'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pendente'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Erro'
  },
};

export function TribunalIntegrations() {
  const [syncInProgress, setSyncInProgress] = useState(false);

  const handleSync = async (tribunalId: string) => {
    setSyncInProgress(true);
    // Simular sincronização
    await new Promise(resolve => setTimeout(resolve, 3000));
    setSyncInProgress(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Integração com Tribunais
          </h1>
          <p className="text-gray-600">
            Conecte-se automaticamente aos sistemas dos tribunais
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Integração
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Conectados</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Processos Sincronizados</p>
                <p className="text-2xl font-bold">179</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Última Sincronização</p>
                <p className="text-sm font-bold">Hoje às 10:30</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Integrações */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {TRIBUNAL_INTEGRATIONS.map((integration) => {
              const Icon = integration.icon;
              const statusConfig = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${integration.color} rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {integration.description}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Processos:</span>
                        <span className="font-medium ml-2">
                          {integration.processesCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Última sync:</span>
                        <span className="font-medium ml-2">
                          {integration.lastSync ? 'Hoje 10:30' : 'Nunca'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleSync(integration.id)}
                        disabled={syncInProgress}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Sincronização */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Sincronização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sincronização Automática</h3>
                  <p className="text-sm text-gray-600">
                    Sincronizar automaticamente a cada 4 horas
                  </p>
                </div>
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notificações de Andamentos</h3>
                  <p className="text-sm text-gray-600">
                    Receber notificações sobre novos andamentos
                  </p>
                </div>
                <Switch checked={true} onCheckedChange={() => {}} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Backup Automático</h3>
                  <p className="text-sm text-gray-600">
                    Fazer backup dos dados sincronizados
                  </p>
                </div>
                <Switch checked={false} onCheckedChange={() => {}} />
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Progresso da Sincronização</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>PJe - Processos</span>
                      <span>156/200</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>PROJUDI - Andamentos</span>
                      <span>23/45</span>
                    </div>
                    <Progress value={51} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    time: '10:30',
                    action: 'Sincronização PJe concluída',
                    status: 'success',
                    details: '12 novos andamentos importados'
                  },
                  {
                    time: '09:45',
                    action: 'Erro na sincronização PROJUDI',
                    status: 'error',
                    details: 'Certificado digital expirado'
                  },
                  {
                    time: '08:15',
                    action: 'Backup automático concluído',
                    status: 'success',
                    details: 'Dados salvos com segurança'
                  },
                ].map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={`p-1 rounded-full ${
                      log.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {log.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-xs text-gray-500">{log.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
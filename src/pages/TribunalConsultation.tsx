import React, { useState } from 'react';
import { Scale, Bell, BarChart3, Settings, Search, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProcessSearch from '@/components/tribunals/ProcessSearch';
import NoveltyDashboard from '@/components/tribunals/NoveltyDashboard';
import TribunalStats from '@/components/tribunals/TribunalStats';

interface TribunalConsultationProps {}

export const TribunalConsultation: React.FC<TribunalConsultationProps> = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [lastSearchResults, setLastSearchResults] = useState<any>(null);
  const [unreadNovelties, setUnreadNovelties] = useState<number>(0);

  const handleSearchResults = (results: any) => {
    setLastSearchResults(results);
    
    // Se encontrou novidades, atualizar contador
    if (results.novelties && results.novelties.length > 0) {
      setUnreadNovelties(prev => prev + results.novelties.length);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            Sistema de Consulta de Tribunais
          </h1>
          <p className="text-muted-foreground mt-2">
            Consulte processos judiciais com detecção automática de novidades
          </p>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Sistema Ativo</span>
          </div>
          
          {unreadNovelties > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadNovelties} Novidades
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {lastSearchResults && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Última consulta: <strong>{lastSearchResults.processNumber}</strong> em {lastSearchResults.tribunal}
              {lastSearchResults.newMovements > 0 && (
                <span className="ml-2 text-green-600 font-semibold">
                  • {lastSearchResults.newMovements} movimentação(ões) nova(s)
                </span>
              )}
            </span>
            <Badge variant={lastSearchResults.fromCache ? "secondary" : "default"}>
              {lastSearchResults.fromCache ? 'Cache' : 'Consulta Direta'}
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Consultar Processos
          </TabsTrigger>
          <TabsTrigger value="novelties" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Novidades
            {unreadNovelties > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {unreadNovelties}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Consultar Processos */}
        <TabsContent value="search" className="space-y-6">
          <ProcessSearch onResultsFound={handleSearchResults} />

          {/* Instruções de Uso */}
          <Card>
            <CardHeader>
              <CardTitle>Como usar o sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">🔍 Consulta de Processos</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Digite o número CNJ completo (20 dígitos)</li>
                    <li>• O sistema identifica automaticamente o tribunal</li>
                    <li>• Cache inteligente acelera consultas repetidas</li>
                    <li>• Detecta novidades automaticamente</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">🔔 Sistema de Novidades</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Movimentações novas ficam marcadas por 48h</li>
                    <li>• Priorização automática (urgente, alta, média, baixa)</li>
                    <li>• Tags inteligentes baseadas no conteúdo</li>
                    <li>• Notificações de movimentações importantes</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">📋 Tribunais Suportados</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Tribunais de Justiça</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Tribunais do Trabalho</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Tribunais Federais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Tribunais Superiores</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Novidades */}
        <TabsContent value="novelties">
          <NoveltyDashboard />
        </TabsContent>

        {/* Tab: Estatísticas */}
        <TabsContent value="statistics">
          <TribunalStats />
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cache Settings */}
              <div>
                <h4 className="font-semibold mb-3">💾 Configurações de Cache</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Cache de Memória</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• TTL padrão: 60 minutos</li>
                      <li>• Tamanho máximo: 100MB</li>
                      <li>• Limpeza automática: 15 minutos</li>
                      <li>• Status: Ativo</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Cache Persistente</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Armazenamento: PostgreSQL</li>
                      <li>• TTL configurável por consulta</li>
                      <li>• Backup automático</li>
                      <li>• Status: Ativo</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Novelty Settings */}
              <div>
                <h4 className="font-semibold mb-3">🔔 Configurações de Novidades</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Controle de TTL</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• TTL padrão: 48 horas</li>
                      <li>• Limpeza automática: 1 hora</li>
                      <li>• Máximo por processo: 50</li>
                      <li>• Notificações: Ativas</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Regras de Prioridade</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Sentenças: Urgente</li>
                      <li>• Decisões e Audiências: Alta</li>
                      <li>• Intimações: Alta</li>
                      <li>• Despachos: Média</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div>
                <h4 className="font-semibold mb-3">⚙️ Informações do Sistema</h4>
                <div className="p-4 border rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versão:</span>
                    <span className="font-mono">v1.1.0 - Fase 0 Completa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Backend:</span>
                    <span className="font-mono">Node.js + PostgreSQL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frontend:</span>
                    <span className="font-mono">React + TypeScript</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tribunais Configurados:</span>
                    <span className="font-semibold">42 tribunais</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default">Produção</Badge>
                  </div>
                </div>
              </div>

              {/* Phase Info */}
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Fase 0 Completa</strong> - Sistema de fundação implementado com sucesso. 
                  As Fases 1-6 implementarão os scrapers específicos de cada tribunal conforme o roadmap.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TribunalConsultation;
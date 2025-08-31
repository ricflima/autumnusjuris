import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Database, TrendingUp, Activity, HardDrive, Zap, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TribunalMovementsService from '@/services/tribunalMovements.service';

interface TribunalStatsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const TribunalStats: React.FC<TribunalStatsProps> = ({ 
  autoRefresh = true,
  refreshInterval = 60000 // 1 minuto
}) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const service = TribunalMovementsService.getInstance();

  const loadStatistics = async () => {
    setIsLoading(true);
    setError('');

    try {
      await service.initialize();
      const systemStats = await service.getSystemStatistics();
      setStats(systemStats);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const runCleanup = async () => {
    try {
      setIsLoading(true);
      await service.runSystemCleanup();
      await loadStatistics(); // Recarregar após limpeza
    } catch (err) {
      setError('Erro ao executar limpeza do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Auto-refresh
  useEffect(() => {
    loadStatistics();
    
    if (autoRefresh) {
      const interval = setInterval(loadStatistics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (isLoading && !stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Estatísticas do Sistema</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadStatistics}
            disabled={isLoading}
          >
            <Activity className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={runCleanup}
            disabled={isLoading}
          >
            <HardDrive className="w-4 h-4" />
            Limpar Sistema
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="tribunals">Tribunais</TabsTrigger>
            <TabsTrigger value="novelties">Novidades</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cache Performance */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taxa de Cache</p>
                      <p className="text-2xl font-bold">
                        {stats.cache.memoryCache.hitRate.toFixed(1)}%
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-green-500" />
                  </div>
                  <Progress 
                    value={stats.cache.memoryCache.hitRate} 
                    className="mt-3"
                  />
                </CardContent>
              </Card>

              {/* Novidades */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Novidades</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.novelties.unread}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.novelties.total} total
                  </p>
                </CardContent>
              </Card>

              {/* Tribunais Ativos */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tribunais</p>
                      <p className="text-2xl font-bold">
                        {stats.tribunals.filter((t: any) => t.totalProcesses > 0).length}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.tribunals.length} configurados
                  </p>
                </CardContent>
              </Card>

              {/* Uso de Memória */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cache Memory</p>
                      <p className="text-2xl font-bold">
                        {formatBytes(stats.cache.memoryCache.totalSize)}
                      </p>
                    </div>
                    <HardDrive className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.cache.memoryCache.totalItems} itens
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline de Atividades */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Sistema inicializado com sucesso</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.cache.memoryCache.totalItems} itens no cache
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {lastUpdate.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  {stats.novelties.unread > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">{stats.novelties.unread} novidades não lidas</p>
                        <p className="text-xs text-muted-foreground">
                          Requer atenção
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">Ativo</Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Cache funcionando normalmente</p>
                      <p className="text-xs text-muted-foreground">
                        Taxa de acerto: {stats.cache.memoryCache.hitRate.toFixed(1)}%
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Estável</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Stats */}
          <TabsContent value="cache" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cache de Memória</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total de Hits</p>
                      <p className="text-lg font-semibold">{formatNumber(stats.cache.memoryCache.hits)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total de Misses</p>
                      <p className="text-lg font-semibold">{formatNumber(stats.cache.memoryCache.misses)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de Acerto</p>
                      <p className="text-lg font-semibold text-green-600">
                        {stats.cache.memoryCache.hitRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Itens Armazenados</p>
                      <p className="text-lg font-semibold">{stats.cache.memoryCache.totalItems}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Uso de Memória</p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(stats.cache.memoryCache.totalSize / (100 * 1024 * 1024)) * 100} 
                        className="flex-1"
                      />
                      <span className="text-sm font-mono">
                        {formatBytes(stats.cache.memoryCache.totalSize)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Persistente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Hits</p>
                      <p className="text-lg font-semibold">{formatNumber(stats.cache.persistentCache.hits)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Misses</p>
                      <p className="text-lg font-semibold">{formatNumber(stats.cache.persistentCache.misses)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de Acerto</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {stats.cache.persistentCache.hitRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total de Itens</p>
                      <p className="text-lg font-semibold">{stats.cache.persistentCache.totalItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Operações de Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatNumber(stats.cache.operations.gets)}</p>
                    <p className="text-muted-foreground">Gets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatNumber(stats.cache.operations.sets)}</p>
                    <p className="text-muted-foreground">Sets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatNumber(stats.cache.operations.deletes)}</p>
                    <p className="text-muted-foreground">Deletes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatNumber(stats.cache.operations.cleanups)}</p>
                    <p className="text-muted-foreground">Cleanups</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tribunals Stats */}
          <TabsContent value="tribunals" className="space-y-6">
            <div className="grid gap-4">
              {stats.tribunals && stats.tribunals.length > 0 ? (
                stats.tribunals
                  .sort((a: any, b: any) => b.totalProcesses - a.totalProcesses)
                  .slice(0, 10)
                  .map((tribunal: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{tribunal.tribunalName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Código: {tribunal.tribunalCode}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-lg font-bold">{tribunal.totalProcesses}</p>
                              <p className="text-xs text-muted-foreground">Processos</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold">{tribunal.totalMovements}</p>
                              <p className="text-xs text-muted-foreground">Movimentações</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{tribunal.newMovements}</p>
                              <p className="text-xs text-muted-foreground">Novas</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum tribunal com dados</h3>
                    <p className="text-muted-foreground">
                      Faça algumas consultas para ver as estatísticas dos tribunais
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Novelties Stats */}
          <TabsContent value="novelties" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Prioridade</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.novelties.byPriority && Object.keys(stats.novelties.byPriority).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.novelties.byPriority).map(([priority, count]: [string, any]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              priority === 'urgent' ? 'destructive' :
                              priority === 'high' ? 'default' :
                              'secondary'
                            }>
                              {priority}
                            </Badge>
                          </div>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Nenhuma novidade encontrada</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Novidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{stats.novelties.total}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Não Lidas</p>
                      <p className="text-lg font-semibold text-red-600">{stats.novelties.unread}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expirando (24h)</p>
                      <p className="text-lg font-semibold text-yellow-600">{stats.novelties.expiring24h || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiradas</p>
                      <p className="text-lg font-semibold text-gray-500">{stats.novelties.expired || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Última atualização: {lastUpdate.toLocaleString('pt-BR')}
      </div>
    </div>
  );
};

export default TribunalStats;
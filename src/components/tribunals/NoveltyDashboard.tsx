import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, Eye, EyeOff, Filter, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TribunalApiService from '@/services/tribunalApi.service';

interface NoveltyDashboardProps {
  refreshInterval?: number;
}

export const NoveltyDashboard: React.FC<NoveltyDashboardProps> = ({ 
  refreshInterval = 30000 // 30 segundos
}) => {
  const [novelties, setNovelties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showReadItems, setShowReadItems] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const service = TribunalApiService.getInstance();

  const loadNovelties = async () => {
    setIsLoading(true);
    setError('');

    try {
      await service.initialize();
      
      // Buscar novidades não lidas
      const unreadNovelties = await service.getUnreadNovelties();
      setNovelties(unreadNovelties);

      // Buscar estatísticas
      const systemStats = await service.getSystemStatistics();
      setStats(systemStats.novelties);

      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar novidades');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (noveltyIds: string[]) => {
    try {
      await service.markNoveltiesAsRead(noveltyIds);
      
      // Atualizar lista removendo itens marcados como lidos
      setNovelties(prev => prev.filter(n => !noveltyIds.includes(n.id)));
      
      // Atualizar estatísticas
      if (stats) {
        setStats((prev: any) => ({
          ...prev,
          unread: Math.max(0, prev.unread - noveltyIds.length)
        }));
      }
    } catch (err) {
      setError('Erro ao marcar como lido');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📋';
      case 'low': return '📝';
      default: return '📄';
    }
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours <= 0) return 'Expirado';
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const filteredNovelties = novelties.filter(novelty => {
    if (selectedPriority !== 'all' && novelty.priority !== selectedPriority) return false;
    if (!showReadItems && novelty.isRead) return false;
    return true;
  });

  // Auto-refresh
  useEffect(() => {
    loadNovelties();
    
    const interval = setInterval(loadNovelties, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Central de Novidades</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadNovelties}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <span className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.unread || 0}</div>
              <div className="text-sm text-muted-foreground">Não Lidas</div>
            </CardContent>
          </Card>
          {stats.byPriority && Object.entries(stats.byPriority).map(([priority, count]: [string, any]) => (
            <Card key={priority}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  {getPriorityIcon(priority)} {priority}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros e Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="urgent">🚨 Urgente</SelectItem>
                <SelectItem value="high">⚠️ Alta</SelectItem>
                <SelectItem value="medium">📋 Média</SelectItem>
                <SelectItem value="low">📝 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReadItems(!showReadItems)}
          >
            {showReadItems ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showReadItems ? 'Ocultar Lidas' : 'Mostrar Lidas'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredNovelties.length} de {novelties.length} novidades
        </div>
      </div>

      {/* Lista de Novidades */}
      <div className="space-y-3">
        {filteredNovelties.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma novidade encontrada</h3>
              <p className="text-muted-foreground">
                {selectedPriority !== 'all' 
                  ? `Não há novidades com prioridade ${selectedPriority}`
                  : 'Não há novidades não lidas no momento'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNovelties.map((novelty) => (
            <Card key={novelty.id} className={novelty.isRead ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPriorityColor(novelty.priority)} className="text-xs">
                            {getPriorityIcon(novelty.priority)} {novelty.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-mono text-muted-foreground">
                            {novelty.cnjNumber}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • {novelty.tribunalName}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-sm mb-1">{novelty.title}</h4>
                        
                        {novelty.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {novelty.description.slice(0, 200)}
                            {novelty.description.length > 200 && '...'}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expira em {formatTimeRemaining(novelty.remainingHours)}
                          </div>
                          <div>
                            Tipo: {novelty.movementType || 'outros'}
                          </div>
                          <div>
                            {new Date(novelty.movementDate).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {novelty.tags && novelty.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {novelty.tags.slice(0, 3).map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {novelty.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{novelty.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {!novelty.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead([novelty.id])}
                          >
                            <Eye className="w-3 h-3" />
                            Marcar como Lida
                          </Button>
                        )}
                        
                        {/* Indicador de tempo restante */}
                        <div className={`text-xs text-center p-1 rounded ${
                          novelty.remainingHours <= 6 ? 'bg-red-100 text-red-700' :
                          novelty.remainingHours <= 24 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {formatTimeRemaining(novelty.remainingHours)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ações em Lote */}
      {filteredNovelties.some(n => !n.isRead) && (
        <div className="flex justify-center">
          <Button 
            variant="outline"
            onClick={() => {
              const unreadIds = filteredNovelties
                .filter(n => !n.isRead)
                .map(n => n.id);
              if (unreadIds.length > 0) {
                markAsRead(unreadIds);
              }
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Marcar Todas como Lidas ({filteredNovelties.filter(n => !n.isRead).length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default NoveltyDashboard;
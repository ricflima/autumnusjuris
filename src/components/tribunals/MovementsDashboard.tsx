import React, { useState } from 'react';
import { FileText, Calendar, Clock, User, Building, Search, Filter, Download, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Movement {
  id: string;
  processNumber: string;
  tribunal: string;
  movementDate: string;
  movementCode?: string;
  title: string;
  description: string;
  isJudicial: boolean;
  hash: string;
  source: string;
  discoveredAt: string;
  isNew: boolean;
  metadata?: any;
  enriched?: {
    category: string;
    explanation: string;
    importance: string;
    nextSteps: string;
    legalImplications: string;
    categoryInfo: {
      color: string;
      icon: string;
      priority: string;
    };
    detailedDescription: string;
    actionRequired: {
      required: boolean;
      urgency: string;
      deadline?: {
        date: string;
        description: string;
        type: string;
      };
      action: string;
    };
    timeline: string[];
  };
}

interface MovementsDashboardProps {
  movements: Movement[];
  processNumber?: string;
  tribunal?: string;
  onMovementClick?: (movement: Movement) => void;
  showFilters?: boolean;
}

export const MovementsDashboard: React.FC<MovementsDashboardProps> = ({
  movements = [],
  processNumber,
  tribunal,
  onMovementClick,
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = searchTerm === '' || 
      movement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || 
      (selectedType === 'judicial' && movement.isJudicial) ||
      (selectedType === 'administrative' && !movement.isJudicial) ||
      (selectedType === 'new' && movement.isNew);
    
    const matchesPeriod = selectedPeriod === 'all' || (() => {
      const movementDate = new Date(movement.movementDate);
      const now = new Date();
      const daysDiff = (now.getTime() - movementDate.getTime()) / (1000 * 3600 * 24);
      
      switch (selectedPeriod) {
        case 'today': return daysDiff <= 1;
        case 'week': return daysDiff <= 7;
        case 'month': return daysDiff <= 30;
        case 'year': return daysDiff <= 365;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesType && matchesPeriod;
  });

  const sortedMovements = [...filteredMovements].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime();
      case 'date-asc':
        return new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.isJudicial === b.isJudicial ? 0 : a.isJudicial ? -1 : 1;
      default:
        return 0;
    }
  });

  const getMovementTypeColor = (movement: Movement) => {
    if (movement.isNew) return 'destructive';
    if (movement.isJudicial) return 'default';
    return 'secondary';
  };

  const getMovementTypeLabel = (movement: Movement) => {
    if (movement.isNew) return 'Nova';
    if (movement.isJudicial) return 'Judicial';
    return 'Administrativa';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportMovements = () => {
    const csvContent = [
      ['Data', 'Título', 'Descrição', 'Tipo', 'Código', 'Processo'].join(','),
      ...sortedMovements.map(movement => [
        movement.movementDate,
        `"${movement.title}"`,
        `"${movement.description.replace(/"/g, '""')}"`,
        movement.isJudicial ? 'Judicial' : 'Administrativa',
        movement.movementCode || '',
        movement.processNumber
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movimentacoes_${processNumber || 'processos'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Dashboard de Movimentações
          </h2>
          {processNumber && (
            <p className="text-muted-foreground mt-1">
              Processo: <span className="font-mono">{processNumber}</span>
              {tribunal && <span> • Tribunal: {tribunal}</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {sortedMovements.length} de {movements.length} movimentações
          </Badge>
          {sortedMovements.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportMovements}>
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar movimentações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="new">Novas</SelectItem>
                  <SelectItem value="judicial">Judiciais</SelectItem>
                  <SelectItem value="administrative">Administrativas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Data (recente)</SelectItem>
                  <SelectItem value="date-asc">Data (antiga)</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                  <SelectItem value="type">Tipo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Movimentações */}
      {sortedMovements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação encontrada</h3>
            <p className="text-muted-foreground">
              {movements.length === 0 
                ? 'Faça uma consulta processual para ver as movimentações'
                : 'Ajuste os filtros para encontrar movimentações específicas'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedMovements.map((movement, index) => (
            <Card 
              key={movement.id || index} 
              className={`transition-all hover:shadow-md ${
                onMovementClick ? 'cursor-pointer' : ''
              } ${movement.isNew ? 'border-l-4 border-l-red-500' : ''}`}
              onClick={() => onMovementClick?.(movement)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getMovementTypeColor(movement)} className="text-xs">
                        {getMovementTypeLabel(movement)}
                      </Badge>
                      {movement.movementCode && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {movement.movementCode}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(movement.movementDate)}
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-sm mb-2">{movement.title}</h4>
                    
                    {/* Descrição Enriquecida */}
                    <div className="space-y-2 mb-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {movement.enriched?.detailedDescription || movement.description}
                      </p>
                      
                      {/* Categoria e Importância */}
                      {movement.enriched && (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              movement.enriched.importance === 'urgent' ? 'destructive' :
                              movement.enriched.importance === 'high' ? 'default' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {movement.enriched.categoryInfo?.icon} {movement.enriched.category}
                          </Badge>
                          
                          {movement.enriched.actionRequired?.required && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              Ação Requerida
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Próximos Passos */}
                      {movement.enriched?.nextSteps && (
                        <div className="p-2 bg-blue-50 rounded text-xs">
                          <strong>Próximos passos:</strong> {movement.enriched.nextSteps}
                        </div>
                      )}
                      
                      {/* Prazo */}
                      {movement.enriched?.actionRequired?.deadline && (
                        <div className="p-2 bg-red-50 rounded text-xs">
                          <strong>⏰ Prazo:</strong> {movement.enriched.actionRequired.deadline.description}
                          <br />
                          <strong>Data limite:</strong> {new Date(movement.enriched.actionRequired.deadline.date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        Fonte: {movement.source}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Descoberto: {formatDate(movement.discoveredAt)}
                      </div>
                      {movement.hash && (
                        <div className="flex items-center gap-1">
                          <span>Hash: </span>
                          <code className="text-xs bg-muted px-1 rounded">
                            {movement.hash.slice(0, 8)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {onMovementClick && (
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3" />
                        Ver Detalhes
                      </Button>
                    )}
                    
                    {movement.isNew && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estatísticas Rápidas */}
      {movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold">{movements.length}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {movements.filter(m => m.isNew).length}
                </div>
                <div className="text-muted-foreground">Novas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {movements.filter(m => m.isJudicial).length}
                </div>
                <div className="text-muted-foreground">Judiciais</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {movements.filter(m => !m.isJudicial).length}
                </div>
                <div className="text-muted-foreground">Administrativas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {new Set(movements.map(m => m.movementDate.split('T')[0])).size}
                </div>
                <div className="text-muted-foreground">Dias únicos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MovementsDashboard;
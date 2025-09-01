import React, { useState, useEffect } from 'react';
import { RefreshCw, Building2, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import TribunalApiService from '@/services/tribunalApi.service';

interface TribunalMovement {
  id: string;
  processNumber: string;
  tribunal: string;
  movementDate: string;
  title: string;
  description: string;
  isNew: boolean;
  isJudicial: boolean;
  discoveredAt: string;
  metadata?: {
    processTitle?: string;
    tribunalCode?: string;
  };
}

interface ProcessConsultationResult {
  processNumber: string;
  tribunal: string;
  status: 'success' | 'error' | 'pending';
  newMovements: number;
  totalMovements: number;
  error?: string;
  lastUpdate?: Date;
}

export default function MovementConsultation() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<TribunalMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<TribunalMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultationResults, setConsultationResults] = useState<ProcessConsultationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastConsultation, setLastConsultation] = useState<Date | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTribunal, setSelectedTribunal] = useState<string>('all');
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [showOnlyNew, setShowOnlyNew] = useState(false);

  const service = TribunalApiService.getInstance();

  // Carregar movimentações salvas ao montar o componente
  useEffect(() => {
    if (user?.id) {
      loadStoredMovements();
    }
  }, [user?.id]);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [movements, searchTerm, selectedTribunal, selectedProcess, showOnlyNew]);

  const loadStoredMovements = async () => {
    setIsLoading(true);
    
    try {
      const result = await service.getAllStoredMovements(user?.id);
      
      if (result.success) {
        setMovements(result.movements);
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(movement => 
        movement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.processNumber.includes(searchTerm)
      );
    }

    // Filtro por tribunal
    if (selectedTribunal !== 'all') {
      filtered = filtered.filter(movement => movement.tribunal === selectedTribunal);
    }

    // Filtro por processo
    if (selectedProcess !== 'all') {
      filtered = filtered.filter(movement => movement.processNumber === selectedProcess);
    }

    // Filtro por novidades
    if (showOnlyNew) {
      filtered = filtered.filter(movement => movement.isNew);
    }

    // Ordenar por data mais recente
    filtered.sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime());

    setFilteredMovements(filtered);
  };

  // Buscar todos os processos do usuário
  const fetchUserProcesses = async (): Promise<string[]> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://172.25.132.0:3001/api'}/processes?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        return data.processes.map((p: any) => p.number).filter(Boolean);
      }
    } catch (error) {
      console.log('Erro ao buscar processos do banco:', error);
    }
    
    return [];
  };

  const consultAllProcesses = async () => {
    if (isConsulting) return;
    
    setIsConsulting(true);
    setConsultationResults([]);
    
    try {
      await service.initialize();
      
      // Buscar processos do usuário
      const userProcesses = await fetchUserProcesses();
      
      if (userProcesses.length === 0) {
        alert('Nenhum processo encontrado para o usuário atual');
        return;
      }

      setProgress({ current: 0, total: userProcesses.length });
      
      const consultationResults: ProcessConsultationResult[] = [];
      
      for (let i = 0; i < userProcesses.length; i++) {
        const processNumber = userProcesses[i];
        setProgress({ current: i + 1, total: userProcesses.length });
        
        const result: ProcessConsultationResult = {
          processNumber,
          tribunal: '',
          status: 'pending',
          newMovements: 0,
          totalMovements: 0
        };
        
        try {
          // Identificar tribunal pelo CNJ
          const validation = service.validateCNJNumber(processNumber);
          if (validation.isValid && validation.parsedNumber) {
            const segmento = validation.parsedNumber.segmentoJudiciario;
            const tribunal = validation.parsedNumber.tribunal;
            const codigo = segmento + tribunal;
            
            const tribunalMap: Record<string, string> = {
              '401': 'TRF da 1ª Região', '402': 'TRF da 2ª Região', '403': 'TRF da 3ª Região',
              '404': 'TRF da 4ª Região', '405': 'TRF da 5ª Região', '406': 'TRF da 6ª Região',
              '825': 'Tribunal de Justiça de São Paulo', '826': 'Tribunal de Justiça de São Paulo',
              '819': 'Tribunal de Justiça do Rio de Janeiro', '813': 'Tribunal de Justiça de Minas Gerais',
              '821': 'Tribunal de Justiça do Rio Grande do Sul', '816': 'Tribunal de Justiça do Paraná',
              '807': 'Tribunal de Justiça de Santa Catarina', '805': 'Tribunal de Justiça da Bahia',
              '803': 'Tribunal de Justiça do Ceará', '501': 'TRT da 1ª Região (RJ)',
              '502': 'TRT da 2ª Região (SP)', '503': 'TRT da 3ª Região (MG)',
              '504': 'TRT da 4ª Região (RS)', '509': 'TRT da 9ª Região (PR)'
            };
            
            result.tribunal = tribunalMap[codigo] || validation.tribunalInfo?.segmento || `Tribunal ${codigo}`;
          }
          
          // Consultar movimentações
          const queryResult = await service.queryMovements(processNumber, {
            useCache: true,
            enablePersistence: true,
            enableNoveltyDetection: true
          });
          
          if (queryResult.success) {
            result.status = 'success';
            result.newMovements = queryResult.newMovements || 0;
            result.totalMovements = queryResult.totalMovements || 0;
            result.lastUpdate = new Date();
          } else {
            result.status = 'error';
            result.error = queryResult.error || 'Falha na consulta';
          }
          
        } catch (error) {
          result.status = 'error';
          result.error = error instanceof Error ? error.message : 'Erro desconhecido';
        }
        
        consultationResults.push(result);
        setConsultationResults([...consultationResults]);
        
        // Pequeno delay entre consultas
        if (i < userProcesses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Recarregar movimentações após a consulta
      await loadStoredMovements();
      setLastConsultation(new Date());
      
    } catch (error) {
      console.error('Erro na consulta geral:', error);
    } finally {
      setIsConsulting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // Extrair listas únicas para filtros
  const uniqueTribunals = [...new Set(movements.map(m => m.tribunal))].sort();
  const uniqueProcesses = [...new Set(movements.map(m => m.processNumber))].sort();

  const totalNewMovements = movements.filter(m => m.isNew).length;
  const successfulConsults = consultationResults.filter(r => r.status === 'success').length;
  const failedConsults = consultationResults.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Movimentações Processuais
        </h1>
        <p className="text-gray-600 mt-1">
          Todas as movimentações dos seus processos e consulta de novas atualizações
        </p>
      </div>

      {/* Controles de Consulta */}
      <Card>
        <CardHeader>
          <CardTitle>Consulta Automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Consultar novos andamentos para todos os processos de <strong>{user?.name}</strong>
              </p>
              {lastConsultation && (
                <p className="text-xs text-gray-500 mt-1">
                  Última consulta: {lastConsultation.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            
            <Button 
              onClick={consultAllProcesses}
              disabled={isConsulting}
              size="lg"
              className="min-w-[180px]"
            >
              {isConsulting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Consultar Novos
                </>
              )}
            </Button>
          </div>

          {/* Progresso */}
          {isConsulting && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progresso da consulta</span>
                <span>{progress.current} de {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo dos Resultados */}
      {(movements.length > 0 || consultationResults.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Movimentações</p>
                  <p className="text-2xl font-bold">{movements.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Novidades</p>
                  <p className="text-2xl font-bold text-green-600">{totalNewMovements}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processos</p>
                  <p className="text-2xl font-bold text-purple-600">{uniqueProcesses.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tribunais</p>
                  <p className="text-2xl font-bold text-orange-600">{uniqueTribunals.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      {movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <Input
                  placeholder="Buscar por título, descrição ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Tribunal</label>
                <Select value={selectedTribunal} onValueChange={setSelectedTribunal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tribunais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tribunais</SelectItem>
                    {uniqueTribunals.map(tribunal => (
                      <SelectItem key={tribunal} value={tribunal}>{tribunal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Processo</label>
                <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os processos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os processos</SelectItem>
                    {uniqueProcesses.map(process => (
                      <SelectItem key={process} value={process}>{process}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant={showOnlyNew ? "default" : "outline"}
                onClick={() => setShowOnlyNew(!showOnlyNew)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {showOnlyNew ? 'Todas' : 'Apenas Novas'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>
            Movimentações ({filteredMovements.length})
            {isLoading && (
              <RefreshCw className="w-4 h-4 ml-2 animate-spin inline" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
              <p className="text-gray-600">Carregando movimentações...</p>
            </div>
          ) : filteredMovements.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredMovements.map((movement, index) => (
                <div 
                  key={movement.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{movement.title}</p>
                      {movement.isNew && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-0">NOVO</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{movement.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-mono">{movement.processNumber}</span>
                      <span>{movement.tribunal}</span>
                      <span>{new Date(movement.movementDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : movements.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma movimentação encontrada com os filtros aplicados</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTribunal('all');
                  setSelectedProcess('all');
                  setShowOnlyNew(false);
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma movimentação encontrada</p>
              <p className="text-sm mt-1">Clique em "Consultar Novos" para buscar atualizações</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados da Última Consulta */}
      {consultationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Última Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consultationResults.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {result.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {result.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500 animate-spin" />}
                    <div>
                      <p className="font-medium">{result.processNumber}</p>
                      <p className="text-sm text-gray-600">{result.tribunal || 'Tribunal não identificado'}</p>
                      {result.error && (
                        <p className="text-xs text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'error' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {result.status === 'success' ? 'Sucesso' : 
                       result.status === 'error' ? 'Erro' : 'Consultando'}
                    </Badge>
                    
                    {result.status === 'success' && (
                      <div className="text-sm text-gray-600 text-right">
                        {result.newMovements > 0 && (
                          <p className="text-blue-600 font-medium">
                            {result.newMovements} nova{result.newMovements !== 1 ? 's' : ''}
                          </p>
                        )}
                        <p>{result.totalMovements} total</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
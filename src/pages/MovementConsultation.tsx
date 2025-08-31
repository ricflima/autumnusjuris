import React, { useState } from 'react';
import { RefreshCw, Building2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import TribunalMovementsService from '@/services/tribunalMovements.service';

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
  const [isConsulting, setIsConsulting] = useState(false);
  const [results, setResults] = useState<ProcessConsultationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lastConsultation, setLastConsultation] = useState<Date | null>(null);

  const service = TribunalMovementsService.getInstance();

  // Função para buscar todos os processos do usuário
  const fetchUserProcesses = async (): Promise<string[]> => {
    try {
      // Buscar processos reais do banco de dados
      const response = await fetch(`/api/processes?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        return data.processes.map((p: any) => p.number).filter(Boolean);
      }
    } catch (error) {
      console.log('Erro ao buscar processos do banco, usando processo padrão:', error);
    }
    
    // Fallback: usar processo conhecido do usuário atual
    return ['1000057-13.2025.8.26.0232'];
  };

  const consultAllProcesses = async () => {
    if (isConsulting) return;
    
    setIsConsulting(true);
    setResults([]);
    
    try {
      await service.initialize();
      
      // Buscar processos do usuário
      const userProcesses = await fetchUserProcesses();
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
          if (validation.isValid && validation.tribunalInfo) {
            result.tribunal = validation.tribunalInfo.name;
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
        setResults([...consultationResults]);
        
        // Pequeno delay entre consultas para não sobrecarregar os tribunais
        if (i < userProcesses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setLastConsultation(new Date());
      
    } catch (error) {
      console.error('Erro na consulta geral:', error);
    } finally {
      setIsConsulting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalNewMovements = results.reduce((sum, r) => sum + r.newMovements, 0);
  const successfulConsults = results.filter(r => r.status === 'success').length;
  const failedConsults = results.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Consulta de Movimentações
        </h1>
        <p className="text-gray-600 mt-1">
          Consulte todos os tribunais em busca de atualizações nos seus processos cadastrados
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
                Consultar todos os processos cadastrados para o usuário <strong>{user?.name}</strong>
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
                  Consultar Todos
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
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Processos</p>
                  <p className="text-2xl font-bold">{results.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sucessos</p>
                  <p className="text-2xl font-bold text-green-600">{successfulConsults}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Falhas</p>
                  <p className="text-2xl font-bold text-red-600">{failedConsults}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Novas Movimentações</p>
                  <p className="text-2xl font-bold text-blue-600">{totalNewMovements}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados Detalhados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.processNumber}</p>
                      <p className="text-sm text-gray-600">{result.tribunal || 'Tribunal não identificado'}</p>
                      {result.error && (
                        <p className="text-xs text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(result.status)}>
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

      {/* Estado vazio */}
      {!isConsulting && results.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma consulta realizada
            </h3>
            <p className="text-gray-600">
              Clique em "Consultar Todos" para verificar atualizações em todos os seus processos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
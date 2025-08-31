import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, Scale } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import TribunalApiService from '@/services/tribunalApi.service';
import MovementsDashboard from './MovementsDashboard';

interface ProcessSearchProps {
  onResultsFound?: (results: any) => void;
  initialQuery?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export const ProcessSearch: React.FC<ProcessSearchProps> = ({ 
  onResultsFound, 
  initialQuery = '', 
  showTitle = true,
  compact = false 
}) => {
  const [processNumber, setProcessNumber] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [validationInfo, setValidationInfo] = useState<any>(null);

  const service = TribunalApiService.getInstance();

  // Função para obter nome do tribunal baseado no CNJ
  const getTribunalName = (validation: any) => {
    if (!validation.isValid || !validation.parsedNumber) return 'Número CNJ inválido';
    
    const segmento = validation.parsedNumber.segmentoJudiciario;
    const tribunal = validation.parsedNumber.tribunal;
    const codigo = segmento + tribunal;
    
    // Mapeamento baseado no código CNJ
    const tribunalMap: Record<string, string> = {
      // Tribunais Federais
      '401': 'TRF da 1ª Região',
      '402': 'TRF da 2ª Região', 
      '403': 'TRF da 3ª Região',
      '404': 'TRF da 4ª Região',
      '405': 'TRF da 5ª Região',
      '406': 'TRF da 6ª Região',
      
      // Tribunais de Justiça
      '825': 'Tribunal de Justiça de São Paulo',
      '826': 'Tribunal de Justiça de São Paulo',
      '819': 'Tribunal de Justiça do Rio de Janeiro',
      '813': 'Tribunal de Justiça de Minas Gerais',
      '821': 'Tribunal de Justiça do Rio Grande do Sul',
      '816': 'Tribunal de Justiça do Paraná',
      '807': 'Tribunal de Justiça de Santa Catarina',
      '805': 'Tribunal de Justiça da Bahia',
      '803': 'Tribunal de Justiça do Ceará',
      
      // Tribunais do Trabalho
      '501': 'TRT da 1ª Região (RJ)',
      '502': 'TRT da 2ª Região (SP)', 
      '503': 'TRT da 3ª Região (MG)',
      '504': 'TRT da 4ª Região (RS)',
      '509': 'TRT da 9ª Região (PR)'
    };
    
    return tribunalMap[codigo] || validation.tribunalInfo?.segmento || `Tribunal ${codigo}`;
  };

  // Validar número CNJ em tempo real
  const handleProcessNumberChange = (value: string) => {
    setProcessNumber(value);
    setError('');
    
    if (value.length >= 20) {
      const validation = service.validateCNJNumber(value);
      setValidationInfo(validation);
      
      if (!validation.isValid) {
        setError(validation.error || 'Número processual inválido');
      }
    } else {
      setValidationInfo(null);
    }
  };

  const handleSearch = async () => {
    if (!processNumber) {
      setError('Digite um número processual');
      return;
    }

    const validation = service.validateCNJNumber(processNumber);
    if (!validation.isValid) {
      setError(validation.error || 'Número processual inválido');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      await service.initialize();
      const queryResults = await service.queryMovements(processNumber, {
        useCache: true,
        enableNoveltyDetection: true,
        enablePersistence: true
      });

      setResults(queryResults);
      onResultsFound?.(queryResults);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar processo');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNJ = (cnj: string) => {
    const clean = cnj.replace(/\D/g, '');
    if (clean.length === 20) {
      return `${clean.substr(0, 7)}-${clean.substr(7, 2)}.${clean.substr(9, 4)}.${clean.substr(13, 1)}.${clean.substr(14, 2)}.${clean.substr(16, 4)}`;
    }
    return cnj;
  };

  return (
    <div className="space-y-6">
      {/* Campo de Busca */}
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Consulta Processual
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={`space-y-4 ${showTitle ? '' : 'pt-6'}`}>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Digite o número do processo (ex: 1234567-89.2023.8.26.0001)"
                value={processNumber}
                onChange={(e) => handleProcessNumberChange(e.target.value)}
                disabled={isLoading}
                className="text-base"
              />
              {validationInfo?.parsedNumber && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{getTribunalName(validationInfo)}</span>
                  </div>
                  <div className="ml-6">
                    Segmento: {validationInfo.parsedNumber.judiciarySegmentName} • Ano: {validationInfo.parsedNumber.year}
                    {validationInfo.parsedNumber.region && ` • ${validationInfo.parsedNumber.region}`}
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !!error}
              className="px-6"
            >
              {isLoading ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isLoading ? 'Consultando...' : 'Consultar'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultados da Consulta */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultado da Consulta</span>
              <div className="flex items-center gap-2">
                {results.fromCache && (
                  <Badge variant="secondary">Cache</Badge>
                )}
                <Badge variant={results.success ? "default" : "destructive"}>
                  {results.success ? 'Sucesso' : 'Erro'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.success ? (
              <>
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      PROCESSO
                    </h4>
                    <p className="font-mono text-sm">{formatCNJ(results.processNumber)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                      TRIBUNAL
                    </h4>
                    <p className="text-sm">{results.tribunal}</p>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.totalMovements || 0}</div>
                    <div className="text-xs text-muted-foreground">Total de Movimentações</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.newMovements || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Movimentações Novas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.novelties?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Novidades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.queryDuration}ms</div>
                    <div className="text-xs text-muted-foreground">Tempo de Resposta</div>
                  </div>
                </div>

                {/* Novidades Encontradas */}
                {results.novelties && results.novelties.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">🔔 Novidades Encontradas</h4>
                    <div className="space-y-2">
                      {results.novelties.slice(0, 5).map((novelty: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{novelty.title}</h5>
                              {novelty.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {novelty.description.slice(0, 100)}
                                  {novelty.description.length > 100 && '...'}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-4">
                              <Badge 
                                variant={
                                  novelty.priority === 'urgent' ? 'destructive' :
                                  novelty.priority === 'high' ? 'default' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {novelty.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {novelty.remainingHours}h restantes
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações Básicas do Processo */}
                {results.processInfo?.basicInfo && (
                  <div>
                    <h4 className="font-semibold mb-3">📋 Informações do Processo</h4>
                    <div className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Assunto:</span>
                          <p className="mt-1">{results.processInfo.basicInfo.subject}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <p className="mt-1">{results.processInfo.basicInfo.status}</p>
                        </div>
                        {results.processInfo.basicInfo.judge && (
                          <div>
                            <span className="font-medium">Juiz:</span>
                            <p className="mt-1">{results.processInfo.basicInfo.judge}</p>
                          </div>
                        )}
                        {results.processInfo.basicInfo.lastUpdate && (
                          <div>
                            <span className="font-medium">Última Atualização:</span>
                            <p className="mt-1">
                              {new Date(results.processInfo.basicInfo.lastUpdate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadados da Consulta */}
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <strong>Consultado em:</strong><br />
                      {new Date(results.queryTimestamp).toLocaleString('pt-BR')}
                    </div>
                    <div>
                      <strong>Origem:</strong><br />
                      {results.fromCache ? 'Cache local' : 'Consulta direta'}
                    </div>
                    <div>
                      <strong>Tentativas:</strong><br />
                      {results.retryCount + 1}
                    </div>
                    {results.contentHash && (
                      <div>
                        <strong>Hash:</strong><br />
                        <code className="text-xs">{results.contentHash.slice(0, 8)}</code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dashboard de Movimentações */}
                {results.movements && results.movements.length > 0 && (
                  <div className="mt-6">
                    <MovementsDashboard 
                      movements={results.movements}
                      processNumber={results.processNumber}
                      tribunal={results.tribunal}
                      showFilters={results.movements.length > 5}
                    />
                  </div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Erro na consulta: {results.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProcessSearch;
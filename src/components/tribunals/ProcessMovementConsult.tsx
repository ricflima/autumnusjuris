import React, { useState } from 'react';
import { RefreshCw, Building2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import TribunalApiService from '@/services/tribunalApi.service';

interface ProcessMovementConsultProps {
  processNumber: string;
  onMovementsFound?: (movements: any[]) => void;
}

interface MovementResult {
  success: boolean;
  tribunal: string;
  newMovements: number;
  totalMovements: number;
  movements?: any[];
  error?: string;
  fromCache?: boolean;
  lastUpdate?: Date;
}

export const ProcessMovementConsult: React.FC<ProcessMovementConsultProps> = ({ 
  processNumber, 
  onMovementsFound 
}) => {
  const [isConsulting, setIsConsulting] = useState(false);
  const [result, setResult] = useState<MovementResult | null>(null);
  const [lastConsultation, setLastConsultation] = useState<Date | null>(null);
  const [showAllMovements, setShowAllMovements] = useState(false);

  const service = TribunalApiService.getInstance();
  const validation = service.validateCNJNumber(processNumber);

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

  const consultMovements = async () => {
    if (isConsulting || !validation.isValid) return;
    
    setIsConsulting(true);
    setResult(null);
    setShowAllMovements(false);
    
    try {
      await service.initialize();
      
      const queryResult = await service.queryMovements(processNumber, {
        useCache: true,
        enablePersistence: true,
        enableNoveltyDetection: true
      });
      
      const consultResult: MovementResult = {
        success: queryResult.success,
        tribunal: getTribunalName(validation),
        newMovements: queryResult.newMovements || 0,
        totalMovements: queryResult.totalMovements || 0,
        movements: queryResult.movements || [],
        fromCache: queryResult.fromCache || false,
        lastUpdate: new Date()
      };
      
      if (!queryResult.success) {
        consultResult.error = queryResult.error || 'Falha na consulta';
      }
      
      setResult(consultResult);
      setLastConsultation(new Date());
      
      // Notificar componente pai se houver movimentações
      if (queryResult.success && onMovementsFound) {
        onMovementsFound(queryResult.movements || []);
      }
      
    } catch (error) {
      const errorResult: MovementResult = {
        success: false,
        tribunal: getTribunalName(validation),
        newMovements: 0,
        totalMovements: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      setResult(errorResult);
      
    } finally {
      setIsConsulting(false);
    }
  };

  const getStatusIcon = () => {
    if (isConsulting) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    if (!result) return <Building2 className="w-4 h-4 text-gray-500" />;
    if (result.success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isConsulting) return 'Consultando tribunal...';
    if (!result) return 'Clique para consultar movimentações';
    if (result.success) return `Consulta realizada com sucesso`;
    return `Falha na consulta: ${result.error}`;
  };

  const getStatusColor = () => {
    if (isConsulting) return 'bg-blue-100 text-blue-800';
    if (!result) return 'bg-gray-100 text-gray-800';
    if (result.success) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      {/* Card de Consulta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Consulta de Movimentações
            </span>
            <Button 
              onClick={consultMovements}
              disabled={isConsulting || !validation.isValid}
              size="sm"
            >
              {isConsulting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Consultando
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Consultar
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da Consulta */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="text-sm font-medium">{getStatusText()}</p>
                {lastConsultation && (
                  <p className="text-xs text-gray-500">
                    {lastConsultation.toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            
            {result && (
              <Badge className={getStatusColor()}>
                {result.success ? 'Sucesso' : 'Erro'}
                {result.fromCache && ' (Cache)'}
              </Badge>
            )}
          </div>

          {/* Resultados da Consulta */}
          {result && result.success && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{result.totalMovements}</p>
                <p className="text-sm text-blue-800">Total</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.newMovements}</p>
                <p className="text-sm text-green-800">Novas</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg col-span-2 md:col-span-1">
                <p className="text-lg font-bold text-purple-600">{result.tribunal}</p>
                <p className="text-xs text-purple-800">Tribunal</p>
              </div>
            </div>
          )}

          {/* Movimentações */}
          {result && result.success && result.movements && result.movements.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Últimas Movimentações</h4>
              <div className={`space-y-2 overflow-y-auto ${showAllMovements ? 'max-h-96' : 'max-h-60'}`}>
                {(showAllMovements ? 
                  result.movements.sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()) : 
                  result.movements.sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime()).slice(0, 5)
                ).map((movement, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{movement.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{movement.description}</p>
                      </div>
                      <div className="text-xs text-gray-500 ml-3">
                        {new Date(movement.movementDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {movement.isNew && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs mt-2">NOVO</Badge>
                    )}
                  </div>
                ))}
                
                {result.movements.length > 5 && (
                  <div className="text-center p-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllMovements(!showAllMovements)}
                    >
                      {showAllMovements 
                        ? `Mostrar menos movimentações`
                        : `Ver todas as ${result.movements.length} movimentações`
                      }
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {!result && !isConsulting && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma consulta realizada ainda</p>
              <p className="text-sm">Clique em "Consultar" para verificar movimentações</p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
import React from 'react';
import { Building2, Calendar, Hash, MapPin, Scale } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TribunalMovementsService from '@/services/tribunalMovements.service';

interface CNJInfoCardProps {
  processNumber: string;
}

export const CNJInfoCard: React.FC<CNJInfoCardProps> = ({ processNumber }) => {
  const service = TribunalMovementsService.getInstance();
  const validation = service.validateCNJNumber(processNumber);

  if (!validation.isValid || !validation.parsedNumber) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <Scale className="w-4 h-4" />
            <span className="text-sm font-medium">Número CNJ inválido</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const parsed = validation.parsedNumber;
  const tribunalInfo = validation.tribunalInfo;

  return (
    <Card className="border-green-200 bg-green-50 w-fit max-w-[37%]">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-green-600" />
          <h4 className="text-sm font-medium text-green-800">Informações CNJ Identificadas</h4>
        </div>
        
        <div className="space-y-1">
          <div>
            <span className="text-xs text-green-600">Número do Processo: </span>
            <span className="font-mono text-sm text-green-800">{parsed.fullNumber}</span>
          </div>
          
          <div>
            <span className="text-xs text-green-600">Tribunal Identificado: </span>
            <span className="text-sm font-medium text-green-800">{parsed.tribunalName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
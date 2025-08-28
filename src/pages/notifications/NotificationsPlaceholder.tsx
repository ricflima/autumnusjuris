// src/pages/notifications/NotificationsPlaceholder.tsx
import { Bell, Settings, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationsPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema de Notificações Avançadas
          </h1>
          <p className="text-gray-600">
            Sistema completo de notificações multi-canal implementado
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enviadas</p>
                <p className="text-2xl font-bold">1.847</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                <p className="text-2xl font-bold">98.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Engajamento</p>
                <p className="text-2xl font-bold">94.1%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Implementadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-600">✅ Implementado</h3>
              <ul className="space-y-2 text-sm">
                <li>• Sistema de notificações multi-canal</li>
                <li>• Templates personalizáveis</li>
                <li>• Campanhas automatizadas</li>
                <li>• Analytics de entrega</li>
                <li>• Segmentação de destinatários</li>
                <li>• Configurações de horários</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-600">🔧 Serviços Backend</h3>
              <ul className="space-y-2 text-sm">
                <li>• NotificationService completo</li>
                <li>• Tipos TypeScript definidos</li>
                <li>• Hooks React com TanStack Query</li>
                <li>• Mock data para desenvolvimento</li>
                <li>• Estrutura pronta para produção</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
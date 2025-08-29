// src/components/common/TribunalNotifications.tsx

import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  X, 
  Settings, 
  Eye, 
  EyeOff,
  Trash2,
  Check,
  AlertCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
// Popover não disponível - usar Dialog como alternativa
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useTribunalNotifications } from '@/hooks/useTribunalNotifications';
import { TribunalType, TRIBUNAL_NAMES } from '@/types/tribunalIntegration';
import { formatDateTime } from '@/lib/utils';

export function TribunalNotifications() {
  const {
    notifications,
    settings,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,
    getStats
  } = useTribunalNotifications();

  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  
  const stats = getStats();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      updateSettings({
        filters: {
          ...settings.filters,
          keywords: [...settings.filters.keywords, newKeyword.trim()]
        }
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    updateSettings({
      filters: {
        ...settings.filters,
        keywords: settings.filters.keywords.filter(k => k !== keyword)
      }
    });
  };

  const toggleTribunalFilter = (tribunal: TribunalType) => {
    const currentFilters = settings.filters.tribunals;
    const newFilters = currentFilters.includes(tribunal)
      ? currentFilters.filter(t => t !== tribunal)
      : [...currentFilters, tribunal];
    
    updateSettings({
      filters: {
        ...settings.filters,
        tribunals: newFilters
      }
    });
  };

  return (
    <div className="relative">
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            {settings.enabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            )}
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md p-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notificações dos Tribunais</h3>
              <div className="flex items-center gap-2">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Configurações de Notificação</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="general" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="general">Geral</TabsTrigger>
                        <TabsTrigger value="filters">Filtros</TabsTrigger>
                        <TabsTrigger value="external">Notificações Externas</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="general" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Notificações habilitadas
                          </label>
                          <Switch
                            checked={settings.enabled}
                            onCheckedChange={(checked) =>
                              updateSettings({ enabled: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Mostrar toasts
                          </label>
                          <Switch
                            checked={settings.showToasts}
                            onCheckedChange={(checked) =>
                              updateSettings({ showToasts: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Reproduzir som
                          </label>
                          <Switch
                            checked={settings.playSound}
                            onCheckedChange={(checked) =>
                              updateSettings({ playSound: checked })
                            }
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="filters" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Apenas movimentações oficiais
                          </label>
                          <Switch
                            checked={settings.filters.onlyOfficial}
                            onCheckedChange={(checked) =>
                              updateSettings({
                                filters: { ...settings.filters, onlyOfficial: checked }
                              })
                            }
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Tribunais (deixe vazio para todos)
                          </label>
                          <div className="space-y-2">
                            {Object.entries(TRIBUNAL_NAMES).slice(0, 6).map(([key, name]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-sm">{name}</span>
                                <Switch
                                  checked={settings.filters.tribunals.includes(key as TribunalType)}
                                  onCheckedChange={() => toggleTribunalFilter(key as TribunalType)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Palavras-chave
                          </label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder="Adicionar palavra-chave"
                              value={newKeyword}
                              onChange={(e) => setNewKeyword(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                            />
                            <Button size="sm" onClick={addKeyword}>
                              Adicionar
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {settings.filters.keywords.map((keyword, index) => (
                              <Badge
                                key={index}
                                className="cursor-pointer"
                                onClick={() => removeKeyword(keyword)}
                              >
                                {keyword} <X className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="external" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Notificações por email
                          </label>
                          <Switch
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) =>
                              updateSettings({ emailNotifications: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Notificações por WhatsApp
                          </label>
                          <Switch
                            checked={settings.whatsappNotifications}
                            onCheckedChange={(checked) =>
                              updateSettings({ whatsappNotifications: checked })
                            }
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <p>* As notificações externas requerem configuração adicional no sistema.</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
                
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearAll}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Marcar todas como lidas
                </Button>
              </div>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="space-y-1 p-2">
                {notifications.slice(0, 10).map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-3 border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'border border-blue-200' : 'opacity-75'
                    } cursor-pointer hover:bg-gray-50`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-2">
                      {getPriorityIcon(notification.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-blue-600">
                            {notification.tribunalName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(notification.timestamp)}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.movement.titulo}
                        </h4>
                        
                        <p className="text-xs text-gray-600 line-clamp-2">
                          Processo: {notification.processNumber}
                        </p>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-2 right-2"></div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {notifications.length > 10 && (
                  <div className="text-center p-2 text-sm text-gray-500">
                    ... e mais {notifications.length - 10} notificações
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Nenhuma notificação
                </p>
                <p className="text-xs text-gray-500">
                  As notificações dos tribunais aparecerão aqui
                </p>
              </div>
            )}
          </div>
          
          {stats.total > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Total: {stats.total}</span>
                <span>Não lidas: {stats.unread}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TribunalNotifications;
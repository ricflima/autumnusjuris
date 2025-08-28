// src/components/common/PWAManager.tsx - PWA management component

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell,
  X,
  Smartphone,
  Monitor
} from 'lucide-react';
import { pwaUtils } from '@/utils/pwaUtils';
import toast from 'react-hot-toast';

interface PWAManagerProps {
  showInstallPrompt?: boolean;
  showUpdatePrompt?: boolean;
  showOfflineStatus?: boolean;
}

export const PWAManager: React.FC<PWAManagerProps> = ({
  showInstallPrompt = true,
  showUpdatePrompt = true,
  showOfflineStatus = true,
}) => {
  const [canInstall, setCanInstall] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(pwaUtils.isPWA());
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    // Initialize PWA
    const initPWA = async () => {
      await pwaUtils.registerServiceWorker();
      setIsPWA(pwaUtils.isPWA());
    };

    initPWA();

    // Event listeners for PWA events
    const handleInstallAvailable = (e: any) => {
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setCanInstall(false);
      setIsPWA(true);
      toast.success('App instalado com sucesso!');
    };

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    const handleOfflineReady = () => {
      toast.success('App pronto para funcionar offline!');
    };

    // Network monitoring
    const cleanupNetwork = pwaUtils.monitorNetwork((online) => {
      setIsOnline(online);
      if (online) {
        toast.success('Conexão restaurada');
      } else if (showOfflineStatus) {
        toast.error('Você está offline');
      }
    });

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-offline-ready', handleOfflineReady);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
      cleanupNetwork();
    };
  }, [showOfflineStatus]);

  const handleInstall = async () => {
    const installed = await pwaUtils.handleInstallPrompt();
    if (installed) {
      setCanInstall(false);
    }
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleRequestNotifications = async () => {
    const permission = await pwaUtils.requestNotificationPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      toast.success('Notificações habilitadas!');
      await pwaUtils.showNotification('AutumnusJuris', {
        body: 'Notificações foram habilitadas com sucesso!',
        tag: 'notification-enabled',
      });
    } else {
      toast.error('Notificações negadas');
    }
  };

  const dismissInstallPrompt = () => {
    setCanInstall(false);
  };

  const dismissUpdatePrompt = () => {
    setUpdateAvailable(false);
  };

  return (
    <div className="space-y-4">
      {/* Network Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-2"
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Offline
            </>
          )}
        </Badge>
      </div>

      {/* Install Prompt */}
      {canInstall && showInstallPrompt && !isPWA && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">
                    Instalar AutumnusJuris
                  </h3>
                  <p className="text-sm text-blue-700">
                    Instale o app para acesso rápido e funcionamento offline
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Instalar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissInstallPrompt}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Available Prompt */}
      {updateAvailable && showUpdatePrompt && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-orange-900">
                    Atualização Disponível
                  </h3>
                  <p className="text-sm text-orange-700">
                    Uma nova versão do app está disponível
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Atualizar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissUpdatePrompt}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Permission Prompt */}
      {isPWA && notificationPermission === 'default' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">
                    Habilitar Notificações
                  </h3>
                  <p className="text-sm text-purple-700">
                    Receba notificações sobre prazos e atualizações importantes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleRequestNotifications}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Habilitar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// PWA Status Component
export const PWAStatus: React.FC = () => {
  const [isPWA, setIsPWA] = useState(pwaUtils.isPWA());
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    const updateStatus = async () => {
      setIsPWA(pwaUtils.isPWA());
      const size = await pwaUtils.getCacheSize();
      setCacheSize(size);
    };

    updateStatus();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearCache = async () => {
    await pwaUtils.clearCache();
    setCacheSize(0);
    toast.success('Cache limpo com sucesso!');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {isPWA ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          Status do App
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Modo de instalação</span>
            <Badge variant={isPWA ? "default" : "secondary"}>
              {isPWA ? 'PWA Instalado' : 'Navegador Web'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status da rede</span>
            <Badge variant={navigator.onLine ? "default" : "destructive"}>
              {navigator.onLine ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tamanho do cache</span>
            <span className="text-sm font-medium">{formatBytes(cacheSize)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Notificações</span>
            <Badge variant={
              Notification.permission === 'granted' ? 'default' : 
              Notification.permission === 'denied' ? 'destructive' : 'secondary'
            }>
              {Notification.permission === 'granted' ? 'Habilitadas' :
               Notification.permission === 'denied' ? 'Negadas' : 'Não solicitadas'}
            </Badge>
          </div>
          
          {cacheSize > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="w-full"
            >
              Limpar Cache
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
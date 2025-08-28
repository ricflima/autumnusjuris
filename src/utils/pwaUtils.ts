// src/utils/pwaUtils.ts - PWA utility functions

import React from 'react';

// Service Worker registration and management
export const pwaUtils = {
  // Register service worker
  registerServiceWorker: async (): Promise<ServiceWorkerRegistration | null> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log('New service worker update available');
                  showUpdateAvailableNotification();
                } else {
                  // App is ready to work offline
                  console.log('App is ready to work offline');
                  showOfflineReadyNotification();
                }
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    
    console.log('Service Workers are not supported');
    return null;
  },

  // Unregister service worker
  unregisterServiceWorker: async (): Promise<boolean> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('Service Worker unregistered');
          return true;
        }
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
      }
    }
    return false;
  },

  // Check if app is running as PWA
  isPWA: (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  },

  // Check if device supports PWA installation
  canInstall: (): boolean => {
    return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  },

  // Handle PWA installation prompt
  handleInstallPrompt: (): Promise<boolean> => {
    return new Promise((resolve) => {
      let deferredPrompt: any = null;

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install button
        showInstallButton(() => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                resolve(true);
              } else {
                console.log('User dismissed the install prompt');
                resolve(false);
              }
              deferredPrompt = null;
            });
          }
        });
      });

      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        hideInstallButton();
        resolve(true);
      });
    });
  },

  // Get network status
  getNetworkStatus: () => {
    return {
      online: navigator.onLine,
      connection: (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection,
    };
  },

  // Monitor network changes
  monitorNetwork: (callback: (online: boolean) => void) => {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  // Request notification permission
  requestNotificationPermission: async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    }
    return 'denied';
  },

  // Show local notification
  showNotification: async (title: string, options: NotificationOptions = {}): Promise<void> => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && Notification.permission === 'granted') {
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'autumnus-juris',
          ...options,
        });
      }
    }
  },

  // Background sync for offline actions
  registerBackgroundSync: async (tag: string): Promise<void> => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await (registration as any).sync?.register(tag);
          console.log('Background sync registered:', tag);
        }
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  },

  // Cache management
  clearCache: async (): Promise<void> => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
      } catch (error) {
        console.error('Failed to clear caches:', error);
      }
    }
  },

  // Get cache size
  getCacheSize: async (): Promise<number> => {
    if ('caches' in window) {
      try {
        let totalSize = 0;
        const cacheNames = await caches.keys();
        
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const size = response.headers.get('content-length');
              if (size) {
                totalSize += parseInt(size, 10);
              }
            }
          }
        }
        
        return totalSize;
      } catch (error) {
        console.error('Failed to calculate cache size:', error);
        return 0;
      }
    }
    return 0;
  },

  // Share API support
  canShare: (): boolean => {
    return 'share' in navigator;
  },

  // Native share
  share: async (data: ShareData): Promise<boolean> => {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    return false;
  },

  // Badging API for unread counts
  setBadge: async (count: number): Promise<void> => {
    if ('setAppBadge' in navigator) {
      try {
        await (navigator as any).setAppBadge(count);
      } catch (error) {
        console.error('Badge setting failed:', error);
      }
    }
  },

  clearBadge: async (): Promise<void> => {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
      } catch (error) {
        console.error('Badge clearing failed:', error);
      }
    }
  },
};

// UI helper functions
function showUpdateAvailableNotification() {
  // Show toast or modal about update
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('sw-update-available');
    window.dispatchEvent(event);
  }
}

function showOfflineReadyNotification() {
  // Show toast about offline capability
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('sw-offline-ready');
    window.dispatchEvent(event);
  }
}

function showInstallButton(onInstall: () => void) {
  // Show install button
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('pwa-install-available', { detail: { onInstall } });
    window.dispatchEvent(event);
  }
}

function hideInstallButton() {
  // Hide install button
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('pwa-installed');
    window.dispatchEvent(event);
  }
}

// PWA detection hook
export const usePWA = () => {
  const [isPWA, setIsPWA] = React.useState(pwaUtils.isPWA());
  const [canInstall, setCanInstall] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    // Monitor PWA installation
    const handleInstallAvailable = (e: any) => {
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setIsPWA(true);
      setCanInstall(false);
    };

    // Monitor network status
    const cleanupNetwork = pwaUtils.monitorNetwork(setIsOnline);

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      cleanupNetwork();
    };
  }, []);

  return {
    isPWA,
    canInstall,
    isOnline,
    install: pwaUtils.handleInstallPrompt,
    share: pwaUtils.share,
    canShare: pwaUtils.canShare(),
  };
};
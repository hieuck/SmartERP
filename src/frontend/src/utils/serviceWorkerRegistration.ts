/**
 * Service Worker Registration Utility
 * Handles registration and updates of the service worker
 * Requirements: 22.10, 24.4
 */

import { logger } from '@/lib/logger/logger.service';

const context = 'ServiceWorkerRegistration';

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          logger.info(context, 'Service Worker registered', { registration: registration.scope });

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content available, notify user
                    logger.info(context, 'New content available, please refresh');

                    // Optionally show a notification to the user
                    if (window.confirm('New version available! Reload to update?')) {
                      window.location.reload();
                    }
                  } else {
                    // Content cached for offline use
                    logger.info(context, 'Content cached for offline use');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          logger.error(context, 'Service Worker registration failed', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        logger.error(context, 'Service Worker unregistration failed', error);
      });
  }
}

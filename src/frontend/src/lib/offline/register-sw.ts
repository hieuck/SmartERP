import { Workbox } from 'workbox-window';
import { logger } from '@/lib/logger/logger.service';

const context = 'ServiceWorkerRegister';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        logger.info(context, 'New service worker installed, reloading...');
        window.location.reload();
      } else {
        logger.info(context, 'Service worker installed for the first time');
      }
    });

    wb.addEventListener('waiting', () => {
      logger.info(context, 'Service worker waiting to activate');
      // Optionally show a prompt to user to reload
    });

    wb.addEventListener('controlling', () => {
      logger.info(context, 'Service worker is now controlling the page');
    });

    wb.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        logger.info(context, 'Service worker activated for the first time');
      }
    });

    wb.register()
      .then((registration) => {
        logger.info(context, 'Service worker registered', { scope: registration?.scope });
      })
      .catch((error) => {
        logger.error(context, 'Service worker registration failed', error);
      });

    return wb;
  }

  logger.warn(context, 'Service workers are not supported in this browser');
  return null;
}

import { Workbox } from 'workbox-window';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('New service worker installed, reloading...');
        window.location.reload();
      } else {
        console.log('Service worker installed for the first time');
      }
    });

    wb.addEventListener('waiting', () => {
      console.log('Service worker waiting to activate');
      // Optionally show a prompt to user to reload
    });

    wb.addEventListener('controlling', () => {
      console.log('Service worker is now controlling the page');
    });

    wb.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        console.log('Service worker activated for the first time');
      }
    });

    wb.register()
      .then((registration) => {
        console.log('Service worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });

    return wb;
  }

  console.warn('Service workers are not supported in this browser');
  return null;
}

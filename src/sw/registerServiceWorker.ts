export interface RegisterServiceWorkerOptions {
  /** When true (default), post SKIP_WAITING on update and reload on controllerchange. */
  autoUpdate?: boolean;
}

/**
 * Register a service worker URL with Piligrim-style silent update reload.
 * Errors are swallowed (offline / unsupported).
 */
export function registerServiceWorker(
  url: string,
  options: RegisterServiceWorkerOptions = {},
): void {
  if (!('serviceWorker' in navigator)) return;
  const autoUpdate = options.autoUpdate !== false;

  const start = () => {
    navigator.serviceWorker
      .register(url)
      .then((reg) => {
        if (!autoUpdate) return;
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {});
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  if (autoUpdate) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      location.reload();
    });
  }
}

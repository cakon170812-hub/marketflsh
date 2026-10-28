/* DOMINÓ FLASH COIN · Service Worker compatible con web 0.12Z.27
 * Sustituir /marketflsh/sw.js. La versión pública NO se incrementa
 * por esta corrección del SW.
 * No se almacena index.html, CSS, JavaScript, imágenes ni consultas.
 * Así, una mesa corregida no queda tapada por una copia antigua en caché.
 */
'use strict';

const MF_SW_VERSION = '0.12Z.27';
const APP_SCOPE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      const oldAppCaches = keys.filter((key) =>
        /^(dfc-|domino-flash-coin-|marketflsh-|maiket-flash-)/i.test(key)
      );
      await Promise.all(oldAppCaches.map((key) => caches.delete(key)));
    } catch (error) {
      console.warn('[Dominó Flash Coin SW] No se pudieron limpiar todas las cachés:', error);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin ||
      !url.pathname.startsWith(APP_SCOPE_PATH)) return;

  // Solo la navegación HTML se fuerza a red. Los demás recursos no son
  // interceptados: mantienen su comportamiento normal y no se guardan en Cache API.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(new Request(request, { cache: 'no-store' })).catch(() =>
        new Response(
          '<!doctype html><html lang="es"><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<title>DOMINÓ FLASH COIN · Sin conexión</title>' +
          '<body style="background:#081b35;color:#fff;font:16px system-ui;padding:25px">' +
          '<h2>Sin conexión</h2><p>Conéctate a internet para cargar la versión actual de DOMINÓ FLASH COIN.</p></body></html>',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            }
          }
        )
      )
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

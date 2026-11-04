
/*
 * DOMINÓ FLASH COIN — sw.js — revisión de mantenimiento 0.12Z.29
 * Service Worker para GitHub Pages.
 * - No almacena HTML, JavaScript, CSS ni respuestas de Supabase.
 * - No intercepta peticiones: el navegador consulta la red normalmente.
 * - No descarga ni instala actualizaciones Android; eso es responsabilidad
 *   de native-bridge.js y Capacitor Updater.
 * - Limpia únicamente cachés antiguas identificadas con este proyecto.
 * - No fuerza recargas ni interrumpe partidas en curso.
 */
'use strict';

const DFC_SW_REVISION = '0.12Z.29-maintenance-1';
const DFC_OLD_CACHE_PREFIXES = [
  'dfc-',
  'domino-flash-coin-',
  'domino_flash_coin-'
];

self.addEventListener('install', () => {
  // No precache: GitHub Pages debe obtener el HTML desde la red.
  // Activar el nuevo worker sin esperar al cierre de pestañas antiguas.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if ('caches' in self) {
      try {
        const names = await caches.keys();
        const obsolete = names.filter((name) =>
          DFC_OLD_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix))
        );
        await Promise.all(obsolete.map(async (name) => {
          try {
            await caches.delete(name);
          } catch (error) {
            console.warn('[DFC SW] No se pudo limpiar caché:', name, error);
          }
        }));
      } catch (error) {
        console.warn('[DFC SW] No se pudo revisar Cache Storage:', error);
      }
    }
    await self.clients.claim();
    console.info('[DFC SW] Activo:', DFC_SW_REVISION);
  })());
});

// Deliberadamente NO hay manejador 'fetch'.
// Así se evita servir copias antiguas de index.html, script.js,
// style.css, manifest.json y los paquetes Android.
// Tampoco hay manejadores 'push', 'sync' o 'message' que alteren el juego.

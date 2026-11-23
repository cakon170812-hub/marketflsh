
/*
=========================================================
 DOMINÓ FLASH COIN
 ARCHIVO: sw.js
 VERSIÓN: 0.12Z.30
 SISTEMA: SERVICE WORKER

 OBJETIVOS:
 - Evitar servir archivos antiguos desde Cache Storage.
 - No bloquear actualizaciones de GitHub.
 - No interferir con Supabase.
 - No interrumpir partidas activas.
 - Mantener separado el actualizador nativo Android.

 IMPORTANTE:
 Este archivo NO instala actualizaciones APK ni OTA.
 Esa función corresponde a native-bridge.js.
=========================================================
*/

'use strict';

const DFC_SW_REVISION = '0.12Z.37-web-table-background-1';

// Solicita los recursos de interfaz actualizados aunque el HTML mantenga su versión.
const DFC_WEB_REVALIDATE = new Set(['script.js', 'z37-ui.js', 'z37-admin.js', 'domino-table-styles.css'].map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener('fetch', event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method==='GET'&&url.origin===self.location.origin&&DFC_WEB_REVALIDATE.has(url.pathname)){
    event.respondWith(fetch(request,{cache:'reload'}));
  }
});

const DFC_OLD_CACHE_PREFIXES = [
  'dfc-',
  'domino-flash-coin-',
  'domino_flash_coin-'
];

/*
=========================================================
 1. INSTALACIÓN
=========================================================
*/

self.addEventListener('install', (event) => {

  console.info(
    '[DOMINÓ FLASH COIN SW] Instalando:',
    DFC_SW_REVISION
  );

  // No precargar archivos: se obtendrán desde la red.
  // No modifica ningún archivo ya instalado en la APK.
  event.waitUntil(
    self.skipWaiting()
  );

});

/*
=========================================================
 2. ACTIVACIÓN
=========================================================
*/

self.addEventListener('activate', (event) => {

  event.waitUntil((async () => {

    try {

      const cacheNames = await caches.keys();

      const oldCaches = cacheNames.filter((name) => {

        return DFC_OLD_CACHE_PREFIXES.some(
          (prefix) => name.startsWith(prefix)
        );

      });

      await Promise.all(
        oldCaches.map(async (name) => {

          try {

            await caches.delete(name);

            console.info(
              '[DOMINÓ FLASH COIN SW] Caché anterior eliminada:',
              name
            );

          } catch (error) {

            console.warn(
              '[DOMINÓ FLASH COIN SW] Error limpiando caché:',
              String(error?.message || error)
            );

          }

        })
      );

    } catch (error) {

      console.warn(
        '[DOMINÓ FLASH COIN SW] No se pudo revisar Cache Storage:',
        String(error?.message || error)
      );

    }

    await self.clients.claim();

    console.info(
      '[DOMINÓ FLASH COIN SW] Activo:',
      DFC_SW_REVISION
    );

  })());

});

/*
=========================================================
 3. PETICIONES DE RED
=========================================================

 Solo los scripts de interfaz usan una petición directa a la red.
 El HTML, Supabase y los paquetes Android mantienen su flujo habitual.

=========================================================
*/

/*
=========================================================
 4. SEGURIDAD DE LAS PARTIDAS
=========================================================

 Este Service Worker no:
 - Modifica mesas.
 - Modifica turnos.
 - Ejecuta movimientos.
 - Descuenta diamantes.
 - Cambia saldos Flash Coin.
 - Cierra sesiones.
 - Reinicia partidas.
 - Fuerza una recarga de páginas abiertas.

=========================================================
*/

/*
=========================================================
 5. CONTROL DE VERSIONES
=========================================================

 Versión de mantenimiento: 0.12Z.30

 La versión Android instalada se comprueba desde
 native-bridge.js mediante CapacitorUpdater.current().

 El manifiesto publicado determina si existe una
 nueva actualización autorizada.

 Este Service Worker no altera ese mecanismo.

=========================================================
*/

console.info(
  '[DOMINÓ FLASH COIN] Service Worker preparado:',
  DFC_SW_REVISION
);

/*
=========================================================
 FIN DEL ARCHIVO sw.js
 DOMINÓ FLASH COIN 0.12Z.30
=========================================================
*/

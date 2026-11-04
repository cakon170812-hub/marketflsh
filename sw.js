
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

const DFC_SW_REVISION = '0.12Z.30-maintenance-1';

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

 No registrar un evento "fetch".

 De esta forma, este Service Worker no intercepta:
 - index.html
 - native-bridge.js
 - script.js
 - style.css
 - manifest.json
 - Paquetes ZIP Android
 - Peticiones a Supabase

 El navegador utiliza su comportamiento normal de red.

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

DOMINÓ FLASH COIN · ENTREGA 0.12Z.16 · 25 OCTUBRE 2026
========================================================
ESTADO: CANDIDATA PARA PRUEBAS (NO CERTIFICADA PARA PRODUCCIÓN).

ARCHIVOS
1) DOMINO_FLASH_COIN_HTML_0.12Z.16_COMPLETO.html: la aplicación entera; NO un
   fragmento. Se conserva el HTML 0.12Z.15 de 2.3 MB como base.
2) DOMINO_FLASH_COIN_HTML_0.12Z.16_COPIABLE.txt: idéntico al HTML.
3) DOMINO_FLASH_COIN_SQL_0.12Z.16_ACTUALIZACION.sql: SQL completo de los
   cambios 0.12Z.16 sobre una base 0.12Z.15 previamente instalada.
   NO es una reconstrucción de todas las tablas históricas de Supabase.
4) DOMINO_FLASH_COIN_SQL_0.12Z.16_COPIABLE.txt: idéntico al SQL.
5) sw.js: nueva versión de service worker para el sitio web/PWA.

QUÉ SE HA INCLUIDO
- Número 0.12Z.16 en meta HTML, título, comprobaciones de actualización,
  publicador Android, y registro de service worker. No se vuelve a identificar
  la edición más reciente como 0.12Z.12 en los campos de publicación.
- Protección de arranque para CapacitorUpdater.notifyAppReady() cuando dicho
  plugin nativo está instalado y sus controles están disponibles. Esto reduce
  riesgo de reversión automática por bundle no confirmado; NO arregla una APK
  cuyo actualizador nativo esté mal configurado o cuyo paquete empaquete aún
  la versión 0.12Z.12.
- sw.js versión 0.12Z.16: navegación solo desde red, sin servir HTML viejo
  de caché. Requiere publicar este archivo JUNTO al HTML; no reemplaza la
  lógica nativa de Android.
- Datos de CADA mesa individual en letras pequeñas: identificación, entrada,
  costo por mano (o aporte por partida), comisión, modalidad, ocupación.
  Datos tomados de las configuraciones del servidor, sin inventar precios.
- En una mesa se puede desplegar "Mesa y tarifas" para consultar costes,
  sin superponer el tablero ni las fichas.
- Cartera 💎 en mesa vinculada al asiento, independiente de la global, con
  consulta y traslado voluntario de diamantes entre ambas en milésimas.
- Cada pase con dos jugadores de mesa activos: -1.000 al que pasa, +0.990
  al beneficiario, +0.010 a la cartera del Líder, íntegro en la misma
  transacción. Otra ruta mantiene el comportamiento 0.12Z.15 en casos límite.
- Última ficha +0.020 a la cartera de mesa si existe el asiento.
- Al abandonar/eliminar el asiento se liquida el saldo de diamantes de mesa
  (positivo o negativo) en la cartera principal. Los pases NO bloquearán la
  mano por falta de diamantes: se respeta el comportamiento anterior con
  posibles saldos negativos. Los movimientos son idempotentes por evento.
- Sin reemplazar la lógica del bote Flash Coin, jugadores, fichas, chat,
  premios FC, asistente de bots ni las mesas existentes.

CÓMO PROBAR, EN ORDEN
1. Hacer copia recuperable del proyecto Supabase y conservar el HTML 0.12Z.15
   y el paquete Android existente. Crear proyecto/branch CLON de PRUEBAS.
2. Ejecutar SOLO el SQL 0.12Z.16 en ese clon (Editor SQL > New Query > Run).
   Si aparece un error o una dependencia ausente, NO aplicar correcciones a
   ciegas en Producción; comunicar mensaje exacto y línea.
3. Probar dos cuentas de prueba y un bot: iniciar sesión, ver mesa, sentarse,
   jugar con y sin dinero, pases, fichas, última ficha, salir/reingresar.
4. Probar 💎: depositar 3.000 (principal -3; mesa +3), pasar (-1.000 de mesa,
   repartidos +0.990 y +0.010), recibir, retirar parcialmente y salir;
   comprobar ambos saldos y el historial con dos dispositivos a la vez.
   Repetir referencia UUID y confirmar que no paga dos veces. Verificar
   un salto de mesa por mantenimiento y un abandono durante una mano.
5. Publicar en un entorno web de PRUEBAS el HTML renombrado index.html
   JUNTO con sw.js a la MISMA ruta de la web. La versión web no se instala
   como actualización del APK nativo por sí sola.
6. En Android, probar "ACTUALIZAR", esperar más de 1 minuto, abrir VER MESA,
   cerrar la mesa, volver al inicio, cerrar/reabrir la app; en ninguna pantalla
   debe reaparecer 0.12Z.12. Repetir sin red para descartar HTML guardado.
7. Para usuarios Android nativos, empaquetar realmente la web aprobada con
   el módulo Capacitor/Capgo correspondiente y publicar el bundle o una nueva
   versión AAB en Google Play según el esquema REAL de distribución.
   Verificar que el puente native dcfInstallApprovedUpdate y la Edge Function
   dfc-promote-android-web EXISTEN y están implementados en el Android y en
   Supabase; este HTML no crea esos servicios ni los permisos de GitHub.
8. Si la aplicación instalada en Play trae index.html 0.12Z.12 y el puente
   nativo no persiste paquetes, el remedio definitivo exige actualizar la APK/
   AAB (con versionCode superior y firma válida), no únicamente el HTML/SQL.

COMPROBACIONES REALIZADAS EN ESTA ENTREGA
- Recuperación del HTML entero 0.12Z.15 entregado anteriormente.
- Validación sintáctica de TODOS los bloques JavaScript inline no vacíos
  mediante node --check, y de sw.js.
- Comparación byte a byte de las variantes .html/.txt y .sql/.txt.
- Auditoría estática de dependencias y claves de idempotencia del SQL.

NO REALIZADAS (NO AFIRMAR QUE ESTÁ CORREGIDO AL 100%)
- Ejecución de SQL contra PostgreSQL real del clon.
- Pruebas simultáneas de usuarios/bots en un servidor.
- Instalación del AAB de Google Play / actualizador nativo Android.
- Confirmación de la causa exacta del regreso de 0.12Z.15 a 0.12Z.12.

No ejecutar el SQL de 0.12Z.15 DESPUÉS de 0.12Z.16: podría reemplazar la
función de pases y perder el direccionamiento a cartera de mesa.

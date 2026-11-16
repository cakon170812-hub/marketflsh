# DOMINÓ FLASH COIN — Z37 (integración en curso)

## Protección de Z36
- Rama base: `main`, commit `39e41bc401a4f3fb8c23f8ff563630d8a7edba0f` (OTA Z36).
- Rama de trabajo: `feature/z37-integracion`.
- **NO PUBLICAR** Z37 ni cambiar `android-approved/manifest.json` hasta completar SQL, HTML, lógica de juego, pruebas de saldo y OTA.
- En este momento la migración SQL es un diseño **en rama**; no se ha desplegado a Supabase.

## Decisiones aprobadas
- Torneos: inscripciones pagas o patrocinadas, fondos independientes, diamantes exclusivos, máximo dos recompras, umbral, 10 segundos, reagrupación segura, clasificación por orden confirmado de eliminación, tarjetas de premios con entrega única.
- Recompras de torneo: 50% a administración, 50% a premios conforme a las proporciones congeladas al cerrar inscripciones.
- Mesas por puntos: cobro FlashCoin + diamantes atómico, deuda de diamantes personal con límite administrativo, recuperada por acreditaciones personales; meta y comisión de 0% a 50% por mesa.
- Marcador compartido en 4 jugadores, separado para 2 o 3; suma de fichas rivales; bono capicúa +30 y pase a la redonda +30, sin pase a la redonda cuando hay tranque; empate exacto provoca mano de desempate.
- Capicúa: solo última ficha auténtica, legal, en turno y cierre de ambos extremos diferentes; resultado y recompensa únicos confirmados en servidor.
- Panel administrador: 6 secciones (torneos, premios, puntos, tarjetas, supervisión, web/Android).
- Inicio: botones TORNEO y POR PUNTOS arriba a la derecha, uno bajo otro; carrusel de cuatro artes originales con rotación a 10 segundos.
- Actualización Android: conservar puente probado Z36, no interrumpir partida, botón persistente, validar manifest/bundle y registrar comprobante.

## Resultado de inspección inicial
- Repositorio identificado: `cakon170812-hub/marketflsh`.
- HTML principal: `index.html` (~3.64 MB), no se ha modificado.
- Puente: `native-bridge.js`; el texto indica `BASE_VERSION = '0.12Z.28'`, que corresponde al APK nativo original, no necesariamente a versión OTA.
- Archivo OTA público: `android-approved/manifest.json`, NO modificado.
- Motor existente: `rf_domino_*_v11`, `rf_domino_*_v189`; saldos personales en `rf_profiles.balance` y movimientos FlashCoin en `rf_wallet_ledger`.
- No se identificaron aún tablas específicas de torneos Z37 o diamantes personales en el esquema público consultado. **Esto impide asumir una integración segura de diamantes sin examinar el modelo actual.**

## Trabajo realizado
1. Creada rama independiente desde Z36.
2. Guardada migración SQL preliminar para la estructura de torneos, fondos, idempotencia y puntos, con RLS y sin permisos directos de cliente.

## Trabajo pendiente / requisitos para una publicación verificada
1. Localizar y confirmar los cuatro archivos originales de arte y registrar rutas de assets.
2. Identificar y verificar ledger real de diamantes, autorización administrativa y tarjeta FlashCoin vigente.
3. Completar funciones SQL transaccionales e idempotentes con controles de saldo, RLS, privilegios, cierre y compensación.
4. Integrar vista de inicio, carrusel, panel administrador y mesas por puntos en el HTML Z36 (sin reemplazar funciones estables).
5. Añadir pruebas de carga, simulaciones multijugador y auditoría de dinero; comprobar el sistema de autojuego/recompras.
6. Publicar solo tras pruebas manuales de Web/Android y comprobación de integridad del bundle.

**Estado:** PARCIAL. No se debe informar al usuario que Z37 esté lista para Android.


## Actualización tras segunda fase (16 de noviembre de 2026)
- **APLICADA A SUPABASE** la migración `dfc_z37_base_aislada`: nueve tablas Z37 con RLS y clientes sin permisos directos para escribir fondos.
- **APLICADA A SUPABASE** la migración `dfc_z37_catalog_admin`: RPCs de listado público limitado, lectura administrativa, edición de borradores de torneos y de mesas por puntos. Guardar borradores exige rol administrativo `leader/admin` validado en servidor.
- **GUARDADOS EN RAMA** `z37-ui.js` y `z37-admin.js`; añadida su carga desde `script.js` solo en `feature/z37-integracion`. El código de interfaz deliberadamente desactiva inscripción, cobros y asientos hasta que el motor financiero sea seguro.
- **VERIFICADO** que usuarios anon no pueden ejecutar la RPC administrativa de guardado de torneos y que el permiso solo se concede a authenticated más verificación de rol interna.
- **LOCALIZADAS EN ARCHIVOS DE CONVERSACIÓN** cuatro ilustraciones concretas de torneo en formatos verticales (azul/dorado, morado, rojo, verde). No se han subido aún al repositorio.
- **LIMITACIÓN MATERIAL**: el esquema público actual de `rf_profiles` registra `balance` FlashCoin, pero no expone una cuenta o ledger de diamantes personales. No se puede conectar deuda negativa y premios de diamantes de Z37 sin crear una fuente autoritativa y reconciliarla con la visual de Z36.
- **NO SE HA COMPLETADO** motor de dominó Z37, contabilidad de diamantes, tarjetas reales de premio, OTA Z37 ni pruebas de Android.

### No confundir
La infraestructura nueva en Supabase no cambia las mesas actuales ni publica Z37. Los formularios Z37 son BORRADORES; no producen cobros ni crean partidas. No informar “integrado completo”, “listo para APK” o “publicado”.


## Fase de contabilidad y verificación — 16/11/2026
- **APLICADA A SUPABASE:** migración `dfc_z37_diamond_accounting`. Agrega carteras personales separadas, ledger de diamantes, botes puntos y función transaccional de preparación de asiento.
- **BLOQUEADA A PROPÓSITO:** función `dfc_z37_points_join` sin permiso `EXECUTE` para usuarios hasta disponer de motor completo, reconciliar diamantes originales y pasar pruebas.
- **PROBADOS CON ROL ADMINISTRADOR en transacciones ROLLBACK:** creación de borrador de mesa por puntos y creación de borrador de torneo. Las operaciones de prueba no quedaron persistidas.
- **COMPILACIÓN SINTÁCTICA:** `z37-ui.js` y `z37-admin.js` pasan validación JavaScript.
- **VERIFICACIÓN DE SEGURIDAD:** `has_function_privilege('authenticated', 'public.dfc_z37_points_join(uuid,uuid)', 'execute')=false`; `anon` también false. Crear borradores autorizado solo con role verificado.
- **CUENTAS ACTUALES:** cero carteras de diamantes verificadas y cero torneos Z37 creados. No inventar saldos iniciales.
- **IMÁGENES DISPONIBLES** en archivos locales de esta conversación, pendientes de transferencia a GitHub en formatos originales.
- **PUBLICACIÓN:** `main`, APK y `android-approved/manifest.json` no modificados.

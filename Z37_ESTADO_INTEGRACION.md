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

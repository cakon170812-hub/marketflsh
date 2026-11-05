
 // DOMINÓ FLASH COIN — native-bridge.js — corrección permanente para paquete OTA Z30
 // Archivo fuente para compilar mediante GitHub Actions/esbuild.
 // No cambia saldos, partidas ni reglas. BASE_VERSION identifica únicamente el paquete nativo original.
 import { Capacitor } from '@capacitor/core';
 import { App } from '@capacitor/app';
 import { ScreenOrientation } from '@capacitor/screen-orientation';
 import { StatusBar } from '@capacitor/status-bar';
 import { CapacitorUpdater } from '@capgo/capacitor-updater';

 const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

 if (isAndroid) {
   document.documentElement.classList.add('dfc-android-native');

   const BASE_VERSION = '0.12Z.28';
   const MANIFEST_URL = 'https://cakon170812-hub.github.io/marketflsh/android-approved/manifest.json';
   const EXPECTED_ORIGIN = 'https://cakon170812-hub.github.io';
   const EXPECTED_PATH = '/marketflsh/android-approved/bundles/';
   const VERSION_RE = /^0\.12Z\.(\d{1,4})$/;
   const SHA256_RE = /^[a-f0-9]{64}$/i;

   let candidate = null;
   let pendingBundle = null;
   let busy = false;
   let checkedAt = 0;
   let lastDiagnostic = '';

   const versionNumber = (value) => {
     const m = VERSION_RE.exec(String(value || ''));
     return m ? Number(m[1]) : -1;
   };

   const tableOpen = () => !!document.getElementById('dominoTablePanel')?.classList.contains('active');

   const homeVisible = () => {
     const home = document.getElementById('appView');
     const lobby = document.getElementById('dominoLobbyPanel');
     return !!home && !home.classList.contains('hidden') && !tableOpen() &&
       !lobby?.classList.contains('active') && !lobby?.classList.contains('show');
   };

   // El index.html existente declara "const sb = createClient(...)" en un script
   // clásico, no "window.sb". Esa variable léxica puede estar disponible en el
   // ámbito global del módulo sin ser propiedad de window.
   function getSupabaseClient() {
     // Priorizar el cliente compartido por index.html, sin crear sesiones nuevas.
     for (const key of ['sb', 'dfcSupabase', 'supabaseClient', 'supabaseDb', 'rfSupabase']) {
       try {
         const client = window[key];
         if (typeof client?.auth?.getSession === 'function' && typeof client?.rpc === 'function') {
           return client;
         }
       } catch (_) { /* Intentar la siguiente referencia. */ }
     }

     // Compatibilidad con HTML anterior: "const sb" global léxico no crea window.sb.
     try {
       if (typeof sb !== 'undefined' && typeof sb?.auth?.getSession === 'function' &&
           typeof sb?.rpc === 'function') {
         window.sb = sb;
         window.dfcSupabase = sb;
         return sb;
       }
     } catch (_) { /* El HTML puede seguir inicializándose. */ }
     return null;
   }

   function reportCheck(code, detail = '') {
     lastDiagnostic = code;
     // Evitar volcar JWT, balances, datos de perfil o respuestas completas.
     console.warn('[DFC Android OTA]', code, detail);
     return false;
   }

   // Un resultado sin respuesta, un error o una sesión incierta NO autoriza reiniciar.
   // Únicamente una comprobación explícita del servidor sin asiento activo es segura.
   async function safeToRestart() {
     if (tableOpen()) return reportCheck('TABLE_SCREEN_OPEN');
     if (!homeVisible()) return reportCheck('NOT_ON_HOME');

     const client = getSupabaseClient();
     if (!client) return reportCheck('SUPABASE_CLIENT_UNAVAILABLE');

     try {
       const sessionResult = await Promise.race([
         client.auth.getSession(),
         new Promise((_, reject) => setTimeout(() => reject(new Error('SESSION_TIMEOUT')), 10000)),
       ]);

       if (sessionResult?.error) return reportCheck('SESSION_ERROR', sessionResult.error.code || '');
       if (!sessionResult?.data?.session?.access_token) {
         return reportCheck('SESSION_NOT_AVAILABLE');
       }

       const lobbyResult = await Promise.race([
         client.rpc('rf_domino_get_lobby_v11'),
         new Promise((_, reject) => setTimeout(() => reject(new Error('LOBBY_TIMEOUT')), 15000)),
       ]);

       if (lobbyResult?.error) {
         return reportCheck('LOBBY_RPC_ERROR', lobbyResult.error.code || '');
       }

       const data = lobbyResult?.data;
       if (!data || typeof data !== 'object' || Array.isArray(data) ||
           !Object.prototype.hasOwnProperty.call(data, 'my_table') ||
           !Object.prototype.hasOwnProperty.call(data, 'my_state')) {
         return reportCheck('LOBBY_RESPONSE_INVALID');
       }

       // La fuente autoritativa es my_table: con mesa asignada nunca reiniciar.
       // También bloquear estados activos anómalos, aunque my_table llegue vacío.
       const state = data.my_state == null ? '' : String(data.my_state).toLowerCase();
       if (data.my_table != null || ['playing', 'waiting', 'ready', 'seated', 'active'].includes(state)) {
         return reportCheck('ACTIVE_OR_PENDING_SEAT');
       }

       lastDiagnostic = 'SERVER_CONFIRMED_NO_SEAT';
       return true;
     } catch (error) {
       const kind = String(error?.message || 'UNKNOWN').includes('TIMEOUT') ? 'TIMEOUT' : 'NETWORK_OR_RUNTIME_ERROR';
       return reportCheck(kind);
     }
   }

   function updateButton() {
     let btn = document.getElementById('dfcOTAUserButton');
     if (!btn) {
       btn = document.createElement('button');
       btn.type = 'button';
       btn.id = 'dfcOTAUserButton';
       btn.style.cssText = [
         'position:fixed',
         'bottom:calc(74px + env(safe-area-inset-bottom,0px))',
         'left:50%',
         'transform:translateX(-50%)',
         'z-index:2147483000',
         'max-width:calc(100vw - 24px)',
         'min-height:46px',
         'padding:12px 18px',
         'border:2px solid #9bdfff',
         'border-radius:16px',
         'background:linear-gradient(135deg,#0874db,#00428b)',
         'color:white',
         'font:700 14px system-ui',
         'white-space:nowrap',
         'box-shadow:0 4px 18px #0009',
       ].join(';');
       btn.addEventListener('click', () => void window.dfcInstallApprovedUpdate());
       document.body.appendChild(btn);
     }
     btn.textContent = busy ? 'Preparando actualización…' : pendingBundle ? `📲 Instalar cuando sea seguro · ${pendingBundle.version}` : `📲 Actualizar · ${candidate?.version || ''}`;
     btn.disabled = busy;
     btn.hidden = !candidate && !pendingBundle;
     btn.style.display = btn.hidden ? 'none' : '';
     return btn;
   }

   async function currentVersion() {
     try {
       const info = await CapacitorUpdater.current();
       const bundle = info?.bundle;
       const version = bundle?.version;
       if (bundle?.id && bundle.id !== 'builtin' && versionNumber(version) >= 0) {
         return version;
       }
     } catch (error) {
       console.warn('[DFC Android OTA] CURRENT_VERSION_ERROR', String(error?.message || 'unknown'));
     }
     return BASE_VERSION;
   }

   async function check(force = false) {
     if (busy || document.hidden || (!force && Date.now() - checkedAt < 90000)) return;
     checkedAt = Date.now();
     try {
       const response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: 'no-store' });
       if (!response.ok) throw new Error(`MANIFEST_HTTP_${response.status}`);
       const m = await response.json();
       const url = new URL(String(m?.url || ''));
       if (versionNumber(m?.version) < 0 || !SHA256_RE.test(String(m?.sha256 || '')) ||
           url.origin !== EXPECTED_ORIGIN || !url.pathname.startsWith(EXPECTED_PATH) ||
           url.pathname !== `${EXPECTED_PATH}${m.version}.zip` || url.protocol !== 'https:') {
         throw new Error('MANIFEST_INVALID');
       }

       const installed = await currentVersion();
       candidate = versionNumber(m.version) > versionNumber(installed)
         ? { version: m.version, url: url.toString(), sha256: m.sha256 }
         : null;
     } catch (error) {
       console.warn('[DFC Android OTA] CHECK_FAILED', String(error?.message || 'unknown'));
       // Ante un fallo temporal, no eliminar una oferta ya verificada.
     }
     updateButton();
   }

   window.dfcGetInstalledAndroidVersion = currentVersion;

   window.dfcInstallApprovedUpdate = async function () {
     if (busy) return;
     if (!candidate && !pendingBundle) { await check(true); return; }

     busy = true;
     updateButton();
     try {
       if (!pendingBundle) {
         const target = candidate;
         // La descarga no necesita autorización para abandonar el asiento.
         // NUNCA reiniciar hasta que el servidor confirme que es seguro.
         const pkg = await CapacitorUpdater.download({
           version: target.version,
           url: target.url,
           checksum: target.sha256,
         });
         if (!pkg?.id) throw new Error('DOWNLOADED_PACKAGE_INVALID');
         pendingBundle = { id: pkg.id, version: target.version };
       }

       if (!(await safeToRestart())) {
         alert('Actualización descargada y pendiente. Puedes seguir jugando. La instalación requiere confirmar que no haya jugadas ni operaciones económicas en curso; vuelve a tocar Actualizar cuando sea seguro. Diagnóstico: ' + lastDiagnostic);
         return;
       }

       if (!confirm(`¿Instalar la actualización autorizada ${pendingBundle.version} ahora?`)) return;
       // Revalidar inmediatamente antes del reinicio; nunca forzar si el estado es incierto.
       if (!(await safeToRestart())) {
         alert('Instalación pendiente: la seguridad de la partida no se pudo confirmar. Diagnóstico: ' + lastDiagnostic);
         return;
       }
       const pkgId = pendingBundle.id;
       await CapacitorUpdater.set({ id: pkgId });
       pendingBundle = null;
     } catch (error) {
       console.warn('[DFC Android OTA] INSTALL_FAILED', String(error?.message || 'unknown'));
       alert('No se completó la actualización. Se conserva la versión anterior.');
     } finally {
       busy = false;
       updateButton();
     }
   };

   // Mantener orientación adaptable a vertical y horizontal.
   window.dominoForceLandscape = async () => {
     document.body.classList.add('domino-playing');
     try { await ScreenOrientation.unlock(); await StatusBar.hide(); }
     catch (error) { console.warn('Orientación de mesa:', String(error?.message || 'unknown')); }
     document.getElementById('dominoRotateGuard')?.classList.remove('show');
   };

   window.dominoReleaseLandscape = async () => {
     document.body.classList.remove('domino-playing');
     try { await ScreenOrientation.unlock(); await StatusBar.show(); }
     catch (error) { console.warn('Orientación de inicio:', String(error?.message || 'unknown')); }
     document.getElementById('dominoRotateGuard')?.classList.remove('show');
   };

   window.dominoUpdateRotateGuard = () => {
     document.getElementById('dominoRotateGuard')?.classList.remove('show');
   };

   void CapacitorUpdater.notifyAppReady().catch(error =>
     console.warn('[DFC Android OTA] READY_FAILED', String(error?.message || 'unknown'))
   );
   void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

   App.addListener('appStateChange', async ({ isActive }) => {
     if (!isActive) return;
     void check(true);
     if (tableOpen()) {
       try {
         if (typeof window.loadDominoState === 'function') await window.loadDominoState(true, true);
         if (typeof window.dominoStartRealtime === 'function') await window.dominoStartRealtime();
       } catch (error) {
         console.warn('Recuperación de mesa:', String(error?.message || 'unknown'));
       }
     }
   });

   App.addListener('backButton', () => {
     if (tableOpen()) {
       if (window.dominoSpectatorMode && typeof window.dominoExitSpectator === 'function') {
         window.dominoExitSpectator();
       } else {
         document.getElementById('dominoSurrenderBtn')?.click();
       }
     } else if (history.length > 1) {
       history.back();
     } else {
       void App.minimizeApp();
     }
   });

   function boot() {
     updateButton();
     void check(true);
     for (const id of ['dominoTablePanel', 'appView', 'dominoLobbyPanel']) {
       const element = document.getElementById(id);
       if (element) {
         new MutationObserver(updateButton).observe(element, {
           attributes: true,
           attributeFilter: ['class', 'style'],
         });
       }
     }
   }

   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', boot, { once: true });
   } else {
     boot();
   }
   window.addEventListener('online', () => void check(true));
   document.addEventListener('visibilitychange', () => {
     if (!document.hidden) void check(true);
   });
 }


 // DOMINÓ FLASH COIN · PUENTE ANDROID OTA · ADAPTACIÓN INMERSIVA Z32
 // Solo recursos web del APK Capacitor; NO actualiza el binario Android.
 // Descargar durante una partida está permitido; activar exige estado seguro.
 import { Capacitor } from '@capacitor/core';
 import { App } from '@capacitor/app';
 import { ScreenOrientation } from '@capacitor/screen-orientation';
 import { StatusBar } from '@capacitor/status-bar';
 import { CapacitorUpdater } from '@capgo/capacitor-updater';

 const ANDROID = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
 if (ANDROID) {
   document.documentElement.classList.add('dfc-android-native');
   const BASE_VERSION = '0.12Z.28'; // Versión del APK nativo original, no la versión OTA.
   const MANIFEST = 'https://cakon170812-hub.github.io/marketflsh/android-approved/manifest.json';
   const EXPECTED_ORIGIN = 'https://cakon170812-hub.github.io';
   const BUNDLES_PATH = '/marketflsh/android-approved/bundles/';
   const VERSION_RE = /^0\.12Z\.(\d{1,4})$/;
   const SHA_RE = /^[a-f0-9]{64}$/i;
   const PENDING_KEY = 'dfc_ota_bundle_pendiente_v1';
   let candidate = null;
   let downloading = false;
   let activating = false;
   let checkInProgress = null;
   let pending = null;
   let errorCode = '';

   function versionNumber(value) {
     const match = VERSION_RE.exec(String(value || ''));
     return match ? Number(match[1]) : -1;
   }
   function tableOpen() {
     return !!document.getElementById('dominoTablePanel')?.classList.contains('active');
   }
   function client() {
     for (const name of ['sb', 'dfcSupabase', 'supabaseClient', 'supabaseDb', 'rfSupabase']) {
       const value = window[name];
       if (typeof value?.auth?.getSession === 'function' && typeof value?.rpc === 'function') return value;
     }
     // Puede existir un 'const sb' léxico sin la propiedad window.sb.
     try {
       if (typeof sb !== 'undefined' && typeof sb?.auth?.getSession === 'function' && typeof sb?.rpc === 'function') {
         window.sb = sb;
         window.dfcSupabase = sb;
         return sb;
       }
     } catch (_) {}
     return null;
   }
   function status(code) {
     errorCode = code;
     console.warn('[DFC OTA]', code);
     return false;
   }
   async function withTimeout(promise, ms, code) {
     let timer;
     try {
       return await Promise.race([
         Promise.resolve(promise),
         new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(code)), ms); })
       ]);
     } finally { clearTimeout(timer); }
   }
   // Nunca confiar solo en la pantalla: una mesa puede seguir activa en Supabase.
   async function safeToActivate() {
     if (tableOpen()) return status('MESA_ABIERTA');
     const sbClient = client();
     if (!sbClient) return status('CLIENTE_SUPABASE_NO_DISPONIBLE');
     try {
       const auth = await withTimeout(sbClient.auth.getSession(), 10000, 'TIEMPO_SESION');
       if (auth?.error) return status('ERROR_SESION');
       if (!auth?.data?.session?.access_token) return status('SESION_NO_CONFIRMADA');
       const response = await withTimeout(sbClient.rpc('rf_domino_get_lobby_v11'), 15000, 'TIEMPO_MESA');
       if (response?.error) return status('ERROR_CONSULTA_MESA');
       const data = response?.data;
       if (!data || typeof data !== 'object' || Array.isArray(data) ||
           !Object.prototype.hasOwnProperty.call(data, 'my_table') ||
           !Object.prototype.hasOwnProperty.call(data, 'my_state')) return status('RESPUESTA_MESA_INVALIDA');
       const state = String(data.my_state ?? '').toLowerCase();
       if (data.my_table != null || ['playing','waiting','ready','seated','active'].includes(state)) {
         return status('ASIENTO_O_PARTIDA_ACTIVA');
       }
       errorCode = '';
       return true;
     } catch (e) { return status(String(e?.message || '').startsWith('TIEMPO_') ? 'TIEMPO_AGOTADO' : 'CONEXION_INCIERTA'); }
   }
   async function installedVersion() {
     try {
       const current = await CapacitorUpdater.current();
       if (current?.bundle?.id === 'builtin') return BASE_VERSION;
       if (current?.bundle?.id && versionNumber(current.bundle.version) >= 0) {
         return current.bundle.version;
       }
     } catch (e) { console.warn('[DFC OTA] VERSION_ERROR', String(e?.message || '')); }
     // Algunas compilaciones nativas devuelven bundle nulo o sin version
     // al iniciar. No esconder indefinidamente la actualización por ello.
     // El comprobador compara con la versión base solo como respaldo.
     console.warn('[DFC OTA] VERSION_DESCONOCIDA_USANDO_BASE', BASE_VERSION);
     return BASE_VERSION;
   }
   function button() {
     let btn = document.getElementById('dfcOTAUserButton');
     if (!btn) {
       btn = document.createElement('button');
       btn.id = 'dfcOTAUserButton';
       btn.type = 'button';
       btn.style.cssText = [
         'position:fixed','bottom:calc(16px + env(safe-area-inset-bottom,0px))',
         'left:50%','transform:translateX(-50%)','z-index:2147483000',
         'max-width:calc(100vw - 24px)','min-height:46px','padding:12px 18px',
         'background:linear-gradient(135deg,#0874db,#00428b)',
         'color:#fff','border:2px solid #9bdfff','border-radius:16px',
         'font:700 14px system-ui','box-shadow:0 4px 18px #0009'
       ].join(';');
       btn.addEventListener('click', () => void updateClicked());
       document.documentElement.appendChild(btn);
     }
     btn.disabled = downloading || activating;
     btn.textContent = activating ? 'Activando actualización…' : downloading ? 'Descargando actualización…' :
       pending ? `📲 Activar · ${pending.version}` : `📲 Actualizar · ${candidate?.version || ''}`;
     // La pantalla de inicio cambia de clases al autenticar; no retirar una OTA pendiente.
     // El botón permanece disponible mientras haya actualización y no haya partida abierta.
     const show = !!(candidate || pending) && !tableOpen() && !document.hidden;
     btn.hidden = !show;
     btn.style.setProperty('display', show ? 'block' : 'none', 'important');
     return btn;
   }
   function readPending() {
     try {
       const value = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
       return value && VERSION_RE.test(value.version) && typeof value.id === 'string' && value.id !== 'builtin' ? value : null;
     } catch (_) { return null; }
   }
   function savePending(value) {
     pending = value;
     try {
       if (value) sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
       else sessionStorage.removeItem(PENDING_KEY);
     } catch (_) {}
     button();
   }
   function check() {
     if (checkInProgress) return checkInProgress;
     if (downloading || activating || document.hidden) return Promise.resolve();
     checkInProgress = checkManifest().finally(() => { checkInProgress = null; });
     return checkInProgress;
   }
   async function checkManifest() {
     const controller = new AbortController();
     const timer = setTimeout(() => controller.abort(), 10000);
     try {
       const res = await fetch(MANIFEST + '?v=' + Date.now(), {cache:'no-store',signal:controller.signal});
       if (!res.ok) throw new Error('MANIFEST_HTTP_' + res.status);
       const data = await res.json();
       const url = new URL(String(data?.url || ''));
       if (versionNumber(data?.version) < 0 || !SHA_RE.test(String(data?.sha256 || '')) ||
           url.protocol !== 'https:' || url.origin !== EXPECTED_ORIGIN ||
           url.pathname !== BUNDLES_PATH + data.version + '.zip') throw new Error('MANIFEST_NO_VALIDO');
       const current = await withTimeout(installedVersion(), 5000, 'TIEMPO_VERSION');
       if (versionNumber(current) < 0) return;
       candidate = versionNumber(data.version) > versionNumber(current) ?
         {version:data.version,url:url.href,sha256:data.sha256} : null;
       if (pending && versionNumber(pending.version) <= versionNumber(current)) savePending(null);
       // La comprobación solo anuncia la versión; NUNCA descarga ni instala sin un toque.
       // Mantener el botón visible en la pantalla principal hasta que el usuario actúe.
     } catch (e) { console.warn('[DFC OTA] CONSULTA_FALLIDA', String(e?.message || '')); }
     finally { clearTimeout(timer); button(); }
   }
   async function activatePending() {
     if (!pending || downloading || activating) return;
     const saved = pending;
     activating = true; button();
     try {
       if (!(await safeToActivate())) {
         alert('La actualización está descargada. Toca «Activar» cuando salgas de la mesa. Estado: ' + errorCode);
         return;
       }
       if (!confirm('¿Activar ' + saved.version + ' ahora? La aplicación se reiniciará.')) return;
       if (!(await safeToActivate())) { alert('Activación aplazada: ' + errorCode); return; }
       await CapacitorUpdater.set({id:saved.id});
     } catch(e) {
       console.warn('[DFC OTA] ACTIVACION_FALLIDA', String(e?.message || ''));
       alert('No se pudo activar la actualización. La versión actual se conserva.');
     } finally { activating = false; button(); }
   }
   async function updateClicked() {
     if (downloading || activating) return;
     if (pending) return activatePending();
     if (!candidate) { await check(); return; }
     const target = candidate;
     if (!confirm('¿Descargar ' + target.version + '? Puedes seguir jugando; no se reiniciará la partida durante la descarga.')) return;
     downloading = true; button();
     try {
       const bundle = await CapacitorUpdater.download({version:target.version,url:target.url,checksum:target.sha256});
       if (!bundle?.id || bundle.id === 'builtin') throw new Error('PAQUETE_INVALIDO');
       savePending({version:target.version,id:bundle.id});
       // No activar automáticamente durante una partida ni alterar sus turnos.
       if (await safeToActivate()) {
         alert('Actualización descargada. Toca «Activar» para instalarla.');
       } else {
         alert('Actualización descargada. Puedes continuar jugando; cuando el servidor confirme que no tienes una mesa activa, toca «Activar».');
       }
     } catch(e) {
       console.warn('[DFC OTA] DESCARGA_FALLIDA', String(e?.message || ''));
       alert('No fue posible descargar la actualización. Se conserva la versión actual.');
     } finally { downloading = false; button(); }
   }
   // El paquete descargado se conserva por su id; no llamar a set mientras hay jugadas.
   savePending(readPending());
   window.dfcGetInstalledAndroidVersion = installedVersion;
   window.dfcInstallApprovedUpdate = updateClicked;
   window.dfcOtaCheck = () => check();
   void CapacitorUpdater.notifyAppReady().catch(e => console.warn('[DFC OTA] READY', e));
   // Mantener el modo inmersivo en todas las pantallas, no solo al entrar a la mesa.
   // La navegación nativa (barra inferior) requiere además configuración del APK.
   async function applyImmersiveMode() {
     try { await ScreenOrientation.lock({orientation:'landscape'}); }
     catch(e) { console.warn('[DFC ANDROID] ORIENTACION', String(e?.message || '')); }
     try {
       await StatusBar.setOverlaysWebView({overlay:true});
       await StatusBar.hide();
     } catch(e) { console.warn('[DFC ANDROID] STATUS_BAR', String(e?.message || '')); }
     document.documentElement.classList.add('dfc-android-native','dfc-landscape-immersive');
   }
   void applyImmersiveMode();
   window.dominoForceLandscape = async () => {
     document.body.classList.add('domino-playing');
     await applyImmersiveMode();
     document.getElementById('dominoRotateGuard')?.classList.remove('show');
   };
   window.dominoReleaseLandscape = async () => {
     document.body.classList.remove('domino-playing');
     await applyImmersiveMode();
     document.getElementById('dominoRotateGuard')?.classList.remove('show');
   };
   window.dominoUpdateRotateGuard = () => document.getElementById('dominoRotateGuard')?.classList.remove('show');
   App.addListener('appStateChange', async ({isActive}) => {
     if (!isActive) return;
     void check();
     await applyImmersiveMode();
     if (tableOpen()) {
       try {
         if (typeof window.loadDominoState === 'function') await window.loadDominoState(true,true);
         if (typeof window.dominoStartRealtime === 'function') await window.dominoStartRealtime();
       } catch(e) { console.warn('Restauración mesa:',e); }
     }
   });
   App.addListener('backButton', () => {
     if (tableOpen()) {
       if (window.dominoSpectatorMode && typeof window.dominoExitSpectator === 'function') window.dominoExitSpectator();
       else document.getElementById('dominoSurrenderBtn')?.click();
     } else if (history.length > 1) history.back();
     else void App.minimizeApp();
   });
   function boot() {
     void applyImmersiveMode();
     button(); void check();
     for(const id of ['dominoTablePanel','appView','dominoLobbyPanel']) {
       const el = document.getElementById(id);
       if (el) new MutationObserver(button).observe(el,{attributes:true,attributeFilter:['class','style']});
     }
     const home = document.getElementById('appView');
     if (home) {
       let wasHidden = home.classList.contains('hidden');
       new MutationObserver(() => {
         const hidden = home.classList.contains('hidden');
         if (wasHidden && !hidden) void check();
         wasHidden = hidden;
       }).observe(home,{attributes:true,attributeFilter:['class']});
     }
   }
   if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
   else boot();
   setInterval(() => void check(), 30000);
   window.addEventListener('online',()=>void check());
   document.addEventListener('visibilitychange',()=>{button();if(!document.hidden)void check();});
 }

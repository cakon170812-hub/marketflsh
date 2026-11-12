
/*
 * DOMINÓ FLASH COIN
 * Archivo: script.js
 * Versión: 0.12Z.30
 *
 * Integración y diagnóstico del sistema de actualización.
 * Compatible con index.html y native-bridge.js Z30.
 *
 * No modifica las reglas del dominó, las partidas,
 * los diamantes, los saldos ni las recompensas.
 */

(function () {
  'use strict';

  const BUILD = '0.12Z.30';
  const MANIFEST = './android-approved/manifest.json';
  const EXPECTED_ORIGIN = 'https://cakon170812-hub.github.io';
  const EXPECTED_PATH = '/marketflsh/android-approved/bundles/';
  const VERSION_RE = /^0\.12Z\.(\d{1,4})$/;
  const SHA256_RE = /^[a-f0-9]{64}$/i;

  if (window.dfcWebIntegration?.build === BUILD) {
    return;
  }

  function isSupabaseClient(value) {
    return (
      !!value &&
      typeof value.auth?.getSession === 'function' &&
      typeof value.rpc === 'function'
    );
  }

  function getClient() {
    const candidates = [
      window.sb,
      window.dfcSupabase,
      window.supabaseClient,
      window.supabaseDb,
      window.rfSupabase
    ];

    for (const client of candidates) {
      if (isSupabaseClient(client)) {
        return client;
      }
    }

    try {
      if (
        typeof sb !== 'undefined' &&
        isSupabaseClient(sb)
      ) {
        window.sb = sb;
        window.dfcSupabase = sb;
        return sb;
      }
    } catch (_) {
      // El HTML todavía puede estar inicializándose.
    }

    return null;
  }

  function synchronizeSupabase() {
    const client = getClient();

    if (!client) {
      return false;
    }

    window.sb = client;
    window.dfcSupabase = client;

    return true;
  }

  function getVersion() {
    return (
      document.querySelector(
        'meta[name="application-version"]'
      )?.getAttribute('content') ||
      document.documentElement.getAttribute('data-app-build') ||
      null
    );
  }

  function isNativeAndroid() {
    return document.documentElement.classList.contains(
      'dfc-android-native'
    );
  }

  function isTableOpen() {
    return !!document.getElementById('dominoTablePanel')
      ?.classList.contains('active');
  }

  function isLobbyOpen() {
    const lobby = document.getElementById(
      'dominoLobbyPanel'
    );

    return !!(
      lobby?.classList.contains('active') ||
      lobby?.classList.contains('show')
    );
  }

  function isHomeVisible() {
    const home = document.getElementById('appView');

    return !!(
      home &&
      !home.classList.contains('hidden') &&
      !isTableOpen() &&
      !isLobbyOpen()
    );
  }

  function createResult(ok, code, extra = {}) {
    return {
      ok,
      code,
      build: BUILD,
      ...extra
    };
  }

  async function inspect(options = {}) {
    synchronizeSupabase();

    const client = getClient();

    const report = createResult(true, 'READY', {
      localVersion: getVersion(),
      supabaseClientAvailable: !!client,
      windowSupabaseAvailable: isSupabaseClient(
        window.sb
      ),
      nativeAndroid: isNativeAndroid(),
      tableScreenOpen: isTableOpen(),
      lobbyScreenOpen: isLobbyOpen(),
      homeVisible: isHomeVisible(),
      updaterAvailable:
        typeof window.dfcInstallApprovedUpdate ===
        'function'
    });

    if (!options.checkGitHub) {
      return report;
    }

    try {
      const response = await fetch(
        MANIFEST + '?t=' + Date.now(),
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'omit'
        }
      );

      if (!response.ok) {
        throw new Error(
          'MANIFEST_HTTP_' + response.status
        );
      }

      const manifest = await response.json();

      const version = String(
        manifest?.version || ''
      );

      const url = new URL(
        String(manifest?.url || ''),
        location.href
      );

      const checksum = String(
        manifest?.sha256 || ''
      );

      if (
        !VERSION_RE.test(version) ||
        !SHA256_RE.test(checksum) ||
        url.protocol !== 'https:' ||
        url.origin !== EXPECTED_ORIGIN ||
        url.pathname !==
          EXPECTED_PATH + version + '.zip'
      ) {
        throw new Error('MANIFEST_INVALID');
      }

      report.publishedVersion = version;
      report.sameVersion =
        report.localVersion === version;

      if (
        typeof window.dfcGetInstalledAndroidVersion ===
        'function'
      ) {
        try {
          report.installedAndroidVersion =
            await window.dfcGetInstalledAndroidVersion();

          report.androidUpdateAvailable =
            versionNumber(version) >
            versionNumber(
              report.installedAndroidVersion
            );
        } catch (_) {
          report.installedAndroidVersion = null;
          report.androidUpdateAvailable = null;
        }
      }
    } catch (error) {
      report.ok = false;
      report.code = 'GITHUB_MANIFEST_CHECK_FAILED';
      report.reason = String(
        error?.message || 'UNKNOWN'
      );
    }

    return report;
  }

  function versionNumber(value) {
    const match = VERSION_RE.exec(
      String(value || '')
    );

    return match ? Number(match[1]) : -1;
  }

  /*
   * La sincronización comparte el cliente original.
   * No crea un segundo cliente de Supabase.
   * No modifica autenticación ni credenciales.
   */
  function initialize() {
    synchronizeSupabase();
  }

  window.dfcWebIntegration = Object.freeze({
    build: BUILD,
    getVersion,
    getClientAvailable() {
      return !!getClient();
    },
    synchronizeSupabase,
    isNativeAndroid,
    isTableOpen,
    isLobbyOpen,
    isHomeVisible,
    inspect
  });

  initialize();

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      { once: true }
    );
  }

  window.addEventListener(
    'pageshow',
    initialize
  );

  document.addEventListener(
    'visibilitychange',
    function () {
      if (!document.hidden) {
        initialize();
      }
    }
  );

  console.info(
    '[DOMINÓ FLASH COIN] Integración web',
    BUILD,
    'inicializada'
  );
})();


/* DOMINÓ FLASH COIN Z32 — Audio unificado y melodía original.
   Usa WebAudio, sin archivos externos; respeta las restricciones de autoplay.
   No toca Supabase, saldos ni la lógica del dominó. */
(function dfcZ32Audio() {
  'use strict';
  if (window.dfcZ32Audio) return;
  let ctx = null, enabled = true, musicTimer = null, melodyIndex = 0;
  let lastEffect = Object.create(null);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const melody = [392, 493.88, 587.33, 493.88, 440, 392, 329.63, 392,
                  523.25, 587.33, 659.25, 587.33, 493.88, 440, 392, 329.63];
  function startAudio() {
    if (!AudioContextClass || !enabled) return false;
    try {
      if (!ctx) ctx = new AudioContextClass();
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
      return true;
    } catch (_) { return false; }
  }
  function tone(freq, duration, volume, shape='sine', delay=0) {
    if (!enabled || !startAudio() || !ctx) return;
    try {
      const at = ctx.currentTime + delay;
      const oscillator=ctx.createOscillator(), gain=ctx.createGain();
      oscillator.type=shape; oscillator.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0.00001,at);
      gain.gain.exponentialRampToValueAtTime(Math.max(volume,0.00002),at+0.012);
      gain.gain.exponentialRampToValueAtTime(0.00001,at+duration);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(at); oscillator.stop(at+duration+0.02);
    } catch (_) {}
  }
  function effect(kind='tap') {
    if (!enabled) return;
    const now=Date.now();
    if (now-(lastEffect[kind]||0)<110) return;
    lastEffect[kind]=now;
    if (kind==='card' || kind==='flashcoin') {
      [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,0.23,0.065,'triangle',i*0.075));
    } else if (kind==='capicua') {
      [392,523.25,659.25,784,1046.5].forEach((f,i)=>tone(f,0.21,0.07,'triangle',i*0.085));
    } else if (kind==='domino' || kind==='play') {
      tone(170,0.085,0.085,'triangle'); tone(115,0.09,0.045,'sine',0.06);
    } else if (kind==='pass') {
      tone(310,0.13,0.07,'sawtooth'); tone(225,0.14,0.06,'triangle',0.1);
    } else if (kind==='win') {
      [440,554.37,659.25,880].forEach((f,i)=>tone(f,0.23,0.06,'triangle',i*0.12));
    } else {
      tone(610,0.055,0.027,'sine'); tone(810,0.055,0.02,'triangle',0.047);
    }
  }
  function screenIsHome() {
    if (document.hidden || document.getElementById('dominoTablePanel')?.classList.contains('active')) return false;
    if (document.getElementById('dominoLobbyPanel')?.classList.contains('active')) return false;
    const el=document.getElementById('appView');
    return !!el && !el.classList.contains('hidden');
  }
  function musicTick() {
    if (!screenIsHome() || !enabled || !ctx || ctx.state!=='running') return;
    const f=melody[melodyIndex++%melody.length];
    tone(f,0.34,0.012,'sine');
    if (melodyIndex%4===1) tone(f/2,0.42,0.006,'triangle');
  }
  function bootMusic() {
    if (!startAudio()) return;
    if (!musicTimer) musicTimer=window.setInterval(musicTick,420);
  }
  function classify(el) {
    const text=((el?.innerText||el?.textContent||'')+' '+(el?.id||'')+' '+(el?.className?.baseVal||el?.className||'')).toLowerCase();
    if (/capic[uú]a/.test(text)) return 'capicua';
    if (/flash.?coin|tarjeta|card|recompensa|premio/.test(text)) return 'card';
    if (/domin[oó]|jugar|ficha|tirar|playtile/.test(text)) return 'domino';
    if (/pasar|pase|no voy/.test(text)) return 'pass';
    if (/gan[aó]|victoria|ganador/.test(text)) return 'win';
    return 'tap';
  }
  document.addEventListener('pointerdown', (event) => {
    const target=event.target?.closest?.('button,[role="button"],a,input[type="button"],input[type="submit"],.dfc-card,.flashcoin-card,[data-sound]');
    if (!target || target.disabled) return;
    bootMusic(); effect(target.dataset?.sound || classify(target));
  }, {passive:true,capture:true});
  document.addEventListener('keydown',(event)=>{
    if (event.key==='Enter' || event.key===' ') {bootMusic();const b=event.target?.closest?.('button,[role="button"]');if(b)effect(classify(b));}
  },{capture:true});
  // Eventos explícitos para jugadas, premios o animación de explosión.
  document.addEventListener('dfc:sound',(event)=>{bootMusic();effect(event.detail?.kind||'tap');});
  window.dfcZ32Audio=Object.freeze({
    play:effect,
    enable(value){enabled=!!value;if(enabled)bootMusic();},
    get enabled(){return enabled;},
    get requiresInteraction(){return !ctx || ctx.state!=='running';}
  });
})();
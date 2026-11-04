
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

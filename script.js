
/*
 * DOMINÓ FLASH COIN — script.js
 * Compatibilidad y diagnóstico web Z29.
 * El motor del juego está en index.html. Este archivo no lo sustituye.
 * No contiene credenciales ni realiza operaciones de escritura.
 * Puede cargarse como script clásico, después del código principal.
 */
(function () {
  'use strict';

  if (window.dfcWebIntegration?.build === '0.12Z.29') return;

  var BUILD = '0.12Z.29';
  var MANIFEST = './android-approved/manifest.json';
  var EXPECTED_ORIGIN = 'https://cakon170812-hub.github.io';
  var VERSION = /^0\.12Z\.(\d{1,4})$/;

  function hasClient(value) {
    return !!value && typeof value.auth?.getSession === 'function' &&
      typeof value.rpc === 'function';
  }

  function getClient() {
    // index.html publica window.sb y window.dfcSupabase.
    // No crear un segundo cliente ni usar credenciales de ejemplo.
    var candidates = [window.sb, window.dfcSupabase];
    for (var i = 0; i < candidates.length; i++) {
      if (hasClient(candidates[i])) return candidates[i];
    }
    return null;
  }

  function getVersion() {
    return document.querySelector('meta[name="application-version"]')
      ?.getAttribute('content') ||
      document.documentElement.getAttribute('data-app-build') || null;
  }

  function result(ok, code, extra) {
    return Object.assign({ ok: ok, code: code, build: BUILD }, extra || {});
  }

  async function inspect(options) {
    var opts = options || {};
    var localVersion = getVersion();
    var client = getClient();
    var report = result(true, 'READY', {
      localVersion: localVersion,
      supabaseClientAvailable: !!client,
      nativeAndroid: document.documentElement.classList.contains('dfc-android-native'),
      tableScreenOpen: !!document.getElementById('dominoTablePanel')
        ?.classList.contains('active')
    });

    if (opts.checkGitHub === true) {
      try {
        var response = await fetch(MANIFEST + '?t=' + Date.now(), {
          method: 'GET',
          cache: 'no-store',
          credentials: 'omit'
        });
        if (!response.ok) throw new Error('MANIFEST_HTTP_' + response.status);
        var manifest = await response.json();
        var version = String(manifest.version || '');
        var url = new URL(String(manifest.url || ''), location.href);
        if (!VERSION.test(version) ||
            url.origin !== EXPECTED_ORIGIN ||
            url.pathname !== '/marketflsh/android-approved/bundles/' + version + '.zip' ||
            !/^[a-f0-9]{64}$/i.test(String(manifest.sha256 || ''))) {
          throw new Error('MANIFEST_INVALID');
        }
        report.publishedVersion = version;
        report.sameVersion = localVersion === version;
      } catch (error) {
        report.ok = false;
        report.code = 'GITHUB_MANIFEST_CHECK_FAILED';
        report.reason = String(error?.message || 'Unknown');
      }
    }
    return report;
  }

  // Solo diagnósticos no sensibles. Nunca muestra el token de sesión.
  window.dfcWebIntegration = Object.freeze({
    build: BUILD,
    getVersion: getVersion,
    getClientAvailable: function () { return !!getClient(); },
    inspect: inspect
  });
})();

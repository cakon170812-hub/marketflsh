// DOMINÓ FLASH COIN — Service Worker sin caché de navegación.
// La APK instala sus actualizaciones mediante Capacitor Updater.
// No interceptar fetch ni almacenar HTML antiguo.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

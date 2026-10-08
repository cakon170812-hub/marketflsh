const MF_SW_VERSION='0.1-stable-4';

self.addEventListener('install',()=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('maiket-flash-')).map(k=>caches.delete(k)));
    }catch(e){}
    await self.clients.claim();
  })());
});

// Intencionalmente NO interceptamos navegación ni index.html.
// Así GitHub Pages entrega siempre el HTML actual y evitamos que una copia
// antigua del service worker deje la aplicación cargando o en blanco.

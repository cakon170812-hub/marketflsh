// Dominos Flash Coin PWA 0.08: network-first for application code, no API caching.
const CACHE='dfc-static-v008';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(url=>cache.add(url)))));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin)return;
 if(u.pathname.includes('/rest/v1/')||u.pathname.includes('/auth/v1/')||u.pathname.includes('/functions/v1/')||u.pathname.includes('/realtime/v1/'))return;
 event.respondWith(fetch(r).then(response=>{if(response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE).then(c=>c.put(r,copy));}return response;}).catch(()=>caches.match(r)));
});

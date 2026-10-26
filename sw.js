/* DOMINÓ FLASH COIN v0.12Z.17 — candidato PWA, no actualiza el APK nativo.
 * Guarda SOLO archivos visuales estáticos del MISMO origen.
 * HTML de navegación, Supabase RPC, auth y datos de jugadores: RED SIEMPRE.
 */
'use strict';
const VERSION='0.12Z.17';
const STATIC_CACHE='dfc-static-'+VERSION;
const APP_PREFIX=new URL(self.registration.scope).pathname;
const STATIC_TYPES=new Set(['image','audio','font','style','script']);
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith('dfc-static-')&&k!==STATIC_CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(APP_PREFIX))return;
 if(req.mode==='navigate'||req.destination==='document'){
   e.respondWith(fetch(new Request(req,{cache:'no-store'})).catch(()=>new Response(
     '<!doctype html><html lang="es"><meta name="viewport" content="width=device-width"><title>Sin conexión</title><body style="font:16px system-ui;background:#071b32;color:white;padding:22px"><h2>Sin conexión</h2><p>Conéctate para sincronizar DOMINÓ FLASH COIN. Tu sesión y tus saldos permanecen en el servidor.</p></body></html>',
     {status:503,headers:{'Content-Type':'text/html; charset=UTF-8','Cache-Control':'no-store'}})));
   return;
 }
 if(!STATIC_TYPES.has(req.destination))return; // No caché de peticiones API ni datos privados.
 e.respondWith((async()=>{
  const cache=await caches.open(STATIC_CACHE);
  const saved=await cache.match(req);
  if(saved)return saved;
  try{
    const res=await fetch(req);
    if(res.ok&&res.type==='basic'){
      // Cache only public assets, never responses with Set-Cookie/private or no-store semantics.
      const control=(res.headers.get('Cache-Control')||'').toLowerCase();
      if(!/private|no-store|no-cache/.test(control)&&!res.headers.has('Set-Cookie')){
        e.waitUntil(cache.put(req,res.clone()).catch(()=>{}));
      }
    }
    return res;
  }catch(err){return new Response('',{status:503,statusText:'Recurso estático no disponible'});}
 })());
});

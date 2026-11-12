
/*
 * DOMINÓ FLASH COIN
 * Archivo: script.js
 * Versión: 0.12Z.32
 *
 * Integración y diagnóstico del sistema de actualización.
 * Compatible con index.html y native-bridge.js Z30.
 *
 * No modifica las reglas del dominó, las partidas,
 * los diamantes, los saldos ni las recompensas.
 */

(function () {
  'use strict';

  const BUILD = '0.12Z.32';
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
  let lastNavigation = 0;
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
    } else if (kind==='explode' || kind==='burst') {
      tone(145,0.12,0.075,'triangle');
      [780,1046.5,1318.5,1568,2093].forEach((f,i)=>tone(f,0.17,0.047,'sine',i*0.065));
    } else if (kind==='open' || kind==='panel') {
      tone(450,0.085,0.03,'sine'); tone(680,0.11,0.032,'triangle',0.055);
    } else if (kind==='close' || kind==='back') {
      tone(680,0.065,0.028,'sine'); tone(380,0.085,0.027,'triangle',0.06);
    } else if (kind==='error') {
      tone(290,0.14,0.045,'triangle'); tone(230,0.16,0.04,'triangle',0.12);
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
    if (/explosi[oó]n|explode|burst|estallar|monedas/.test(text)) return 'explode';
    if (/capic[uú]a/.test(text)) return 'capicua';
    if (/cerrar|volver|salir|atr[aá]s|close|back/.test(text)) return 'close';
    if (/abrir|panel|men[uú]|opciones|configurar|open/.test(text)) return 'open';
    if (/flash.?coin|tarjeta|card|recompensa|premio/.test(text)) return 'card';
    if (/domin[oó]|jugar|ficha|tirar|playtile/.test(text)) return 'domino';
    if (/pasar|pase|no voy/.test(text)) return 'pass';
    if (/gan[aó]|victoria|ganador/.test(text)) return 'win';
    return 'tap';
  }
  // El primer toque habilita el audio (autoplay en Android, iOS y navegadores).
  // Se reproduce el efecto solo para controles activos; no al arrastrar la pantalla.
  document.addEventListener('pointerdown', (event) => {
    bootMusic();
    const el=event.target;
    const target=el?.closest?.('button,[role="button"],a,input[type="button"],input[type="submit"],input[type="checkbox"],input[type="radio"],select,[onclick],[data-action],[data-sound],.dfc-card,.flashcoin-card,.dfc-lab-gift-card,.domino-tile,.domino-hand-tile,.clickable,.btn');
    if (!target || target.disabled || target.getAttribute('aria-disabled')==='true') return;
    effect(target.dataset?.sound || classify(target));
  }, {passive:true,capture:true});
  // Un solo sonido por navegación; funciona con componentes que no sean botones.
  document.addEventListener('click', (event) => {
    const element=event.target?.closest?.('[role="tab"],[role="menuitem"],summary,[data-nav],[data-screen]');
    if (!element || element.disabled) return;
    const now=Date.now();
    if (now-lastNavigation>150) {lastNavigation=now;effect(classify(element));}
  }, {passive:true,capture:true});
  // Detecta las animaciones Flash Coin ya existentes sin modificar su lógica.
  document.addEventListener('animationstart', (event) => {
    const target=event.target;
    if (!(target instanceof Element)) return;
    const id=(String(event.animationName||'')+' '+String(target.id||'')+' '+String(target.className||'')).toLowerCase();
    if (/flash.?coin|moneda|coin|gift|tarjeta/.test(id) && /explod|burst|estall|scatter|confetti|particul|explosi|flycoin/.test(id)) {
      effect('explode');
    }
  }, {capture:true});
  document.addEventListener('dfc:flashcoin:explode',()=>{bootMusic();effect('explode');});
  document.addEventListener('dfc:flashcoin:open',()=>{bootMusic();effect('open');});
  window.addEventListener('pageshow',()=>{if(ctx?.state==='running')bootMusic();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden && ctx?.state==='running')bootMusic();});
  document.addEventListener('keydown',(event)=>{
    if (event.key==='Enter' || event.key===' ') {bootMusic();const b=event.target?.closest?.('button,[role="button"],a,[role="tab"],summary');if(b)effect(classify(b));}
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

/* DOMINÓ FLASH COIN Z32 — Tarjetas de capicúa reclamables.
   La autorización, importe y acreditación se verifican en Supabase.
   La interfaz nunca altera saldo por su cuenta. */
(function dfcZ32CapicuaCards() {
 'use strict';
 if(window.dfcZ32CapicuaCards) return;
 let cards=[], busy=false, lastPoll=0, inflight=false;
 const fc=n=>Number(n||0).toLocaleString('es-DO',{minimumFractionDigits:3,maximumFractionDigits:3});
 function client(){
   if(window.dfcWebIntegration?.getClientAvailable?.()) {
     for(const c of [window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase])
       if(c&&typeof c.rpc==='function')return c;
   }
   for(const c of [window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase])
     if(c&&typeof c.rpc==='function'&&typeof c.auth?.getSession==='function')return c;
   return null;
 }
 function host(){
   let h=document.getElementById('dfcZ32CapicuaHost');
   if(h)return h;
   h=document.createElement('div');h.id='dfcZ32CapicuaHost';
   h.style.cssText='position:fixed;right:12px;bottom:calc(15px + env(safe-area-inset-bottom));z-index:1500;display:flex;flex-direction:column;gap:7px;max-width:min(260px,45vw);pointer-events:none;';
   document.body.append(h);return h;
 }
 function onScreen(){
   if(document.hidden)return false;
   const table=document.getElementById('dominoTablePanel');
   const main=document.getElementById('appView');
   return !!(table?.classList.contains('active') || (main && !main.classList.contains('hidden')));
 }
 function render(){
   const h=host();
   h.replaceChildren();
   h.style.display=onScreen()&&cards.length?'flex':'none';
   cards.slice(0,3).forEach(b=>{
     const btn=document.createElement('button');btn.type='button';btn.dataset.sound='card';
     btn.style.cssText='pointer-events:auto;border:2px solid #ffe69a;border-radius:12px;background:linear-gradient(135deg,#39230a,#d39321 54%,#68400b);color:#fff6d5;padding:8px 11px;font:800 12px system-ui;box-shadow:0 3px 15px #000a;text-align:center;min-height:50px;max-width:100%;';
     btn.textContent='🪙 CAPICÚA · +'+fc(b.amount)+' FC · TOCAR PARA RECLAMAR';
     btn.disabled=busy;btn.onclick=()=>void claim(b,btn);
     h.append(btn);
   });
   if(cards.length>3){
     const extra=document.createElement('small');extra.textContent='+'+(cards.length-3)+' tarjetas pendientes';
     extra.style.cssText='text-align:right;color:#ffe6a3;font:700 11px system-ui;text-shadow:0 1px 3px #000';
     h.append(extra);
   }
 }
 async function refresh(force=false){
   if(inflight || !onScreen() || (!force&&Date.now()-lastPoll<12000))return;
   const db=client();if(!db)return;
   inflight=true;lastPoll=Date.now();
   try{
     const {data,error}=await db.rpc('rf_domino_pending_capicua_z32');
     if(error)throw error;
     cards=Array.isArray(data)?data.filter(v=>v&&Number(v.amount)>0):[];
     render();
   }catch(e){console.warn('[DFC Z32 tarjetas]',String(e?.message||e));}
   finally{inflight=false;}
 }
 async function claim(b,btn){
   if(busy || !b?.hand_id)return;
   const db=client();if(!db)return;
   busy=true;btn.disabled=true;
   try{
     const {data,error}=await db.rpc('rf_domino_claim_capicua_z32',{p_hand_id:b.hand_id});
     if(error)throw error;
     if(!data?.ok)throw new Error(data?.message||'No se pudo reclamar la tarjeta');
     const dest=document.getElementById('dfcLabGiftCard018')||document.getElementById('balanceBtn')||document.getElementById('balanceTop');
     window.dfcZ32Audio?.play('flashcoin');
     if(dest){
       const rect=dest.getBoundingClientRect(),src=btn.getBoundingClientRect();
       if(typeof btn.animate==='function'){
         const a=btn.animate([{opacity:1,transform:'scale(1)'},{opacity:.05,transform:'translate('+
           (rect.left-src.left)+'px,'+(rect.top-src.top)+'px) scale(.2)'}],
           {duration:650,easing:'ease-in',fill:'forwards'});
         await a.finished.catch(()=>{});
       }
     }
     cards=cards.filter(v=>String(v.hand_id)!==String(b.hand_id));
     if(typeof window.loadMe==='function')await window.loadMe().catch(()=>{});
     if(typeof window.renderMe==='function')window.renderMe();
     document.dispatchEvent(new CustomEvent('dfc:z32:capicua-claimed',{detail:{amount:data.amount,hand_id:b.hand_id}}));
   }catch(e){alert('No se pudo reclamar la tarjeta: '+String(e?.message||e));}
   finally{busy=false;render();}
 }
 window.dfcZ32CapicuaCards=Object.freeze({refresh:()=>refresh(true)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh(true);else render();});
 document.addEventListener('click',()=>{if(onScreen())void refresh(false);},{passive:true});
 document.addEventListener('dfc:z32:capicua-settled',()=>void refresh(true));
 setInterval(()=>void refresh(false),14000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void refresh(true),{once:true});
 else void refresh(true);
})();


/* DFC Z32 — anuncio universal de tarjetas FlashCoin recibidas */
(function dfcZ32UniversalGiftAnnouncement(){
  'use strict';
  if(window.dfcZ32UniversalGiftAnnouncement)return;
  let busy=false, presenting=false, lastUser='', current=null, queue=[], pollTimer=null;
  const known=new Set();
  function client(){
    for(const k of ['sb','dfcSupabase','supabaseClient','rfSupabase']){
      const s=window[k];
      if(s && typeof s.rpc==='function' && typeof s.auth?.getSession==='function')return s;
    }
    return null;
  }
  function seenKey(uid){return 'dfc-z32-announced-gifts:'+uid;}
  function readSeen(uid){
    known.clear();
    try{
      const arr=JSON.parse(localStorage.getItem(seenKey(uid))||'[]');
      if(Array.isArray(arr))arr.slice(-300).forEach(v=>known.add(String(v)));
    }catch(e){}
  }
  function markSeen(uid,id){
    known.add(String(id));
    try{localStorage.setItem(seenKey(uid),JSON.stringify([...known].slice(-300)));}catch(e){}
  }
  function money(n){return Number(n).toLocaleString('es-DO',{minimumFractionDigits:2,maximumFractionDigits:3})+' FC';}
  function draw(card){
    if(document.hidden || presenting || !card)return;
    presenting=true;current=card;
    const overlay=document.createElement('div');
    overlay.id='dfcZ32GiftFullScreen';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Nueva tarjeta FlashCoin de '+money(card.amount));
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at center,#102548ed,#010712f5);font-family:system-ui,sans-serif;overflow:auto;';
    const btn=document.createElement('button');
    btn.type='button';btn.dataset.sound='card';
    // Usar la misma tarjeta nativa del HTML, sin sustituirla por un diseño dorado.
    btn.className='dfc-lab-gift-preview019 dfc-z31-gift-choice dfc-z32-native-announcement';
    btn.style.cssText='position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:min(88vw,440px);height:min(72vh,520px);min-height:260px;max-height:540px;padding:24px 18px;cursor:pointer;touch-action:manipulation;transform-origin:center;box-sizing:border-box;background-size:cover;background-position:center;';
    // La clase original conserva sus ilustraciones, bordes, colores y efectos.
    const nativeCard=document.querySelector('#dfcLabGiftUser008 .dfc-lab-gift-preview019');
    const nativeStyle=nativeCard?getComputedStyle(nativeCard):null;
    if(nativeStyle){
      for(const prop of ['background-image','background-color','border','border-radius','box-shadow','color']){
        const value=nativeStyle.getPropertyValue(prop);
        if(value)btn.style.setProperty(prop,value);
      }
    }
    const top=document.createElement('div');top.textContent='🎁 NUEVA TARJETA FLASHCOIN';
    top.style.cssText='font:900 clamp(17px,4vw,25px) system-ui;text-align:center;letter-spacing:.4px;';
    // No dibujar una moneda ajena: conservar la ilustración FlashCoin nativa de CSS.
    const coin=document.createElement('div');coin.className='dfc-z32-native-card-art';
    coin.style.cssText='flex:1;min-height:30px;width:100%;pointer-events:none;';
    const amount=document.createElement('strong');amount.textContent=money(card.amount);
    amount.style.cssText='font:900 clamp(36px,10vw,65px) system-ui;color:#fff;text-align:center;';
    const instruction=document.createElement('span');instruction.textContent='TOCA LA TARJETA PARA GUARDARLA';
    instruction.style.cssText='font:800 clamp(12px,3.2vw,18px) system-ui;text-align:center;';
    const sub=document.createElement('span');sub.textContent='Se añadirá a tus tarjetas FlashCoin pendientes';
    sub.style.cssText='font-size:clamp(11px,2.5vw,14px);text-align:center;';
    btn.append(top,coin,amount,instruction,sub);overlay.append(btn);document.body.append(overlay);
    const previouslyFocused=document.activeElement;
    btn.focus({preventScroll:true});
    btn.addEventListener('click',async()=>{
      if(btn.disabled)return;
      btn.disabled=true;
      window.dfcZ32Audio?.play('flashcoin');
      document.dispatchEvent(new CustomEvent('dfc:flashcoin:explode',{detail:{source:'z32-gift-announcement'}}));
      const animation=btn.animate?.([{transform:'scale(1)',opacity:1},{transform:'scale(1.12)',opacity:1,offset:.3},{transform:'scale(.15) translateY(-100px)',opacity:0}],{duration:550,easing:'ease-in',fill:'forwards'});
      if(animation)await animation.finished.catch(()=>{});
      markSeen(lastUser,card.gift_id);
      overlay.remove();
      presenting=false;current=null;
      document.dispatchEvent(new CustomEvent('dfc:z32:gift-stored',{detail:{gift_id:card.gift_id,amount:card.amount}}));
      if(previouslyFocused?.isConnected)previouslyFocused.focus?.({preventScroll:true});
      if(!document.hidden && queue.length)draw(queue.shift());
    },{once:true});
  }
  async function refresh(){
    if(busy || document.hidden)return;
    const db=client();if(!db)return;
    busy=true;
    try{
      const auth=await db.auth.getSession();
      const uid=auth?.data?.session?.user?.id;
      if(!uid){lastUser='';known.clear();queue=[];return;}
      if(uid!==lastUser){lastUser=uid;readSeen(uid);queue=[];}
      const {data,error}=await db.rpc('dfc_lab_gift_pending_v008');
      if(error)throw error;
      if(!Array.isArray(data))return;
      const pending=data.filter(x=>x?.gift_id && Number(x.amount)>0&&!known.has(String(x.gift_id)));
      const nowIds=new Set(pending.map(x=>String(x.gift_id)));
      queue=queue.filter(x=>nowIds.has(String(x.gift_id)));
      if(current && !nowIds.has(String(current.gift_id))) {
        document.getElementById('dfcZ32GiftFullScreen')?.remove();
        current=null;presenting=false;
      }
      const queuedIds=new Set(queue.map(x=>String(x.gift_id)));
      if(current)queuedIds.add(String(current.gift_id));
      pending.forEach(x=>{if(!queuedIds.has(String(x.gift_id))){queue.push(x);queuedIds.add(String(x.gift_id));}});
      if(!presenting && queue.length)draw(queue.shift());
    }catch(e){console.warn('[DFC Z32 anuncio tarjetas]',String(e?.message||e));}
    finally{busy=false;}
  }
  window.dfcZ32UniversalGiftAnnouncement=Object.freeze({refresh:()=>void refresh()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
  window.addEventListener('pageshow',()=>void refresh());
  document.addEventListener('dfc:z32:gift-sent',()=>void refresh());
  document.addEventListener('dfc:flashcoin:received',()=>void refresh());
  pollTimer=setInterval(()=>void refresh(),6000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void refresh(),{once:true});
  else void refresh();
})();


/* DFC Z32 — sincronizar fichas visibles y ocultar piezas anticipadas */
(function dfcZ32DealRackVisibility(){
  'use strict';
  if(window.dfcZ32DealRackVisibility)return;
  let expected=null, activeHand='', generation=0;
  const selectors='#dominoHand .hand-piece';
  function sync(gen){
    if(gen!==generation)return;
    const pieces=Array.from(document.querySelectorAll(selectors));
    pieces.forEach((piece,index)=>{
      if(expected!==null && index>=expected){
        if(piece.dataset.dfcZ32RackSuppressed!=='1'){
          piece.dataset.dfcZ32RackSuppressed='1';
          piece.dataset.dfcZ32RackOriginalVisibility=piece.style.visibility||'';
        }
        piece.style.setProperty('visibility','hidden','important');
        piece.style.setProperty('pointer-events','none','important');
      }else if(piece.dataset.dfcZ32RackSuppressed==='1'){
        piece.style.visibility=piece.dataset.dfcZ32RackOriginalVisibility||'';
        piece.style.removeProperty('pointer-events');
        delete piece.dataset.dfcZ32RackSuppressed;
        delete piece.dataset.dfcZ32RackOriginalVisibility;
      }
    });
  }
  function apply(st,shown){
    const h=st?.hand, id=String(h?.id||''), status=String(h?.status||'');
    if(id!==activeHand){activeHand=id;expected=null;}
    const isEmptyOrDealing=!!id&&(status==='shuffling'||
      (status==='playing'&&document.getElementById('dominoTablePanel')?.classList.contains('dfc-z32-progressive-deal')));
    expected=isEmptyOrDealing?(status==='shuffling'?0:shown.length):null;
    const gen=++generation;
    // Sincronizar en el mismo ciclo de render; no esperar a que termine el reparto.
    sync(gen);
    requestAnimationFrame(()=>sync(gen));
  }
  function install(){
    const current=window.dfc11VisibleTiles;
    if(typeof current!=='function'||current.__dfcZ32RackGuard)return;
    const guarded=function(st,tiles){
      const result=current.apply(this,arguments);
      try{apply(st,Array.isArray(result)?result:[]);}catch(err){console.warn('[DFC Z32 reparto]',err);}
      return result;
    };
    guarded.__dfcZ32RackGuard=true;
    window.dfc11VisibleTiles=guarded;
  }
  window.dfcZ32DealRackVisibility=Object.freeze({sync:()=>sync(generation)});
  install();
  setInterval(install,1000);
})();

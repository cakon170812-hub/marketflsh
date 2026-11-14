
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
    overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;padding:12px;background:radial-gradient(circle at center,#102548ed,#010712f5);overflow:auto;';
    const content=document.createElement('div');content.className='dfc-z32-card-announcement';
    const btn=document.createElement('button');
    btn.type='button';btn.dataset.sound='card';
    btn.className='dfc-z32-native-announcement';
    const top=document.createElement('strong');top.className='dfc-z32-card-announcement-title';
    top.textContent='Nueva tarjeta FlashCoin';
    const amount=document.createElement('strong');amount.className='dfc-z32-card-amount';
    amount.textContent=money(card.amount);
    const help=document.createElement('p');help.className='dfc-z32-card-announcement-help';
    help.textContent='Toca la tarjeta para guardarla';
    const dates=window.dfcZ32GiftDates?.render(card);
    btn.setAttribute('aria-label',dates
      ?'Guardar tarjeta de '+amount.textContent+'. Emisión: '+dates.issued.textContent+'. Vencimiento: '+dates.expires.textContent
      :'Guardar tarjeta de '+amount.textContent);
    if(dates)btn.append(dates.issued);
    btn.append(top,document.createElement('span'),amount);
    if(dates)btn.append(dates.expires);
    content.append(btn,help);overlay.append(content);document.body.append(overlay);
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
      const {data,error}=await db.rpc('dfc_z32_gift_pending_dates');
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
    expected=isEmptyOrDealing?shown.length:null;
    const gen=++generation;
    // Sincronizar en el mismo ciclo de render; no esperar a que termine el reparto.
    sync(gen);
    requestAnimationFrame(()=>sync(gen));
  }
  function install(){
    const current=window.dfc11VisibleTiles;
    if(typeof current!=='function'||current.__dfcZ32RackGuard)return;
    const guarded=function(st,tiles){
      const original=current.apply(this,arguments);
      const result=window.dfcZ32Z31Arrival?.tiles(st,tiles,original) ?? original;
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


/* Z32 — Ventana independiente para revisar y configurar caducidad. */
(function dfcZ32ExpiryAdminControls(){
 'use strict';
 if(window.dfcZ32ExpiryAdminControls)return;
 const $=id=>document.getElementById(id);
 const getDb=()=>[window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase]
   .find(x=>x&&typeof x.rpc==='function'&&typeof x.auth?.getSession==='function');
 async function rpc(name,args){
   const db=getDb();if(!db)throw Error('No hay conexión con Supabase');
   const {data,error}=await db.rpc(name,args||{});
   if(error)throw Error(error.message||String(error));
   return data;
 }
 function create(){
   if($('dfcZ32ExpiryModal'))return;
   const modal=document.createElement('div');
   modal.id='dfcZ32ExpiryModal';
   modal.hidden=true;
   modal.setAttribute('role','dialog');
   modal.setAttribute('aria-modal','true');
   modal.setAttribute('aria-label','Caducidad de tarjetas FlashCoin');
   modal.style.cssText='position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;background:#020b19e9;padding:clamp(5px,2vw,12px);box-sizing:border-box;';
   const box=document.createElement('section');
   box.style.cssText='width:min(96vw,550px);max-height:calc(100dvh - 14px);overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;background:linear-gradient(145deg,#092b50,#050e26);border:1px solid #5bbdff;border-radius:13px;color:#f3f9ff;padding:clamp(9px,2vw,15px);box-sizing:border-box;font:13px system-ui;display:grid;gap:9px;';
   const header=document.createElement('div');
   header.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;';
   const title=document.createElement('strong');title.textContent='⏳ Caducidad de tarjetas FlashCoin';
   const close=document.createElement('button');close.type='button';close.textContent='✕ Cerrar';
   const desc=document.createElement('p');
   desc.textContent='Plazo para todas las tarjetas pendientes, existentes y nuevas. Las reclamadas no cambian.';
   desc.style.cssText='margin:0;color:#cae7fb;font-size:12px;';
   const line=document.createElement('div');
   line.style.cssText='display:flex;gap:7px;flex-wrap:wrap;align-items:center;';
   const select=document.createElement('select');select.id='dfcZ32ExpiryDays';
   select.setAttribute('aria-label','Plazo de caducidad de las tarjetas');
   select.style.cssText='flex:1;min-width:110px;padding:7px;color:#fff;background:#103657;border:1px solid #6caad4;border-radius:8px;font-size:13px;';
   for(const [v,t] of [['','Sin caducidad'],['1','1 día'],['3','3 días'],['7','7 días'],['15','15 días'],['30','30 días']]){
     const option=document.createElement('option');option.value=v;option.textContent=t;select.append(option);
   }
   const save=document.createElement('button');save.type='button';save.textContent='Guardar caducidad';
   const review=document.createElement('button');review.type='button';review.textContent='Revisar vencidas';
   for(const b of [close,save,review]){
     b.style.cssText='padding:8px 10px;border:1px solid #65bfff;background:#0c3c66;color:white;border-radius:8px;cursor:pointer;font:700 12px system-ui;';
   }
   const status=document.createElement('p');status.id='dfcZ32ExpiryStatus';status.setAttribute('role','status');
   status.style.cssText='margin:0;font-size:12px;color:#e0effb;overflow-wrap:anywhere;';
   const caution=document.createElement('p');
   caution.textContent='La devolución monetaria automática continúa pendiente de revisión del origen de los fondos.';
   caution.style.cssText='margin:0;color:#ffd59a;font-size:11px;';
   header.append(title,close);line.append(select,save,review);
   box.append(header,desc,line,status,caution);modal.append(box);document.body.append(modal);
   const style=document.createElement('style');style.textContent='#dfcZ32ExpiryModal[hidden]{display:none!important;}';
   document.head.append(style);
   function dismiss(){modal.hidden=true;}
   close.addEventListener('click',dismiss);
   modal.addEventListener('click',e=>{if(e.target===modal)dismiss();});
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)dismiss();});
   async function load(){
     try{
       const v=await rpc('dfc_z32_admin_expiry_status');
       select.value=v.expiry_days==null?'':String(v.expiry_days);
       status.textContent='Tarjetas: '+v.total_cards+' · Vencidas sin reclamar: '+v.expired_unclaimed+' · Devoluciones registradas: '+v.refunds_recorded+'.';
     }catch(e){status.textContent='No se pudo consultar: '+e.message;}
   }
   save.addEventListener('click',async()=>{
     save.disabled=true;
     try{
       const result=await rpc('dfc_z32_admin_expiry_config',{p_days:select.value===''?null:Number(select.value)});
       status.textContent='Guardado para '+(result.updated_pending_cards??0)+' tarjetas pendientes. Las nuevas usarán el mismo plazo.';
     }catch(e){status.textContent='No se pudo guardar: '+e.message;}
     finally{save.disabled=false;}
   });
   review.addEventListener('click',()=>void load());
   window.dfcZ32ExpiryOpen=()=>{
     const leader=$('leaderPanel');
     if(!leader||leader.hidden||leader.classList.contains('hidden')||!leader.getClientRects().length)return;
     modal.hidden=false;void load();
   };
 }
 window.dfcZ32ExpiryAdminControls=Object.freeze({refresh:create});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});else create();
 let checks=0;const timer=setInterval(()=>{create();if($('dfcZ32ExpiryModal')||++checks>120)clearInterval(timer);},1000);
})();


/* Acceso administrativo a la revisión de caducidad. */
(function(){
 'use strict';
 function addReviewButton(){
   const panel=document.getElementById('leaderPanel');
   const host=panel?.querySelector('.mf-admin-grid')||panel?.querySelector('.panel');
   if(!host||document.getElementById('dfcZ32ReviewExpiredBtn'))return;
   const btn=document.createElement('button');
   btn.id='dfcZ32ReviewExpiredBtn';btn.className='mf-admin-card';btn.type='button';
   btn.textContent='⏳ Revisar caducidad de tarjetas';
   btn.addEventListener('click',()=>{window.dfcZ32ExpiryAdminControls?.refresh();window.dfcZ32ExpiryOpen?.();});
   host.append(btn);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addReviewButton,{once:true});
 else addReviewButton();
})();

/* Z32: scroll táctil para selección y fichas visibles durante entrega. */
(function(){
 'use strict';
 if(window.dfcZ32CompactSelectionAndDeal)return;
 const css=document.createElement('style');
 css.id='dfcZ32CompactSelectionAndDealStyle';
 css.textContent="\n#dfcZ31GiftsModal{overscroll-behavior:contain!important;touch-action:pan-y!important}\n#dfcZ31GiftsModal .dfc-z31-box{min-height:0!important;max-height:calc(100dvh - 8px)!important;overflow:hidden!important}\n#dfcZ31GiftsModal .dfc-z31-body{min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}\n#dfcZ31GiftsModal #dfcZ31Results{max-height:none!important;overflow:visible!important;touch-action:pan-y!important}\n#dfcZ31GiftsModal #dfcZ31Results .dfc-z31-user{min-height:34px!important;padding:5px 4px!important;cursor:pointer!important;touch-action:manipulation!important}\n#dfcZ31GiftsModal #dfcZ31Results .dfc-z31-user input{width:19px!important;height:19px!important;flex:none!important}\n#dfcZ31GiftsModal #dfcZ32ExpiryControls{margin:0!important;padding:4px 2px!important;gap:4px!important;border:0!important}\n#dfcZ31GiftsModal #dfcZ32ExpiryControls p{font-size:11px!important;line-height:1.25!important;margin:0!important}\n#dfcZ31GiftsModal #dfcZ32ExpiryDays{min-height:30px!important;font-size:12px!important;padding:4px!important}\n#dfcZ31GiftsModal .dfc-z31-head{padding:4px 8px!important}\n#dfcZ31GiftsModal #dfcZ31SearchArea,#dfcZ31GiftsModal .dfc-z31-send{padding:4px 7px!important}\n#dfcZ31GiftsModal #dfcZ31SearchArea input,#dfcZ31GiftsModal .dfc-z31-send input{min-height:34px!important;max-height:38px!important}\n#dfcZ31GiftsModal #dfcZ31Send{min-height:34px!important;white-space:nowrap}\n@media (orientation:landscape) and (max-height:520px){\n #dfcZ31GiftsModal .dfc-z31-box{font-size:12px!important}\n #dfcZ31GiftsModal .dfc-z31-body{padding:2px 7px!important}\n #dfcZ31GiftsModal .dfc-z31-history{font-size:10px!important}\n #dfcZ31GiftsModal .dfc-z31-head{padding:2px 7px!important}\n}\n#dominoTablePanel.dfc-z32-progressive-deal #dominoHand,\n#dominoTablePanel.dfc-z32-progressive-deal #dominoStage #dominoHand,\n#dominoTablePanel.dfc012a-dealing #dominoHand,\n#dominoTablePanel.dfc012c-locked.dfc-z32-progressive-deal #dominoHand{display:flex!important;visibility:visible!important;opacity:1!important;z-index:22005!important}\n#dominoTablePanel.dfc-z32-progressive-deal #dominoHand .hand-piece,\n#dominoTablePanel.dfc-z32-progressive-deal #dominoHand .domino-piece{visibility:visible!important;opacity:1!important;animation:none!important}\n";
 function install(){
  if(!css.isConnected)document.head.append(css);
  const results=document.getElementById('dfcZ31Results'), modal=document.getElementById('dfcZ31GiftsModal');
  if(!results||!modal||results.dataset.dfcZ32TouchScroll)return;
  results.dataset.dfcZ32TouchScroll='1';
  new MutationObserver(()=>{
   if(modal.hidden||!results.querySelector('.dfc-z31-user'))return;
   requestAnimationFrame(()=>{
    const body=results.closest('.dfc-z31-body');
    if(body&&!modal.hidden)body.scrollTop=0;
   });
  }).observe(results,{childList:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 let checks=0;const interval=setInterval(()=>{install();if(++checks>=180)clearInterval(interval);},1000);
 window.dfcZ32CompactSelectionAndDeal=Object.freeze({install});
})();


/* Z32 — Reparto Z31: revelar cada ficha verdadera al llegar al jugador.
   No duplicar fichas ni cambiar la asignación de Supabase. */
(function dfcZ32Z31Arrival(){
 'use strict';
 if(window.dfcZ32Z31Arrival)return;
 let activeHand='',flyCount=0,visible=0,previousTiles=[],observedStage=null,observer=null;
 const seen=new WeakSet();
 const panel=()=>document.getElementById('dominoTablePanel');
 function state(){
   try{return typeof dominoState!=='undefined'&&dominoState ? dominoState : window.dominoState;}
   catch(_){return window.dominoState;}
 }
 function participants(st){
   return Math.max(2,Math.min(4,(st?.seats||[]).filter(s=>s?.user_id&&s.state!=='empty').length||2));
 }
 function reset(id){
   if(id===activeHand)return;
   activeHand=id;flyCount=0;visible=0;previousTiles=[];
   panel()?.classList.remove('dfc-z32-progressive-deal');
 }
 function tiles(st,actual,original){
   const h=st?.hand,id=String(h?.id||''),phase=String(h?.status||'');
   if(!id){reset('');return Array.isArray(original)?original:[];}
   if(id!==activeHand)reset(id);
   const real=Array.isArray(actual)?actual:[];
   if(phase==='shuffling'){
     if(real.length)previousTiles=real.slice();
     const approved=real.length?real:previousTiles;
     const n=Math.min(visible,approved.length);
     panel()?.classList.toggle('dfc-z32-progressive-deal',n>0);
     return approved.slice(0,n);
   }
   if(phase==='playing'){
     flyCount=0;visible=0;previousTiles=[];
     panel()?.classList.remove('dfc-z32-progressive-deal');
     return real;
   }
   return Array.isArray(original)?original:real;
 }
 function arrive(){
   const st=state(),h=st?.hand;
   if(!h?.id||String(h.status)!=='shuffling')return;
   const id=String(h.id);
   if(id!==activeHand)reset(id);
   const i=flyCount++;
   if(i%participants(st)!==0||visible>=7)return;
   visible++;
   panel()?.classList.add('dfc-z32-progressive-deal');
   if(typeof renderDominoState==='function' && !((typeof dominoDragState!=='undefined')&&dominoDragState?.active)){
     try{renderDominoState(st);}catch(e){console.warn('[DFC Z32 reparto por entrega]',e);}
   }
 }
 function connect(){
   const stage=document.getElementById('dominoStage');
   if(!stage||stage===observedStage)return;
   observer?.disconnect();observedStage=stage;
   observer=new MutationObserver(records=>{
     for(const m of records){
       if(m.type!=='attributes'||m.attributeName!=='class')continue;
       const el=m.target;
       if(!el.classList?.contains('mix-tile')||!el.classList.contains('dfc012m-flying')||seen.has(el))continue;
       seen.add(el);arrive();
     }
   });
   observer.observe(stage,{subtree:true,attributes:true,attributeFilter:['class']});
 }
 const css=document.createElement('style');css.id='dfcZ32Z31ArrivalStyle';
 css.textContent="\n#dominoTablePanel.dfc-z32-progressive-deal #dominoHand,\n#dominoTablePanel.dfc-z32-progressive-deal.dfc011w-clear #dominoHand,\n#dominoTablePanel.dfc-z32-progressive-deal.dfc012a-dealing #dominoHand,\n#dominoTablePanel.dfc-z32-progressive-deal.dfc012c-locked #dominoHand {\n display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:none!important;\n}\n#dominoTablePanel.dfc-z32-progressive-deal #dominoHand .hand-piece {\n visibility:visible!important;opacity:1!important;animation:none!important;transition:none!important;\n}";
 function init(){if(!css.isConnected)document.head.append(css);connect();}
 window.dfcZ32Z31Arrival=Object.freeze({tiles,get visible(){return visible;}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 let checks=0;const boot=setInterval(()=>{connect();if(++checks>=180)clearInterval(boot);},1000);
})();


/* Z32 — Botón PEGAR ID sin abrir teclado (admin FlashCoin). */
(function dfcZ32PasteRecipientId(){
 'use strict';
 if(window.dfcZ32PasteRecipientId)return;
 const modalId='dfcZ31GiftsModal';
 function attach(){
  const modal=document.getElementById(modalId);
  if(!modal)return;
  const area=modal.querySelector('#dfcZ31SearchArea');
  if(!area)return;
  const field=area.querySelector('input:not([type="checkbox"]):not([type="radio"])');
  if(!field||area.querySelector('#dfcZ32PasteId'))return;
  const button=document.createElement('button');
  button.id='dfcZ32PasteId';
  button.type='button';
  button.textContent='📋 PEGAR ID';
  button.setAttribute('aria-label','Pegar ID del usuario desde el portapapeles');
  button.style.cssText='flex:none;min-height:34px;padding:5px 9px;border:1px solid #8ac7ff;border-radius:8px;background:#13518b;color:white;font:700 12px system-ui;touch-action:manipulation;white-space:nowrap';
  button.addEventListener('click',async()=>{
   // El botón evita enfocar el input, para no abrir el teclado móvil.
   try{
    if(!navigator.clipboard?.readText)throw new Error('Portapapeles no disponible');
    const value=(await navigator.clipboard.readText()).trim();
    if(!value){alert('El portapapeles está vacío. Copia primero el ID.');return;}
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter)setter.call(field,value);else field.value=value;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
   }catch(e){
    alert('No se pudo leer el portapapeles. Autoriza el acceso al pegar o usa el campo de ID. '+String(e?.message||''));
   }
  });
  const wrapper=document.createElement('div');
  wrapper.style.cssText='display:flex;align-items:center;gap:5px;max-width:100%;min-width:0';
  field.parentNode.insertBefore(wrapper,field);
  wrapper.append(field,button);
  field.style.minWidth='0';
  field.style.flex='1 1 auto';
 }
 const observer=new MutationObserver(attach);
 function start(){attach();observer.observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.dfcZ32PasteRecipientId=Object.freeze({attach});
})();


/* Z32 — Tarifa de tarjeta por Dominó en administración. */
(function dfcZ32DominoCardTariffAdmin(){
 'use strict';
 if(window.dfcZ32DominoCardTariffAdmin)return;
 const id='dfcZ32DominoTariffSection';
 const client=()=>[window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase].find(x=>x&&typeof x.rpc==='function'&&x.auth?.getSession);
 async function call(amount){
  const db=client();if(!db)throw Error('Supabase no disponible');
  const {data,error}=await db.rpc('dfc_z32_admin_domino_card_tariff',{p_domino_fc:amount});
  if(error)throw Error(error.message||String(error));
  if(!data?.ok)throw Error('Configuración no confirmada');
  return data;
 }
 function attach(){
  const modal=document.getElementById('dfcZ31GiftsModal');
  if(!modal||document.getElementById(id))return;
  const target=modal.querySelector('.dfc-z31-body');
  if(!target)return;
  const section=document.createElement('section');
  section.id=id;
  section.style.cssText='border-top:1px solid #407aa2;margin:8px 0;padding:7px 2px;';
  const heading=document.createElement('button');
  heading.type='button';heading.textContent='⚙ Tarifa por Dominó (tarjeta FlashCoin)';
  heading.setAttribute('aria-expanded','false');
  heading.style.cssText='background:#103f6a;color:#fff;border:1px solid #68bbef;border-radius:7px;padding:6px 9px;font:700 12px system-ui;max-width:100%;';
  const body=document.createElement('div');body.hidden=true;
  body.style.cssText='display:none;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px;';
  const caption=document.createElement('label');caption.textContent='FC por Dominó';caption.htmlFor='dfcZ32DominoTariffValue';
  const input=document.createElement('input');
  input.id='dfcZ32DominoTariffValue';input.type='number';input.min='0';input.max='1000000';input.step='0.001';input.inputMode='decimal';input.placeholder='0.000';
  input.style.cssText='width:100px;max-width:33vw;min-height:34px;background:white;color:#162b43;padding:5px;border-radius:6px;';
  const save=document.createElement('button');save.type='button';save.textContent='Guardar tarifa';
  save.style.cssText='background:#1475a2;color:white;border-radius:6px;padding:7px 10px;min-height:34px;';
  const status=document.createElement('span');status.setAttribute('role','status');
  status.style.cssText='font:11px system-ui;color:#d0eeff;flex-basis:100%;';
  const refresh=async()=>{
   status.textContent='Consultando tarifa…';
   try{const value=await call(null);input.value=Number(value.domino_fc||0).toFixed(3);status.textContent='Tarifa actual: '+input.value+' FC · Capicúa: 10% del bote.';}
   catch(e){status.textContent='No se pudo consultar: '+String(e?.message||e);}
  };
  heading.addEventListener('click',()=>{
   body.hidden=!body.hidden;body.style.display=body.hidden?'none':'flex';heading.setAttribute('aria-expanded',String(!body.hidden));
   if(!body.hidden)void refresh();
  });
  save.addEventListener('click',async()=>{
   const raw=input.value.trim(),value=Number(raw);
   if(!raw||!Number.isFinite(value)||value<0||value>1000000||Math.abs(value*1000-Math.round(value*1000))>1e-6){
    status.textContent='Introduce un importe válido con hasta tres decimales.';return;
   }
   save.disabled=true;status.textContent='Guardando en Supabase…';
   try{const result=await call(value);input.value=Number(result.domino_fc).toFixed(3);status.textContent='Tarifa guardada: '+input.value+' FC.';}
   catch(e){status.textContent='Error: '+String(e?.message||e);}
   finally{save.disabled=false;}
  });
  body.append(caption,input,save,status);section.append(heading,body);target.prepend(section);
 }
 const observer=new MutationObserver(attach);
 function start(){attach();observer.observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.dfcZ32DominoCardTariffAdmin=Object.freeze({attach});
})();


/* Z32: Administrador - premios independientes Domino, Tranque y Capicua */
(function dfcZ32RewardAdmin(){
 'use strict';
 if(window.dfcZ32RewardAdmin)return;
 const byId=id=>document.getElementById(id);
 const db=()=>[window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase].find(x=>x&&typeof x.rpc==='function');
 async function rpc(args){
  const s=db();if(!s)throw Error('Sin conexión a Supabase');
  const {data,error}=await s.rpc('dfc_z32_admin_reward_settings',args);
  if(error)throw Error(error.message);
  if(!data?.ok)throw Error('Configuración no confirmada');
  return data;
 }
 function create(){
  if(byId('dfcZ32RewardModal'))return;
  const overlay=document.createElement('div');overlay.id='dfcZ32RewardModal';overlay.hidden=true;
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483501;background:#030c20ed;display:none;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;';
  const panel=document.createElement('section');
  panel.style.cssText='max-width:520px;width:100%;max-height:95dvh;overflow:auto;border:1px solid #49b9ff;border-radius:14px;background:#092749;color:white;padding:14px;font:13px system-ui;box-sizing:border-box;';
  const heading=document.createElement('h3');heading.textContent='🎁 Premios FlashCoin por jugadas';heading.style.cssText='font:700 17px system-ui;margin:0 0 10px;';
  panel.append(heading);
  const controls={};
  for(const [key,label,desc] of [
   ['domino','Dominó','Tarjeta de importe fijo por terminar las fichas'],
   ['tranque','Tranque','Tarjeta de importe fijo por ganar el tranque'],
   ['capicua','Capicúa','Tarjeta del 10 % del bote']]){
    const row=document.createElement('label');
    row.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid #356389;';
    const input=document.createElement('input');input.type='checkbox';input.id='dfcReward_'+key;input.style.cssText='width:22px;height:22px;accent-color:#17baff;';
    const labelBox=document.createElement('span');labelBox.style.cssText='flex:1;';
    const strong=document.createElement('strong');strong.textContent=label;
    const small=document.createElement('small');small.textContent=desc;small.style.cssText='display:block;color:#bfe5ff;margin-top:3px;';
    labelBox.append(strong,small);row.append(input,labelBox);panel.append(row);controls[key]=input;
    if(key!=='capicua'){
     const amt=document.createElement('input');amt.type='number';amt.min='0';amt.max='1000000';amt.step='0.001';amt.placeholder='Cantidad FC';amt.inputMode='decimal';
     amt.id='dfcRewardAmount_'+key;amt.style.cssText='width:100%;box-sizing:border-box;margin:5px 0 9px;padding:9px;border-radius:6px;color:#12263a;background:white;';
     panel.append(amt);controls[key+'Amount']=amt;
    }
  }
  const status=document.createElement('p');status.style.cssText='font-size:12px;color:#c7ecff;min-height:17px;';
  status.setAttribute('role','status');panel.append(status);
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;';
  const close=document.createElement('button');close.textContent='Cerrar';close.type='button';close.style.cssText='flex:1;padding:10px;border-radius:8px;background:#263e5c;color:white;';
  const save=document.createElement('button');save.textContent='Guardar configuración';save.type='button';save.style.cssText='flex:2;padding:10px;border-radius:8px;background:#087ed1;color:white;font-weight:bold;';
  actions.append(close,save);panel.append(actions);overlay.append(panel);document.body.append(overlay);
  function hide(){overlay.hidden=true;overlay.style.display='none';}
  close.addEventListener('click',hide);
  async function open(){
   overlay.hidden=false;overlay.style.display='flex';status.textContent='Cargando configuración actual…';
   try{
    const v=await rpc({});
    controls.domino.checked=!!v.domino_enabled;controls.tranque.checked=!!v.tranque_enabled;controls.capicua.checked=!!v.capicua_enabled;
    controls.dominoAmount.value=Number(v.domino_fc||0).toFixed(3);controls.tranqueAmount.value=Number(v.tranque_fc||0).toFixed(3);
    status.textContent='Selecciona una, dos o las tres recompensas.';
   }catch(e){status.textContent='Error al consultar: '+String(e.message||e);}
  }
  save.addEventListener('click',async()=>{
   const d=Number(controls.dominoAmount.value),t=Number(controls.tranqueAmount.value);
   if(![d,t].every(x=>Number.isFinite(x)&&x>=0&&x<=1000000&&Math.abs(x*1000-Math.round(x*1000))<0.00001)){
    status.textContent='Importes inválidos (máximo tres decimales).';return;
   }
   save.disabled=true;status.textContent='Guardando en Supabase…';
   try{
    await rpc({p_domino_enabled:controls.domino.checked,p_tranque_enabled:controls.tranque.checked,
      p_capicua_enabled:controls.capicua.checked,p_domino_fc:d,p_tranque_fc:t});
    status.textContent='Configuración guardada correctamente.';
   }catch(e){status.textContent='No se guardó: '+String(e.message||e);}
   finally{save.disabled=false;}
  });
  return open;
 }
 let opener;
 function attach(){
  const host=byId('leaderPanel')?.querySelector('.mf-admin-grid')||byId('leaderPanel')?.querySelector('.panel');
  if(!host||byId('dfcZ32RewardAdminBtn'))return;
  const btn=document.createElement('button');btn.id='dfcZ32RewardAdminBtn';btn.className='mf-admin-card';btn.type='button';
  btn.textContent='🎁 CONFIGURAR TARJETAS: Dominó · Tranque · Capicúa';
  btn.style.cssText='display:block;visibility:visible;min-height:42px;white-space:normal;font-weight:800;border:2px solid #35bbff;';
  btn.addEventListener('click',()=>{if(!opener)opener=create();if(opener)void opener();});
  host.prepend(btn);
 }
 function init(){attach();new MutationObserver(attach).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.dfcZ32RewardAdmin={open:()=>{if(!opener)opener=create();if(opener)return opener();}};
})();

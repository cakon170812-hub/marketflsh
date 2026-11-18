
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



/* Z36 — Editor integrado de mesas, sin modificar el motor de partidas */
(function dfcZ36UnifiedEditor(){
 'use strict';
 if(window.dfcZ36UnifiedEditor)return;
 const style=document.createElement('style');style.id='dfc-z36-unified-style';
 style.textContent=`
 #dfcZ36UnifiedEditor{padding:15px;border:1.5px solid #d7b267;border-radius:20px;background:linear-gradient(145deg,#0d1e45,#251648);color:#fff;margin:12px 0}
 #dfcZ36UnifiedEditor .dfc-z36-logo{width:100%;height:100px;object-fit:cover;border-radius:12px;border:1px solid #c7a65c;background:var(--dfc-z26-official-wallpaper) center/cover no-repeat}
 #dfcZ36UnifiedEditor h3{text-align:center;color:#ffe5a3;margin:10px 0 6px}
 #dfcZ36UnifiedEditor .dfc-z36-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}
 #dfcZ36UnifiedEditor button{font:inherit;color:white;border:1px solid #a9b8e2;border-radius:12px;padding:12px 6px;min-height:72px;background:linear-gradient(120deg,#155d8c,#17274f);cursor:pointer}
 #dfcZ36UnifiedEditor button[data-mode="paid_pass"]{background:linear-gradient(120deg,#925c1c,#44311f)}
 #dfcZ36UnifiedEditor button[disabled]{background:linear-gradient(120deg,#50546c,#282d42);opacity:.78;cursor:not-allowed}
 #dfcZ36UnifiedEditor button[aria-pressed="true"]{border:3px solid #ffdd72;box-shadow:0 0 12px #f3c45166}
 #dfcZ36UnifiedEditor small{display:block;color:#e9e9f2;font-size:11px;margin-top:3px}
 #dfcZ36UnifiedEditor .dfc-z36-note{font-size:12px;margin:12px 0 0}
 #dfcZ36UnifiedEditor .dfc-z36-rooms{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
 #dfcZ36UnifiedEditor .dfc-z36-rooms button{min-height:38px;padding:7px 10px}
 #mfAdmin16_domino #dominoAdminConfigs .dfc012n-mode-section{display:none!important}
 #dfc-z20-admin-modal #dfc-z20-target,#dfc-z20-admin-modal #dfc-z20-capicua,#dfc-z20-admin-modal #dfc-z20-round,#dfc-z20-admin-modal #dfc-z20-seats{pointer-events:none}
 #dfcZ36ModesButton{display:none!important}
 @media(max-width:380px){#dfcZ36UnifiedEditor .dfc-z36-grid{gap:6px}#dfcZ36UnifiedEditor button{font-size:12px;padding:8px 4px}}
 `;
 function mount(){
  if(!document.getElementById(style.id))document.head.append(style);
  const target=document.getElementById('dominoAdminConfigs');
  if(!target||!target.parentElement)return;
  let root=document.getElementById('dfcZ36UnifiedEditor');
  if(!root){
   root=document.createElement('div');root.id='dfcZ36UnifiedEditor';
   root.innerHTML='<div class="dfc-z36-logo" aria-label="Imagen de DOMINÓ FLASH COIN"></div><h3>🁫 DOMINÓ FLASH COIN · EDITAR MESAS</h3><div class="dfc-z36-grid"><button type="button" data-mode="normal">🁫 POR GANE<small>Editar reglas y tarifas</small></button><button type="button" data-z37-admin-tab="points">🎯 POR PUNTOS<small>Editar borradores</small></button><button type="button" data-mode="paid_pass">🎲 PINTINTÍN<small>Editar las mesas existentes</small></button><button type="button" data-z37-admin-tab="tournaments">🏆 TORNEO<small>Editar borradores</small></button></div><div class="dfc-z36-rooms"></div><p class="dfc-z36-note">Selecciona una modalidad para ver y configurar sus mesas.</p>';
   target.before(root);
   root.append(target);
   root.querySelectorAll('button[data-mode]:not([disabled])').forEach(btn=>btn.addEventListener('click',()=>{root.dataset.selected=btn.dataset.mode;root.dataset.creating='';render()}));
   root.querySelectorAll('[data-z37-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    if(window.dfcZ37Admin)void window.dfcZ37Admin.open(btn.dataset.z37AdminTab);
    else window.alert('El editor Z37 todavía está cargando. Vuelve a tocar el botón.');
   }));
   const form=document.createElement('form');
   form.className='dfc-z36-create';
   form.hidden=true;
   form.innerHTML='<h4>Crear mesa</h4><label>Nombre <input class="field" name="name" maxlength="80" required></label><label>Entrada mínima (FC) <input class="field" name="minEntry" type="number" min="0.001" max="999999999.999" step="0.001" required></label><button type="submit">Guardar mesa desactivada</button><p role="status"></p>';
   root.querySelector('.dfc-z36-rooms').after(form);
   form.addEventListener('submit',async event=>{
    event.preventDefault();
    const mode=root.dataset.selected;
    const submit=form.querySelector('button[type="submit"]');
    const status=form.querySelector('[role="status"]');
    if(submit.disabled||!['normal','paid_pass'].includes(mode))return;
    const name=form.elements.namedItem('name').value.trim();
    const minEntry=Number(form.elements.namedItem('minEntry').value);
    if(!name||!Number.isFinite(minEntry)||minEntry<0.001){status.textContent='Escribe el nombre y la entrada mínima.';return;}
    submit.disabled=true;status.textContent='Guardando…';
    let id;
    try{
     const {data,error}=await sb.rpc('dfc_z37_admin_create_domino_config',{p_name:name,p_mode:mode,p_min_entry:minEntry});
     if(error)throw error;
     id=data;
     form.reset();
     if(root.dataset.selected===mode){root.dataset.card=String(id);root.dataset.creating='';}
     await loadDominoAdminConfigs();
     render();
     status.textContent='Mesa guardada. Revisa la configuración y actívala desde su ficha.';
    }catch(error){
     status.textContent=(id==null?'No se pudo crear la mesa: ':'Mesa guardada. No se pudo actualizar el listado: ')+error.message;
    }finally{submit.disabled=false;}
   });
   root.dataset.selected='';
  }
  const legacy=document.getElementById('dfc-z20-mode');
  legacy?.querySelectorAll('option[value="points"]').forEach(o=>o.remove());
  const oldTournament=document.getElementById('dfcTournamentAdminBtn');
  if(oldTournament&&window.dfcZ37Admin){oldTournament.disabled=false;oldTournament.textContent='🏆 Mesas de torneo';oldTournament.title='';}
  const select=document.getElementById('dfc-z20-mode');
  if(select?.value==='points')select.value='normal';
  render();
 }
 function render(){
  const root=document.getElementById('dfcZ36UnifiedEditor'),target=document.getElementById('dominoAdminConfigs');
  if(!root||!target)return;
  const mode=root.dataset.selected;
  const creating=root.dataset.creating===mode && !!mode;
  root.querySelector('.dfc-z36-create').hidden=!creating;
  target.hidden=!mode||creating;
  target.style.display=target.hidden?'none':'';
  root.querySelectorAll('[data-mode]:not([disabled])').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  const cards=[...target.querySelectorAll('[data-domino-admin]')];
  const ids=mode?cards.filter(card=>card.dataset.dominoAdmin!=='7'&&card.querySelector('.d-mode')?.value===mode):[];
  const area=root.querySelector('.dfc-z36-rooms');
  if(!ids.some(c=>c.dataset.dominoAdmin===root.dataset.card))root.dataset.card=ids[0]?.dataset.dominoAdmin||'';
  area.replaceChildren();
  if(mode){
   if(ids.length){
    const label=document.createElement('label');label.textContent='Mesa ';
    const picker=document.createElement('select');picker.className='field';
    picker.setAttribute('aria-label','Seleccionar mesa');
    ids.forEach((card,index)=>{
     const option=document.createElement('option');option.value=card.dataset.dominoAdmin;
     option.textContent=card.querySelector('.d-name')?.value||'Mesa '+(index+1);
     picker.append(option);
    });
    picker.value=creating?'':root.dataset.card;
    picker.onchange=()=>{root.dataset.card=picker.value;root.dataset.creating='';render()};
    label.append(picker);area.append(label);
   }
   const add=document.createElement('button');add.type='button';add.textContent=creating?'Cancelar creación':'+ Agregar mesa';
   add.onclick=()=>{root.dataset.creating=creating?'':mode;render()};area.append(add);
  }
  cards.forEach(c=>{
   const selected=ids.includes(c)&&c.dataset.dominoAdmin===root.dataset.card;
   c.style.display=selected?'':'none';
   c.querySelectorAll('.dfc012n-mode-section').forEach(n=>n.style.display='none');
  });
 }
 function neutralize(){
  const mode=document.getElementById('dfc-z20-mode');
  mode?.querySelectorAll('option[value="points"]').forEach(o=>o.remove());
  document.querySelectorAll('#dominoAdminConfigs .dfc012n-mode-section').forEach(n=>{n.hidden=true;n.style.display='none'});
  const fields=['dfc-z20-target','dfc-z20-capicua','dfc-z20-round','dfc-z20-seats'];
  fields.forEach(id=>{const el=document.getElementById(id);const l=el?.closest('label');if(l)l.hidden=true});
  document.querySelectorAll('#dominoLobbyModes [data-mode="points"],#dominoLobbyModes [data-game-mode="points"]').forEach(el=>{el.setAttribute('aria-disabled','true');el.querySelectorAll('button').forEach(b=>b.disabled=true)});
 }
 function boot(){
  mount();neutralize();
  const observer=new MutationObserver(records=>{if(!document.getElementById('dfcZ36UnifiedEditor'))mount();neutralize();if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('[data-domino-admin]')||n.querySelector?.('[data-domino-admin]')))))window.dfcZ36UnifiedEditor?.refresh()});
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
   const el=e.target.closest?.('button');
   if(el?.matches('.d012n-save')||el?.closest('.dfc012n-mode-section')){e.preventDefault();e.stopImmediatePropagation();}
  },true);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.dfcZ36UnifiedEditor=Object.freeze({refresh:mount});
})();


/* Z36 — Avisos de modalidades reservadas en el listado público. */
(function dfcZ36FutureModes(){
 'use strict';
 if(window.dfcZ36FutureModes)return;
 const styles=document.createElement('style');styles.id='dfc-z36-future-css';
 styles.textContent=`
 #dominoLobbyModes .dfc-z36-coming-card{position:relative;box-sizing:border-box;min-width:0;min-height:145px;padding:16px 14px;border:1.5px solid #be9d54;border-radius:15px;background:linear-gradient(145deg,#203358,#17152f);color:#fff;text-align:center;display:flex;flex-direction:column;justify-content:center;gap:8px;box-shadow:0 4px 16px #0005}
 #dominoLobbyModes .dfc-z36-coming-card .dfc-z36-emblem{font-size:30px}
 #dominoLobbyModes .dfc-z36-coming-card strong{font-size:18px;letter-spacing:.03em}
 #dominoLobbyModes .dfc-z36-coming-card small{font-size:12px;color:#e5dcbf}
 `;
 function update(){
  const host=document.getElementById('dominoLobbyModes');if(!host)return;
  if(!document.getElementById(styles.id))document.head.append(styles);
  for(const config of [
   {id:'points',label:'POR PUNTOS',symbol:'🎯',detail:'En preparación · Sin aportes ni partidas'},
   {id:'tournament',label:'TORNEO',symbol:'🏆',detail:'Próximamente · Inscripción y categorías'}
  ]){
   if(host.querySelector('[data-dfc-z36-future="'+config.id+'"]'))continue;
   const el=document.createElement('article');el.className='dfc-z36-coming-card';
   el.dataset.dfcZ36Future=config.id;el.setAttribute('aria-disabled','true');
   const icon=document.createElement('span');icon.className='dfc-z36-emblem';icon.textContent=config.symbol;
   const head=document.createElement('strong');head.textContent=config.label;
   const subtitle=document.createElement('small');subtitle.textContent=config.detail;
   el.append(icon,head,subtitle);host.append(el);
  }
  host.querySelectorAll('[data-table-id="54"],[data-table-id="74"],[data-table-id="75"],[data-table-id="128"]').forEach(card=>{
   if(card.matches('[data-dfc-z36-future]'))return;
   card.style.display='none';
   card.querySelectorAll('button').forEach(btn=>btn.disabled=true);
  });
  host.querySelectorAll('[data-config="7"],[data-config-card="7"]').forEach(el=>{el.style.display='none';el.querySelectorAll('button').forEach(b=>b.disabled=true)});
 }
 function boot(){
  update();
  const observer=new MutationObserver(records=>{
   if(records.some(r=>r.addedNodes.length&&[...r.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('[data-dfc-z36-future]'))))update();
  });
  observer.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.dfcZ36FutureModes=Object.freeze({refresh:update});
})();


/* Z37: interfaz web pública. */
(function dfcZ37Bootstrap(){
 'use strict';
 if(window.dfcZ37Bootstrap)return;
 window.dfcZ37Bootstrap=true;
 function boot(){
   if(document.querySelector('script[data-dfc-z37-ui]'))return;
   const s=document.createElement('script');
   s.src='./z37-ui.js?v=37.13';s.defer=true;s.dataset.dfcZ37Ui='true';
   s.onerror=()=>console.warn('[DFC Z37] modulo visual no disponible');
   document.head.append(s);
   if(!document.querySelector('script[data-dfc-z37-admin]')){
     const admin=document.createElement('script');
     document.addEventListener('click',event=>{
       if(!event.target.closest?.('#dfcTournamentAdminBtn')||!window.dfcZ37Admin)return;
       event.preventDefault();event.stopImmediatePropagation();
       const previous=document.getElementById('dfcTournamentAdmin');
       if(previous?.open)previous.close();
       void window.dfcZ37Admin.open('tournaments');
     },true);
     admin.src='./z37-admin.js?v=37.11';admin.onload=()=>window.dfcZ36UnifiedEditor?.refresh();admin.defer=true;admin.dataset.dfcZ37Admin='true';document.head.append(admin);
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* Abre el panel tras el acceso original y reporta las consultas que fallen. */
(function () {
  if(typeof openLeaderPanel!=='function')return;
  window.openLeaderPanel=async function () {
    if(typeof me==='undefined'||me?.role!=='leader')return;
    show('leaderPanel');
    const remote=await Promise.allSettled([loadSettings,loadStats,loadLeaderWallets,loadDominoAdminConfigs].map(load=>Promise.resolve().then(load)));
    if(remote[0].status==='fulfilled')renderSettings();
    const failed=remote.filter(result=>result.status==='rejected');
    if(failed.length)console.warn('[DFC] Consultas del administrador incompletas',failed.map(result=>result.reason));
    if(remote[3].status==='rejected')msg('dominoAdminMsg','No se pudo cargar el catálogo de mesas. Vuelve a abrir Administrador para reintentar.');
  };
})();

/* Una sola ilustración oficial detrás de los controles de cada pantalla. */
(function dfcIllustratedScreens(){
  'use strict';
  const style=document.createElement('style');
  style.id='dfc-illustrated-screens';
  style.textContent=`
    :root {
      --dfc-screen-art: linear-gradient(90deg,#061024df,#06102488 58%,#06102455),
        var(--dfc-z26-official-wallpaper,linear-gradient(#102440,#08162d));
      --dfc-screen-glass: #08172ab3;
    }
    html body :is(
      .overlay[id], dialog[open], .dfc-admin-viewport,
      #dfc-z37-admin-panel,
      #dfc012r-choice, #dfc012u-modal, #dfc-z9-modal, #dfcZ16WalletModal,
      #dfc-z20-admin-modal, #dfcLabGiftOverlay008, #dfcLabProfileOverlay016,
      #dfcZ32GiftFullScreen, #dfcZ32ExpiryModal, #dfcZ32RewardModal
    ) {
      background-image: var(--dfc-screen-art) !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      background-size: cover !important;
      background-color: #08162d !important;
    }
    html body :is(
      .overlay[id]:not(#dominoTablePanel):not(#dominoPhotoFullscreen) > .panel,
      .dfc-admin-viewport > [role="dialog"],
      #dfc012r-choice > article, #dfc012u-modal > .dfcu-card,
      #dfc-z9-modal > .dfc-z9-sheet, #dfcZ16WalletModal > .dfc-z16-wallet-card,
      #dfc-z20-admin-modal > .dfc-z20-dialog,
      #dfcLabGiftOverlay008 > .dfc-lab-gift-sheet,
      #dfcLabProfileOverlay016 > .dfc16-profile-panel,
      #dfcZ32ExpiryModal > section, #dfcZ32RewardModal > section
    ) {
      background: var(--dfc-screen-glass) !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    html body :is(#gamesPanel,#dominoLobbyPanel) > .domino-lobby-shell,
    html body #leaderPanel > .panel {
      background: transparent !important;
    }
    html body :is(
      #authView, .overlay[id]:not(#dominoTablePanel), dialog[open], .dfc-admin-viewport,
      #dfc-z37-admin-panel, #dfc012r-choice, #dfc012u-modal, #dfc-z9-modal,
      #dfcZ16WalletModal, #dfc-z20-admin-modal, #dfcLabGiftOverlay008,
      #dfcLabProfileOverlay016, #dfcZ32GiftFullScreen, #dfcZ32ExpiryModal, #dfcZ32RewardModal
    ) :is(button, a.action, input[type="submit"]):not([role="switch"]),
    html body #appView :is(.dfc09-tool, .dfc13-actions button, .action) {
      background-image: linear-gradient(150deg,#403023,#151526 75%) !important;
      border-color: #d9ae686b !important;
      color: #fff4dd !important;
      box-shadow: inset 0 1px #ffe2a32b, 0 3px 10px #05030966 !important;
    }
    html body :is(.overlay[id], dialog[open], .dfc-admin-viewport) .action.red {
      background-image: linear-gradient(145deg,#722f39,#3b1824) !important;
      border-color: #ef9d936e !important;
    }
    html body :is(.overlay[id], dialog[open], .dfc-admin-viewport) .action.green {
      background-image: linear-gradient(145deg,#29564a,#152f2c) !important;
      border-color: #aaebc26e !important;
    }
    html body :is(
      #authView, .overlay[id]:not(#dominoTablePanel), dialog[open], .dfc-admin-viewport,
      #dfc-z37-admin-panel, #dfc012r-choice, #dfc012u-modal, #dfc-z9-modal,
      #dfcZ16WalletModal, #dfc-z20-admin-modal, #dfcLabGiftOverlay008,
      #dfcLabProfileOverlay016, #dfcZ32GiftFullScreen, #dfcZ32ExpiryModal, #dfcZ32RewardModal
    ) :is(button, a.action, input[type="submit"]):focus-visible,
    html body #appView :is(.dfc09-tool, .dfc13-actions button, .action):focus-visible {
      outline: 2px solid #ffda91 !important;
      outline-offset: 2px;
    }
    #dfcZ36UnifiedEditor .dfc-z36-logo,
    #dfcTournamentAdmin > img,
    #dfcZ32TournamentDialog > img {
      display: none !important;
    }
    #dfcZ36UnifiedEditor {
      background: var(--dfc-screen-glass);
    }
  `;
  document.head.append(style);
})();

/* Mostrar la hora en las tarjetas pendientes con la zona horaria del juego. */
(function dfcShowGiftCardTimes() {
  'use strict';
  const dates = window.dfcZ32GiftDates;
  if (!dates || typeof dates.render !== 'function') return;

  window.dfcZ32GiftDates = Object.freeze({
    ...dates,
    render(gift) {
      const fields = dates.render(gift);
      fields.issued.textContent = dates.format(gift.created_at, '—');
      fields.expires.textContent = dates.format(gift.expires_at, '—');
      return fields;
    }
  });
})();


/* Chat visible sobre el tablero de dominó. */
(function () {
  'use strict';
  const panel = document.getElementById('dominoTablePanel');
  const stage = document.getElementById('dominoStage');
  const board = document.getElementById('dominoBoard');
  const showSeatMessage = window.dominoShowSeatMessage;
  if (!panel || !stage || !board || typeof showSeatMessage !== 'function') return;

  const style = document.createElement('style');
  style.textContent = `
    #dfcDominoChatCloud {
      position:absolute; left:50%; top:var(--cloud-top, 29%); z-index:44;
      transform:translate(-50%, -100%); box-sizing:border-box; isolation:isolate;
      width:max-content; max-width:min(56%, 340px); padding:.55em 1.25em .65em;
      border-radius:48% 43% 38% 40% / 46% 51% 46% 47%;
      background:linear-gradient(175deg, rgba(255,255,255,.94), rgba(211,230,244,.82));
      box-shadow:inset 0 2px 5px #fff9, 0 4px 15px #03192f40;
      color:#0c253a; font:600 clamp(12px, 2.15vmin, 16px)/1.25 system-ui;
      text-align:center; overflow-wrap:anywhere; white-space:pre-wrap; pointer-events:none;
    }
    #dfcDominoChatCloud:empty {display:none}
    #dfcDominoChatCloud::before {
      content:''; position:absolute; z-index:-1; inset:-15% 0 0;
      background:
        radial-gradient(ellipse 26% 39% at 23% 42%, #f4faffc9 65%, transparent 100%),
        radial-gradient(ellipse 30% 53% at 50% 49%, #ffffffe0 66%, transparent 100%),
        radial-gradient(ellipse 22% 45% at 76% 52%, #edf8ffd9 66%, transparent 100%);
    }
    #dfcDominoChatCloud strong {display:block; color:#244969; font-size:.83em}
  `;
  document.head.append(style);
  const cloud = document.createElement('div');
  cloud.id = 'dfcDominoChatCloud';
  cloud.setAttribute('role', 'status');
  cloud.setAttribute('aria-atomic', 'true');
  stage.append(cloud);

  let tableId = 0;
  let timer = null;
  let queue = [];
  const seen = new Set();
  const currentTable = () => Number(dominoCurrentTableId || 0);
  const isOpen = () => panel.classList.contains('active');
  const isBlocked = row => typeof dfcBlockedUsers !== 'undefined' && dfcBlockedUsers.has(String(row.user_id));

  function reset() {
    clearTimeout(timer);
    timer = null;
    tableId = 0;
    queue = [];
    seen.clear();
    cloud.replaceChildren();
  }

  function positionCloud() {
    if (!cloud.firstChild) return;
    const stageRect = stage.getBoundingClientRect();
    const pieces = [...board.querySelectorAll('.board-piece')];
    const firstTileTop = Math.min(...pieces.map(piece => piece.getBoundingClientRect().top));
    const bottom = Math.min(stageRect.height * .36, firstTileTop - stageRect.top - 10);
    cloud.style.setProperty('--cloud-top', Math.max(0, bottom) + 'px');
  }

  function showNext() {
    if (!isOpen() || currentTable() !== tableId) {
      reset();
      return;
    }
    let row = queue.shift();
    while (row && isBlocked(row)) row = queue.shift();
    if (!row) return;
    const author = document.createElement('strong');
    author.textContent = String(row.full_name || row.public_id || 'Jugador').slice(0, 40);
    const message = document.createElement('span');
    message.textContent = row.message;
    cloud.replaceChildren(author, message);
    positionCloud();
    timer = setTimeout(() => {
      timer = null;
      cloud.replaceChildren();
      showNext();
    }, Math.min(10000, Math.max(3500, 1800 + row.message.length * 45)));
  }

  window.dominoShowSeatMessage = function (row) {
    if (String(row?.kind || 'text') !== 'text') return showSeatMessage.apply(this, arguments);
    const message = String(row?.message || '').trim();
    const id = currentTable();
    if (!message || !id || !isOpen() || isBlocked(row)) return;
    if (tableId !== id) {
      reset();
      tableId = id;
    }
    const key = row.message_id ?? row.id ?? JSON.stringify([row.created_at, row.user_id, message]);
    if (seen.has(key)) return;
    seen.add(key);
    if (seen.size > 400) seen.delete(seen.values().next().value);
    queue.push({...row, message});
    if (timer === null) showNext();
  };

  new MutationObserver(() => { if (!isOpen()) reset(); })
    .observe(panel, {attributes:true, attributeFilter:['class']});
  new MutationObserver(positionCloud).observe(board, {childList:true, subtree:true});
  window.addEventListener('resize', positionCloud);
})();


/* Tarjetas FlashCoin vencidas: animación posterior a la confirmación del servidor. */
(function dfcExpiredCardBin() {
  'use strict';
  const originalContext = window.getAudioContext;
  if (typeof originalContext === 'function') {
    window.getAudioContext = function () {
      const context = originalContext.apply(this, arguments);
      if (typeof audioMasterGain !== 'undefined' && audioMasterGain) audioMasterGain.gain.value = 1;
      return context;
    };
    if (typeof audioMasterGain !== 'undefined' && audioMasterGain) audioMasterGain.gain.value = 1;
  }

  const css = document.createElement('style');
  css.textContent = `
    #dfcExpiredBin {position:fixed; left:max(12px,env(safe-area-inset-left)); bottom:max(12px,env(safe-area-inset-bottom)); z-index:2147483646; width:72px; height:80px; pointer-events:auto; color:#fff; padding:0; border:0; background:none; cursor:pointer}
    #dfcLabGiftOverlay008[hidden] #dfcExpiredBin {display:none}
    #dfcExpiredBin .bin-lid {position:absolute; top:10px; left:0; width:72px; height:10px; border-radius:5px; background:linear-gradient(#8397a9,#24364a); transform-origin:100% 50%; transition:transform .18s ease}
    #dfcExpiredBin .bin-lid::before {content:''; position:absolute; width:24px; height:7px; top:-6px; left:24px; border-radius:5px 5px 0 0; background:#60778c}
    #dfcExpiredBin.open .bin-lid {transform:rotate(31deg)}
    #dfcExpiredBin .bin-body {position:absolute; top:22px; left:6px; width:60px; height:56px; border-radius:4px 4px 12px 12px; background:repeating-linear-gradient(90deg,#3c5368 0 9px,#506b82 10px 13px); box-shadow:inset 0 0 0 1px #b6cad3,0 3px 10px #0008; display:grid; place-items:center}
    #dfcExpiredBin .discarded-card,.dfcExpiredCardFlight {background:linear-gradient(135deg,#094482,#182e59); border:1px solid #98cfee; border-radius:4px; color:#fff; padding:4px; font:700 9px/1.25 system-ui; text-align:center}
    .dfcExpiredCardFlight {position:fixed; z-index:2147483647; pointer-events:none}
  `;
  document.head.append(css);
  let animationId = 0;

  function sound(impact) {
    if (typeof dominoSoundIsEnabled === 'function' && !dominoSoundIsEnabled()) return;
    const ctx = window.getAudioContext?.();
    if (!ctx || ctx.state !== 'running') return;
    const duration = impact ? .24 : .16;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    const now = ctx.currentTime;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(impact ? 460 : 1100, now);
    filter.frequency.exponentialRampToValueAtTime(impact ? 160 : 2200, now + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(impact ? .48 : .28, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    noise.connect(filter).connect(gain).connect(window.audioOutput?.() || ctx.destination);
    noise.start(now);
  }

  const getClient = () => window.dfcSupabase || window.sb;
  async function call(name, args) {
    const client = getClient();
    if (!client) throw Error('Sesión no disponible');
    const {data,error} = await client.rpc(name,args);
    if (error) throw error;
    return data;
  }

  const bin = document.createElement('button');
  bin.type = 'button';
  bin.id = 'dfcExpiredBin';
  bin.setAttribute('aria-label', 'Abrir zafacón de tarjetas vencidas');
  bin.innerHTML = '<span class="bin-lid" aria-hidden="true"></span><span class="bin-body" aria-hidden="true"></span>';
  function mountBin() {
    const overlay = document.getElementById('dfcLabGiftOverlay008');
    if (!overlay) return false;
    overlay.append(bin);
    return true;
  }
  if (!mountBin()) {
    const observer = new MutationObserver(() => {
      if (mountBin()) observer.disconnect();
    });
    observer.observe(document.body, {childList:true});
  }

  const panel = document.createElement('dialog');
  panel.style.cssText = 'width:min(88vw,360px);max-height:76dvh;overflow:auto;border:1px solid #7ebdeb;border-radius:14px;background:#102746;color:white;padding:14px';
  panel.innerHTML = '<header><strong>Tarjetas vencidas</strong> <button type="button" data-close>Cerrar</button></header><p role="status"></p><div data-cards></div><button type="button" data-clear hidden>Vaciar zafacón</button>';
  document.body.append(panel);
  const status = panel.querySelector('[role="status"]');
  const cards = panel.querySelector('[data-cards]');
  const clear = panel.querySelector('[data-clear]');
  let list = [];
  async function loadTrash() {
    status.textContent = 'Consultando tarjetas…';
    clear.hidden = true;
    cards.replaceChildren();
    try {
      list = await call('dfc_gift_trash_v1') || [];
      status.textContent = list.length ? '' : 'El zafacón está vacío.';
      clear.hidden = !list.length;
      for (const gift of list) {
        const row = document.createElement('article');
        row.className = 'dfc-expired-gift-card';
        const origin = document.createElement('strong');
        origin.textContent = gift.origin_name || 'Tarjeta FlashCoin';
        const amount = document.createElement('span');
        amount.textContent = new Intl.NumberFormat('es-DO',{maximumFractionDigits:3}).format(Number(gift.amount)) + ' FC';
        const expired = document.createElement('small');
        expired.textContent = 'Vencida';
        row.append(origin,amount,expired);
        cards.append(row);
      }
    } catch {
      status.textContent = 'No se pudieron consultar las tarjetas.';
    }
  }
  panel.querySelector('[data-close]').onclick = () => panel.close();
  bin.onclick = () => {
    if (!panel.open) panel.showModal();
    void loadTrash();
  };
  clear.onclick = async () => {
    clear.disabled = true;
    try {
      await call('dfc_gift_trash_clear_v1', {p_ids:list.map(gift => gift.gift_id)});
      bin.querySelector('.bin-body').replaceChildren();
      await loadTrash();
    } catch {
      status.textContent = 'No se pudo vaciar el zafacón. Intenta de nuevo.';
    } finally {
      clear.disabled = false;
    }
  };

  async function discard(rect, amount) {
    const serial = ++animationId;
    if (!bin.getClientRects().length) return;
    bin.classList.add('open');
    sound(false);
    const card = document.createElement('span');
    card.className = 'dfcExpiredCardFlight';
    card.textContent = amount;
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    card.style.left = x + 'px';
    card.style.top = y + 'px';
    const destination = bin.getBoundingClientRect();
    document.body.append(card);
    if (card.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await card.animate([
        {transform:'translate(-50%,-50%) scale(2)'},
        {transform:`translate(${destination.left + destination.width / 2 - x}px,${destination.top + 44 - y}px) translate(-50%,-50%) rotate(15deg) scale(.72)`}
      ], {duration:620,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
    }
    card.remove();
    if (serial !== animationId) return;
    const discarded = document.createElement('span');
    discarded.className = 'discarded-card';
    discarded.textContent = amount;
    bin.querySelector('.bin-body').replaceChildren(discarded);
    bin.classList.remove('open');
    sound(true);
    if (panel.open) void loadTrash();
  }

  document.addEventListener('click', event => {
    const card = event.target.closest?.('#dfcLabGiftUser008 .dfc-z31-gift-choice');
    const status = document.getElementById('dfcLabGiftStatus008');
    if (!card || !status || card.disabled) return;
    const rect = card.getBoundingClientRect();
    const amount = card.querySelector('.dfc-z32-card-amount')?.textContent || 'Tarjeta vencida';
    if (typeof armAudioFromGesture === 'function') armAudioFromGesture(false);
    const observer = new MutationObserver(() => {
      const text = status.textContent.trim();
      if (!text || text === 'Canjeando tarjeta…') return;
      observer.disconnect();
      clearTimeout(timeout);
      if (text.includes('Esta tarjeta FlashCoin ha vencido')) void discard(rect, amount);
    });
    const timeout = setTimeout(() => observer.disconnect(), 30000);
    observer.observe(status, {childList:true,subtree:true,characterData:true});
  }, true);
})();

/* Arte de tarjeta y adornos de temporada en la portada. */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    html body #dfcLabGiftCard018 {
      background-image:linear-gradient(0deg,#071e3a 0%,#082747 72%,transparent 100%),var(--dfc-card-art019)!important;
      background-color:#09234b!important;
      background-position:left bottom,center!important;
      background-size:34% 47%,100% 100%!important;
      background-repeat:no-repeat!important;
    }
    html body #dfcLabGiftOverlay008 #dfcLabGiftUser008 button.dfc-z31-gift-choice,
    html body #dfcZ32GiftFullScreen button.dfc-z32-native-announcement,
    html body .dfc-expired-gift-card {
      background-color:#09234b!important;
      background-image:linear-gradient(0deg,#071e3a 0%,#082747 72%,transparent 100%),var(--dfc-card-art019)!important;
      background-position:left bottom,center!important;
      background-repeat:no-repeat!important;
      background-size:34% 47%,100% 100%!important;
    }
    .dfc-expired-gift-card {
      display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-start;gap:2px;
      width:min(100%,210px);aspect-ratio:5/3;box-sizing:border-box;margin:8px auto;padding:10px;
      color:#fff;border:1px solid #80ceff;border-radius:10px;text-shadow:0 1px 3px #07111f;
      font:600 12px/1.15 system-ui;text-align:left;
    }
    .dfc-expired-gift-card strong,.dfc-expired-gift-card span,.dfc-expired-gift-card small {max-width:63%;overflow-wrap:anywhere}
    .dfc-gift-origin {display:block;align-self:center;justify-self:start;text-align:left;max-width:52%;padding:2px 4px;
      color:#eaf7ff;background:#082747;border-radius:4px;font:700 clamp(8px,1.5vmin,12px)/1.15 system-ui;overflow-wrap:anywhere}
    html body #dfcLabGiftUser008 .dfc-gift-origin {grid-row:2}
    #appView #promotersInfoBtn .dfc012x-prom-icon,#appView #promotersInfoBtn .dfc09-tool-icon,
    #appView #groupBtn .dfc012x-wa-logo,#appView #groupBtn .dfc09-tool-icon {position:relative;overflow:visible!important}
    #appView #promotersInfoBtn :is(.dfc012x-prom-icon,.dfc09-tool-icon)::after,
    #appView #groupBtn :is(.dfc012x-wa-logo,.dfc09-tool-icon)::after {
      display:block!important;position:absolute;right:-.5em;top:-.42em;z-index:2;
      transform:rotate(12deg);font-size:clamp(13px,2.5vmin,19px);line-height:1;pointer-events:none
    }
    #appView #promotersInfoBtn :is(.dfc012x-prom-icon,.dfc09-tool-icon)::after {content:'🎅'}
    #appView #groupBtn :is(.dfc012x-wa-logo,.dfc09-tool-icon)::after {content:'🦌'}
  `;
  document.head.append(style);
  const dates = window.dfcZ32GiftDates;
  if (!dates?.render) return;
  let details = new Map();
  function render(gift) {
    const fields = dates.render(gift);
    if (gift?.gift_id) {
      requestAnimationFrame(() => {
        const parent = fields.issued.parentElement;
        if (!parent) return;
        const label = document.createElement('span');
        label.className = 'dfc-gift-origin';
        label.textContent = 'Tarjeta FlashCoin';
        fields.issued.after(label);
        const client = window.dfcSupabase || window.sb;
        if (!client) return;
        const key = gift.gift_id;
        if (!details.has(key)) {
          if (details.size>=200) details.delete(details.keys().next().value);
          details.set(key,Promise.resolve().then(()=>client.rpc('dfc_gift_card_details_v1',{p_gift_id:key}))
            .then(({data,error})=>{if(error)throw error;return data?.[0];})
            .catch(()=>{details.delete(key);return null;}));
        }
        void details.get(key).then(origin => {
          if (origin?.origin_name) label.textContent = origin.origin_name + (origin.origin_detail ? ' · ' + origin.origin_detail : '');
        });
      });
    }
    return fields;
  }
  window.dfcZ32GiftDates = Object.freeze({...dates,render});
})();


/* Tarjeta de Diamantes Flashcard. */
(function () {
  'use strict';
  const home=document.getElementById('appView');
  const flashcoin=document.getElementById('dfcLabGiftCard018');
  if(!home||!flashcoin)return;
  const artwork='data:image/webp;base64,UklGRupCAABXRUJQVlA4IN5CAACQIQGdASqKAgABPpVCm0olo6MrqHPsgXASiWJuc+A8zdANhvbwOZpadpi/Mr5Fb4Q5Uft3Hl/9fzwuP++z5h+G9jP+n4kfTf93zbPa++L/2fWB+t/Ya/Xz1N+o/zZft3+5Pvn+l//a+oN/ofT49Wb0IPOb/+vs9/3z/zdQB///bX1GNpKv9rsn63bDwFPbnoex3nFPvZ9p9KGat+B6gHnZ39vrnsB/qH/r+0P/qeTP699hL9hvTi///uZ/d///+7l+5H//E715OZm1g5Z9q/6LI/p4fmaO3MraayXXipumFJ28d2Rv76Q83TsbhDMWcaUiTu6AHGe4QkKkFC4GqsOmxmhx9TCMaMt+BFHHO/BN89BYcamZmlhsYPJUzPj61/btGaHv4XXWWeNNFj4hegj5FbM413ARizsmI1IBlYwvPC02HLFRdMHSzBwE43+08In74KxZsw/Tklim+hmVDNrHGAqh11rDGpOFRrYEiG5G/waTq3ufwUI+PaXuRIS3uU4aaeyd+JcgFAWp7qdW6veCnsss2BuW3Pb1svyy5jSB+xsEXimh3jGfl8zV8rC/xmTHsVTk2tZv6XLokKch1xFfWoRp2YgQD64ogb0ANYO2a7hP5/H8HLBS+dNzuZzGpNK/uta6am+pTekPnAGauj+BUeGbfIvU/Rl9kDZ/yNPI1xftrr7I7tX2wc8V6PssYuLuk/RSqAcrBLHEIV3Rl02cfQsrjpUSD970WZHLJOaRnbVv06Tcu3nPRVTVN6FLgcoTc9VU9Dvr5+v0ucuaDADK4n25LZDTTzRrWsqoYnlPbY8Xf8P63mGgP29D/BvQBWmcD1Em9M/LbsCLog1VNwhupDqZDpE5jJR80e/AZdTKTEpe5pXaEqiwzWuEEGNmjfV+0s47uQ3kkcfMUICMdHRU/gMqZ8qeJS1aR0Glyz0pZ4FDB+s8uT5ndX5YDTq5+DCQJ8RciS2wsn7JC9R7GPy9DHAKf5EdCpuCGi4trcbpxYoKdm9/EhN4LFMlOxrk8o7gsZ9kVudPjt06EJcDN++M2OAtErH+io1RZHZyooKAVkTLZ3X1ONkP6R4W2sESLgjdMuWlOeI6LqtKBdyjU673+6GV0FfrrUmFNcaLBQQVD5bEdVA9G0/TVunZddjWKakLFPvyk8Hncdjjt9yFny6582PZUpLR9yIeCCXKZQrytj/xw5YlIxCMepBJfG9YOm0r9UPxjAwY7T10oPoL6dAjl5Wv0/qXw3vKv3iGbLV4iFp5uYn49M/X/q8C54hzWWw21pQxH4i51VQ8KjB9npKcXm+fA3wNXxGO6NsTovv1SfEdOEpvgX85ztRwfp79I3VgktztzuHUGo5iRrN2fNx8HQOzhzZcgJfhRZ7o2Wd9Sk79dCP5hJwAR75EqKDmrxJ38YaK0xAhwjELzEIfxMFPOV74mEFCpzgKT64eb/4OYmImm7p82b7inQsLjhsgoL1mZ9iejPSMG0/7X+uAacXkYhkBf5unZCJRpgTdN7SnVkx5Nxhf/+viKHkimvmdwnBbIbkAB78w9l//9V/iNiYeGy1oVg7juUQ0/cXzVt43o5T/khObL9uWsyvhBbPjZ+CEDMNidR3MxzkIw/eRBqZqR+oCyNfGbuDQU41FjaKRDaB6RvCEV5VgQjZ+WL3C4rNKtIsNLSU4x98Flbd7qQLpsbktwqcIsV9JqlRpyvFVH/uwd55AbjkEge8R2/4zHLMDSjg27JMsXXvoV3/r/+scd9mpx1zqGSoejG2VJ1adrw2M6MsYEoDKQjWoxWLgVHu3YvsZ+vbBACV7RThv4N3rrnCqipWn+D8mTMq5JSRK8hhMsBx/ZNNYUMHIF4NxADC8sMl0b+zcrdrf4PwCfc2VYowhJOO4OSF2wf3dab1B9AMbDNX5Il0btILlDBuKkKvSCPGiVBcqnuEy1M+bja332FVN5g+Ewat8J1ZQsFemGE0+JMvyYFFMFzxpvl+PESX2uN+U5fmYJlh9HACw7qOtkYuZqY/kLmiaLhmN0/wSOt/Puj66MzJFJvBvFJLMgVBiXeYHe8q1NM9hFAPvsGAnkqEOW9VFcKQGY/PNHi5xqXQ7jPM4S4TyH8rQulr1XZsU3iWoeGTg+UQyMi8wh9TfPUnaY8yq2EQ0w7Njm1EZuoTd75IsxJvAtopmTRSekShtpw63PGkYC3NKPLtHw4E8NWTc3fd0o3XRMGyzFhZJ3pvmO0Qn3bjzTfN4sivBdWsr4rhZKp7eewTeS8XwxBvSBQU/PMbXQdnIqCAphkSxA6YVG58xNYjM54VjO5x9YDvCKXA66askk8ywtqZPWWp221rs62dcY9JYccDBRI2xLt6t91IYfa2XavGR9N66lFNxO6CvH6z4n/wkdwV3p/RjzcWsX7zCgYmXfj7//iBjz7WNkABYLQ79VoE413jWucS1LflaWLPZWFGjwqgQ9K507+Vts5D10LE5wt8ZZjxhi3VrxkgoyjQjMcBeTpEGTvevxc6Sw230VL6xwBtql9YgL/bihZQfh1PE85MTHNbov9JcKQaBL3R5dshTs+hQIH7oIuCIQJeuv1G5+ibnFOdf80Oa7O0v3rwN5+RlDouApdQOsWcqqXR1terqlTVRx9FF1VG9mE64og/jq5kSKXoqTui9PNEhcwAEZkv1PQ6NdQolGJcmuSSrnOoewiOu433rrZa6Ez+KYpzxM4329aaupSk8cQbLcLIHUUr0bbZjyfO0bnlELO1cYdpqGOD95LGfL0Ms1FNmGUMsY9lNHNnIYOUvOUb5xRgU05zqmv6p2G/Pztw34xZzCNS3DLTfRko+U33g22z5//wf/rUsQCo1gRbVUn8DItfIjLljXfMVM4+DtGZRIYTy+4DuJjIZQrGGwZpHE7lw2jKAW2VXoQdhgxLs41zTqtpr8Ijcq9VAUsMjQSPnJ1fs6EbbjB0ImKhVXMEGhntmWjthYql/4VVFwaA1Gkr2pHoZRnkEVu3Z4+ZD4sGtyW8PACvEi05hJBHKt+UJws4jCe1HehRO7PQ3Tn2nRkoL/SeYV8G5HysZLpjpQlI9aw4fSsGyhOKEOEnuhvqxXaSPKTkLPLqDQDkxg0PJHAAA/vm/MNF6xSG1A86sBobzKDPxgy+Mdvr3WO+hLQ8g+LZXNISo/Nt/ewCl3Z3O/29gC8FhQLGuj1dkqAfi32EfFuKWSXK7g9relCigFokjxgSqv5I/nPdA+FjWkXr5uW2akOfGEqlM+ldeVp63CwgGTVbX9YOBSFJAtcCkpElsyqBnOMxv9hEkNeeKqWudt4czLCE0kmOvrf5muYX55LqsQkKHOTI8Yvu7CTiqqli0j1ceIulaNOWV5pzyeYE++oZxdM7tEkKNzW1Cp2YHA+mNp2NJiFOadF2aaSZLjM2Jj+EoBE6VjKCpcKpW+UEMOmeftNWYMLhI/WkDxKLV9mH6Ezhy/jJRvedHPP6TMezkUIwZN7pxVKzt7lnepsIX1dfOMHHZF84COwF9D9D0teR1ElnrIgJfUUeEg5EXvY+mQPvggrUdBKA5nPvBHORSdGI3V5bPv+sYiGikg0FudNQT1o5ISKt0fTxvihIH+RgfsCSI6OtE2sGElgV7lInSymgVx5JOShlhJnoJfoxE4VhKCNbGrRWCyNYm1oTTdI+t5loFLz9dePLqMxNhHt/RNYyiUuyRY2mHwl/ube2q6yVVJN582tGDWT/KRMZ/zZ2sSR1s49vFvnzqLPMM+pWf4Pn0BUQ0chYmwGectkBV7SwP4WVePg/GgRfYnPI+JIDcF9WpUR8XhxJRRWoRZc9x5GwlLvD/UeVCm7YUxLFA7IhoZYNOut2SIIJGeiJj+LHCVjC91yL/NPY4P5t2MC0Cfetq3YuUl75Aqj/1XKpUFU+Dov/Zzu4q6Ex6lIIllKxO/QQmQY/Y73WxMnAF8QsUJDvbHJW0sR5+G6OhUOGIcrDgqOkd+h2a7W496N4MLt5hMVfXc0NG0l5JyRLhaGwvbY1f2qyb2z1+jbCeBPmBeUTMiu6wg9Cu0NjFVNh/kZ3M9BaZSmF6j83v3G8vM/bD7rxXteMhvKcvnxiAn1GG9ztWV79IqmDUodbRz9FAAZkPWNMPLqPdefs9IN502mUi7RTjTkE1imNp5P0wXfKsfeAUK9DWi3/AXIALLzK8vCwCfLV1VA9ANsymuSArHWxmpaCEzs99IExdLExJBa6zFHZKymM+VlHV6vUgkUtTTFlnlTkxe5YqdX8jz/RikyRKzu1uIP3aidmN1r0j8RYGLa4jXi4RB2rQvHu4jTeVO8CnyIRZhuDEYXLNt9EKFUxE+Y8pZkwWJO+v1DJrfEQqmSZiGDLA1acRuG9pkTlAz9qZe7R23twNpNr54VbxhyG4Ung7d/Nx3DZIh5d6LFHYiYO8Obo1eggrXLWid5x+eCxWvvifm77DGF87BkY7V2oRM4vr5s3L7+m+wqt6mNzCCVYA5LoHwHy/gcMCBF6/Nr7WFsF6v870Ijf0hQBhDfWqoK0U8cUOS7ZXnLrTTZa30jR4KULm/kPXE07Dx34fK1yLQRXpQKP/sxBIRdf23ag0IiHuGRyRKzBPBfrGnCmiBMaq3OVkkb+QLvQN7szNc7v13CdBhSmO9K3zVU6ol6yVjmnXxb7Yf8tatcWVc9n8bXDCIHUQ4byrRMy1cpFZO+bwXjwRC4jBFBwTS4kGy5dEv4E1nDoaVA0SeTsWWx8Z+zhcBtchY78aB9oiOad5cy2NBQ2XzzNgMzyQnUt5MQNQ/OwxFkToBwkJtwq8171/JyMQr+2bPCwcVdHsj7hiog5QrTsMWEWM8tB0LdGUuVRnevdwuwAOBYOZNsiUXGJl/Ie1auuM3lvBEGtmQ5LPN3CqtfxeynW2+f4RIrxnITv7s6H9fj0a75MFBdaDq44zysI/LUy9m1t9FXAHf8odu+P6qF5XVdYX9gKOz5RnnQexcJFmIKAqVf1G/58xEX5TPx+Yz2W9R7M/2G7YuNqXcNtrYfGKQcFBUio8E/zXhN5KZ9DTllGiMbL1aTjkiPa4ZbbiaEgNHyn1iqcvqosNjUketwsbTTn/6mnmFrI8H5YyJsSLCxrNT/HGTc+squlm1tIzCaVxOJzAopbS17mXGoThZdyZuZH8rPdP982eIvXZEii3sSH9N7EOW/FQhL3XsXzsLCTh2c5C1NiH520Vx1Ggvu4y7VN2jtujVpSnFgnevBB5QDP8zteqEfRuQuBD9CvhopZb8/L9G+SBG6bDnhNiV3jDimxAowO6XnwHQeN0mqAuvIGf4EduYB84ZuqLBdLDxa3ODKsP8IyPdHDaL3q/UmI9+v3aZNWLszo9HrdGTruiB5rOg4ewqeapmZ5nt0N7gjm9236kaYXcEN/hdR3qffC67fXbH7LTKSOdVotqWzF2mHiJ5DHjw1i/x2+JQaaPuD7s/rvxzSKkpcmkfhW46NlBe5+hBVZstlHqtHDVW8jwhmFkjpngXGYs8AlL6uUQKIbFyIAvrQUbUYilAAGaPuupFMsGnAETU1Udc++iEfDMtPTH7hgXW0HbBbijBlclxa5IsNXxPABqm5m7QPWdMS24IhxwyUQ7Cn2QmWIKN2KYiZlQLJFIld5p+YWYWOdE5hWghpWaj98ugS377YB2SWX93rbXjOBzVKbqi8TjrKy6MFw6cuPGwX/MILuGWJP0Bn7jJ0PM4YUuZbCWR7n5KDojVAgkiJKdfuei7AXdG38nQML4jdFXhxJgwbukeQRhlVDyL8TKGJgcWbLVIN4bT8ZrJAAImwNyw1muyJVs7KT5Tzi6JpzSDHbMrS/1ua9IXTOA12cswlPgtMtA2y3YERdTcY8H/T7ysLSKgIfriV7tNFQFbDkpy1CHXhSIqbSl/bp71rCzpNo//RkvWr2Q/wdfDK35pblhDmiVt/AeM36/qDU1lEkTMHXTb/Jq43wtZiaI2LlNII2mJeWDw3JJ6aGynryBwkUpiPAAJIjfETashVUCqJidfxH5b9ufwjcIhKlbVSckG0PV6vYU80v2L/U0A1igCTcQ08OvUdOxsDNvEWIFa4XY03XIjlJaomGYRY72k0L/2CGK1vlr7Un17DPFOUHX/c0T0iq1QCuobc2Rfy/8Zf31B2yNeCqKcqS0ie8hdifKcc9YX6hxvz2+2+lRAebT00prY0Qu+2rn5oE2rAtxPrwEk+JKC8aYm70YEUXU73aZomQ5c/Zttk0J8KRp1cLq5FjRZNilZ3nIcBTjis96jFWKI+OgEyS09VRAiQPx5rDuGx4GkupTbejRvXu4Ejr/WXZSxYwKiM0wCrKJUDtsYmkoI5XR3G+5YVnKz4jxvVy5eMbAbWOOfDz9klgzDThmBntt+32x2YPb+LCT69T9/sxB1CjYaxWNZB4p4eg0cIJKy86aFDvbxyaE6zjs8PUeVjbTb96/AOnOAspKQckc/X9HJqWNgljoiKEN7IwffZGU2jc+4zLtIlnVYyEMEDTHaO0UOtwgrsaJZbK8+AyP7anGEY4TNt0UbeL6m+Jd14upRLIK5SvzfQ6R8chfgF8RkJrKRRumSyIGJeFZsvyCF9z5Fvnu2LFHIUHF+kUNLl/CEnl4Dj+3/NMzsckKMmtheflF6Pcn48Flln6Q1DE6o8NlEowfgUvMaA0aMLyVvyDymNVxM71Z8HpuqQhbrDW19qOSlMDtOTMcMncYABckChpPTPxvUFolywVSRAEa/BnOVaZFAmqBbg3TS1xrr+8hPSyZmT94ION7OvaSTR83np23P3s+2gm9cXZSKxxM+pTxM9gVcokYJq2RGBsuAjH210JrgP5NPlrzV6MP5R9pwg5XcdurqdTebBmmRFprpuN73OXcDNHsTorOmJWdGR8VH2BR5HhX+jnn9JuLELtVa1uXlPcyNBbSAL2lpZ/yBwHuRn12VPiicS4gIgScIHGQA/aD9ke9/mwxpsiD+60FfWBLrAc6a0b7h7fO9K9fTozsBvWxi4tDYn+XP8XAkpAuYQExpuFLOvAUxiUmdHjEkmuOD9QfAtsZg0E5M13mRKU89WKXLjlV5BqCqUpu+PdHPMe9NVxLMbuv1G4CZ1En68IWlED05Ir/EKKtkLAvVYJQRQv+TS0wKUR9kk0GUpd829RnPTm+2ge2t4GrBKc+E2X0FXZa7xJ4z/2xmKRCQDljO0mM0Zo+MFlQyVRUf7njkH6czvtylkoG+iEhWcos2lXHU9OO04WOyrI4t8cLGVBzdxPmlyIHVSE6tshSQ4d418vFjs4YpKhBCxvwfqpxxuFC8U5oapzFFCCeEcmv7JCcJDn+RgDvrsdDgCFmQpkJxZ4nbprca+SSvf4uct/Hk8y0n2GdsSB+ZGKh+3KgGdfankEhPpTdb3C6lfVG/optRl37izGmJqrRNW3LCLWRgke0SdkkRr+I2ebsdLOk7fhz8va2FhcPu4o3fq0u2PVBaPe2BKkTvkt8/USkAPebUASp5eTJR86imLGkh4tiNPKZ20qQXYZJwYKKvrypV0GYmnpC5wTtp6rS9USCll2fclKVBo6Q+mJz7esNGcLFCzNG7I99LiL0LAYh+GqjRVfRdX9PLcQZGGmDxjf7njJ4SR7UdqEQjg/CL8Z94TKIs03kEZHhNoqQCnV9hi6/oE+aBIA+Dx/19pdvHzkYjSGLGz7xV9ty1b3gcucsA+JpTlluD5v/aMerApefIGGdRHRY2eIoKs3QdKh85LJ5fNpO4whHJ0Qr1paY8jQKmC7r2hGPbwb2KTuMS4Nx/nrgbMSukCUJ2cYHUb9EBf0jOhSNMZMRWNFrOBgK4sauCihbFrGtlddv3wQFpfqKHi3QUY6KuN/PFfcAmAUu7BCy6S8uvZCVZ0awS3L/aCiEq/aCm0gX6GaNCZyfxeGxEJQX12sI6Y1sEFO3qhWgb3/z828XAFZo43p24DqMVmT3bsh8kV0Gs5IfgrGf1Q/ap4Qoq6/dF1GxDzuqQo1WHk0p5mYAMyQavw5WYH0Be0JtC1Ykx6OLTNu8SongB/ISj5pYAvHf1axAMH4ob5j7lHfVIYDgWhvlRH6SHw+t+yQuQXPnbaU06Grviz2TPoLT0XO+I9SC/14yn9qwWYlseRF1VctX2vB0Owyi+s87KftWCZX5ZqQXRjLrOSNwdmpTHYupMv1pynS7X3/43dOA3JJ+u0ILgGN7cSeKiHLNv2uK+SM7H8ND1kLtiB7N6hahjID+dyHtKyMI6QoboT3KtJWN7jimHVdv5O8hQET6lJ2NT4p3hCcLHtvVK/gjzSKQy+PP/6qRMKx6q45Y7ZFgrHRpB6GcQ8orgCLo9ZXm2wcdbQiTwqf8LvVXV/d15dE+Q7Xa78KkVf9LST+F4UF9eLxL/vSZ5LSrkBmcdd4daT5rlH4xCZTW3Csk+Va2m9xu5ebJsxLsdBQIpUw26Sj3g6oKPEGjdFL0uGyhaT7KVIrEx+MbmfAyPcwh8SaAI6gdGT0Y0Us+jtjSxglEiFX74yWKvW5ZPgfij9Peb7Fz+x0tz6jZvWRGECt4A1JP9BPm1H/dKVH3UghyY4V3lqXG+j1eMbHMvwWPRn1xouiQ0o469EugeCSBQsL6RtnDBr1m0gG/MuCIavq2bu08DvfvEpxm8aqGrYzZIORjxkEN5YDA5JOho47eTKbzwEHdM+9uZLWo1pJ53sz5PfJ2lWA37Hr2tcidepnlDcO+hX543Y1oxcjziLzEJaO/0tUsbPR/1DlaZT34iFQ0eOaI/A4dFLrwTtKfcX8q4mKp+5Age7ML5PRy+PTzAD/B/8awU/5SfIeH8wHz+8FLKTGqWSy/kVUJ0MDGPhdTFvDNzl/8KDHhogAwtTUTkuuwQztpuylmh8dNRwcdnAXgCz3QpoGT2fgOUkx7/X5/+QlQM53D5Y5taoBQPuhKxzcWvSv+j3wQ8QKTtWMlpihE1b803DAidkrMNfjTuIXM3dnrU1kug08lKUwmsJLfc9ooYTM6/aBe08mflowEfT1hBwMtfbtNx13fAQ657yvbbmnjpukQ/WrUjcIwNLZjHe40J8XP0sMHBGzdzZoZyt3sdQlnDfS/2GL+ai24evTtEYK4feiA1eB+mmY7UDfrirQ/dkZ/wDM+vp+cvHbMafRVyexhU+bg7lc16/hCHX0m0bmIDpOJK7ygnHrs/MMkurcNNpfVYn5DRIroVtyw7U4aScTTs7ShRDiqwTbY5mKJ9L6tu18LdttViwJE5CP3J+ZZ5RQmf+VjsSU3s9Xw5w/CUc0jf5QE0tUwCeTkYQe8ipYij2F8TDgJht+py/dAtdmthJxOMBcda9uYPKFVnYa4Gfjt7crt1of1Fsf7R+9lbX6I4/SFvePhpQGJOU7/FFDzAprfBJQ4NmARB3vrVAzMTV7TBKvrQ56IAytViFScK+pE5epXyH6gTTl8/Qc9EtdqR9u+trp1zVHw9jKAoqNzaIPP3JHJx5PUN3vsohNFciIB1MN86JdzqWpuK2Rn+emEBY8pxxFzQg8w0qxhAzaeQw0rZgyxbFYOi/VGkEOD5iXu/57izcG0hox33YY1MMKvCyq4fxwP1AG8gtIISdj7VFiizgAfWvBqVxXy7SB1+s5/g63H/9q9X/9Ra8erHT4MX6vF266r/JLkZ///KpneaFG3GicPCJOP9RGSOHeiHmoX4t64oEc1lRvNrSqg5rPtGEB4ZqYx77z/7+r9j/rlon8gvnh89UbLgeesXu6E5l4GMTPj/DRpKPUhXMosUd2ekCt9bID75ff/o28MfCXLrNMIiOrPeLtiPrlbCl3yvElRmAuudgZ0su1iNkM4syyOR+zK1rzs6sBh3QRp9oGKjvvhI1F4Ejr8IuHyu3D1sby1+SDjqkXv85iA0CtjTr+B7CsDrrG3K6OAns82u0MXDROOcC+HHsWIzzlQBFiqRWg6kv3OUPvf+mLQrJuene35f/NRDN/sJK8EfY4BI+OYFGVbH+LCTB1d8pk2f438qnyUywTPXjFVuldNbxI4hcZV3opgK2R9SC+WK1AwaoBndon1mYdkG9tfgOtANenetth4S1Cs/eVVAxDSKujd8Hn3P38bAz8RrJ9pdgK9faepdpE0bHACH/cnaqDotK+K5/JQyMTfFx049cNcNzIj0lAgaCR0ktzQjh2OJWm/5kxA6OtVi51yhhMo7CmDYJuK2bNsqhNwYme9v3p2N7dhRL1gm8agAkvM3TM8KfAQF1uDQUdDmimgoRef6hq/rv1oiu9245vy+NzzCp3oBTzqTxsrebhmTJ9PDjAsMcdlwlnpNBpC7l4aoiN8cA43JBmU1SLwLCVu1dfKf0DGq53Dyph4vzJwv/Vl0PmKlaWA2dXpLQiy7FG6iOprPTQ/dXspxtaCTWZN/Giz3uA/+/Mbcqgomtd5Vkk/4r9Q5H4g+xjq72pI5lzNrQbQ4DtvpO7jVWed87h3viy9BHYNO0b/JhkuFEv33uKw69vH/yZrscGW5i4Y3edW0S2MjSIkSaCto9ngfzdtJrIk9NRG4vqGUuNkiEgm0LVL7wvYU6hR7VjTMeXhTpRgVTk7v2tNIdSyYoEH2OEVX4E/HR6hiFEt7wx4E/hB8c9DwlBXxggsqkUha5IrrSQPmAGsVY2j9KCIm8PJnLGB+/vBwaXqAZu3MIicrKfWr8I8lR6RzPj4+PmLKYOHAit1X3+ZJnNRW7rIVKOUZttu+DOu2schgCjiVZ9XCPJY02aDZiKFwD7h3I7mPEUb13+XFElNUZ8bz8bmxzEKOp3rt+8QlQwkRQc6uDhyJelCp5fr22np7a/A5/sMfeYd0KlWaW8Yg6q4ZF+v9w2HYB+oOnFMfmTeUyf0dpHBtGUPdjPMeLo06LF0g9HX+6RJNT5B4/LALJyhxpro8+vbCiQDe3gO7vqcHgrslJfQyzAgd8ksSlmo+a+VmLRTWAeL6LdAaleoZWz40JlQjj3HH3/bBOZPlZsM9S3APjmMf9FHAxVC7gnOG4/c10hDWtsXuPq8y5ouzobPNOUGhA3NTEjjjv+xmZW8deY5y8l/X92TzAysmC80LFMxqXvV+eEWP8PJGzrIQSca0KTU8mmnVInwhGps9Hk9pRLCCnRvCQQBhNMo28OFGV/yJnv1RmBobO83vuAI3MnNn2tuacdkQtl3Tb4IwMyaZ3FM+xc+D4MtyXdiqUx82OnCvGi6+/99jVJHQSG04EIZeSk/UwnnAennQazMxZhQJLK3a0TRtRfmrRQkg68jNDFjC0CsG2PtMxHf+20NS3PFkhtxn02HxqXoXo4k0M101/+kyJsHV/wI6grViN5Ewh/jiN0hIezEu9mfOxjnHAPjJA6n9WCssyqQU8rJ0xAngN4tUgw8mtnHixa31nVpi47ekyZ6KmIOC3ThyxCoZG2xFU5a9KsxdVvxbeCOFgizN9tq/ubZ8YWvtlO2P0aGHIRETt9zORDuT7W/nksQTmRMmXPSHpoUgsaOIWicKrCES7bnv/cJBdUpIjVM+I6R1qjxnANpqRcmSKJGzr1yEcpndm5m9x+AQ0tgMCuzxCFvj5h7kaBHZ1bPAajVJiM8CbHfJN9ZVJSrKzpv6VfCNQcXNLMfEMnE6w9+tSKzxJdXoDYWc75Yn2IepV76VdVWWbZqZW4YiM1SwJG9NOcVTRoFzDBF+Z5TDEx2b0woqawmW1lfF1cmXuSs3k/bZSmJDhUivlIbPFZrGnKiLeI5SZj1aNWqdaDGly7R6yMJX/e5oOHa0HL+nf6D4F/qgC1Ip9emBlQJHcJkKAv2mxHXQ194VLMhA3OqlKozWYiDTvq7NvMCEffVb4vqNfAXtCky3FrQwVDe21U1W1xV9L9xCTKwpc6QV4y7r7GbnLnRHaKAF+tlNUbraFRwrBTYl1Boh7f2p+eSdMRnLKJw3tqa9gRK4n9LeaB9pXoyHfdIHpDuplnmjQAo/xThZDuX4x5/UGSlibH9RcuHfUHXsEap3ZfNIHjxGnadcwheQXlHQltiziATFtli+xXFsBTiakduW7ToAhd9Gs99Orf+5T8ivrINMZwL4NWLywTm8ME+LKhD0Qz+fsoEiQhHnRJteTmTgUSdzFuZFpUKuz6DTKCF+qn7oG758sz8N1nvQrKwdT3PEoc77eHdCua4YpeJBH1I/GvYUsEuvxkvmlfjUqIjfxYeWxpQalYqUCZ46l9bO/l9cyZgmOHnloBBybv3JFVUy989ngJ8r2v7Wd2467DAEBSUEx5QZOcTtJlve9b4I8rca2CvDCl9f6JEFB60MmqWTMABjScLfpTvcGreauTi4o8uLDUV1W9aRlHsbCy5wTz471SzZp6rH7kvvRsn1uOfDOGUV437OeAv1FSrEJA4mF/bntQbkQVIy2y21+HeVpxauUye/O5IOaMMsZKF+SVH4FF3vHB5QOp1uKxyKctht65RBPjLoIRXFG2mxo3josXutJWL+sMevwnFAiW8O9y+RHALt51/VtgSclAcs0Ge7C6kYVcbUK/WPyJaKRP7dfxNI3M4KL00nliJG9UVYRyUTjxQct5NWyhJANsswy5yMP3FLCJO1FPezPbOttkczDK/xjqUWwiUidUy9ckdeTYVRoMR3roX7SuF/8D8EfbYZTU35E8395/+muwj08WHsYWv4nUq8bMzoi6dDeo3HovR+ijCMfotVYP2c2Na6482gt20ek57u/3LN6awvPmRD/De/AaRX2Uz0mC62tb7jeoLgyVD9xiQt9MBUBSfykTP0S+jCzK+nDDKevjORQu0AYeF6e4N+IrbQMpS+xsGYaXojiK6sN56xq1nTnY1aVHfdlaNTXzTmLAXSVftK/WH0MH/1TZo4hVDWB6HR9xNqel9kcBDQcHBSA+0LfN2jOfN+FhAT5W9BdTHSSlG47izzXbb/xFpOQSsC7kPlHpuLKniPeLOCesychjLKV3o3fwHDcTRb/V5lXiVrrvnvXi8skn9v3JjG2u8f+JYfKyu9Fv0gahKijSWBk+BqqTpgsK9w6lG5D+uowVx4wD8RXHEob5fGB1QsoG6KjT1WHaAO+oEMXeaux3O6pov8LPCmUmw+UNgY1BHIxj0Xl4zUU1lmFzyA7/uH0eyFpnUvKQ1emYh/3lQSXVg1ohCoVzU0vxkUFOycLs45eYZClWaw08gTzR9Y1ISwjyZLxFUdiMK9fPVuR6+2GNiPwolAz09xJ0dw/4/uD+yrIb+M9507IkNnsPurA2x94sGha6DwlqLW/4S7I2AA5VBbkaKV+tDCFfVGqC33DTDBHlicx31ZIw5tRPNt8HePOyHlqEmwvlqvkCrSYhNZRp6uzSo4EJfNsjSfPeR8AHmIZK2Ulym0BNsgPeqeC2m3gMnJSwW4M0J/35LRBwLfIXvt2qB9Qb0oY5905WYoxUZk17xDLd13lLg10sHKqESq2SmDVAZHAY3mpXeqIJ0ku3sGZ7IsP5dY0dqfhFQ+0gHrT8qwtY7iNrxMSLRpLzvhP7o6kH9wEoSRJBOARM8twTMs4TxIeRGejN2jU3lwiAPUcAUEadB6L75M3a9+w2t+nlcau1qkNb3MmxHuoPqVuWVR3AB+mdRwkFNQz6wGchLITjVIqlTU62mOoQUFCn/fO1eGWKY7eizjIjxjKSMpwXL75ueKVRS4t5AvGtVOzTFpRsM+L4fzOAI7xRiXrrDc0MTVB9qUKjuw+ZcqTCCyK+Ob2TVwUJYabEMzYepcLSyrh5VEuqohCHSlaLXCmFrwySgQDik1ETuCxER3gr2BfLTYLTL8V2BYXBmGBJi/4paZVocMG+AlnminGhbNPFLzm7B+79EJo3Ps/AYvSNAYCSQtDKG+eJ0MZdhkQkbQQTPX5IDpZpmwt139NVW7A5qZw3FZpoh4otDeqMWdCDSdyVKdVUtNH9pb+y5+14xBF4tuKw3WufW/Z8+6ei/zKcYqeoD3dhk2h4OIPtvysmD/7jWLxWUFywhTJVbKItXsEEH4SbFizfWjb8JUg4lJIwhu6V07gV6cEHCF13c9pMTPy6BgaSpNP8e7yrFDdJxwIi/QWpA6uTX00z5DstP0sXliSywD5lwqZ1PBgbYKNAAGS9wpBAS8kXDNV1yzhtuxIOAHvwk2VQjk3+H3kHrYuvNpSYXIAPFm12BtVyCUNiMoABrUZK7jj9RoZvjpYFcXVoJ39hyE1HcgzfZ9P5XAxR4ci5if7G/F9uSk2e0V/sQ3HCaTFQIR0R+ZnlmkQhA6pEcjFeoae/EG/U7orQpZMEZhLZEzO6XbivREAn0e9UR6iujSsslfm5fCpEF/bvAXGDPBIHKa8Eivo4Il7941VGAlc3G/ORiQkFLEREFL3T73LpxyBSDNdh5VgVWckzeQZL9fPpBlY+PElKBy7RxFbeUzGm1zxQeP8A6DEzG35A1WHJGYxp1k/6hkSwKTRUqxJDjKd5dzh711XbGlZfLKmRFJ4vSgYVAaO9RNM+2anRixiFVJ5y0XAj1YyNIoR0vstSPky655bIafALhG5tdINZASE2mNuF5DYwKSuuaU/mbAlg7htFPKm47K+iTJG7yU9yT06aMBxynYWaD3DUElsZcAzbEq4VfEYAOBPqc5LtnY8tGHIBN799lDP8vE93K3oh/xx2+rKxkSAEF5RX3Kxvmq6q0ostNlMM98R0xOu1i4hz2vOpJMhs3TL0He1OoNEIDXSodkkVU59yhQP0JqbOEPT8+HSWRmhSJJuE6tM2tDoVgXVDJxZKOPveJ38od3yiGu00KS2FpWu7+BVCID571oDqwhhPlfOGpGBt63H5+NFbcPJMPC0WPkU766OLfRKecFnx6YhXqt0mADKA5OoHAIV5VuuekAvrLycl9AvoB2efn40q1/Fmres5TcSNOnfkKDfbo7tFKA/6/xwn8EsdRuW/fRfJODSIvkN/kNf0pCqi3cXdZFAQkW6Jocj9Kc+tmR8mN+ByraUmehThvqPxu/Yr1nGJqOsdx5+4Mt1+RIDPv/OIQdfdOuTyVhi4PtaH9TLkwqp1YsXyCmYBBDUm9gVbzW8OTR3BkKz4NYIfoVLK+OSXYOJi+DyOLeGP9gTrosDPdCQayrZkqcpiCBYcQMwat7p8h2t52JEMw903dVB72zwQhUzZG/wfbaxzZfbq75m5bplqKxjnQINBKPkf2YX69+ve9U6ImKR4NKuc9yw0RVDz7X0KXs7i9SYR4zUuKxKlELQR+YanoWtsb8yvlpLjaZV1OkLmrBe5nKDvOH8gjUOXyh5cB7h9A5LlBLwHTVNbrTGSAIU9vnw9cScsC6zGytEfHP/9UekmyvIBgwmqBjq7Tekvxy12PTA5ccjfe/Y837nA4T94be/5J6rmiJj4RU0BpWNLUC+X1JGb5ioL7pMfsxun26QWQtVp1NfMnnyrECEz9vrtCVsnet7o0/RtMpJC06zCHTOzElJ/fiW/58fd1oTkjcoyUXMFKoo0rry8O47PjsYreB5LN96kujUp7OZSyxcUqNBrSCKpjbOW/LohcqgPtKQeOyfJCu84clSf1yaQn2Ou1mvqqVlvpeW/Z6KpYU8/tvOFlpdsbUQETquVkJCCuBIy3Vc+C0TOZjxjnlphP4UjNho7/JZawPhw6Jod0gdJyPoIHqXZQxwheao5VcME7m3rqQNGI5NqFfnFhUiih3bGS2o5V2OCdfzkxQPTmUjxpXv17UVZ9qhSzNcPHrJuLd6mXlA+2fnsSlbpQ6lAKj7sXxQ4y3opDhn8MEl+D5IZGNClvsa1RLYuRpryEz0mAiEWTF99ZRe4dLM78UmB7xCRny53ep5Ft7d5hfqWHlRAhA2FRK4ENacRSQBusxJMTuT6QwNF8xMdJ5aAck7d+wkDZ0mBKVFRtT45Adn/rle2OQrXq+K30V4W6z9+2pqHxZz+NmfXGUlxqXB3BEKAMsIM1WUOScV/EkmrdZOGovM6pX9/96BWuvdy2ZdC8Ed2TYQd28iXhb9kaAAHkIHnEdObL+gVnsa1Pcx8C+fA+k6iRwvvL9EmsNPElFVIRe/i950v6iRm7aQF9hBf7JS7oVQLrZ9Swp5YFmfBu+DoYTzZTs/0oQ+MAhTtkteprcgz1UXQNrXnj0LQBMffS/LuhIaCtRLCh1xe/lT9ocpTvHIc6kpC4W6qBDaftRsQEP8fsnIoJwkMtcSySufP5pcc6AcXPYIMizHpnDYybuqZ5piBfSudJxlEf7AHlPlZenav850l991G6M1hAIM6jCU5MurLEi/0tFlvpXduV9ugDlkzH3k0OZ3gjQiFJNnJaWYzKlnaa2KzfkOC2muI0szkSYCLOReCUloDLSXy/fOpz033zDZ3fISSH+JqXGn5f7oSODzwNYdcEUnYBeEpV89/oKSsTrHa9T4j66R4HGoRE4o2skajsNeoGMMqodKx5X+/ugbS3Rk1JO9BdAcqVtKNw8iFeoBxEyYgXh3qlZ48+LaNYnrIvvh4JZPiIln/jgh6GolmgN/axxbf4jkDTBsJh8KAds7FNM/iBvLfw95Yrn+V8CTMvzKZQITNZwzMbFrYuNPVBnprkzlkUYSxDL/DIJdVv0cHMfFm4k+Ek5jerlU6P44gPC30nZoA+kPPIiPEoGgi887s7TraRzrA0lU1lfjGkFJQbmuqEO1h1DGu5ETG5KPVTqTQvA/OCRcw3pXTjoTlqOMRGgFM6d5b2ncog+gUi1J2EJBKhwXLwDRMeafFP7yVGn23JoDDpdIo+S2wMV5l1dBT/MchTqbOJEtOAdT/qsL4bU/2+u7bx/W+TwGwPvhffpR7VAevqmvlC+p3meJdsGndl7u3bhwvM5SD2M8bBcLC+RJ+W354AsLZJPp2PaSntOkxOSjWx+PeZjxvEfBKhmn0ws+MBeKM/3pvS7XKrZQA1szllSIFpTcd+wCko7DBOHMLlJZoAvsAJJ1EB7emXBsL/YPRb0K9+VyGwajJWI3/Uhg4IlREeWSJremtemNZ7ku7gK1Hy7bPYhj3XDHVon1I40/j9QTrKz2F9xQnVbcxayiXR2nwbo7ctpAD7+bzLt9pObP+HoJgti+JqEwKLfkNyBP3AK816TN5qPgZMRk2ii5KRJ3PfIZTZRtPdacIIg4oRGX6ilmdcM6I+WpYlBOKbUtI+6h1USyRkt/pGcjB8Y2vSyrbT7lZjHEqUI7SBmkif74gL0Br/0XHjOPfWyM2iupy8XE69UsEIXLA4L90Us6CSw2VCZU26ocR3/RfrbebhOL+Yl+S6k266I8LWT0qngUskN2tfxNKi+jATWIazHEbm8nnxdE6U710+JAsLmBSQOtwJywR/LOVO8MHZKcJtwhZcpg8o1lV43tfHq3OJr+591lPNv1Ywt05o3OPwb2QSe/vJcNXIjamAACa2qr6sEnamUjBtHoVleKeD1rIDPh6IIhM1h1pfvuuCppd5KLXl21iL/f5OXNTabs5Ia6Jxh5ctTFK3yGjroVq6JJcDGU1qib3SPJzr8OW83XtItm6UwGO50vY7RuOPJ6tonz7NXI5CZSLZthijzXvgosxiVpnQhyribqnJWNCRWHdrVJA2AsQY0U4M96cVLb94TbZViWwTCeheBEuYvfrgCvRo5hdIsKLm8dxHmFU794qpodiEhVMV4LEecyWNQ3MmP+MDweMAj+IbLoJrJAvH1227iE+u2HFMV7HE5b+NE9qaLiPU9NcKttEdeDFhbLpkWbRfTJ5DNr3VVzh+GkFM26e+Egqw3a4kJjFpDMFA0VibimdklZEJs9UZo06ag2vQAXxCrYfGOeb78wGiZRkcJFjoONwZZsgDgF4Q1P8fFqdyZFpdGOGPb1zwGYJRqxPXfdU+x9MD/ezVHO0j1Ojg+XMP9cdlT8hlT2LLa1FtXnFw9US4gQdG9fTEviQvh255QjhNO98lpcvRBeQPYD83a8jfBC91uI2PTJXTQPh4JMu3aXZR912G0pPl6WDdqdQmXG9MM968TnUY8CpkqgIdxCggubwMV2gHNu7zM/psFpOXPp73DYm6taUhF3X0gt8774ZR086bDJjv0yfA6feEd6RWRONg1U3+nGczJgiXI7Q4Kp8/LEH5ccy3qrNx7YWMks417T6Ltimny6rzTpxGAnCyX6SdJ1JvixnmPB/iOYYWCNbgDFObWvc7FullNjvF/0p4iGJwCkMUU8iSFl65iQhcgILgrd100WwOpPdJBhF2A0l8N2/phYFW9NxqJbzr9fM/YPGRB+s9ZXkBdnMWdwHQoj+RuT2rH5AMrJAqow3yVVl+Bnt+SVeCl8H9fHFzKnR0y+U0vBMymdiFjkGU6RV7MwpLnLK1HK8sYob7h/2U+wja6kbjKVfc/cSrSCKytbIQfAOaRCcY3uo7zemDG0e5JlsWDHMwI0TSsBn3RGmIfto/Ctve18t4fIJdZGNFeM/5FUqRN1vXNev4TlPGwtDjBhug3n2NZVz7zg/ksvlozfGyGHq3itjcVgR4VfVcxQYItXO4W9N+AG4URrj9XB9CX+LKqgDggebEvPvjkvs5yspufhzKMUYpm7BoSw7XPtqO5M1lX9ORCkZbjd1MkVHUJLmeF0w7JuPJyAwJvRbHnQviy2zOPCnlWKbxR0CCJk5rxw2cSVDDlmE2euFkTc7RWMl0cKcsD8fEVvUbbKdt4LI5kSUCo9RlY3MaChivdF5YGI1/+JJcMboDZEs0hDbVQiruJ9JPq6XPBUyJjKHYpijfHJ67FgyGbWvK7UusF1M0WCM11NziPIH0mCemVMF6pN8fupi5PmLIcjB3zAlIHkNWpUrp349Ao+6cV9a4Bm3SOO2s5CvpSWeDOxua+EQ6Veaf0MkBbyZxFi7mtUiPCcBWZMWSyUL4FVhLNjMBn9AVpT3frQW0YTO7bImmyqLwH7+4XDpRZtT9mGdaqqdst7AQxFKx5OhttXo4BjhZFxFjWTRPQaI3pfw1Z50tdY9OtMg/8A9MMqbjCE22mv7gmAgfvIJQzpn+9MzgQLi/3QQ+tcGCCHU+Bs8+caxvuN6ooa96XU/nCBY9ZPZRg66U9F38IwoJwBQsnjFddWIFqn71v0j8edurXJ0XjZxmOo29dW8xKOaU4FMy/4Ioi4QmkN3e6xHj2s/SY9QDzt2J8zdh/gvQLBnntO9gH43yJYSbKEEt4RidU9HvKeqcd5GPm5P6Ln2LI1pSZw9fdGMpINsnMDNvZ8pMhe1QOZHLPV8QXw8PhbevhocLNMzj2F35i5G4ckNLUpX7dKkuHqfp8DsZ9GF9rMnuApLi6kP1bcC3Xl8xyWGDNYYA9tuEwEI+te2Z+ooQF7IySQs2KehDT8rwZXRodi7dhyACr5UG4Vaf0PciXMb7KR8S+ZDJlNAZE0d5N7ocQBHtO4SxmxBg+qnd6ENfnDb+lnp8e0R+iGMd0siHsaA3HxSXrKTk+T1Vq6yBldOyIC0xa8PUNYlm0Pt6UVYMUl+s/dcd8sJgUBs0OmX7vqAd8ehGx78BWcrLDtOmtxgI4UJUvgbzPR/Rqqnajm6kzB1Y1dUnlp/UaG8E9iaCV9fJGc+geCcfXZJ4CQKL+s9sbH1/Kz3VOMEDhe5mD7TROCrLx9jhKzJRVJYwOpgVHkk55EvPRAAtFTh5Xg/zI8W+QgJs7BOpqNhosa20UCn73ESewvdYHJZhGFqKRZCrSWgMcZ8xVi+LjqXCP1NYguxqbbYkZ8vsPIYE0ra7yOifIpSzhd3tAomnzHkz1o8ixkgf+4IGqAAu23F0lt97mwrBSNNWTX07KN0SSdpXjQJG+Vk5YDvxx2j8GVonZkhz6laWBLFdO9lWJj0+u2MJJBgEJMoGMe0GI8uiKxoysBB7gJxy3f4y7wvWk43u4KWfSIipxiHiBh69fIuJ8qwUhF7PpKZzoryU9r8lSsI2iRhgygIdyjqA2SFGO/5qvhU21zU4ZnitmvH2lgmboA1Ln2H46gOL50CsUzWaloFNMKK2eRNfN/sivPHJ4zUxAerTgARg8q9Br2Une4seXzacqFjmv4I74pYG6vewATdD6nMHuwUQzOOh0wlRJJrlxHqXEvWUAXtxCe1IZC25HZP23mLZsKp8ZXP2CHtb2Xe1FuMQKPz/S4jhenyy8smm+aZdX4mJFTcC0alKYuxfL2tiZ11LRnM7vwjVqxe/rPsoas/k2KkYuABvNAcFH4pcvxEjXkUUkZBapk6yd7nWB+P8Bb1Ksvy2WNX5JY0aGS0qS/+6NnLhj55VoJuvRyXYt0t+Ae58cfsx1uWjZOW6Z4IenGJBu5L7GaimCC/AAGP+/rwbASojM4NfTCTFMDeR5Jf9FmoPQUU6kvfuPr3f0eSbBIlHKEGuZdBNC0Um950kiQQRwkBmk01w0+YGlgBBItvSaEMGzlfNFECaJhtjaUhSVS1l//E8AywGFwU90BHDjbpzXAnme6RK0h2lAbTqFNQQHfxUp9S57zVmLUEFKZTdvcYXgVuFxN2IRfV8NmnSkSGJdtOFByOScOniF2eH5YV8m7fVM7y0KJb8EXKySGUJ1wv5Rp5t2zW9jlpL3LwGn4sgchXhwNgHOYr/5Rluqly6GqIHovuGJyAMlgk1eB4AAtMK24joqh6dC5tK+6bahB47ndADXohXlMWmZiEffhg8+q1cwOeDiWM5yR5V0heAaLv5p5IjC6EAT6c6+HACXnNYGAWlOSasdyvS57Vj/RMWUgKsuscMpND6QPpFHNrQYaWE2MTIoflvL8344rK1TX1tANhJRzsVzVkOBv7sq6OCFfof7QhaKVv1x+gA4Jt203IGMJMzzSR5wl8lF4h9CbyA80F+7d4YZeoeLRpAQMH9jzVEt5Ov/tCxAk7jarj98fj6spm5tDJImUaoinPP8jsHLmyVDRVYxBPD2mKE9PiQsgrSgXJ3000TK7QlIsuW0wo4LrehJoODBFj+1PWYQ9iXK9BAC1uRkh0cNyCb+mg+ci0ajalzlVyMoEZgAmxY+WSm/UMrMpQT+THtgBw0aBRRRc+ofl6acxqj8A003AKV3rUiICFGWE/NHJwbm71q/byrsaUi4GSd6MN0otPSOaj1YAgz3Z/ABEOSZFhcj5FaA8M2B3gkj8B34s953LE/CxtN1gFOkONMUiUjV1dl30ReeVWSeO2s2uquSXX42UwCkL3ekAv+kveqXlgQnSMBJim3raSef4Gdlemf9kEumyuxwW9CIk8pcQd2b9k2JK60bLmr/vBARzVi+Gy15WPSIpZZs+BtJvWNqA6TvIg8spSsSPFAGS9WWxksTE3GWbWBl3suHxPXzLjKFtXcgEc0XBHZcAI6r3vdBGWPCYp7zObUeDhjvkTON2XAUjqj4YBjl6qK5sQs2KWLTketKR592Z0XY0VQQMrvigevQkXt6ZB652+Rcsvug+QIqAVU0SjGellc7FPKWDjJMfkKlp05Ru0q33G95wDqQEx7LfoeHNoAEiBKd6MiO/pcviPlsGxK7CxpveyjX+uoEDjBRQibtyN1iMDcW6AIAsASziGpUNJMJjWDBFeCZnnOPtS+839cJC9AdhhBiRIeBmgUrgCYlzYQMAFuKRADg5imht2Gu6pNk0bHuf13X2FuRppMvH3ynA/brjjVU1n1t7anlrdG1bPDTdNbVXDmNr1oX6lxaG/TRBIA5sOLyWNL9G7q92R4SBukr1jqO1upo+0xaS1GAydEuyj6OAnCEq8D9Nu2bwdlg7bfeKKk5/G2wKOfAUVxc1YnmXvIk8YOsDvGalzP++kodR7dvBiSxwiRRmEnqEWAfqRvEx2OognMDyrA+LGhiww/sVYfvkLOspgQN0dfSW2AATeHmaCbAa+TWoVWKZAGq+6VdNQFpwwxYDrDeJSU2JKeyTfrdC0Yj37P/ZFiz5oH0JoCTXciCmPYTjFrRbJgib6vWJjiGfhCe5pND9FVnJx9NrmecG/ciCd8gqqZK+9oDyPht59W7JZIYY6hbST/MPrhTUVYgOe7H3RGr1BNpwH2+6JuclyQcef4dpV+07ZMf/Yqq68ssj1k2vmlDqA9OCRov+y/w70iiCOMVWppRyDBYtoLg2hifdC1TvvsjSjNGD2bEefsDm/CbuVkIg4nbuqaAeNig+ITnR3LgQn82tauslteoHFYTA9gYRBpejRHY/jHSarcFnh2FSBhx+6zyG8GOZDNXGcmWFzWx68niBM5fcHAC94pAZn/76CWNdwUVoaZS3krJ+4RbqjYVUzXeTNlBurz7GGVGJYEF4Ksxz1Ai2FUAHQHce5kFIw3BYEzjPMZXnCoYwaf5v3WDWgjgChJFI+jaWGjJnbT9sm9YeGCF7+Cbc+DHvPtqYIq4ORLKEoY/WKJj4A3+oA6O5u/JKTHQMSla5G9Y7uZzPWsFgesrHozJh+1VxVdvZiGGlaWyVvkXhms72gdm18BbXfJz/bUivedyiK2LbcEuBmmjqeutmu36gNHb5xOofeLv0MPjdiBYyct52Q/NfUkNm+OC+zq+87Mz80/QCCTZsAp4YQf5tgwHVnGlNNWQJPf4BrNNQBScSmfFH0Aza62OdCcqbGZ4WefjOd9onwkKu9weyp8VzaIx8owZ6zkzSCKv5CKyO1RFhL50r7/y1AxKLoBaDwpj5PZRjvShzriRGm/B5RDLl0eoGCn+J0p1HMiHv5mvRLlOppE3p2Gl4uT1iJnUlFX5btxml618CN04azdrNeQ2CoY6eqZH1nm7QhbyJAs3YeazxoAODu+TGkIqHsa1IjIumb9LkHZZShBp0OqLAlBG0n8Db4qhXji/7+ex0oTKTxN/Qm/BmO4lSWgLaE37LtDHVyiQuvwQkNpGLaDdHN7jZas88MFf0PzygNqgbIAKUgT7zEXBzuI64tmIVxxpypZJHdswuRgdc0mOcvjbJ1SBFGpovqNF/zRjHk1QrfPnn7hvYcNCSoLrPhMT/UAAAA=';
  const format=new Intl.NumberFormat('es-DO');
  const dates=new Intl.DateTimeFormat('es-DO',{dateStyle:'medium',timeZone:'UTC'});
  const style=document.createElement('style');
  style.textContent=`
    :root{--dfc-violet-card:url("${artwork}")}
    html body #dfcDiamondFlashcardHome,html body #dfcDiamondFlashcardPanel .dfc-diamond-flashcard{box-sizing:border-box;background:#281b67 var(--dfc-violet-card) center/100% 100% no-repeat!important;color:#fff;border:1px solid #bfadff;border-radius:9px;text-align:center;text-shadow:0 1px 4px #0c0839;cursor:pointer}
    #dfcDiamondFlashcardHome{position:fixed;z-index:2147482999;aspect-ratio:2.54;animation:dfcLabGiftBounce018 3s ease-in-out infinite;padding:0 2px 3px;display:grid;align-items:end;font:800 clamp(7px,1.15vmin,11px)/1 system-ui}
    #dfcDiamondFlashcardHome .dfc-diamond-count{position:absolute;top:-5px;right:-5px;min-width:17px;padding:3px;border:1px solid #eee6ff;border-radius:99px;background:#4a2692;color:#fff;font:800 10px/1 system-ui;text-align:center}
    #dfcDiamondFlashcardPanel .dfc-diamond-flashcard{position:relative;isolation:isolate;overflow:hidden}
    #dfcDiamondFlashcardPanel .dfc-diamond-flashcard > .dfc-diamond-art{display:block!important;position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:-1;pointer-events:none}
    #dfcDiamondFlashcardPanel .dfc-diamond-flashcard > :is(strong,span,small){position:relative;background:#170d43b8;border-radius:4px;padding:1px 4px}
    #dfcDiamondFlashcardHome[hidden],#dfc-z9-floating{display:none!important}
    #dfcDiamondFlashcardPanel #dfc-z9-modal{position:static;inset:auto;padding:0;background:transparent}
    #dfcDiamondFlashcardPanel #dfc-z9-modal .dfc-z9-sheet{width:100%;max-height:none}
    #dfcDiamondFlashcardPanel[data-tools] > :not(#dfc-z9-modal){display:none!important}
    #dfcDiamondFlashcardPanel[data-arrival] .dfc-diamond-actions{display:none}
    #dfcDiamondFlashcardPanel .dfc-diamond-actions{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
    #dfcDiamondFlashcardPanel{width:min(90vw,580px);max-height:85dvh;overflow:auto;border:1px solid #aa94ee;border-radius:14px;background:#161333;color:#fff;padding:12px}
    #dfcDiamondFlashcardPanel::backdrop{background:#09051add}
    #dfcDiamondFlashcardPanel[data-arrival]{width:min(96vw,760px);padding:16px}
    #dfcDiamondFlashcardPanel header{display:flex;justify-content:space-between;align-items:center;gap:10px}
    #dfcDiamondFlashcardPanel .dfc-diamond-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,185px),1fr));gap:10px}
    #dfcDiamondFlashcardPanel .dfc-diamond-flashcard{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;min-height:106px;padding:5px;width:100%;aspect-ratio:2.54;font:700 clamp(10px,2vmin,16px)/1.15 system-ui}
    #dfcDiamondFlashcardPanel[data-arrival] .dfc-diamond-flashcard{min-height:150px;max-height:65dvh;font-size:clamp(12px,2.9vmin,20px)}
    @media(prefers-reduced-motion:reduce){#dfcDiamondFlashcardHome{animation:none}}
  `;
  document.head.append(style);
  const button=document.createElement('button');
  button.id='dfcDiamondFlashcardHome';
  button.className='dfc-diamond-flashcard';
  button.type='button';
  button.hidden=true;
  button.setAttribute('aria-label','Tarjeta de Diamantes Flashcard');
  const badge=document.createElement('span');
  badge.className='dfc-diamond-count';
  badge.textContent='0';
  button.append(badge);
  function showCount(value){
    const count=Math.max(0,Number(value)||0);
    badge.textContent=format.format(count);
    button.setAttribute('aria-label','Tarjeta de Diamantes Flashcard, '+count+' pendientes');
  }
  home.append(button);
  const dialog=document.createElement('dialog');
  dialog.id='dfcDiamondFlashcardPanel';
  dialog.innerHTML='<header><strong>Tarjeta de Diamantes Flashcard</strong><button type="button" data-close>Cerrar</button></header><nav class="dfc-diamond-actions" aria-label="Opciones de diamantes"><button type="button" data-diamond-tool="send">Enviar diamantes</button><button type="button" data-diamond-tool="history">Historial</button><button type="button" data-diamond-all hidden>Reclamar todas</button></nav><p role="status"></p><div class="dfc-diamond-cards"></div>';
  document.body.append(dialog);
  const status=dialog.querySelector('[role=status]');
  const list=dialog.querySelector('.dfc-diamond-cards');
  const all=dialog.querySelector('[data-diamond-all]');
  let busy=false,request=0,openedFor='',toolsPanel=null,toolsObserver=null;
  function returnToCards(){
    toolsObserver?.disconnect();
    if(toolsPanel){
      toolsPanel.classList.remove('open');
      document.body.append(toolsPanel);
      toolsPanel=null;
    }
    delete dialog.dataset.tools;
    if(dialog.open)void refresh();
  }
  for(const control of dialog.querySelectorAll('[data-diamond-tool]')){
    control.onclick=()=>{
      const legacy=document.getElementById('dfc-z9-modal');
      const tab=legacy?.querySelector('[data-dfc-z9-tab="'+control.dataset.diamondTool+'"]');
      if(!legacy||!tab){status.textContent='Las opciones de diamantes todavía están cargando.';return;}
      toolsPanel=legacy;
      dialog.dataset.tools='';
      dialog.append(legacy);
      legacy.classList.add('open');
      tab.click();
      void window.dfcZ9Refresh?.();
      toolsObserver=new MutationObserver(()=>{
        if(!legacy.classList.contains('open'))returnToCards();
      });
      toolsObserver.observe(legacy,{attributes:true,attributeFilter:['class']});
    };
  }
  dialog.addEventListener('click',event=>{
    if(!toolsPanel||!event.target.closest?.('[data-dfc-z9-tab="cards"]'))return;
    event.stopPropagation();
    returnToCards();
  },true);
  dialog.addEventListener('close',returnToCards);
  all.onclick=async()=>{
    if(busy)return;
    busy=true;all.disabled=true;
    try{
      const result=await rpc('dfc_z9_claim_cards',{p_all:true});
      if(Number(result.cards)>0)void window.dfcZ9Refresh?.();
      await refresh();
      status.textContent=Number(result.cards)>0?format.format(result.amount)+' diamantes acreditados en tu tarro.':'No quedan tarjetas pendientes.';
    }catch(error){status.textContent=error.message;}
    finally{busy=false;all.disabled=false;}
  };
  const account=()=>typeof me==='undefined'?'':me?.id||'';
  async function rpc(name,args){
    const client=window.dfcSupabase||window.sb;
    if(!client)throw Error('Sin conexión');
    const {data,error}=await client.rpc(name,args);
    if(error)throw error;
    return data;
  }
  function place(){
    const rect=flashcoin.getBoundingClientRect();
    button.hidden=flashcoin.hidden||!rect.width||!account()||home.classList.contains('hidden');
    if(button.hidden)return;
    button.style.width=rect.width+'px';
    button.style.height=rect.height+'px';
    button.style.left=(rect.right+6+rect.width<=innerWidth?rect.right+6:Math.max(4,rect.left-rect.width-6))+'px';
    const flashTop=getComputedStyle(flashcoin).top;
    button.style.top=flashTop==='auto'?rect.top+'px':flashTop;
    const original=flashcoin.getAnimations?.().find(animation=>animation.animationName==='dfcLabGiftBounce018');
    const copy=button.getAnimations?.().find(animation=>animation.animationName==='dfcLabGiftBounce018');
    if(original&&copy&&typeof original.startTime==='number'&&copy.startTime!==original.startTime+480)copy.startTime=original.startTime+480;
  }
  function draw(card,action){
    const element=document.createElement('button');
    element.type='button';element.className='dfc-diamond-flashcard';
    const image=document.createElement('img');
    image.className='dfc-diamond-art';
    image.alt='';
    image.src=artwork;
    element.append(image);
    element.setAttribute('aria-label',format.format(card.amount)+' diamantes, '+card.origin+', creada el '+dates.format(new Date(card.created_on)));
    for(const [tag,value] of [
      ['strong',format.format(card.amount)],
      ['span','Diamantes Flashcard'],
      ['small',card.origin+' · '+dates.format(new Date(card.created_on))]
    ]){
      const label=document.createElement(tag);label.textContent=value;element.append(label);
    }
    element.onclick=()=>action(element,card);
    return element;
  }
  async function refresh(announce=false){
    const id=++request;
    const uid=account();
    if(!uid)return;
    if(!announce){status.textContent='Consultando tarjetas…';list.replaceChildren();}
    try{
      const [daily,wallet,prizes]=await Promise.all([
        rpc('dfc_diamond_flashcards_pending_v1'),
        rpc('dfc_z9_status').catch(()=>null),
        rpc('dfc_z37_diamond_prizes_pending')
      ]);
      if(id!==request||uid!==account())return;
      const cards=[...daily,...prizes];
      showCount((wallet?.cards_pending??daily.length)+prizes.length);
      if(announce){
        const card=cards.at(-1);
        if(!card||dialog.open)return;
        const key='dfc-diamond-arrival:'+uid;
        const noticeId=card.prize_id||card.created_on;
        try{if(localStorage.getItem(key)===noticeId)return;localStorage.setItem(key,noticeId)}catch{}
        dialog.dataset.arrival='';
        status.textContent='Toca la tarjeta para guardarla.';
        list.replaceChildren(draw(card,()=>dialog.close()));
        dialog.showModal();
        return;
      }
      list.replaceChildren(...cards.map(card=>draw(card,claim)));
      all.hidden=daily.length<2;
      all.textContent=prizes.length?'Reclamar todas las diarias':'Reclamar todas';
      status.textContent=cards.length?'Toca una tarjeta para reclamar sus diamantes.':'No tienes tarjetas pendientes.';
    }catch(e){if(id===request&&!announce)status.textContent=e.message}
  }
  async function claim(element,card){
    if(busy)return;
    busy=true;element.disabled=true;
    const r=element.getBoundingClientRect();
    const jar=document.querySelector('#dfc-z9-home .dfc-z9-jar')?.getBoundingClientRect();
    try{
      const result=card.prize_id?await rpc('dfc_z37_diamond_prize_redeem',{p_prize_id:card.prize_id}):
        await rpc('dfc_diamond_flashcard_claim_v1',{p_created_on:card.created_on});
      if(result.redeemed){
        if(jar&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
          const layer=document.createElement('div');
          layer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483647';
          dialog.append(layer);
          for(let index=0;index<12;index++){
            const gem=document.createElement('span');
            const x=r.left+r.width/2,y=r.top+r.height/2;
            const angle=index*Math.PI/6;
            gem.textContent='💎';
            gem.style.cssText='position:absolute;left:'+x+'px;top:'+y+'px';
            layer.append(gem);
            gem.animate([
              {transform:'translate(0,0)'},
              {transform:'translate('+Math.cos(angle)*80+'px,'+Math.sin(angle)*65+'px)'},
              {transform:'translate('+(jar.left+jar.width/2-x)+'px,'+(jar.top+jar.height/2-y)+'px) scale(.3)',opacity:0}
            ],{duration:730});
          }
          setTimeout(()=>layer.remove(),760);
        }
        window.dfcZ32Audio?.play('flashcoin');
        void window.dfcZ9Refresh?.();
      }
      await refresh();
      status.textContent=result.redeemed?'Diamantes acreditados en tu tarro.':'Esta tarjeta ya fue reclamada.';
    }catch(e){status.textContent=e.message;element.disabled=false}
    finally{busy=false}
  }
  button.onclick=()=>{
    delete dialog.dataset.arrival;
    if(!dialog.open)dialog.showModal();
    void refresh();
  };
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  function update(){
    place();
    const uid=account();
    if(uid&&!button.hidden&&openedFor!==uid){openedFor=uid;void refresh(true);}
    if(!uid){openedFor='';request++;showCount(0);if(dialog.open)dialog.close();}
  }
  new MutationObserver(update).observe(flashcoin,{attributes:true,attributeFilter:['hidden','style']});
  new MutationObserver(update).observe(home,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',place);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){update();if(account())void refresh(true);}});
  update();
})();

/* Tipografía integrada en el arte de ambas tarjetas. */
(function () {
 const style=document.createElement('style');
 style.textContent=`
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard {gap:2px;padding:5px 8px}
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard > :is(strong,span,small) {
   background:none;color:#f0e5ff;line-height:1.13;text-shadow:0 1px 2px #1b104d,0 0 6px #180f41;
   padding:0 3px;letter-spacing:.015em
  }
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard > strong {
   color:#f6eaff;font-size:1.14em;font-weight:850;font-variant-numeric:tabular-nums;letter-spacing:.025em
  }
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard > span {font-size:.84em;font-weight:650}
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard > small {font-size:.76em;color:#e1d4ff}
  #dfcLabGiftUser008 .dfc-z31-gift-choice .dfc-z32-card-date,
  #dfcZ32GiftFullScreen .dfc-z32-native-announcement .dfc-z32-card-date {
   background:none;color:#dbf0ff;padding:1px 4px;
   font-size:clamp(9px,1.55vmin,12px);text-shadow:0 1px 3px #001225
  }
  #dfcLabGiftUser008 .dfc-z31-gift-choice .dfc-z32-card-amount,
  #dfcZ32GiftFullScreen .dfc-z32-native-announcement .dfc-z32-card-amount {
   color:#ecfaff;font-size:clamp(13px,2.8vmin,22px);font-weight:850;
   letter-spacing:.025em;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px #001728,0 0 6px #08244e
  }
  #dfcLabGiftUser008 .dfc-z31-gift-choice .dfc-gift-origin,
  #dfcZ32GiftFullScreen .dfc-z32-native-announcement .dfc-gift-origin {
   background:none;color:#daeeff;font-weight:700;text-shadow:0 1px 3px #001225
  }
 `;
 document.head.append(style);
})();

/* Importe visible en las facetas de la tarjeta de diamantes. */
(function () {
 const style=document.createElement('style');
 style.textContent=`
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard {container-type:inline-size}
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard > strong {
   position:absolute;inset:30% auto auto 50%;transform:translate(-50%,-50%);
   max-width:35%;padding:0;white-space:nowrap;
   color:#fff;font-size:clamp(24px,13cqi,76px);font-weight:900;line-height:1;
   letter-spacing:-.055em;-webkit-text-stroke:1px #432363;
   text-shadow:0 2px 1px #281052,0 0 6px #371b6d,0 0 10px #6b46ac
  }
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard > span {
   color:#f0e5ff;font-size:clamp(12px,6.2cqi,34px);font-weight:850;line-height:1.05
  }
  #dfcDiamondFlashcardPanel button.dfc-diamond-flashcard > small {
   color:#ebdfff;font-size:clamp(9px,3.9cqi,16px);line-height:1.15;max-width:94%
  }
 `;
 document.head.append(style);
})();


/* Marcador y cierre de mano de la mesa gratuita por puntos. */
(function(){
 'use strict';
 const panel=document.getElementById('dominoTablePanel');
 const stage=document.getElementById('dominoStage');
 const controls=stage?.querySelector('.domino-live-top-controls');
 if(!panel||!controls)return;
 const style=document.createElement('style');
 style.textContent=`
 #dfcPointsScore,#dfcPointsResult {color:#fff;background:#101f3af5;border:1px solid #dabf70;border-radius:9px;font:700 clamp(10px,2vmin,15px)/1.22 system-ui}
 #dfcPointsScore {padding:4px 7px;max-width:min(42vw,270px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
 #dfcPointsReplay{position:absolute;left:50%;bottom:3%;transform:translateX(-50%);z-index:182;display:flex;align-items:center;gap:8px;background:#101f3af5;color:white;border:1px solid #dabf70;border-radius:9px;padding:6px 9px;font:700 clamp(10px,2vmin,15px)/1.2 system-ui;max-width:90%}
 #dfcPointsReplay button{padding:5px 9px;white-space:nowrap}
 #dfcPointsReplay[hidden],#dfcPointsReplay button[hidden],#dfcPointsScore[hidden],#dfcPointsResult[hidden]{display:none!important}
 #dfcPointsResult {position:absolute;inset:12% auto auto 50%;transform:translateX(-50%);width:min(84%,570px);max-height:76%;box-sizing:border-box;overflow:auto;z-index:180;padding:10px;text-align:center;box-shadow:0 8px 25px #0009}
 #dfcPointsResult p{margin:4px 0}
 #dfcPointsResult h2{font-size:1.4em;margin:4px 0 7px}
 #dfcPointsResult .dfc-points-tiles {display:flex;flex-wrap:wrap;justify-content:center;gap:4px}
 #dfcPointsResult .dfc-points-tile {display:inline-block;padding:3px 5px;border-radius:4px;background:#fff3d9;color:#102032;border:1px solid #bca67a}
 .dfc-point-coin {position:fixed;pointer-events:none;z-index:2147483646;color:#503100;background:radial-gradient(circle at 35% 26%,#fff5a3,#efb338 55%,#c58319);border:2px solid #ffdf79;border-radius:50%;width:25px;height:25px;display:grid;place-items:center;font:900 11px system-ui}
 `;
 document.head.append(style);
 const score=document.createElement('div');
 score.id='dfcPointsScore';score.hidden=true;score.setAttribute('aria-label','Marcador por puntos');
 controls.prepend(score);
 const result=document.createElement('section');
 result.id='dfcPointsResult';result.hidden=true;result.setAttribute('role','region');result.setAttribute('aria-label','Resultado de mano');
 stage.append(result);
 const replay=document.createElement('div');
 replay.id='dfcPointsReplay';replay.hidden=true;
 const replayText=document.createElement('span');
 const replayButton=document.createElement('button');
 replayButton.type='button';replayButton.textContent='Jugar otra vez';
 replay.append(replayText,replayButton);
 stage.append(replay);
 let replayState=null,replayOffset=0,confirming=false,confirmedMatch='';
 function drawReplay(){
   if(!replayState){replay.hidden=true;return;}
   replay.hidden=false;
   const now=Date.now()+replayOffset;
   const deadline=Date.parse(replayState.replay_deadline);
   const opens=Date.parse(replayState.replay_opens);
   const seconds=Math.max(0,Math.ceil((deadline-now)/1000));
   const confirmed=replayState.replay_confirmed||confirmedMatch===replayState.match_id;
   replayButton.hidden=confirmed||!seconds||now<opens;
   replayButton.disabled=confirming;
   replayText.textContent=now<opens?'La revancha abre en un momento.':
     confirmed?'Confirmaste · '+seconds+' s':
     seconds?'Revancha gratis · '+seconds+' s':'Terminó el plazo de confirmación.';
 }
 replayButton.onclick=async()=>{
   if(confirming||!replayState)return;
   const match=replayState.match_id,token=epoch;
   confirming=true;drawReplay();
   try{
     const client=window.sb||window.dfcSupabase;
     const {data,error}=await client.rpc('dfc_z37_trial_replay_confirm',{p_match_id:match});
     if(error||data!==true)throw Error(error?.message||'No se pudo confirmar.');
     if(token===epoch)confirmedMatch=match;
   }catch(error){
     if(token===epoch)replayText.textContent=error.message;
   }finally{
     if(token===epoch){confirming=false;if(confirmedMatch===match)drawReplay();else replayButton.disabled=false;}
   }
 };
 setInterval(()=>{if(replayState&&current())drawReplay();},250);
 let table=0,epoch=0,pending=false,retryAfter=0,last=null;
 let dismissed='',shown='';
 const format=new Intl.NumberFormat('es-DO',{maximumFractionDigits:2});
 const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function reset(id){
   table=id;epoch++;last=null;pending=false;retryAfter=0;dismissed='';shown='';
   score.hidden=true;result.hidden=true;result.replaceChildren();
   replayState=null;confirmedMatch='';confirming=false;replay.hidden=true;
   document.querySelectorAll('.dfc-point-coin').forEach(coin=>coin.remove());
 }
 function current(){
   return panel.classList.contains('active')&&typeof dominoCurrentTableId!=='undefined'?Number(dominoCurrentTableId)||0:0;
 }
 function drawScore(data,animatedSeat,points){
   score.hidden=false;
   score.replaceChildren(document.createTextNode('Puntos · Meta '+data.target+' '));
   for(const player of data.players){
     const line=document.createElement('span');
     line.dataset.pointsSeat=player.seat;
     line.textContent=(player.mine?'Tú':player.name)+' '+(player.seat===animatedSeat?points:player.points);
     score.append(document.createTextNode(' · '),line);
   }
 }
 function text(tag,value,root=result){
   const item=document.createElement(tag);item.textContent=value;root.append(item);return item;
 }
 function tiles(values,root){
   const row=document.createElement('div');row.className='dfc-points-tiles';
   for(const tile of values||[]){
     if(Array.isArray(tile)&&tile.length===2)text('span',tile[0]+' │ '+tile[1],row).className='dfc-points-tile';
   }
   root.append(row);
 }
 function showHand(data){
   const hand=data.last_hand;
   if(!hand||dismissed===hand.id)return;
   const winner=data.players.find(player=>player.seat===hand.seat);
   if(!winner)return;
   result.hidden=false;result.replaceChildren();
   const blocked=hand.kind==='trancazo';
   const victory=data.state==='settled';
   text('h2',victory?'¡'+winner.name+' ganó la partida!':blocked?'Tranque':'Dominó');
   text('p',winner.name+' · +'+hand.points+' puntos · '+winner.points+' / '+data.target);
   if(victory){
     text('p',format.format(100*winner.points/data.target)+' % de la meta · '+format.format(100*hand.points/data.target)+' % aportado por esta mano');
     text('p','Bote ganado: '+data.pot_fc+' FlashCoin · '+data.pot_diamonds+' diamantes');
     text('p','Parte del ganador: 100 % del bote');
   }
   if(hand.deciding_tile){
     text('p',blocked?'Ficha que cerró el juego':'Ficha decisiva');
     tiles([hand.deciding_tile],result);
   }
   for(const row of hand.remaining){
     const player=data.players.find(entry=>entry.seat===row.seat);
     text('p',(player?.name||'Asiento '+row.seat)+' · '+row.points+' puntos restantes');
     tiles(row.tiles,result);
   }
   const close=text('button','Cerrar resultado');
   close.type='button';close.onclick=()=>{dismissed=hand.id;result.hidden=true;};
 }
 function sound(freq,length){
   if(typeof playOscTone==='function'&&(typeof dominoSoundIsEnabled!=='function'||dominoSoundIsEnabled()))
     playOscTone(freq,length,.06,'triangle',freq*.67,0,'domino');
 }
 async function award(data,token){
   const hand=data.last_hand;
   const winner=data.players.find(player=>player.seat===hand.seat);
   if(!winner||reduce()){drawScore(data);showHand(data);return;}
   drawScore(data,hand.seat,winner.points-hand.points);
   showHand({...data,state:'playing'});
   sound(1200,.15);
   const destination=score.querySelector('[data-points-seat="'+hand.seat+'"]').getBoundingClientRect();
   const count=Math.min(hand.points,14);
   const pointsBefore=winner.points-hand.points;
   await Promise.all(Array.from({length:count},async(_,index)=>{
     const value=Math.floor(hand.points*(index+1)/count);
     const batch=value-Math.floor(hand.points*index/count);
     if(token!==epoch)return;
     const coin=document.createElement('span');coin.className='dfc-point-coin';coin.textContent=batch;coin.setAttribute('aria-hidden','true');
     coin.style.left=(destination.left+destination.width/2-12)+'px';
     coin.style.top=(destination.top+destination.height/2-12)+'px';
     document.body.append(coin);
     const angle=index*2.399;
     const startX=Math.cos(angle)*Math.min(150,innerWidth*.28);
     const startY=Math.sin(angle)*Math.min(105,innerHeight*.3)+innerHeight*.25;
     try{
       await coin.animate([
         {transform:'translate(0,'+innerHeight*.2+'px) scale(.68)',opacity:0},
         {transform:'translate('+startX+'px,'+startY+'px) scale(1)',opacity:1,offset:.35},
         {transform:'translate(0,0) scale(.45)',opacity:1}
       ],{duration:600,delay:index*65,fill:'both'}).finished;
     }catch{}finally{coin.remove();}
     if(token===epoch){
       sound(620,.08);
       drawScore(data,hand.seat,pointsBefore+value);
     }
   }));
   if(token===epoch){drawScore(data);if(data.state==='settled'){dismissed='';showHand(data);}}
 }
 async function update(){
   const id=current();
   if(id!==table)reset(id);
   if(!id||pending||Date.now()<retryAfter||document.hidden)return;
   const client=window.sb||window.dfcSupabase;
   if(!client?.rpc)return;
   pending=true;const token=epoch;
   try{
     const {data,error}=await client.rpc('dfc_z37_points_scoreboard',{p_table_id:id});
     if(token!==epoch||current()!==id||error)return;
     if(!data){
       // An empty response can occur while seating or rotating a match.
       retryAfter=last?0:Date.now()+5000;
       return;
     }
     if(last&&last.match_id!==data.match_id){last=null;shown='';dismissed='';result.hidden=true;}
     replayState=data.replay_deadline?data:null;
     if(replayState)replayOffset=Date.parse(data.server_time)-Date.now();
     drawReplay();
     const first=!last;
     last=data;
     const hand=data.last_hand;
     if(!hand||hand.id===shown){drawScore(data);return;}
     shown=hand.id;
     if(first){drawScore(data);if(data.state==='settled')showHand(data);}
     else await award(data,token);
   }finally{if(token===epoch)pending=false;}
 }
 new MutationObserver(()=>void update()).observe(panel,{attributes:true,attributeFilter:['class']});
 setInterval(()=>void update(),1800);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void update();});
})();

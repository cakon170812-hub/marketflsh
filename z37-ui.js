/* DOMINÓ FLASH COIN Z37 — INTERFAZ AISLADA.
 * NO se incluye en el bundle OTA hasta validar servicios de juego y finanzas.
 * No inventa torneos, costos, participantes ni premios.
 */
(()=>{'use strict';
 if(window.dfcZ37UI)return;
 const $=(s,root=document)=>root.querySelector(s);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const db=()=>[window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase].find(s=>s&&typeof s.rpc==='function');
 const scriptUrl=document.currentScript?.src || location.href;
 const artwork={
   tournament:new URL('./images2/z37/torneos.webp',scriptUrl).href,
   points:new URL('./images2/z37/pool.webp',scriptUrl).href
 };
 Object.values(artwork).forEach(src=>{const image=new Image();image.src=src});
 const state={screen:null,slide:0,timer:null,items:[],pointTables:[],mode:'tournament',lastInteraction:0,infoOpen:false,catalogStatus:'loading',pendingSlide:false};
 const previewStyles=[['Azul y oro','gold_blue'],['Morado neón','purple_neon'],['Campeonato rojo','red_championship'],['Verde esmeralda','emerald_green']].map(([name,artwork_key])=>({name,artwork_key,state:'Vista previa',description:'Diseño de torneo',preview:true}));
 const accents={gold_blue:'#cfaf60',purple_neon:'#bb82ef',red_championship:'#e57d6b',emerald_green:'#88d5ac'};
 function style(){
 if($('#dfc-z37-styles'))return;
 const e=document.createElement('style');e.id='dfc-z37-styles';e.textContent=`
 #dfc-z37-shortcuts{position:fixed!important;top:31dvh!important;right:max(3.5vw,env(safe-area-inset-right))!important;z-index:2147482001!important;flex-direction:column;align-items:stretch;gap:clamp(6px,2vh,14px)}
 body:has(#dfc-z37-shortcuts[data-dfc-z37-bound="1"]) #dominoLobbyModes > [data-dfc-z36-future]{display:none!important}
 #dfc-z37-shortcuts button{min-height:36px;min-width:clamp(82px,13vw,132px);font:800 clamp(11px,1.5vw,15px) system-ui;color:white;padding:8px 13px;border-radius:12px;border:2px solid #f0d089;box-shadow:0 4px 14px #0008;background:linear-gradient(120deg,#805416,#21162e);cursor:pointer;white-space:nowrap}
 #dfc-z37-shortcuts button[data-z37]{background:linear-gradient(90deg,#080d23f2 5%,#080d2366 75%),var(--z37-art) center 54%/cover no-repeat,#101a2e;text-align:left;text-shadow:0 1px 5px #000;min-height:44px}
 #dfc-z37-shortcuts button[data-z37="points"]{border-color:#64dfd1}
 #dfc-z37-screen{position:fixed;inset:0;z-index:2147483650;background:linear-gradient(180deg,#100a239e,#100a235e 35%,#100a23db),var(--z37-art) center/cover no-repeat,#08162d;color:#fff;display:flex;flex-direction:column;gap:12px;font:14px/1.4 system-ui;overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;touch-action:pan-y;box-sizing:border-box;padding:max(12px,env(safe-area-inset-top)) max(12px,3vw,env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) max(12px,3vw,env(safe-area-inset-left))}
 .dfc-z37-header{display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px}
 .dfc-z37-header h1{margin:0;font-size:clamp(20px,4vw,40px);line-height:1.15;text-shadow:0 2px 10px #000}
 #dfc-z37-screen *{box-sizing:border-box}
 #dfc-z37-screen button,#dfc-z37-screen select,#dfc-z37-screen input{font:inherit}
 #dfc-z37-screen button{cursor:pointer}
 #dfc-z37-content{flex:1 0 auto;min-height:0;width:min(100%,560px);display:flex;flex-direction:column;gap:8px}
 .dfc-z37-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px}
 #dfc-z37-screen .dfc-z37-btn{min-height:44px;background:linear-gradient(155deg,#4b315d,#22182e 65%);color:#fff4dc;border:1px solid #e7b97794;border-radius:12px;padding:8px 15px;font-weight:750;box-shadow:inset 0 1px #ffdfa12c,0 4px 14px #0e061b7d}
 #dfc-z37-screen .dfc-z37-btn:disabled{opacity:.62;cursor:not-allowed}
 #dfc-z37-screen .dfc-z37-primary{background:linear-gradient(150deg,#ffe0a1,#cb8736);color:#211126;border-color:#ffedbe}
 #dfc-z37-screen button:focus-visible{outline:2px solid #ffda91;outline-offset:3px}
 .dfc-z37-card{display:grid;gap:10px;text-shadow:0 1px 6px #000}
 .dfc-z37-card .dfc-z37-bar{min-height:0;color:var(--accent,#e4ba60)}
 .dfc-z37-card p{margin:4px 0}
 .dfc-z37-title{font-size:clamp(20px,3vw,34px);font-weight:900}
 .dfc-z37-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
 .dfc-z37-dots{display:flex;flex-wrap:wrap;justify-content:center;gap:3px}
 .dfc-z37-dots button{width:28px;height:36px;border:0;border-radius:7px;background:transparent;padding:0}
 .dfc-z37-dots button::before{content:"";display:block;width:9px;height:9px;margin:auto;border-radius:99px;background:#b19bbd}
 .dfc-z37-dots button[aria-current=true]::before{background:#ffce79;width:19px}
 .dfc-z37-controls{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
 .dfc-z37-summary{padding:10px;background:#1c132bd1;border-radius:12px;margin:4px 0;color:#d9e6f4}
 #dfc-z37-screen[data-mode="points"]{touch-action:pan-x pan-y}
 .dfc-z37-points-carousel{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;touch-action:pan-x pan-y;padding:5px 2px 12px}
 .dfc-z37-points-carousel>.dfc-z37-tile{flex:0 0 min(82%,360px);scroll-snap-align:start}
 .dfc-z37-points-nav{display:flex;gap:8px}
 #dominoTablePanel[data-dfc-points-viewer] :is(#mf110SpectatorSit,#dominoSpectatorPrev,#dominoSpectatorNext){display:none!important}
 #dfcPointsSpectatorJoin:not([hidden]){position:absolute;right:max(3%,env(safe-area-inset-right));bottom:6%;z-index:190;max-width:44%;color:#fff}
 #dfcPointsWaitingStatus:not([hidden]){position:absolute;inset:auto 0 16%;z-index:190;margin:auto;width:max-content;max-width:80%;padding:6px 12px;border-radius:9px;background:#102841;color:#fff;font:700 13px system-ui;text-align:center;pointer-events:none}
 #dfcPointsSpectatorJoin button{background:#15345a;color:#fff;border:1px solid #d2bc79;border-radius:9px;padding:8px 12px}
 .dfc-z37-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px;margin-top:12px}
 .dfc-z37-tile{padding:16px;border:1px solid #e7b97769;border-radius:12px;background:#1c132bd1;color:white;text-align:left;min-height:80px}
 .dfc-z37-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:12px;border:1px solid #607b9d;border-radius:15px}
 .dfc-z37-form label{display:flex;flex-direction:column;gap:5px;font-weight:650}
 .dfc-z37-form input,.dfc-z37-form select{width:100%;min-width:0;border:1px solid #8aa0ba;background:#102841;color:white;border-radius:8px;padding:9px}
 .dfc-z37-note{font-size:12px;color:#b6c8d9}
 #dfcPointsEntry{box-sizing:border-box;width:min(92vw,980px);max-height:90dvh;overflow:auto;margin:auto;padding:clamp(12px,2.4vmin,24px);border:2px solid #22c7ed;border-radius:18px;background:radial-gradient(ellipse at top,#143a67,#08152d 75%);color:#edf7ff;font:650 clamp(13px,2.6vmin,17px)/1.35 system-ui;box-shadow:0 0 28px #13b5f45c;text-align:center}
 #dfcPointsEntry::backdrop{background:#0312249c}
 #dfcPointsEntry h2{margin:0;color:#ffe292;font-size:clamp(21px,5vmin,36px)}
 #dfcPointsEntry p{margin:6px 0}
 #dfcPointsEntry dl{margin:0;text-align:left}
 #dfcPointsEntry dl div{display:flex;justify-content:space-between;gap:8px;padding:5px 8px;border-bottom:1px solid #5284a5}
 #dfcPointsEntry dd{margin:0;color:#ffe292;white-space:nowrap}
 #dfcPointsEntry .dfc-entry-total{border-radius:8px;background:linear-gradient(#ffebaf,#e9ab2d);color:#152035}
 #dfcPointsEntry .dfc-entry-total dd{color:inherit}
 #dfcPointsEntry .dfc-entry-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,2vw,22px);align-items:center;margin:10px 0}
 #dfcPointsEntry .dfc-entry-strip{display:grid;grid-template-columns:1fr 2fr 1fr;align-items:center;border:1px solid #21bddf;border-radius:12px;background:#0c2948;overflow:hidden}
 #dfcPointsEntry button{min-height:40px;font:inherit;color:#f5fbff;background:linear-gradient(#184c72,#0b233f);border:1px solid #78ceef;border-radius:10px;padding:5px 12px;cursor:pointer}
 #dfcPointsEntry .dfc-entry-strip button{border:0;border-radius:0}
 #dfcPointsEntry button:disabled{opacity:.55;cursor:default}
 #dfcPointsEntry output{color:#ffe292;font-variant-numeric:tabular-nums}
 #dfcPointsEntry .dfc-entry-actions{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-top:12px}
 #dfcPointsEntry [data-confirm]{background:linear-gradient(#ffebaf,#e9ab2d);border-color:#ffe292;color:#152035}
 @media (max-width:540px) and (orientation:portrait){#dfcPointsEntry .dfc-entry-grid{grid-template-columns:1fr}}
 .dfc-z37-tile .dfc-z37-btn{display:block;margin-inline:auto}
 @media (orientation:landscape){
   .dfc-z37-header{display:grid;grid-template-columns:minmax(84px,1fr) auto minmax(84px,1fr)}
   #dfc-z37-back{justify-self:start}
   .dfc-z37-header h1{text-align:center}
   #dfc-z37-content{width:min(100%,740px);margin-inline:auto}
   #dfc-z37-content > [role="status"],.dfc-z37-card,.dfc-z37-card .dfc-z37-bar{text-align:center;justify-content:center}
   .dfc-z37-actions{justify-content:center}
   .dfc-z37-controls{display:grid;grid-template-columns:1fr minmax(0,auto) 1fr}
   .dfc-z37-controls > button:first-child{justify-self:start}
   .dfc-z37-controls > button:last-child{justify-self:end}
   .dfc-z37-grid:has(> .dfc-z37-summary){justify-items:center}
 }
 @media (orientation:portrait){#dfc-z37-shortcuts{top:28dvh!important;right:8px!important}#dfc-z37-screen{padding:10px}}
 `;document.head.append(e);
 }
 function rpc(fn,args={}){const c=db();if(!c)return Promise.resolve({data:null,error:{message:'Supabase no disponible'}});return c.rpc(fn,args)}
 let pointIds=[];
 async function refresh(mode,screen){
   const isPoints=mode==='points';
   let result;
   try{
     const results=await Promise.all([
       rpc(isPoints?'dfc_z37_points_catalog_terms':'dfc_z37_public_tournaments'),
       isPoints?Promise.resolve().then(()=>rpc('dfc_z37_points_live_boards')).catch(()=>null):null
     ]);
     if(state.screen!==screen)return;
     result=results[0];
     pointIds=Array.isArray(results[1]?.data)?results[1].data.filter(row=>['waiting','playing'].includes(row.state)):[];
   }catch(error){
     result={error};
   }
   if(!screen || state.screen!==screen)return;
   state.catalogStatus=result.error || !Array.isArray(result.data)?'error':'ready';
   const items=state.catalogStatus==='ready'?result.data:[];
   if(isPoints){
     state.pointTables=items.map(row=>({...row.terms,id:row.id,name:row.name,terms:row.terms}));
     drawPoints();
   }else{
     state.items=items;
     if(state.infoOpen)state.pendingSlide=true;
     else drawSlide();
   }
 }
 function catalogNotice(){
   if(state.catalogStatus==='loading')return '<p role="status">Consultando disponibilidad…</p>';
   if(state.catalogStatus==='error')return '<p role="status">No se pudo consultar el catálogo. Vuelve a abrir esta pantalla para reintentar.</p>';
   return '';
 }
 function home(){
   if(state.screen || $('#dominoTablePanel')?.classList.contains('active'))return false;
   const panel=$('#appView');
   if(!panel || panel.classList.contains('hidden'))return false;
   if($('#leaderPanel.active')||$('#leaderGatePanel.active')||$('#mfAdmin16_domino.active'))return false;
   return true;
 }
 function buttons(){
   let host=$('#dfc-z37-shortcuts');
   if(!host){host=document.createElement('div');host.id='dfc-z37-shortcuts';host.innerHTML='<button type="button" data-z37="tournament">Torneos</button><button type="button" data-z37="points">Por puntos</button>'; document.body.append(host);}
   if(host.parentElement!==document.body)document.body.append(host);
   ['position','top','right','z-index'].forEach(property=>host.style.removeProperty(property));
   if(host.dataset.dfcZ37Bound!=='1'){
     host.querySelectorAll('button[data-z37]').forEach(button=>{
       button.style.setProperty('--z37-art','url("'+artwork[button.dataset.z37]+'")');
       button.textContent=button.dataset.z37==='points'?'Por puntos':'Torneos';
     });
   }
   host.dataset.dfcZ37Bound='1';
   host.style.display=home()?'flex':'none';
 }
 let activeEscape;
 function cleanup(){if(activeEscape)window.removeEventListener('keydown',activeEscape);activeEscape=null;if(state.timer)clearInterval(state.timer);state.timer=null;state.screen?.remove();state.screen=null;state.infoOpen=false;buttons()}
 function shell(title,mode){
  cleanup();const e=document.createElement('section');e.id='dfc-z37-screen';e.dataset.mode=mode;e.style.setProperty('--z37-art','url("'+artwork.tournament+'")');e.setAttribute('role','dialog');e.setAttribute('aria-modal','true');e.setAttribute('aria-label',title);
  e.innerHTML='<header class="dfc-z37-header"><button type="button" class="dfc-z37-btn" id="dfc-z37-back">← Volver</button><h1>'+esc(title)+'</h1></header><div id="dfc-z37-content"></div>';
  // Keep this vertical scroll surface outside the legacy game touch lock.
  e.addEventListener('touchmove',event=>event.stopPropagation(),{passive:true});
  e.addEventListener('scroll',()=>{state.lastInteraction=Date.now()},{passive:true});
  document.body.append(e);state.screen=e;$('#dfc-z37-back',e).addEventListener('click',cleanup);
  activeEscape=event=>{if(event.key==='Escape')cleanup()};window.addEventListener('keydown',activeEscape);
  buttons();return $('#dfc-z37-content',e);
 }
 function drawSlide(){
  const host=$('#dfc-z37-content');if(!host)return;
  const slides=state.items.length?state.items:previewStyles;
  state.slide=(state.slide+slides.length)%slides.length;
  const t=slides[state.slide],accent=Object.hasOwn(accents,t.artwork_key)?accents[t.artwork_key]:accents.gold_blue;
  host.innerHTML=catalogNotice()+'<article class="dfc-z37-card" style="--accent:'+accent+'">'+
   '<div class="dfc-z37-bar"><b>'+esc(t.state)+'</b></div>'+
   '<div><div class="dfc-z37-title">'+esc(t.name)+'</div><p>'+esc(t.description)+'</p></div>'+
   '<div><div class="dfc-z37-summary">'+(t.preview?'Inscripciones aún cerradas':(t.state==='scheduled'?'Programado · ':'')+'Inscripción: '+(Number(t.entry_fc)>0?esc(t.entry_fc)+' FC':'Gratis')+' · Inscritos: '+esc(t.registered_count||0)+' · Inicio: '+esc(t.starts_at?new Date(t.starts_at).toLocaleString('es-DO',{timeZone:'America/Santo_Domingo',dateStyle:'short',timeStyle:'short'}):'Pendiente'))+'</div>'+
   '<div class="dfc-z37-actions"><button class="dfc-z37-btn dfc-z37-primary" data-z37-action="join" disabled>'+(t.state==='scheduled'?'Sentarse':'Registrarse')+'</button><button class="dfc-z37-btn" data-z37-action="info">Ver información</button></div>'+(t.state==='scheduled'?'<p class="dfc-z37-note">Entrada aún no disponible.</p>':'')+'</div></article>'+
   '<div class="dfc-z37-controls"><button class="dfc-z37-btn" data-z37-nav="-1">❮ Anterior</button><div class="dfc-z37-dots">'+slides.map((_,i)=>'<button aria-label="Torneo '+(i+1)+'" aria-current="'+(i===state.slide)+'" data-z37-nav="'+(i-state.slide)+'"></button>').join('')+'</div><button class="dfc-z37-btn" data-z37-nav="1">Siguiente ❯</button></div>';
  host.querySelectorAll('[data-z37-nav]').forEach(b=>b.onclick=()=>{state.lastInteraction=Date.now();if(!state.infoOpen){state.slide+=Number(b.dataset.z37Nav);drawSlide()}});
  let start=null;
  host.ontouchstart=ev=>{start=ev.touches.length===1?ev.touches[0]:null;state.lastInteraction=Date.now()};
  host.ontouchcancel=()=>{start=null};
  host.ontouchend=ev=>{if(!start)return;const end=ev.changedTouches[0];const distance=end.clientX-start.clientX;const vertical=end.clientY-start.clientY;start=null;
    if(Math.abs(distance)>45 && Math.abs(distance)>Math.abs(vertical) && !state.infoOpen){state.slide+=distance<0?1:-1;state.lastInteraction=Date.now();drawSlide()}
  };
  host.querySelector('[data-z37-action=info]').onclick=()=>info(t);
 }
 function info(t){
  if(state.infoOpen)return;
  state.lastInteraction=Date.now();
  state.infoOpen=true;const v=document.createElement('div');v.className='dfc-z37-summary';
  v.innerHTML='<h3>'+esc(t.name)+'</h3><p>'+esc(t.description)+'</p>'+(t.preview?'<p>La fecha, el aporte y los premios aparecerán cuando se publique un torneo.</p>':'<p>Inicio: '+esc(t.starts_at)+'</p><p>Inscripción: '+esc(t.entry_fc)+' FC · Diamantes iniciales: '+esc(t.diamond_initial)+'</p><p>Por pase: '+esc(t.diamond_pass_cost)+' · Mínimo: '+esc(t.diamond_minimum)+'</p><p>Recompra: '+esc(t.rebuy_fc)+' FC / '+esc(t.rebuy_diamonds)+' diamantes · Máximo 2</p><p>Puestos premiados: '+esc(t.paid_places)+'</p>')+'<button class="dfc-z37-btn">Cerrar información</button>';
  $('#dfc-z37-content').append(v);v.querySelector('button').onclick=()=>{v.remove();state.infoOpen=false;state.lastInteraction=Date.now();if(state.pendingSlide){state.pendingSlide=false;drawSlide()}};
 }


 let joiningTrial=false;
 const pendingSeatRequests=new Map();
 function seatRequest(key){
   let request=pendingSeatRequests.get(key);
   if(!request){
     try{request=sessionStorage.getItem(key);}catch{}
   }
   request ||= crypto.randomUUID();
   pendingSeatRequests.set(key,request);
   try{sessionStorage.setItem(key,request);}catch{}
   return request;
 }
 function forgetSeatRequest(key){
   if(!key)return;
   pendingSeatRequests.delete(key);
   try{sessionStorage.removeItem(key);}catch{}
 }
 function promptPointsFunding(config,quote,confirm){
   const terms=config.terms;
   const units=value=>Math.round(Number(value)*1000);
   const format=new Intl.NumberFormat('es-DO',{minimumFractionDigits:2,maximumFractionDigits:3});
   const fc=value=>format.format(value/1000)+' FC';
   const entry=units(terms.entry_fc);
   const minimum=units(quote.minimum_fc);
   const wallet=units(quote.wallet_fc);
   const maximum=Math.min(10000000,wallet-entry);
   let extra=minimum;
   let busy=false;
   let error='';
   let staleEntry=null;
   const dialog=document.createElement('dialog');
   dialog.id='dfcPointsEntry';
   dialog.setAttribute('aria-labelledby','dfcPointsEntryTitle');
   dialog.innerHTML=`<h2 id="dfcPointsEntryTitle">Nuevo aporte</h2>
     <p>${esc(config.name)} · ${esc(terms.players)} jugadores · Meta de ${esc(terms.target_points)} puntos</p>
     <div class="dfc-entry-grid"><dl>
       <div><dt>Aporte de la partida</dt><dd>${fc(entry)}</dd></div>
       <div><dt>Recarga al saldo de mesa</dt><dd data-recharge></dd></div>
       <div class="dfc-entry-total"><dt>Total a descontar</dt><dd data-total></dd></div>
       <div><dt>Diamantes</dt><dd>${esc(terms.entry_diamonds)}</dd></div>
     </dl><div><strong>Agregar al saldo de mesa</strong>
       <p>Mínimo de mesa · ${fc(minimum)}</p>
       <div class="dfc-entry-strip">
         <button type="button" data-minus aria-label="Reducir recarga">−</button><output></output>
         <button type="button" data-plus aria-label="Aumentar recarga">+</button>
       </div>
       <p>Saldo personal disponible · ${fc(wallet)}</p>
     </div></div>
     <p>${units(terms.pass_fee_fc)>0?fc(units(terms.pass_fee_fc))+' por pase':'Pase normal'} · Comisión ${esc(terms.admin_pct)} % FC / ${esc(terms.diamond_admin_pct)} % diamantes</p>
     <p role="status"></p>
     <div class="dfc-entry-actions"><button type="button" data-confirm>Confirmar y sentarme</button>
       <button type="button" data-close-entry>Cerrar</button></div>`;
   const minus=$('[data-minus]',dialog),plus=$('[data-plus]',dialog);
   const submit=$('[data-confirm]',dialog),close=$('[data-close-entry]',dialog);
   const status=$('[role="status"]',dialog);
   function render(){
     $('[data-recharge]',dialog).textContent=$('output',dialog).textContent=fc(extra);
     $('[data-total]',dialog).textContent=fc(entry+extra);
     minus.disabled=busy||extra<=minimum;
     plus.disabled=busy||extra>=maximum;
     submit.disabled=busy||extra>maximum;
     close.disabled=busy;
     status.textContent=error||(busy?'Confirmando asiento…':extra>maximum?'Te faltan '+fc(extra-maximum)+' en tu saldo personal.':'');
   }
   function adjust(change){
     extra=Math.max(minimum,Math.min(maximum,extra+change));
     error='';
     render();
   }
   return new Promise((resolve,reject)=>{
     minus.onclick=()=>adjust(-100);
     plus.onclick=()=>adjust(100);
     dialog.addEventListener('cancel',event=>event.preventDefault());
     close.onclick=()=>{
       dialog.close();dialog.remove();
       if(staleEntry)reject(staleEntry);
       else resolve(null);
     };
     submit.onclick=async()=>{
       busy=true;error='';staleEntry=null;render();
       try{
         const result=await confirm(extra/1000);
         dialog.close();dialog.remove();resolve(result);
       }catch(reason){
         if(['DF001','DF002'].includes(reason?.code))staleEntry=reason;
         error=reason?.message||'No se pudo confirmar el asiento.';
         busy=false;render();
       }
     };
     render();
     document.body.append(dialog);
     try{dialog.showModal();}
     catch(reason){dialog.remove();reject(reason);}
   });
 }
 async function joinPoints(button,config,viewedTable){
   if(joiningTrial)return;
   const screen=state.screen;
   const status=button.nextElementSibling;
   const terms=config.terms;
   if(!terms){status.textContent='Vuelve a abrir la mesa para consultar las condiciones.';return;}
   joiningTrial=true;
   button.disabled=true;
   status.textContent='Consultando el saldo mínimo…';
   let requestKey;
   try{
     const client=db();
     if(!client)throw new Error('Espera a que cargue tu sesión y vuelve a intentar.');
     const {data:{session},error:sessionError}=await client.auth.getSession();
     if(sessionError)throw sessionError;
     if(!session)throw new Error('Inicia sesión para sentarte.');
     requestKey='dfc-points-seat:'+session.user.id+':'+config.id+':'+(viewedTable||'next');
     const {data:quote,error:quoteError}=await client.rpc('dfc_z37_points_funding_quote',{p_config:config.id});
     if(quoteError)throw quoteError;
     if(!quote)throw new Error('La mesa ya no está disponible.');
     if(state.screen!==screen)return;
     status.textContent='';
     const data=await promptPointsFunding(config,quote,async passBalance=>{
       const {data:seat,error}=await client.rpc('dfc_z37_points_join_with_balance',{
         p_config:config.id,p_request:seatRequest(requestKey),p_terms:terms,
         p_table:viewedTable||null,p_pass_balance:passBalance
       });
       if(error){
         if(['DF001','DF002','DF005'].includes(error.code))forgetSeatRequest(requestKey);
         throw error;
       }
       if(!['waiting','playing','settled'].includes(seat?.state)||!seat.table_id){
         throw new Error('La mesa todavía no está disponible.');
       }
       return seat;
     });
     if(!data)return;
     if(state.screen!==screen)return;
     await window.openDominoLobby();
     if(state.screen!==screen)return;
     const resume=$('#dominoResumeTableBtn');
     if(typeof resume?.onclick!=='function')throw new Error('Vuelve a tocar Abrir partida para recuperar tu asiento.');
     await resume.onclick();
     forgetSeatRequest(requestKey);
     const tableInfo=$('#dfcZ16TableInfo');
     if(tableInfo){
       let tableId=$('#dfc-z37-trial-table-id',tableInfo);
       if(!tableId){
         tableId=document.createElement('div');
         tableId.id='dfc-z37-trial-table-id';
         tableInfo.append(tableId);
       }
       tableId.textContent='ID de mesa: '+data.table_id;
       const panel=$('#dominoTablePanel');
       if(panel){
         const observer=new MutationObserver(()=>{
           if(panel.classList.contains('active'))return;
           observer.disconnect();
           tableId.remove();
         });
         observer.observe(panel,{attributes:true,attributeFilter:['class']});
       }
     }
     if(state.screen===screen)cleanup();
   }catch(error){
     status.textContent=error?.message||'No se pudo entrar a la mesa.';
     if(error?.code==='DF004'){
       status.textContent+=' Puedes usar «Ver mesa» para mirar las partidas disponibles.';
       if(window.dominoSpectatorMode)status.textContent=error.message;
     }
     if(['DF001','DF002','DF005'].includes(error?.code))forgetSeatRequest(requestKey);
     if(error?.code==='DF002'&&viewedTable){
       await window.dominoExitSpectator?.();
       await open('points');
       const notice=document.createElement('p');
       notice.setAttribute('role','status');
       notice.textContent='Esta mesa ya no admite asientos. Elige la mesa vigente en Por puntos.';
       $('#dfc-z37-content')?.prepend(notice);
     }
     if(error?.code==='DF001'&&screen&&state.screen===screen){
       await refresh('points',screen);
       if(state.screen===screen){
         const notice=document.createElement('p');
         notice.setAttribute('role','status');
         notice.textContent='Cambiaron las condiciones. Revísalas y vuelve a confirmar.';
         $('#dfc-z37-content')?.prepend(notice);
       }
     }
   }finally{
     joiningTrial=false;
     button.disabled=false;
   }
 }
 function pointIdControls(boards,primaryBoard){
   return boards.map(row=>'<p>ID de mesa <code style="user-select:all;-webkit-user-select:all">'+esc(row.table_id)+'</code> '+
     '<button type="button" class="dfc-z37-btn" data-copy-table-id="'+esc(row.table_id)+'">Copiar ID</button>'+
     (row.state==='playing'&&row!==primaryBoard?' <button type="button" class="dfc-z37-btn" data-z37-watch="'+esc(row.table_id)+'">Ver mesa #'+esc(row.table_id)+'</button>':'')+
     '</p>').join('');
 }
 function drawPoints(){
  const e=$('#dfc-z37-content');
  const tiles=state.pointTables.map(t=>{
    const boards=pointIds.filter(row=>row.config_id===t.id);
    const watch=boards.find(row=>row.state==='playing')||boards[0];
    return '<article class="dfc-z37-tile"><h3>'+esc(t.name)+'</h3><p>Meta '+esc(t.target_points)+' puntos</p><p>Entrada '+esc(t.entry_fc)+' FC + '+esc(t.entry_diamonds)+' diamantes</p>'+
     (Number(t.pass_fee_fc)>0?'<p>Cada pase: '+esc(t.pass_fee_fc)+' FlashCoin</p>':'')+
     '<p>'+esc(t.players)+' jugadores</p>'+pointIdControls(boards,watch)+
     '<div class="dfc-z37-actions"><button type="button" class="dfc-z37-btn" data-z37-watch="'+esc(watch?.table_id||'')+'" '+(watch?'':'disabled')+'>Ver mesa</button>'+
     '<button type="button" class="dfc-z37-btn" data-z37-point-config="'+esc(t.id)+'">Sentarse</button><p role="status"></p></div></article>';
  }).join('');
  e.innerHTML=catalogNotice()+(tiles?'<div class="dfc-z37-points-carousel" aria-label="Mesas por puntos" tabindex="0">'+tiles+'</div>'+
    (state.pointTables.length>1?'<nav class="dfc-z37-points-nav" aria-label="Cambiar de mesa"><button type="button" class="dfc-z37-btn" data-step="-1">‹ Anterior</button><button type="button" class="dfc-z37-btn" data-step="1">Siguiente ›</button></nav>':''):
    state.catalogStatus==='ready'?'<div class="dfc-z37-summary">No hay mesas por puntos publicadas.</div>':'');
  const carousel=$('.dfc-z37-points-carousel',e);
  state.screen?.addEventListener('touchmove',allowPanelGesture,{passive:true});
  for(const control of e.querySelectorAll('[data-step]')){
    control.onclick=()=>carousel.scrollBy({left:Number(control.dataset.step)*(carousel.firstElementChild.offsetWidth+12),behavior:'smooth'});
  }
  for(const button of e.querySelectorAll('[data-z37-watch]:not(:disabled)')){
    button.onclick=async()=>{
      if(joiningTrial)return;
      const screen=state.screen;
      const status=button.closest('.dfc-z37-tile').querySelector('[role="status"]');
      status.textContent='Abriendo mesa…';
      button.disabled=true;
      try{
        const tableId=Number(button.dataset.z37Watch);
        if(!await window.enterDominoSpectatorTable?.(tableId))throw Error('No se pudo abrir la mesa.');
        syncSpectator({can_join:false},tableId);
        if(state.screen===screen)cleanup();
      }catch(error){status.textContent=error.message;}
      finally{button.disabled=false;}
    };
  }
  e.querySelectorAll('[data-copy-table-id]').forEach(button=>{
    button.onclick=async()=>{
      try{
        await navigator.clipboard.writeText(button.dataset.copyTableId);
        button.textContent='ID copiado';
      }catch{
        button.textContent='Selecciona el ID para copiarlo';
      }
    };
  });
  for(const button of e.querySelectorAll('[data-z37-point-config]')){
    const config=state.pointTables.find(table=>table.id===button.dataset.z37PointConfig);
    button.onclick=()=>void joinPoints(button,config);
  }
 }
 function allowPanelGesture(event){event.stopPropagation();}
 function syncWaitingStatus(panel,data){
   let status=$('#dfcPointsWaitingStatus',panel);
   const players=data?.players;
   const seated=!window.dominoSpectatorMode && data?.state==='waiting' &&
     Array.isArray(players) && players.some(player=>player.mine);
   if(!seated){
     if(status)status.hidden=true;
     return;
   }
   if(!status){
     status=document.createElement('div');
     status.id='dfcPointsWaitingStatus';
     status.setAttribute('role','status');
     panel.append(status);
   }
   const needed=data.allow_short_start ? 2 : Number(data.capacity);
   const missing=Math.max(0,needed-players.length);
   let message;
   if(data.verifying_contributions)message='Verificando aportes…';
   else if(missing===0)message='Preparando reparto…';
   else message=missing===1?'Esperando 1 jugador':('Esperando '+missing+' jugadores');
   if(status.textContent!==message)status.textContent=message;
   status.hidden=false;
 }
 let pointsViewerId=0;
 function syncSpectator(data,tableId){
   const panel=$('#dominoTablePanel');
   if(!panel)return;
   syncWaitingStatus(panel,data);
   let host=$('#dfcPointsSpectatorJoin',panel);
   if(data&&window.dominoSpectatorMode)pointsViewerId=tableId;
   if(!window.dominoSpectatorMode||pointsViewerId!==tableId)pointsViewerId=0;
   const watching=Boolean(pointsViewerId);
   panel.toggleAttribute('data-dfc-points-viewer',watching);
   if(!watching||!(data?.can_join||data?.waiting_for_next)){
     if(host)host.hidden=true;
     return;
   }
   if(!host){
     host=document.createElement('div');
     host.id='dfcPointsSpectatorJoin';
     host.innerHTML='<button type="button">Sentarse</button><p role="status"></p>';
     panel.append(host);
   }
   host.hidden=false;
   const button=host.querySelector('button');
   const status=button.nextElementSibling;
   if(!joiningTrial){
     button.disabled=!data.can_join;
     if(data.waiting_for_next)status.textContent='Podrás sentarte al terminar esta partida.';
     else if(status.textContent==='Podrás sentarte al terminar esta partida.')status.textContent='';
     button.onclick=data.can_join ? ()=>joinPoints(button,{
     id:data.config_id,name:data.table_name,terms:data.entry_terms
     },tableId) : null;
   }
 }
 function showTournament(){
  shell('Torneos FlashCoin','tournament');state.slide=0;state.lastInteraction=Date.now();drawSlide();
  state.timer=setInterval(()=>{if(!state.screen)return;if(!state.infoOpen&&Date.now()-state.lastInteraction>=10000){state.slide++;state.lastInteraction=Date.now();drawSlide()}},1000);
 }
 function open(mode){
   state.catalogStatus='loading';
   state.pendingSlide=false;
   state.items=[];
   state.pointTables=[];
   pointIds=[];
   if(mode==='points'){
     shell('Mesas por puntos','points');
     drawPoints();
   }else{
     showTournament();
   }
   return refresh(mode,state.screen);
 }
 function boot(){style();buttons();document.addEventListener('click',event=>{const button=event.target.closest?.('#dfc-z37-shortcuts button[data-z37]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();void open(button.dataset.z37)},true);const observer=new MutationObserver(buttons);['#appView','#dominoTablePanel','#leaderPanel','#leaderGatePanel','#mfAdmin16_domino'].forEach(id=>{const panel=$(id);if(panel)observer.observe(panel,{attributes:true,attributeFilter:['class']})});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.dfcZ37UI=Object.freeze({open,syncSpectator,refresh:()=>refresh(state.screen?.dataset.mode,state.screen)});
})();

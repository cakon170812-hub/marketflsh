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
 const colors={gold_blue:['#07132e','#cfaf60'],purple_neon:['#27133f','#bb82ef'],red_championship:['#43121f','#e57d6b'],emerald_green:['#0c3c2e','#88d5ac']};
 function style(){
 if($('#dfc-z37-styles'))return;
 const e=document.createElement('style');e.id='dfc-z37-styles';e.textContent=`
 #dfc-z37-shortcuts{position:fixed!important;top:31dvh!important;right:max(3.5vw,env(safe-area-inset-right))!important;z-index:2147482001!important;flex-direction:column;align-items:stretch;gap:clamp(6px,2vh,14px)}
 body:has(#dfc-z37-shortcuts[data-dfc-z37-bound="1"]) #dominoLobbyModes > [data-dfc-z36-future]{display:none!important}
 #dfc-z37-shortcuts button{min-height:36px;min-width:clamp(82px,13vw,132px);font:800 clamp(11px,1.5vw,15px) system-ui;color:white;padding:8px 13px;border-radius:12px;border:2px solid #f0d089;box-shadow:0 4px 14px #0008;background:linear-gradient(120deg,#805416,#21162e);cursor:pointer;white-space:nowrap}
 #dfc-z37-shortcuts button[data-z37]{background:linear-gradient(90deg,#080d23f2 5%,#080d2366 75%),var(--z37-art) center 54%/cover no-repeat,#101a2e;text-align:left;text-shadow:0 1px 5px #000;min-height:44px}
 #dfc-z37-shortcuts button[data-z37="points"]{border-color:#64dfd1}
 .dfc-z37-hero{flex:none;min-height:clamp(152px,48dvh,460px);margin:0;display:flex;align-items:center;border-radius:18px;padding:clamp(14px,4vw,36px);font-size:clamp(23px,4vw,48px);line-height:1.1;text-shadow:0 2px 10px #000;background:linear-gradient(90deg,#061024aa,transparent 70%),var(--z37-art) center 52%/cover no-repeat,#08162d}
 #dfc-z37-screen[data-mode="points"] .dfc-z37-hero{border:1px solid #64dfd1}
 #dfc-z37-screen[data-mode="tournament"] .dfc-z37-hero{border:1px solid #e4ba60}
 #dfc-z37-screen{position:fixed;inset:0;z-index:2147483650;background:linear-gradient(180deg,rgba(4,12,32,.75),rgba(4,12,32,.83)),var(--dfc-z26-official-wallpaper,#08162d) center/cover no-repeat;color:#fff;display:flex;flex-direction:column;font:14px/1.4 system-ui;overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;touch-action:pan-y;box-sizing:border-box;padding:12px max(12px,3vw) calc(12px + env(safe-area-inset-bottom))}
 #dfc-z37-screen *{box-sizing:border-box}
 #dfc-z37-screen button,#dfc-z37-screen select,#dfc-z37-screen input{font:inherit}
 #dfc-z37-screen button{cursor:pointer}
 #dfc-z37-content{flex:1 0 auto;min-height:0;display:flex;flex-direction:column;gap:8px}
 .dfc-z37-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px}
 .dfc-z37-btn{background:#244568;color:white;border:1px solid #88a3c5;border-radius:10px;padding:9px 12px;font-weight:700}
 .dfc-z37-btn:disabled{opacity:.45;cursor:not-allowed}
 .dfc-z37-primary{background:linear-gradient(90deg,#e4ba60,#b88d38);color:#1e2632;border-color:#e9d09b}
 .dfc-z37-card{width:100%;flex:1;min-height:200px;border:3px solid var(--accent,#d8b262);border-radius:22px;display:flex;flex-direction:column;justify-content:space-between;padding:clamp(12px,3vw,26px);gap:16px;background:linear-gradient(125deg,var(--base,#162e52),#080f22)}
 .dfc-z37-title{text-align:center;font-size:clamp(23px,4vw,46px);font-weight:900;text-shadow:0 3px 10px #000}
 .dfc-z37-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
 .dfc-z37-actions button{min-width:130px}
 .dfc-z37-dots{display:flex;justify-content:center;gap:6px;margin:7px}
 .dfc-z37-dots button{width:12px;height:12px;border-radius:99px;border:0;background:#657990;padding:0}
 .dfc-z37-dots button[aria-current=true]{background:#e6bf66;width:26px}
 .dfc-z37-controls{display:flex;align-items:center;justify-content:space-between;gap:8px}
 .dfc-z37-summary{padding:10px;background:#102540;border-radius:12px;margin:4px 0;color:#d9e6f4}
 .dfc-z37-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px;margin-top:12px}
 .dfc-z37-tile{padding:16px;border:1px solid #7088aa;border-radius:12px;background:#142a45;color:white;text-align:left;min-height:80px}
 .dfc-z37-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:12px;border:1px solid #607b9d;border-radius:15px}
 .dfc-z37-form label{display:flex;flex-direction:column;gap:5px;font-weight:650}
 .dfc-z37-form input,.dfc-z37-form select{width:100%;min-width:0;border:1px solid #8aa0ba;background:#102841;color:white;border-radius:8px;padding:9px}
 .dfc-z37-note{font-size:12px;color:#b6c8d9}
 @media (orientation:portrait){#dfc-z37-shortcuts{top:28dvh!important;right:8px!important}#dfc-z37-screen{padding:10px} .dfc-z37-card{max-height:none;min-height:55vh}}
 `;document.head.append(e);
 }
 function rpc(fn,args={}){const c=db();if(!c)return Promise.resolve({data:null,error:{message:'Supabase no disponible'}});return c.rpc(fn,args)}
 async function refresh(mode,screen){
   const isPoints=mode==='points';
   let result;
   try{
     result=await rpc(isPoints?'dfc_z37_public_points':'dfc_z37_public_tournaments');
   }catch(error){
     result={error};
   }
   if(!screen || state.screen!==screen)return;
   state.catalogStatus=result.error || !Array.isArray(result.data)?'error':'ready';
   const items=state.catalogStatus==='ready'?result.data:[];
   if(isPoints){
     state.pointTables=items;
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
  cleanup();const e=document.createElement('section');e.id='dfc-z37-screen';e.dataset.mode=mode;e.style.setProperty('--z37-art','url("'+artwork[mode]+'")');e.setAttribute('role','dialog');e.setAttribute('aria-modal','true');e.setAttribute('aria-label',title);
  e.innerHTML='<div class="dfc-z37-bar"><button type="button" class="dfc-z37-btn" id="dfc-z37-back">← Volver</button><strong>'+esc(title)+'</strong><span style="width:68px"></span></div><h1 class="dfc-z37-hero">'+esc(title)+'</h1><div id="dfc-z37-content"></div>';
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
  const t=slides[state.slide],palette=colors[t.artwork_key]||colors.gold_blue;
  host.innerHTML=catalogNotice()+'<article class="dfc-z37-card" style="--base:'+palette[0]+';--accent:'+palette[1]+'">'+
   '<div class="dfc-z37-bar"><b>'+esc(t.state)+'</b><span>🏆</span></div>'+
   '<div><div class="dfc-z37-title">'+esc(t.name)+'</div><p style="text-align:center">'+esc(t.description)+'</p></div>'+
   '<div><div class="dfc-z37-summary">'+(t.preview?'Inscripciones aún cerradas':'Inscripción: '+(Number(t.entry_fc)>0?esc(t.entry_fc)+' FC':'Gratis')+' · Inscritos: '+esc(t.registered_count||0)+' · Inicio: '+esc(t.starts_at||'Pendiente'))+'</div>'+
   '<div class="dfc-z37-actions"><button class="dfc-z37-btn dfc-z37-primary" data-z37-action="join" disabled>Registrarse</button><button class="dfc-z37-btn" data-z37-action="info">Ver información</button></div></div></article>'+
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

 function drawPoints(){
  const e=$('#dfc-z37-content');
  e.innerHTML=catalogNotice()+'<div class="dfc-z37-grid">'+(state.pointTables.length?state.pointTables.map(t=>
    '<div class="dfc-z37-tile"><h3>'+esc(t.name)+'</h3><p>Meta '+esc(t.target_points)+' puntos</p><p>Entrada '+esc(t.entry_fc)+' FC + '+esc(t.entry_diamonds)+' diamantes</p><p>'+esc(t.players)+' jugadores</p><button class="dfc-z37-btn" disabled>Sentarse — pendiente de motor Z37</button></div>').join(''):
    state.catalogStatus==='ready'?'<div class="dfc-z37-summary">No hay mesas por puntos publicadas.</div>':'')+'</div>';
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
 window.dfcZ37UI=Object.freeze({open,refresh:()=>refresh(state.screen?.dataset.mode,state.screen)});
})();
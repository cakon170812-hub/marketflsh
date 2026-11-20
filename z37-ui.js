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
 .dfc-z37-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px;margin-top:12px}
 .dfc-z37-tile{padding:16px;border:1px solid #e7b97769;border-radius:12px;background:#1c132bd1;color:white;text-align:left;min-height:80px}
 .dfc-z37-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:12px;border:1px solid #607b9d;border-radius:15px}
 .dfc-z37-form label{display:flex;flex-direction:column;gap:5px;font-weight:650}
 .dfc-z37-form input,.dfc-z37-form select{width:100%;min-width:0;border:1px solid #8aa0ba;background:#102841;color:white;border-radius:8px;padding:9px}
 .dfc-z37-note{font-size:12px;color:#b6c8d9}
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
       rpc(isPoints?'dfc_z37_public_points':'dfc_z37_public_tournaments'),
       isPoints?Promise.resolve().then(()=>rpc('dfc_z37_points_table_ids')).catch(()=>null):null
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


 const trialId='b3abde40-ea42-4a52-ab24-0ce93c090200';
 let joiningTrial=false;
 async function joinPoints(button,config){
   if(joiningTrial)return;
   const isTrial=config.id===trialId;
   const hasContribution=Number(config.entry_fc)>0||Number(config.entry_diamonds)>0;
   const passFee=Number(config.pass_fee_fc)||0;
   if((hasContribution||passFee>0)&&!window.confirm('Sentarte en '+config.name+' · Aporte: '+config.entry_fc+
     ' FlashCoin y '+config.entry_diamonds+' diamantes.'+(passFee>0?' Cada pase cuesta '+passFee+' FlashCoin.':'')))return;
   const screen=state.screen;
   const status=button.nextElementSibling;
   joiningTrial=true;
   button.disabled=true;
   status.textContent='Buscando asiento…';
   try{
     const client=db();
     if(!client)throw new Error('Espera a que cargue tu sesión y vuelve a intentar.');
     const args={p_config:config.id,p_request:crypto.randomUUID()};
     if(!isTrial){args.p_fc=config.entry_fc;args.p_diamonds=config.entry_diamonds;}
     const {data,error}=await client.rpc(isTrial?'dfc_z37_points_join_engine':'dfc_z37_points_join_paid',args);
     if(error)throw error;
     if(state.screen!==screen)return;
     if(!['waiting','playing','settled'].includes(data?.state)||!data.table_id)throw new Error('La mesa todavía no está disponible.');
     await window.openDominoLobby();
     if(state.screen!==screen)return;
     const resume=$('#dominoResumeTableBtn');
     if(typeof resume?.onclick!=='function')throw new Error('Vuelve a tocar Abrir partida para recuperar tu asiento.');
     await resume.onclick();
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
   }finally{
     joiningTrial=false;
     button.disabled=false;
   }
 }
 function pointIdControls(config){
   const ids=pointIds.filter(row=>row.config_id===config);
   return ids.map(row=>'<p>ID de mesa <code style="user-select:all;-webkit-user-select:all">'+esc(row.table_id)+'</code> '+
     '<button type="button" class="dfc-z37-btn" data-copy-table-id="'+esc(row.table_id)+'">Copiar ID</button></p>').join('');
 }
 function drawPoints(){
  const e=$('#dfc-z37-content');
  e.innerHTML=catalogNotice()+'<div class="dfc-z37-grid">'+(state.pointTables.length?state.pointTables.map(t=>
    '<div class="dfc-z37-tile"><h3>'+esc(t.name)+'</h3><p>Meta '+esc(t.target_points)+' puntos</p><p>Entrada '+esc(t.entry_fc)+' FC + '+esc(t.entry_diamonds)+' diamantes</p>'+(Number(t.pass_fee_fc)>0?'<p>Cada pase: '+esc(t.pass_fee_fc)+' FlashCoin</p>':'')+'<p>'+esc(t.players)+' jugadores</p>'+pointIdControls(t.id)+(t.id===trialId||[2,3,4].includes(Number(t.players))?'<button type="button" class="dfc-z37-btn" data-z37-point-config="'+esc(t.id)+'">Sentarse en mesa</button><p role="status"></p>':'<button type="button" class="dfc-z37-btn" disabled>Entrada aún no disponible</button>')+'</div>').join(''):
    state.catalogStatus==='ready'?'<div class="dfc-z37-summary">No hay mesas por puntos publicadas.</div>':'')+'</div>';
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
 window.dfcZ37UI=Object.freeze({open,refresh:()=>refresh(state.screen?.dataset.mode,state.screen)});
})();
/* DOMINÓ FLASH COIN Z37 — INTERFAZ AISLADA.
 * NO se incluye en el bundle OTA hasta validar servicios de juego y finanzas.
 * No inventa torneos, costos, participantes ni premios.
 */
(()=>{'use strict';
 if(window.dfcZ37UI)return;
 const $=(s,root=document)=>root.querySelector(s);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const db=()=>[window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase].find(s=>s&&typeof s.rpc==='function');
 const state={screen:null,slide:0,timer:null,items:[],pointTables:[],mode:'tournament',lastInteraction:0};
 const colors={gold_blue:['#07132e','#cfaf60'],purple_neon:['#27133f','#bb82ef'],red_championship:['#43121f','#e57d6b'],emerald_green:['#0c3c2e','#88d5ac']};
 function style(){
 if($('#dfc-z37-styles'))return;
 const e=document.createElement('style');e.id='dfc-z37-styles';e.textContent=`
 #dfc-z37-shortcuts{position:fixed;top:clamp(58px,11vh,125px);right:12px;z-index:10020;display:flex;flex-direction:column;gap:6px}
 #dfc-z37-shortcuts button{font:800 clamp(11px,1.8vw,15px) system-ui;color:white;padding:8px 13px;border-radius:12px;border:2px solid #f0d089;box-shadow:0 4px 14px #0008;background:linear-gradient(120deg,#805416,#21162e);cursor:pointer;white-space:nowrap}
 #dfc-z37-shortcuts button+button{background:linear-gradient(120deg,#19598d,#092449);border-color:#79c7ee}
 #dfc-z37-screen{position:fixed;inset:0;z-index:190000;background:#08162d;color:#fff;display:flex;flex-direction:column;font:14px/1.4 system-ui;overflow:auto;box-sizing:border-box;padding:12px max(12px,3vw)}
 #dfc-z37-screen *{box-sizing:border-box}
 #dfc-z37-screen button,#dfc-z37-screen select,#dfc-z37-screen input{font:inherit}
 #dfc-z37-screen button{cursor:pointer}
 .dfc-z37-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px}
 .dfc-z37-btn{background:#244568;color:white;border:1px solid #88a3c5;border-radius:10px;padding:9px 12px;font-weight:700}
 .dfc-z37-btn:disabled{opacity:.45;cursor:not-allowed}
 .dfc-z37-primary{background:linear-gradient(90deg,#e4ba60,#b88d38);color:#1e2632;border-color:#e9d09b}
 .dfc-z37-card{width:min(940px,100%);max-height:calc(100dvh - 116px);margin:auto;min-height:200px;border:3px solid var(--accent,#d8b262);border-radius:22px;display:flex;flex-direction:column;justify-content:space-between;overflow:auto;padding:clamp(12px,3vw,26px);gap:16px;background:linear-gradient(125deg,var(--base,#162e52),#080f22)}
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
 @media (orientation:portrait){#dfc-z37-shortcuts{top:80px;right:5px}#dfc-z37-screen{padding:10px} .dfc-z37-card{max-height:none;min-height:55vh}}
 `;document.head.append(e);
 }
 function rpc(fn,args={}){const c=db();if(!c)return Promise.resolve({data:null,error:{message:'Supabase no disponible'}});return c.rpc(fn,args)}
 async function refresh(){
   const [t,p]=await Promise.all([rpc('dfc_z37_public_tournaments'),rpc('dfc_z37_public_points')]);
   state.items=Array.isArray(t.data)?t.data:[];state.pointTables=Array.isArray(p.data)?p.data:[];
 }
 function home(){
   if(state.screen || $('#dominoTablePanel')?.classList.contains('active'))return false;
   const panel=$('#appView');
   if(!panel || panel.classList.contains('hidden'))return false;
   if($('#dominoLobbyPanel')?.classList.contains('active'))return false;
   return true;
 }
 function buttons(){
   let host=$('#dfc-z37-shortcuts');
   if(!host){host=document.createElement('div');host.id='dfc-z37-shortcuts';host.innerHTML='<button type="button" data-z37="tournament">🏆 TORNEO</button><button type="button" data-z37="points">🪙 POR PUNTOS</button>'; document.body.append(host);}
   if(host.dataset.dfcZ37Bound!=='1'){
     host.dataset.dfcZ37Bound='1';
     host.addEventListener('click',e=>{const b=e.target.closest('button[data-z37]');if(b)open(b.dataset.z37)});
   }
   host.style.display=home()?'flex':'none';
 }
 function cleanup(){if(state.timer)clearInterval(state.timer);state.timer=null;state.screen?.remove();state.screen=null;buttons()}
 function shell(title){
  cleanup();const e=document.createElement('section');e.id='dfc-z37-screen';e.setAttribute('role','dialog');e.setAttribute('aria-modal','true');e.setAttribute('aria-label',title);
  e.innerHTML='<div class="dfc-z37-bar"><button type="button" class="dfc-z37-btn" id="dfc-z37-back">← Volver</button><strong>'+esc(title)+'</strong><span style="width:68px"></span></div><div id="dfc-z37-content" style="flex:1;min-height:0;display:flex;flex-direction:column"></div>';
  document.body.append(e);state.screen=e;$('#dfc-z37-back',e).addEventListener('click',cleanup);
  window.addEventListener('keydown',function key(ev){if(ev.key==='Escape'){window.removeEventListener('keydown',key);cleanup()}},{once:true});
  buttons();return $('#dfc-z37-content',e);
 }
 function drawSlide(){
  const host=$('#dfc-z37-content');if(!host)return;
  if(!state.items.length){host.innerHTML='<div class="dfc-z37-card" style="text-align:center;align-items:center;justify-content:center"><h2>🏆 Torneos</h2><p>No hay torneos Z37 publicados y verificados todavía.</p><p class="dfc-z37-note">La inscripción solamente estará disponible cuando Supabase confirme un torneo y su fondo de premios.</p></div>';return}
  state.slide=(state.slide+state.items.length)%state.items.length;
  const t=state.items[state.slide],palette=colors[t.artwork_key]||colors.gold_blue,editable=String(t.state)==='open';
  host.innerHTML='<article class="dfc-z37-card" style="--base:'+palette[0]+';--accent:'+palette[1]+'">'+
   '<div class="dfc-z37-bar"><b>'+esc(t.state)+'</b><span>🏆</span></div>'+
   '<div><div class="dfc-z37-title">'+esc(t.name)+'</div><p style="text-align:center">'+esc(t.description)+'</p></div>'+
   '<div><div class="dfc-z37-summary">Inscripción: '+(Number(t.entry_fc)>0?esc(t.entry_fc)+' FC':'Gratis')+' · Inscritos: '+esc(t.registered_count||0)+' · Inicio: '+esc(t.starts_at||'Pendiente')+'</div>'+
   '<div class="dfc-z37-actions"><button class="dfc-z37-btn dfc-z37-primary" data-z37-action="join" '+(!editable?'disabled':'')+'>Registrarse</button><button class="dfc-z37-btn" data-z37-action="info">Ver información</button></div></div></article>'+
   '<div class="dfc-z37-controls"><button class="dfc-z37-btn" data-z37-nav="-1">❮ Anterior</button><div class="dfc-z37-dots">'+state.items.map((_,i)=>'<button aria-label="Torneo '+(i+1)+'" aria-current="'+(i===state.slide)+'" data-z37-nav="'+(i-state.slide)+'"></button>').join('')+'</div><button class="dfc-z37-btn" data-z37-nav="1">Siguiente ❯</button></div>';
  host.querySelectorAll('[data-z37-nav]').forEach(b=>b.onclick=()=>{state.lastInteraction=Date.now();state.slide+=Number(b.dataset.z37Nav);drawSlide()});
  host.querySelector('[data-z37-action=info]').onclick=()=>info(t);
  host.querySelector('[data-z37-action=join]').onclick=()=>join(t);
 }
 function info(t){
  state.lastInteraction=Date.now();
  const v=document.createElement('div');v.className='dfc-z37-summary';
  v.innerHTML='<h3>'+esc(t.name)+'</h3><p>'+esc(t.description)+'</p><p>Inicio: '+esc(t.starts_at)+'</p><p>Inscripción: '+esc(t.entry_fc)+' FC · Diamantes iniciales: '+esc(t.diamond_initial)+'</p><p>Por pase: '+esc(t.diamond_pass_cost)+' · Mínimo: '+esc(t.diamond_minimum)+'</p><p>Recompra: '+esc(t.rebuy_fc)+' FC / '+esc(t.rebuy_diamonds)+' diamantes · Máximo 2</p><p>Puestos premiados: '+esc(t.paid_places)+'</p><button class="dfc-z37-btn">Cerrar información</button>';
  $('#dfc-z37-content').append(v);v.querySelector('button').onclick=()=>v.remove();
 }
 function join(t){state.lastInteraction=Date.now();window.alert('Inscripciones pendientes de activar: la integración financiera y del motor de Z37 aún no está verificada. No se efectuó ningún cobro.')}
 function showPoints(){
  const e=shell('🪙 Mesas POR PUNTOS Z37');
  e.innerHTML='<div class="dfc-z37-grid">'+(state.pointTables.length?state.pointTables.map(t=>
    '<div class="dfc-z37-tile"><h3>'+esc(t.name)+'</h3><p>Meta '+esc(t.target_points)+' puntos</p><p>Entrada '+esc(t.entry_fc)+' FC + '+esc(t.entry_diamonds)+' diamantes</p><p>'+esc(t.players)+' jugadores</p><button class="dfc-z37-btn" disabled>Sentarse — pendiente de motor Z37</button></div>').join(''):
    '<div class="dfc-z37-summary"><h3>Mesas por puntos</h3>No hay mesas de puntos publicadas y verificadas.</div>')+'</div>';
 }
 function showTournament(){
  shell('🏆 Torneos FlashCoin Z37');state.slide=0;state.lastInteraction=Date.now();drawSlide();
  state.timer=setInterval(()=>{if(!state.screen)return;if(Date.now()-state.lastInteraction>=10000){state.slide++;state.lastInteraction=Date.now();drawSlide()}},1000);
 }
 async function open(mode){state.mode=mode;await refresh();mode==='points'?showPoints():showTournament()}
 function boot(){style();buttons();let obsAt=0;const observer=new MutationObserver(()=>{if(Date.now()-obsAt>500){obsAt=Date.now();buttons()}});observer.observe(document.body,{attributes:true,childList:true,subtree:true,attributeFilter:['class']});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.dfcZ37UI=Object.freeze({open,refresh});
})();
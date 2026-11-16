/* Z37 Panel administrativo — SOLO borradores, sin publicación ni cobros.
 * Permisos validados por Supabase / dfc_z37_is_admin.
 */
(()=>{'use strict';if(window.dfcZ37Admin)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const db=()=>[window.sb,window.dfcSupabase,window.supabaseClient,window.rfSupabase].find(x=>x&&x.rpc&&x.auth?.getSession);
 let authorized=false,view=null,checkedAt=0;
 async function rpc(name,args={}){const c=db();if(!c)throw Error('Supabase no conectado');const {data,error}=await c.rpc(name,args);if(error)throw Error(error.message||'Error de servidor');return data;}
 function e(tag,props={},text=''){const x=document.createElement(tag);Object.entries(props).forEach(([a,v])=>x.setAttribute(a,v));if(text)x.textContent=text;return x;}
 async function verify(){
  if(Date.now()-checkedAt<30000)return authorized;
  checkedAt=Date.now();
  try{authorized=(await rpc('dfc_z37_is_admin'))===true}catch(_){authorized=false}
  return authorized;
 }
 function setup(){
  if(document.getElementById('dfc-z37-admin-entry'))return;
  const b=e('button',{id:'dfc-z37-admin-entry',type:'button',style:'position:fixed;bottom:56px;right:10px;z-index:18000;background:#1b4268;color:#fff;border:2px solid #dbc37d;border-radius:12px;padding:8px 12px;font:700 12px system-ui'},'⚙️ Z37 ADMIN');
  b.hidden=true;b.addEventListener('click',open);document.body.append(b);
  setInterval(async()=>{if(!document.getElementById('dfc-z37-admin-entry'))return;const ok=await verify();const atHome=!!document.getElementById('appView')&&!document.getElementById('appView').classList.contains('hidden');b.hidden=!ok||!atHome||!!document.getElementById('dfc-z37-admin-panel')},7000);
 }
 function close(){view?.remove();view=null;const b=document.getElementById('dfc-z37-admin-entry');if(b)b.hidden=false;}
 async function open(){
  if(!await verify())return;
  close();view=e('div',{id:'dfc-z37-admin-panel',style:'position:fixed;inset:0;background:#09192f;color:#fff;z-index:210000;overflow:auto;padding:clamp(12px,3vw,24px);font:14px system-ui'});
  view.innerHTML='<header style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2>ADMINISTRADOR Z37 · BORRADORES</h2><button type="button" id="z37-admin-exit">✕ Salir</button></header><div style="display:flex;gap:10px;flex-wrap:wrap" id="z37-admin-tabs"></div><div id="z37-admin-body"></div><p style="font-size:12px;color:#acc0d7">Las mesas y torneos nuevos permanecerán desactivados hasta completar el motor de juego, la auditoría de saldos y las pruebas Android.</p>';
  document.body.append(view);
  view.querySelector('#z37-admin-exit').onclick=close;
  const tabs=view.querySelector('#z37-admin-tabs');
  [['tournaments','🏆 Torneos'],['points','🪙 Mesas por puntos'],['funds','💰 Premios'],['status','📋 Supervisión']].forEach(([id,name])=>{const btn=e('button',{type:'button','data-tab':id},name);btn.style.cssText='background:#1e486d;color:white;border:1px solid #81a1c5;border-radius:10px;padding:9px 12px';btn.onclick=()=>render(id);tabs.append(btn)});
  render('tournaments');
 }
 function field(k,label,type='number',val='',other=''){
  return '<label style="display:flex;flex-direction:column;gap:4px;min-width:145px;flex:1 1 160px">'+esc(label)+'<input name="'+esc(k)+'" type="'+type+'" value="'+esc(val)+'" '+other+' style="padding:10px;border-radius:8px;color:#fff;background:#132d49;border:1px solid #8194a9"></label>'
 }
 function sel(k,label,values){
  return '<label style="display:flex;flex-direction:column;min-width:160px;flex:1 1 160px">'+esc(label)+'<select name="'+esc(k)+'" style="padding:10px;border-radius:8px;background:#173753;color:white">'+values.map(x=>'<option value="'+esc(x[0])+'">'+esc(x[1])+'</option>').join('')+'</select></label>'
 }
 function wrap(html){const el=e('div');el.innerHTML=html;el.style.cssText='max-width:1100px;margin:10px auto;display:flex;flex-wrap:wrap;gap:10px';return el}
 const formStyle='width:100%;display:flex;flex-wrap:wrap;gap:10px;border:1px solid #54728e;border-radius:14px;padding:15px';
 function formValues(f){return Object.fromEntries(new FormData(f).entries())}
 function saveHandler(f,rpcName,map){
   f.addEventListener('submit',async ev=>{
    ev.preventDefault();const status=f.querySelector('[data-status]'),button=f.querySelector('[type=submit]');
    button.disabled=true;status.textContent='Guardando...';
    try{const payload=map(formValues(f));const id=await rpc(rpcName,{p_input:payload});status.textContent='Borrador guardado correctamente. Identificador: '+id;}
    catch(err){status.textContent='No se guardó: '+err.message;}finally{button.disabled=false;}
   });
 }
 async function render(tab){
  if(!view)return;const host=view.querySelector('#z37-admin-body');host.innerHTML='<p>Consultando...</p>';
  if(tab==='tournaments'){
   const f=e('form',{style:formStyle});
   f.innerHTML='<h3 style="width:100%">Crear torneo — solo borrador</h3>'+
    field('name','Nombre','text','Gran Torneo FlashCoin','required maxlength="160"')+
    field('description','Descripción','text','Campeonato FlashCoin')+
    sel('artwork_key','Diseño', [['gold_blue','Dorado y azul'],['purple_neon','Morado neón'],['red_championship','Campeonato rojo'],['emerald_green','Esmeralda']])+
    field('starts_at','Inicio (fecha y hora)','datetime-local','','required')+
    field('registration_closes_at','Cierre de inscripción','datetime-local','','required')+
    field('min_players','Mínimo de jugadores','number','8','min="2" required')+
    field('entry_fc','Inscripción FC (0=gratis)','number','10','min="0" step=".01" required')+
    field('guaranteed_fc','Fondo garantizado gratis','number','0','min="0" step=".01" required')+
    field('signup_admin_pct','Administración inscripción %','number','10','min="0" max="100" step=".01" required')+
    field('diamond_initial','Diamantes iniciales','number','100','min="1" required')+
    field('diamond_pass_cost','Costo por pase','number','1','min="1" required')+
    field('diamond_minimum','Mínimo de diamantes','number','10','min="0" required')+
    field('rebuy_fc','Precio recompra FC','number','5','min="0" step=".01" required')+
    field('rebuy_diamonds','Diamantes por recompra','number','100','min="0" required')+
    field('card_expiry_days','Vencimiento tarjetas (días)','number','30','min="1" required')+
    sel('paid_places','Puestos premiados',Array.from({length:10},(_,i)=>[String(i+1),String(i+1)]))+
    field('prize_pct','Porcentajes ganadores separados por coma','text','50,30,10','required')+
    '<div style="width:100%"><button type="submit">Guardar borrador</button><p data-status aria-live="polite"></p></div>';
   host.replaceChildren(f);
   saveHandler(f,'dfc_z37_admin_save_tournament',x=>{
     const p=x.prize_pct.split(',').map(v=>Number(v.trim()));
     if(p.length!==Number(x.paid_places)||p.some(v=>!Number.isFinite(v)||v<=0))throw Error('Introduzca un porcentaje válido por puesto premiado');
     const start=new Date(x.starts_at),end=new Date(x.registration_closes_at);
     if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))throw Error('Fechas inválidas');
     return {...x,starts_at:start.toISOString(),registration_closes_at:end.toISOString(),prize_pct:p,
       entry_fc:Number(x.entry_fc),guaranteed_fc:Number(x.guaranteed_fc),signup_admin_pct:Number(x.signup_admin_pct),
       min_players:Number(x.min_players),diamond_initial:Number(x.diamond_initial),diamond_pass_cost:Number(x.diamond_pass_cost),
       diamond_minimum:Number(x.diamond_minimum),rebuy_fc:Number(x.rebuy_fc),rebuy_diamonds:Number(x.rebuy_diamonds),
       paid_places:Number(x.paid_places),card_expiry_days:Number(x.card_expiry_days)};
   });
  }else if(tab==='points'){
   const f=e('form',{style:formStyle});f.innerHTML='<h3 style="width:100%">Crear mesa por puntos — solo borrador</h3>'+
    field('name','Nombre','text','Mesa por puntos 1','required maxlength="160"')+
    sel('players','Participantes', [['2','2 jugadores'],['3','3 jugadores'],['4','4 jugadores (parejas)']])+
    field('target_points','Meta de puntos','number','200','min="1" required')+
    field('entry_fc','Entrada FC','number','10','min="0" step=".01" required')+
    field('entry_diamonds','Entrada diamantes','number','50','min="0" required')+
    field('max_negative_diamonds','Límite deuda de diamantes','number','200','min="0" required')+
    field('admin_pct','Comisión sobre ambos botes (%)','number','10','min="0" max="50" required')+
    '<div style="width:100%"><p>Capicúa +30 · Pase a la redonda +30 · Pase normal +0</p><button type="submit">Guardar borrador</button><p data-status aria-live="polite"></p></div>';
   host.replaceChildren(f);
   saveHandler(f,'dfc_z37_admin_save_points',x=>({...x,players:Number(x.players),target_points:Number(x.target_points),
     entry_fc:Number(x.entry_fc),entry_diamonds:Number(x.entry_diamonds),
     max_negative_diamonds:Number(x.max_negative_diamonds),admin_pct:Number(x.admin_pct)}));
  }else if(tab==='funds'){
   host.innerHTML='<h3>Premios, tarjetas y fondos</h3><p>La distribución acordada de recompras es 50% administración y 50% premios, sin segunda comisión.</p><p>Los fondos y premios reales se habilitarán después de verificar el libro de diamantes y las tarjetas FlashCoin de Z36. Esta pantalla no genera premios ficticios.</p>';
  }else{
   host.innerHTML='<h3>Supervisión</h3><p>Consultando los borradores guardados...</p>';
   try{const [t,p]=await Promise.all([rpc('dfc_z37_admin_tournaments'),rpc('dfc_z37_admin_points')]);
     host.innerHTML='<h3>Borradores de torneos: '+(t?.length||0)+'</h3><ul>'+t.map(x=>'<li>'+esc(x.name)+' — '+esc(x.state)+'</li>').join('')+'</ul><h3>Mesas por puntos: '+(p?.length||0)+'</h3><ul>'+p.map(x=>'<li>'+esc(x.name)+' — '+(x.enabled?'Activa':'Desactivada')+'</li>').join('')+'</ul>'}
   catch(err){host.textContent='No fue posible consultar: '+err.message}
  }
 }
 function boot(){setup();verify()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 window.dfcZ37Admin=Object.freeze({open});
})();
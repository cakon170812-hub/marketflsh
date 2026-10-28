// DOMINÓ FLASH COIN · Android nativo 0.12Z.8
// Los métodos de orientación no modifican el servidor ni la economía del juego.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { App } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { StatusBar } from '@capacitor/status-bar';

if(Capacitor.isNativePlatform() && Capacitor.getPlatform()==='android'){
  document.body.classList.add('dfc-android-native');
  const DfcKeepAwake=registerPlugin('DfcKeepAwake');
  const wake=enabled=>DfcKeepAwake.setKeepingAwake({enabled}).catch(e=>console.warn('WakeLock Android:',e));
  const previousForce=window.dominoForceLandscape;
  const previousRelease=window.dominoReleaseLandscape;
  const previousGuard=window.dominoUpdateRotateGuard;

  window.dominoUpdateRotateGuard=function(){
    const notice=document.getElementById('dominoRotateGuard');
    if(notice)notice.classList.remove('show');
  };
  window.dominoForceLandscape=async function(){
    document.body.classList.add('domino-playing');
    await wake(true);
    try{
      await ScreenOrientation.lock({orientation:'landscape'});
      await StatusBar.hide();
    }catch(error){
      console.warn('Orientación de Android no disponible:',error);
      // Mantener el juego jugable si algún dispositivo restringe la orientación.
      if(typeof previousForce==='function')await previousForce();
    }
    window.dominoUpdateRotateGuard();
  };
  window.dominoReleaseLandscape=function(){
    document.body.classList.remove('domino-playing');
    void wake(false);
    Promise.resolve(ScreenOrientation.lock({orientation:'portrait'})).catch(e=>console.warn(e));
    Promise.resolve(StatusBar.show()).catch(()=>{});
    if(typeof previousRelease==='function'){
      // Desactivar solo el modo pantalla web; la orientación nativa se restaura arriba.
      try{previousRelease()}catch(e){console.warn(e)}
    }
    window.dominoUpdateRotateGuard();
  };

  // Al regresar desde segundo plano, recuperar tablero y reloj del servidor.
  App.addListener('appStateChange',async ({isActive})=>{
    if(!isActive)return;
    if(!document.getElementById('dominoTablePanel')?.classList.contains('active'))return;
    try{
      await window.dominoForceLandscape();
      if(typeof window.resumeDominoIfStillInHand==='function')await window.resumeDominoIfStillInHand();
      if(typeof window.loadDominoState==='function')await window.loadDominoState(true,true);
      if(typeof window.dominoStartRealtime==='function')await window.dominoStartRealtime();
    }catch(e){console.warn('Reconexión Android:',e)}
  });

  // Apertura en frío: si se cerró la app pero el servidor conserva el asiento,
  // volver a la partida y recuperar el estado real, sin cobrar otra entrada.
  let coldResumeDone=false;
  let coldResumeInProgress=false;
  async function recoverPreviousSeat(){
    if(coldResumeDone||coldResumeInProgress)return;
    coldResumeInProgress=true;
    if(document.getElementById('dominoTablePanel')?.classList.contains('active')){
      coldResumeDone=true;return;
    }
    if(document.getElementById('appView')?.classList.contains('hidden'))return;
    try{
      const client=(typeof sb!=='undefined')?sb:window.sb;
      if(!client)return;
      const authResult=await client.auth.getSession();
      if(!authResult?.data?.session)return;
      const {data,error}=await client.rpc('rf_domino_get_lobby_v11');
      if(error||!data?.my_table||data?.my_state==='abandoned')return;
      if(typeof window.openDominoLobby==='function')await window.openDominoLobby();
      const button=document.getElementById('dominoResumeTableBtn');
      if(button){button.click();
        await new Promise(resolve=>setTimeout(resolve,1200));
        if(document.getElementById('dominoTablePanel')?.classList.contains('active'))coldResumeDone=true;
      }
    }catch(e){console.warn('Restauración de asiento Android:',e)}
    finally{coldResumeInProgress=false}
  }
  // No entrar por fuerza a otra mesa: solo restaurar si servidor confirma asiento.
  setTimeout(recoverPreviousSeat,3500);
  setTimeout(recoverPreviousSeat,7500);

  // Botón físico Atrás: nunca abandonar ni perder Flash Coin silenciosamente.
  App.addListener('backButton',()=>{
    const playing=document.getElementById('dominoTablePanel')?.classList.contains('active');
    if(playing){
      if(window.dominoSpectatorMode && typeof window.dominoExitSpectator==='function'){
        window.dominoExitSpectator();
      } else document.getElementById('dominoSurrenderBtn')?.click();
      return;
    }
    // Fuera de mesa, respetar el comportamiento del sistema.
    if(window.history.length>1)window.history.back();
    else App.minimizeApp().catch(()=>{});
  });
  console.log('Dominó Flash Coin · Android nativo activo');
}

// DFC OTA 0.12Z.11 · El administrador decide la versión aprobada en GitHub.
// Nunca cargar cambios desde index.html de pruebas dentro del APK por iniciativa propia.
if(Capacitor.isNativePlatform() && Capacitor.getPlatform()==='android'){
  // Inmediato: plugin requiere confirmación del arranque para permitir rollback nativo.
  void CapacitorUpdater.notifyAppReady().catch(e=>console.warn('Confirmación de actualización:',e));
  const CURRENT_BUILTIN='0.12Z.27'; // SOLO para APK nativa nueva compilada con esta versión
  const MANIFEST='https://cakon170812-hub.github.io/marketflsh/android-approved/manifest.json';
    let latest=null, busy=false, lastCheck=0;
  const atTable=()=>document.getElementById('dominoTablePanel')?.classList.contains('active') || document.body.classList.contains('domino-playing');
  const keyVersion=(v)=>String(v||'').match(/\d+/g)?.map(Number)||[];
  const newer=(a,b)=>{const x=keyVersion(a),y=keyVersion(b);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0)}return false};
  function button(){
    let b=document.getElementById('dfcOTAUserButton');if(b)return b;
    b=document.createElement('button');b.id='dfcOTAUserButton';b.type='button';b.hidden=true;
    b.textContent='Nueva actualización disponible';b.style.cssText='position:fixed;z-index:999991;left:10px;bottom:12px;padding:12px 16px;background:#075ba6;border:2px solid #9bdfff;border-radius:13px;color:white;font:bold 13px system-ui;box-shadow:0 4px 15px #0007';
    b.addEventListener('click',()=>void install());document.body.append(b);return b;
  }
  function visible(){const b=button();b.hidden=!latest||atTable()||busy}
  async function check(){
    if(document.hidden||busy||Date.now()-lastCheck<90_000)return;
    lastCheck=Date.now();
    try{
      const response=await fetch(MANIFEST+'?v='+Date.now(),{cache:'no-store'});
      if(response.status===404)return; if(!response.ok)throw new Error('HTTP '+response.status);
      const manifest=await response.json();
      if(!/^0\.12Z\.\d{1,4}$/.test(manifest.version)|| !/^[a-f0-9]{64}$/i.test(manifest.sha256||''))return;
      const bundle=(await CapacitorUpdater.current()).bundle;
      const current=!bundle || bundle.id==='builtin' || bundle.version==='builtin'?CURRENT_BUILTIN:(bundle.version||CURRENT_BUILTIN);
      const url=new URL(manifest.url);
      if(url.origin!=='https://cakon170812-hub.github.io'||!url.pathname.startsWith('/marketflsh/android-approved/bundles/')||!url.pathname.endsWith('.zip'))return;
      latest=newer(manifest.version,current)?{version:manifest.version,url:url.href,sha256:manifest.sha256||''}:null;
      visible();
    }catch(e){console.warn('Actualización pendiente de revisión:',e);}
  }
  async function safeToSwitch(){
    if(atTable())return false;
    const client=(typeof sb!=='undefined')?sb:window.sb;
    if(!client)return false;
    // No reiniciar si existe mesa ocupada, aunque el jugador esté fuera del tablero.
    try{
      const sess=await client.auth.getSession();if(!sess?.data?.session)return true;
      const {data,error}=await client.rpc('rf_domino_get_lobby_v11');
      if(error || !data || typeof data!=='object' || !('my_table' in data))return false;
      return !data.my_table || data.my_state==='abandoned';
    }catch(_){return false}
  }
  async function install(){
    if(busy||!latest||atTable())return;
    if(!await safeToSwitch()){alert('Tienes una mesa o mano en curso. Termínala antes de actualizar; tu asiento permanecerá intacto.');return}
    const approved=latest;
    if(!confirm('¿Descargar y activar la actualización '+approved.version+'? La aplicación volverá al inicio cuando termine.'))return;
    busy=true;visible();
    const b=button();b.hidden=false;b.disabled=true;b.textContent='Descargando actualización…';
    try{
      const pkg=await CapacitorUpdater.download({version:approved.version,url:approved.url,checksum:approved.sha256});
      if(!pkg?.id)throw new Error('No se recibió un paquete válido');
      // Entre descarga y activación puede haber comenzado una mano.
      if(!await safeToSwitch()){alert('Se descargó la actualización, pero tienes una partida en curso. Vuelve al inicio y pulsa Actualizar después.');return}
      await CapacitorUpdater.set({id:pkg.id}); // Recarga inmediata; no se ejecuta código posterior.
    }catch(e){console.warn('No se pudo instalar la versión aprobada:',e);alert('No se pudo aplicar la actualización. Se conserva la versión anterior.');}
    finally{busy=false;b.disabled=false;b.textContent='Nueva actualización disponible';visible()}
  }
  window.addEventListener('online',()=>void check());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check()});
  document.addEventListener('DOMContentLoaded',()=>{void check();const table=document.getElementById('dominoTablePanel');if(table)new MutationObserver(visible).observe(table,{attributes:true,attributeFilter:['class']})},{once:true});
  void check();
}

// DOMINÓ FLASH COIN · proyecto Android reconstruido · base HTML 0.12Z.28.
// No modifica las jugadas, premios ni la base de datos.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar } from '@capacitor/status-bar';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

const native = Capacitor.isNativePlatform() && Capacitor.getPlatform()==='android';
if (native) {
  document.documentElement.classList.add('dfc-android-native');
  const BASE_VERSION='0.12Z.28';
  const MANIFEST='https://cakon170812-hub.github.io/marketflsh/android-approved/manifest.json';
  const UPDATES_ORIGIN='https://cakon170812-hub.github.io';
  let candidate=null;
  let busy=false;
  let checkedAt=0;
  const tableOpen=()=>document.getElementById('dominoTablePanel')?.classList.contains('active');
  // La visibilidad depende SOLO de la pantalla de ESTE dispositivo, nunca de otros jugadores.
  const homeVisible=()=>{
    const home=document.getElementById('appView');
    const lobby=document.getElementById('dominoLobbyPanel');
    return !!home && !home.classList.contains('hidden') && !tableOpen() && !lobby?.classList.contains('active') && !lobby?.classList.contains('show');
  };
  const parts=(x)=>String(x||'').match(/^0\.12Z\.(\d+)$/)?.[1];
  const greater=(a,b)=>parts(a)!=null && parts(b)!=null && Number(parts(a))>Number(parts(b));
  function updateButton(){
    let b=document.getElementById('dfcOTAUserButton');
    if(!b){
      b=document.createElement('button');b.type='button';b.id='dfcOTAUserButton';
      b.style.cssText='position:fixed;bottom:calc(12px + env(safe-area-inset-bottom,0px));left:12px;z-index:999999;padding:12px 16px;background:#075ba6;border:2px solid #9bdfff;border-radius:14px;color:white;font:700 14px system-ui;box-shadow:0 4px 18px #0008';
      b.addEventListener('click',()=>void window.dfcInstallApprovedUpdate());
      document.body.appendChild(b);
    }
    b.textContent=busy?'Descargando actualización…':`Actualizar · ${candidate?.version||''}`;
    b.disabled=busy;
    // Visible en inicio aunque otros jugadores estén en partidas.
    // Se oculta dentro de mesa o lobby, incluso durante una descarga.
    b.hidden=!candidate||!homeVisible();
    return b;
  }
  async function safeToRestart(){
    if(tableOpen())return false;
    try{
      const client=window.sb;
      if(!client?.auth?.getSession || !client?.rpc)return false;
      const result=await client.auth.getSession();
      if(!result?.data?.session)return true;
      const {data,error}=await client.rpc('rf_domino_get_lobby_v11');
      return !error && !!data && (!data.my_table || data.my_state==='abandoned');
    }catch{return false;}
  }
  async function currentVersion(){
    try{
      const data=await CapacitorUpdater.current();
      return data?.bundle && data.bundle.id!=='builtin' && data.bundle.version!=='builtin' ? data.bundle.version : BASE_VERSION;
    }catch{return BASE_VERSION;}
  }
  async function check(){
    if(busy||document.hidden||Date.now()-checkedAt<90000)return;
    checkedAt=Date.now();
    try{
      const response=await fetch(MANIFEST+'?check='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const m=await response.json();
      const url=new URL(m.url);
      if(!parts(m.version) || !/^[a-f0-9]{64}$/i.test(m.sha256||'') || url.origin!==UPDATES_ORIGIN || !url.pathname.startsWith('/marketflsh/android-approved/bundles/') || !url.pathname.endsWith('.zip'))return;
      candidate=greater(m.version,await currentVersion())?{version:m.version,url:url.toString(),sha256:m.sha256}:null;
      updateButton();
    }catch(error){console.warn('Consulta de actualización:',error)}
  }
  window.dfcInstallApprovedUpdate=async function(){
    if(busy||!homeVisible())return;
    if(!candidate){await check();return;}
    if(!await safeToRestart()){
      alert('No se puede actualizar durante una mesa o una conexión de estado incierto. Sal de la mesa de forma segura antes de actualizar.');return;
    }
    if(!confirm('¿Instalar la actualización autorizada '+candidate.version+'?'))return;
    const target=candidate;
    busy=true;updateButton();
    try{
      const pkg=await CapacitorUpdater.download({version:target.version,url:target.url,checksum:target.sha256});
      if(!pkg?.id)throw new Error('El paquete de actualización no es válido');
      if(!await safeToRestart()){
        alert('Actualización descargada. Hay una partida activa; vuelve a intentarlo cuando termines.');return;
      }
      await CapacitorUpdater.set({id:pkg.id});
    }catch(error){console.warn('Actualización cancelada:',error);alert('No se pudo activar la actualización. Conservamos la versión anterior.');}
    finally{busy=false;updateButton();}
  };
  // Adaptar la mesa a la orientación física del dispositivo, sin bloqueo forzoso.
  window.dominoForceLandscape=async function(){
    document.body.classList.add('domino-playing');
    try{await ScreenOrientation.unlock();await StatusBar.hide()}catch(error){console.warn('Orientación:',error)}
    document.getElementById('dominoRotateGuard')?.classList.remove('show');
  };
  window.dominoReleaseLandscape=async function(){
    document.body.classList.remove('domino-playing');
    try{await ScreenOrientation.unlock();await StatusBar.show()}catch(error){console.warn('Orientación:',error)}
    document.getElementById('dominoRotateGuard')?.classList.remove('show');
  };
  window.dominoUpdateRotateGuard=()=>document.getElementById('dominoRotateGuard')?.classList.remove('show');
  void CapacitorUpdater.notifyAppReady().catch(error=>console.warn('Estado APK:',error));
  void StatusBar.setOverlaysWebView({overlay:false}).catch(()=>{});
  App.addListener('appStateChange',async ({isActive})=>{
    if(!isActive)return;
    void check();
    if(tableOpen()){
      try{
        if(typeof window.loadDominoState==='function')await window.loadDominoState(true,true);
        if(typeof window.dominoStartRealtime==='function')await window.dominoStartRealtime();
      }catch(error){console.warn('Recuperación de mesa:',error)}
    }
  });
  App.addListener('backButton',()=>{
    if(tableOpen()){
      if(window.dominoSpectatorMode && typeof window.dominoExitSpectator==='function')window.dominoExitSpectator();
      else document.getElementById('dominoSurrenderBtn')?.click();
    }else if(history.length>1){history.back();}
    else{void App.minimizeApp();}
  });
  document.addEventListener('DOMContentLoaded',()=>{updateButton();void check();
    const t=document.getElementById('dominoTablePanel');
    if(t)new MutationObserver(updateButton).observe(t,{attributes:true,attributeFilter:['class']});
    for(const id of ['appView','dominoLobbyPanel']){
      const el=document.getElementById(id);
      if(el)new MutationObserver(updateButton).observe(el,{attributes:true,attributeFilter:['class','style']});
    }
  },{once:true});
  window.addEventListener('online',()=>void check());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check()});
}

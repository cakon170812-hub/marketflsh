/* DOMINÓ FLASH COIN 0.12Z.29 — mejoras locales seguras.
 * No escribe saldos ni ejecuta jugadas en Supabase.
 */
(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
/* Cuadrícula de tarjetas de mesas, sin alterar su funcionalidad */
.domino-tables{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
@media(min-width:800px){.domino-tables{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
.domino-table-mini{min-width:0!important;max-width:100%;overflow-wrap:anywhere}
/* Fondo completo sin recortar por sobrezoom */
#dominoTablePanel .dfc11-scene img,#dominoTablePanel .domino-table-background img{max-width:100%;max-height:100%;object-fit:contain!important}
#dominoTablePanel{background-position:center!important;background-repeat:no-repeat!important}
/* Animación de reparto reducida sin modificar servidor */
.domino-hand .domino-piece.dealing{animation-duration:.20s!important}
.domino-hand .deal-0{animation-delay:.02s!important}.domino-hand .deal-1{animation-delay:.06s!important}
.domino-hand .deal-2{animation-delay:.10s!important}.domino-hand .deal-3{animation-delay:.14s!important}
.domino-hand .deal-4{animation-delay:.18s!important}.domino-hand .deal-5{animation-delay:.22s!important}
.domino-hand .deal-6{animation-delay:.26s!important}
#dfc-z29-music-toggle{position:fixed;right:9px;bottom:calc(9px + env(safe-area-inset-bottom));z-index:8000;border:1px solid #ba9f5b;border-radius:13px;background:#101a29;color:#ffe5a0;padding:8px 10px;font:700 12px system-ui}
`;document.head.appendChild(style);
// Música ambiental original mediante WebAudio. Solo empieza tras una interacción consciente.
let ctx=null,enabled=false,interval=null,note=0;
const melody=[392,440,494,440,392,330,392,440,494,440,392,0];
function audio(){ctx??=new (window.AudioContext||window.webkitAudioContext)();return ctx}
function tone(freq,duration=.19,volume=.018){if(!freq)return;const c=audio(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(volume,c.currentTime+.018);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration+.01)}
function playing(){return document.getElementById('dominoTablePanel')?.classList.contains('active')||document.body.classList.contains('domino-playing')}
function stop(){if(interval!==null)clearInterval(interval);interval=null}
function musicStep(){if(playing()||document.hidden){stop();return}try{tone(melody[note++%melody.length])}catch(e){console.warn('Música:',e)}}
function start(){if(!enabled||playing()||interval!==null)return;try{void audio().resume();musicStep();interval=setInterval(musicStep,325)}catch(e){console.warn('Audio no disponible:',e)}}
function update(){const b=document.getElementById('dfc-z29-music-toggle');if(b)b.textContent=enabled?'♫ Música: ON':'♫ Música: OFF';if(enabled)start();else stop()}
function init(){const b=document.createElement('button');b.id='dfc-z29-music-toggle';b.type='button';b.textContent='♫ Música: OFF';b.addEventListener('click',()=>{enabled=!enabled;update()});document.body.appendChild(b);const t=document.getElementById('dominoTablePanel');if(t)new MutationObserver(()=>{stop();if(!playing())start()}).observe(t,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

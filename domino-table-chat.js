(() => {
  'use strict';
  const panel = document.getElementById('dominoTablePanel');
  const stage = document.getElementById('dominoStage');
  const chat = document.getElementById('dominoChatBtn');
  if (!panel || !stage || !chat || document.getElementById('dominoVoiceBtn')) return;

  const voiceButton = document.createElement('button');
  voiceButton.type = 'button';
  voiceButton.id = 'dominoVoiceBtn';
  voiceButton.setAttribute('aria-label', 'Grabar nota de voz');
  voiceButton.setAttribute('aria-pressed', 'false');
  voiceButton.title = 'Grabar nota de voz';
  voiceButton.textContent = '🎙';
  voiceButton.className = chat.className;
  voiceButton.style.touchAction = 'none';
  voiceButton.style.userSelect = 'none';
  chat.after(voiceButton);
  const chatList = document.getElementById('dominoChatList');
  const voiceHistory = document.createElement('section');
  voiceHistory.className = 'dfc-voice-history';
  voiceHistory.hidden = true;
  function attachHistory(){
    if(chatList && voiceHistory.parentNode!==chatList)chatList.append(voiceHistory);
  }
  attachHistory();
  if(chatList)new MutationObserver(attachHistory).observe(chatList,{childList:true});
  const voiceStyle=document.createElement('style');
  voiceStyle.textContent=`
    .dfc-voice-history{display:grid;gap:7px;padding:4px;min-width:0}
    .dfc-voice-history[hidden]{display:none!important}
    .dfc-voice-note{min-width:0;display:block}
    .dfc-voice-ui,#dominoTablePanel #dominoVoiceCard.dfc-voice-ui{
      box-sizing:border-box;display:flex;align-items:center;gap:9px;padding:9px 11px;
      border:1px solid #d7e3dc;border-radius:18px;background:#fff!important;
      color:#17271e!important;text-align:left;font:600 12px/1.25 system-ui,sans-serif;
      min-width:0;box-shadow:0 2px 10px #0003
    }
    .dfc-voice-note .dfc-voice-ui{width:100%;max-width:100%;margin:0}
    #dominoTablePanel #dominoVoiceCard.dfc-voice-ui{width:min(360px,56vw);max-width:calc(100% - 20px);min-width:0}
    #dominoTablePanel #dominoVoiceCard.dfc-voice-ui[hidden]{display:none!important}
    .dfc-voice-ui .dfc-voice-icon{display:grid;place-items:center;width:32px;height:32px;flex:0 0 32px;
      background:#e3f8e9;color:#137b39!important;border-radius:50%;font-size:19px!important;animation:none!important}
    .dfc-voice-ui .dfc-voice-body{display:grid;flex:1;min-width:0;gap:5px;white-space:normal!important}
    .dfc-voice-ui .dfc-voice-meta{display:flex;justify-content:space-between;align-items:center;gap:6px;min-width:0}
    .dfc-voice-ui .dfc-voice-sender{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:12px!important}
    .dfc-voice-ui .dfc-voice-time,.dfc-voice-ui .dfc-voice-duration{font:500 10px/1.25 system-ui,sans-serif;color:#45534b!important;white-space:nowrap}
    .dfc-voice-ui .dfc-voice-track{display:block;height:7px;background:#e0e7e2;border-radius:10px;overflow:hidden;width:100%}
    .dfc-voice-ui .dfc-voice-fill{display:block;height:100%;width:100%;background:#22c55e;border-radius:10px;transition:width 120ms linear}
    .dfc-voice-ui:focus-visible{outline:2px solid #169347;outline-offset:2px}
    @media(prefers-reduced-motion:reduce){.dfc-voice-fill{transition:none!important}}
  `;
  document.head.append(voiceStyle);
  const clips = new Map();
  let manualGeneration=0;
  // Do not transcode the recorded bytes. AAC-LC in MP4 is preferred at capture;
  // unsupported Opus containers use a local decoder, not a lower-quality copy.
  const captureFormats=['audio/mp4;codecs=mp4a.40.2','audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'];
  function chooseCaptureFormat(supports){return captureFormats.find(type=>supports(type));}
  function isOpusContainer(mime){return /^(audio\/(webm|ogg))$/i.test(String(mime||'').split(';')[0]);}
  let decoderLoading=null;
  const decoderBase=new URL('./vendor/ogv-1.9.0/',document.baseURI).href;
  function loadVoiceDecoder(){
    if(typeof window.OGVPlayer==='function')return Promise.resolve();
    if(!decoderLoading)decoderLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=new URL('ogv.js',decoderBase).href;script.async=true;
      const timer=setTimeout(()=>finish(Error('El decodificador no respondió')),12000);
      function finish(error){
        clearTimeout(timer);script.onload=script.onerror=null;
        if(error){script.remove();decoderLoading=null;reject(error);}else resolve();
      }
      script.onload=()=>{
        if(typeof window.OGVPlayer!=='function'){finish(Error('Decodificador de voz no disponible'));return;}
        if(window.OGVLoader)window.OGVLoader.base=decoderBase.replace(/\/$/,'');
        finish();
      };
      script.onerror=()=>finish(Error('Falta el decodificador local de voz'));
      document.head.append(script);
    });
    return decoderLoading;
  }
  function historyPlayers(){return [...clips.values()].map(entry=>entry.player);}
  function historyPlaying(){return historyPlayers().some(player=>!player.paused&&!player.ended);}
  function pauseHistory(except){historyPlayers().forEach(player=>{if(player!==except)player.pause();});}
  function disposeVoicePlayer(player){
    if(!player)return;
    try{player.pause();player.src='';player.removeAttribute('src');player.load();}catch(_){}
    player.remove();
  }
  function nativeAccepts(mime){
    const probe=document.createElement('audio');
    return Boolean(probe.canPlayType(mime));
  }
  async function prepareEntryPlayer(entry,force=false){
    if(entry.decoder||!isOpusContainer(entry.mime)||(!force&&nativeAccepts(entry.mime)))return;
    const version=roomVersion;
    await loadVoiceDecoder();
    if(version!==roomVersion||!clips.has(entry.id))throw Error('La mesa cambió');
    if(entry.decoder)return;
    const next=new window.OGVPlayer({worker:true});
    next.hidden=true;next.setAttribute('aria-hidden','true');next.style.display='none';
    const old=entry.player;
    entry.decoder=true;entry.player=next;
    bindHistoryPlayer(entry,next);entry.row.append(next);
    next.src=entry.url;
    disposeVoicePlayer(old);
  }
  function bindHistoryPlayer(entry,player){
    for(const event of ['loadedmetadata','durationchange','timeupdate','play','pause','ended','error'])
      player.addEventListener(event,()=>{if(entry.player===player)drawVoiceProgress(entry.view,player);});
    player.addEventListener('play',()=>{
      if(entry.player!==player)return;
      if(recorder||requesting||document.hidden){player.pause();return;}
      removeAudio();pauseHistory(player);
    });
    player.addEventListener('ended',()=>{if(entry.player===player)void showVoice();});
    player.addEventListener('error',()=>{
      if(entry.player!==player||!entry.url)return;
      if(!entry.decoder&&isOpusContainer(entry.mime)){
        entry.forceDecoder=true;
        entry.view.duration.textContent='Toca para escuchar en modo compatible';
      }else entry.view.duration.textContent='No se pudo reproducir. Toca para reintentar';
    });
  }
  function formatServerTime(value){
    const date=new Date(value||'');
    if(!Number.isFinite(date.getTime()))return 'Hora pendiente';
    const opts={hour:'numeric',minute:'2-digit'};
    if(date.toDateString()!==new Date().toDateString())Object.assign(opts,{day:'numeric',month:'short',year:'numeric'});
    return new Intl.DateTimeFormat('es-DO',opts).format(date);
  }
  function formatDuration(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return '–:––';
    const whole=Math.floor(seconds);
    return Math.floor(whole/60)+':'+String(whole%60).padStart(2,'0');
  }
  function makeVoiceView(button){
    button.classList.add('dfc-voice-ui');
    const icon=document.createElement('span');icon.className='dfc-voice-icon';icon.textContent='▶';
    const body=document.createElement('span');body.className='dfc-voice-body';
    const meta=document.createElement('span');meta.className='dfc-voice-meta';
    const name=document.createElement('strong');name.className='dfc-voice-sender';
    const time=document.createElement('time');time.className='dfc-voice-time';
    const track=document.createElement('span');track.className='dfc-voice-track';
    const fill=document.createElement('span');fill.className='dfc-voice-fill';track.append(fill);
    const duration=document.createElement('span');duration.className='dfc-voice-duration';duration.textContent='0:00 / –:––';
    meta.append(name,time);body.append(meta,track,duration);button.append(icon,body);
    return {button,icon,name,time,fill,duration};
  }
  function setVoiceMeta(view,meta){
    view.name.textContent=meta.mine?'Tú':(meta.sender_name||'Jugador');
    view.time.textContent=formatServerTime(meta.created_at);
    if(meta.created_at)view.time.dateTime=meta.created_at;else view.time.removeAttribute('datetime');
    view.button.setAttribute('aria-label','Reproducir nota de voz de '+view.name.textContent);
  }
  function drawVoiceProgress(view,player){
    const duration=player?.duration;
    const position=Number(player?.currentTime)||0;
    const valid=Number.isFinite(duration)&&duration>0;
    const playing=Boolean(player&&!player.paused&&!player.ended);
    view.icon.textContent=playing?'Ⅱ':'▶';
    view.button.setAttribute('aria-pressed',String(playing));
    view.fill.style.width=(valid?Math.max(0,Math.min(100,(1-position/duration)*100)):100)+'%';
    view.duration.textContent=formatDuration(position)+' / '+formatDuration(duration);
  }
  function installBlob(entry,blob){
    if(!entry.url){
      entry.mime=blob.type.split(';')[0];
      entry.url=URL.createObjectURL(blob);
      entry.player.src=entry.url;
      entry.player.load();
    }
  }
  function rememberClip(meta,blob){
    const id=String(meta.id);
    let entry=clips.get(id);
    if(!entry){
      const row=document.createElement('div');row.className='dfc-voice-note';
      const button=document.createElement('button');button.type='button';
      const view=makeVoiceView(button);
      const player=document.createElement('audio');player.preload='metadata';player.hidden=true;
      entry={id,row,view,player,url:'',mime:'',decoder:false,forceDecoder:false,meta:{...meta}};
      clips.set(id,entry);
      bindHistoryPlayer(entry,player);
      button.onclick=()=>void replayClip(entry);
      row.append(button,player);voiceHistory.append(row);voiceHistory.hidden=false;attachHistory();
    }else entry.meta={...entry.meta,...meta,created_at:meta.created_at||entry.meta.created_at};
    setVoiceMeta(entry.view,entry.meta);
    if(blob)installBlob(entry,blob);
    return entry;
  }
  async function getClipBlob(id,tableId){
    const {data,error}=await sb.rpc('dfc_domino_read_voice',{p_table_id:tableId,p_note_id:id});
    if(error||!data)throw Error(error?.message||'La nota ya no está disponible');
    const bytes=Uint8Array.from(atob(data.audio),char=>char.charCodeAt(0));
    return new Blob([bytes],{type:data.mime});
  }
  async function replayClip(entry){
    if(recorder||requesting||document.hidden||!room)return;
    if(!entry.player.paused){entry.player.pause();return;}
    const version=roomVersion,token=++manualGeneration,tableId=room;
    try{
      if(!entry.url){
        entry.view.duration.textContent='Cargando…';
        const blob=await getClipBlob(entry.id,tableId);
        if(version!==roomVersion||token!==manualGeneration||room!==currentRoom()||recorder||requesting||document.hidden)return;
        installBlob(entry,blob);
      }
      if(version!==roomVersion||token!==manualGeneration||recorder||requesting||document.hidden)return;
      const needsDecoder=!entry.decoder&&isOpusContainer(entry.mime)&&(entry.forceDecoder||!nativeAccepts(entry.mime));
      if(needsDecoder){
        entry.view.duration.textContent='Preparando audio compatible…';
        await prepareEntryPlayer(entry,entry.forceDecoder);
        if(version!==roomVersion||token!==manualGeneration)return;
        entry.view.duration.textContent='Toca para escuchar';
        return; // iOS requires a fresh direct user gesture after asynchronous setup.
      }
      removeAudio();
      pauseHistory(entry.player);
      if(entry.player.ended)entry.player.currentTime=0;
      await entry.player.play();
    }catch(error){
      if(version===roomVersion&&token===manualGeneration){entry.view.duration.textContent='Toca para reintentar';dominoShowToast(error.message||'No se pudo reproducir la nota');}
    }
  }
  function clearClips(){
    manualGeneration++;
    clips.forEach(entry=>{disposeVoicePlayer(entry.player);if(entry.url)URL.revokeObjectURL(entry.url);});
    clips.clear();voiceHistory.replaceChildren();voiceHistory.hidden=true;
  }

  const voiceCard=document.createElement('button');
  voiceCard.type='button';voiceCard.id='dominoVoiceCard';voiceCard.hidden=true;
  const floatingView=makeVoiceView(voiceCard);
  stage.append(voiceCard);

  const maxRecordingMs = 300000;
  const maxVoiceBytes = 5 * 1024 * 1024;
  const voiceBitrate = 96000;
  let held = false, requesting = false, clockTimer = 0, startedAt = 0;
  let room = 0;
  let roomAccount = '';
  let roomVersion = 0;
  let lastPoll = 0;
  let readingRoom = 0;
  let textTimer = 0;
  let recorder = null;
  let stream = null;
  let recordingTimer = 0;
  let pendingNote = null;
  let audio = null;
  let soundUrl = '';
  let loadingVoice = false;
  const seen = new Set();
  const textQueue = [];
  const voiceQueue = [];

  function currentRoom() {
    return panel.classList.contains('active') && !window.dominoSpectatorMode
      ? Number(dominoCurrentTableId) || 0 : 0;
  }

  function setRecording(active, label = active ? 'Detener y enviar nota de voz' : 'Grabar nota de voz') {
    voiceButton.toggleAttribute('data-recording', active);
    voiceButton.setAttribute('aria-pressed', String(active));
    voiceButton.setAttribute('aria-label', label);
    voiceButton.title = label;
    if (!active) {clearInterval(clockTimer);clockTimer=0;voiceButton.textContent='🎙';}
  }

  function setVoiceCapture(active) {
    window.dfcVoiceRecording=active;
    try { if(navigator.audioSession) navigator.audioSession.type=active?'play-and-record':'playback'; } catch(_){}
    document.dispatchEvent(new CustomEvent('dfc:voice-capture',{detail:{active}}));
  }
  function releaseMic() {
    setVoiceCapture(false);
    clearTimeout(recordingTimer);
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
  }

  function removeAudio() {
    if (audio) {
      audio.onended = audio.onerror = null;
      disposeVoicePlayer(audio);
      audio = null;
    }
    if (soundUrl) URL.revokeObjectURL(soundUrl);
    soundUrl = '';
    voiceCard.hidden = true;
    voiceCard.removeAttribute('data-playing');
  }

  function syncRoom() {
    const nextRoom = currentRoom();
    const account = typeof me === 'undefined' ? '' : String(me?.id || '');
    if (nextRoom === room && account === roomAccount) return;
    room = nextRoom;
    roomAccount = account;
    roomVersion++;
    lastPoll = 0;
    seen.clear();
    textQueue.length = voiceQueue.length = 0;
    clearTimeout(textTimer);
    textTimer = 0;
    document.getElementById('dfcZ28ChatFloat')?.remove();
    const recording = recorder;
    recorder = null;
    if (recording?.state === 'recording') recording.stop();
    releaseMic();
    pendingNote = null;held = false;
    voiceButton.disabled = false;
    setRecording(false);
    removeAudio();clearClips();
    document.getElementById('dominoChatList')?.replaceChildren();
    document.getElementById('dominoMiniChatList')?.replaceChildren();
    dominoUserMessageCache.clear();
  }

  function showText() {
    if (textTimer || !textQueue.length || !room) return;
    dfcZ28ShowTableText(textQueue.shift());
    textTimer = setTimeout(() => {
      textTimer = 0;
      showText();
    }, 10000);
  }

  function finishVoice() {
    removeAudio();
    void showVoice();
  }

  async function playVoice(clip){
    try{
      await clip.play();
      if(audio!==clip)return;
      voiceCard.setAttribute('data-playing','');
      drawVoiceProgress(floatingView,clip);
    }catch(error){
      if(audio!==clip)return;
      if(error.name!=='NotAllowedError'){if(clip.error&&typeof clip.onerror==='function')clip.onerror();else finishVoice();return;}
      drawVoiceProgress(floatingView,clip);
    }
  }

  async function showVoice(){
    if(!room||document.hidden||requesting||recorder||loadingVoice||audio||!voiceQueue.length||historyPlaying())return;
    const row=voiceQueue.shift(),version=roomVersion,tableId=room;
    loadingVoice=true;
    try{
      const entry=rememberClip(row);
      if(!entry.url){
        const blob=await getClipBlob(row.id,tableId);
        if(version!==roomVersion||room!==currentRoom())return;
        installBlob(entry,blob);
      }
      if(document.hidden||requesting||recorder||historyPlaying()){voiceQueue.unshift(row);return;}
      const useDecoder=isOpusContainer(entry.mime)&&(entry.forceDecoder||!nativeAccepts(entry.mime));
      if(useDecoder){
        setVoiceMeta(floatingView,entry.meta);
        floatingView.duration.textContent='Preparando audio compatible…';
        voiceCard.hidden=false;
        try{await prepareEntryPlayer(entry,entry.forceDecoder);}catch(error){
          if(version===roomVersion){entry.view.duration.textContent='Audio compatible pendiente';dominoShowToast(error.message);}
          return;
        }
        if(version!==roomVersion||room!==currentRoom()||requesting||recorder||document.hidden)return;
        const fallback=new window.OGVPlayer({worker:true});
        fallback.hidden=true;fallback.style.display='none';stage.append(fallback);
        fallback.src=entry.url;
        audio=fallback;
        for(const event of ['loadedmetadata','durationchange','timeupdate','play','pause'])
          fallback.addEventListener(event,()=>{if(audio===fallback)drawVoiceProgress(floatingView,fallback);});
        fallback.addEventListener('ended',()=>{if(audio===fallback)finishVoice();});
        fallback.addEventListener('error',()=>{if(audio===fallback){entry.view.duration.textContent='No se pudo reproducir';finishVoice();}});
        floatingView.duration.textContent='Toca para escuchar';
        return; // Do not attempt untrusted autoplay in older iOS.
      }
      const clip=new Audio(entry.url);
      audio=clip;
      clip.onended=()=>{if(audio===clip)finishVoice();};
      clip.onerror=()=>{
        if(audio!==clip)return;
        if(isOpusContainer(entry.mime)&&!entry.forceDecoder){
          entry.forceDecoder=true;
          voiceQueue.unshift(row);
        }
        finishVoice();
      };
      for(const event of ['loadedmetadata','durationchange','timeupdate','play','pause'])
        clip.addEventListener(event,()=>{if(audio===clip)drawVoiceProgress(floatingView,clip);});
      setVoiceMeta(floatingView,entry.meta);drawVoiceProgress(floatingView,clip);
      voiceCard.hidden=false;
      void playVoice(clip);
    }catch(error){
      if(version===roomVersion){seen.delete('voice:'+row.id);console.debug('Nota de voz de la mesa',error);}
    }finally{
      loadingVoice=false;
      if(!audio&&voiceQueue.length&&!document.hidden&&!requesting&&!recorder)void showVoice();
    }
  }

  voiceCard.onclick=()=>{
    if(recorder||requesting||!audio)return;
    if(audio.paused)void playVoice(audio);
    else{audio.pause();voiceCard.removeAttribute('data-playing');}
  };

  async function sendVoice(blob, noteId, version) {
    if (version !== roomVersion || room !== currentRoom()) return;
    if (!blob.size || blob.size > maxVoiceBytes || !['audio/webm','audio/ogg','audio/mp4'].includes(blob.type.split(';')[0])) {
      setRecording(false);
      pendingNote = null;
      dominoShowToast('La nota está vacía, tiene un formato incompatible o supera el tamaño permitido.');
      return;
    }
    pendingNote = {blob, noteId};
    setRecording(false, 'Enviando nota de voz…');
    voiceButton.disabled = true;
    try {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const parts = [];
      for (let offset = 0; offset < bytes.length; offset += 8192) {
        parts.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
      }
      if (version !== roomVersion || room !== currentRoom()) return;
      const {data, error} = await sb.rpc('dfc_domino_send_voice', {
        p_table_id:room, p_note_id:noteId, p_mime:blob.type.split(';')[0],
        p_audio:btoa(parts.join(''))
      });
      if (error) throw error;
      if (String(data) !== String(noteId)) throw Error('El servidor no confirmó la nota');
      if (version !== roomVersion || room !== currentRoom()) return;
      pendingNote = null;
      rememberClip({id:noteId,sender_name:'Tú',mine:true},blob);
      void window.syncDominoTableMessages(true).catch(()=>{});
      setRecording(false);
      dominoShowToast('Nota de voz enviada.');
    } catch (error) {
      if (version !== roomVersion) return;
      setRecording(false, 'Reintentar envío de la nota de voz');
      dominoShowToast((error.message || 'Falló el envío de audio') + '. Toca el micrófono para reintentar.');
    } finally {
      if (version === roomVersion) voiceButton.disabled = false;
    }
  }

  async function beginRecording() {
    syncRoom();
    if (!room || !roomAccount || document.hidden || voiceButton.disabled || requesting || recorder) return;
    held = true;
    const version = roomVersion;
    if (pendingNote) {
      await sendVoice(pendingNote.blob, pendingNote.noteId, version);
      return;
    }
    if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      dominoShowToast('Este navegador no permite grabar notas de voz.');
      return;
    }

    requesting = true;
    manualGeneration++;
    setVoiceCapture(true);
    removeAudio();pauseHistory();
    let microphone;
    try {
      microphone = await navigator.mediaDevices.getUserMedia({audio:{channelCount:{ideal:1},sampleRate:{ideal:48000},echoCancellation:{ideal:true},noiseSuppression:{ideal:true},autoGainControl:{ideal:true}}});
      if (!held || version !== roomVersion || room !== currentRoom()) {
        microphone.getTracks().forEach(track => track.stop());
        return;
      }
      stream = microphone;
      const mime = chooseCaptureFormat(type=>MediaRecorder.isTypeSupported(type));
      const options = mime ? {mimeType:mime, audioBitsPerSecond:voiceBitrate} : {audioBitsPerSecond:voiceBitrate};
      const recording = new MediaRecorder(stream, options);
      recorder = recording;
      const chunks = [];
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recording.onerror = () => {
        if (recorder !== recording) return;
        recorder = null;
        releaseMic();
        setRecording(false);
        dominoShowToast('Se interrumpió la grabación.');
      };
      recording.onstop = () => {
        if (recorder !== recording) return;
        recorder = null;
        releaseMic();
        if (version !== roomVersion || room !== currentRoom()) return;
        void showVoice();
        const blob = new Blob(chunks, {type:recording.mimeType || chunks[0]?.type});
        const noteId = crypto.randomUUID();
        if (recording.sendOnStop) void sendVoice(blob,noteId,version);
        else setRecording(false);
      };
      recording.start();
      setRecording(true,'Grabando, suelta para enviar (máximo 5 minutos)');
      startedAt=Date.now();
      const tick=()=>{const seconds=Math.min(maxRecordingMs/1000,Math.floor((Date.now()-startedAt)/1000));voiceButton.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');};
      tick();clockTimer=setInterval(tick,200);
      recordingTimer = setTimeout(() => {
        if (recorder === recording && recording.state === 'recording') {held=false;recording.sendOnStop=true;recording.stop();}
      }, maxRecordingMs);
    } catch (error) {
      releaseMic();
      recorder = null;
      setRecording(false);
      if (version === roomVersion) dominoShowToast(error.name === 'NotAllowedError'
        ? 'Permite el acceso al micrófono para grabar.' : 'No se pudo abrir el micrófono.');
    } finally {
      requesting = false;
      if (!recorder) {setVoiceCapture(false);void showVoice();}
    }
  }
  function finishRecording(send) {
    held=false;
    if(recorder?.state==='recording'){recorder.sendOnStop=send;recorder.stop();}
  }
  voiceButton.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary)return;
    e.preventDefault();try{voiceButton.setPointerCapture(e.pointerId);}catch(_){}void beginRecording();
  });
  voiceButton.addEventListener('pointerup',()=>finishRecording(true));
  voiceButton.addEventListener('pointercancel',()=>finishRecording(false));
  voiceButton.addEventListener('lostpointercapture',()=>finishRecording(false));
  voiceButton.addEventListener('contextmenu',e=>e.preventDefault());
  voiceButton.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();void beginRecording();}});
  voiceButton.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();finishRecording(true);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){finishRecording(false);removeAudio();pauseHistory();}else{syncRoom();void window.syncDominoTableMessages(true).catch(()=>{});}});
  window.addEventListener('pagehide',()=>finishRecording(false));
  window.addEventListener('online',()=>{
    syncRoom();
    if (room && pendingNote && !voiceButton.disabled && !recorder && !requesting) {
      void sendVoice(pendingNote.blob,pendingNote.noteId,roomVersion);
    }
  });

  window.syncDominoTableMessages = async function(force = false) {
    syncRoom();
    if (!room || document.hidden || readingRoom === roomVersion || (!force && Date.now()-lastPoll<1600)) return;
    const version = roomVersion;
    const tableId = room;
    readingRoom = version;
    lastPoll = Date.now();
    try {
      const [chatResult, voiceResult] = await Promise.allSettled([
        sb.rpc('rf_domino_chat_list_v150',{p_table_id:tableId,p_limit:40}),
        sb.rpc('dfc_domino_voice_history',{p_table_id:tableId}).then(result=>result.error?sb.rpc('dfc_domino_list_voice',{p_table_id:tableId}):result)
      ]);
      if (version !== roomVersion || currentRoom() !== tableId) return;
      const notes = voiceResult.status === 'fulfilled' ? voiceResult.value.data : null;
      for (const note of Array.isArray(notes) ? notes : []) {
        if(!note?.id)continue;
        const key='voice:'+note.id;
        const previouslyKnown=clips.has(String(note.id));
        rememberClip(note);
        if(note.mine||seen.has(key)||previouslyKnown)continue;
        seen.add(key);
        const age=mfDominoNow()-Date.parse(note.created_at);
        if(Number.isFinite(age)&&age>=-3000&&age<120000)voiceQueue.push(note);
      }
      void showVoice();

      const conversation = chatResult.status === 'fulfilled' ? chatResult.value : null;
      if (!conversation || conversation.error) return;
      await dfcReloadBlocked();
      if (version !== roomVersion || currentRoom() !== tableId) return;
      const rows = dfcZ28ActiveMessages(dfcVisibleMessages(conversation.data || []));
      renderDominoMiniChat(rows);
      attachHistory();
      for (const row of rows) {
        const type = String(row.kind || 'text');
        if (type === 'text' && row.message?.trim()) dominoUserMessageCache.set(String(row.user_id),row);
        const key = 'chat:' + row.message_id;
        if (seen.has(key)) continue;
        seen.add(key);
        const age = mfDominoNow() - Date.parse(row.created_at);
        if (!Number.isFinite(age) || age < -3000 || age > 10500) continue;
        if (type === 'text') textQueue.push(row);
        if (type === 'reaction') dominoShowSeatMessage(row);
      }
      dominoUpdateUserMessageButtons();
      showText();
      if (seen.size>400) for (const key of [...seen].slice(0,200)) seen.delete(key);
    } finally {
      if (version === readingRoom) readingRoom = 0;
    }
  };
  new MutationObserver(syncRoom).observe(panel,{attributes:true,attributeFilter:['class']});
  void window.syncDominoTableMessages(true).catch(()=>{});
})();

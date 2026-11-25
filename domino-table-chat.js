(() => {
  'use strict';
  const panel = document.getElementById('dominoTablePanel');
  const stage = document.getElementById('dominoStage');
  const chat = document.getElementById('dominoChatBtn');
  if (!panel || !stage || !chat) return;

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
  voiceHistory.hidden = true;
  voiceHistory.style.cssText = 'max-height:30vh;overflow:auto;display:none;flex:none;padding:4px;color:inherit';
  chatList?.after(voiceHistory);
  const clips = new Map();
  function rememberClip(id, name, blob) {
    if (clips.has(id)) return;
    const url = URL.createObjectURL(blob);
    clips.set(id,url);
    const row = document.createElement('div');
    row.className = 'domino-chat-line';
    const who = document.createElement('strong');
    who.textContent = name;
    const player = document.createElement('audio');
    player.controls = true; player.preload = 'metadata'; player.src = url;
    player.style.cssText = 'max-width:100%;height:36px';
    player.addEventListener('play', () => {
      if (recorder || requesting) {player.pause();return;}
      removeAudio();
      voiceHistory.querySelectorAll('audio').forEach(other => { if (other !== player) other.pause(); });
    });
    player.addEventListener('ended',()=>void showVoice());
    row.append(who,player); voiceHistory.append(row);
    voiceHistory.hidden = false;voiceHistory.style.display = 'block';
  }
  function clearClips() {
    voiceHistory.querySelectorAll('audio').forEach(p => {p.pause();p.removeAttribute('src');p.load();});
    clips.forEach(url => URL.revokeObjectURL(url));clips.clear();
    voiceHistory.replaceChildren();voiceHistory.hidden = true;voiceHistory.style.display = 'none';
  }

  const voiceCard = document.createElement('button');
  voiceCard.type = 'button';
  voiceCard.id = 'dominoVoiceCard';
  voiceCard.hidden = true;
  const speaker = document.createElement('span');
  const sender = document.createElement('span');
  voiceCard.append(speaker, sender);
  stage.append(voiceCard);

  const maxRecordingMs = 300000;
  const maxVoiceBytes = 5 * 1024 * 1024;
  const voiceBitrate = 96000;
  let held = false, requesting = false, clockTimer = 0, startedAt = 0;
  let room = 0;
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

  function releaseMic() {
    window.dfcVoiceRecording=false;
    clearTimeout(recordingTimer);
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
  }

  function removeAudio() {
    if (audio) {
      audio.onended = audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio = null;
    }
    if (soundUrl) URL.revokeObjectURL(soundUrl);
    soundUrl = '';
    voiceCard.hidden = true;
    voiceCard.removeAttribute('data-playing');
  }

  function syncRoom() {
    const nextRoom = currentRoom();
    if (nextRoom === room) return;
    room = nextRoom;
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

  async function playVoice(clip) {
    try {
      await clip.play();
      if (audio !== clip) return;
      speaker.textContent = '🔊';
      voiceCard.setAttribute('data-playing', '');
      voiceCard.setAttribute('aria-label', 'Nota de voz de ' + sender.textContent + ' en reproducción');
    } catch (error) {
      if (audio !== clip) return;
      if (error.name !== 'NotAllowedError') {
        finishVoice();
        return;
      }
      speaker.textContent = '▶';
      voiceCard.setAttribute('aria-label', 'Escuchar a ' + sender.textContent);
    }
  }

  async function showVoice() {
    if (!room || requesting || recorder || loadingVoice || audio || !voiceQueue.length || [...voiceHistory.querySelectorAll('audio')].some(p=>!p.paused)) return;
    const row = voiceQueue.shift();
    const version = roomVersion;
    loadingVoice = true;
    try {
      const {data, error} = await sb.rpc('dfc_domino_read_voice', {p_table_id:room, p_note_id:row.id});
      if (version !== roomVersion || room !== currentRoom()) return;
      if (requesting || recorder) {voiceQueue.unshift(row);return;}
      if (error || !data) {seen.delete('voice:'+row.id);return;}
      const bytes = Uint8Array.from(atob(data.audio), char => char.charCodeAt(0));
      const blob = new Blob([bytes], {type:data.mime});
      rememberClip(row.id,row.sender_name,blob);
      soundUrl = URL.createObjectURL(blob);
      const clip = new Audio(soundUrl);
      audio = clip;
      clip.onended = clip.onerror = finishVoice;
      sender.textContent = row.sender_name;
      speaker.textContent = '▶';
      voiceCard.hidden = false;
      void playVoice(clip);
    } catch (error) {
      if (version === roomVersion) {seen.delete('voice:'+row.id);console.debug('Nota de voz de la mesa', error);}
    } finally {
      loadingVoice = false;
      if (!audio && voiceQueue.length) void showVoice();
    }
  }

  voiceCard.onclick = () => { if (!recorder && !requesting && audio?.paused) void playVoice(audio); };

  async function sendVoice(blob, noteId, version) {
    if (version !== roomVersion || room !== currentRoom()) return;
    if (!blob.size || blob.size > maxVoiceBytes) {
      setRecording(false);
      dominoShowToast('La nota está vacía o supera el tamaño permitido.');
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
      const {error} = await sb.rpc('dfc_domino_send_voice', {
        p_table_id:room, p_note_id:noteId, p_mime:blob.type.split(';')[0],
        p_audio:btoa(parts.join(''))
      });
      if (error) throw error;
      if (version !== roomVersion) return;
      pendingNote = null;
      rememberClip(noteId,'Tú',blob);
      setRecording(false);
      dominoShowToast('Nota de voz enviada.');
    } catch (error) {
      if (version !== roomVersion) return;
      setRecording(false, 'Reintentar envío de la nota de voz');
      dominoShowToast((error.message || 'Falló el envío de audio') + '. Toca el micrófono para reintentar.');
    } finally {
      voiceButton.disabled = false;
    }
  }

  async function beginRecording() {
    syncRoom();
    if (!room || voiceButton.disabled || requesting || recorder) return;
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
    removeAudio();voiceHistory.querySelectorAll('audio').forEach(p=>p.pause());
    let microphone;
    try {
      microphone = await navigator.mediaDevices.getUserMedia({audio:{channelCount:{ideal:1},sampleRate:{ideal:48000},echoCancellation:{ideal:true},noiseSuppression:{ideal:true},autoGainControl:{ideal:true}}});
      if (!held || version !== roomVersion || room !== currentRoom()) {
        microphone.getTracks().forEach(track => track.stop());
        return;
      }
      stream = microphone;
      const mime = ['audio/mp4','audio/webm;codecs=opus','audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported(type));
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
      window.dfcVoiceRecording=true;
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
      if (!recorder) void showVoice();
    }
  }
  function finishRecording(send) {
    held=false;
    if(recorder?.state==='recording'){recorder.sendOnStop=send;recorder.stop();}
  }
  voiceButton.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary)return;
    e.preventDefault();voiceButton.setPointerCapture(e.pointerId);void beginRecording();
  });
  voiceButton.addEventListener('pointerup',()=>finishRecording(true));
  voiceButton.addEventListener('pointercancel',()=>finishRecording(false));
  voiceButton.addEventListener('lostpointercapture',()=>finishRecording(false));
  voiceButton.addEventListener('contextmenu',e=>e.preventDefault());
  voiceButton.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();void beginRecording();}});
  voiceButton.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();finishRecording(true);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finishRecording(false);});
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
        sb.rpc('dfc_domino_list_voice',{p_table_id:tableId})
      ]);
      if (version !== roomVersion || currentRoom() !== tableId) return;
      const notes = voiceResult.status === 'fulfilled' ? voiceResult.value.data : null;
      for (const note of Array.isArray(notes) ? notes : []) {
        const key = 'voice:' + note.id;
        if (seen.has(key)) continue;
        seen.add(key);
        voiceQueue.push(note);
      }
      void showVoice();

      const conversation = chatResult.status === 'fulfilled' ? chatResult.value : null;
      if (!conversation || conversation.error) return;
      await dfcReloadBlocked();
      if (version !== roomVersion || currentRoom() !== tableId) return;
      const rows = dfcZ28ActiveMessages(dfcVisibleMessages(conversation.data || []));
      renderDominoMiniChat(rows);
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

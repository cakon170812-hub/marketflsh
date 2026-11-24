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
  chat.after(voiceButton);

  const voiceCard = document.createElement('button');
  voiceCard.type = 'button';
  voiceCard.id = 'dominoVoiceCard';
  voiceCard.hidden = true;
  const speaker = document.createElement('span');
  const sender = document.createElement('span');
  voiceCard.append(speaker, sender);
  stage.append(voiceCard);

  const maxRecordingMs = 20000;
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
  }

  function releaseMic() {
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
    pendingNote = null;
    setRecording(false);
    removeAudio();
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
    if (!room || loadingVoice || audio || !voiceQueue.length) return;
    const row = voiceQueue.shift();
    const version = roomVersion;
    loadingVoice = true;
    try {
      const {data, error} = await sb.rpc('dfc_domino_read_voice', {p_table_id:room, p_note_id:row.id});
      if (version !== roomVersion || room !== currentRoom() || error || !data) return;
      const bytes = Uint8Array.from(atob(data.audio), char => char.charCodeAt(0));
      soundUrl = URL.createObjectURL(new Blob([bytes], {type:data.mime}));
      const clip = new Audio(soundUrl);
      audio = clip;
      clip.onended = clip.onerror = finishVoice;
      sender.textContent = row.sender_name;
      speaker.textContent = '▶';
      voiceCard.hidden = false;
      void playVoice(clip);
    } catch (error) {
      if (version === roomVersion) console.debug('Nota de voz de la mesa', error);
    } finally {
      loadingVoice = false;
      if (!audio && voiceQueue.length) void showVoice();
    }
  }

  voiceCard.onclick = () => { if (audio?.paused) void playVoice(audio); };

  async function sendVoice(blob, noteId, version) {
    if (version !== roomVersion || room !== currentRoom()) return;
    if (!blob.size || blob.size > 524288) {
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

  voiceButton.onclick = async () => {
    syncRoom();
    if (!room || voiceButton.disabled) return;
    const version = roomVersion;
    if (pendingNote) {
      await sendVoice(pendingNote.blob, pendingNote.noteId, version);
      return;
    }
    if (recorder?.state === 'recording') {
      recorder.sendOnStop = true;
      recorder.stop();
      return;
    }
    if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      dominoShowToast('Este navegador no permite grabar notas de voz.');
      return;
    }

    voiceButton.disabled = true;
    let microphone;
    try {
      microphone = await navigator.mediaDevices.getUserMedia({audio:true});
      if (version !== roomVersion || room !== currentRoom()) {
        microphone.getTracks().forEach(track => track.stop());
        return;
      }
      stream = microphone;
      const mime = ['audio/mp4','audio/webm;codecs=opus','audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported(type));
      const options = mime ? {mimeType:mime, audioBitsPerSecond:48000} : {audioBitsPerSecond:48000};
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
        const blob = new Blob(chunks, {type:recording.mimeType || chunks[0]?.type});
        const noteId = crypto.randomUUID();
        if (recording.sendOnStop) void sendVoice(blob,noteId,version);
        else {
          pendingNote = {blob, noteId};
          setRecording(false, 'Enviar nota de voz grabada');
          dominoShowToast('Nota lista. Toca el micrófono para enviarla.');
        }
      };
      recording.start();
      setRecording(true);
      recordingTimer = setTimeout(() => {
        if (recorder === recording && recording.state === 'recording') recording.stop();
      }, maxRecordingMs);
    } catch (error) {
      releaseMic();
      recorder = null;
      setRecording(false);
      if (version === roomVersion) dominoShowToast(error.name === 'NotAllowedError'
        ? 'Permite el acceso al micrófono para grabar.' : 'No se pudo abrir el micrófono.');
    } finally {
      voiceButton.disabled = false;
    }
  };

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

(() => {
  const recordButton = document.querySelector('#recordButton');
  const recordButtonLabel = document.querySelector('#recordButtonLabel');
  const recordState = document.querySelector('#recordState');
  const recordTime = document.querySelector('#recordTime');
  const levelMeter = document.querySelector('#levelMeter');
  const levelBars = [...levelMeter.querySelectorAll('span')];
  const recorderStatus = document.querySelector('#recorderStatus');
  const recorderStage = document.querySelector('#recorderStage');
  const recordingResults = document.querySelector('#recordingResults');

  let mediaRecorder;
  let mediaStream;
  let recordingChunks = [];
  let recordingStartedAt = 0;
  let timerId;
  let audioContext;
  let analyser;
  let levelAnimationId;
  let languageText;
  const recorderDatabaseName = 'wavecraft-recorder';
  const recorderStoreName = 'recordings';

  const fallbackText = {
    ready: 'Ready to record',
    recording: 'Recording',
    creatingMp3: 'Creating MP3...',
    start: 'Start recording',
    stop: 'Stop recording',
    micPermissionNote: 'Your microphone stays private and local.',
    recordingUnsupported: 'This browser cannot record audio. Try a current version of Chrome, Edge, Safari, or Firefox.',
    microphoneDenied: 'Microphone access was not granted. Check your browser permissions and try again.',
    recordingFailed: 'The recording could not be converted to MP3.'
    ,filenameLabel: 'FILENAME'
  };

  function text(key) {
    return languageText?.[key] || fallbackText[key];
  }

  function normalizeFilename(value, fallback) {
    const cleaned = value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();
    if (!cleaned) return fallback;
    return cleaned.toLowerCase().endsWith('.mp3') ? cleaned : `${cleaned}.mp3`;
  }

  function openRecorderDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(recorderDatabaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(recorderStoreName, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveRecording(recording) {
    const database = await openRecorderDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(recorderStoreName, 'readwrite');
      transaction.objectStore(recorderStoreName).put(recording);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }

  async function updateSavedRecording(recording) {
    try {
      await saveRecording(recording);
    } catch (error) {
      console.warn('Could not save recording filename', error);
    }
  }

  async function clearSavedRecordings() {
    const database = await openRecorderDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(recorderStoreName, 'readwrite');
      transaction.objectStore(recorderStoreName).clear();
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }

  async function loadSavedRecordings() {
    const database = await openRecorderDatabase();
    const recordings = await new Promise((resolve, reject) => {
      const request = database.transaction(recorderStoreName).objectStore(recorderStoreName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    database.close();
    recordings.forEach(recording => appendRecording(recording, false));
  }

  function clearRecordingsOnReload() {
    if (performance.getEntriesByType('navigation')[0]?.type !== 'reload') return Promise.resolve();
    return clearSavedRecordings();
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  function setStatus(message) {
    recorderStatus.textContent = message;
  }

  function updateTimer() {
    recordTime.textContent = formatTime(Math.floor((performance.now() - recordingStartedAt) / 1000));
  }

  function resetLevelMeter() {
    levelBars.forEach(bar => { bar.style.height = '8px'; });
  }

  function stopLevelMeter() {
    if (levelAnimationId) cancelAnimationFrame(levelAnimationId);
    levelAnimationId = null;
    if (audioContext) audioContext.close().catch(() => {});
    audioContext = null;
    analyser = null;
    resetLevelMeter();
  }

  function animateLevelMeter() {
    if (!analyser) return;
    const samples = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    samples.forEach(sample => {
      const normalized = (sample - 128) / 128;
      sum += normalized * normalized;
    });
    const level = Math.min(1, Math.sqrt(sum / samples.length) * 4.5);
    levelBars.forEach((bar, index) => {
      const center = (levelBars.length - 1) / 2;
      const falloff = 1 - Math.abs(index - center) / (center + 1);
      const height = 8 + level * (15 + falloff * 19);
      bar.style.height = `${height}px`;
    });
    levelAnimationId = requestAnimationFrame(animateLevelMeter);
  }

  function startLevelMeter() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return;
    audioContext = new AudioContextConstructor();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    audioContext.createMediaStreamSource(mediaStream).connect(analyser);
    animateLevelMeter();
  }

  function chooseMimeType() {
    return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type)) || '';
  }

  function appendRecording(recording, persist = true) {
    const downloadUrl = URL.createObjectURL(recording.data);
    const resultItem = document.createElement('div');
    resultItem.className = 'recording-result';
    const resultHeading = document.createElement('div');
    resultHeading.className = 'recording-result-heading';
    const filenameField = document.createElement('div');
    filenameField.className = 'recording-filename';
    const filenameLabel = document.createElement('span');
    filenameLabel.className = 'result-label';
    filenameLabel.textContent = text('filenameLabel');
    const filenameDisplay = document.createElement('div');
    filenameDisplay.className = 'recording-name-line';
    const filenameText = document.createElement('strong');
    filenameText.textContent = recording.name;
    filenameText.title = recording.name;
    const editFilenameButton = document.createElement('button');
    editFilenameButton.className = 'edit-filename-button';
    editFilenameButton.type = 'button';
    editFilenameButton.textContent = '✎';
    editFilenameButton.title = text('editFilename');
    editFilenameButton.setAttribute('aria-label', text('editFilename'));
    const filenameInput = document.createElement('input');
    filenameInput.type = 'text';
    filenameInput.value = recording.name;
    filenameInput.maxLength = 120;
    filenameInput.setAttribute('aria-label', text('filenameLabel'));
    filenameInput.hidden = true;
    filenameDisplay.append(filenameText, editFilenameButton);
    filenameField.append(filenameLabel, filenameDisplay, filenameInput);
    const downloadLink = document.createElement('a');
    downloadLink.className = 'download-button';
    downloadLink.href = downloadUrl;
    downloadLink.download = recording.name;
    downloadLink.innerHTML = `<span>${text('downloadMp3')}</span><span aria-hidden="true">↓</span>`;
    resultHeading.append(filenameField, downloadLink);
    editFilenameButton.addEventListener('click', () => {
      filenameDisplay.hidden = true;
      filenameInput.hidden = false;
      filenameInput.focus();
      filenameInput.select();
    });
    filenameInput.addEventListener('input', () => {
      downloadLink.download = normalizeFilename(filenameInput.value, recording.name);
    });
    filenameInput.addEventListener('blur', () => {
      filenameInput.value = normalizeFilename(filenameInput.value, recording.name);
      recording.name = filenameInput.value;
      downloadLink.download = recording.name;
      filenameText.textContent = recording.name;
      filenameText.title = recording.name;
      filenameDisplay.hidden = false;
      filenameInput.hidden = true;
      updateSavedRecording(recording);
    });
    resultItem.appendChild(resultHeading);
    const previewAudio = document.createElement('audio');
    previewAudio.controls = true;
    previewAudio.preload = 'metadata';
    previewAudio.src = downloadUrl;
    resultItem.appendChild(previewAudio);
    recordingResults.appendChild(resultItem);
    if (persist) saveRecording(recording).catch(error => console.warn('Could not save recording', error));
  }

  async function convertToMp3(blob) {
    if (typeof FFmpeg === 'undefined') throw new Error('FFmpeg is unavailable');
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({
      log: false,
      mainName: 'main',
      corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js'
    });
    await ffmpeg.load();
    ffmpeg.FS('writeFile', 'voice-input', await fetchFile(blob));
    await ffmpeg.run('-y', '-i', 'voice-input', '-vn', '-codec:a', 'libmp3lame', '-b:a', '128k', 'voice-output.mp3');
    const data = ffmpeg.FS('readFile', 'voice-output.mp3');
    try {
      ffmpeg.FS('unlink', 'voice-input');
      ffmpeg.FS('unlink', 'voice-output.mp3');
      if (ffmpeg.isLoaded()) ffmpeg.exit();
    } catch (error) {
      // ignore cleanup errors
    }
    return new Blob([data], { type: 'audio/mpeg' });
  }

  function stopTracks() {
    stopLevelMeter();
    mediaStream?.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  async function finishRecording() {
    // Clear the interval before stopping the recorder so the timer
    // doesn't keep ticking while FFmpeg encodes the MP3.
    clearInterval(timerId);
    mediaRecorder.stop();
    stopTracks();
    recordButton.disabled = true;
    recordState.textContent = text('creatingMp3');
    recordButtonLabel.textContent = text('creatingMp3');
    recorderStage.classList.remove('is-recording');
    setStatus(text('micPermissionNote'));
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus(text('recordingUnsupported'));
      return;
    }
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = chooseMimeType();
      mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
      recordingChunks = [];
      mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size) recordingChunks.push(event.data);
      });
      mediaRecorder.addEventListener('stop', async () => {
        try {
          const sourceBlob = new Blob(recordingChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          const mp3Blob = await convertToMp3(sourceBlob);
          const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `voice-recording-${stamp}.mp3`;
          appendRecording({ id: crypto.randomUUID(), name: filename, data: mp3Blob });
          recordState.textContent = text('ready');
          recordButtonLabel.textContent = text('start');
          setStatus(text('micPermissionNote'));
        } catch (error) {
          console.error('Could not create MP3 recording', error);
          recordState.textContent = text('ready');
          recordButtonLabel.textContent = text('start');
          setStatus(text('recordingFailed'));
        } finally {
          // Always clear chunks to free memory, regardless of success or failure.
          recordingChunks = [];
          recordButton.disabled = false;
        }
      }, { once: true });
      mediaRecorder.start();
      startLevelMeter();
      recordingStartedAt = performance.now();
      recordTime.textContent = '00:00';
      recordState.textContent = text('recording');
      recordButtonLabel.textContent = text('stop');
      recorderStage.classList.add('is-recording');
      setStatus(text('micPermissionNote'));
      timerId = setInterval(updateTimer, 250);
    } catch (error) {
      stopTracks();
      setStatus(error.name === 'NotAllowedError' ? text('microphoneDenied') : text('recordingUnsupported'));
    }
  }

  recordButton.addEventListener('click', () => {
    if (mediaRecorder?.state === 'recording') finishRecording();
    else startRecording();
  });

  window.addEventListener('wavecraft:language', event => {
    languageText = event.detail.translations;
    if (!mediaRecorder || mediaRecorder.state !== 'recording') {
      recordState.textContent = text('ready');
      recordButtonLabel.textContent = text('start');
    }
  });

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    recordButton.disabled = true;
    setStatus(text('recordingUnsupported'));
  }

  clearRecordingsOnReload()
    .then(loadSavedRecordings)
    .catch(error => console.warn('Could not initialize saved recordings', error));
})();

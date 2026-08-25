(function () {
const { createFFmpeg, fetchFile } = FFmpeg;

const dropZone = document.querySelector('#dropZone');
const folderInput = document.querySelector('#folderInput');
const fileInput = document.querySelector('#fileInput');
const folderPickerButton = document.querySelector('#folderPickerButton');
const unsupportedPanel = document.querySelector('#unsupportedPanel');
const unsupportedMessage = document.querySelector('#unsupportedMessage');
const unsupportedToggle = document.querySelector('#unsupportedToggle');
const unsupportedList = document.querySelector('#unsupportedList');
const unsupportedClose = document.querySelector('#unsupportedClose');
const filePanel = document.querySelector('#filePanel');
const queueTitle = document.querySelector('#queueTitle');
const queueMeta = document.querySelector('#queueMeta');
const queueList = document.querySelector('#queueList');
const clearButton = document.querySelector('#clearButton');
const convertButton = document.querySelector('#convertButton');
const buttonLabel = document.querySelector('#buttonLabel');
const progressBlock = document.querySelector('#progressBlock');
const progressBar = document.querySelector('#progressBar');
const progressLabel = document.querySelector('#progressLabel');
const progressEstimate = document.querySelector('#progressEstimate');
const progressPercent = document.querySelector('#progressPercent');
const result = document.querySelector('#result');
const resultTitle = document.querySelector('#resultTitle');
const resultList = document.querySelector('#resultList');
const downloadAllButton = document.querySelector('#downloadAllButton');
const toast = document.querySelector('#toast');
const toastMessage = document.querySelector('#toastMessage');
const toastClose = document.querySelector('#toastClose');
const prefixInput = document.querySelector('#prefixInput');
const capacityEstimate = document.querySelector('#capacityEstimate');

let selectedFiles = [];
let outputUrls = [];
let convertedFiles = [];
let conversionIndex = 0;
let conversionTotal = 1;
let conversionStartedAt = 0;
let fileConversionStartedAt = 0;
let conversionRate = { secondsPerMb: 0.47, secondsPerFile: 0 };
let conversionComplete = false;
let conversionInProgress = false;
let languageText = null;
let unsupportedFiles = [];
let lastFfmpegMessage = '';
let ffmpeg;
const resultsDatabaseName = 'wavecraft-results';
const resultsStoreName = 'converted-wav';
const converterQueueDatabaseName = 'wavecraft-converter-queue';
const converterQueueStoreName = 'files';

function openResultsDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(resultsDatabaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(resultsStoreName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveConvertedResults() {
  const database = await openResultsDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(resultsStoreName, 'readwrite');
    transaction.objectStore(resultsStoreName).put(convertedFiles, 'latest');
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function loadConvertedResults() {
  const database = await openResultsDatabase();
  const savedResults = await new Promise((resolve, reject) => {
    const request = database.transaction(resultsStoreName).objectStore(resultsStoreName).get('latest');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  database.close();
  convertedFiles = savedResults.map(({ name, data }) => ({ name, data: new Uint8Array(data) }));
  conversionComplete = convertedFiles.length > 0;
  renderResults();
}

async function loadQueuedFiles() {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(converterQueueDatabaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(converterQueueStoreName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const files = await new Promise((resolve, reject) => {
    const request = database.transaction(converterQueueStoreName).objectStore(converterQueueStoreName).get('pending');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(converterQueueStoreName, 'readwrite');
    transaction.objectStore(converterQueueStoreName).delete('pending');
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  if (files.length) selectFiles(files);
}

async function clearSavedResults() {
  const database = await openResultsDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(resultsStoreName, 'readwrite');
    transaction.objectStore(resultsStoreName).delete('latest');
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

function deleteDatabase(databaseName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
    request.onblocked = resolve;
  });
}

async function clearAllSavedDataOnReload() {
  if (performance.getEntriesByType('navigation')[0]?.type !== 'reload') return;
  await Promise.all([
    clearSavedResults(),
    deleteDatabase('wavecraft-duration-ledger')
  ]);
}

function renderResults() {
  resultList.replaceChildren();
  outputUrls.forEach((url) => URL.revokeObjectURL(url));
  outputUrls = [];
  convertedFiles.forEach(({ name, data }) => {
    const outputUrl = URL.createObjectURL(new Blob([data], { type: 'audio/wav' }));
    outputUrls.push(outputUrl);
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `<strong title="${name}">${name}</strong><a class="download-button" href="${outputUrl}" download="${name}"${conversionComplete ? '' : ' hidden'}>${languageText?.download || 'Download'} <span>↓</span></a>`;
    resultList.appendChild(resultItem);
  });
  if (convertedFiles.length && conversionComplete && !conversionInProgress) {
    resultTitle.textContent = `${convertedFiles.length} WAV file${convertedFiles.length === 1 ? '' : 's'} ${languageText?.ready || 'ready'}`;
    result.classList.remove('is-hidden');
  } else {
    result.classList.add('is-hidden');
  }
  downloadAllButton.disabled = !conversionComplete;
  downloadAllButton.hidden = !conversionComplete;
}

function createFfmpeg() {
  const instance = createFFmpeg({
    log: true,
    mainName: 'main',
    corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
  });
  instance.setLogger(({ message }) => {
    lastFfmpegMessage = message;
  });
  instance.setProgress(({ ratio }) => {
    const percent = Math.max(0, Math.min(100, Math.round(((conversionIndex + ratio) / conversionTotal) * 100)));
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    updateLiveEstimate(ratio);
  });
  return instance;
}

ffmpeg = createFfmpeg();

function showToast(message) {
  toastMessage.textContent = message;
  toast.hidden = false;
  toast.classList.add('show');
}

toastClose.addEventListener('click', () => {
  toast.classList.remove('show');
  toast.hidden = true;
  toastMessage.textContent = '';
});

function showUnsupportedFiles(files) {
  unsupportedFiles = files;
  unsupportedMessage.textContent = `${languageText?.unsupportedFiles || 'Unsupported files ignored'} (${files.length}):`;
  unsupportedList.replaceChildren(...files.map((file) => {
    const item = document.createElement('li');
    item.textContent = file.name;
    return item;
  }));
  unsupportedToggle.hidden = files.length === 0;
  unsupportedToggle.setAttribute('aria-expanded', 'false');
  unsupportedList.hidden = true;
  unsupportedToggle.querySelector('span').textContent = languageText?.showAllFiles || 'Show all files';
  unsupportedPanel.classList.remove('is-hidden');
}

unsupportedClose.addEventListener('click', () => unsupportedPanel.classList.add('is-hidden'));
unsupportedToggle.addEventListener('click', () => {
  const expanded = unsupportedToggle.getAttribute('aria-expanded') === 'true';
  unsupportedToggle.setAttribute('aria-expanded', String(!expanded));
  unsupportedList.hidden = expanded;
  unsupportedToggle.querySelector('span').textContent = expanded ? (languageText?.showAllFiles || 'Show all files') : (languageText?.hideAllFiles || 'Hide all files');
});

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function getBrowserCapacity() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || (cores <= 2 ? 2 : cores <= 4 ? 4 : 8);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && cores <= 6);
  const memoryBudgetMb = isMobile ? 128 : Math.min(memory * 128, 512);
  const maxFiles = isMobile || cores <= 2 ? 2 : cores >= 8 && memory >= 8 ? 6 : 4;
  return { cores, memory, memoryBudgetMb, maxFiles };
}

function formatTimeEstimate(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '< 5 sec';
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded} sec`;
  const minutes = Math.floor(rounded / 60);
  const remainingSecs = rounded % 60;
  if (minutes < 60) {
    return remainingSecs > 0 ? `${minutes} min ${remainingSecs} sec` : `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours} hr ${remainingMins} min` : `${hours} hr`;
}

function getConversionRate() {
  return conversionRate;
}

function recordConversionRate(file, elapsedSeconds) {
  const sizeMb = Math.max(file.size / (1024 * 1024), 0.1);
  const measuredSecPerMb = Math.max(0.05, elapsedSeconds / sizeMb);
  const previousRate = getConversionRate();
  conversionRate = {
    secondsPerMb: previousRate.secondsPerMb * 0.6 + measuredSecPerMb * 0.4,
    secondsPerFile: 0.25
  };
}

function estimateConversionSeconds(files) {
  if (!files || !files.length) return 0;
  const rate = getConversionRate();
  const totalMb = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
  // Startup overhead (FFmpeg load if not loaded yet) + per-file overhead (~0.25s) + decode/encode rate
  const startupOverhead = (ffmpeg && ffmpeg.isLoaded()) ? 0.3 : 2.5;
  const perFileOverhead = files.length * 0.25;
  const computeTime = totalMb * (rate.secondsPerMb || 0.47);
  return Math.max(1, startupOverhead + perFileOverhead + computeTime);
}

function updateCapacityEstimate() {
  if (!capacityEstimate) return;
  if (!selectedFiles.length) {
    capacityEstimate.textContent = '';
    return;
  }
  const capacity = getBrowserCapacity();
  const averageSize = selectedFiles.reduce((sum, file) => sum + file.size, 0) / selectedFiles.length;
  const sizeLimitedBatch = Math.floor((capacity.memoryBudgetMb * 1024 * 1024) / Math.max(averageSize, 1));
  const recommendedBatch = Math.max(1, Math.min(selectedFiles.length, capacity.maxFiles, sizeLimitedBatch));
  const batchWord = recommendedBatch === 1 ? (languageText?.file || 'file') : (languageText?.files || 'files');
  const estimate = formatTimeEstimate(estimateConversionSeconds(selectedFiles));
  capacityEstimate.textContent = `${languageText?.estimatedFor || 'Estimated for'} ${selectedFiles.length} ${selectedFiles.length === 1 ? (languageText?.file || 'file') : (languageText?.files || 'files')}: ${languageText?.estimatedTime || 'about'} ${estimate} · ${languageText?.recommendedBatch || 'Suggested batch'}: ${recommendedBatch} ${batchWord}`;
  buttonLabel.textContent = `${languageText?.convertToWav || 'Convert to WAV'} · ${languageText?.estimatedTime || 'about'} ${estimate}`;
}

function updateLiveEstimate(ratio = 0) {
  if (!conversionInProgress || !selectedFiles.length || !conversionTotal) return;
  const currentFile = selectedFiles[conversionIndex];
  if (!currentFile) return;

  const rate = getConversionRate();
  const currentFileSizeMb = currentFile.size / (1024 * 1024);
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  // Remaining time on current active file
  const currentFileTotalEst = (currentFileSizeMb * (rate.secondsPerMb || 0.47)) + 0.25;
  const currentFileRemaining = Math.max(0, (1 - clampedRatio) * currentFileTotalEst);

  // Remaining time for subsequent files in queue
  let remainingQueueSeconds = 0;
  for (let i = conversionIndex + 1; i < selectedFiles.length; i++) {
    const fileMb = selectedFiles[i].size / (1024 * 1024);
    remainingQueueSeconds += (fileMb * (rate.secondsPerMb || 0.47)) + 0.25;
  }

  const totalRemainingSeconds = Math.max(0, currentFileRemaining + remainingQueueSeconds);

  if (totalRemainingSeconds < 1 && conversionIndex === conversionTotal - 1 && clampedRatio > 0.9) {
    progressEstimate.textContent = `${languageText?.complete || 'almost complete'}`;
  } else {
    progressEstimate.textContent = `${languageText?.estimatedTime || 'about'} ${formatTimeEstimate(totalRemainingSeconds)} ${languageText?.remaining || 'remaining'}`;
  }
}

function normalizeFilenamePrefix(value) {
  const prefix = value.trim();
  return prefix && !prefix.endsWith('_') ? `${prefix}_` : prefix;
}

function isSupported(file) {
  return /\.(m4a|mp3)$/i.test(file.name) || ['audio/mp4', 'audio/m4a', 'audio/mpeg'].includes(file.type);
}

function removeFfmpegFile(filename) {
  try {
    ffmpeg.FS('unlink', filename);
  } catch (error) {
    // The file may not have been created after a failed FFmpeg run.
  }
}

function updateQueue() {
  queueList.replaceChildren();
  selectedFiles.forEach((file, index) => {
    const item = document.createElement('li');
    item.className = 'queue-item';
    item.innerHTML = `<div class="file-details"><strong title="${file.name}">${file.name}</strong><span>${formatBytes(file.size)}</span></div><button class="remove-file" type="button">×</button>`;
    const removeButton = item.querySelector('.remove-file');
    const removeLabel = `${languageText?.removeFile || 'Remove'} ${file.name}`;
    removeButton.setAttribute('aria-label', removeLabel);
    removeButton.title = removeLabel;
    item.querySelector('.remove-file').addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      updateQueue();
    });
    queueList.appendChild(item);
  });
  const count = selectedFiles.length;
  queueMeta.textContent = `${count} ${languageText ? (count === 1 ? languageText.file : languageText.files) : `file${count === 1 ? '' : 's'}`}`;
  queueTitle.textContent = count > 1 ? (languageText?.queue || 'QUEUE') : (languageText?.selectedAudioLabel || 'SELECTED AUDIO');
  filePanel.classList.toggle('is-hidden', count === 0);
  convertButton.disabled = count === 0;
  buttonLabel.textContent = count > 1 ? `${languageText?.convertToWav || 'Convert'} ${count} ${languageText?.files || 'files'}` : (languageText?.convertToWav || 'Convert to WAV');
  dropZone.querySelector('#dropTitle').textContent = count ? `${count} ${count === 1 ? (languageText?.selectedAudio || 'audio file selected') : (languageText?.selectedAudioPlural || 'audio files selected')}` : (languageText?.dropTitle || 'Drop your audio here');
  updateCapacityEstimate();
}

function selectFiles(files) {
  const incomingFiles = Array.from(files || []);
  if (!incomingFiles.length) return;
  // Use a local name to avoid shadowing the module-level `unsupportedFiles` variable.
  const rejectedFiles = incomingFiles.filter((file) => !isSupported(file));
  if (rejectedFiles.length) {
    showUnsupportedFiles(rejectedFiles);
  }
  const validFiles = incomingFiles.filter((file) => {
    if (!isSupported(file)) return false;
    if (file.size > 500 * 1024 * 1024) {
      showToast(`${file.name} ${languageText?.tooLarge || 'is larger than the 500 MB limit.'}`);
      return false;
    }
    return true;
  });
  const existingKeys = new Set(selectedFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
  const newFiles = validFiles.filter((file) => !existingKeys.has(`${file.name}:${file.size}:${file.lastModified}`));
  if (!newFiles.length && !validFiles.length && !rejectedFiles.length) showToast(languageText?.chooseSupported || 'Please choose M4A or MP3 files.');
  selectedFiles.push(...newFiles);
  conversionComplete = false;
  result.classList.add('is-hidden');
  updateQueue();
}

function clearFile() {
  selectedFiles = [];
  conversionComplete = false;
  unsupportedPanel.classList.add('is-hidden');
  folderInput.value = '';
  updateQueue();
  result.classList.add('is-hidden');
  outputUrls.forEach((url) => URL.revokeObjectURL(url));
  outputUrls = [];
  convertedFiles = [];
  progressEstimate.textContent = '';
  clearSavedResults().catch((error) => console.warn('Could not clear saved results', error));
}

async function chooseFolder() {
  const isAppleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isAppleMobile) {
    fileInput.setAttribute('accept', '.m4a,.mp3');
    fileInput.click();
    return;
  }
  if (typeof window.showDirectoryPicker === 'function') {
    try {
      const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
      const files = [];
      const collectFiles = async directory => {
        for await (const entry of directory.values()) {
          if (entry.kind === 'file') files.push(await entry.getFile());
          if (entry.kind === 'directory') await collectFiles(entry);
        }
      };
      await collectFiles(directoryHandle);
      selectFiles(files);
    } catch (error) {
      if (error.name !== 'AbortError') showToast(languageText?.unableFolder || 'Unable to read that folder.');
    }
    return;
  }
  if ('webkitdirectory' in folderInput) {
    folderInput.setAttribute('webkitdirectory', '');
    folderInput.setAttribute('directory', '');
    folderInput.multiple = true;
    folderInput.click();
    return;
  }
  showToast(languageText?.unableFolder || 'Unable to read that folder.');
}

async function downloadAll() {
  if (!convertedFiles.length || typeof JSZip === 'undefined') return;
  downloadAllButton.disabled = true;
  downloadAllButton.firstChild.textContent = languageText?.packaging || 'Packaging...';
  try {
    const zip = new JSZip();
    convertedFiles.forEach(({ name, data }) => zip.file(name, data));
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    const utcPlusSeven = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const timestamp = utcPlusSeven.toISOString().replace('T', '_').replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
    link.download = `wav-converted-${timestamp}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
  } catch (error) {
    console.error('Could not create ZIP download', error);
    showToast(languageText?.packageFailed || 'Could not package the converted files.');
  } finally {
    downloadAllButton.disabled = false;
    downloadAllButton.firstChild.textContent = `${languageText?.downloadAll || 'Download all'} `;
  }
}

async function convert() {
  if (!selectedFiles.length) return;
  conversionInProgress = true;
  conversionComplete = false;
  convertButton.disabled = true;
  clearButton.disabled = true;
  folderPickerButton.disabled = true;
  prefixInput.disabled = true;
  progressBlock.classList.remove('is-hidden');
  result.classList.add('is-hidden');
  resultList.replaceChildren();
  outputUrls.forEach((url) => URL.revokeObjectURL(url));
  outputUrls = [];
  convertedFiles = [];
  try {
    await clearSavedResults();
  } catch (error) {
    console.warn('Could not clear previous results', error);
  }
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  conversionStartedAt = performance.now();
  progressEstimate.textContent = `${languageText?.estimatedTime || 'about'} ${formatTimeEstimate(estimateConversionSeconds(selectedFiles))}`;
  buttonLabel.textContent = languageText?.converting || 'Converting...';
  conversionTotal = selectedFiles.length;
  const failures = [];

  try {
    for (let index = 0; index < selectedFiles.length; index += 1) {
      conversionIndex = index;
      const selectedFile = selectedFiles[index];
      progressLabel.textContent = `${languageText?.converting || 'Converting...'} ${index + 1} of ${conversionTotal}: ${selectedFile.name}`;
      updateLiveEstimate(0);
      const extension = selectedFile.name.toLowerCase().endsWith('.m4a') ? '.m4a' : '.mp3';
      const inputName = `input-${index}${extension}`;
      const outputFile = `output-${index}.wav`;
      try {
        if (!ffmpeg.isLoaded()) {
          progressLabel.textContent = `${languageText?.loadingFfmpeg || 'Loading FFmpeg for file'} ${index + 1} of ${conversionTotal}...`;
          await ffmpeg.load();
        }
        lastFfmpegMessage = '';
        fileConversionStartedAt = performance.now();
        ffmpeg.FS('writeFile', inputName, await fetchFile(selectedFile));
        await ffmpeg.run('-y', '-i', inputName, '-vn', '-acodec', 'pcm_s16le', outputFile);
        const data = new Uint8Array(ffmpeg.FS('readFile', outputFile));
        recordConversionRate(selectedFile, (performance.now() - fileConversionStartedAt) / 1000);
        const filenamePrefix = normalizeFilenamePrefix(prefixInput.value);
        prefixInput.value = filenamePrefix;
        const outputFileName = `${filenamePrefix}${selectedFile.name.replace(/\.[^/.]+$/, '')}.wav`;
        convertedFiles.push({ name: outputFileName, data });
        renderResults();
      } catch (error) {
        console.error(`Conversion failed for ${selectedFile.name}`, error);
        failures.push({ file: selectedFile.name, detail: lastFfmpegMessage || 'Unsupported or unreadable audio' });
        const failedItem = document.createElement('div');
        failedItem.className = 'result-item result-item-failed';
        failedItem.innerHTML = `<strong title="${selectedFile.name}">${selectedFile.name}</strong><span>${languageText?.skipped || 'Skipped'}</span>`;
        resultList.appendChild(failedItem);
      } finally {
        removeFfmpegFile(inputName);
        removeFfmpegFile(outputFile);
        try {
          if (ffmpeg.isLoaded()) ffmpeg.exit();
        } catch (error) {
          console.warn('FFmpeg worker cleanup failed', error);
        }
        ffmpeg = createFfmpeg();
      }
    }
    if (!outputUrls.length) throw new Error('No files could be converted.');
    await saveConvertedResults();
    conversionComplete = failures.length === 0 && convertedFiles.length === selectedFiles.length;
    conversionInProgress = false;
    renderResults();
    downloadAllButton.disabled = !conversionComplete;
    downloadAllButton.hidden = !conversionComplete;
    resultTitle.textContent = `${outputUrls.length} ${languageText?.wavFile || 'WAV file'} ${languageText?.ready || 'ready'}${failures.length ? `, ${failures.length} ${languageText?.skipped || 'skipped'}` : ''}`;
    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';
    progressEstimate.textContent = languageText?.complete || 'complete';
    progressLabel.textContent = failures.length ? (languageText?.conversionCompleteSkipped || 'Conversion complete with skipped files') : (languageText?.conversionComplete || 'Conversion complete');
    window.dispatchEvent(new CustomEvent('wavecraft:converted', {
      detail: {
        files: convertedFiles.map(({ name, data }) => new File([data], name, { type: 'audio/wav' }))
      }
    }));
    if (failures.length) showToast(`${failures.length} ${languageText?.files || 'file'}${failures.length === 1 ? '' : 's'} ${languageText?.couldNotConvert || 'could not be converted.'}`);
  } catch (error) {
    console.error(error);
    progressLabel.textContent = languageText?.conversionFailed || 'Conversion failed';
    showToast(languageText?.noFilesConverted || 'No files could be converted. Check the selected audio files.');
  } finally {
    conversionInProgress = false;
    convertButton.disabled = false;
    clearButton.disabled = false;
    folderPickerButton.disabled = false;
    prefixInput.disabled = false;
    updateCapacityEstimate();
  }
}

dropZone.addEventListener('click', (event) => {
  if (event.target.closest('.picker-actions')) return;
  chooseFolder();
});
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    chooseFolder();
  }
});
folderPickerButton.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  chooseFolder();
});
folderInput.addEventListener('change', (event) => { selectFiles(event.target.files); folderInput.value = ''; });
fileInput.addEventListener('change', (event) => { selectFiles(event.target.files); fileInput.value = ''; });
clearButton.addEventListener('click', clearFile);
convertButton.addEventListener('click', convert);
// Normalize on blur only — 'change' always fires after blur so it would be redundant.
prefixInput.addEventListener('blur', () => {
  prefixInput.value = normalizeFilenamePrefix(prefixInput.value);
});
downloadAllButton.addEventListener('click', downloadAll);
window.addEventListener('wavecraft:language', (event) => {
  languageText = event.detail.translations;
  updateQueue();
  renderResults();
  if (unsupportedFiles.length) {
    const expanded = unsupportedToggle.getAttribute('aria-expanded') === 'true';
    unsupportedToggle.querySelector('span').textContent = expanded ? (languageText?.hideAllFiles || 'Hide all files') : (languageText?.showAllFiles || 'Show all files');
  }
});
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.add('dragging');
}));
dropZone.addEventListener('dragleave', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
});
// Single 'drop' handler: removes dragging class AND processes files.
// Previously there were two separate listeners for this (one in an array loop,
// one standalone), which would have called selectFiles twice per drop.
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
  selectFiles(event.dataTransfer.files);
});

clearAllSavedDataOnReload()
  .then(() => Promise.all([loadConvertedResults(), loadQueuedFiles()]))
  .catch((error) => console.warn('Could not initialize saved results', error));
})();

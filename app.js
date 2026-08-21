(function () {
const { createFFmpeg, fetchFile } = FFmpeg;

const dropZone = document.querySelector('#dropZone');
const fileInput = document.querySelector('#fileInput');
const folderInput = document.querySelector('#folderInput');
const filePickerButton = document.querySelector('#filePickerButton');
const folderPickerButton = document.querySelector('#folderPickerButton');
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
const progressPercent = document.querySelector('#progressPercent');
const result = document.querySelector('#result');
const resultTitle = document.querySelector('#resultTitle');
const resultList = document.querySelector('#resultList');
const downloadAllButton = document.querySelector('#downloadAllButton');
const toast = document.querySelector('#toast');
const prefixInput = document.querySelector('#prefixInput');
const middlefixInput = document.querySelector('#middlefixInput');

let selectedFiles = [];
let outputUrls = [];
let convertedFiles = [];
let toastTimer = null;
let conversionIndex = 0;
let conversionTotal = 1;
let lastFfmpegMessage = '';
let ffmpeg;
const resultsDatabaseName = 'wavecraft-results';
const resultsStoreName = 'converted-wav';

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
  renderResults();
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
    resultItem.innerHTML = `<strong title="${name}">${name}</strong><a class="download-button" href="${outputUrl}" download="${name}">Download <span>↓</span></a>`;
    resultList.appendChild(resultItem);
  });
  if (convertedFiles.length) {
    resultTitle.textContent = `${convertedFiles.length} WAV file${convertedFiles.length === 1 ? '' : 's'} ready`;
    result.classList.remove('is-hidden');
  } else {
    result.classList.add('is-hidden');
  }
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
  });
  return instance;
}

ffmpeg = createFfmpeg();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
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
    item.innerHTML = `<div class="file-details"><strong title="${file.name}">${file.name}</strong><span>${formatBytes(file.size)}</span></div><button class="remove-file" type="button" aria-label="Remove ${file.name}" title="Remove file">×</button>`;
    item.querySelector('.remove-file').addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      updateQueue();
    });
    queueList.appendChild(item);
  });
  const count = selectedFiles.length;
  queueMeta.textContent = `${count} file${count === 1 ? '' : 's'}`;
  queueTitle.textContent = count > 1 ? 'QUEUE' : 'SELECTED AUDIO';
  filePanel.classList.toggle('is-hidden', count === 0);
  convertButton.disabled = count === 0;
  buttonLabel.textContent = count > 1 ? `Convert ${count} files` : 'Convert to WAV';
  dropZone.querySelector('#dropTitle').textContent = count ? `${count} audio file${count === 1 ? '' : 's'} selected` : 'Drop your audio here';
}

function selectFiles(files) {
  const incomingFiles = Array.from(files || []);
  if (!incomingFiles.length) return;
  const validFiles = incomingFiles.filter((file) => {
    if (!isSupported(file)) return false;
    if (file.size > 500 * 1024 * 1024) {
      showToast(`${file.name} is larger than the 500 MB limit.`);
      return false;
    }
    return true;
  });
  const existingKeys = new Set(selectedFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
  const newFiles = validFiles.filter((file) => !existingKeys.has(`${file.name}:${file.size}:${file.lastModified}`));
  if (!newFiles.length && !validFiles.length) showToast('Please choose M4A or MP3 files.');
  selectedFiles.push(...newFiles);
  result.classList.add('is-hidden');
  updateQueue();
}

function clearFile() {
  selectedFiles = [];
  fileInput.value = '';
  folderInput.value = '';
  updateQueue();
  result.classList.add('is-hidden');
  outputUrls.forEach((url) => URL.revokeObjectURL(url));
  outputUrls = [];
  convertedFiles = [];
  clearSavedResults().catch((error) => console.warn('Could not clear saved results', error));
}

async function chooseFolder() {
  if (typeof window.showDirectoryPicker !== 'function') {
    folderInput.click();
    return;
  }
  try {
    const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
    const files = [];
    const collectFiles = async (directory) => {
      for await (const entry of directory.values()) {
        if (entry.kind === 'file') files.push(await entry.getFile());
        if (entry.kind === 'directory') await collectFiles(entry);
      }
    };
    await collectFiles(directoryHandle);
    selectFiles(files);
  } catch (error) {
    if (error.name !== 'AbortError') showToast('Unable to read that folder.');
  }
}

async function downloadAll() {
  if (!convertedFiles.length || typeof JSZip === 'undefined') return;
  downloadAllButton.disabled = true;
  downloadAllButton.firstChild.textContent = 'Packaging...';
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
    showToast('Could not package the converted files.');
  } finally {
    downloadAllButton.disabled = false;
    downloadAllButton.firstChild.textContent = 'Download all ';
  }
}

async function convert() {
  if (!selectedFiles.length) return;
  convertButton.disabled = true;
  clearButton.disabled = true;
  filePickerButton.disabled = true;
  folderPickerButton.disabled = true;
  prefixInput.disabled = true;
  middlefixInput.disabled = true;
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
  buttonLabel.textContent = 'Converting...';
  conversionTotal = selectedFiles.length;
  const failures = [];

  try {
    for (let index = 0; index < selectedFiles.length; index += 1) {
      conversionIndex = index;
      const selectedFile = selectedFiles[index];
      progressLabel.textContent = `Converting ${index + 1} of ${conversionTotal}: ${selectedFile.name}`;
      const extension = selectedFile.name.toLowerCase().endsWith('.m4a') ? '.m4a' : '.mp3';
      const inputName = `input-${index}${extension}`;
      const outputFile = `output-${index}.wav`;
      try {
        if (!ffmpeg.isLoaded()) {
          progressLabel.textContent = `Loading FFmpeg for file ${index + 1} of ${conversionTotal}...`;
          await ffmpeg.load();
        }
        lastFfmpegMessage = '';
        ffmpeg.FS('writeFile', inputName, await fetchFile(selectedFile));
        await ffmpeg.run('-y', '-i', inputName, '-vn', '-acodec', 'pcm_s16le', outputFile);
        const data = new Uint8Array(ffmpeg.FS('readFile', outputFile));
        const filenamePrefix = normalizeFilenamePrefix(prefixInput.value);
        const filenameMiddlefix = normalizeFilenamePrefix(middlefixInput.value);
        prefixInput.value = filenamePrefix;
        middlefixInput.value = filenameMiddlefix;
        const outputFileName = `${filenamePrefix}${filenameMiddlefix}${selectedFile.name.replace(/\.[^/.]+$/, '')}.wav`;
        convertedFiles.push({ name: outputFileName, data });
        renderResults();
      } catch (error) {
        console.error(`Conversion failed for ${selectedFile.name}`, error);
        failures.push({ file: selectedFile.name, detail: lastFfmpegMessage || 'Unsupported or unreadable audio' });
        const failedItem = document.createElement('div');
        failedItem.className = 'result-item result-item-failed';
        failedItem.innerHTML = `<strong title="${selectedFile.name}">${selectedFile.name}</strong><span>Skipped</span>`;
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
    resultTitle.textContent = `${outputUrls.length} WAV file${outputUrls.length === 1 ? '' : 's'} ready${failures.length ? `, ${failures.length} skipped` : ''}`;
    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';
    progressLabel.textContent = failures.length ? 'Conversion complete with skipped files' : 'Conversion complete';
    result.classList.remove('is-hidden');
    window.dispatchEvent(new CustomEvent('wavecraft:converted', {
      detail: {
        files: convertedFiles.map(({ name, data }) => new File([data], name, { type: 'audio/wav' }))
      }
    }));
    if (failures.length) showToast(`${failures.length} file${failures.length === 1 ? '' : 's'} could not be converted.`);
  } catch (error) {
    console.error(error);
    progressLabel.textContent = 'Conversion failed';
    showToast('No files could be converted. Check the selected audio files.');
  } finally {
    convertButton.disabled = false;
    clearButton.disabled = false;
    filePickerButton.disabled = false;
    folderPickerButton.disabled = false;
    prefixInput.disabled = false;
    middlefixInput.disabled = false;
    buttonLabel.textContent = selectedFiles.length > 1 ? `Convert ${selectedFiles.length} files` : 'Convert to WAV';
  }
}

dropZone.addEventListener('click', (event) => {
  if (event.target.closest('button')) return;
  fileInput.click();
});
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
filePickerButton.addEventListener('click', (event) => { event.stopPropagation(); fileInput.click(); });
folderPickerButton.addEventListener('click', (event) => { event.stopPropagation(); chooseFolder(); });
fileInput.addEventListener('change', (event) => { selectFiles(event.target.files); fileInput.value = ''; });
folderInput.addEventListener('change', (event) => { selectFiles(event.target.files); folderInput.value = ''; });
clearButton.addEventListener('click', clearFile);
convertButton.addEventListener('click', convert);
prefixInput.addEventListener('blur', () => {
  prefixInput.value = normalizeFilenamePrefix(prefixInput.value);
});
prefixInput.addEventListener('change', () => {
  prefixInput.value = normalizeFilenamePrefix(prefixInput.value);
});
middlefixInput.addEventListener('blur', () => {
  middlefixInput.value = normalizeFilenamePrefix(middlefixInput.value);
});
middlefixInput.addEventListener('change', () => {
  middlefixInput.value = normalizeFilenamePrefix(middlefixInput.value);
});
downloadAllButton.addEventListener('click', downloadAll);
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.add('dragging');
}));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
}));
dropZone.addEventListener('drop', (event) => selectFiles(event.dataTransfer.files));
clearAllSavedDataOnReload()
  .then(() => loadConvertedResults())
  .catch((error) => console.warn('Could not initialize saved results', error));
})();

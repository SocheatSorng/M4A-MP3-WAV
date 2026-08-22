(() => {
  const translations = {
    en: {
      converter: 'Converter',
      durationCalculator: 'Duration calculator',
      converterPageTitle: 'M4A and MP3 to WAV',
      durationPageTitle: 'WAV Duration Ledger',
      toggleLanguage: 'Toggle language',
      audioConverter: 'Audio converter',
      converterTitle: 'Convert audio for every workflow.',
      converterTitleAccent: 'M4A and MP3 to WAV.',
      converterLede: 'Create high-quality WAV files in your browser. Fast, private, and processed entirely on your device.',
      dropTitle: 'Drop your audio here',
      selectedAudio: 'audio file selected',
      selectedAudioPlural: 'audio files selected',
      queue: 'QUEUE',
      selectedAudioLabel: 'SELECTED AUDIO',
      files: 'files',
      file: 'file',
      dropPrompt: 'or upload a parent folder',
      chooseFiles: 'Choose files',
      uploadFolder: 'Upload folder',
      outputFormat: 'OUTPUT FORMAT',
      filenamePrefix: 'FILENAME PREFIX',
      prefixNote: 'Added before each WAV filename',
      convertToWav: 'Convert to WAV',
      toWav: 'to WAV',
      supportedFormats: 'M4A or MP3',
      maxEach: 'MAX 500 MB EACH',
      readyToDownload: 'READY TO DOWNLOAD',
      convertedAudio: 'Converted audio',
      downloadAll: 'Download all',
      chooseAudio: 'Drop M4A or MP3 files',
      audioToolsNavigation: 'Audio tools navigation',
      closeMessage: 'Close message',
      removeFile: 'Remove',
      removeSelectedFiles: 'Remove selected files',
      prefixPlaceholder: 'Optional, e.g. khm_EBC_',
      chooseFolderRegion: 'Choose a folder',
      audioSummary: 'Audio summary',
      nonWavFiles: 'Non-WAV files',
      convertAllToWav: 'Convert all to WAV',
      exportCsvTitle: 'Export readable WAV results as CSV',
      selectWavFilesFromFiles: 'Select one or more WAV files from the Files app.',
      selectAudioFilesFromFiles: 'Select one or more M4A or MP3 files from the Files app.',
      openingConverter: 'Opening converter...',
      clearFiles: 'Remove selected files',
      audioTools: 'AUDIO TOOLS',
      ffmpegLocal: 'LOCAL PROCESSING · FFMPEG.WASM',
      addedBefore: 'Added before each WAV filename',
      durationTitle: 'Measure your audio library.',
      durationLede: 'Scan a folder to calculate the total duration of every WAV recording, including files in nested folders.',
      selectFolder: 'Select your parent folder',
      privacyNote: 'Your files stay on this device. Nothing is sent anywhere.',
      dropWavFiles: 'Drop WAV files here',
      chooseFolder: 'Choose folder',
      totalDuration: 'Total duration',
      successfulWav: 'Successful WAV files',
      unsuccessfulFiles: 'Unsuccessful files',
      average: 'Average',
      longestFile: 'Longest file',
      totalSize: 'Total size',
      fileLedger: 'File ledger',
      noFilesScanned: 'No files scanned',
      exportCsv: 'Export CSV',
      emptyLedger: 'Choose a folder to see its WAV files here.',
      showNonWav: 'Show non-WAV files',
      hideNonWav: 'Hide non-WAV files',
      convertAll: 'Convert all',
      scanComplete: 'Scan complete. All WAV files were read locally.',
      noWavFound: 'No WAV files found in that folder.',
      localProcessing: 'LOCAL PROCESSING',
      downloaded: 'Downloaded',
      tryAgain: 'Try again'
      ,download: 'Download', packaging: 'Packaging...', converting: 'Converting...', loadingFfmpeg: 'Loading FFmpeg for file',
      conversionComplete: 'Conversion complete', conversionCompleteSkipped: 'Conversion complete with skipped files', skipped: 'Skipped',
      conversionFailed: 'Conversion failed', noFilesConverted: 'No files could be converted. Check the selected audio files.',
      tooLarge: 'is larger than the 500 MB limit.', chooseSupported: 'Please choose M4A or MP3 files.', unsupportedFiles: 'Unsupported files ignored', moreFiles: 'more', unableFolder: 'Unable to read that folder.',
      showAllFiles: 'Show all files', hideAllFiles: 'Hide all files',
      packageFailed: 'Could not package the converted files.', couldNotConvert: 'could not be converted.'
      ,fileHeader: 'File', durationHeader: 'Duration', reading: 'Reading...', couldNotRead: 'Could not read',
      waitingFolder: 'Waiting for a folder.', readableOf: 'readable of', wavFile: 'WAV file', restored: 'Restored',
      exported: 'Exported', unreadable: 'unreadable file'
      ,ready: 'ready', fromBrowser: 'from this browser', result: 'result', results: 'results'
    },
    kh: {
      converter: 'កម្មវិធីបម្លែង',
      durationCalculator: 'គណនារយៈពេល',
      converterPageTitle: 'M4A និង MP3 ទៅ WAV',
      durationPageTitle: 'បញ្ជីរយៈពេល WAV',
      toggleLanguage: 'ប្តូរភាសា',
      audioConverter: 'កម្មវិធីបម្លែងសំឡេង',
      converterTitle: 'បម្លែងសំឡេងសម្រាប់ការងាររបស់អ្នក។',
      converterTitleAccent: 'M4A និង MP3 ទៅ WAV។',
      converterLede: 'បង្កើតឯកសារ WAV គុណភាពខ្ពស់ក្នុងកម្មវិធីរុករក។ លឿន ឯកជន និងដំណើរការនៅលើឧបករណ៍របស់អ្នក។',
      dropTitle: 'ទម្លាក់ឯកសារសំឡេងនៅទីនេះ',
      selectedAudio: 'បានជ្រើសឯកសារសំឡេង',
      selectedAudioPlural: 'បានជ្រើសឯកសារសំឡេង',
      queue: 'បញ្ជីរង់ចាំ',
      selectedAudioLabel: 'សំឡេងដែលបានជ្រើស',
      files: 'ឯកសារ',
      file: 'ឯកសារ',
      dropPrompt: 'ឬបញ្ចូលថតមេ',
      chooseFiles: 'ជ្រើសឯកសារ',
      uploadFolder: 'បញ្ចូលថត',
      outputFormat: 'ទម្រង់លទ្ធផល',
      filenamePrefix: 'បុព្វបទឈ្មោះឯកសារ',
      prefixNote: 'បន្ថែមនៅមុខឈ្មោះ WAV',
      convertToWav: 'បម្លែងទៅ WAV',
      toWav: 'ទៅ WAV',
      supportedFormats: 'M4A ឬ MP3',
      maxEach: 'អតិបរមា ៥០០ MB ក្នុងមួយឯកសារ',
      readyToDownload: 'ត្រៀមទាញយក',
      convertedAudio: 'សំឡេងដែលបានបម្លែង',
      downloadAll: 'ទាញយកទាំងអស់',
      chooseAudio: 'ទម្លាក់ឯកសារ M4A ឬ MP3',
      audioToolsNavigation: 'ការរុករកឧបករណ៍សំឡេង',
      closeMessage: 'បិទសារ',
      removeFile: 'លុប',
      removeSelectedFiles: 'លុបឯកសារដែលបានជ្រើស',
      prefixPlaceholder: 'ជាជម្រើស ឧ. khm_EBC_',
      chooseFolderRegion: 'ជ្រើសថត',
      audioSummary: 'សង្ខេបសំឡេង',
      nonWavFiles: 'ឯកសារមិនមែន WAV',
      convertAllToWav: 'បម្លែងទាំងអស់ទៅ WAV',
      exportCsvTitle: 'នាំចេញលទ្ធផល WAV ដែលអាចអានបានជា CSV',
      selectWavFilesFromFiles: 'ជ្រើសឯកសារ WAV មួយ ឬច្រើនពីកម្មវិធី Files។',
      selectAudioFilesFromFiles: 'ជ្រើសឯកសារ M4A ឬ MP3 មួយ ឬច្រើនពីកម្មវិធី Files។',
      openingConverter: 'កំពុងបើកកម្មវិធីបម្លែង...',
      clearFiles: 'លុបឯកសារដែលបានជ្រើស',
      audioTools: 'ឧបករណ៍សំឡេង',
      ffmpegLocal: 'ដំណើរការក្នុងឧបករណ៍ · FFMPEG.WASM',
      addedBefore: 'បន្ថែមនៅមុខឈ្មោះ WAV',
      durationTitle: 'វាស់បណ្ណាល័យសំឡេងរបស់អ្នក។',
      durationLede: 'ស្កេនថត ដើម្បីគណនារយៈពេលសរុបនៃការថត WAV ទាំងអស់ រួមទាំងឯកសារក្នុងថតរង។',
      selectFolder: 'ជ្រើសថតមេរបស់អ្នក',
      privacyNote: 'ឯកសាររបស់អ្នកនៅលើឧបករណ៍នេះ។ គ្មានការផ្ញើទៅកន្លែងណាទេ។',
      dropWavFiles: 'ទម្លាក់ឯកសារ WAV នៅទីនេះ',
      chooseFolder: 'ជ្រើសថត',
      totalDuration: 'រយៈពេលសរុប',
      successfulWav: 'ឯកសារ WAV ជោគជ័យ',
      unsuccessfulFiles: 'ឯកសារមិនជោគជ័យ',
      average: 'មធ្យម',
      longestFile: 'ឯកសារយូរបំផុត',
      totalSize: 'ទំហំសរុប',
      fileLedger: 'បញ្ជីឯកសារ',
      noFilesScanned: 'មិនទាន់ស្កេនឯកសារ',
      exportCsv: 'នាំចេញ CSV',
      emptyLedger: 'ជ្រើសថត ដើម្បីមើលឯកសារ WAV នៅទីនេះ។',
      showNonWav: 'បង្ហាញឯកសារមិនមែន WAV',
      hideNonWav: 'លាក់ឯកសារមិនមែន WAV',
      convertAll: 'បម្លែងទាំងអស់',
      scanComplete: 'បានស្កេនរួចរាល់។ ឯកសារ WAV ទាំងអស់ត្រូវបានអានក្នុងឧបករណ៍។',
      noWavFound: 'រកមិនឃើញឯកសារ WAV នៅក្នុងថតនោះទេ។',
      localProcessing: 'ដំណើរការក្នុងឧបករណ៍',
      downloaded: 'បានទាញយក',
      tryAgain: 'ព្យាយាមម្តងទៀត'
      ,download: 'ទាញយក', packaging: 'កំពុងរៀបចំ...', converting: 'កំពុងបម្លែង...', loadingFfmpeg: 'កំពុងផ្ទុក FFmpeg សម្រាប់ឯកសារ',
      conversionComplete: 'ការបម្លែងបានបញ្ចប់', conversionCompleteSkipped: 'ការបម្លែងបានបញ្ចប់ ដោយមានឯកសារមួយចំនួនត្រូវបានរំលង', skipped: 'បានរំលង',
      conversionFailed: 'ការបម្លែងបានបរាជ័យ', noFilesConverted: 'មិនអាចបម្លែងឯកសារបានទេ។ សូមពិនិត្យឯកសារសំឡេងដែលបានជ្រើស។',
      tooLarge: 'ធំជាងកំណត់ ៥០០ MB។', chooseSupported: 'សូមជ្រើសឯកសារ M4A ឬ MP3។', unsupportedFiles: 'បានមិនអើពើឯកសារមិនគាំទ្រ', moreFiles: 'ទៀត', unableFolder: 'មិនអាចអានថតនោះបានទេ។',
      showAllFiles: 'បង្ហាញឯកសារទាំងអស់', hideAllFiles: 'លាក់ឯកសារទាំងអស់',
      packageFailed: 'មិនអាចរៀបចំកញ្ចប់ឯកសារបានទេ។', couldNotConvert: 'មិនអាចបម្លែងបានទេ។'
      ,fileHeader: 'ឯកសារ', durationHeader: 'រយៈពេល', reading: 'កំពុងអាន...', couldNotRead: 'មិនអាចអានបាន',
      waitingFolder: 'កំពុងរង់ចាំថត។', readableOf: 'អាចអានបានក្នុងចំណោម', wavFile: 'ឯកសារ WAV', restored: 'បានស្ដារ',
      exported: 'បាននាំចេញ', unreadable: 'ឯកសារមិនអាចអានបាន'
      ,ready: 'ត្រៀមរួចរាល់', fromBrowser: 'ពីកម្មវិធីរុករកនេះ', result: 'លទ្ធផល', results: 'លទ្ធផល'
    }
  };

  function applyLanguage(language) {
    const selectedLanguage = language === 'kh' ? 'kh' : 'en';
    document.documentElement.lang = selectedLanguage === 'kh' ? 'km' : 'en';
    const pageTitleKey = location.pathname.endsWith('duration.html') ? 'durationPageTitle' : 'converterPageTitle';
    document.title = translations[selectedLanguage][pageTitleKey];
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = translations[selectedLanguage][element.dataset.i18n];
      if (value) element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const value = translations[selectedLanguage][element.dataset.i18nPlaceholder];
      if (value) element.placeholder = value;
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      const value = translations[selectedLanguage][element.dataset.i18nAriaLabel];
      if (value) element.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      const value = translations[selectedLanguage][element.dataset.i18nTitle];
      if (value) element.title = value;
    });
    document.querySelectorAll('.lang-toggle').forEach((button) => {
      button.setAttribute('aria-pressed', String(selectedLanguage === 'kh'));
      button.querySelector('[data-lang="en"]').classList.toggle('active', selectedLanguage === 'en');
      button.querySelector('[data-lang="kh"]').classList.toggle('active', selectedLanguage === 'kh');
    });
    localStorage.setItem('wavecraft-language', selectedLanguage);
    window.dispatchEvent(new CustomEvent('wavecraft:language', { detail: { language: selectedLanguage, translations: translations[selectedLanguage] } }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const initialLanguage = localStorage.getItem('wavecraft-language') || 'en';
    document.querySelectorAll('.lang-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const currentLanguage = localStorage.getItem('wavecraft-language') || initialLanguage;
        applyLanguage(currentLanguage === 'en' ? 'kh' : 'en');
      });
    });
    applyLanguage(initialLanguage);
  });
})();

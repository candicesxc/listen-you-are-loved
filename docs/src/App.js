const { useState, useEffect } = React;

const wordsPerSecond = 2;

const toneEndingRules = {
  lullaby: 'must end with "good night" style line',
  cheerful: 'must end with "have a good day" style line',
  calm: 'ends with gentle reassurance',
  motivational: 'ends with confident encouragement',
};

const uiText = {
  en: {
    title: 'Listen, You Are Loved',
    descriptionLine1:
      'Customize their tone, who they speak as, the words they use, and the sound of the voice itself, then let them read your personalized affirmations aloud with gentle care.',
    descriptionLine2:
      'With each listen, you will feel a little more centered, a little more supported, and a little more connected to the comfort you deserve.',
    getStarted: 'Get Started',
    sectionTitle: 'Create your personalized affirmation',
    sectionSubtitle: 'Begin by describing who is speaking and what they should talk about.',
    personaLabel: 'Persona *',
    personaHelper: 'Who is speaking to you in this message.',
    personaPlaceholder: 'e.g., A gentle grandmother, a wise friend, a caring mentor',
    nameLabel: 'Optional Name',
    nameHelper: 'Your preferred name to be addressed in the message.',
    namePlaceholder: 'Nickname',
    instructionsLabel: 'Custom Instructions',
    instructionsHelper: 'What you want the message to talk about.',
    instructionsPlaceholder: 'Any specific guidance for the affirmation style...',
    toneLabel: 'Tone',
    toneHelper: 'Choose the feeling that best fits the script.',
    durationLabel: 'Duration (seconds)',
    durationHelper: 'Decide how long the audio should roughly last.',
    generateScript: 'Generate Script',
    scriptLabel: 'Script',
    scriptHelper: 'You can edit or refine this script before generating the audio.',
    prepareAudioTitle: 'Prepare your audio',
    prepareAudioHelper: 'Choose a voice and add optional background music before generating.',
    voiceLabel: 'Voice selection',
    backgroundMusicLabel: 'Background music selection',
    noBackgroundMusic: 'No background music',
    musicVolumeLabel: 'Background music volume',
    musicVolumeHelper: '',
    generateAudio: 'Generate Audio',
    loadingText: 'Creating your affirmation...',
    affirmationHeading: 'Your Affirmation',
    downloadAudio: 'Download Audio',
    aiMatchGenerate: 'AI Match & Generate',
    replayLastAffirmation: 'Replay Last Affirmation',
    savedAffirmations: 'Saved Affirmations',
    noSavedAffirmations: 'No saved affirmations yet.',
    closeGallery: 'Close',
    tones: {
      cheerful: 'Cheerful',
      lullaby: 'Lullaby',
      calm: 'Calm',
      motivational: 'Motivational',
    },
    voices: {
      alloy: 'Alloy - warm neutral adult',
      ash: 'Ash - clear adult male',
      ballad: 'Ballad - smooth adult male',
      coral: 'Coral - warm adult female',
      echo: 'Echo - calm adult male',
      fable: 'Fable - gentle young female',
      onyx: 'Onyx - deep adult male',
      nova: 'Nova - bright young female',
      sage: 'Sage - calm adult male',
      shimmer: 'Shimmer - airy teen female',
      verse: 'Verse - expressive adult male',
      marin: 'Marin - fresh young female',
      cedar: 'Cedar - warm adult male',
    },
    musicLabels: {
      ambient: 'ambient',
      cheerful: 'cheerful',
      cinematic: 'cinematic',
      lullaby: 'lullaby',
    },
    errors: {
      pleaseEnterPersona: 'Please enter a persona',
      pleaseGenerateScript: 'Please generate a script first',
      failedToGenerateScript: 'Failed to generate script',
      failedToGenerateTTS: 'Failed to generate TTS',
      failedToGenerateAudio: 'Failed to generate audio',
      backgroundMusicMixFailed: 'Background music could not be mixed. Playing the voice-only version instead.',
      failedToAiMatch: 'Could not match audio settings. Please try again or choose manually.',
    },
  },
  zh: {
    title: '听着，你被爱着',
    descriptionLine1:
      '自定义语气、说话的人、措辞和声音，让他们温柔地朗读你专属的爱的箴言。',
    descriptionLine2:
      '每一次聆听，你都会更平静、更被支持，也更能感受到你应得的安慰。',
    getStarted: '开始体验',
    sectionTitle: '创建你的专属爱的箴言',
    sectionSubtitle: '先描述是谁在对你说话，以及他们应该谈些什么。',
    personaLabel: '角色 *',
    personaHelper: '在这条信息中是谁在与你对话。',
    personaPlaceholder: '例如：温柔的奶奶、睿智的朋友、关怀的导师',
    nameLabel: '可选名字',
    nameHelper: '希望在信息中被称呼的名字。',
    namePlaceholder: '昵称',
    instructionsLabel: '自定义提示',
    instructionsHelper: '你想让这条信息谈论什么。',
    instructionsPlaceholder: '关于爱的箴言风格的具体要求...',
    toneLabel: '语气',
    toneHelper: '选择最符合脚本的感觉。',
    durationLabel: '时长（秒）',
    durationHelper: '决定音频大致播放多长时间。',
    generateScript: '生成脚本',
    scriptLabel: '脚本',
    scriptHelper: '在生成音频前，你可以编辑或微调脚本。',
    prepareAudioTitle: '准备你的音频',
    prepareAudioHelper: '在生成前选择一个声音，并可加入背景音乐。',
    voiceLabel: '声音选择',
    backgroundMusicLabel: '背景音乐选择',
    noBackgroundMusic: '无背景音乐',
    musicVolumeLabel: '背景音乐音量',
    musicVolumeHelper: '',
    generateAudio: '生成音频',
    loadingText: '正在为你创建爱的箴言...',
    affirmationHeading: '你的爱的箴言',
    downloadAudio: '下载音频',
    aiMatchGenerate: 'AI 匹配并生成',
    replayLastAffirmation: '重播上次的箴言',
    savedAffirmations: '已保存的箴言',
    noSavedAffirmations: '还没有保存的箴言。',
    closeGallery: '关闭',
    tones: {
      cheerful: '愉悦',
      lullaby: '催眠曲',
      calm: '平静',
      motivational: '激励',
    },
    voices: {
      alloy: 'Alloy - 温暖中性成人',
      ash: 'Ash - 清晰成年男性',
      ballad: 'Ballad - 流畅成年男性',
      coral: 'Coral - 温暖成年女性',
      echo: 'Echo - 平静成年男性',
      fable: 'Fable - 温柔年轻女性',
      onyx: 'Onyx - 深沉成年男性',
      nova: 'Nova - 明亮年轻女性',
      sage: 'Sage - 沉稳成年男性',
      shimmer: 'Shimmer - 轻盈青少年女性',
      verse: 'Verse - 富有表现力成年男性',
      marin: 'Marin - 清新年轻女性',
      cedar: 'Cedar - 温暖成年男性',
    },
    musicLabels: {
      ambient: '氛围',
      cheerful: '欢快',
      cinematic: '电影感',
      lullaby: '摇篮曲',
    },
    errors: {
      pleaseEnterPersona: '请输入角色',
      pleaseGenerateScript: '请先生成脚本',
      failedToGenerateScript: '生成脚本失败',
      failedToGenerateTTS: '生成语音失败',
      failedToGenerateAudio: '生成音频失败',
      backgroundMusicMixFailed: '无法混合背景音乐。将播放仅语音版本。',
      failedToAiMatch: '无法匹配音频设置。请重试或手动选择。',
    },
  },
  ko: {
    title: '들어봐, 너는 사랑받고 있어',
    descriptionLine1:
      '말투, 화자, 단어 선택, 목소리까지 원하는 대로 설정해 부드럽게 읽어주는 맞춤형 확언을 만들 수 있어요.',
    descriptionLine2:
      '들을 때마다 조금 더 평온해지고, 지지받는 느낌을 받고, 당신이 마땅히 누려야 할 위로에 가까워질 거예요.',
    getStarted: '시작하기',
    sectionTitle: '나만의 확언 만들기',
    sectionSubtitle: '누가 어떤 내용을 말해줄지 먼저 적어보세요.',
    personaLabel: '화자 *',
    personaHelper: '이 메시지에서 당신에게 이야기하는 사람이 누구인가요.',
    personaPlaceholder: '예: 다정한 할머니, 지혜로운 친구, 배려 깊은 멘토',
    nameLabel: '선택 이름',
    nameHelper: '메시지에서 불리고 싶은 이름.',
    namePlaceholder: '별명',
    instructionsLabel: '맞춤 지시',
    instructionsHelper: '메시지에 담고 싶은 내용.',
    instructionsPlaceholder: '확언 스타일에 대한 구체적인 안내...',
    toneLabel: '톤',
    toneHelper: '스크립트와 가장 잘 어울리는 느낌을 골라주세요.',
    durationLabel: '길이(초)',
    durationHelper: '오디오가 대략 얼마나 길었으면 하는지 정하세요.',
    generateScript: '스크립트 만들기',
    scriptLabel: '스크립트',
    scriptHelper: '오디오를 만들기 전에 스크립트를 수정하거나 다듬을 수 있어요.',
    prepareAudioTitle: '오디오 준비',
    prepareAudioHelper: '생성 전에 목소리를 고르고, 배경 음악을 추가할 수 있어요.',
    voiceLabel: '목소리 선택',
    backgroundMusicLabel: '배경 음악 선택',
    noBackgroundMusic: '배경 음악 없음',
    musicVolumeLabel: '배경 음악 볼륨',
    musicVolumeHelper: '',
    generateAudio: '오디오 만들기',
    loadingText: '확언을 만드는 중이에요...',
    affirmationHeading: '나의 확언',
    downloadAudio: '오디오 다운로드',
    aiMatchGenerate: 'AI 매칭 & 생성',
    replayLastAffirmation: '마지막 확언 다시 듣기',
    savedAffirmations: '저장된 확언',
    noSavedAffirmations: '저장된 확언이 아직 없습니다.',
    closeGallery: '닫기',
    tones: {
      cheerful: '유쾌한',
      lullaby: '자장가',
      calm: '차분한',
      motivational: '격려하는',
    },
    voices: {
      alloy: 'Alloy - 따뜻하고 중립적인 성인',
      ash: 'Ash - 명확한 성인 남성',
      ballad: 'Ballad - 부드러운 성인 남성',
      coral: 'Coral - 따뜻한 성인 여성',
      echo: 'Echo - 차분한 성인 남성',
      fable: 'Fable - 부드러운 젊은 여성',
      onyx: 'Onyx - 깊은 성인 남성',
      nova: 'Nova - 밝은 젊은 여성',
      sage: 'Sage - 차분한 성인 남성',
      shimmer: 'Shimmer - 가벼운 십대 여성',
      verse: 'Verse - 표현력 있는 성인 남성',
      marin: 'Marin - 상쾌한 젊은 여성',
      cedar: 'Cedar - 따뜻한 성인 남성',
    },
    musicLabels: {
      ambient: '앰비언트',
      cheerful: '유쾌한',
      cinematic: '시네마틱',
      lullaby: '자장가',
    },
    errors: {
      pleaseEnterPersona: '화자를 입력해주세요',
      pleaseGenerateScript: '먼저 스크립트를 생성해주세요',
      failedToGenerateScript: '스크립트 생성에 실패했습니다',
      failedToGenerateTTS: '음성 생성에 실패했습니다',
      failedToGenerateAudio: '오디오 생성에 실패했습니다',
      backgroundMusicMixFailed: '배경 음악을 혼합할 수 없습니다. 음성만 재생됩니다.',
      failedToAiMatch: 'AI 매칭에 실패했습니다. 다시 시도하거나 직접 선택해주세요.',
    },
  },
};

// API and asset base URLs with environment-aware ordering
const REMOTE_API_BASE = 'https://listen-you-are-loved.onrender.com/api';
const sameOriginApi = '/api';
const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);
const API_BASES = isLocalhost ? [sameOriginApi, REMOTE_API_BASE] : [REMOTE_API_BASE, sameOriginApi];

// Resolve the base path where the app is served (e.g., /listen-you-are-loved)
// Keep this fixed so production assets stay addressable when hosted as a
// standard GitHub Pages project site (e.g., https://<username>.github.io/listen-you-are-loved/).
const APP_BASE_PATH = '/listen-you-are-loved';

// Music asset bases mirror the API ordering and always include the app base path
const MUSIC_BASES = [
  APP_BASE_PATH,
  ...(typeof window !== 'undefined' ? [`${window.location.origin}${APP_BASE_PATH}`] : []),
  ...API_BASES.map(base => base.replace(/\/?api$/, APP_BASE_PATH)),
]
  .map(base => base.replace(/\/+$/, ''))
  .filter(Boolean);

async function fetchWithFallback(path, options = {}) {
  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`, options);

      // If the response is OK, or not a clear routing failure, return it
      if (response.ok || (response.status !== 404 && response.status !== 405)) {
        return response;
      }

      // 404/405 likely means the request hit the wrong service; try next base
      lastError = new Error(`Fallback triggered for ${base}${path} (${response.status})`);
    } catch (err) {
      // Network/connection error - save and try next
      lastError = err;
    }
  }

  // If all attempts failed, throw the last captured error
  throw lastError || new Error('API request failed');
}

// ProofAgent - client-side validation only
class ProofAgent {
  validate(script, persona, tone) {
    if (!script || script.trim().length === 0) {
      return { valid: false, error: 'Script is empty' };
    }

    const toneEndings = {
      lullaby: /good night|sleep well|rest well/i,
      cheerful: /good day|have a great|wonderful day/i,
      calm: /peace|calm|gentle|reassur/i,
      motivational: /you can|you will|you've got|believe/i,
    };

    const endingCheck = toneEndings[tone];
    if (endingCheck && !endingCheck.test(script)) {
      return { valid: true, warning: 'Tone ending may not match requirements' };
    }

    return { valid: true };
  }
}

// MusicAgent - handles client-side audio mixing
class MusicAgent {
  async mix(ttsAudioBase64, backgroundTrackFilename, musicVolume) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const effectiveMusicVolume = 0.5 * Math.max(0, Math.min(musicVolume ?? 1, 1));
    const fadeSeconds = 2;
    const musicTailSeconds = 5;

    // Load TTS audio
    const ttsBlob = this.base64ToBlob(ttsAudioBase64, 'audio/mpeg');
    const ttsUrl = URL.createObjectURL(ttsBlob);

    try {
      // Load and decode both sources
      const [ttsBuffer, musicBuffer] = await Promise.all([
        this.loadAudio(audioContext, ttsUrl),
        this.loadMusicWithFallback(audioContext, `/music/${backgroundTrackFilename}`),
      ]);

      const outputDuration = ttsBuffer.duration + musicTailSeconds;
      const sampleRate = ttsBuffer.sampleRate || 44100;
      const offlineContext = new OfflineAudioContext(2, Math.ceil(outputDuration * sampleRate), sampleRate);

      // Voice source stays at a constant level throughout
      const ttsSource = offlineContext.createBufferSource();
      const ttsGain = offlineContext.createGain();
      ttsSource.buffer = ttsBuffer;
      ttsGain.gain.setValueAtTime(1, 0);
      ttsSource.connect(ttsGain).connect(offlineContext.destination);

      // Music source loops quietly underneath and trails off after the voice
      const musicSource = offlineContext.createBufferSource();
      const musicGain = offlineContext.createGain();
      musicSource.buffer = musicBuffer;
      musicSource.loop = true;
      musicGain.gain.setValueAtTime(effectiveMusicVolume, 0);
      const musicFadeStart = Math.max(ttsBuffer.duration - fadeSeconds, 0);
      musicGain.gain.setValueAtTime(effectiveMusicVolume, musicFadeStart);
      musicGain.gain.linearRampToValueAtTime(0.001, ttsBuffer.duration + musicTailSeconds);
      musicSource.connect(musicGain).connect(offlineContext.destination);

      ttsSource.start(0);
      musicSource.start(0);
      musicSource.stop(outputDuration);

      const renderedBuffer = await offlineContext.startRendering();
      URL.revokeObjectURL(ttsUrl);

      return this.audioBufferToWavBase64(renderedBuffer);
    } catch (err) {
      URL.revokeObjectURL(ttsUrl);
      throw err;
    }
  }

  loadAudio(audioContext, url) {
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Unable to load audio from ${url} (${response.status})`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .catch(err => {
        throw new Error(`Unable to decode audio data from ${url}: ${err.message}`);
      });
  }

  async loadMusicWithFallback(audioContext, path) {
    let lastError = null;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    for (const base of MUSIC_BASES) {
      const url = `${base}${normalizedPath}`;
      try {
        const buffer = await this.loadAudio(audioContext, url);
        return buffer;
      } catch (err) {
        lastError = err;
        // Retry other bases only on common routing errors (404/405)
        if (!(err.message.includes('(404)') || err.message.includes('(405)'))) {
          break;
        }
      }
    }

    throw lastError || new Error(`Unable to load music from ${path}`);
  }

  base64ToBlob(base64, mimeType) {
    // Use chunked approach to avoid stack overflow
    const byteCharacters = atob(base64);
    const chunkSize = 8192;
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i += chunkSize) {
      const chunk = byteCharacters.slice(i, i + chunkSize);
      const byteNumbers = new Array(chunk.length);
      for (let j = 0; j < chunk.length; j++) {
        byteNumbers[j] = chunk.charCodeAt(j);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  audioBufferToWavBase64(audioBuffer) {
    const wavBuffer = this.audioBufferToWav(audioBuffer);
    const bytes = new Uint8Array(wavBuffer);
    let binary = '';
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const samples = buffer.length;
    const blockAlign = numChannels * bitDepth / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = [];
    for (let channel = 0; channel < numChannels; channel++) {
      channelData.push(buffer.getChannelData(channel));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = channelData[channel][i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }
}

class DeliveryAgent {
  deliver(audioBase64, format = 'mp3') {
    // If it's webm/wav from mixing, convert to blob directly
    const mimeType =
      format === 'webm'
        ? 'audio/webm'
        : format === 'wav'
          ? 'audio/wav'
          : 'audio/mpeg';

    const audioBlob = this.base64ToBlob(audioBase64, mimeType);
    const audioUrl = URL.createObjectURL(audioBlob);
    return { audioUrl, audioBlob };
  }

  base64ToBlob(base64, mimeType) {
    // Use chunked approach to avoid stack overflow
    const byteCharacters = atob(base64);
    const chunkSize = 8192;
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i += chunkSize) {
      const chunk = byteCharacters.slice(i, i + chunkSize);
      const byteNumbers = new Array(chunk.length);
      for (let j = 0; j < chunk.length; j++) {
        byteNumbers[j] = chunk.charCodeAt(j);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  download(audioBlob, filename = 'affirmation.mp3') {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// IndexedDB storage for saved affirmations
const AffirmationStore = {
  DB_NAME: 'listen-you-are-loved',
  STORE_NAME: 'affirmations',
  MAX_ITEMS: 10,

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async save(entry) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      tx.objectStore(this.STORE_NAME).put(entry);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  async getAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const request = tx.objectStore(this.STORE_NAME).getAll();
      request.onsuccess = () => {
        db.close();
        const items = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  },

  async prune() {
    const items = await this.getAll();
    if (items.length > this.MAX_ITEMS) {
      const toDelete = items.slice(this.MAX_ITEMS);
      const db = await this.open();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      toDelete.forEach(item => store.delete(item.id));
      return new Promise((resolve) => {
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); resolve(); };
      });
    }
  },
};

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [persona, setPersona] = useState('');
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('calm');
  const [duration, setDuration] = useState(60);
  const [voice, setVoice] = useState('alloy');
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [musicVolume, setMusicVolume] = useState(0.15);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [musicFiles, setMusicFiles] = useState([]);
  const [started, setStarted] = useState(false);
  const [savedAffirmations, setSavedAffirmations] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState({});
  const text = uiText[currentLanguage];

  useEffect(() => {
    window.currentLanguage = currentLanguage;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  const getVoices = (lang) => {
    const voiceKeys = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];
    return voiceKeys.map(key => ({
      value: key,
      label: uiText[lang]?.voices?.[key] || uiText.en.voices[key],
    }));
  };

  const getMusicLabel = (filename, lang) => {
    const musicLabels = {
      'ambient-background-2-421085.mp3': 'ambient',
      'cheerful-joyful-playful-music-380550.mp3': 'cheerful',
      'cinematic-ambient-348342.mp3': 'cinematic',
      'lullaby-acoustic-guitar-438657.mp3': 'lullaby',
    };
    const key = musicLabels[filename];
    if (!key) {
      return filename.replace('.mp3', '').replace(/-/g, ' ');
    }
    return uiText[lang]?.musicLabels?.[key] || uiText.en.musicLabels[key];
  };

  // Helper function to safely parse JSON responses
  const parseJsonResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 150)}`);
    }
    return response.json();
  };

  // Helper function to safely handle error responses
  const handleErrorResponse = async (response) => {
    // Clone the response so we can read it without consuming the body
    const clonedResponse = response.clone();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        return errorData.error || `Server error (${response.status})`;
      } catch (e) {
        // If JSON parsing fails, try reading as text from cloned response
        try {
          const errorText = await clonedResponse.text();
          return `Server error (${response.status}): ${errorText.substring(0, 200)}`;
        } catch (textErr) {
          return `Server error (${response.status}): Unable to parse response`;
        }
      }
    }

    // If not JSON, read as text
    try {
      const errorText = await response.text();
      return `Server error (${response.status}): ${errorText.substring(0, 200)}`;
    } catch (e) {
      return `Server error (${response.status}): Unable to read response`;
    }
  };

  // Fetch music files from backend on mount
  useEffect(() => {
    fetchWithFallback('/music-files')
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to load music files: ${res.status} ${errorText.substring(0, 100)}`);
        }
        return parseJsonResponse(res);
      })
      .then(data => {
        if (data.files && data.files.length > 0) {
          setMusicFiles(data.files);
        }
      })
      .catch(err => {
        console.warn('Failed to load music files:', err);
        // Fallback to hardcoded list if API fails
        const fallbackFiles = [
          'ambient-background-2-421085.mp3',
          'cheerful-joyful-playful-music-380550.mp3',
          'cinematic-ambient-348342.mp3',
          'lullaby-acoustic-guitar-438657.mp3'
        ];
        setMusicFiles(fallbackFiles);
      });
  }, []);

  // Load saved affirmations count on mount
  useEffect(() => {
    AffirmationStore.getAll()
      .then(items => setSavedAffirmations(items))
      .catch(() => {});
  }, []);

  const saveAffirmationToGallery = async (audioBlob, metadata) => {
    try {
      const entry = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        persona,
        tone,
        customInstructions: instructions,
        voice: metadata.voice,
        music: metadata.music,
        musicVolume: metadata.musicVolume,
        oneLineSummary: metadata.oneLineSummary,
        audioBlob,
      };
      await AffirmationStore.save(entry);
      await AffirmationStore.prune();
      const items = await AffirmationStore.getAll();
      setSavedAffirmations(items);
    } catch (err) {
      console.warn('Failed to save affirmation:', err);
    }
  };

  const openGallery = async () => {
    try {
      const items = await AffirmationStore.getAll();
      setSavedAffirmations(items);
      const urls = {};
      items.forEach(item => {
        if (item.audioBlob) {
          urls[item.id] = URL.createObjectURL(item.audioBlob);
        }
      });
      setGalleryUrls(urls);
      setShowGallery(true);
    } catch (err) {
      console.warn('Failed to open gallery:', err);
    }
  };

  const closeGallery = () => {
    Object.values(galleryUrls).forEach(url => URL.revokeObjectURL(url));
    setGalleryUrls({});
    setShowGallery(false);
  };

  const generateScript = async () => {
    if (!persona) {
      setError(text.errors.pleaseEnterPersona);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call backend script generation API
      const response = await fetchWithFallback('/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona,
          name,
          instructions,
          tone,
          durationSeconds: duration,
          language: currentLanguage,
        }),
      });

      if (!response.ok) {
        const errorMessage = await handleErrorResponse(response);
        throw new Error(errorMessage || text.errors.failedToGenerateScript);
      }

      const data = await parseJsonResponse(response);
      setScript(data.script);
    } catch (err) {
      setError(err.message || text.errors.failedToGenerateScript);
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async (overrideConfig) => {
    if (!script) {
      setError(text.errors.pleaseGenerateScript);
      return;
    }

    // Determine effective settings: use override if provided, else use dropdown state
    const effectiveVoice = overrideConfig?.voice || voice;
    const effectiveMusic = overrideConfig?.backgroundMusic ?? backgroundMusic;
    const effectiveVolume = overrideConfig?.musicVolume ?? musicVolume;
    const summary = overrideConfig?.oneLineSummary || '';

    try {
      setLoading(true);
      setError(null);

      const proofAgent = new ProofAgent();
      const validation = proofAgent.validate(script, persona, tone);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Call backend TTS API
      const ttsResponse = await fetchWithFallback('/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script,
          voice: effectiveVoice,
        }),
      });

      if (!ttsResponse.ok) {
        const errorMessage = await handleErrorResponse(ttsResponse);
        throw new Error(errorMessage || text.errors.failedToGenerateTTS);
      }

      const ttsData = await parseJsonResponse(ttsResponse);
      let finalAudioBase64 = ttsData.audio;
      let finalFormat = ttsData.format || 'mp3';

      // If background music is selected, mix it client-side
      if (effectiveMusic) {
        try {
          const musicAgent = new MusicAgent();
          finalAudioBase64 = await musicAgent.mix(finalAudioBase64, effectiveMusic, effectiveVolume);
          finalFormat = 'wav';
        } catch (mixError) {
          console.warn('Falling back to voice-only audio:', mixError);
          setError(text.errors.backgroundMusicMixFailed);
        }
      }

      const deliveryAgent = new DeliveryAgent();
      const { audioUrl: url, audioBlob } = deliveryAgent.deliver(finalAudioBase64, finalFormat);
      setAudioUrl(url);
      window.currentAudioBlob = audioBlob;

      // Save to gallery
      await saveAffirmationToGallery(audioBlob, {
        voice: effectiveVoice,
        music: effectiveMusic,
        musicVolume: Math.round(effectiveVolume * 100),
        oneLineSummary: summary || (persona + (instructions ? ' — ' + instructions : '')).substring(0, 100),
      });
    } catch (err) {
      setError(err.message || text.errors.failedToGenerateAudio);
    } finally {
      setLoading(false);
    }
  };

  const aiMatchAndGenerate = async () => {
    if (!script) {
      setError(text.errors.pleaseGenerateScript);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithFallback('/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, tone, instructions }),
      });

      if (!response.ok) {
        const errorMessage = await handleErrorResponse(response);
        throw new Error(errorMessage || text.errors.failedToAiMatch);
      }

      const matchData = await parseJsonResponse(response);
      const vol = Number(matchData.musicVolume);
      const safeVolume = (Number.isFinite(vol) && vol >= 0 && vol <= 100) ? vol / 100 : 0.15;

      // Generate audio with AI-chosen settings without changing dropdown state
      setLoading(false);
      await generateAudio({
        voice: matchData.voice,
        backgroundMusic: matchData.musicFile,
        musicVolume: safeVolume,
        oneLineSummary: matchData.oneLineSummary || '',
      });
    } catch (err) {
      setError(err.message || text.errors.failedToAiMatch);
      setLoading(false);
    }
  };

  const downloadAudio = () => {
    if (window.currentAudioBlob) {
      const deliveryAgent = new DeliveryAgent();
      const filename = `affirmation-${Date.now()}.${
        window.currentAudioBlob.type.includes('webm')
          ? 'webm'
          : window.currentAudioBlob.type.includes('wav')
            ? 'wav'
            : 'mp3'
      }`;
      deliveryAgent.download(window.currentAudioBlob, filename);
    }
  };

  return (
    <div className="page">
      <div className="language-switcher">
        {['en', 'zh', 'ko'].map(code => (
          <button
            key={code}
            className={`lang-btn ${currentLanguage === code ? 'active' : ''}`}
            onClick={() => setCurrentLanguage(code)}
          >
            {code === 'en' ? 'EN' : code === 'zh' ? '中' : '한'}
          </button>
        ))}
      </div>
      <div className="frame landing-frame">
        <div className="decorative-frame">
          <h1 className="dynapuff-main">{text.title}</h1>
          <div className="hero-illustration-wrap">
            <img
              src="image/listen-logo.png"
              alt="Heart and ear illustration"
              className="hero-illustration"
              loading="eager"
              fetchpriority="high"
              onError={e => {
                // Fallback to SVG if the PNG isn't available (e.g., when hosted separately)
                if (!e.target.dataset.fallback) {
                  e.target.dataset.fallback = 'true';
                  e.target.src = 'image/listen-logo.svg';
                }
              }}
            />
          </div>
          <p className="description lexend-body">
            {text.descriptionLine1}
            <br /><br />
            {text.descriptionLine2}
          </p>
          <div className="cta-row">
            <button className="btn-primary lexend-body" onClick={() => {
              setStarted(true);
              // Scroll to the affirmation section after state update
              setTimeout(() => {
                const section = document.getElementById('affirmation-section');
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}>
              {text.getStarted}
            </button>
          </div>
          {savedAffirmations.length > 0 && (
            <div className="cta-row" style={{ marginTop: '8px' }}>
              <button className="btn-secondary lexend-body" onClick={openGallery}>
                {text.replayLastAffirmation}
              </button>
            </div>
          )}
        </div>
      </div>

      {started && (
        <div className="frame workspace-frame">
          <div className="section-header" id="affirmation-section">
            <h2 className="dynapuff-main">{text.sectionTitle}</h2>
            <p className="lexend-body helper-text">{text.sectionSubtitle}</p>
          </div>

          <div className="form-grid">
            <div className="form-section">
              <label htmlFor="persona">{text.personaLabel}</label>
              <p className="helper-text">{text.personaHelper}</p>
              <input
                type="text"
                id="persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder={text.personaPlaceholder}
              />
            </div>

            <div className="form-section">
              <label htmlFor="name">{text.nameLabel}</label>
              <p className="helper-text">{text.nameHelper}</p>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={text.namePlaceholder}
              />
            </div>

            <div className="form-section">
              <label htmlFor="instructions">{text.instructionsLabel}</label>
              <p className="helper-text">{text.instructionsHelper}</p>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={text.instructionsPlaceholder}
              />
            </div>

            <div className="form-section">
              <label htmlFor="tone">{text.toneLabel}</label>
              <p className="helper-text">{text.toneHelper}</p>
              <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="cheerful">{text.tones.cheerful}</option>
                <option value="lullaby">{text.tones.lullaby}</option>
                <option value="calm">{text.tones.calm}</option>
                <option value="motivational">{text.tones.motivational}</option>
              </select>
            </div>

            <div className="form-section">
              <label htmlFor="duration">{text.durationLabel}</label>
              <p className="helper-text">{text.durationHelper}</p>
              <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {Array.from({ length: 11 }, (_, i) => (i + 2) * 10).map(sec => (
                  <option key={sec} value={sec}>{sec}s</option>
                ))}
              </select>
            </div>
          </div>

          <div className="button-group">
            <button className="btn-primary lexend-body" onClick={generateScript} disabled={loading}>
              {text.generateScript}
            </button>
          </div>

          {script && (
            <div className="post-script">
              <div className="script-editor">
                <label htmlFor="script">{text.scriptLabel}</label>
                <p className="helper-text">{text.scriptHelper}</p>
                <textarea
                  id="script"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={text.scriptHelper}
                />
              </div>

              <div className="audio-setup">
                <div className="section-header compact">
                  <h3 className="dynapuff-main">{text.prepareAudioTitle}</h3>
                  <p className="lexend-body helper-text">{text.prepareAudioHelper}</p>
                </div>

                <div className="form-grid narrow">
                <div className="form-section">
                  <label htmlFor="voice">{text.voiceLabel}</label>
                  <select
                    id="voice"
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                  >
                    {getVoices(currentLanguage).map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-section">
                  <label htmlFor="backgroundMusic">{text.backgroundMusicLabel}</label>
                  <select
                    id="backgroundMusic"
                    value={backgroundMusic}
                    onChange={(e) => setBackgroundMusic(e.target.value)}
                  >
                    <option value="">{text.noBackgroundMusic}</option>
                    {musicFiles.map(file => {
                      const label = getMusicLabel(file, currentLanguage);
                      return (
                        <option key={file} value={file}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                {backgroundMusic && (
                  <div className="form-section">
                    <label htmlFor="musicVolume">{text.musicVolumeLabel}</label>
                    {text.musicVolumeHelper && (
                      <p className="helper-text">{text.musicVolumeHelper}</p>
                    )}
                    <div className="slider-container">
                      <input
                        type="range"
                        id="musicVolume"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(musicVolume * 100)}
                        onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                      />
                      <span className="volume-value lexend-body">{Math.round(musicVolume * 100)}%</span>
                    </div>
                  </div>
                )}
                </div>

                <div className="button-group">
                  <button className="btn-primary lexend-body" onClick={() => generateAudio()} disabled={loading}>
                    {text.generateAudio}
                  </button>
                  <button className="btn-secondary lexend-body" onClick={aiMatchAndGenerate} disabled={loading}>
                    {text.aiMatchGenerate}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading lexend-body">
              <p>{text.loadingText}</p>
            </div>
          )}

          {error && (
            <div className="error lexend-body">
              {error}
            </div>
          )}

          {audioUrl && (
            <div className="audio-section">
              <h2 className="dynapuff-main" style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
                {text.affirmationHeading}
              </h2>
              <audio className="audio-player" controls src={audioUrl} />
              <button className="download-btn lexend-body" onClick={downloadAudio}>
                {text.downloadAudio}
              </button>
            </div>
          )}
        </div>
      )}

      {showGallery && (
        <div className="frame workspace-frame" style={{ position: 'relative' }}>
          <button
            className="gallery-close-btn"
            onClick={closeGallery}
            aria-label="Close"
          >
            <svg viewBox="0 0 14 14" fill="none">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
          <div className="section-header">
            <h2 className="dynapuff-main">{text.savedAffirmations}</h2>
          </div>
          <div className="gallery-list">
            {savedAffirmations.length === 0 ? (
              <p className="lexend-body helper-text">{text.noSavedAffirmations}</p>
            ) : (
              savedAffirmations.map(item => (
                <div key={item.id} className="gallery-item">
                  <p className="gallery-summary lexend-body">{item.oneLineSummary}</p>
                  {galleryUrls[item.id] && (
                    <audio className="audio-player" controls src={galleryUrls[item.id]} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

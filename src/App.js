const { useState, useEffect } = React;

const wordsPerSecond = 2;

const toneEndingRules = {
  lullaby: 'must end with "good night" style line',
  cheerful: 'must end with "have a good day" style line',
  calm: 'ends with gentle reassurance',
  motivational: 'ends with confident encouragement',
};

// API and asset base URLs with environment-aware ordering
const REMOTE_API_BASE = 'https://listen-you-are-loved.onrender.com/api';
const sameOriginApi = '/api';
const isLocalhost = typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);
const API_BASES = isLocalhost ? [sameOriginApi, REMOTE_API_BASE] : [REMOTE_API_BASE, sameOriginApi];

// Music asset bases mirror the API ordering so production prefers the hosted backend first
const MUSIC_BASES = API_BASES.map(base => base.replace(/\/?api$/, '')).concat(
  typeof window !== 'undefined' ? [window.location.origin] : []
);

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

      // Voice source with fade-out toward the end
      const ttsSource = offlineContext.createBufferSource();
      const ttsGain = offlineContext.createGain();
      ttsSource.buffer = ttsBuffer;
      ttsGain.gain.setValueAtTime(1, 0);
      const fadeStart = Math.max(ttsBuffer.duration - fadeSeconds, 0);
      ttsGain.gain.setValueAtTime(1, fadeStart);
      ttsGain.gain.linearRampToValueAtTime(0.001, ttsBuffer.duration);
      ttsSource.connect(ttsGain).connect(offlineContext.destination);

      // Music source loops quietly underneath and tails out after the voice
      const musicSource = offlineContext.createBufferSource();
      const musicGain = offlineContext.createGain();
      musicSource.buffer = musicBuffer;
      musicSource.loop = true;
      musicGain.gain.setValueAtTime(effectiveMusicVolume, 0);
      const musicFadeStart = Math.max(outputDuration - fadeSeconds, 0);
      musicGain.gain.setValueAtTime(effectiveMusicVolume, musicFadeStart);
      musicGain.gain.linearRampToValueAtTime(0.001, outputDuration);
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

function App() {
  const [persona, setPersona] = useState('');
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tone, setTone] = useState('calm');
  const [duration, setDuration] = useState(60);
  const [voice, setVoice] = useState('alloy');
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [musicVolume, setMusicVolume] = useState(1);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [musicFiles, setMusicFiles] = useState([]);
  const [started, setStarted] = useState(false);

  const voices = [
    { value: 'alloy', label: 'Alloy - warm neutral adult' },
    { value: 'echo', label: 'Echo - calm adult male' },
    { value: 'fable', label: 'Fable - gentle young female' },
    { value: 'onyx', label: 'Onyx - deep adult male' },
    { value: 'nova', label: 'Nova - bright young female' },
    { value: 'shimmer', label: 'Shimmer - airy teen female' },
  ];

  const musicLabels = {
    'ambient-background-2-421085.mp3': 'ambient',
    'cheerful-joyful-playful-music-380550.mp3': 'cheerful',
    'cinematic-ambient-348342.mp3': 'cinematic',
    'lullaby-acoustic-guitar-438657.mp3': 'lullaby',
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

  const generateScript = async () => {
    if (!persona) {
      setError('Please enter a persona');
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
        }),
      });

      if (!response.ok) {
        const errorMessage = await handleErrorResponse(response);
        throw new Error(errorMessage || 'Failed to generate script');
      }

      const data = await parseJsonResponse(response);
      setScript(data.script);
    } catch (err) {
      setError(err.message || 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!script) {
      setError('Please generate a script first');
      return;
    }

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
          voice: voice,
        }),
      });

      if (!ttsResponse.ok) {
        const errorMessage = await handleErrorResponse(ttsResponse);
        throw new Error(errorMessage || 'Failed to generate TTS');
      }

      const ttsData = await parseJsonResponse(ttsResponse);
      let finalAudioBase64 = ttsData.audio;
      let finalFormat = ttsData.format || 'mp3';
      
      // If background music is selected, mix it client-side
      if (backgroundMusic) {
        try {
          const musicAgent = new MusicAgent();
          finalAudioBase64 = await musicAgent.mix(finalAudioBase64, backgroundMusic, musicVolume);
          finalFormat = 'wav';
        } catch (mixError) {
          console.warn('Falling back to voice-only audio:', mixError);
          setError('Background music could not be mixed. Playing the voice-only version instead.');
        }
      }

      const deliveryAgent = new DeliveryAgent();
      const { audioUrl: url, audioBlob } = deliveryAgent.deliver(finalAudioBase64, finalFormat);
      setAudioUrl(url);
      window.currentAudioBlob = audioBlob;
    } catch (err) {
      setError(err.message || 'Failed to generate audio');
    } finally {
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
      <div className="frame landing-frame">
        <div className="decorative-frame">
          <h1 className="dynapuff-main">Listen, You Are Loved</h1>
          <div className="hero-illustration-wrap">
            <img
              src="/image/listen-logo.png"
              alt="Heart and ear illustration"
              className="hero-illustration"
            />
          </div>
          <p className="description lexend-body">
            Customize their tone, who they speak as, the words they use, and the sound of the voice itself, then let them read
            your personalized affirmations aloud with gentle care.
            <br /><br />
            With each listen, you will feel a little more centered, a little more supported, and a little more connected to the
            comfort you deserve.
          </p>
          <div className="cta-row">
            <button className="btn-primary lexend-body" onClick={() => setStarted(true)}>
              Get Started
            </button>
          </div>
        </div>
      </div>

      {started && (
        <div className="frame workspace-frame">
          <div className="section-header">
            <h2 className="dynapuff-main">Create your personalized affirmation</h2>
            <p className="lexend-body helper-text">Begin by describing who is speaking and what they should talk about.</p>
          </div>

          <div className="form-grid">
            <div className="form-section">
              <label htmlFor="persona">Persona *</label>
              <p className="helper-text">Who is speaking to you in this message.</p>
              <input
                type="text"
                id="persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g., A gentle grandmother, a wise friend, a caring mentor"
              />
            </div>

            <div className="form-section">
              <label htmlFor="name">Optional Name</label>
              <p className="helper-text">Your preferred name to be addressed in the message.</p>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name to use gently in affirmations"
              />
            </div>

            <div className="form-section">
              <label htmlFor="instructions">Custom Instructions</label>
              <p className="helper-text">What you want the message to talk about.</p>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any specific guidance for the affirmation style..."
              />
            </div>

            <div className="form-section">
              <label htmlFor="tone">Tone</label>
              <p className="helper-text">Choose the feeling that best fits the script.</p>
              <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="cheerful">Cheerful</option>
                <option value="lullaby">Lullaby</option>
                <option value="calm">Calm</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>

            <div className="form-section">
              <label htmlFor="duration">Duration (seconds)</label>
              <p className="helper-text">Decide how long the audio should roughly last.</p>
              <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {Array.from({ length: 11 }, (_, i) => (i + 2) * 10).map(sec => (
                  <option key={sec} value={sec}>{sec}s</option>
                ))}
              </select>
            </div>
          </div>

          <div className="button-group">
            <button className="btn-primary lexend-body" onClick={generateScript} disabled={loading}>
              Generate Script
            </button>
          </div>

          {script && (
            <div className="post-script">
              <div className="script-editor">
                <label htmlFor="script">Script</label>
                <p className="helper-text">You can edit or refine this script before generating the audio.</p>
                <textarea
                  id="script"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Generated script will appear here..."
                />
              </div>

              <div className="audio-setup">
                <div className="section-header compact">
                  <h3 className="dynapuff-main">Prepare your audio</h3>
                  <p className="lexend-body helper-text">
                    Choose a voice and add optional background music before generating.
                  </p>
                </div>

                <div className="form-grid narrow">
                <div className="form-section">
                  <label htmlFor="voice">Voice selection</label>
                  <select id="voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
                    {voices.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-section">
                  <label htmlFor="backgroundMusic">Background music selection</label>
                  <select
                    id="backgroundMusic"
                    value={backgroundMusic}
                    onChange={(e) => setBackgroundMusic(e.target.value)}
                  >
                    <option value="">No background music</option>
                    {musicFiles.map(file => {
                      const label = musicLabels[file] || file.replace('.mp3', '').replace(/-/g, ' ');
                      return (
                        <option key={file} value={file}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                {backgroundMusic && (
                  <div className="form-section">
                    <label htmlFor="musicVolume">Background music volume</label>
                    <p className="helper-text">Scale ranges from 0% to 100%, where 100% plays the track at half its original volume.</p>
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
                  <button className="btn-primary lexend-body" onClick={generateAudio} disabled={loading}>
                    Generate Audio
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading lexend-body">
              <p>Creating your affirmation...</p>
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
                Your Affirmation
              </h2>
              <audio className="audio-player" controls src={audioUrl} />
              <button className="download-btn lexend-body" onClick={downloadAudio}>
                Download Audio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

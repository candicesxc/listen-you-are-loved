const { useState, useEffect } = React;

const wordsPerSecond = 2;

const toneEndingRules = {
  lullaby: 'must end with "good night" style line',
  cheerful: 'must end with "have a good day" style line',
  calm: 'ends with gentle reassurance',
  motivational: 'ends with confident encouragement',
};

// API base URLs - try same-origin first, then Render fallback
const API_BASES = Array.from(new Set([
  '/api',
  'https://listen-you-are-loved.onrender.com/api',
]))
  // Keep consistent ordering: prefer same-origin for deployed app
  .sort((a, b) => (a.startsWith('http') ? 1 : -1));

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
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load TTS audio
      const ttsBlob = this.base64ToBlob(ttsAudioBase64, 'audio/mpeg');
      const ttsUrl = URL.createObjectURL(ttsBlob);
      
      // Load background music from server
      const musicUrl = `/music/${backgroundTrackFilename}`;
      
      Promise.all([
        this.loadAudio(audioContext, ttsUrl),
        this.loadAudio(audioContext, musicUrl),
      ]).then(([ttsBuffer, musicBuffer]) => {
        // Create source nodes
        const ttsSource = audioContext.createBufferSource();
        const musicSource = audioContext.createBufferSource();
        
        ttsSource.buffer = ttsBuffer;
        musicSource.buffer = musicBuffer;
        
        // Create gain nodes for volume control
        const ttsGain = audioContext.createGain();
        const musicGain = audioContext.createGain();
        
        ttsGain.gain.value = 1.0;
        musicGain.gain.value = musicVolume || 0.3;
        
        // Create destination for recording (don't connect to audioContext.destination)
        const destination = audioContext.createMediaStreamDestination();
        
        // Connect nodes to recording destination only
        ttsSource.connect(ttsGain);
        musicSource.connect(musicGain);
        ttsGain.connect(destination);
        musicGain.connect(destination);
        
        // Record the mixed audio
        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          this.blobToBase64(blob).then(base64 => {
            URL.revokeObjectURL(ttsUrl);
            resolve(base64);
          });
        };
        
        mediaRecorder.start();
        ttsSource.start(0);
        musicSource.start(0);
        
        const duration = Math.max(ttsBuffer.duration, musicBuffer.duration) * 1000;
        setTimeout(() => {
          mediaRecorder.stop();
          ttsSource.stop();
          musicSource.stop();
        }, duration + 100);
      }).catch(reject);
    });
  }

  loadAudio(audioContext, url) {
    return fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer));
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

  blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }
}

class DeliveryAgent {
  deliver(audioBase64, format = 'mp3') {
    // If it's webm from mixing, convert to blob directly
    const mimeType = format === 'webm' ? 'audio/webm' : 'audio/mpeg';
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
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [musicFiles, setMusicFiles] = useState([]);

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

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
          setBackgroundMusic(data.files[0]);
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
        setBackgroundMusic(fallbackFiles[0]);
      });
  }, []);

  const testVoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend TTS API
      const response = await fetchWithFallback('/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: 'Hello',
          voice: voice,
        }),
      });

      if (!response.ok) {
        const errorMessage = await handleErrorResponse(response);
        throw new Error(errorMessage || 'Failed to generate test voice');
      }

      const data = await parseJsonResponse(response);
      const deliveryAgent = new DeliveryAgent();
      const { audioUrl } = deliveryAgent.deliver(data.audio, data.format || 'mp3');
      setAudioUrl(audioUrl);
    } catch (err) {
      setError(err.message || 'Failed to generate test voice');
    } finally {
      setLoading(false);
    }
  };

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

  const polishScript = async () => {
    if (!script) {
      setError('Please generate a script first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use generate-script API with polish instructions
      const response = await fetchWithFallback('/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona,
          name,
          instructions: `Polish and refine this script: ${script}`,
          tone,
          durationSeconds: duration,
        }),
      });

      if (!response.ok) {
        const errorMessage = await handleErrorResponse(response);
        throw new Error(errorMessage || 'Failed to polish script');
      }

      const data = await parseJsonResponse(response);
      setScript(data.script);
    } catch (err) {
      setError(err.message || 'Failed to polish script');
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
        const musicAgent = new MusicAgent();
        finalAudioBase64 = await musicAgent.mix(finalAudioBase64, backgroundMusic, musicVolume);
        finalFormat = 'webm';
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
      const filename = `affirmation-${Date.now()}.${window.currentAudioBlob.type.includes('webm') ? 'webm' : 'mp3'}`;
      deliveryAgent.download(window.currentAudioBlob, filename);
    }
  };

  return (
    <div className="container">
      <h1 className="dynapuff-main">Listen, You Are Loved</h1>
      <p className="description lexend-body">
        Customize their tone, who they speak as, the words they use, and the sound of the voice itself, 
        then let them read your personalized affirmations aloud with gentle care.
        <br /><br />
        With each listen, you will feel a little more centered, a little more supported, 
        and a little more connected to the comfort you deserve.
      </p>

      <div className="form-section">
        <label htmlFor="persona">Persona *</label>
        <input
          type="text"
          id="persona"
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="e.g., A gentle grandmother, A wise friend, A caring mentor"
        />
      </div>

      <div className="form-section">
        <label htmlFor="name">Optional Name</label>
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
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Any specific guidance for the affirmation style..."
        />
      </div>

      <div className="form-section">
        <label htmlFor="tone">Tone</label>
        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="cheerful">Cheerful</option>
          <option value="lullaby">Lullaby</option>
          <option value="calm">Calm</option>
          <option value="motivational">Motivational</option>
        </select>
      </div>

      <div className="form-section">
        <label htmlFor="duration">Duration (seconds)</label>
        <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          {Array.from({ length: 11 }, (_, i) => (i + 2) * 10).map(sec => (
            <option key={sec} value={sec}>{sec}s</option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <label htmlFor="voice">Voice</label>
        <select id="voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
          {voices.map(v => (
            <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
          ))}
        </select>
        <div className="voice-preview">
          <button className="test-voice-btn" onClick={testVoice} disabled={loading}>
            Test Voice
          </button>
          <span className="lexend-body" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            Says "Hello" to preview the voice
          </span>
        </div>
      </div>

      <div className="form-section">
        <label htmlFor="backgroundMusic">Background Music</label>
        <select 
          id="backgroundMusic" 
          value={backgroundMusic} 
          onChange={(e) => setBackgroundMusic(e.target.value)}
        >
          <option value="">None</option>
          {musicFiles.map(file => (
            <option key={file} value={file}>{file.replace('.mp3', '').replace(/-/g, ' ')}</option>
          ))}
        </select>
      </div>

      {backgroundMusic && (
        <div className="form-section">
          <label htmlFor="musicVolume">Background Music Volume</label>
          <div className="slider-container">
            <input
              type="range"
              id="musicVolume"
              min="0"
              max="1"
              step="0.1"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
            />
            <span className="volume-value lexend-body">{Math.round(musicVolume * 100)}%</span>
          </div>
        </div>
      )}


      <div className="button-group">
        <button className="btn-primary lexend-body" onClick={generateScript} disabled={loading}>
          Generate Script
        </button>
      </div>

      {script && (
        <div className="script-editor">
          <label htmlFor="script">Script</label>
          <textarea
            id="script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Generated script will appear here..."
          />
          <div className="button-group" style={{ marginTop: '12px' }}>
            <button className="btn-secondary lexend-body" onClick={polishScript} disabled={loading}>
              Polish with AI
            </button>
            <button className="btn-primary lexend-body" onClick={generateAudio} disabled={loading}>
              Generate Audio
            </button>
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
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

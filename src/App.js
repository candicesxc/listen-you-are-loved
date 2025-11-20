const { useState, useEffect } = React;

// Load API key from config (config.js is in .gitignore)
let OPENAI_API_KEY = '';

// Function to get API key - checks multiple sources
function getApiKey() {
  // Check if config.js loaded
  if (window.OPENAI_CONFIG && window.OPENAI_CONFIG.API_KEY) {
    return window.OPENAI_CONFIG.API_KEY;
  }
  return '';
}

// Try to get API key immediately
OPENAI_API_KEY = getApiKey();

// Also check periodically in case config.js loads late
let checkCount = 0;
const maxChecks = 10;
const checkInterval = setInterval(() => {
  if (!OPENAI_API_KEY) {
    OPENAI_API_KEY = getApiKey();
    if (OPENAI_API_KEY || checkCount >= maxChecks) {
      clearInterval(checkInterval);
    }
  } else {
    clearInterval(checkInterval);
  }
  checkCount++;
}, 100);

const wordsPerSecond = 2;

const toneEndingRules = {
  lullaby: 'must end with "good night" style line',
  cheerful: 'must end with "have a good day" style line',
  calm: 'ends with gentle reassurance',
  motivational: 'ends with confident encouragement',
};

// CrewAI Agents
class ScriptAgent {
  async generate(apiKey, persona, name, instructions, tone, durationSeconds) {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please create a config.js file.');
    }

    const targetWords = Math.round(durationSeconds * wordsPerSecond);
    const toneEndingRule = toneEndingRules[tone] || 'ends with gentle reassurance';

    const systemPrompt = `You write second-person affirmation scripts spoken from a specified persona.

Rules:
- Begin most lines with "You".
- If a name is provided, include it gently and sparingly.
- Match the emotional style of the chosen persona.
- Follow tone rules and end with the required tone-specific closing.
- Use warm, simple, supportive language.
- No negativity, contrast words, metaphors, or trauma.
- Write one continuous flowing paragraph.
- Plain text only.`;

    const userPrompt = `Write a continuous second-person affirmation script.

Persona: ${persona}
Instructions: ${instructions || 'None'}
Tone: ${tone}
Duration: ${durationSeconds} seconds
Target word count: ${targetWords}
Optional name: ${name || 'None'}

Begin most lines with "You".
Use the name only where it feels gentle and meaningful.
End with the required tone-based closing line:
${toneEndingRule}

One paragraph. No bullets or breaks.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: Math.min(targetWords * 2, 1000),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate script');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}

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

class VoiceAgent {
  async generate(apiKey, script, voice) {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured.');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: voice,
        input: script,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate TTS');
    }

    const arrayBuffer = await response.arrayBuffer();
    // Use chunked approach to avoid stack overflow
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const base64 = btoa(binary);
    return base64;
  }
}

class MusicAgent {
  async mix(ttsAudioBase64, backgroundTrackFilename, musicVolume) {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load TTS audio
      const ttsBlob = this.base64ToBlob(ttsAudioBase64, 'audio/mpeg');
      const ttsUrl = URL.createObjectURL(ttsBlob);
      
      // Load background music
      const musicUrl = `music/${backgroundTrackFilename}`;
      
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
  // Always use API key from config.js - check on mount and when config loads
  const getCurrentApiKey = () => {
    return OPENAI_API_KEY || (window.OPENAI_CONFIG && window.OPENAI_CONFIG.API_KEY) || '';
  };
  
  const [apiKey, setApiKey] = useState(getCurrentApiKey());
  
  // Check for API key after component mounts (in case config.js loads late)
  useEffect(() => {
    const currentKey = getCurrentApiKey();
    if (currentKey && currentKey !== apiKey) {
      setApiKey(currentKey);
    }
    
    // Also check periodically
    const interval = setInterval(() => {
      const key = getCurrentApiKey();
      if (key && key !== apiKey) {
        setApiKey(key);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [apiKey]);
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
  const [musicFiles] = useState([
    'ambient-background-2-421085.mp3',
    'cheerful-joyful-playful-music-380550.mp3',
    'cinematic-ambient-348342.mp3',
    'lullaby-acoustic-guitar-438657.mp3'
  ]);

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  useEffect(() => {
    if (musicFiles.length > 0) {
      setBackgroundMusic(musicFiles[0]);
    }
  }, []);

  const testVoice = async () => {
    const currentApiKey = apiKey || (window.OPENAI_CONFIG && window.OPENAI_CONFIG.API_KEY) || OPENAI_API_KEY;
    
    if (!currentApiKey) {
      setError('OpenAI API key not found. Please ensure config.js exists in the same directory as index.html with your API key. Check the browser console for loading errors.');
      console.error('API Key Debug:', {
        apiKey: apiKey,
        windowConfig: window.OPENAI_CONFIG,
        OPENAI_API_KEY: OPENAI_API_KEY
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const voiceAgent = new VoiceAgent();
      // Just say "hello" for testing
      const audioBase64 = await voiceAgent.generate(currentApiKey, 'Hello', voice);
      const deliveryAgent = new DeliveryAgent();
      const { audioUrl } = deliveryAgent.deliver(audioBase64);
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

    const currentApiKey = apiKey || (window.OPENAI_CONFIG && window.OPENAI_CONFIG.API_KEY) || OPENAI_API_KEY;
    if (!currentApiKey) {
      setError('OpenAI API key not found. Please ensure config.js exists in the same directory as index.html with your API key.');
      console.error('API Key Debug:', {
        apiKey: apiKey,
        windowConfig: window.OPENAI_CONFIG,
        OPENAI_API_KEY: OPENAI_API_KEY
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentApiKey = apiKey || (window.OPENAI_CONFIG && window.OPENAI_CONFIG.API_KEY);
      const scriptAgent = new ScriptAgent();
      const generatedScript = await scriptAgent.generate(
        currentApiKey,
        persona,
        name,
        instructions,
        tone,
        duration
      );
      setScript(generatedScript);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const polishScript = async () => {
    if (!script) {
      setError('Please generate a script first');
      return;
    }

    const currentApiKey = apiKey || (window.OPENAI_CONFIG && window.OPENAI_CONFIG.API_KEY) || OPENAI_API_KEY;
    if (!currentApiKey) {
      setError('OpenAI API key not found. Please ensure config.js exists in the same directory as index.html with your API key.');
      console.error('API Key Debug:', {
        apiKey: apiKey,
        windowConfig: window.OPENAI_CONFIG,
        OPENAI_API_KEY: OPENAI_API_KEY
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const scriptAgent = new ScriptAgent();
      const polishedScript = await scriptAgent.generate(
        currentApiKey,
        persona,
        name,
        `Polish and refine this script: ${script}`,
        tone,
        duration
      );
      setScript(polishedScript);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!script) {
      setError('Please generate a script first');
      return;
    }

    const currentApiKey = apiKey || (window.OPENAI_CONFIG && window.OPENAI_CONFIG.API_KEY) || OPENAI_API_KEY;
    if (!currentApiKey) {
      setError('OpenAI API key not found. Please ensure config.js exists in the same directory as index.html with your API key.');
      console.error('API Key Debug:', {
        apiKey: apiKey,
        windowConfig: window.OPENAI_CONFIG,
        OPENAI_API_KEY: OPENAI_API_KEY
      });
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

      const voiceAgent = new VoiceAgent();
      const ttsAudioBase64 = await voiceAgent.generate(currentApiKey, script, voice);

      let finalAudioBase64 = ttsAudioBase64;
      let finalFormat = 'mp3';
      
      if (backgroundMusic) {
        const musicAgent = new MusicAgent();
        finalAudioBase64 = await musicAgent.mix(ttsAudioBase64, backgroundMusic, musicVolume);
        finalFormat = 'webm';
      }

      const deliveryAgent = new DeliveryAgent();
      const { audioUrl: url, audioBlob } = deliveryAgent.deliver(finalAudioBase64, finalFormat);
      setAudioUrl(url);
      window.currentAudioBlob = audioBlob;
    } catch (err) {
      setError(err.message);
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
        <button className="btn-primary lexend-body" onClick={generateScript} disabled={loading || !apiKey}>
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
            <button className="btn-secondary lexend-body" onClick={polishScript} disabled={loading || !apiKey}>
              Polish with AI
            </button>
            <button className="btn-primary lexend-body" onClick={generateAudio} disabled={loading || !apiKey}>
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

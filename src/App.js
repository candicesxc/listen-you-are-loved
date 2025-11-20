const { useState, useEffect } = React;

const API_BASE = window.location.origin;

// CrewAI Agents
class ScriptAgent {
  async generate(persona, name, instructions, tone, durationSeconds) {
    const response = await fetch(`${API_BASE}/api/generate-script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona, name, instructions, tone, durationSeconds }),
    });
    if (!response.ok) throw new Error('Failed to generate script');
    const data = await response.json();
    return data.script;
  }
}

class ProofAgent {
  validate(script, persona, tone) {
    // Basic validation - ensure script exists and isn't empty
    if (!script || script.trim().length === 0) {
      return { valid: false, error: 'Script is empty' };
    }
    
    // Check tone-specific endings
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
  async generate(script, voice) {
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, voice }),
    });
    if (!response.ok) throw new Error('Failed to generate TTS');
    const data = await response.json();
    return data.audio;
  }
}

class MusicAgent {
  async mix(ttsAudioBase64, backgroundTrackFilename, musicVolume) {
    const response = await fetch(`${API_BASE}/api/mix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttsAudioBase64, backgroundTrackFilename, musicVolume }),
    });
    if (!response.ok) throw new Error('Failed to mix audio');
    const data = await response.json();
    return data.audio;
  }
}

class DeliveryAgent {
  deliver(audioBase64, format = 'mp3') {
    const audioBlob = this.base64ToBlob(audioBase64, `audio/${format}`);
    const audioUrl = URL.createObjectURL(audioBlob);
    return { audioUrl, audioBlob };
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
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

  // Available voices
  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  // Load music files
  useEffect(() => {
    fetch(`${API_BASE}/api/music-files`)
      .then(res => res.json())
      .then(data => {
        if (data.files && data.files.length > 0) {
          setMusicFiles(data.files);
          setBackgroundMusic(data.files[0]);
        }
      })
      .catch(() => {
        // Fallback to known files
        const knownFiles = [
          'ambient-background-2-421085.mp3',
          'cheerful-joyful-playful-music-380550.mp3',
          'cinematic-ambient-348342.mp3',
          'lullaby-acoustic-guitar-438657.mp3'
        ];
        setMusicFiles(knownFiles);
        if (knownFiles.length > 0) {
          setBackgroundMusic(knownFiles[0]);
        }
      });
  }, []);

  const testVoice = async () => {
    if (!script) {
      setError('Please generate a script first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const voiceAgent = new VoiceAgent();
      const audioBase64 = await voiceAgent.generate(script.substring(0, 100), voice);
      const deliveryAgent = new DeliveryAgent();
      const { audioUrl } = deliveryAgent.deliver(audioBase64);
      setAudioUrl(audioUrl);
    } catch (err) {
      setError(err.message);
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
      const scriptAgent = new ScriptAgent();
      const generatedScript = await scriptAgent.generate(
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

    try {
      setLoading(true);
      setError(null);
      const scriptAgent = new ScriptAgent();
      const polishedScript = await scriptAgent.generate(
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

    try {
      setLoading(true);
      setError(null);

      // Validate script
      const proofAgent = new ProofAgent();
      const validation = proofAgent.validate(script, persona, tone);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate TTS
      const voiceAgent = new VoiceAgent();
      const ttsAudioBase64 = await voiceAgent.generate(script, voice);

      // Mix with background music if selected
      let finalAudioBase64 = ttsAudioBase64;
      if (backgroundMusic) {
        const musicAgent = new MusicAgent();
        finalAudioBase64 = await musicAgent.mix(ttsAudioBase64, backgroundMusic, musicVolume);
      }

      // Deliver audio
      const deliveryAgent = new DeliveryAgent();
      const { audioUrl: url, audioBlob } = deliveryAgent.deliver(finalAudioBase64);
      setAudioUrl(url);
      
      // Store blob for download
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
      const filename = `affirmation-${Date.now()}.mp3`;
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
          <button className="test-voice-btn" onClick={testVoice} disabled={!script || loading}>
            Test Voice
          </button>
          <span className="lexend-body" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            {script ? 'Test with current script' : 'Generate script first'}
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
            Download MP3
          </button>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));


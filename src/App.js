const { useState, useEffect } = React;

class ApiClient {
  static async generateScript({ persona, name, instructions, tone, durationSeconds }) {
    const response = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona, name, instructions, tone, durationSeconds }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate script');
    }
    return data;
  }

  static async generateTts(script, voice) {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, voice }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate TTS');
    }
    return data;
  }

  static async mixAudio(ttsAudioBase64, backgroundTrackFilename, musicVolume) {
    const response = await fetch('/api/mix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttsAudioBase64, backgroundTrackFilename, musicVolume }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mix audio');
    }
    return data;
  }

  static async listMusicFiles() {
    const response = await fetch('/api/music-files');
    const data = await response.json().catch(() => ({ files: [] }));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load music files');
    }
    return data.files || [];
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

    if (!persona || persona.trim().length === 0) {
      return { valid: false, error: 'Persona is required' };
    }

    return { valid: true };
  }
}

class DeliveryAgent {
  deliver(audioBase64, format = 'mp3') {
    const mimeType = format === 'webm' ? 'audio/webm' : 'audio/mpeg';
    const audioBlob = this.base64ToBlob(audioBase64, mimeType);
    const audioUrl = URL.createObjectURL(audioBlob);
    return { audioUrl, audioBlob };
  }

  base64ToBlob(base64, mimeType) {
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

  useEffect(() => {
    ApiClient.listMusicFiles()
      .then((files) => {
        setMusicFiles(files);
        if (files.length > 0) {
          setBackgroundMusic(files[0]);
        }
      })
      .catch((err) => {
        console.error(err);
        setMusicFiles([]);
      });
  }, []);

  const testVoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const { audio, format } = await ApiClient.generateTts('Hello', voice);
      const deliveryAgent = new DeliveryAgent();
      const { audioUrl: url } = deliveryAgent.deliver(audio, format);
      setAudioUrl(url);
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
      const { script: generatedScript } = await ApiClient.generateScript({
        persona,
        name,
        instructions,
        tone,
        durationSeconds: duration,
      });
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
      const { script: polishedScript } = await ApiClient.generateScript({
        persona,
        name,
        instructions: `Polish and refine this script: ${script}`,
        tone,
        durationSeconds: duration,
      });
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

      const proofAgent = new ProofAgent();
      const validation = proofAgent.validate(script, persona, tone);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const { audio: ttsAudioBase64, format: ttsFormat } = await ApiClient.generateTts(script, voice);

      let finalAudioBase64 = ttsAudioBase64;
      let finalFormat = ttsFormat || 'mp3';

      if (backgroundMusic) {
        const { audio: mixedAudio, format: mixedFormat } = await ApiClient.mixAudio(
          ttsAudioBase64,
          backgroundMusic,
          musicVolume
        );
        finalAudioBase64 = mixedAudio;
        finalFormat = mixedFormat || 'webm';
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
          placeholder="Anything special you want included"
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
            Says "Hello" to preview the voice using the secure backend
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

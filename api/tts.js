const OpenAI = require('openai');

let openai = null;

function getOpenAIClient() {
  if (openai) return openai;

  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return openai;
}

function normalizeTone(toneRaw) {
  if (!toneRaw) {
    return {
      toneLabel: "neutral warm",
      textStyleDescription:
        "Soft, warm, steady tone. Balanced, not too fast or slow.",
      ttsSettings: {
        speakingRate: 1.0,
        pitch: 0
      }
    };
  }

  const t = toneRaw.toLowerCase().trim();

  // Motivational
  if (t.includes("motivational")) {
    return {
      toneLabel: "motivational",
      textStyleDescription:
        "Energetic, uplifting, forward-looking. Short, strong sentences. Clear calls to action like 'you can do this', 'keep going'.",
      ttsSettings: {
        speakingRate: 1.1,  // slightly faster
        pitch: 2            // a bit brighter
      }
    };
  }

  // Calm
  if (t.includes("calm")) {
    return {
      toneLabel: "calm",
      textStyleDescription:
        "Slow, grounding, soothing. Longer breaths between ideas, gentle reassurance, lots of safety and validation.",
      ttsSettings: {
        speakingRate: 0.9,  // a bit slower
        pitch: -1           // slightly lower, more grounded
      }
    };
  }

  // Lullaby
  if (t.includes("lullaby")) {
    return {
      toneLabel: "lullaby",
      textStyleDescription:
        "Very soft, sleepy, repetitive and gently rhythmic. Sentences should be slower and more flowing. Lots of imagery of rest, warmth, and being held.",
      ttsSettings: {
        speakingRate: 0.8,  // clearly slower
        pitch: -2           // softer, lower feel
      }
    };
  }

  // Cheerful
  if (t.includes("cheerful")) {
    return {
      toneLabel: "cheerful",
      textStyleDescription:
        "Bright, light, positive. Slightly playful, optimistic, with more smiles in the wording. Still gentle, not manic.",
      ttsSettings: {
        speakingRate: 1.15, // a bit faster and lively
        pitch: 3            // brighter, higher
      }
    };
  }

  // Default fallback
  return {
    toneLabel: toneRaw.trim(),
    textStyleDescription:
      "Soft, warm, steady tone. Balanced speed and energy.",
    ttsSettings: {
      speakingRate: 1.0,
      pitch: 0
    }
  };
}

module.exports = async (req, res) => {
  try {
    const client = getOpenAIClient();

    if (!client) {
      return res.status(500).json({
        error: 'Server configuration error: OPENAI_API_KEY not set. Please set the OPENAI_API_KEY environment variable.'
      });
    }

    const { script, voice, tone, ttsSettings } = req.body;

    if (!script || !voice) {
      return res.status(400).json({ error: 'Missing script or voice' });
    }

    // Normalize tone to get TTS settings, or use provided ttsSettings
    let speed = 1.0;
    if (ttsSettings?.speakingRate) {
      speed = ttsSettings.speakingRate;
    } else if (tone) {
      const toneInfo = normalizeTone(tone);
      speed = toneInfo.ttsSettings.speakingRate;
    }
    
    // OpenAI TTS uses 'speed' parameter (0.25 to 4.0, default 1.0)
    // Clamp speed to OpenAI's valid range
    const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));

    // Note: OpenAI TTS doesn't support pitch directly, but speed affects perceived pitch
    // Faster speeds tend to sound brighter, slower speeds sound deeper
    const ttsParams = {
      model: 'tts-1',
      voice: voice,
      input: script,
      speed: clampedSpeed,
    };

    const mp3 = await client.audio.speech.create(ttsParams);

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString('base64');

    res.json({ audio: base64, format: 'mp3' });
  } catch (error) {
    console.error('Error generating TTS:', error);
    res.status(500).json({ error: 'Failed to generate TTS', details: error.message });
  }
};


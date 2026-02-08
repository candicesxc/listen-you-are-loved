const OpenAI = require('openai');

let openai = null;

function getOpenAIClient() {
  if (openai) return openai;
  if (!process.env.OPENAI_API_KEY) return null;
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

module.exports = async (req, res) => {
  try {
    const client = getOpenAIClient();

    if (!client) {
      return res.status(500).json({
        error: 'Server configuration error: OPENAI_API_KEY not set.',
      });
    }

    const { persona, tone, instructions } = req.body;

    const voiceDescriptions = {
      alloy: 'warm neutral adult (gender-neutral)',
      ash: 'clear adult male',
      ballad: 'smooth adult male',
      coral: 'warm adult female',
      echo: 'calm adult male',
      fable: 'gentle young female',
      onyx: 'deep adult male',
      nova: 'bright young female',
      sage: 'calm adult male',
      shimmer: 'airy teen female',
      verse: 'expressive adult male',
      marin: 'fresh young female',
      cedar: 'warm adult male',
    };

    const musicOptions = ['ambient', 'cheerful', 'cinematic', 'lullaby', 'none'];

    const prompt = `You are helping match audio settings for a personalized affirmation app.

Given these user inputs:
- Persona (who is speaking): ${persona || 'not specified'}
- Tone: ${tone || 'not specified'}
- Custom instructions: ${instructions || 'not specified'}

Available voices (pick the one that best matches the persona's likely age and gender):
${Object.entries(voiceDescriptions).map(([k, v]) => `- "${k}": ${v}`).join('\n')}

Available background music options: ${musicOptions.map(m => `"${m}"`).join(', ')}

Rules:
- Match voice to the persona's likely age and gender as closely as possible
- Pick music that complements the tone
- musicVolume should be 0-100 (default 15)
- oneLineSummary: a short warm sentence describing what this affirmation is about

Respond with ONLY valid JSON, no markdown:
{"voice": "...", "music": "...", "musicVolume": 15, "oneLineSummary": "..."}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });

    const raw = completion.choices[0].message.content.trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('AI returned invalid JSON');
      }
    }

    // Validate voice
    const allowedVoices = Object.keys(voiceDescriptions);
    if (!allowedVoices.includes(parsed.voice)) {
      parsed.voice = 'alloy';
    }

    // Validate music
    if (!musicOptions.includes(parsed.music)) {
      parsed.music = 'none';
    }

    // Validate volume
    const vol = Number(parsed.musicVolume);
    parsed.musicVolume = (Number.isFinite(vol) && vol >= 0 && vol <= 100) ? vol : 15;

    // Map music label to filename
    const musicLabelToFile = {
      ambient: 'ambient-background-2-421085.mp3',
      cheerful: 'cheerful-joyful-playful-music-380550.mp3',
      cinematic: 'cinematic-ambient-348342.mp3',
      lullaby: 'lullaby-acoustic-guitar-438657.mp3',
      none: '',
    };
    parsed.musicFile = musicLabelToFile[parsed.music] || '';

    res.json(parsed);
  } catch (error) {
    console.error('Error in AI match:', error);
    res.status(500).json({ error: 'Failed to match audio settings', details: error.message });
  }
};

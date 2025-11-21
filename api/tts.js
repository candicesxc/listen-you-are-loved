const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error: OPENAI_API_KEY not set. Please set the OPENAI_API_KEY environment variable.' 
      });
    }

    const { script, voice } = req.body;

    if (!script || !voice) {
      return res.status(400).json({ error: 'Missing script or voice' });
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: script,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64 = buffer.toString('base64');

    res.json({ audio: base64, format: 'mp3' });
  } catch (error) {
    console.error('Error generating TTS:', error);
    res.status(500).json({ error: 'Failed to generate TTS', details: error.message });
  }
};


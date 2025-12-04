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

// Base reading rate (adjusted for 20% slower reading)
const wordsPerSecond = 1.6;
// Additional multiplier to ensure scripts are long enough to match duration
const lengthBufferMultiplier = 1.2;
const toneWordRateMultipliers = {
  lullaby: 0.7,
};

const toneEndingRules = {
  lullaby: 'must end with "good night" style line',
  cheerful: 'must end with "have a good day" style line',
  calm: 'ends with gentle reassurance',
  motivational: 'ends with confident encouragement',
};

module.exports = async (req, res) => {
  try {
    const client = getOpenAIClient();

    if (!client) {
      return res.status(500).json({
        error: 'Server configuration error: OPENAI_API_KEY not set. Please set the OPENAI_API_KEY environment variable.'
      });
    }

    const { persona, name, instructions, tone, durationSeconds, language = 'en' } = req.body;

    if (!persona || !tone || !durationSeconds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rateMultiplier = toneWordRateMultipliers[tone] || 1;
    // Calculate target words accounting for slower reading (1.6 wps) and buffer for accuracy
    const targetWords = Math.round(durationSeconds * wordsPerSecond * lengthBufferMultiplier * rateMultiplier);
    const toneEndingRule = toneEndingRules[tone] || 'ends with gentle reassurance';
    const languageInstruction =
      language === 'zh'
        ? '请用中文撰写完整的脚本，语言温暖、鼓励、治愈。'
        : language === 'ko'
          ? '전체 스크립트를 따뜻하고 위로가 되는 한국어로 작성하세요.'
          : 'Write the full script in English with warmth and support.';
    const toneEndingLanguageHint =
      language === 'zh'
        ? '用中文自然地表达结尾要求：'
        : language === 'ko'
          ? '아래 끝맺음 요구를 한국어로 자연스럽게 표현하세요:'
          : 'End naturally while following this requirement:';

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

    const userPrompt = `${languageInstruction}

Write a continuous second-person affirmation script.

Persona: ${persona}
Instructions: ${instructions || 'None'}
Tone: ${tone}
Duration: ${durationSeconds} seconds
Target word count: ${targetWords}
Optional name: ${name || 'None'}

Begin most lines with "You".
Use the name only where it feels gentle and meaningful.
${toneEndingLanguageHint}
${toneEndingRule}

One paragraph. No bullets or breaks.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: Math.min(targetWords * 2, 1000),
    });

    const script = completion.choices[0].message.content.trim();

    res.json({ script, targetWords, actualWords: script.split(/\s+/).length });
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({ error: 'Failed to generate script', details: error.message });
  }
};


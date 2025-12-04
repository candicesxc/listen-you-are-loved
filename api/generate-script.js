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
const lengthBufferMultiplier = 1.56;
const toneWordRateMultipliers = {
  lullaby: 0.7,
};

const toneEndingRules = {
  lullaby: 'must end with "good night" style line',
  cheerful: 'must end with "have a good day" style line',
  calm: 'ends with gentle reassurance',
  motivational: 'ends with confident encouragement',
};

function normalizePersona(personaRaw) {
  if (!personaRaw || personaRaw.trim().length === 0) {
    return {
      roleLabel: "someone who deeply cares about the listener",
      styleDescription: "Warm, gentle, loving, supportive.",
      shouldUseRoleName: false
    };
  }

  const t = personaRaw.toLowerCase().trim();

  // Romantic relationships
  if (t.includes("boyfriend") || t.includes("girlfriend") || t.includes("partner") || t.includes("husband") || t.includes("wife")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Speak with intimacy, tenderness, warmth, and emotional closeness. Reassure the listener as someone deeply in love with them. Use gentle everyday language.",
      shouldUseRoleName: false
    };
  }

  // Close friends
  if (t.includes("best friend") || t.includes("close friend") || t.includes("friend")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Speak casually and honestly, with familiarity. Supportive, playful when appropriate, comforting like someone who truly knows their life.",
      shouldUseRoleName: false
    };
  }

  // Parents
  if (t.includes("mum") || t.includes("mom") || t.includes("mother")) {
    return {
      roleLabel: "mum",
      styleDescription:
        "Speak in a nurturing, protective, deeply loving tone. Reassure them like a parent who has known them their whole life. Use warm, safe language.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("dad") || t.includes("father")) {
    return {
      roleLabel: "dad",
      styleDescription:
        "Speak with steady, grounded warmth. Encouraging but calm. Express pride, belief, and dependable support.",
      shouldUseRoleName: true
    };
  }

  // Grandparents
  if (t.includes("grandma") || t.includes("grandmother")) {
    return {
      roleLabel: "grandma",
      styleDescription:
        "Soft, gentle, wise, unconditional love. Slightly nostalgic tone. Reassurance that Grandma is always happy when they come home.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("grandpa") || t.includes("grandfather")) {
    return {
      roleLabel: "grandpa",
      styleDescription:
        "Warm, gentle, steady wisdom. Use simple language, heartfelt reassurance, hints of life experience. Mention Grandpa naturally if appropriate.",
      shouldUseRoleName: true
    };
  }

  // Siblings
  if (t.includes("brother")) {
    return {
      roleLabel: "brother",
      styleDescription:
        "Speak like a sibling: casual, protective, honest. Can be slightly teasing in a loving way but mainly supportive and proud.",
      shouldUseRoleName: false
    };
  }

  if (t.includes("sister")) {
    return {
      roleLabel: "sister",
      styleDescription:
        "Warm, protective, emotionally intuitive like an older or younger sister. Comforting and affirming.",
      shouldUseRoleName: false
    };
  }

  // Children
  if (t.includes("child") || t.includes("son") || t.includes("daughter") || t.includes("kid")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Speak with naive innocence, sweetness, simplicity, and love. Tone should feel young, gentle, and full of pure affection.",
      shouldUseRoleName: true
    };
  }

  // Mentors, teachers, guides
  if (t.includes("mentor") || t.includes("coach") || t.includes("teacher") || t.includes("guide")) {
    return {
      roleLabel: "mentor",
      styleDescription:
        "Confident, uplifting, insightful. Use calm, structured reassurance. Affirm their growth, potential, and resilience.",
      shouldUseRoleName: true
    };
  }

  // Professional roles
  if (t.includes("boss") || t.includes("manager") || t.includes("supervisor")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Professional but warm. Encouraging and appreciative. Avoid overly intimate tone. Focus on capability, effort, and trust.",
      shouldUseRoleName: false
    };
  }

  if (t.includes("coworker") || t.includes("colleague") || t.includes("teammate")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Speak like a friendly peer. Supportive, understanding of work stress, grounded and relatable.",
      shouldUseRoleName: false
    };
  }

  // Peers / classmates
  if (t.includes("classmate") || t.includes("schoolmate") || t.includes("peer")) {
    return {
      roleLabel: "classmate",
      styleDescription:
        "Casual, relatable, supportive. Speak like someone in the same environment dealing with the same pressures.",
      shouldUseRoleName: false
    };
  }

  // Spiritual personas
  if (t.includes("god")) {
    return {
      roleLabel: "God",
      styleDescription:
        "Speak with serene authority, unconditional love, and calm reassurance. Tone should be peaceful and divine, without preaching or fear.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("angel")) {
    return {
      roleLabel: "your guardian angel",
      styleDescription:
        "Soft, ethereal, protective voice. Reassuring, peaceful, and full of light. Speak like a spiritual presence offering comfort.",
      shouldUseRoleName: true
    };
  }

  // Pets
  if (t.includes("dog")) {
    return {
      roleLabel: "their dog",
      styleDescription:
        "Innocent, loyal, loving, excited. Speak in simple, pure emotional language. Express unconditional love.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("cat")) {
    return {
      roleLabel: "their cat",
      styleDescription:
        "Warm but slightly reserved, affectionate in a subtle way. Gentle humor is acceptable.",
      shouldUseRoleName: true
    };
  }

  // Default fallback
  return {
    roleLabel: personaRaw.trim(),
    styleDescription:
      "Speak fully in this role. Use tone, vocabulary, and emotional style that match this persona. The script must feel distinctly spoken by this person, not generic.",
    shouldUseRoleName: false
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

    const { persona, name, instructions, tone, durationSeconds, language = 'en' } = req.body;

    if (!tone || !durationSeconds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize persona to get role-specific guidance (handles empty/whitespace gracefully)
    const personaInfo = normalizePersona(persona || '');

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

    // Build role name instruction
    const roleNameInstruction = personaInfo.shouldUseRoleName
      ? `- If the persona normally refers to themselves by role (e.g. "Grandma", "Mum", "God", "Your mentor"), then naturally include that role name once or twice in the script if it feels organic. Examples: "Grandma loves you and is waiting for you." "Your mentor sees your potential." "God is with you even in your quietest fears."`
      : '';

    const systemPrompt = `You are generating a short, emotionally supportive audio script.

SPEAKER IDENTITY:
${personaInfo.roleLabel}

SPEAKER VOICE & STYLE:
${personaInfo.styleDescription}

WHO THEY ARE SPEAKING TO:
The listener is someone they care about deeply and who needs emotional comfort right now.

INSTRUCTIONS:
- Write the script as if it is spoken directly by the person described in SPEAKER IDENTITY.
- Use first person "I" for the speaker and "you" for the listener.
- The tone, vocabulary, and emotional rhythm MUST be clearly different depending on the persona.
  • A boyfriend should sound intimate and youthful.  
  • A grandma should sound gentle, wise, slow, and comforting.  
  • A mentor should sound calm, structured, and encouraging.  
  • God should sound serene and unconditional.  
  • A child should sound sweet, simple, innocent.  
  • A classmate should sound casual and relatable.  
  • A parent should sound protective and unconditional.  
  • A pet dog should sound excited, pure, and loving.  
  • A coworker should sound warm but professional.  
  These voices MUST NOT sound similar to each other.
- Avoid generic, universal language. The message must feel specific to this relationship.
${roleNameInstruction}
- Keep tone warm, validating, and emotionally safe.
- Follow tone rules and end with the required tone-specific closing.
- Use warm, simple, supportive language.
- No negativity, contrast words, metaphors, or trauma.
- Write one continuous flowing paragraph.
- Plain text only.
- If a name is provided, use it as a nickname naturally.`;

    const userPrompt = `${languageInstruction}

Write a continuous script spoken by the persona.

SPEAKER IDENTITY: ${personaInfo.roleLabel}
SPEAKER STYLE: ${personaInfo.styleDescription}
${personaInfo.shouldUseRoleName ? 'Include the role name naturally in the script at least once.' : ''}

Context from user: ${instructions || 'None'}
Tone: ${tone}
Duration: ${durationSeconds} seconds
Target word count: ${targetWords}
Optional name: ${name || 'None'}

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


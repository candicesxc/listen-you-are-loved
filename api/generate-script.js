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
        "Intimate, tender, emotionally close. Everyday language, affectionate and reassuring. You speak like someone deeply in love with the listener.",
      shouldUseRoleName: false
    };
  }

  // Close friends
  if (t.includes("best friend") || t.includes("close friend") || t.includes("friend")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Casual, honest, playful when appropriate, but ultimately very comforting. You speak like a close friend they can text at 2am.",
      shouldUseRoleName: false
    };
  }

  // Parents
  if (t.includes("mum") || t.includes("mom") || t.includes("mother")) {
    return {
      roleLabel: "Mum",
      styleDescription:
        "Nurturing, protective, deeply loving. You speak like a parent who has known them their whole life. Very safe and reassuring.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("dad") || t.includes("father")) {
    return {
      roleLabel: "Dad",
      styleDescription:
        "Steady, grounded, encouraging. You speak with warmth and pride, reassuring them they do not need to be perfect to be loved.",
      shouldUseRoleName: true
    };
  }

  // Grandparents
  if (t.includes("grandma") || t.includes("grandmother")) {
    return {
      roleLabel: "Grandma",
      styleDescription:
        "Soft, gentle, wise, full of unconditional love. Slightly nostalgic tone. You might mention that Grandma loves them and is happy when they come home.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("grandpa") || t.includes("grandfather")) {
    return {
      roleLabel: "Grandpa",
      styleDescription:
        "Warm, wise, and steady. Simple language with long-term perspective. You make them feel safe and cherished.",
      shouldUseRoleName: true
    };
  }

  // Siblings
  if (t.includes("brother")) {
    return {
      roleLabel: "brother",
      styleDescription:
        "Casual, protective, honest. Maybe a tiny bit teasing but kind. You speak like someone who grew up with them and always has their back.",
      shouldUseRoleName: false
    };
  }

  if (t.includes("sister")) {
    return {
      roleLabel: "sister",
      styleDescription:
        "Warm, emotionally intuitive, protective. You speak like a sister who understands their feelings and wants to comfort them.",
      shouldUseRoleName: false
    };
  }

  // Children
  if (t.includes("child") || t.includes("son") || t.includes("daughter") || t.includes("kid")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Innocent, simple, pure affection. You speak like a child who loves this person very much, using simple words and feelings.",
      shouldUseRoleName: true
    };
  }

  // Mentors, teachers, guides
  if (t.includes("mentor") || t.includes("coach") || t.includes("teacher") || t.includes("guide")) {
    return {
      roleLabel: "mentor",
      styleDescription:
        "Calm, structured, encouraging. You speak with clarity and belief in their potential, like someone who has watched their growth.",
      shouldUseRoleName: true
    };
  }

  // Professional roles
  if (t.includes("boss") || t.includes("manager") || t.includes("supervisor")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Professional but warm. You focus on their competence, effort, and growth, reassuring them that they are valued and trusted.",
      shouldUseRoleName: false
    };
  }

  if (t.includes("coworker") || t.includes("co-worker") || t.includes("colleague") || t.includes("teammate")) {
    return {
      roleLabel: personaRaw.trim(),
      styleDescription:
        "Friendly peer tone. You recognize work stress and reassure them as someone on the same team or at the same level.",
      shouldUseRoleName: false
    };
  }

  // Peers / classmates
  if (t.includes("classmate") || t.includes("schoolmate") || t.includes("peer")) {
    return {
      roleLabel: "classmate",
      styleDescription:
        "Casual, same-stage-in-life vibe. You understand school pressure and social dynamics and speak as someone going through similar things.",
      shouldUseRoleName: false
    };
  }

  // Spiritual personas
  if (t.includes("god")) {
    return {
      roleLabel: "God",
      styleDescription:
        "Serene, calm, unconditional love. You speak with a sense of presence and reassurance, without fear or harshness.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("angel")) {
    return {
      roleLabel: "your guardian angel",
      styleDescription:
        "Soft, protective, light-filled voice. You speak like a spiritual presence gently watching over them.",
      shouldUseRoleName: true
    };
  }

  // Pets
  if (t.includes("dog")) {
    return {
      roleLabel: "your dog",
      styleDescription:
        "Simple, enthusiastic, pure love. You speak with excited affection, focusing on how happy you are just to be with them.",
      shouldUseRoleName: true
    };
  }

  if (t.includes("cat")) {
    return {
      roleLabel: "your cat",
      styleDescription:
        "Warm but slightly reserved affection, with gentle humor. You show love in a quieter, softer way.",
      shouldUseRoleName: true
    };
  }

  // Default fallback
  return {
    roleLabel: personaRaw.trim(),
    styleDescription:
      "Speak fully in this role. Use tone, vocabulary, and emotional style that clearly match this persona. It must not sound like a generic voice.",
    shouldUseRoleName: false
  };
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

    const { persona, name, instructions, tone, durationSeconds, language = 'en' } = req.body;

    if (!tone || !durationSeconds) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize persona to get role-specific guidance (handles empty/whitespace gracefully)
    const personaInfo = normalizePersona(persona || '');
    
    // Normalize tone to get text style and TTS settings
    const toneInfo = normalizeTone(tone || '');

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

SPEAKER IDENTITY (RELATIONSHIP):
${personaInfo.roleLabel}

HOW THE SPEAKER SOUNDS AS THIS PERSON:
${personaInfo.styleDescription}

EMOTIONAL TONE:
${toneInfo.toneLabel} — ${toneInfo.textStyleDescription}

WHO THEY ARE SPEAKING TO:
The listener is someone they care about deeply and who needs emotional comfort right now.

USER CONTEXT (if provided by the app):
${instructions || 'None'}

LANGUAGE:
${language}

INSTRUCTIONS:
- Write the script as if it is spoken directly BY the person described in SPEAKER IDENTITY to the listener.
- Use first person "I" for the speaker and "you" for the listener.
- Combine RELATIONSHIP and TONE:
  • For example, a "Grandma" speaking in a "lullaby" tone should feel extremely soft, slow, and sleepy-comforting.  
  • A "boyfriend" in a "cheerful" tone should feel bright, playful, and affectionate.  
  • A "mentor" in a "motivational" tone should feel structured, confident, and forward-looking.  
  • A "mum" in a "calm" tone should feel grounding, protective, and steady.
- Make PERSONA voices clearly distinct from each other (boyfriend vs grandma vs mentor vs god vs classmate, etc.).
- Make TONE styles clearly distinct:
  • Motivational: more dynamic, forward momentum, "you can do this", strong positive push.  
  • Calm: grounded, slower, gentle reassurance, safety.  
  • Lullaby: slow, sleepy, repetitive, very soft.  
  • Cheerful: light, bright, upbeat, optimistic.
- Avoid generic, one-size-fits-all language. The message must feel specific to THIS relationship AND THIS tone.
${roleNameInstruction}
- Keep the tone emotionally safe, validating, and non-judgmental.
- Keep the length within the same range currently used by the app.
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

EMOTIONAL TONE: ${toneInfo.toneLabel} — ${toneInfo.textStyleDescription}

Context from user: ${instructions || 'None'}
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

    res.json({ 
      script, 
      targetWords, 
      actualWords: script.split(/\s+/).length,
      toneInfo: {
        toneLabel: toneInfo.toneLabel,
        ttsSettings: toneInfo.ttsSettings
      }
    });
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({ error: 'Failed to generate script', details: error.message });
  }
};


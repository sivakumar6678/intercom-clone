const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

/**
 * Generates a Gemini AI response based on conversation and user question.
 * @param {string} question - The user's prompt.
 * @param {array} contextMessages - Array of previous chat messages.
 * @returns {Promise<string>} - Gemini's reply.
 */
export async function getGeminiReply(question, contextMessages) {
  try {
    const contextText = contextMessages
      .map((m) => `${m.from}: ${m.text}`)
      .join('\n');

    const body = {
      contents: [
        {
          parts: [
            {
              text: `You are a support assistant. Context:\n${contextText}\n\nQuestion: ${question}`,
            },
          ],
        },
      ],
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No response from Gemini.';
  } catch (err) {
    console.error('Gemini API error:', err);
    return '❌ Error contacting Gemini API.';
  }
}

/**
 * Generates a draft message suggestion based on conversation context.
 * @param {array} contextMessages - Array of previous chat messages.
 * @returns {Promise<string>} - Gemini's suggested draft.
 */
export async function generateDraftSuggestion(contextMessages) {
  try {
    const contextText = contextMessages
      .map((m) => `${m.from}: ${m.text}`)
      .join('\n');

    const body = {
      contents: [
        {
          parts: [
            {
              text: `You are a support assistant. Based on this conversation, draft a helpful response to the customer:\n${contextText}\n\nDraft a response:`,
            },
          ],
        },
      ],
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No response from Gemini.';
  } catch (err) {
    console.error('Gemini API error:', err);
    return '❌ Error generating draft suggestion.';
  }
}

/**
 * Refines a draft message based on the selected tone.
 * @param {string} draft - The original draft message.
 * @param {string} tone - The desired tone (polish, elaborate, summarize, friendly, professional).
 * @param {array} contextMessages - Array of previous chat messages for context.
 * @returns {Promise<string>} - Gemini's refined message.
 */
export async function refineDraftWithTone(draft, tone, contextMessages) {
  try {
    const contextText = contextMessages
      .map((m) => `${m.from}: ${m.text}`)
      .join('\n');
    
    let instruction = '';
    switch (tone) {
      case 'rephrase':
        instruction = 'Rephrase this text while keeping the same meaning and tone:';
        break;
      case 'mytone':
        instruction = 'Rewrite this text to match my usual tone of voice based on previous messages:';
        break;
      case 'friendly':
        instruction = 'Make this text more friendly and conversational:';
        break;
      case 'formal':
        instruction = 'Make this text more formal and professional:';
        break;
      case 'grammar':
        instruction = 'Fix any grammar and spelling errors in this text:';
        break;
      case 'translate':
        instruction = 'Translate this text to the appropriate language based on context:';
        break;
      default:
        instruction = 'Improve this text:';
    }

    const body = {
      contents: [
        {
          parts: [
            {
              text: `You are a support assistant. Conversation context:\n${contextText}\n\n${instruction}\n\n"${draft}"\n\nRefined response:`,
            },
          ],
        },
      ],
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No response from Gemini.';
  } catch (err) {
    console.error('Gemini API error:', err);
    return '❌ Error refining draft message.';
  }
}

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

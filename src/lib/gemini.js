import { GEMINI_API_KEY, GEMINI_MODEL } from '../config';

// Browser-side keys are demo-only. Production should call Gemini from /api/chat.
export async function sendGeminiMessage({ message, history = [], systemPrompt }) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_NOT_CONFIGURED');
  const contents = [...history.slice(-12), { role: 'user', text: message }]
    .filter((item) => item?.text)
    .map((item) => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(item.text) }] }));
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents }),
    });
    if (!response.ok) throw new Error('GEMINI_REQUEST_FAILED');
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!reply) throw new Error('GEMINI_EMPTY_RESPONSE');
    return reply;
  } catch (error) {
    if (['GEMINI_REQUEST_FAILED', 'GEMINI_EMPTY_RESPONSE'].includes(error.message)) throw error;
    throw new Error('GEMINI_REQUEST_FAILED');
  }
}

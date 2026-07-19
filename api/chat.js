// MathCraft AI Tutor — Backend API Route
// -----------------------------------------
// Deploy this file as /api/chat.js in your Vercel project (Vercel auto-detects
// files in /api as serverless functions — no extra config needed).
//
// SETUP:
// 1. Get an API key from your AI provider (e.g. Anthropic: https://console.anthropic.com)
// 2. In Vercel: Project Settings -> Environment Variables -> add:
//      Name:  ANTHROPIC_API_KEY
//      Value: <your key>
// 3. Redeploy. Never put the API key in frontend code — this backend route
//    keeps it private, which is why the widget calls /api/chat instead of
//    calling the AI provider directly from the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Keep only the last 10 turns to control cost/latency
  const trimmed = messages.slice(-10);

  const systemPrompt = `You are the MathCraft Tutor, a friendly and patient AI math tutor
embedded in an educational website (MathCraft) covering Arithmetic, Algebra, Geometry,
and Trigonometry.

Rules:
- Explain concepts step by step, using simple language a student can follow.
- When a student shares a problem or an attempted solution, walk through the reasoning
  and point out exactly where any mistake happened, rather than just giving the final answer.
- Use short paragraphs or numbered steps. Avoid long unbroken blocks of text.
- If a question is unrelated to math, gently redirect the student back to math topics.
- Keep answers focused and under ~150 words unless a full worked solution genuinely needs more.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: trimmed
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI provider error:', errText);
      return res.status(502).json({ error: 'AI provider request failed' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Sorry, I couldn't come up with an answer for that.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

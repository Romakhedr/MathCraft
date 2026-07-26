// api/chat.js
// MathCraft — AI Math Tutor Endpoint (Vercel Serverless Function)
// Integrates Google Gemini (gemini-1.5-flash) to answer, explain, and verify math questions.

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_INSTRUCTION = `You are "MathCraft Tutor", a friendly, patient, and precise AI math assistant.
Rules:
- Explain concepts step by step, using clear, simple language.
- When solving a problem, show the full working, not just the final answer.
- If the student's input is unclear or not a math question, politely ask for clarification.
- Keep answers focused on Arithmetic, Algebra, Geometry, and related school-level math topics.
- Use LaTeX-style notation sparingly and only when it improves clarity (e.g. x^2, sqrt(x)).
- Be encouraging and never condescending.`;

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };

  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);

  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(clientIp)) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please wait a moment and try again." });
  }

  try {
    const body = req.body || {};
    let message = body.message;
    const history = body.history || [];

    // دعم استلام الرسائل سواء جاءت بصيغة message أو messages (لضمان توافق الواجهة)
    if (!message && Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMsg = body.messages[body.messages.length - 1];
      message = lastMsg?.content || lastMsg?.text || lastMsg?.message || "";
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Field 'message' or 'messages' is required and must be valid." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      return res.status(500).json({ error: "Server misconfiguration. Please contact the administrator." });
    }

    const contents = [];

    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn?.role && turn?.text) {
          contents.push({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: String(turn.text) }],
          });
        }
      }
    }

    contents.push({ role: "user", parts: [{ text: message.trim() }] });

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorBody);
      return res.status(502).json({ error: "Failed to get a response from the AI model." });
    }

    const data = await geminiResponse.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
      "I couldn't generate a response. Please rephrase your question.";

    // إرجاع الرد بجميع المفاتيح المحتملة لتتوافق تماماً مع الواجهة الأمامية
    return res.status(200).json({ 
      reply, 
      text: reply, 
      message: reply, 
      answer: reply 
    });
  } catch (error) {
    console.error("Unexpected error in /api/chat:", error);
    return res.status(500).json({ error: "Internal server error. Please try again later." });
  }
}

// api/chat.js — MathCraft Final Fixed Endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "خطأ: مفتاح GEMINI_API_KEY غير مضاف في إعدادات Vercel." });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const messages = body.messages || body.prompt || [];
    let lastMessage = body.message || "مرحباً";
    if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1];
      lastMessage = last?.content || last?.text || last?.message || "مرحباً";
    }

    // استخدام gemini-1.5-flash-latest لضمان توافقه التام مع المفتاح
    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: lastMessage }] }]
      })
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      const errorMsg = data.error?.message || `Google API Error (${apiRes.status})`;
      return res.status(200).json({ reply: `رد جوجل: ${errorMsg}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "أهلاً بك، كيف يمكنني مساعدتك في الرياضيات اليوم؟";

    return res.status(200).json({ 
      reply: replyText,
      text: replyText,
      message: replyText,
      answer: replyText
    });
  } catch (error) {
    return res.status(200).json({ reply: `خطأ في الخادم: ${error.message}` });
  }
}

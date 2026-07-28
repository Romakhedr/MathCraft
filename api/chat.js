// api/chat.js — Ultimate Self-Healing Endpoint
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

    // محاولة الاتصال بالنماذج بالترتيب الأضمن لتفادي أي قيود على المفتاح
    const modelsToTry = [
      { name: "gemini-1.5-flash", version: "v1beta" },
      { name: "gemini-pro", version: "v1" },
      { name: "gemini-1.5-pro", version: "v1" }
    ];

    let data = null;
    let success = false;

    for (const m of modelsToTry) {
      try {
        const apiRes = await fetch(`https://generativelanguage.googleapis.com/${m.version}/models/${m.name}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: lastMessage }]
              }
            ]
          })
        });
        const resJson = await apiRes.json();
        if (apiRes.ok && resJson.candidates) {
          data = resJson;
          success = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!success || !data) {
      return res.status(200).json({ reply: "عذراً، يرجى التحقق من صحة مفتاح GEMINI_API_KEY المضاف في إعدادات Vercel." });
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

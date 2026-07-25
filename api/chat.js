module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const messages = body.messages || body.prompt || [];
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    let lastMessage = "مرحباً";
    if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1];
      lastMessage = last?.content || last?.text || last?.message || "مرحباً";
    } else if (typeof body.message === 'string') {
      lastMessage = body.message;
    }

    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: lastMessage }] }]
      })
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error("Gemini API Error:", data);
      return res.status(500).json({ error: data.error?.message || 'API error' });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "أهلاً بك، كيف يمكنني مساعدتك في الرياضيات اليوم؟";

    // إرسال جميع المفاتيح المحتملة للرد لضمان التوافق التام مع الواجهة
    return res.status(200).json({ 
      text: replyText, 
      response: replyText, 
      message: replyText,
      answer: replyText,
      reply: replyText,
      content: replyText
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch AI response" });
  }
};

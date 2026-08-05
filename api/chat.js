// ==============================================================================
// 🎯 MathCraft AI Engine - Updated Stable Model Integration
// ==============================================================================

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return res.status(200).json({ 
        success: true, 
        reply: "⚠️ تنبيه: متغير GEMINI_API_KEY غير موجود في إعدادات Vercel." 
      });
    }

    const prompt = `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step in Arabic or English based on the question language:\n\n${message.trim()}`;
    
    // تم تحديث اسم النموذج إلى الإصدار القياسي المدعوم تماماً
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const googleError = data.error?.message || JSON.stringify(data);
      return res.status(200).json({ 
        success: true, 
        reply: `❌ خطأ من جوجل: ${googleError}` 
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من استخراج الإجابة.";

    return res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    return res.status(200).json({ 
      success: true, 
      reply: `❌ حدث استثناء في الخادم: ${error.message}` 
    });
  }
}

// ==============================================================================
// 🔍 MathCraft - Direct Diagnostic UI Script
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
        reply: "⚠️ تنبيه من الخادم: متغير GEMINI_API_KEY غير موجود أو لم يتم حفظه بشكل صحيح في Vercel Environment Variables." 
      });
    }

    const prompt = `You are MathCraft Assistant, an expert AI math tutor. Answer clearly step-by-step:\n\n${message.trim()}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // إذا رفضت جوجل الطلب، سنطبع رسالة الخطأ الحرفية التي أرسلتها جوجل داخل فقاعة الدردشة
    if (!response.ok) {
      const googleError = data.error?.message || JSON.stringify(data);
      return res.status(200).json({ 
        success: true, 
        reply: `❌ رفضت جوجل الطلب بالرسالة التالية:\n${googleError}` 
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

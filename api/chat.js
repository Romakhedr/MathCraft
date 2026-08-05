// ==============================================================================
// 🎯 MathCraft AI Engine - Direct Clean Integration
// ==============================================================================

export default async function handler(req, res) {
  // --- ضبط سياسات CORS ---
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Valid math question message is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel environment variables' });
    }

    const prompt = `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step in Arabic or English based on the question language:\n\n${message.trim()}`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    // --- إرسال الطلب مباشرة بدون أي مكتبات خارجية ---
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Full Error:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'AI provider error', details: data });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من استخراج الإجابة.";

    return res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    console.error("API Error Details:", error);
    return res.status(500).json({
      error: 'Internal server error during AI processing',
      message: error.message
    });
  }
}

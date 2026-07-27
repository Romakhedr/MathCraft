// api/chat.js — Dynamic Model Discovery & Production Endpoint
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

    // 1. استدعاء قائمة النماذج المتاحة فعلياً لهذا المفتاح تلقائياً
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const modelsData = await modelsRes.json();

    if (!modelsRes.ok) {
      return res.status(200).json({ reply: `خطأ في التحقق من النماذج: ${modelsData.error?.message || modelsRes.status}` });
    }

    const models = modelsData.models || [];
    // البحث عن أول نموذج يدعم توليد المحتوى generateContent
    const validModel = models.find(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes('generateContent')
    );

    if (!validModel) {
      return res.status(200).json({ reply: "لم يتم العثور على أي نموذج يدعم التوليد بهذا المفتاح." });
    }

    // استخراج اسم النموذج الصحيح تلقائياً
    const modelName = validModel.name.replace('models/', '');

    // 2. إرسال طلب الدردشة باستخدام النموذج المكتشف بدقة
    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {
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

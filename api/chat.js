// ==============================================================================
// 🎯 MathCraft AI Engine - AI Builders Challenge (IBM Bob + Gemini Fallback)
// ==============================================================================

import { kv } from '@vercel/kv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- 1. نظام حماية معدل الطلبات عبر Vercel KV ---
const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 10;

async function isRateLimited(clientIp) {
  if (!clientIp || clientIp === 'unknown_ip') return false;
  const key = `ratelimit:${clientIp}`;

  try {
    const currentRequests = await kv.incr(key);
    if (currentRequests === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    return currentRequests > MAX_REQUESTS_PER_WINDOW;
  } catch (error) {
    console.warn('⚠️ Vercel KV Rate Limit Warning:', error.message);
    return false; 
  }
}

export default async function handler(req, res) {
  // --- 2. ضبط سياسات CORS ---
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  // --- 3. فحص معدل الطلبات ---
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown_ip';
  const isLimited = await isRateLimited(clientIp);

  if (isLimited) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'تجاوزت الحد المسموح من الطلبات! يرجى الانتظار لمدة دقيقة.'
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Valid math question message is required' });
    }

    let replyText = "";
    let aiProvider = "None";
    let ibmSuccess = false;

    // --- 4. المحاولة الأولى: الاتصال بخادم IBM Bob (حسب شروط المسابقة) ---
    const ibmApiKey = process.env.IBM_BOB_APIKEY;
    const ibmProjectId = process.env.IBM_BOB_PROJECT_ID;
    
    if (ibmApiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const ibmRes = await fetch('https://bob.ibm.com/ml/v1/text/generation?version=2023-05-29', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ibmApiKey}`,
          },
          body: JSON.stringify({
            model_id: 'ibm/granite-3-8b-instruct',
            input: `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step:\n\n${message.trim()}`,
            project_id: ibmProjectId || undefined,
            parameters: { max_new_tokens: 600, temperature: 0.7 }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (ibmRes.ok) {
          const ibmData = await ibmRes.json();
          replyText = ibmData.results?.[0]?.generated_text || ibmData.generated_text;
          ibmSuccess = true;
          aiProvider = "IBM Granite";
        } else {
          console.warn("⚠️ IBM Bob Failed (Likely out of 40 coins). Switching routing to Gemini...");
        }
      } catch (ibmError) {
        console.warn("⚠️ IBM Bob Error/Timeout. Switching routing to Gemini...");
      }
    }

    // --- 5. المحاولة الثانية (المنقذ): توجيه المسار إلى Google Gemini مجاناً ---
    if (!ibmSuccess) {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        return res.status(500).json({ 
          error: 'AI Services Exhausted', 
          message: 'انتهى رصيد IBM ولم يتم العثور على مفتاح Gemini البديل.' 
        });
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step:\n\n${message.trim()}`;
      const result = await model.generateContent(prompt);
      
      replyText = result.response.text();
      aiProvider = "Google Gemini";
    }

    // --- 6. إرسال الإجابة النهائية للواجهة ---
    return res.status(200).json({
      success: true,
      provider: aiProvider, // لمعرفة أي ذكاء اصطناعي قام بالرد
      reply: replyText.trim()
    });

  } catch (error) {
    console.error("API Error Details:", error);
    return res.status(500).json({
      error: 'Internal server error during AI processing',
      message: error.message
    });
  }
}

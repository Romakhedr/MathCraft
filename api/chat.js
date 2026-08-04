// ==============================================================================
// 🎯 MathCraft AI Engine API Handler - Production Ready (IBM watsonx + Vercel KV)
// ==============================================================================

import { kv } from '@vercel/kv';

// --- 1. خوارزمية تحديد معدل الطلبات عبر @vercel/kv (Distributed Rate Limiter) ---
const RATE_LIMIT_WINDOW_SECONDS = 60; // نافذة دقيقة واحدة (60 ثانية)
const MAX_REQUESTS_PER_WINDOW = 10;     // 10 طلبات كحد أقصى في الدقيقة لكل IP

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
    // استراتيجية Fail-Open: في حال وجود مشكلة في الاتصال بـ KV،
    // تستمر الخدمة في العمل لتجنب إيقاف التطبيق على المستخدمين.
    console.warn('⚠️ Vercel KV Rate Limit Warning:', error.message);
    return false;
  }
}

export default async function handler(req, res) {
  // --- 2. المعالجة الآمنة والمصححة للطلبات (CORS Handling) ---
  const origin = req.headers.origin || '*';

  // تصحيح مشكلة CORS: عند تفعيل Credentials لا يصح استخدام '*' ثابتة من قبل المتصفحات
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // التعامل مع طلبات Preflight تمهيداً للاتصال
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // حصر طرق الطلب على POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  // --- 3. فحص IP وتقييد معدل الاستخدام (Rate Limiting) ---
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown_ip';
  const isLimited = await isRateLimited(clientIp);

  if (isLimited) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'تجاوزت الحد المسموح من الطلبات! يرجى الانتظار لمدة دقيقة ثم المحاولة مجدداً.'
    });
  }

  try {
    // --- 4. التحقق والفلترة المتقدمة للمدخلات (Sanitization & Validation) ---
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Valid math question message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message exceeds maximum allowed length (2000 characters).' });
    }

    // --- 5. قراءة البيانات الحساسة مع دعم مرن للمسميات (Fallback Logic) ---
    const apiKey = process.env.IBM_BOB_APIKEY || process.env.WATSONX_API_KEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID || process.env.WATSONX_PROJECT_ID;
    let serviceUrl = process.env.WATSONX_URL || 'https://us-east.ml.cloud.ibm.com';

    if (!apiKey) {
      console.error("❌ Critical: Missing IBM API Key environment variable.");
      return res.status(500).json({ error: 'Missing IBM_BOB_APIKEY environment variable' });
    }

    // معالجة رابط الـ API لضمان صياغة الرابط بشكل صحيح
    serviceUrl = serviceUrl.replace(/\/$/, '');
    const targetUrl = serviceUrl.includes('/v1/text/generation')
      ? serviceUrl
      : `${serviceUrl}/ml/v1/text/generation?version=2023-05-29`;

    // --- 6. ضبط مهلة الاتصال بالخادم (Timeout Handling) ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 ثانية كحد أقصى

    // --- 7. الاتصال الآمن بنموذج الذكاء الاصطناعي (Serverless Backend) ---
    const aiRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: `You are MathCraft Assistant, an expert AI math tutor. Answer the following student question step by step clearly and accurately: ${message.trim()}`,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
        },
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId); // إلغاء الـ Timeout فور النجاح

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      console.error("❌ AI Processing Error:", aiData);
      return res.status(500).json({ error: 'AI processing service rejection', details: aiData });
    }

    // --- 8. استخلاص الرد بدقة ---
    let reply = "عذراً، لم أتمكن من معالجة المسألة الرياضية حالياً.";
    if (aiData.results && aiData.results.length > 0) {
      reply = aiData.results[0].generated_text;
    } else if (aiData.generated_text) {
      reply = aiData.generated_text;
    }

    return res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    console.error("API Error Details:", error);

    // معالجة أخطاء انتهاء الوقت (Timeout)
    if (error.name === 'AbortError') {
      return res.status(540).json({
        error: 'Timeout error',
        message: 'استغرق خادم الذكاء الاصطناعي وقتاً أطول من المتوقع، يرجى إعادة المحاولة.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error during AI processing',
      message: error.message
    });
  }
}

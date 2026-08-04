// ==============================================================================
// 🎯 MathCraft AI Engine - Production Ready with IBM IAM Authentication
// ==============================================================================

import { kv } from '@vercel/kv';

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

// --- 2. دالة توليد IAM Access Token تلقائياً من IBM ---
async function getIBMIAMToken(apiKey) {
  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
  params.append('apikey', apiKey);

  const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!tokenResponse.ok) {
    const tokenErr = await tokenResponse.json().catch(() => ({}));
    throw new Error(`IBM IAM Auth Failed (${tokenResponse.status}): ${JSON.stringify(tokenErr)}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

export default async function handler(req, res) {
  // --- 3. ضبط سياسات CORS ---
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

  // --- 4. فحص Rate Limiting ---
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown_ip';
  const isLimited = await isRateLimited(clientIp);

  if (isLimited) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'تجاوزت الحد المسموح من الطلبات! يرجى الانتظار لمدة دقيقة ثم المحاولة مجدداً.'
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Valid math question message is required' });
    }

    // --- 5. قراءة المتغيرات ---
    const apiKey = process.env.IBM_BOB_APIKEY || process.env.WATSONX_API_KEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID || process.env.WATSONX_PROJECT_ID;
    let serviceUrl = process.env.WATSONX_URL || 'https://us-east.ml.cloud.ibm.com';

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing IBM_BOB_APIKEY environment variable' });
    }

    // --- 6. خطوة توليد IAM Token من IBM ---
    const accessToken = await getIBMIAMToken(apiKey);

    // تجهيز رابط الخدمة المعياري
    serviceUrl = serviceUrl.replace(/\/$/, '');
    const targetUrl = serviceUrl.includes('/v1/text/generation')
      ? serviceUrl
      : `${serviceUrl}/ml/v1/text/generation?version=2023-05-29`;

    // --- 7. الاتصال بنموذج IBM Granite ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const aiRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, // استخدام Access Token المستخرج
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step in Arabic or English based on the question language:\n\n${message.trim()}`,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 700,
          temperature: 0.7,
        },
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      console.error("❌ IBM Generation Rejection:", aiData);
      return res.status(500).json({ error: 'AI processing service rejection', details: aiData });
    }

    // --- 8. استخلاص الإجابة ---
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

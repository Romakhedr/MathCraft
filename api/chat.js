// ==============================================================================
// 🎯 MathCraft AI Engine - Pure Google Gemini API Integration
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

  // --- 3. فحص Rate Limiting ---
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

    // --- 4. الاعتماد الكلي على مفتاح Gemini بشكل مباشر ---
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel environment' });
    }

    const prompt = `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step in Arabic or English based on the question language:\n\n${message.trim()}`;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    // --- 5. استدعاء API مباشرة (بِلا حزم إضافية) ---
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(500).json({ error: 'AI provider error', details: data });
    }

    // --- 6. استخراج الإجابة ---
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

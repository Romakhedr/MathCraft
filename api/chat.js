// التخزين المؤقت للتوكن (Caching) لتقليل وقت الاستجابة وتجنب قيود الحظر
let cachedToken = null;
let tokenExpirationTime = 0;

async function getIAMToken(apiKey) {
  const currentTime = Date.now();
  
  // استخدام التوكن المخزن مؤقتاً إذا لم ينتهِ وقته
  if (cachedToken && currentTime < tokenExpirationTime) {
    return cachedToken;
  }

  const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey
    })
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(`IBM IAM Authentication Failed: ${JSON.stringify(tokenData)}`);
  }

  cachedToken = tokenData.access_token;
  const expiresInMs = (tokenData.expires_in || 3600) * 1000;
  tokenExpirationTime = currentTime + expiresInMs - 300000; // خصم 5 دقائق للاحتياط

  return cachedToken;
}

export default async function handler(req, res) {
  // الحماية: السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const userMessage = req.body.message || req.body.prompt;
    
    // ربط المفتاح بالمتغير الصحيح من إعدادات Vercel
    const apiKey = process.env.IBMBob;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const url = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';

    if (!apiKey || !projectId) {
      console.error('[MathCraft] Missing environment variables for IBM');
      return res.status(500).json({ error: 'بيانات الاعتماد الخاصة بـ IBM غير مكتملة في الخادم.' });
    }

    // 1. استدعاء دالة المصادقة مع التخزين المؤقت
    const accessToken = await getIAMToken(apiKey);

    // 2. إرسال الطلب المعتمد إلى نموذج IBM watsonx.ai
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        input: `أنت مساعد ذكي مخصص لتطبيق MathCraft التعليمي. قم بحل المسألة الرياضية التالية واشرحها بأسلوب مبسط ومشجّع: ${userMessage}`,
        model_id: 'ibm/granite-3-8b-instruct',
        project_id: projectId,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 500,
          min_new_tokens: 1,
          repetition_penalty: 1.1
        }
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error('[MathCraft] watsonx API Error:', aiData);
      return res.status(aiResponse.status).json({ error: 'حدث خطأ أثناء معالجة الطلب عبر نموذج IBM.' });
    }

    const reply = aiData.results && aiData.results[0] ? aiData.results[0].generated_text : 'عذراً، لم أتمكن من توليد إجابة واضحة.';

    // 3. إرجاع النتيجة بصيغة JSON آمنة
    return res.status(200).json({ reply: reply.trim() });

  } catch (error) {
    console.error('[MathCraft] Critical Server Error:', error.message);
    return res.status(500).json({ error: 'حدث خطأ داخلي في المصادقة أو الاتصال بخوادم IBM.' });
  }
}

// تخزين مؤقت للتوكن لرفع كفاءة الاستجابة وتقليل استهلاك الطلبات
let cachedToken = null;
let tokenExpirationTime = 0;

async function getIAMToken(apiKey) {
  const currentTime = Date.now();
  
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
    // إرجاع رسالة خطأ مفصلة تحتوي على رد IBM الفعلي لتسهيل التشخيص
    throw new Error(`IAM Auth Failed [Status ${tokenResponse.status}]: ${JSON.stringify(tokenData)}`);
  }

  cachedToken = tokenData.access_token;
  const expiresInMs = (tokenData.expires_in || 3600) * 1000;
  tokenExpirationTime = currentTime + expiresInMs - 300000; // خصم 5 دقائق هامش أمان

  return cachedToken;
}

export default async function handler(req, res) {
  // 1. حماية المسار: قبول طلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const userMessage = req.body.message || req.body.prompt;
    
    if (!userMessage) {
      return res.status(400).json({ error: 'الرجاء إرسال نص المسألة الرياضية بشكل صحيح.' });
    }

    // 2. جلب متغيرات البيئة بدقة
    const apiKey = process.env.IBMBob;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const url = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
    const modelId = process.env.IBM_MODEL_ID || 'ibm/granite-3-8b-instruct';

    if (!apiKey) {
      return res.status(500).json({ error: 'خطأ إعدادات: متغير المفتاح IBMBob غير موجود في بيئة Vercel.' });
    }
    if (!projectId) {
      return res.status(500).json({ error: 'خطأ إعدادات: متغير معرف المشروع IBM_BOB_PROJECT_ID غير موجود في بيئة Vercel.' });
    }

    // 3. محاولة توليد توكن المصادقة مع التقاط أي خطأ بدقة
    let accessToken;
    try {
      accessToken = await getIAMToken(apiKey);
    } catch (authError) {
      console.error('[MathCraft] Auth Exception:', authError.message);
      return res.status(401).json({ error: `فشل مصادقة IBM IAM: ${authError.message}` });
    }

    // 4. إرسال الطلب المعتمد إلى نموذج watsonx.ai
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        input: `أنت مساعد ذكي مخصص لتطبيق MathCraft التعليمي. قم بحل المسألة الرياضية التالية واشرحها بأسلوب مبسط ومشجّع: ${userMessage}`,
        model_id: modelId,
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

    // 5. في حال رفضت خوادم watsonx الطلب، نقوم بإظهار سبب الرفض بالتفصيل
    if (!aiResponse.ok) {
      console.error('[MathCraft] watsonx API Rejected:', JSON.stringify(aiData));
      const errorMessage = aiData.message || aiData.errors?.[0]?.message || JSON.stringify(aiData);
      return res.status(aiResponse.status).json({ error: `رفضت خوادم IBM الطلب [${aiResponse.status}]: ${errorMessage}` });
    }

    // 6. استخلاص الإجابة وإرسالها بنجاح
    const reply = aiData.results && aiData.results[0] ? aiData.results[0].generated_text : 'عذراً، لم يتم العثور على إجابة في نتائج نموذج IBM.';

    return res.status(200).json({ reply: reply.trim() });

  } catch (error) {
    console.error('[MathCraft] Critical Server Error:', error);
    return res.status(500).json({ error: `حدث استثناء داخلي في الخادم: ${error.message}` });
  }
}

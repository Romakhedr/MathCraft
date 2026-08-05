export default async function handler(req, res) {
  // 1. السماح بطلبات POST فقط وحماية المسار
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const userMessage = req.body.message || req.body.prompt;
    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const url = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';

    if (!apiKey || !projectId) {
      console.error('[MathCraft] Missing IBM credentials in environment variables');
      return res.status(500).json({ error: 'إعدادات اعتماد IBM غير مكتملة في بيئة الخادم.' });
    }

    // 2. الخطوة الأولى: توليد توكن المصادقة (IAM Token) من خوادم IBM
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
      console.error('[MathCraft] IBM Token Authentication Error:', tokenData);
      return res.status(401).json({ error: 'فشل المصادقة مع خوادم IBM (خطأ 401). تحقق من صلاحية مفتاح API.' });
    }

    const accessToken = tokenData.access_token;

    // 3. الخطوة الثانية: إرسال الطلب إلى نموذج IBM watsonx.ai
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        input: `أنت مساعد ذكي مخصص لتطبيق MathCraft التعليمي. قم بحل المسألة الرياضية التالية واشرحها بأسلوب مشجّع ومبسط للطالب: ${userMessage}`,
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
      return res.status(aiResponse.status).json({ error: 'حدث استثناء أثناء معالجة البيانات داخل نموذج IBM.' });
    }

    // 4. استخلاص الإجابة وإرسالها للواجهة الأمامية بصيغة JSON آمنة
    const reply = aiData.results && aiData.results[0] ? aiData.results[0].generated_text : 'عذراً، لم أتمكن من توليد إجابة واضحة للمسألة.';

    return res.status(200).json({ reply: reply.trim() });

  } catch (error) {
    // 5. حماية شاملة تمنع إرجاع صفحات HTML وتضمن دائماً استجابة JSON
    console.error('[MathCraft] Internal Server Catch Error:', error);
    return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم، يرجى المحاولة مرة أخرى.' });
  }
}

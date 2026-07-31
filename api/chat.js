export default async function handler(req, res) {
  // 1. التعامل مع معايير الأمان و CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. معالجة الـ Body بأمان (سواء كان Object أو String)
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData);
      } catch (e) {
        // تجاهل الخطأ إذا لم يكن JSON
      }
    }

    const message = bodyData?.message || bodyData?.prompt;

    if (!message) {
      return res.status(400).json({ error: 'المسألة أو النص مطلوب' });
    }

    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectOrUrl = process.env.WATSONX_URL || 'https://us-east.ml.cloud.ibm.com';

    if (!apiKey) {
      return res.status(500).json({ error: 'المفتاح IBM_BOB_APIKEY غير متوفر في بيئة Vercel' });
    }

    // 3. طلب الـ IAM Token من IBM
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: apiKey.trim() // إزالة أي مسافات مخفية
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('IAM Token Error:', tokenData);
      return res.status(401).json({ 
        error: 'فشل التوثيق مع IBM IAM', 
        details: tokenData.errorMessage || tokenData.message || tokenData 
      });
    }

    const accessToken = tokenData.access_token;

    // 4. استدعاء نموذج التوليد
    const baseUrl = projectOrUrl.replace(/\/$/, '');
    const apiEndpoint = `${baseUrl}/ml/v1/text/generation?version=2023-05-29`;

    const aiResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        input: `أنت مساعد تعليمي متخصص في الرياضيات باسم MathCraft. أجب عن السؤال التالي بوضوح وبطريقة مبسطة:\n\nالسؤال: ${message}`,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 500
        },
        model_id: 'ibm/granite-13b-chat-v2'
      })
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error('WatsonX Generation Error:', aiData);
      return res.status(aiResponse.status).json({ 
        error: 'حدث خطأ أثناء توليد الإجابة من النموذج', 
        details: aiData 
      });
    }

    const reply = aiData.results?.[0]?.generated_text || 'لم يتم استلام نص الإجابة.';

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: 'خطأ داخلي في الخادم', details: error.message });
  }
  }

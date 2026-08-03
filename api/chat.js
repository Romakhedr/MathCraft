export default async function handler(req, res) {
  // 1. المعالجة الآمنة للطلبات (CORS Handling) للسماح بالتواصل السلس
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
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid math question message is required' });
    }

    // 2. قراءة البيانات الحساسة من متغيرات البيئة في Vercel
    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const serviceUrl = process.env.WATSONX_URL || 'https://us-east.ml.cloud.ibm.com';

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing IBM_BOB_APIKEY environment variable' });
    }

    // 3. الاتصال الآمن بنموذج الذكاء الاصطناعي عبر نقطة النهاية (Serverless Backend)
    const aiRes = await fetch(`${serviceUrl}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: `You are MathCraft Assistant, an expert AI math tutor. Answer the following student question step by step clearly and accurately: ${message}`,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
        },
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      return res.status(500).json({ error: 'AI processing service rejection', details: aiData });
    }

    // استخلاص الرد بدقة من النتائج العائدة
    let reply = "عذراً، لم أتمكن من معالجة المسألة الرياضية حالياً.";
    if (aiData.results && aiData.results.length > 0) {
      reply = aiData.results[0].generated_text;
    } else if (aiData.generated_text) {
      reply = aiData.generated_text;
    }

    return res.status(200).json({ reply });

  } catch (error) {
  console.error("API Error Details:", error); 
    return res.status(500).json({ 
      error: 'Internal server error during AI processing', 
      message: error.message 
    });
  }
}

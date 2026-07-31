export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectOrUrl = process.env.WATSONX_URL || 'https://us-east.ml.cloud.ibm.com';

    if (!apiKey) {
      return res.status(500).json({ error: 'مفتاح IBM_BOB_APIKEY غير معرف في Vercel' });
    }

    // طلب الـ Token من IBM IAM
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

    if (!tokenResponse.ok) {
      return res.status(401).json({ 
        error: 'فشل التوثيق مع IBM IAM', 
        details: tokenData.errorMessage || tokenData 
      });
    }

    const accessToken = tokenData.access_token;

    // استدعاء نموذج IBM WatsonX
    const apiEndpoint = `${projectOrUrl.replace(/\/$/, '')}/ml/v1/text/generation?version=2023-05-29`;

    const aiResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        input: `أنت مساعد تعليمي متخصص في الرياضيات باسم MathCraft. أجب على السؤال التالي بوضوح:\n\nالسؤال: ${message}`,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 500
        },
        model_id: 'ibm/granite-13b-chat-v2'
      })
    });

    const aiData = await aiResponse.json();
    const reply = aiData.results?.[0]?.generated_text || 'لم يتم استلام رد من النموذج.';

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم', details: error.message });
  }
}

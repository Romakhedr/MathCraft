export default async function handler(req, res) {
  // 1. إعدادات CORS للسماح بالاتصال
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const { message, history, messages } = req.body || {};
    
    if (!message) {
      return res.status(400).json({ success: false, reply: 'الرجاء إرسال سؤال رياضي.' });
    }

    // 2. جلب متغيرات البيئة الخاصة بـ IBM من Vercel
    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const watsonxUrl = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
    const modelId = process.env.IBM_MODEL_ID || 'ibm/granite-3-8b-instruct';

    if (!apiKey) {
      console.error("[MathCraft] Error: IBM API Key is missing.");
      return res.status(500).json({ success: false, reply: 'مفتاح IBM غير مكوّن في Vercel.' });
    }

    // 3. الخطوة الحاسمة لحل خطأ 401: تحويل API Key إلى IAM Access Token
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`
    });

    if (!tokenResponse.ok) {
      console.error("[MathCraft] IAM Token Error:", await tokenResponse.text());
      return res.status(401).json({ success: false, reply: '❌ خطأ 401: مفتاح IBM API غير صحيح. يرجى التأكد من نسخه بدون مسافات إضافية.' });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 4. إرسال الطلب لخادم IBM watsonx باستخدام التوكن الصحيح
    const prompt = `You are MathCraft Assistant, an expert AI math tutor designed for the IBM Bob Challenge. Answer the student's question clearly with step-by-step mathematical explanations:\n\nStudent Question: ${message}`;

    const ibmResponse = await fetch(watsonxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        model_id: modelId,
        input: prompt,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
        }
      })
    });

    if (!ibmResponse.ok) {
      const errorText = await ibmResponse.text();
      console.error("[MathCraft] Watsonx Error:", errorText);
      return res.status(ibmResponse.status).json({ success: false, reply: '❌ خادم IBM رفض الطلب. تأكد من صحة رقم المشروع (Project ID).' });
    }

    const data = await ibmResponse.json();
    let reply = "عذراً، لم أتمكن من صياغة الإجابة.";
    if (data.results && data.results.length > 0) {
      reply = data.results[0].generated_text;
    }

    return res.status(200).json({ success: true, reply: reply.trim() });

  } catch (error) {
    console.error("[MathCraft] Server Error:", error);
    return res.status(500).json({ success: false, reply: 'حدث خطأ غير متوقع في الخادم.' });
  }
}

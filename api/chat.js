  // ==============================================================================
// 🤖 MathCraft AI Engine - IBM watsonx & IBM Bob Integration
// ==============================================================================

const DEFAULT_IBM_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
const IBM_MODEL_ID = process.env.IBM_MODEL_ID || 'ibm/granite-3-8b-instruct';

export default async function handler(req, res) {
  // إعداد رؤوس CORS للسماح بالاتصال من أي واجهة أمامية (مثل GitHub Pages)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // التعامل مع طلبات Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // التأكد من أن الطلب من نوع POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, reply: 'عذراً، يرجى كتابة سؤال رياضي صالح.' });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ success: false, reply: 'الرسالة فارغة.' });
    }

    // جلب مفاتيح الاعتماد الخاصة بـ IBM من متغيرات البيئة في Vercel
    const apiKey = process.env.IBM_BOB_APIKEY || process.env.IBM_CLOUD_API_KEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID || process.env.WATSONX_PROJECT_ID;

    if (!apiKey) {
      console.error("[MathCraft] Error: IBM API Key is missing.");
      return res.status(500).json({ 
        success: false, 
        reply: 'خطأ في إعدادات الخادم: مفتاح IBM API غير مكوّن في متغيرات البيئة.' 
      });
    }

    // صياغة البرومبت الموجه لنموذج Granite الذكي الخاص بـ IBM
    const prompt = `You are MathCraft Assistant, an expert AI math tutor designed for the IBM Bob Challenge. Answer the student's question clearly with step-by-step mathematical explanations:\n\nStudent Question: ${trimmedMessage}`;

    // إرسال الطلب إلى خادم IBM watsonx
    const ibmResponse = await fetch(DEFAULT_IBM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model_id: IBM_MODEL_ID,
        input: prompt,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
          stop_sequences: []
        }
      })
    });

    const responseText = await ibmResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[MathCraft] Non-JSON response from IBM server:", responseText);
      return res.status(502).json({ 
        success: false, 
        reply: '❌ خطأ من خادم IBM: الاستجابة ليست بتنسيق JSON صالح (تأكد من صحة WATSONX_URL).' 
      });
    }

    if (!ibmResponse.ok) {
      console.error("[MathCraft] IBM Server Error Details:", data);
      return res.status(ibmResponse.status).json({ 
        success: false, 
        reply: `❌ رفض خادم IBM الطلب: ${data.error?.message || JSON.stringify(data)}` 
      });
    }

    // استخراج الإجابة المولدة من استجابة نموذج IBM
    let reply = "عذراً، لم تتمكن منظومة IBM من صياغة الإجابة.";
    if (data.results && data.results.length > 0) {
      reply = data.results[0].generated_text;
    } else if (data.generated_text) {
      reply = data.generated_text;
    }

    return res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    console.error("[MathCraft] Critical Server Error:", error);
    return res.status(500).json({ 
      success: false, 
      reply: 'حدث خطأ غير متوقع أثناء الاتصال بخದಾم IBM Bob الذكي.' 
    });
  }
}      

// ==============================================================================
// 🎯 MathCraft AI Engine - IBM Bob Integration (Competition Ready)
// ==============================================================================

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // --- الاعتماد حصرياً على مفاتيح IBM Bob للمسابقة ---
    const ibmApiKey = process.env.IBM_BOB_APIKEY;
    const IBMBob =process.env. IBMBob;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    
    if (!ibmApiKey) {
      return res.status(200).json({ 
        success: true, 
        reply: "⚠️ تنبيه: مفتاح IBM_BOB_APIKEY غير موجود في إعدادات Vercel." 
      });
    }

    const prompt = `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step:\n\n${message.trim()}`;
    
    // رابط خادم IBM
    const targetUrl = 'https://bob.ibm.com/ml/v1/text/generation?version=2023-05-29';
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ibmApiKey}`,
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct', // أو أي نموذج تحدده مسابقة IBM
        input: prompt,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const ibmError = data.error?.message || data.message || JSON.stringify(data);
      return res.status(200).json({ 
        success: true, 
        reply: `❌ رفض خادم IBM الطلب: ${ibmError}` 
      });
    }

    let reply = "عذراً، لم أتمكن من استخراج الإجابة من خادم IBM.";
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
    return res.status(200).json({ 
      success: true, 
      reply: `❌ حدث استثناء أثناء الاتصال بخادم IBM: ${error.message}` 
    });
  }
}

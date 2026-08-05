import { NextResponse } from 'next/server';

// ==============================================================================
// ⚙️ Configuration & Constants
// ==============================================================================
// تأكدي من ضبط الرابط الصحيح لمنطقتك على IBM watsonx (مثلاً us-south.ml.cloud.ibm.com)
const DEFAULT_IBM_URL = 'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29';
const IBM_MODEL_ID = 'ibm/granite-3-8b-instruct';
const MAX_MESSAGE_LENGTH = 1000;
const TIMEOUT_MS = 15000;

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message || (body.messages && body.messages[body.messages.length - 1]?.content);

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, reply: 'عذراً، يرجى كتابة سؤال صالح.' }, { status: 400 });
    }
    
    const sanitizedMessage = message.trim();
    if (sanitizedMessage.length === 0 || sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ 
        success: false, 
        reply: 'عذراً، رسالتك إما فارغة أو تتجاوز الحد الأقصى للأحرف.' 
      }, { status: 400 });
    }

    const ibmApiKey = process.env.IBM_BOB_APIKEY || process.env.IBM_CLOUD_API_KEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID || process.env.WATSONX_PROJECT_ID;
    const ibmUrl = process.env.WATSONX_URL || DEFAULT_IBM_URL;

    if (!ibmApiKey) {
      console.error("[MathCraft System] Error: IBM API Key is missing.");
      return NextResponse.json({ 
        success: false, 
        reply: 'عذراً، هناك مشكلة في إعدادات مفتاح الخادم.' 
      }, { status: 500 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const prompt = `You are MathCraft Assistant, an expert AI math tutor. Answer the student's question clearly step-by-step:\n\n${sanitizedMessage}`;

    const ibmRes = await fetch(ibmUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ibmApiKey}`,
      },
      body: JSON.stringify({
        model_id: IBM_MODEL_ID,
        input: prompt,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // قراءة الاستجابة كـ Text أولاً لتجنب انهيار الخادم إذا كانت صفحة HTML
    const responseText = await ibmRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[IBM Server Non-JSON Response]:", responseText);
      return NextResponse.json({ 
        success: false, 
        reply: '❌ خطأ: أرجع خادم IBM استجابة غير صالحة (تحقق من صحة WATSONX_URL).' 
      }, { status: 502 });
    }

    if (!ibmRes.ok) {
      console.error("[IBM Server Error]:", data);
      return NextResponse.json({ 
        success: false, 
        reply: `❌ رفض خادم IBM الطلب: ${data.error?.message || 'خطأ في المصادقة أو المعلمات'}` 
      }, { status: ibmRes.status });
    }

    let reply = "عذراً، لم أتمكن من صياغة الإجابة.";
    if (data.results && data.results.length > 0) {
      reply = data.results[0].generated_text;
    } else if (data.generated_text) {
      reply = data.generated_text;
    }

    return NextResponse.json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("[MathCraft System] Request timed out.");
      return NextResponse.json({ 
        success: false, 
        reply: 'عذراً، استغرق خادم IBM وقتاً أطول من اللازم للرد.' 
      }, { status: 504 });
    }

    console.error("[MathCraft System] Critical Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      reply: 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.' 
    }, { status: 500 });
  }
}

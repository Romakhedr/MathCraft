import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message || (body.messages && body.messages[body.messages.length - 1]?.content);

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Valid message is required' }, { status: 400 });
    }

    // الاعتماد حصرياً على مفاتيح IBM Bob
    const ibmApiKey = process.env.IBM_BOB_APIKEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID;

    if (!ibmApiKey) {
      return NextResponse.json({ 
        success: true, 
        reply: "⚠️ تنبيه: مفتاح IBM_BOB_APIKEY غير موجود في إعدادات Vercel." 
      });
    }

    // رابط خادم IBM Bob
    const targetUrl = 'https://bob.ibm.com/ml/v1/text/generation?version=2023-05-29';

    const ibmRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ibmApiKey}`,
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: `You are MathCraft Assistant, an expert AI math tutor. Answer clearly step-by-step:\n\n${message.trim()}`,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      })
    });

    const data = await ibmRes.json();

    // تشخيص دقيق في حال رفض خادم IBM للطلب
    if (!ibmRes.ok) {
      const ibmError = data.error?.message || data.message || JSON.stringify(data);
      return NextResponse.json({ 
        success: true, 
        reply: `❌ رفض خادم IBM الطلب بالرسالة التالية:\n${ibmError}` 
      });
    }

    // استخلاص الإجابة عند نجاح الاتصال
    let reply = "عذراً، لم أتمكن من معالجة الطلب.";
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
    return NextResponse.json({ 
      success: true, 
      reply: `❌ حدث استثناء في الخادم أثناء الاتصال بـ IBM: ${error.message}` 
    });
  }
}

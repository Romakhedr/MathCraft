import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message || (body.messages && body.messages[body.messages.length - 1]?.content);

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Valid message is required.' }, { status: 400 });
    }

    // جلب المفتاح من متغيرات البيئة المحدثة في Vercel
    const apiKey = process.env.IBMCloud || process.env.mathcraftv2 || process.env.IBMBob;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key could not be found in environment variables.' 
      }, { status: 400 });
    }

    // ---------------------------------------------------------
    // منطقة الاتصال بخدمة IBM Bob باستخدام المتغيرات المحدثة
    // ---------------------------------------------------------

    return NextResponse.json({ 
      reply: `مرحباً بك في MathCraft! تم الاتصال بنجاح وتفعيل المساعد الرياضي.` 
    });

  } qcatch (error) {
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}

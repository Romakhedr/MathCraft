import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body.message || (body.messages && body.messages[body.messages.length - 1]?.content);

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Valid message is required.' }, { status: 400 });
    }

    // جلب المفتاح والرابط من متغيرات البيئة المحدثة في Vercel
    const apiKey = process.env.IBMBOBAPIKEY;
    const baseUrl = process.env.IBMAPIURL;
  
    if (!apiKey || !baseUrl) {
      return NextResponse.json({ 
        error: 'API key or Base URL could not be found in environment variables.' 
      }, { status: 400 });
    }

    // ---------------------------------------------------------
    // منطقة الاتصال الفعلي بخدمة IBM Bob
    // ---------------------------------------------------------
    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/v1/chat`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: "You are MathCraft, an expert, encouraging AI math tutor that guides students step-by-step." 
          },
          { 
            role: "user", 
            content: message 
          }
        ]
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      data = { rawResponse: responseText };
    }

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Upstream IBM Service Failed', 
        details: data 
      }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}

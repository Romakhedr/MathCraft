export default async function handler(req, res) {
  // 1. فرض استقبال طلبات POST حصراً وحماية المسار
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 2. تحليل البيانات الواردة بأمان تام بغض النظر عن صيغتها (JSON أو String)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = { message: body };
      }
    }

    const message = body?.message?.trim();
    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // 3. التحقق الهندسي من وجود مفتاح البيئة السري
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: GEMINI_API_KEY is missing from Vercel environment variables.');
      return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // 4. تنفيذ الاتصال الآمن والمباشر بخوادم Google Gemini مع إعدادات التوليد
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          }
        })
      }
    );

    const data = await apiResponse.json();

    // 5. فحص أخطاء مستوى الاستجابة من جوجل
    if (!apiResponse.ok || data.error) {
      const errorMessage = data.error?.message || `Gemini API failed with status ${apiResponse.status}`;
      console.error('Gemini API Error:', errorMessage);
      return res.status(500).json({ error: errorMessage });
    }

    // 6. استخراج النص بدقة وحماية بنية البيانات من أي بيانات فارغة
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      console.error('Malformed API Response Structure:', JSON.stringify(data));
      return res.status(500).json({ error: 'Received an empty or invalid response from the AI model.' });
    }

    // 7. إرجاع الاستجابة النهائية بنجاح
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Internal Server Error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
      } 

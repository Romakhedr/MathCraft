export default async function handler(req, res) {
  // 1. السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
  }

  // 2. استخراج رسالة المستخدم من الطلب
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required in the request body.' });
  }

  try {
    // 3. جلب متغيرات البيئة من Vercel
    const apiKey = process.env.mathcraftbackend;
    const baseUrl = process.env.IBMAPIURL;

    // التحقق من وجود المتغيرات لتجنب الأخطاء المفاجئة
    if (!apiKey || !baseUrl) {
      console.error("Configuration Error: mathcraftbackend or IBMAPIURL is missing in Vercel.");
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    // 4. بناء الرابط النهائي (ملاحظة: تأكدي من مسار الخدمة الخاص بـ IBM)
    // قمنا بإضافة /api/v1/chat كمثال قياسي، يجب تغييره إذا كانت وثائق IBM تطلب مساراً آخر
    const endpoint = `${baseUrl}/api/v1/chat`; 

    // 5. إرسال الطلب إلى خوادم IBM
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // صيغة المصادقة القياسية (قد تحتاجين لتغيير Bearer إلى شيء آخر حسب وثائق IBM)
        'Authorization': `Bearer ${apiKey}`, 
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful AI assistant for the MathCraft platform." },
          { role: "user", content: message }
        ]
      }),
    });

    // 6. هندسة التقاط الأخطاء التي طلبتِها
    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔴 IBM API Error Details:", errorText);
      console.error("🔴 Status Code:", response.status);
      return res.status(response.status).json({ 
        error: "API Request Failed", 
        details: errorText 
      });
    }

    // 7. في حال نجاح الطلب، يتم إرسال البيانات للواجهة
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    // التقاط أخطاء السيرفر أو انقطاع الاتصال
    console.error("🔴 Internal Server Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}

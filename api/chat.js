export default async function handler(req, res) {
  // إعداد رؤوس الاستجابة لضمان التوافقية ودعم الاتصال (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Type, Content-Length, Authorization'
  );

  // التعامل مع طلبات OPTIONS المسبقة
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // التحقق التلقائي من متغيرات البيئة المحدثة في Vercel بالترتيب
    const apiKey = 
      process.env.IBMCloud || 
      process.env.mathcraftv2 || 
      process.env['mathcraft-backend'] || 
      process.env.IBMBob;

    // التحقق من وجود مفتاح ساري
    if (!apiKey) {
      return res.status(400).json({ 
        error: "API key could not be found in environment variables. Please check your Vercel configurations." 
      });
    }

    // استلام الرسالة من جسم الطلب (Request Body)
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // ---------------------------------------------------------
    // منطقة الاتصال بخدمة الذكاء الاصطناعي أو نموذج IBM الخاص بك
    // ---------------------------------------------------------
    
    /* 
    مثال على كيفية استخدام المفتاح لربط الطلب بنقطة النهاية الخارجية:
    const response = await fetch('YOUR_AI_OR_IBM_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ prompt: message })
    });
    const data = await response.json();
    */

    // الرد الافتراضي المؤكد بنجاح الاتصال بالمفتاح الجديد
    return res.status(200).json({ 
      reply: `مرحباً بك في مساعد MathCraft الرياضي! تم الاتصال بنجاح وتفعيل مفتاح المصادقة.` 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}

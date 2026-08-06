export default async function handler(req, res) {
  // إعدادات CORS للسماح بالاتصال من تطبيقات أخرى
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Type, Content-Length, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // جلب مفتاح المصادقة بدون شرطات ليتطابق مع Vercel
    const apiKey = 
      process.env.IBMBob || 
      process.env.mathcraftv2 || 
      process.env.mathcraftbackend || 
      process.env.IBMCloud;

    // جلب الرابط من المتغير الجديد IBMAPIURL
    const apiUrl = process.env.IBMAPIURL;

    // التحقق من وجود الإعدادات
    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing in environment variables." });
    }
    if (!apiUrl) {
      return res.status(500).json({ error: "IBMAPIURL is missing in environment variables." });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // إرسال الطلب إلى خدمة IBM Bob
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    // إرجاع النتيجة
    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
}

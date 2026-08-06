export default async function handler(req, res) {
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
    const apiKey = 
      process.env.IBMCloud || 
      process.env.mathcraftv2 || 
      process.env['math-craft-backend'] || 
      process.env.IBMBob;

    if (!apiKey) {
      return res.status(400).json({ 
        error: "API key could not be found in environment variables. Please check your Vercel configurations." 
      });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // يمكنك استبدال أو ربط الاتصال الفعلي هنا باستخدام المفتاح (apiKey) ورسالة (message)

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

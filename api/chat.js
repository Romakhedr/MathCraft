export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const apiKey = process.env.IBMBOBAPIKEY;
    const baseUrl = process.env.IBMAPIURL;

    if (!apiKey || !baseUrl) {
      return res.status(500).json({ error: "Missing Environment Variables in Vercel" });
    }

    const endpoint = `${baseUrl}/api/v1/chat`; 

    // تجربة الإرسال بالشكل المباشر أو عبر x-api-key إذا رفض النظام صيغة الـ Bearer
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey, // إرسال المفتاح مباشرة بدون كلمة Bearer
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful AI assistant for MathCraft." },
          { role: "user", content: message }
        ]
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("🔴 Internal Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}

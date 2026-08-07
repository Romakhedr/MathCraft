export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const apiKey = process.env.mathcraftbackend;
    const baseUrl = process.env.IBMAPIURL;

    if (!apiKey || !baseUrl) {
      return res.status(500).json({ error: "Missing Environment Variables in Vercel" });
    }

    const endpoint = `${baseUrl}/api/v1/chat`; 

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey // دعم صيغة الترويسة البديلة الخاصة بـ IBM
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful AI assistant for the MathCraft platform." },
          { role: "user", content: message }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔴 IBM API Auth Failed (401):", errorText);
      return res.status(response.status).json({ 
        error: "Authentication Failed", 
        details: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("🔴 Internal Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}

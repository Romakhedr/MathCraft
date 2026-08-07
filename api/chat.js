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

    // 1. تبديل الـ API Key بـ JWT Access Token من خادم توثيق IBM
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
        'apikey': apiKey
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("🔴 IAM Token Exchange Failed:", tokenData);
      return res.status(401).json({ 
        error: "IBM IAM Authentication Failed", 
        details: tokenData 
      });
    }

    // 2. استخدام الـ JWT Token الناتج لإرسال المحادثة إلى IBM Bob
    const jwtToken = tokenData.access_token;
    const endpoint = `${baseUrl}/api/v1/chat`; 

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
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

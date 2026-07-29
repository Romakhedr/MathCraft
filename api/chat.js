// api/chat.js - MathCraft & IBM Bob Integration
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  try {
    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const baseUrl = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';

    // 1. طلب Access Token من IBM IAM
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. إرسال المسألة إلى IBM Bob
    const ibmResponse = await fetch(`${baseUrl}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        input: `أنت معلم رياضيات ذكي في تطبيق MathCraft. احسب واشرح الخطوات بوضوح للمسألة التالية:\n${prompt}`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7
        },
        model_id: "ibm/granite-13b-chat-v2",
        project_id: projectId
      })
    });

    const result = await ibmResponse.json();
    const aiMessage = result.results?.[0]?.generated_text || "عذراً، حدث خطأ في معالجة المسألة عبر IBM Bob.";

    return res.status(200).json({ reply: aiMessage });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message is required' });
    }

    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const serviceUrl = process.env.WATSONX_URL || 'https://us-east.ml.cloud.ibm.com';

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing API Key in environment variables' });
    }

    // الاتصال المباشر بنموذج IBM Bob SaaS باستخدام المفتاح والمشروع
    const aiRes = await fetch(`${serviceUrl}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`apikey:${apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: `You are MathCraft Assistant, an expert AI math tutor. Answer the following student question step by step clearly and accurately: ${message}`,
        project_id: projectId || undefined,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
        },
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok || !aiData.results || aiData.results.length === 0) {
      return res.status(500).json({ error: 'IBM Bob API rejection', details: aiData });
    }

    const reply = aiData.results[0].generated_text;
    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error during AI processing', message: error.message });
  }
}

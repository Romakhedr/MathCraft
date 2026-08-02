export default async function handler(req, res) {
  // التعامل مع معايير الأمان و CORS
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
    const { message }  = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.IBM_BOB_APIKEY;
    const projectId = process.env.IBM_BOB_PROJECT_ID;
    const serviceUrl = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';

    // 1. الحصول على رمز المصادقة (IAM Token) من IBM
    const tokenRes = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Failed to retrieve IBM IAM access token');
    }

    // 2. إرسال السؤال إلى نموذج واتسون (Granite)
    const aiRes = await fetch(`${serviceUrl}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        model_id: 'ibm/granite-3-8b-instruct',
        input: message,
        project_id: projectId,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      }),
    });

    const aiData = await aiRes.json();

    if (!aiData.results || aiData.results.length === 0) {
      throw new Error('Invalid response from IBM AI service');
    }

    const reply = aiData.results[0].generated_text;

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error communicating with IBM AI:', error);
    return res.status(500).json({ error: 'Failed to process AI request' });
  }
      }

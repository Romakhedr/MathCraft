import { WatsonXAI } from '@ibm-cloud/watsonx-ai';

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
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const watsonxAI = new WatsonXAI({
      apikey: process.env.IBM_BO_APIKEY,
      serviceUrl: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
    });

    const response = await watsonxAI.generateText({
      modelId: 'ibm/granite-3-8b-instruct',
      input: message,
      projectId: process.env.IBM_BO_ECT_ID,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
      },
    });

    const reply = response.result.results[0].generated_text;

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error communicating with IBM AI:', error);
    return res.status(500).json({ error: 'Failed to process AI request' });
  }
}

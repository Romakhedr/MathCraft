export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { prompt } = req.body;
  const apiKey = process.env.IBM_BOB_APIKEY ? process.env.IBM_BOB_APIKEY.trim() : null;
  const projectId = process.env.IBM_BOB_PROJECT_ID ? process.env.IBM_BOB_PROJECT_ID.trim() : null;
 const baseUrl = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';

 if (!apiKey || !projectId) {
    return res.status(500).json({ error: 'إعدادات المفاتيح غير مكتملة على السيرفر' });
  }

  try {
    // 1. طلب الـ Access Token
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: apiKey,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('IAM Auth Failed:', tokenData);
      return res.status(500).json({ error: 'فشل التوثيق مع IBM IAM' });
    }

    const accessToken = tokenData.access_token;

    // 2. إرسال الطلب لـ IBM Bob / watsonx
    const response = await fetch(`${baseUrl}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        input: prompt || "Hello",
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 300,
          min_new_tokens: 1,
        },
        model_id: 'ibm/granite-13b-chat-v2',
        project_id: projectId,
      }),
    });

    const data = await response.json();

    // 3. معالجة النص المرجع بأمان كلي (Handling all potential response formats)
    let aiText = '';

    if (data.results && data.results[0] && data.results[0].generated_text) {
      aiText = data.results[0].generated_text;
    } else if (data.choices && data.choices[0] && data.choices[0].text) {
      aiText = data.choices[0].text;
    } else if (data.generated_text) {
      aiText = data.generated_text;
    } else if (typeof data === 'string') {
      aiText = data;
    } else {
      console.log('IBM Raw Output:', JSON.stringify(data));
      aiText = 'تم استلام الإجابة بنجاح من IBM Bob.';
    }

    // إرجاع النتيجة للواجهة الأمامية
    return res.status(200).json({ reply: aiText, response: aiText, text: aiText });

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({ error: 'حدث خطأ غير متوقع أثناء الاتصال' });
  }
          }

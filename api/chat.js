export default async function handler(req, res) {
  // 1. التحقق من طريقة الطلب (Method Validation)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 2. التحقق من المتغيرات البيئية (Environment Guards)
    const apiKey = process.env.IBMBOBAPIKEY;
    const baseUrl = process.env.IBMAPIURL;

    if (!apiKey || !baseUrl) {
      console.error("CRITICAL: Missing environment variables IBMBOBAPIKEY or IBMAPIURL.");
      return res.status(500).json({ error: "Internal Configuration Error" });
    }

    // 3. التحقق وتعقيم المدخلات (Payload Validation & Sanitization)
    const { message, mode = 'copilot', studentAnswer, mathProblem } = req.body || {};
    
    const sanitizedMode = ['copilot', 'correct'].includes(mode) ? mode : 'copilot';
    const userMessage = typeof message === 'string' ? message.trim() : '';
    const studentAttempt = typeof studentAnswer === 'string' ? studentAnswer.trim() : '';
    const problemStatement = typeof mathProblem === 'string' ? mathProblem.trim() : '';

    if (!userMessage && !studentAttempt) {
      return res.status(400).json({ error: 'Validation Error: "message" or "studentAnswer" is required.' });
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/v1/chat`; 

    // 4. بناء هيكل الذكاء الاصطناعي بناءً على النمط (Copilot أو Corrector)
    let systemPrompt = "You are MathCraft Copilot, an expert, encouraging AI math tutor that guides students step-by-step without just giving the final answer.";
    let userContent = userMessage;

    if (sanitizedMode === 'correct' || studentAttempt) {
      systemPrompt = "You are MathCraft Corrector. Analyze the student's solution for the math problem, verify if it is mathematically correct, highlight any exact errors, and provide clear step-by-step correction and guidance.";
      userContent = `Math Problem: ${problemStatement || "General Equation"}\nStudent's Answer/Attempt: ${studentAttempt || userMessage}`;
    }

    // 5. إرسال الطلب الموثق إلى مزود الخدمة الخارجي
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // استخدام التوثيق القياسي الآمن
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ]
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      data = { rawResponse: responseText };
    }

    // 6. التعامل مع أخطاء الاستجابة من المصدر الخارجي
    if (!response.ok) {
      console.error(`Upstream API Error [Status ${response.status}]:`, data);
      return res.status(response.status).json({
        error: "Authentication or Upstream Service Failed",
        status: response.status,
        details: data
      });
    }

    // 7. النجاح وإرجاع البيانات للعميل
    return res.status(200).json(data);

  } catch (error) {
    console.error("Internal Server Exception:", error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message 
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, mode, studentAnswer, mathProblem } = req.body;
  
  if (!message && !studentAnswer) {
    return res.status(400).json({ error: 'Message or student answer is required' });
  }

  try {
    const apiKey = process.env.IBMBOBAPIKEY;
    const baseUrl = process.env.IBMAPIURL;

    if (!apiKey || !baseUrl) {
      return res.status(500).json({ error: "Missing Environment Variables in Vercel" });
    }

    const endpoint = `${baseUrl}/api/v1/chat`; 

    let systemPrompt = "You are MathCraft Copilot, an expert, encouraging AI math tutor that guides students step-by-step without just giving the final answer.";
    let userContent = message;

    if (mode === 'correct' || studentAnswer) {
      systemPrompt = "You are MathCraft Corrector. Analyze the student's solution for the math problem, verify if it is mathematically correct, highlight any exact errors, and provide clear step-by-step correction and guidance.";
      userContent = `Math Problem: ${mathProblem || "General Equation"}\nStudent's Answer/Attempt: ${studentAnswer || message}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
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

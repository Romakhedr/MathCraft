// src/app/api/chat/route.js — MathCraft AI chat endpoint (Next.js App Router)
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format history to match Gemini's expected structure
    const formattedHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Start an interactive chat session, preserving context
    const chat = model.startChat({
      history: formattedHistory,
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return Response.json({ reply: text }, { status: 200 });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
  }

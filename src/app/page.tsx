"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });
      const data = await res.json();

      const replyText =
        data?.choices?.[0]?.message?.content ??
        data?.rawResponse ??
        data?.error ??
        "حصل خطأ في الرد.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyText },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "تعذر الاتصال بالخادم." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 16 }}>MathCraft Copilot</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#2563eb" : "#f1f5f9",
              color: m.role === "user" ? "#fff" : "#111",
              padding: "10px 14px",
              borderRadius: 10,
              maxWidth: "80%",
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: "#888" }}>جاري الكتابة...</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="اسأل عن أي مسألة رياضية..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button
          onClick={sendMessage}
          style={{ padding: "10px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none" }}
        >
          إرسال
        </button>
      </div>
    </main>
  );
}

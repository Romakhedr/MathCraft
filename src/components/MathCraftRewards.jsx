"use client";
import React, { useState, useEffect } from "react";
import { Flame, Trophy, Sparkles, Lock, Check, Zap, Wallet } from "lucide-react";

const TOKENS = {
  bgDeep: "#0a2e22",
  bgPanel: "#0f3d2c",
  bgPanelAlt: "#123f2d",
  gold: "#f2b705",
  goldSoft: "#f2b70533",
  cream: "#f6f3e9",
  creamMuted: "#c9d6cd",
  line: "#1c5a41",
  green: "#2fae6a",
};

function Eyebrow({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{ background: TOKENS.bgPanel, border: `1px solid ${TOKENS.line}`, borderRadius: 14, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

export default function MathCraftRewards() {
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    if (!wallet) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/balance?wallet=${wallet}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
      } else {
        setError(data.error || "Unknown error");
        setBalance(null);
      }
    } catch (e) {
      setError(e.message);
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: TOKENS.bgDeep, color: TOKENS.cream, fontFamily: "'Inter', sans-serif", padding: "40px 20px", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Eyebrow>MathCraft · Rewards</Eyebrow>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 20px" }}>
          Your MTH <span style={{ color: TOKENS.gold }}>Balance</span>
        </h1>

        <Panel style={{ marginBottom: 18 }}>
          <Eyebrow>Wallet Address</Eyebrow>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              style={{
                flex: 1,
                background: TOKENS.bgPanelAlt,
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 8,
                padding: "10px 12px",
                color: TOKENS.cream,
                fontSize: 13.5,
              }}
            />
            <button
              onClick={fetchBalance}
              disabled={loading}
              style={{
                background: TOKENS.gold,
                color: "#0a2419",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Wallet size={16} />
              {loading ? "Loading..." : "Check"}
            </button>
          </div>
        </Panel>

        {error && (
          <Panel style={{ borderColor: "#c0392b", marginBottom: 18 }}>
            <span style={{ color: "#e74c3c", fontSize: 13.5 }}>{error}</span>
          </Panel>
        )}

        {balance !== null && (
          <Panel>
            <Eyebrow>MTH Balance</Eyebrow>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: TOKENS.gold }}>
                {balance.toLocaleString()}
              </span>
              <span style={{ fontSize: 13, color: TOKENS.creamMuted }}>MTH</span>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

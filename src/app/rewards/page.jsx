'use client';

import React, { useState, useMemo } from "react";
import { Flame, Trophy, Sparkles, Lock, Check, Zap, ArrowRight } from "lucide-react";

const TOKENS = {
  bgDeep: "#09251b",
  bgPanel: "#0f3627",
  bgPanelAlt: "#144231",
  gold: "#f2b705",
  goldSoft: "rgba(242, 183, 5, 0.12)",
  cream: "#f6f3e9",
  creamMuted: "#a3b8ad",
  line: "#19523c",
  green: "#2fae6a",
};

const TOPICS = [
  { id: "quad", name: "Quadratic Equations", solved: 18, total: 20 },
  { id: "pct", name: "Percentages", solved: 12, total: 15 },
  { id: "deriv", name: "Derivatives", solved: 4, total: 20 },
];

const BADGES = [
  { id: "zero-hint", label: "Zero Hint", desc: "Solve 10 problems without asking assistant", unlocked: true },
  { id: "solver", label: "Solver", desc: "Reach 500 Solve Points", unlocked: true },
  { id: "math-master", label: "Math Master", desc: "Complete 3 topics", unlocked: false },
  { id: "math-wizard", label: "Math Wizard", desc: "Reach 5,000 Solve Points", unlocked: false },
];

const TITLES = ["Beginner", "Solver", "Math Master", "Math Wizard"];

export default function MathCraftRewards({ points = 1240, streakDays = 4, curiosityPoints = 65, topics = TOPICS, badges = BADGES }) {
  const [justAsked, setJustAsked] = useState(false);
  const [localCuriosity, setLocalCuriosity] = useState(curiosityPoints);

  const currentTitleIndex = useMemo(() => {
    if (points >= 5000) return 3;
    if (points >= 2000) return 2;
    if (points >= 500) return 1;
    return 0;
  }, [points]);

  const nextTitleThreshold = [500, 2000, 5000, null][currentTitleIndex];
  const prevThreshold = [0, 500, 2000, 5000][currentTitleIndex];
  const titleProgress = nextTitleThreshold ? points - prevThreshold : 1;
  const titleSpan = nextTitleThreshold ? nextTitleThreshold - prevThreshold : 1;

  const handleSmartQuestion = () => {
    setLocalCuriosity((c) => c + 5);
    setJustAsked(true);
    setTimeout(() => setJustAsked(false), 1600);
  };

  return (
    <div style={{ background: TOKENS.bgDeep, color: TOKENS.cream, fontFamily: "'Inter', sans-serif", minHeight: "100vh", paddingBottom: 60 }}>
      
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: TOKENS.cream, letterSpacing: "-0.02em" }}>
          Math<span style={{ color: TOKENS.gold }}>Craft</span>
        </div>
        <a href="/" style={{ background: TOKENS.gold, color: "#09251b", padding: "10px 22px", borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(242,183,5,0.25)" }}>
          Home <ArrowRight size={16} />
        </a>
      </nav>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 20px" }}>
        
        <div style={{ textAlign: "center", marginBottom: 48, marginTop: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 12 }}>
            — MATHEMATICS REWARDS —
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0, fontFamily: "serif", lineHeight: 1.2 }}>
            Where numbers <span style={{ color: TOKENS.gold, fontStyle: "italic" }}>earn</span> their keep
          </h1>
          <p style={{ color: TOKENS.creamMuted, marginTop: 14, fontSize: 16, maxWidth: 580, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            Master mathematics through visual explanations, instant practice, and verified blockchain rewards.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          
          <div style={{ background: TOKENS.bgPanel, border: `1px solid ${TOKENS.line}`, borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 8 }}>Solve Points</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: TOKENS.gold }}>{points.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: TOKENS.creamMuted }}>pts</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: TOKENS.creamMuted, marginBottom: 6 }}>
                <span>{TITLES[currentTitleIndex]}</span>
                <span>{nextTitleThreshold ? TITLES[currentTitleIndex + 1] : "Max"}</span>
              </div>
              <div style={{ width: "100%", height: 8, borderRadius: 999, background: "#051610", overflow: "hidden", border: `1px solid ${TOKENS.line}` }}>
                <div style={{ width: `${Math.min(100, Math.round((titleProgress / titleSpan) * 100))}%`, height: "100%", background: `linear-gradient(90deg, ${TOKENS.green}, ${TOKENS.gold})`, transition: "width 500ms ease" }} />
              </div>
            </div>
          </div>

          <div style={{ background: TOKENS.bgPanel, border: `1px solid ${TOKENS.line}`, borderRadius: 16, padding: "22px 24px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 6 }}>Streak</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Flame size={26} color={TOKENS.gold} fill={TOKENS.gold} />
              <span style={{ fontSize: 32, fontWeight: 800 }}>{streakDays}</span>
            </div>
            <div style={{ fontSize: 12, color: TOKENS.creamMuted, marginTop: 6 }}>Days in a row</div>
          </div>

          <div style={{ background: TOKENS.bgPanel, border: `1px solid ${TOKENS.line}`, borderRadius: 16, padding: "22px 24px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 6 }}>Curiosity</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Sparkles size={24} color={TOKENS.gold} />
              <span style={{ fontSize: 32, fontWeight: 800 }}>{localCuriosity}</span>
            </div>
            <div style={{ fontSize: 12, color: TOKENS.creamMuted, marginTop: 6 }}>AI Smart Points</div>
          </div>

        </div>

        <div style={{ background: TOKENS.bgPanel, border: `1px solid ${TOKENS.line}`, borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 16 }}>Topics Progress</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {topics.map((t) => (
              <div key={t.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span style={{ color: TOKENS.creamMuted }}>{t.solved}/{t.total} solved</span>
                </div>
                <div style={{ width: "100%", height: 8, borderRadius: 999, background: "#051610", overflow: "hidden", border: `1px solid ${TOKENS.line}` }}>
                  <div style={{ width: `${Math.min(100, Math.round((t.solved / t.total) * 100))}%`, height: "100%", background: `linear-gradient(90deg, ${TOKENS.green}, ${TOKENS.gold})`, transition: "width 500ms ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: TOKENS.bgPanel, border: `1px solid ${TOKENS.line}`, borderRadius: 16, padding: "24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 16 }}>Badges & Achievements</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
            {badges.map((b) => (
              <div key={b.id} style={{ background: b.unlocked ? TOKENS.goldSoft : TOKENS.bgPanelAlt, border: `1px solid ${b.unlocked ? TOKENS.gold : TOKENS.line}`, borderRadius: 12, padding: "16px 14px", opacity: b.unlocked ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {b.unlocked ? <Trophy size={18} color={TOKENS.gold} /> : <Lock size={16} color={TOKENS.creamMuted} />}
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{b.label}</span>
                </div>
                <div style={{ fontSize: 12, color: TOKENS.creamMuted, lineHeight: 1.4 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: TOKENS.bgPanel, border: `1px solid ${TOKENS.line}`, borderRadius: 16, padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TOKENS.gold, fontWeight: 700, marginBottom: 6 }}>Ask the Assistant</div>
            <p style={{ fontSize: 14, color: TOKENS.creamMuted, margin: 0, maxWidth: 460, lineHeight: 1.5 }}>
              Don't just ask for the answer — ask <em>why</em>. Questions that show true reasoning earn Curiosity Points.
            </p>
          </div>
          <button onClick={handleSmartQuestion} style={{ display: "flex", alignItems: "center", gap: 8, background: justAsked ? TOKENS.green : TOKENS.gold, color: "#051610", border: "none", borderRadius: 999, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 200ms ease", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(242,183,5,0.2)" }}>
            {justAsked ? <Check size={18} /> : <Zap size={18} />}
            {justAsked ? "+5 Curiosity Added" : "Ask a smart question"}
          </button>
        </div>

      </div>
    </div>
  );
}

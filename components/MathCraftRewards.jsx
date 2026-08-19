import React, { useState, useMemo } from "react";
import { Flame, Trophy, Sparkles, Lock, Check, Zap } from "lucide-react";

/**
 * MathCraft Rewards System
 * -------------------------------------------------
 * Matches MathCraft's brand: deep forest green (#0d3d2e) canvas,
 * gold (#f2b705) accent (pulled from the "MathCraft" wordmark logo),
 * bone-white text, small-caps utility labels (echoing the README's
 * VERSION / LICENSE / BUILD badge row).
 *
 * Drop-in usage:
 *   <MathCraftRewards />
 *
 * All state is local/mock — wire the `points`, `streak`, `topics`
 * and `onAskSmartQuestion` values up to your real app state.
 */

// ---- Design tokens -------------------------------------------------
const TOKENS = {
  bgDeep: "#0a2e22",      // near-black forest green (page canvas)
  bgPanel: "#0f3d2c",     // card surface
  bgPanelAlt: "#123f2d",  // slightly lighter surface for hover/alt rows
  gold: "#f2b705",        // MathCraft wordmark gold
  goldSoft: "#f2b70533",
  cream: "#f6f3e9",       // primary text
  creamMuted: "#c9d6cd",  // secondary text
  line: "#1c5a41",        // hairline dividers
  green: "#2fae6a",       // success / streak flame
};

const TOPICS = [
  { id: "quad", name: "Quadratic Equations", solved: 18, total: 20 },
  { id: "pct", name: "Percentages", solved: 12, total: 15 },
  { id: "deriv", name: "Derivatives", solved: 4, total: 20 },
];

const BADGES = [
  { id: "zero-hint", label: "Zero Hint", desc: "Solve 10 problems without asking the assistant", unlocked: true },
  { id: "solver", label: "Solver", desc: "Reach 500 Solve Points", unlocked: true },
  { id: "math-master", label: "Math Master", desc: "Complete 3 topics", unlocked: false },
  { id: "math-wizard", label: "Math Wizard", desc: "Reach 5,000 Solve Points", unlocked: false },
];

const TITLES = ["Beginner", "Solver", "Math Master", "Math Wizard"];

// ---- Small building blocks -----------------------------------------

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: TOKENS.gold,
        fontWeight: 700,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div
      style={{
        background: TOKENS.bgPanel,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 14,
        padding: "20px 22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        borderRadius: 999,
        background: "#0a2419",
        overflow: "hidden",
        border: `1px solid ${TOKENS.line}`,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${TOKENS.green}, ${TOKENS.gold})`,
          transition: "width 500ms ease",
        }}
      />
    </div>
  );
}

// ---- Main component ---------------------------------------------------

export default function MathCraftRewards({
  points = 1240,
  streakDays = 4,
  curiosityPoints = 65,
  topics = TOPICS,
  badges = BADGES,
}) {
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
  const titleProgress = nextTitleThreshold
    ? points - prevThreshold
    : 1;
  const titleSpan = nextTitleThreshold ? nextTitleThreshold - prevThreshold : 1;

  const handleSmartQuestion = () => {
    setLocalCuriosity((c) => c + 5);
    setJustAsked(true);
    setTimeout(() => setJustAsked(false), 1600);
  };

  return (
    <div
      style={{
        background: TOKENS.bgDeep,
        color: TOKENS.cream,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "40px 20px",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Eyebrow>MathCraft · Rewards</Eyebrow>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Where numbers <span style={{ color: TOKENS.gold }}>earn</span> their keep
          </h1>
          <p style={{ color: TOKENS.creamMuted, marginTop: 8, fontSize: 15, maxWidth: 560 }}>
            Every problem you solve, every honest attempt, every curious question —
            tracked, badged, and turned into visible progress.
          </p>
        </div>

        {/* Top stat row: Points / Title / Streak */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <Panel>
            <Eyebrow>Solve Points</Eyebrow>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: TOKENS.gold }}>
                {points.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: TOKENS.creamMuted }}>pts</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: TOKENS.creamMuted,
                  marginBottom: 6,
                }}
              >
                <span>{TITLES[currentTitleIndex]}</span>
                <span>{nextTitleThreshold ? TITLES[currentTitleIndex + 1] : "Max title"}</span>
              </div>
              <ProgressBar value={titleProgress} max={titleSpan} />
            </div>
          </Panel>

          <Panel style={{ textAlign: "center" }}>
            <Eyebrow>Streak</Eyebrow>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Flame size={26} color={TOKENS.gold} fill={TOKENS.gold} />
              <span style={{ fontSize: 30, fontWeight: 800 }}>{streakDays}</span>
            </div>
            <div style={{ fontSize: 12, color: TOKENS.creamMuted, marginTop: 6 }}>
              days in a row · {7 - (streakDays % 7)} to next bonus
            </div>
          </Panel>

          <Panel style={{ textAlign: "center" }}>
            <Eyebrow>Curiosity</Eyebrow>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Sparkles size={22} color={TOKENS.gold} />
              <span style={{ fontSize: 30, fontWeight: 800 }}>{localCuriosity}</span>
            </div>
            <div style={{ fontSize: 12, color: TOKENS.creamMuted, marginTop: 6 }}>
              points from asking the assistant well
            </div>
          </Panel>
        </div>

        {/* Topics progress */}
        <Panel style={{ marginBottom: 18 }}>
          <Eyebrow>Topics</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 10 }}>
            {topics.map((t) => (
              <div key={t.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    fontSize: 13.5,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span style={{ color: TOKENS.creamMuted }}>
                    {t.solved}/{t.total} solved
                  </span>
                </div>
                <ProgressBar value={t.solved} max={t.total} />
              </div>
            ))}
          </div>
        </Panel>

        {/* Badges */}
        <Panel style={{ marginBottom: 18 }}>
          <Eyebrow>Badges</Eyebrow>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 12,
              marginTop: 10,
            }}
          >
            {badges.map((b) => (
              <div
                key={b.id}
                style={{
                  background: b.unlocked ? TOKENS.goldSoft : TOKENS.bgPanelAlt,
                  border: `1px solid ${b.unlocked ? TOKENS.gold : TOKENS.line}`,
                  borderRadius: 10,
                  padding: "14px 12px",
                  opacity: b.unlocked ? 1 : 0.55,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {b.unlocked ? (
                    <Trophy size={16} color={TOKENS.gold} />
                  ) : (
                    <Lock size={14} color={TOKENS.creamMuted} />
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{b.label}</span>
                </div>
                <div style={{ fontSize: 11.5, color: TOKENS.creamMuted, lineHeight: 1.4 }}>
                  {b.desc}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* AI Assistant engagement */}
        <Panel>
          <Eyebrow>Ask the Assistant</Eyebrow>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <p style={{ fontSize: 13.5, color: TOKENS.creamMuted, margin: 0, maxWidth: 460, lineHeight: 1.5 }}>
              Don't just ask for the answer — ask <em>why</em>. Questions that show real
              reasoning earn Curiosity Points instead of a plain solve.
            </p>
            <button
              onClick={handleSmartQuestion}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: justAsked ? TOKENS.green : TOKENS.gold,
                color: "#0a2419",
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 200ms ease",
                whiteSpace: "nowrap",
              }}
            >
              {justAsked ? <Check size={16} /> : <Zap size={16} />}
              {justAsked ? "+5 Curiosity" : "Ask a smart question"}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

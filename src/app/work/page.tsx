"use client";

import { useMemo, useState } from "react";
import { Fraunces, Inter } from "next/font/google";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Compass,
  Users,
  ShieldCheck,
  ArrowRight,
  Check,
  X,
  Sparkles,
  TriangleAlert,
  Clock,
  LayoutGrid,
} from "lucide-react";
import styles from "./work.module.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

// ---------------------------------------------------------------------------
type Scenario = {
  id: string;
  label: string;
  role: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explain: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "pricing",
    label: "Pricing a deal",
    role: "Sales / Account Management",
    prompt:
      "A client wants 18% off a $42,000 annual contract if they pay upfront. What's the discounted price?",
    options: ["$34,440", "$38,220", "$39,760", "$36,960"],
    answerIndex: 0,
    explain:
      "18% of $42,000 is $7,560. Subtract that from $42,000 to get $34,440 — the number that actually lands in the deal, not the sticker price.",
  },
  {
    id: "forecast",
    label: "Sizing a forecast",
    role: "Operations / Planning",
    prompt:
      "Orders grew from 1,240 to 1,426 last quarter. If that growth rate holds, roughly what's next quarter's order count?",
    options: ["≈1,520", "≈1,640", "≈1,580", "≈1,700"],
    answerIndex: 1,
    explain:
      "Growth was 186 orders, ~15%. Applying that same rate to 1,426 gives about 1,640 — the kind of quick estimate that should happen before a headcount request, not after.",
  },
  {
    id: "dashboard",
    label: "Reading a dashboard",
    role: "Product / Marketing",
    prompt:
      "Conversion rate is shown as 'up 40%' — from 2.0% to 2.8%. Is the headline technically accurate?",
    options: [
      "No — that's a 40 percentage-point jump, which is wrong",
      "Yes — 0.8 is 40% of 2.0, so the relative growth is correctly stated",
      "No — percentages can't be compared this way",
      "Yes — but only if the sample size is large enough",
    ],
    answerIndex: 1,
    explain:
      "0.8 percentage points is a 40% relative increase over a 2.0% base. The headline is correct — but only if you can tell the difference between a percentage and a percentage point, which is exactly the gap this flags.",
  },
];

const TEAM_DATA: Record<string, { skill: string; score: number }[]> = {
  "New Team Leads": [
    { skill: "Forecasting", score: 54 },
    { skill: "Budget math", score: 71 },
    { skill: "Reading dashboards", score: 62 },
    { skill: "Sanity-checks", score: 38 },
    { skill: "Pricing & margins", score: 66 },
  ],
  "Sales Team": [
    { skill: "Forecasting", score: 48 },
    { skill: "Budget math", score: 58 },
    { skill: "Reading dashboards", score: 70 },
    { skill: "Sanity-checks", score: 33 },
    { skill: "Pricing & margins", score: 82 },
  ],
  "Ops Team": [
    { skill: "Forecasting", score: 76 },
    { skill: "Budget math", score: 64 },
    { skill: "Reading dashboards", score: 58 },
    { skill: "Sanity-checks", score: 61 },
    { skill: "Pricing & margins", score: 49 },
  ],
};

const PROBLEM_CARDS = [
  {
    icon: TriangleAlert,
    title: "Decisions outrun training",
    body: "A pricing call or a forecast lands on someone's desk long before any course covers it.",
  },
  {
    icon: Clock,
    title: "Generic training, wasted hours",
    body: "Scheduled corporate courses rarely match the specific number problem a person is stuck on this week.",
  },
  {
    icon: LayoutGrid,
    title: "No visibility for managers",
    body: "Leads can't see where a team's quantitative confidence is thin until a decision has already gone wrong.",
  },
];

// ---------------------------------------------------------------------------
export default function WorkPage() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [team, setTeam] = useState<keyof typeof TEAM_DATA>("New Team Leads");

  function chooseScenario(s: Scenario) {
    setActiveScenario(s);
    setSelected(null);
  }

  function answer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === activeScenario.answerIndex;
    setConfidence((c) => Math.max(10, Math.min(100, c + (correct ? 9 : -6))));
  }

  const chartData = useMemo(() => TEAM_DATA[team], [team]);
  const teamAvg = useMemo(
    () => Math.round(chartData.reduce((a, b) => a + b.score, 0) / chartData.length),
    [chartData]
  );
  const weakest = useMemo(
    () => chartData.reduce((a, b) => (b.score < a.score ? b : a)),
    [chartData]
  );

  return (
    <div className={`${styles.page} ${fraunces.variable} ${inter.variable}`}>
      {/* NAV */}
      <header className={styles.header}>
        <a href="/" className={styles.brand} style={{textDecoration:"none",color:"inherit"}}>
          <span className={`${styles.brandName} ${styles.serif}`}>
            Math<span className={styles.brandGold}>Craft</span>
          </span>
          <span className={styles.badge}>for Work</span>
        </a>
        <button className={styles.btnGold}>
          Start Free <ArrowRight size={15} />
        </button>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrowDark}>
            <span className={styles.eyebrowLine} />
            FUTURE OF WORK
          </div>
          <h1 className={`${styles.heroTitle} ${styles.serif}`}>
            Every job runs on <span className={styles.italic}>judgment calls.</span>
          </h1>
          <p className={styles.heroSub}>
            MathCraft for Work turns adaptive, gamified learning into a layer that sits next to
            the decision itself — a price, a forecast, a dashboard — instead of a course taken
            long before it's needed.
          </p>

          <div className={styles.heroActions}>
            <button className={styles.btnGold}>
              Try the Diagnostic <ArrowRight size={15} />
            </button>
            <button className={styles.btnOutlineDark}>See Team Dashboard</button>
          </div>

          {/* Interactive diagnostic */}
          <div className={styles.diagnostic}>
            <div className={styles.tabs}>
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => chooseScenario(s)}
                  className={`${styles.tab} ${activeScenario.id === s.id ? styles.tabActive : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className={styles.promptBlock}>
              <p className={styles.roleLabel}>{activeScenario.role}</p>
              <p className={styles.promptText}>{activeScenario.prompt}</p>

              <div className={styles.options}>
                {activeScenario.options.map((opt, idx) => {
                  const isChosen = selected === idx;
                  const isCorrect = idx === activeScenario.answerIndex;
                  const revealed = selected !== null;
                  let extra = "";
                  if (revealed && isCorrect) extra = styles.optionCorrect;
                  else if (revealed && isChosen && !isCorrect) extra = styles.optionWrong;
                  return (
                    <button
                      key={idx}
                      onClick={() => answer(idx)}
                      disabled={selected !== null}
                      className={`${styles.optionBtn} ${extra}`}
                    >
                      <span>{opt}</span>
                      {revealed && isCorrect && <Check size={16} color="#E8B24D" />}
                      {revealed && isChosen && !isCorrect && <X size={16} color="#E07A5F" />}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className={styles.explainBox}>
                  <Sparkles size={15} color="#E8B24D" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p>{activeScenario.explain}</p>
                </div>
              )}
            </div>

            <div className={styles.confidenceRow}>
              <span className={styles.confidenceLabel}>Decision confidence</span>
              <div className={styles.confidenceBarWrap}>
                <div className={styles.confidenceBarBg}>
                  <div className={styles.confidenceBarFill} style={{ width: `${confidence}%` }} />
                </div>
                <span className={styles.confidenceValue}>{confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM (light/cream) */}
      <section className={styles.sectionLight}>
        <div className={styles.sectionLightInner}>
          <div className={styles.eyebrowLight}>
            <span className={styles.eyebrowLine} />
            THE PROBLEM
          </div>
          <h2 className={`${styles.sectionTitleLight} ${styles.serif}`}>
            Why workplace math gets skipped
          </h2>
          <p className={styles.sectionBodyLight}>
            Most knowledge work runs on numbers. Very few people get trained for the moment they
            actually need it.
          </p>
          <div className={styles.cardGrid}>
            {PROBLEM_CARDS.map((c, i) => (
              <div key={i} className={styles.whiteCard}>
                <div className={styles.iconBadgePeach}>
                  <c.icon size={19} color="#D97757" strokeWidth={1.75} />
                </div>
                <h3 className={styles.whiteCardTitle}>{c.title}</h3>
                <p className={styles.whiteCardBody}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION / FEATURES (dark) */}
      <section className={styles.sectionDark}>
        <div className={styles.sectionDarkInner}>
          <div className={styles.eyebrowDark}>
            <span className={styles.eyebrowLine} />
            THE SOLUTION
          </div>
          <h2 className={`${styles.sectionTitleDark} ${styles.serif}`}>
            Same adaptive engine. A different learner.
          </h2>
          <p className={styles.sectionBodyDark}>
            MathCraft's adaptive-learning and credentialing engine, repointed from a curriculum to
            the decisions people face at work.
          </p>
          <div className={styles.featureGrid}>
            {[
              { n: "01", icon: Compass, title: "Diagnose the gap", body: "A short adaptive check-in tied to a person's role finds the quantitative gap actually costing them time." },
              { n: "02", icon: Sparkles, title: "Practice the real thing", body: "Micro-challenges built from workplace scenarios — pricing, forecasting, dashboards — not textbook problems." },
              { n: "03", icon: Users, title: "Coordinate as a team", body: "Managers see where a team's quantitative confidence is thin, so support arrives before a decision goes wrong." },
              { n: "04", icon: ShieldCheck, title: "Carry the credential", body: "Verified skill badges become a portable record of quantitative competence that moves with the person." },
            ].map((f) => (
              <div key={f.n} className={styles.darkCard}>
                <div className={styles.iconBadgeGold}>
                  <f.icon size={19} color="#14301F" strokeWidth={1.9} />
                </div>
                <span className={styles.darkCardNum}>{f.n}</span>
                <h3 className={styles.darkCardTitle}>{f.title}</h3>
                <p className={styles.darkCardBody}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD (light) */}
      <section className={styles.sectionLight}>
        <div className={styles.sectionLightInner}>
          <div className={styles.eyebrowLight}>
            <span className={styles.eyebrowLine} />
            FOR MANAGERS
          </div>
          <div className={styles.dashboardHead}>
            <h2 className={`${styles.sectionTitleLight} ${styles.serif}`} style={{ marginBottom: 0 }}>
              See skill coverage before it becomes a bottleneck.
            </h2>
            <div className={styles.teamButtons}>
              {Object.keys(TEAM_DATA).map((t) => (
                <button
                  key={t}
                  onClick={() => setTeam(t)}
                  className={`${styles.teamBtn} ${team === t ? styles.teamBtnActive : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.chartCard}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius="72%">
                  <PolarGrid stroke="#ece7de" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#6B7A70", fontSize: 11, fontFamily: "var(--font-sans)" }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#E8B24D" fill="#E8B24D" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #ece7de",
                      borderRadius: 10,
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#16241C" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.statCard}>
              <div>
                <div className={styles.statTeamLabel}>
                  <span className={styles.statSmall}>{team}</span>
                </div>
                <p className={`${styles.statBig} ${styles.serif}`}>
                  {teamAvg}
                  <span className={styles.statBigUnit}>/100</span>
                </p>
                <p className={styles.statDesc}>Average decision-readiness across five core skills.</p>
              </div>
              <div className={styles.weakBlock}>
                <p className={styles.weakLabel}>Weakest area right now</p>
                <p className={styles.weakValue}>{weakest.skill}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CREDENTIAL (dark) */}
      <section className={styles.sectionDark}>
        <div className={styles.sectionDarkInner}>
          <div className={styles.eyebrowDark}>
            <span className={styles.eyebrowLine} />
            PORTABLE PROOF
          </div>
          <div className={styles.credentialGrid}>
            <div className={styles.credentialCard}>
              <ShieldCheck size={22} color="#E8B24D" style={{ marginBottom: 16 }} />
              <p className={styles.credentialLabel}>Verified skill</p>
              <p className={`${styles.credentialTitle} ${styles.serif}`}>Forecasting &amp; Estimation</p>
              <p className={styles.credentialTag}>on-chain · MTH-backed · owned by learner</p>
            </div>
            <p className={styles.credentialText}>
              Every mastered skill mints a verifiable credential the employee owns outright — a
              quantitative &ldquo;career passport&rdquo; that moves with them between teams and
              employers, instead of living inside a training system no one outside the company can
              see.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerIcon}>
            <Sparkles size={24} color="#E8B24D" />
          </div>
          <h2 className={`${styles.footerTitle} ${styles.serif}`}>
            Ready to bring this to your team?
            <span className={styles.footerTitleGold}>Start with MathCraft for Work.</span>
          </h2>
          <p className={styles.footerSub}>
            Built on MathCraft's adaptive-learning engine — for the decisions people face at work,
            not just in class.
          </p>
          <div className={styles.footerDivider} />
          <p className={styles.footerCopy}>
            © 2026 MathCraft. Designed with Quiet Luxury. Built by Reham Hamdy Elsayed Khedr.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useRef, useCallback } from "react";

const API_URL = "https://advisorsprint-api.onrender.com/api/claude";
const MOCK_MODE = false;

// ── COLOUR PALETTE — Navy/Blue (distinct from consumer green/terra) ────────
const N = {
  navy:      '#0f1f3d',
  navyMid:   '#1e3a5f',
  blue:      '#2563eb',
  blueMid:   '#3b82f6',
  blueLight: '#dbeafe',
  purple:    '#7c3aed',
  purpleLight:'#ede9fe',
  ink:       '#1a1a2e',
  inkMid:    '#4a5568',
  inkFaint:  '#9aa5b4',
  sand:      '#e2e8f0',
  parchment: '#f8fafc',
  white:     '#ffffff',
  green:     '#059669',
  amber:     '#d97706',
  red:       '#dc2626',
};

// ── SAAS AGENTS ────────────────────────────────────────────────────────────
const SAAS_AGENTS = [
  { id: "market",      wave: 1, icon: "◈", label: "Market & Category Intelligence",      sub: "TAM, category maturity, structural forces" },
  { id: "product",     wave: 1, icon: "◉", label: "Product & Platform Architecture",     sub: "Moat, network effects, disintermediation risk" },
  { id: "gtm",         wave: 1, icon: "◎", label: "Go-To-Market & Revenue Architecture", sub: "PLG motion, pricing model, enterprise transition" },
  { id: "revenue",     wave: 1, icon: "◐", label: "Revenue Health & Unit Economics",     sub: "ARR triangulation, gross margin, Rule of 40" },
  { id: "customer",    wave: 1, icon: "◆", label: "Customer & Segment Intelligence",     sub: "ICP, segment health, churn drivers" },
  { id: "competitive", wave: 1, icon: "◇", label: "Competitive Moat & Battleground",    sub: "Switching costs, moat components, threat timeline" },
  { id: "funding",     wave: 2, icon: "◈", label: "Funding, Valuation & Strategic Options", sub: "Exit scenarios, valuation benchmarking, acquirer map" },
  { id: "pricing",     wave: 2, icon: "◉", label: "Pricing Power & Revenue Model",      sub: "Model stress-test, pricing power, enterprise gap" },
  { id: "intl",        wave: 2, icon: "◎", label: "International Expansion & Benchmarks", sub: "Global comps, expansion markets, regulatory barriers" },
  { id: "synopsis",    wave: 3, icon: "◉", label: "Executive Synopsis",                 sub: "Strategic synthesis — Opus 4" },
  { id: "brief",       wave: 4, icon: "◈", label: "Opportunity Brief",                   sub: "2-page visual brief for founders & VCs" },
];

const W1 = SAAS_AGENTS.filter(a => a.wave === 1).map(a => a.id);
const W2 = SAAS_AGENTS.filter(a => a.wave === 2).map(a => a.id);

// ── VISUAL COLOUR SYSTEM ───────────────────────────────────────────────────
const V = {
  navy:       '#0f1f3d',
  blue:       '#2563eb',
  blueMid:    '#3b82f6',
  blueLight:  '#dbeafe',
  purple:     '#7c3aed',
  ink:        '#1a1a2e',
  inkMid:     '#4a5568',
  inkFaint:   '#9aa5b4',
  sand:       '#e2e8f0',
  parchment:  '#f8fafc',
  white:      '#ffffff',
  green:      '#059669',
  amber:      '#d97706',
  red:        '#dc2626',
  forest:     '#0f1f3d',
  terra:      '#2563eb',
};


// ── SAAS OPPORTUNITY BRIEF PROMPT ─────────────────────────────────────────
const SAAS_BRIEF_PROMPT = `# AGENT 11: SAAS OPPORTUNITY BRIEF

You are the most senior strategic analyst on this engagement. You have read every agent output and the full synopsis. Your job is one thing: produce a 2-page visual brief that makes a founder or VC want to read the full report.

This brief is a door-opener, not a summary. A founder stops reading when they see their strategic tension named precisely. A VC stops when they see a comp that reframes the trajectory. Every word must earn its place.

## YOUR SYNTHESIS APPROACH

Read every agent output systematically before writing anything:
- Agent 1 (Market): category timing, TAM, structural forces → MARKET SIGNAL TABLE (home market signals only)
- Agent 2 (Product): moat components, disintermediation risk → STRATEGIC TENSION
- Agent 3 (GTM): motion efficiency, PLG/enterprise balance → REVENUE GAP TABLE + MOVES
- Agent 4 (Revenue): ARR health, Rule of 40, unit economics → KPI STRIP (derived metrics only)
- Agent 5 (Customer): ICP coverage, segment health, churn → SEGMENT COVERAGE MAP
- Agent 6 (Competitive): TWO things — (a) moat threats → COMPETITIVE THREAT TIMELINE; (b) what home-market competitors/challengers are doing differently that proves a motion or segment this company hasn't addressed → MARKET SIGNALS TABLE
- Agent 7 (Funding): (a) valuation context, exit scenarios → KPI STRIP + VERDICT; (b) acquirer/investor assets not yet activated for this product → COMPETITIVE EDGE section
- Agent 8 (Pricing): pricing power, model stress → REVENUE GAP TABLE
- Agent 9 (International): global comps, expansion signals → GLOBAL COMP SIGNAL (Page 2) + ARRIVAL SEQUENCE (Page 2)

PAGE 1 IS HOME MARKET ONLY. Every data point on Page 1 describes what is happening in this company's home market — segment gaps, revenue gaps, what home market competitors are doing, structural edge. No international comps or arrival signals on Page 1.

PAGE 2 IS INTERNATIONAL + ACTION. Page 2 shows: what this company must do (Strategic Tension + Radar + 3 Moves), then global category context, then what is arriving internationally and when, then the global comp pattern match, then competitors, then verdict.

CRITICAL — ONE JOB PER SURFACE:
- marketSignals (Page 1): home market players proving a motion/segment this company hasn't addressed — specific companies, commercial evidence, implication
- competitiveEdge (Page 1): acquirer/investor assets not yet applied to this product, OR standalone structural advantages. NEVER suggest distribution or enterprise relationship assets without cited evidence — assume they are already activated.
- arrivalSequence (Page 2): international category shifts arriving in this market — when, how, what company must do before inflection
- globalComps (Page 2): reference companies 12-24 months ahead — pattern match for founder/VC
- page1Summary: home market position + structural constraint only. No international content.

## THREE PLAY TYPES — CLASSIFY EVERY GAP AND MOVE

**SCALE**
Extend the existing motion using existing distribution/product. Win by executing faster and deeper on what already works. No new capability required.
Badge: Navy.

**TRANSFORM**
Requires a fundamentally different motion — PLG to enterprise, single-product to platform, usage-based to seat-based. Company must build a capability it does not currently have. High risk, high ceiling.
Badge: Purple.

**DEFEND**
A specific competitor or category shift is actively eroding a position. Move is about protecting before expanding. Speed matters more than size here.
Badge: Red.

## THE STRATEGIC TENSION — MOST IMPORTANT OUTPUT

The Strategic Tension is the single most valuable sentence in the brief. It names the specific contradiction the company is navigating — the thing the founder knows is true but has not seen written precisely. It sits at the top of Page 2 and frames everything that follows.

Format: "[Signal A] while [Signal B] — this means [implication for next 18 months]."
Example: "PLG motion driving 70% of new ARR while enterprise ACV is 4x higher — the company is optimising for acquisition velocity at the cost of revenue quality, and the window to correct this closes when the first enterprise competitor enters the ICP."

Bad tension: "The company has strong growth but faces competitive pressure." (Generic — any company.)
Good tension: Names the specific metric, the specific contradiction, the specific 18-month consequence.

## GLOBAL COMP SIGNAL — VC HOOK

Pick 4-5 companies that are 12-24 months ahead of this company on a comparable trajectory in a reference market (US, EU, Israel, SEA). For each: company name, what stage they were at when they faced the same dynamic, what happened, what it predicts for this company. This is how VCs think — pattern matching to known trajectories.

## DATA BLOCK — WRITE FIRST

<<<DATA_BLOCK>>>
{
  "agent": "brief",
  "kpis": [
    "MANDATORY: 4 DERIVED metrics that require calculation — not descriptive labels the founder already knows.",
    "BAD: ARR $12M — the founder knows this. GOOD: 'Revenue per ICP Account' = ARR divided by ICP count showing monetisation efficiency; 'Expansion Gap' = NRR minus 100% × ARR showing revenue being left in existing base; 'CAC Payback Delta' = months to payback vs category benchmark; 'Competitive Velocity' = rate at which named competitor is closing feature/distribution gap.",
    "Each KPI must make the founder or VC think: I had not computed that.",
    "Format: {label: short label, value: the computed number with unit, sub: what was calculated and from what, trend: up|down|flat|watch, confidence: H|M|L}"
  ],
  "strategicTension": "One precise sentence naming the specific contradiction — [signal A] while [signal B] — this means [implication]. Max 160 chars.",
  "radarAxes": [
    {"axis": "Market Timing", "today": 0, "future": 0},
    {"axis": "Product Moat", "today": 0, "future": 0},
    {"axis": "Revenue Quality", "today": 0, "future": 0},
    {"axis": "GTM Efficiency", "today": 0, "future": 0},
    {"axis": "Competitive Position", "today": 0, "future": 0},
    {"axis": "Capital Efficiency", "today": 0, "future": 0}
  ],
  "segmentMap": [
    {
      "segment": "Segment name",
      "sizeMr": 0,
      "status": "owned|partial|at_risk",
      "growth": "high|medium|low",
      "threat": "Competitor colonising this segment or blank if owned"
    }
  ],
  "revenueGaps": [
    {
      "gap": "gap description",
      "arrGapM": 0,
      "currentMotion": "PLG|Enterprise|Channel|Usage",
      "playType": "SCALE|TRANSFORM|DEFEND",
      "mechanism": "how to close — specific motion or action",
      "confidence": "H|M|L"
    }
  ],
  "marketSignals": [
    {
      "signal": "signal name (max 20 chars)",
      "evidence": "one evidence line (max 45 chars)",
      "momentum": "accelerating|building|mainstream|emerging|declining",
      "months18": "accelerating|building|mainstream|emerging|declining",
      "sourceMarket": "US|EU|IL|SEA|IN",
      "headroomPct": 0,
      "playType": "SCALE|TRANSFORM|DEFEND"
    }
  ],
  "moves": [
    {
      "title": "4 words max — name the motion or segment, not the framework",
      "segment": "segment or motion targeted",
      "arrImpactM": 0,
      "playType": "SCALE|TRANSFORM|DEFEND",
      "mechanism": "specific motion — how this company reaches scale",
      "orgInstruction": "what must change organisationally — build, hire, restructure, ring-fence",
      "confidence": "CONFIRMED|DERIVED|ESTIMATED|SIGNAL ONLY",
      "timeToRevenue": "Q1 26",
      "filters": ["A", "B"],
      "rationale": "one sentence max 120 chars",
      "evidence": "one evidence line with source max 80 chars"
    }
  ],
  "competitorThreats": [
    {
      "name": "competitor name",
      "arrEst": "$XM",
      "targeting": "which segment or motion they are colonising",
      "threatBy": "Q3 2026",
      "confidence": "H|M|L"
    }
  ],
  "arrivalSequence": [
    {
      "market": "US|EU|IL|SEA|IN",
      "format": "the specific product motion, category shift, or competitive format arriving in this company's home market (max 30 chars) — not a company name, a structural shift",
      "inflection": "Q3 2026 — when this reaches critical mass in the home market, not when it is mainstream in the reference market",
      "entryMechanism": "HOW it physically arrives — which acquirer/distribution deal/product launch/enterprise relationship is the vehicle (max 55 chars)",
      "companyResponse": "what THIS company must do specifically before that inflection point — one action (max 50 chars)",
      "confidence": "H|M|L"
    }
  ],
  "globalComps": [
    {
      "market": "US|EU|IL|SEA",
      "company": "comp company name",
      "stage": "what stage they were at when facing same dynamic",
      "whatHappened": "one line — outcome (max 60 chars)",
      "prediction": "one line — what this predicts for [COMPANY] (max 60 chars)"
    }
  ],
  "page1Summary": "Exactly 2 sentences. S1: the single most important gap in segment coverage or revenue motion right now — which segment is at risk, how large, who is moving in, and what structural right to win this company has that a new entrant cannot replicate. S2: the single competitive or structural constraint that makes this gap urgent NOW — what organisational or capability fact means the window closes if the company does not move in 18 months. DO NOT mention international comps — those are on Page 2. Home market position only. Max 280 chars total. Do not start with company name.",
  "boldStatement": "One sentence. Max 140 chars. Names the specific segment or motion window, the competitor who will own it if this company does not move, and the timeframe. Urgency without using the word urgency.",
  "categoryRead": {
    "globalTrend": "One sentence: where this category is structurally heading — consolidating, bifurcating, commoditising, platformising. No company names. Max 120 chars.",
    "leadMarket": "US|EU|IL|SEA — the single market where this structural shift is most advanced",
    "homeMarketLag": "e.g. 'EU 18 months behind US on enterprise motion' or 'IN 2-3 years behind US on PLG-to-enterprise transition'",
    "implication": "One sentence: what the structural shift means for this company's window — opening, closing, or already closing. No company names. Max 120 chars."
  },
  "sectionHeaders": {
    "segmentMap": "8 words max — what the segment coverage reveals about this company specifically",
    "revenueGaps": "8 words max — the single most important gap pattern",
    "marketSignals": "8 words max — what home market players are proving that this company hasn't done yet",
    "competitiveEdge": "8 words max — what the structural or institutional edge is e.g. 'Acquirer enterprise network untapped for this product.'",
    "radarGap": "8 words max — what the transformation requires"
  }
}
<<<END_DATA_BLOCK>>>

## FIELD INSTRUCTIONS — READ BEFORE WRITING DATA BLOCK

**marketSignals**: HOME MARKET ONLY. For each row: name a specific company operating in this company's home market (competitor, challenger, adjacent player) who is doing something in this product category that this company is NOT doing. The company must be real and operating in the home market. The action must be specific and concrete. The evidence must be commercial (ARR, customers, funding, distribution). The implication must tell the founder what to do specifically. Maximum 5 rows. No international players here.

**competitiveEdge**: CONDITIONAL. If acquired or has a strategic investor: pull from Agent 7 the specific assets of the acquirer/investor that are NOT yet activated for this product. CRITICAL EXCLUSION — do NOT include enterprise relationships, distribution channels, or customer network assets unless Agent 7 has specific cited evidence they are not already being used. A company with a strategic investor will already be leveraging obvious relationship assets. Focus ONLY on: technology or IP not yet applied to this product, data assets not yet leveraged, manufacturing or infrastructure capability, regulatory or certification advantage, proprietary research. If standalone: what this company can do faster than any incumbent — speed, community, format experimentation, founder credibility, capital-light iteration. Maximum 3 assets.

**arrivalSequence**: PAGE 2 ONLY. For each row: a specific category shift, competitive format, or structural change that is mainstream in a reference market and arriving in this company's home market. HOW it physically arrives — which acquirer/partnership/product launch is the vehicle. WHAT the company must do before the inflection point. Maximum 5 rows. No home market data here.

**page1Summary**: Home market position + structural constraint only. DO NOT mention international comps — those are on Page 2. S1: most important segment or motion gap, how large, who is moving in, what structural right-to-win this company has. S2: the specific capability or organisational constraint that makes this urgent NOW.

## AFTER THE DATA BLOCK

Write exactly this and nothing else:

**BOLD STATEMENT:**
[Your one sentence here]
`;

// ── SAAS MAKE PROMPT ────────────────────────────────────────────────────────
function makeSaaSPrompt(id, company, acquirer, ctx, synthCtx) {
  const acqName = acquirer && acquirer.trim() ? acquirer.trim() : null;
  const hasAcquirer = !!acqName;

  const contextBlock = hasAcquirer
    ? `ACQUISITION CONTEXT: This analysis covers ${company} in the context of a potential acquisition by or strategic relationship with ${acqName}. Agent 7 (Funding) should specifically model this acquisition scenario.`
    : `COMPANY CONTEXT: This is a standalone analysis of ${company}. Focus on the company's own strategic position, competitive dynamics, and growth options.`;

  let prompt = contextBlock + '\n\n';

  if (ctx) {
    prompt += `USER CONTEXT:\n${ctx}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  // Replace [COMPANY] and [ACQUIRER] placeholders
  prompt = prompt.replace(/\[COMPANY\]/g, company);
  prompt = prompt.replace(/\[ACQUIRER\]/g, acqName || 'the acquirer');

  // Add prior agent outputs for synopsis/W2
  if (synthCtx && Object.keys(synthCtx).length > 0) {
    const agentNames = {
      market:      'AGENT 1: MARKET & CATEGORY INTELLIGENCE',
      product:     'AGENT 2: PRODUCT & PLATFORM ARCHITECTURE',
      gtm:         'AGENT 3: GO-TO-MARKET & REVENUE ARCHITECTURE',
      revenue:     'AGENT 4: REVENUE HEALTH & UNIT ECONOMICS',
      customer:    'AGENT 5: CUSTOMER & SEGMENT INTELLIGENCE',
      competitive: 'AGENT 6: COMPETITIVE MOAT & BATTLEGROUND',
      funding:     'AGENT 7: FUNDING, VALUATION & STRATEGIC OPTIONS',
      pricing:     'AGENT 8: PRICING POWER & REVENUE MODEL',
      intl:        'AGENT 9: INTERNATIONAL EXPANSION & BENCHMARKS',
    };
    let priorContext = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPRIOR AGENT OUTPUTS (FOR SYNTHESIS)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    Object.entries(synthCtx).forEach(([agentId, result]) => {
      const agentName = agentNames[agentId] || agentId.toUpperCase();
      const dbMatch2 = typeof result === 'string' ? result.match(/<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>/) : null;
      const dataBlock2 = dbMatch2 ? '<<<DATA_BLOCK>>>' + dbMatch2[1] + '<<<END_DATA_BLOCK>>>' : '';
      const withoutBlock = typeof result === 'string'
        ? result.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '').trim()
        : '';
      const trimmed = dataBlock2 + '\n\n' + withoutBlock.slice(0, 2500) + (withoutBlock.length > 2500 ? ' [...truncated for synthesis...]' : '');
      priorContext += `## ${agentName}\n${trimmed}\n\n`;
    });
    prompt += priorContext;
  }

  // Agent-specific mandate appended by server.js via SAAS_PROMPTS
  // Here we just pass company name as a marker so server knows which agent to inject
  prompt += `\nCOMPANY: ${company}\nAGENT_ID: ${id}`;

  return prompt;
}


// ── SAAS VISUAL RENDERERS ─────────────────────────────────────────────────
let CUR = '$';
let UNIT = 'M';
const fmtMoney = (val) => val != null ? `${CUR}${val}${UNIT}` : 'N/A';

function sectionLabel(text) {
  return `<div style="font-family:monospace;font-size:6.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${V.inkFaint};margin:10px 0 5px;">${text}</div>`;
}

function renderSaaSKPIs(kpis) {
  if (!kpis || !kpis.length) return '';
  const confDot = c => `<span style="width:5px;height:5px;border-radius:50%;background:${c==='H'?V.green:c==='M'?V.amber:'#bbb'};display:inline-block;margin-left:3px;vertical-align:middle;flex-shrink:0;"></span>`;
  const trendIcon = t => ({up:`<span style="color:${V.green};font-size:9px;">↑</span>`,down:`<span style="color:${V.red};font-size:9px;">↓</span>`,watch:`<span style="color:${V.amber};font-size:9px;">⚠</span>`})[t]||'';
  const confColor = c => c==='H'?V.green:c==='M'?V.amber:V.red;
  let h = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">`;
  kpis.slice(0,4).forEach(k => {
    h += `<div style="background:${V.parchment};border:1px solid ${V.sand};border-left:3px solid ${confColor(k.confidence)};border-radius:3px;padding:7px 8px;">
      <div style="font-size:6px;font-family:monospace;letter-spacing:.1em;text-transform:uppercase;color:${V.inkFaint};margin-bottom:3px;">${k.label||''}</div>
      <div style="font-size:16px;font-family:'DM Sans',sans-serif;font-weight:800;color:${V.navy};line-height:1;">${k.value||'—'}${trendIcon(k.trend)}</div>
      <div style="font-size:6px;color:${V.inkMid};margin-top:2px;">${k.sub||''}${confDot(k.confidence)}</div>
    </div>`;
  });
  h += '</div>';
  return h;
}

function renderSaaSVerdict(verdictRow) {
  if (!verdictRow) return '';
  const vColors = { STRONG:'#059669', WATCH:'#d97706', OPTIMISE:'#2563eb', UNDERDELIVERED:'#dc2626', RISK:'#dc2626' };
  const vc = vColors[verdictRow.verdict] || V.inkMid;
  return `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:${V.parchment};border:1px solid ${V.sand};border-radius:3px;margin-bottom:10px;">
    <span style="font-size:8px;font-weight:800;color:${vc};font-family:monospace;letter-spacing:.08em;padding:2px 7px;background:${vc}18;border-radius:8px;">${verdictRow.verdict||'—'}</span>
    <span style="font-size:7.5px;color:${V.inkMid};flex:1;">${verdictRow.finding||''}</span>
    <span style="font-size:6px;color:${V.inkFaint};font-family:monospace;">[${verdictRow.confidence||'M'}]</span>
  </div>`;
}

function renderMarketSaaS(db) {
  let h = '';
  if (db.categoryMap && db.categoryMap.length) {
    const posColors = { leader: V.navy, challenger: V.blue, niche: V.inkMid, emerging: V.amber };
    h += sectionLabel('Competitive Landscape');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:${V.navy};color:#fff;padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;">Competitor</th>
        <th style="background:${V.navy};color:#fff;padding:5px 8px;text-align:right;">Est. ARR / Revenue</th>
        <th style="background:${V.navy};color:#fff;padding:5px 8px;text-align:center;">Growth Signal</th>
        <th style="background:${V.navy};color:#fff;padding:5px 8px;text-align:center;">Position</th>
      </tr></thead><tbody>`;
    db.categoryMap.forEach((c,i) => {
      const col = posColors[c.position] || V.inkMid;
      h += `<tr>
        <td style="padding:5px 8px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:700;color:${V.navy};">${c.competitor}</td>
        <td style="padding:5px 8px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:right;font-weight:700;color:${V.navy};">${fmtMoney(c.revenueM)}</td>
        <td style="padding:5px 8px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;color:${V.inkMid};">${c.growth ? '+'+c.growth+'% YoY' : '—'}</td>
        <td style="padding:5px 8px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;color:${col};">${c.position}</td>
      </tr>`;
    });
    h += `</tbody></table>`;
    h += `<div style="font-size:6px;color:${V.inkFaint};margin-bottom:8px;">Revenue estimates from public signals. Confidence levels shown in agent prose.</div>`;
  }
  // Structural forces
  if (db.structuralForces && db.structuralForces.length) {
    h += sectionLabel('Structural Forces');
    h += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">`;
    db.structuralForces.forEach(f => {
      const isWind = f.verdict === 'tailwind';
      h += `<div style="background:${isWind?'#ecfdf5':'#fef2f2'};border:1px solid ${isWind?'#a7f3d0':'#fecaca'};border-radius:3px;padding:6px 8px;">
        <div style="font-size:7px;font-weight:700;color:${isWind?V.green:V.red};">${isWind?'↑ TAILWIND':'↓ HEADWIND'} [${f.impact}]</div>
        <div style="font-size:6.5px;color:${V.inkMid};margin-top:2px;">${f.force}</div>
        <div style="font-size:6px;color:${V.inkFaint};margin-top:2px;">${f.timeline}</div>
      </div>`;
    });
    h += '</div>';
  }
  return h;
}

function renderProductSaaS(db) {
  let h = '';
  if (db.moatAssessment && db.moatAssessment.length) {
    h += sectionLabel('Moat Assessment');
    h += `<div style="margin-bottom:8px;">`;
    db.moatAssessment.forEach(m => {
      const str = Math.min(m.strength||0, 10);
      const col = str >= 7 ? V.green : str >= 4 ? V.amber : V.red;
      h += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <div style="width:110px;font-size:7px;color:${V.inkMid};flex-shrink:0;">${m.dimension}</div>
        <div style="flex:1;height:8px;background:${V.sand};border-radius:4px;overflow:hidden;">
          <div style="width:${str*10}%;height:100%;background:${col};border-radius:4px;"></div>
        </div>
        <span style="font-size:6.5px;font-family:monospace;color:${col};width:50px;text-align:right;font-weight:700;">${m.verdict}</span>
      </div>`;
    });
    h += '</div>';
  }
  if (db.disintermediationRisks && db.disintermediationRisks.length) {
    h += sectionLabel('Disintermediation Risks');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;">Threat</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Probability</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Timeline</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Impact</th>
      </tr></thead><tbody>`;
    db.disintermediationRisks.forEach((r,i) => {
      const impactCol = r.impact === 'existential' ? V.red : r.impact === 'serious' ? V.amber : V.green;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;">${r.threat}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;color:${r.probability==='H'?V.red:r.probability==='M'?V.amber:V.green};">${r.probability}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${r.timeline}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;color:${impactCol};">${r.impact}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  return h;
}

function renderGTMSaaS(db) {
  let h = '';
  if (db.funnelStages && db.funnelStages.length) {
    h += sectionLabel('GTM Funnel Assessment');
    h += `<div style="margin-bottom:8px;">`;
    const strColors = { strong: V.green, moderate: V.amber, weak: V.red };
    db.funnelStages.forEach(s => {
      const col = strColors[s.strength] || V.inkMid;
      h += `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:5px;padding:5px 7px;background:${V.parchment};border-left:3px solid ${col};border-radius:2px;">
        <div style="width:70px;font-size:7px;font-weight:700;color:${V.navy};flex-shrink:0;">${s.stage}</div>
        <div style="flex:1;font-size:6.5px;color:${V.inkMid};">${s.mechanic}</div>
        <div style="width:50px;font-size:6.5px;font-weight:700;color:${col};text-align:right;flex-shrink:0;">${s.strength}</div>
      </div>`;
      if (s.gap) h += `<div style="font-size:6px;color:${V.amber};padding:2px 7px 4px 85px;">⚠ Gap: ${s.gap}</div>`;
    });
    h += '</div>';
  }
  if (db.pricingComps && db.pricingComps.length) {
    h += sectionLabel('Pricing Model Comps');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;font-size:6.5px;">Company</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Model</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Est. ACV</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">NRR Signal</th>
      </tr></thead><tbody>`;
    db.pricingComps.forEach((c,i) => {
      const nrrCol = c.nrrSignal === 'strong' ? V.green : c.nrrSignal === 'moderate' ? V.amber : V.red;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:600;">${c.company}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;">${c.model}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;">${c.avcEst||c.avgACV||'—'}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;color:${nrrCol};">${c.nrrSignal}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  return h;
}

function renderRevenueSaaS(db) {
  let h = '';
  if (db.arrTriangulation && db.arrTriangulation.length) {
    h += sectionLabel('ARR Triangulation — Three Methods');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;font-size:6.5px;">Method</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Estimate</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Confidence</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Basis</th>
      </tr></thead><tbody>`;
    db.arrTriangulation.forEach((m,i) => {
      const confCol = m.confidence === 'H' ? V.green : m.confidence === 'M' ? V.amber : V.red;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:600;">${m.method}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:800;color:${V.navy};">${m.estimate}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;color:${confCol};">${m.confidence}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-size:6.5px;">${m.basis}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  if (db.ruleOf40Comps && db.ruleOf40Comps.length) {
    h += sectionLabel('Rule of 40 — Peer Benchmark');
    const maxR40 = Math.max(...db.ruleOf40Comps.map(c => Math.abs(c.ruleOf40||0)), 40);
    db.ruleOf40Comps.forEach(c => {
      const r40 = c.ruleOf40 || 0;
      const col = r40 >= 40 ? V.green : r40 >= 20 ? V.amber : V.red;
      const pct = Math.min(Math.abs(r40)/maxR40*100, 100);
      h += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
        <div style="width:80px;font-size:7px;color:${V.inkMid};flex-shrink:0;">${c.company}</div>
        <div style="flex:1;height:10px;background:${V.sand};border-radius:2px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${col};border-radius:2px;"></div>
        </div>
        <span style="font-size:7px;font-weight:800;color:${col};width:30px;text-align:right;">${r40}</span>
      </div>`;
    });
    h += `<div style="font-size:6px;color:${V.inkFaint};margin-top:4px;">Rule of 40 = Growth% + FCF Margin%. Best-in-class ≥ 40.</div>`;
  }
  return h;
}

function renderCustomerSaaS(db) {
  let h = '';
  if (db.segmentMap && db.segmentMap.length) {
    h += sectionLabel('Customer Segment Map');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;font-size:6.5px;">Segment</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Size</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Retention</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Expansion</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Verdict</th>
      </tr></thead><tbody>`;
    db.segmentMap.forEach((s,i) => {
      const vColors = { engine: V.green, neutral: V.amber, anchor: V.red };
      const vc = vColors[s.verdict] || V.inkMid;
      const sig = v => v === 'strong' ? `<span style="color:${V.green}">●</span>` : v === 'moderate' ? `<span style="color:${V.amber}">●</span>` : `<span style="color:${V.red}">●</span>`;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:600;">${s.segment}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${s.sizeEst}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${sig(s.retentionSignal)}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${sig(s.expansionSignal)}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;color:${vc};">${s.verdict}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  if (db.churnDrivers && db.churnDrivers.length) {
    h += sectionLabel('Top Churn Drivers');
    db.churnDrivers.forEach(d => {
      const sc = d.severity === 'H' ? V.red : d.severity === 'M' ? V.amber : V.inkFaint;
      h += `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;padding:5px 7px;background:${V.parchment};border-left:3px solid ${sc};border-radius:2px;">
        <span style="font-size:8px;color:${sc};flex-shrink:0;font-weight:800;">[${d.severity}]</span>
        <div style="flex:1;">
          <div style="font-size:7px;font-weight:600;color:${V.ink};">${d.driver}</div>
          <div style="font-size:6.5px;color:${V.inkFaint};">Segment: ${d.segment} · Fix: ${d.mitigation}</div>
        </div>
      </div>`;
    });
  }
  return h;
}

function renderCompetitiveSaaS(db) {
  let h = '';
  if (db.competitorBattlecard && db.competitorBattlecard.length) {
    h += sectionLabel('Competitor Battlecard');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;font-size:6.5px;">Competitor</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Revenue</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Attack Vector</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Vulnerability</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Threat</th>
      </tr></thead><tbody>`;
    db.competitorBattlecard.forEach((c,i) => {
      const tc = c.threat === 'H' ? V.red : c.threat === 'M' ? V.amber : V.green;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:600;">${c.competitor}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${fmtMoney(c.revenueM)}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-size:6.5px;">${c.attackVector}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-size:6.5px;">${c.vulnerability}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:800;color:${tc};">${c.threat}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  if (db.moatComponents && db.moatComponents.length) {
    h += sectionLabel('Moat Durability');
    db.moatComponents.forEach(m => {
      const str = Math.min(m.strength||0,10);
      const col = str>=7?V.green:str>=4?V.amber:V.red;
      h += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
        <div style="width:120px;font-size:7px;color:${V.inkMid};flex-shrink:0;">${m.component}</div>
        <div style="flex:1;height:8px;background:${V.sand};border-radius:4px;overflow:hidden;"><div style="width:${str*10}%;height:100%;background:${col};border-radius:4px;"></div></div>
        <span style="font-size:6.5px;color:${V.inkFaint};width:80px;text-align:right;">${m.replicableIn}</span>
      </div>`;
    });
  }
  return h;
}

function renderFundingSaaS(db) {
  let h = '';
  if (db.exitScenarios && db.exitScenarios.length) {
    h += sectionLabel('Exit Scenario Analysis');
    db.exitScenarios.forEach(s => {
      const pct = Math.round(s.probability||0);
      const col = pct >= 50 ? V.blue : pct >= 25 ? V.inkMid : V.inkFaint;
      h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;padding:6px 8px;background:${V.parchment};border:1px solid ${V.sand};border-radius:3px;">
        <div style="width:100px;font-size:7px;font-weight:700;color:${V.navy};flex-shrink:0;">${s.outcome}</div>
        <div style="width:120px;flex-shrink:0;">
          <div style="height:8px;background:${V.sand};border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${col};border-radius:4px;"></div></div>
          <div style="font-size:6px;color:${V.inkFaint};margin-top:1px;">${pct}% probability</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:7px;font-weight:600;color:${V.blue};">${s.valuationRangeM} · ${s.likelyBuyer}</div>
          <div style="font-size:6.5px;color:${V.inkMid};">${s.rationale}</div>
        </div>
      </div>`;
    });
  }
  if (db.compTable && db.compTable.length) {
    h += sectionLabel('Transaction Comps');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;font-size:6.5px;">Company</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">ARR</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Multiple</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Outcome</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Acquirer</th>
      </tr></thead><tbody>`;
    db.compTable.forEach((c,i) => {
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:600;">${c.company}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${fmtMoney(c.arrM)}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;">${c.multiple ? c.multiple+'x' : '—'}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${c.outcome}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;">${c.acquirer||'—'}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  return h;
}

function renderPricingSaaS(db) {
  let h = '';
  if (db.pricingModelAssessment && db.pricingModelAssessment.length) {
    h += sectionLabel('Pricing Model Assessment');
    const vColors = { good: V.green, neutral: V.amber, problem: V.red };
    db.pricingModelAssessment.forEach(d => {
      const col = vColors[d.verdict] || V.inkMid;
      const str = Math.min(d.score||0,10);
      h += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <div style="width:130px;font-size:7px;color:${V.inkMid};flex-shrink:0;">${d.dimension}</div>
        <div style="flex:1;height:8px;background:${V.sand};border-radius:4px;overflow:hidden;"><div style="width:${str*10}%;height:100%;background:${col};border-radius:4px;"></div></div>
        <span style="font-size:6.5px;font-weight:700;color:${col};width:50px;text-align:right;">${d.verdict}</span>
      </div>`;
      if (d.evidence) h += `<div style="font-size:6px;color:${V.inkFaint};padding:0 0 3px 136px;">${d.evidence}</div>`;
    });
  }
  if (db.pricingComps && db.pricingComps.length) {
    h += sectionLabel('Pricing Benchmarks');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;font-size:6.5px;">Company</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Model</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Avg ACV</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Lesson</th>
      </tr></thead><tbody>`;
    db.pricingComps.forEach((c,i) => {
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:600;">${c.company}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;">${c.model}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;">${c.avgACV||c.avcEst||'—'}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-size:6.5px;">${c.lesson||'—'}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  return h;
}

function renderIntlSaaS(db) {
  let h = '';
  if (db.globalBenchmarks && db.globalBenchmarks.length) {
    h += sectionLabel('Global Benchmarks');
    db.globalBenchmarks.forEach((b,i) => {
      const outcomeCol = b.outcome === 'succeeded' ? V.green : b.outcome === 'failed' ? V.red : V.amber;
      h += `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:5px;padding:6px 8px;background:${V.parchment};border:1px solid ${V.sand};border-radius:3px;">
        <div style="width:80px;flex-shrink:0;">
          <div style="font-size:7.5px;font-weight:800;color:${V.navy};">${b.company}</div>
          <div style="font-size:6px;color:${outcomeCol};font-weight:700;">${b.outcome}</div>
          <div style="font-size:6px;color:${V.inkFaint};">${b.market}</div>
        </div>
        <div style="flex:1;font-size:7px;color:${V.inkMid};">
          <span style="font-weight:700;color:${V.blue};">Lesson: </span>${b.lesson}
        </div>
        <span style="font-size:6px;font-family:monospace;color:${V.inkFaint};flex-shrink:0;">[${b.similarity}]</span>
      </div>`;
    });
  }
  if (db.expansionMarkets && db.expansionMarkets.length) {
    h += sectionLabel('Expansion Market Priorities');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">
      <thead><tr>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;font-size:6.5px;">#</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Market</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">TAM</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:center;">Readiness</th>
        <th style="background:#0f1f3d !important;color:#fff !important;padding:5px 8px;text-align:left;">Main Barrier</th>
      </tr></thead><tbody>`;
    db.expansionMarkets.forEach((m,i) => {
      const rc = m.readiness === 'H' ? V.green : m.readiness === 'M' ? V.amber : V.red;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:800;color:${V.blue};">${m.priority||i+1}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-weight:600;">${m.market}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;">${m.tam}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;text-align:center;font-weight:700;color:${rc};">${m.readiness}</td>
        <td style="padding:4px 7px;background:${i%2?'#f0f4ff':'#fff'};border:1px solid #dbeafe;font-size:6.5px;">${m.barrier}</td>
      </tr>`;
    });
    h += '</tbody></table>';
  }
  return h;
}

function renderSynopsisSaaS(db) {
  let h = '';
  // 9-agent verdict grid
  if (db.agentVerdicts && db.agentVerdicts.length) {
    h += sectionLabel('9-Agent Verdict Dashboard');
    const vColors = { STRONG:'#059669', WATCH:'#d97706', OPTIMISE:'#2563eb', UNDERDELIVERED:'#dc2626', RISK:'#dc2626' };
    h += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:10px;">`;
    db.agentVerdicts.forEach(a => {
      const vc = vColors[a.verdict] || V.inkMid;
      h += `<div style="background:${V.parchment};border:1px solid ${V.sand};border-top:3px solid ${vc};border-radius:3px;padding:6px 7px;">
        <div style="font-size:6px;font-family:monospace;letter-spacing:.1em;color:${V.inkFaint};text-transform:uppercase;">${a.agent}</div>
        <div style="font-size:7.5px;font-weight:800;color:${vc};margin:2px 0;">${a.verdict}</div>
        <div style="font-size:6.5px;color:${V.inkMid};line-height:1.4;">${a.oneLiner}</div>
      </div>`;
    });
    h += '</div>';
  }
  // Top actions
  if (db.topActions && db.topActions.length) {
    h += sectionLabel('Top 5 Priority Actions');
    db.topActions.forEach(a => {
      const effortCol = a.effort === 'H' ? V.red : a.effort === 'M' ? V.amber : V.green;
      h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;padding:5px 8px;background:${V.parchment};border:1px solid ${V.sand};border-radius:3px;">
        <span style="width:16px;height:16px;border-radius:50%;background:${V.blue};color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${a.rank}</span>
        <div style="flex:1;font-size:7px;color:${V.ink};">${a.action}</div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:7px;font-weight:700;color:${V.blue};">${a.impactM ? fmtMoney(a.impactM)+' impact' : ''}</div>
          <div style="font-size:6px;color:${effortCol};">effort: ${a.effort} · ${a.quarter}</div>
        </div>
      </div>`;
    });
  }
  // Risks and opportunities
  if ((db.risks && db.risks.length) || (db.opportunities && db.opportunities.length)) {
    h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">`;
    if (db.risks && db.risks.length) {
      h += `<div><div style="font-family:monospace;font-size:6.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${V.red};margin-bottom:5px;">Risks</div>`;
      db.risks.forEach(r => {
        const sc = r.severity==='H'?V.red:r.severity==='M'?V.amber:V.inkFaint;
        h += `<div style="display:flex;gap:5px;margin-bottom:3px;"><span style="font-size:7px;color:${sc};font-weight:800;">[${r.severity}]</span><div style="flex:1;font-size:6.5px;color:${V.inkMid};">${r.risk}<span style="color:${V.inkFaint}"> · ${r.mitigation}</span></div></div>`;
      });
      h += '</div>';
    }
    if (db.opportunities && db.opportunities.length) {
      h += `<div><div style="font-family:monospace;font-size:6.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${V.green};margin-bottom:5px;">Opportunities</div>`;
      db.opportunities.forEach(o => {
        const oc = o.confidence==='H'?V.green:o.confidence==='M'?V.amber:V.inkFaint;
        h += `<div style="display:flex;gap:5px;margin-bottom:3px;"><span style="font-size:7px;color:${oc};font-weight:800;">[${o.confidence}]</span><div style="flex:1;font-size:6.5px;color:${V.inkMid};">${o.opportunity}${o.valueM ? ' · '+fmtMoney(o.valueM) : ''}</div></div>`;
      });
      h += '</div>';
    }
    h += '</div>';
  }

  return h;
}

function renderSaaSFallback(agentId) {
  return `<div style="padding:10px;background:#fef3c7;border:1px solid #fcd34d;border-radius:3px;margin-bottom:8px;">
    <div style="font-size:7px;font-weight:700;color:#92400e;font-family:monospace;">DATA BLOCK NOT YET AVAILABLE</div>
    <div style="font-size:6.5px;color:#78350f;margin-top:2px;">Agent ${agentId} analysis will appear in the prose section below once complete.</div>
  </div>`;
}

function renderSaaSAgentVisuals(agentId, db) {
  CUR = '$'; UNIT = 'M';
  if (!db) return renderSaaSFallback(agentId);
  let h = '';
  // Synopsis: skip generic KPI tiles — the agentVerdicts grid is more informative
  if (agentId !== 'synopsis') h += renderSaaSKPIs(db.kpis);
  // Revenue: add a triangulation consensus row after KPI tiles
  if (agentId === 'revenue' && db.arrTriangulation && db.arrTriangulation.length) {
    const estimates = db.arrTriangulation.map(m => m.estimate).filter(Boolean);
    if (estimates.length >= 2) {
      h += `<div style="display:flex;align-items:center;gap:8px;padding:5px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:3px;margin-bottom:8px;">
        <span style="font-size:7px;font-weight:700;color:${V.blue};font-family:monospace;letter-spacing:.06em;flex-shrink:0;">3-METHOD CONSENSUS</span>
        <div style="display:flex;gap:8px;flex:1;">
          ${db.arrTriangulation.map(m => `<span style="font-size:7px;color:${V.inkMid};">${m.method.split(' ')[0]}: <strong style="color:${V.navy};">${m.estimate}</strong> <span style="font-size:6px;color:${m.confidence==='H'?V.green:m.confidence==='M'?V.amber:V.red};">[${m.confidence}]</span></span>`).join('<span style="color:#ddd;">|</span>')}
        </div>
      </div>`;
    }
  }
  switch(agentId) {
    case 'market':      h += renderMarketSaaS(db); break;
    case 'product':     h += renderProductSaaS(db); break;
    case 'gtm':         h += renderGTMSaaS(db); break;
    case 'revenue':     h += renderRevenueSaaS(db); break;
    case 'customer':    h += renderCustomerSaaS(db); break;
    case 'competitive': h += renderCompetitiveSaaS(db); break;
    case 'funding':     h += renderFundingSaaS(db); break;
    case 'pricing':     h += renderPricingSaaS(db); break;
    case 'intl':        h += renderIntlSaaS(db); break;
    case 'synopsis':    h += renderSynopsisSaaS(db); break;
    default: break;
  }
  h += renderSaaSVerdict(db.verdictRow);
  return h;
}



// ── SAAS OPPORTUNITY BRIEF HTML BUILDER ──────────────────────────────────────
function buildSaaSBriefHtml({ company, acquirer, sector, stage, results, dataBlocks, companyMode='standalone' }) {
  const db = dataBlocks['brief'] || {};
  const raw = results['brief'] || '';

  const boldMatch = raw.match(/BOLD STATEMENT[:\s]*\n([^\n]+)/i);
  const boldStatement = boldMatch ? boldMatch[1].trim().replace(/^\*+|\*+$/g,'') : (db.boldStatement || '');

  const kpis          = Array.isArray(db.kpis)             ? db.kpis             : [];
  const radarAxes     = Array.isArray(db.radarAxes)        ? db.radarAxes        : [];
  const segmentMap    = Array.isArray(db.segmentMap)       ? db.segmentMap       : [];
  const revenueGaps   = Array.isArray(db.revenueGaps)      ? db.revenueGaps      : [];
  const marketSignals    = Array.isArray(db.marketSignals)      ? db.marketSignals      : [];
  const arrivalSequence  = Array.isArray(db.arrivalSequence)    ? db.arrivalSequence    : [];
  const competitiveEdge  = Array.isArray(db.competitiveEdge)    ? db.competitiveEdge    : [];
  const moves         = Array.isArray(db.moves)            ? db.moves            : [];
  const competitors   = Array.isArray(db.competitorThreats)? db.competitorThreats: [];
  const globalComps   = Array.isArray(db.globalComps)      ? db.globalComps      : [];
  const categoryRead  = db.categoryRead || null;
  const sectionHdrs   = db.sectionHeaders || {};
  const tension       = db.strategicTension || '';

  const dateStr = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  const subtitleLine = [sector, stage, acquirer ? `Acquirer: ${acquirer}` : null].filter(Boolean).join(' · ');

  // ── COLOUR PALETTE (navy/blue for SaaS) ─────────────────────────────
  const C = {
    navy:    '#0f1f3d', navyMid: '#1e3a5f',
    blue:    '#2563eb', blueMid: '#3b82f6', blueLight: '#dbeafe',
    purple:  '#7c3aed', purpleLight: '#ede9fe',
    green:   '#059669', amber: '#d97706', red: '#dc2626',
    ink:     '#1a1a2e', inkMid: '#4a5568', inkFaint: '#9aa5b4',
    sand:    '#e2e8f0', parchment: '#f8fafc', white: '#ffffff',
  };

  // Play type config
  const playConfig = {
    SCALE:     { colour: C.navy,   icon: '⚡', label: 'SCALE',     sub: 'Extend existing motion' },
    TRANSFORM: { colour: C.purple, icon: '◈', label: 'TRANSFORM', sub: 'New capability required' },
    DEFEND:    { colour: C.red,    icon: '◇', label: 'DEFEND',    sub: 'Protect before expanding' },
  };
  const playShort = { SCALE:'SCL', TRANSFORM:'TRF', DEFEND:'DEF' };

  const pageStyle = `width:794px;min-height:1123px;background:#fff;padding:36px;box-sizing:border-box;position:relative;font-family:'Instrument Sans',sans-serif;color:${C.ink};`;

  // ── KPI STRIP ─────────────────────────────────────────────────────────
  function renderKPIs(kpis) {
    if (!kpis.length) return '';
    const confCol = k => k.confidence==='H'?C.green:k.confidence==='M'?C.amber:C.red;
    const trendArrow = t => ({up:`<span style="color:${C.green};font-size:9px;">↑</span>`,down:`<span style="color:${C.red};font-size:9px;">↓</span>`,watch:`<span style="color:${C.amber};font-size:9px;">⚠</span>`})[t]||'';
    let h = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">`;
    kpis.slice(0,4).forEach(k => {
      h += `<div style="background:${C.parchment};border:1px solid ${C.sand};border-left:3px solid ${confCol(k)};border-radius:3px;padding:8px 10px;">
        <div style="font-size:6.5px;font-family:monospace;letter-spacing:.12em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:3px;">${k.label||''}</div>
        <div style="font-size:16px;font-weight:800;color:${C.navy};line-height:1;">${k.value||'—'}${trendArrow(k.trend)}</div>
        <div style="font-size:6.5px;color:${C.inkMid};margin-top:2px;white-space:normal;">${k.sub||''}</div>
        <span style="background:${confCol(k)};color:#fff;font-size:6px;font-weight:700;padding:1px 4px;border-radius:2px;margin-top:4px;display:inline-block;">${k.confidence||'M'}</span>
      </div>`;
    });
    h += '</div>';
    return h;
  }

  // ── COMPETITIVE EDGE ─────────────────────────────────────────────────────
  // ── ARRIVAL SEQUENCE TABLE ─────────────────────────────────────────────
  function renderArrivalSequence(seq) {
    if (!seq.length) return '';
    const mktCol = { US:'#1a3a5c', EU:'#1e3a5f', IL:'#7c3aed', SEA:'#059669', IN:'#d97706' };
    const confCol = { H: C.navy, M: C.amber, L: '#bbb' };
    let h = `<table style="width:100%;border-collapse:collapse;font-size:7px;">
      <thead><tr style="background:${C.navy};color:#fff;">
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;width:35px;font-family:monospace;">MKT</th>
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;width:120px;font-family:monospace;">SHIFT ARRIVING</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;width:65px;font-family:monospace;">BY</th>
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">HOW IT ENTERS</th>
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">COMPANY MUST DO</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;width:35px;font-family:monospace;">CONF</th>
      </tr></thead><tbody>`;
    seq.slice(0,5).forEach((s, i) => {
      const bg = i%2===0?'#fff':C.parchment;
      const mc = mktCol[s.market] || C.navy;
      const cc = confCol[s.confidence] || C.amber;
      h += `<tr>
        <td style="padding:5px 8px;background:${bg};text-align:center;"><span style="background:${mc};color:#fff;font-size:6px;font-weight:800;padding:2px 5px;border-radius:2px;font-family:monospace;">${s.market||'?'}</span></td>
        <td style="padding:5px 8px;background:${bg};font-weight:700;color:${C.navy};white-space:normal;font-size:7px;">${s.format||''}</td>
        <td style="padding:5px 8px;background:${bg};text-align:center;font-weight:700;color:${C.red};font-size:7px;">${s.inflection||'—'}</td>
        <td style="padding:5px 8px;background:${bg};color:${C.inkMid};font-size:6.5px;white-space:normal;">${s.entryMechanism||''}</td>
        <td style="padding:5px 8px;background:${bg};color:${C.navy};font-size:6.5px;font-weight:600;font-style:italic;white-space:normal;">${s.companyResponse||''}</td>
        <td style="padding:5px 8px;background:${bg};text-align:center;"><span style="background:${cc};color:#fff;font-size:6px;font-weight:700;padding:1px 4px;border-radius:2px;">${s.confidence||'M'}</span></td>
      </tr>`;
    });
    h += '</tbody></table>';
    return h;
  }

  function renderCompetitiveEdge(assets) {
    if (!assets.length) return '';
    const statusCol = { untapped: C.red, partial: C.amber };
    return `<div style="display:grid;grid-template-columns:repeat(${Math.min(assets.length,3)},1fr);gap:8px;">` +
      assets.slice(0,3).map(a => {
        const sc = statusCol[a.status] || C.amber;
        return `<div style="background:#fff;border:1px solid ${C.sand};border-radius:3px;padding:8px 10px;border-top:2.5px solid ${sc};">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <span style="background:${sc}22;color:${sc};font-size:6px;font-weight:800;padding:1px 5px;border-radius:2px;text-transform:uppercase;font-family:monospace;">${a.status||''}</span>
          </div>
          <div style="font-size:8px;font-weight:800;color:${C.navy};margin-bottom:3px;white-space:normal;">${a.asset||''}</div>
          <div style="font-size:7px;color:${C.inkMid};line-height:1.3;margin-bottom:4px;white-space:normal;">${a.whatItUnlocks||''}</div>
          <div style="font-size:6.5px;color:${C.blue};font-weight:600;border-top:1px solid ${C.sand};padding-top:4px;white-space:normal;font-family:monospace;">→ ${a.activationPath||''}</div>
        </div>`;
      }).join('') + '</div>';
  }

  // ── SEGMENT COVERAGE MAP (replaces occasion wheel — table format) ──────
  function renderSegmentMap(segs) {
    if (!segs.length) return '';
    const statusCol = { owned: C.green, partial: C.amber, at_risk: C.red };
    const statusLabel = { owned: 'OWNED', partial: 'PARTIAL', at_risk: 'AT RISK' };
    let h = `<table style="width:100%;border-collapse:collapse;font-size:7.5px;">
      <thead><tr>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">SEGMENT</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:right;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">$M TAM</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">STATUS</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">THREAT / OWNER</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">GROWTH</th>
      </tr></thead><tbody>`;
    segs.forEach((s, i) => {
      const bg = i % 2 === 0 ? '#fff' : C.parchment;
      const sc = statusCol[s.status] || C.inkMid;
      const sl = statusLabel[s.status] || s.status;
      const gc = s.growth === 'high' ? C.green : s.growth === 'medium' ? C.amber : C.inkFaint;
      h += `<tr>
        <td style="padding:5px 8px;background:${bg};font-weight:700;color:${C.navy};white-space:normal;">${s.segment||''}</td>
        <td style="padding:5px 8px;background:${bg};text-align:right;font-weight:700;">$${s.sizeMr||'—'}M</td>
        <td style="padding:5px 8px;background:${bg};"><span style="background:${sc}22;color:${sc};font-size:6px;font-weight:800;padding:2px 5px;border-radius:2px;font-family:monospace;">${sl}</span></td>
        <td style="padding:5px 8px;background:${bg};font-size:7px;color:${C.inkMid};white-space:normal;">${s.threat||'—'}</td>
        <td style="padding:5px 8px;background:${bg};"><span style="color:${gc};font-size:7px;font-weight:700;">${(s.growth||'').toUpperCase()}</span></td>
      </tr>`;
    });
    h += '</tbody></table>';
    return h;
  }

  // ── REVENUE GAP TABLE ───────────────────────────────────────────────────
  function renderRevenueGaps(gaps) {
    if (!gaps.length) return '';
    let h = `<table style="width:100%;border-collapse:collapse;font-size:7.5px;">
      <thead><tr>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">GAP</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:right;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">ARR GAP</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">PLAY</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">MECHANISM</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">CONF</th>
      </tr></thead><tbody>`;
    gaps.slice(0,5).forEach((g, i) => {
      const bg = i % 2 === 0 ? '#fff' : C.parchment;
      const pc = playConfig[g.playType] || playConfig.SCALE;
      const ps = playShort[g.playType] || g.playType;
      const cc = g.confidence==='H'?C.green:g.confidence==='M'?C.amber:C.red;
      h += `<tr>
        <td style="padding:5px 8px;background:${bg};border-left:3px solid ${pc.colour};">
          <div style="font-weight:700;color:${C.navy};font-size:7.5px;white-space:normal;">${g.gap||''}</div>
          <div style="font-size:6px;color:${C.inkFaint};margin-top:1px;">${g.currentMotion||''}</div>
        </td>
        <td style="padding:5px 8px;background:${bg};text-align:right;font-weight:800;font-size:9px;color:${C.navy};">$${g.arrGapM||'—'}M</td>
        <td style="padding:5px 8px;background:${bg};"><span style="background:${pc.colour};color:#fff;font-size:6px;font-weight:800;padding:2px 4px;border-radius:2px;font-family:monospace;">${ps}</span></td>
        <td style="padding:5px 8px;background:${bg};font-size:6.5px;color:${C.inkMid};white-space:normal;">${g.mechanism||''}</td>
        <td style="padding:5px 8px;background:${bg};"><span style="background:${cc};color:#fff;font-size:6px;font-weight:700;padding:1px 4px;border-radius:2px;">${g.confidence||'M'}</span></td>
      </tr>`;
    });
    h += '</tbody></table>';
    return h;
  }

  // ── MARKET SIGNAL TABLE (mirrors consumer trend table) ─────────────────
  function renderMarketSignals(signals) {
    if (!signals.length) return '';
    const momentumCol = { accelerating: C.green, building: C.blue, mainstream: C.navy, emerging: C.amber, declining: C.red };
    const momentumW = { accelerating:90, building:70, mainstream:100, emerging:40, declining:20 };
    let h = `<table style="width:100%;border-collapse:collapse;font-size:7px;">
      <thead><tr style="background:${C.navy};color:#fff;">
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:110px;">SIGNAL</th>
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">EVIDENCE</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:80px;">NOW</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:80px;">18MO</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:40px;">MKT</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:50px;">PLAY</th>
      </tr></thead><tbody>`;
    signals.slice(0,6).forEach((s, i) => {
      const bg = i%2===0?'#fff':C.parchment;
      const nowCol = momentumCol[s.momentum] || C.inkMid;
      const futCol = momentumCol[s.months18] || C.inkMid;
      const nowW = momentumW[s.momentum] || 50;
      const futW = momentumW[s.months18] || 50;
      const arrow = futW > nowW ? '↑' : futW < nowW ? '↓' : '→';
      const pc = playConfig[s.playType] || playConfig.SCALE;
      const ps = playShort[s.playType] || s.playType;
      const mktCol = { US:'#1a3a5c', EU:'#1e3a5f', IL:'#2563eb', SEA:'#059669', IN:'#d97706' };
      const mc = mktCol[s.sourceMarket] || C.navy;
      h += `<tr>
        <td style="padding:5px 8px;background:${bg};">
          <div style="font-weight:700;color:${C.navy};">${s.signal||''}</div>
          ${s.headroomPct != null ? `<div style="margin-top:3px;background:${C.sand};border-radius:2px;height:3px;"><div style="background:${C.blue};width:${Math.min(s.headroomPct,100)}%;height:3px;border-radius:2px;"></div></div><div style="font-size:6px;color:${C.blue};margin-top:1px;">${s.headroomPct}% headroom</div>` : ''}
        </td>
        <td style="padding:5px 8px;background:${bg};color:${C.inkMid};white-space:normal;">${s.evidence||''}</td>
        <td style="padding:5px 8px;background:${bg};text-align:center;">
          <div style="background:${C.sand};border-radius:2px;height:4px;margin-bottom:2px;"><div style="background:${nowCol};width:${nowW}%;height:4px;border-radius:2px;"></div></div>
          <div style="font-size:6px;color:${nowCol};font-weight:700;text-transform:uppercase;">${s.momentum||''}</div>
        </td>
        <td style="padding:5px 8px;background:${bg};text-align:center;">
          <div style="background:${C.sand};border-radius:2px;height:4px;margin-bottom:2px;"><div style="background:${futCol};width:${futW}%;height:4px;border-radius:2px;"></div></div>
          <div style="font-size:6px;color:${futCol};font-weight:700;">${arrow} ${s.months18||''}</div>
        </td>
        <td style="padding:5px 8px;background:${bg};text-align:center;"><span style="background:${mc};color:#fff;font-size:6px;font-weight:800;padding:2px 4px;border-radius:2px;font-family:monospace;">${s.sourceMarket||''}</span></td>
        <td style="padding:5px 8px;background:${bg};text-align:center;"><span style="background:${pc.colour};color:#fff;font-size:6px;font-weight:800;padding:2px 3px;border-radius:2px;font-family:monospace;">${ps}</span></td>
      </tr>`;
    });
    h += '</tbody></table>';
    return h;
  }

  // ── RADAR ────────────────────────────────────────────────────────────────
  function renderRadar(axes) {
    if (!axes || axes.length < 3) return '<div style="height:200px;display:flex;align-items:center;justify-content:center;color:#999;font-size:10px;">No radar data</div>';
    const n = axes.length;
    const CX=130, CY=115, R=85, LABEL_R=108;
    const toRad = deg => (deg - 90) * Math.PI / 180;
    const pt = (val, i) => {
      const angle = toRad((360/n)*i);
      const r = (val/100)*R;
      return [CX + r*Math.cos(angle), CY + r*Math.sin(angle)];
    };
    const todayPts = axes.map((a,i) => pt(a.today||0, i));
    const futurePts = axes.map((a,i) => pt(a.future||0, i));
    const toPath = pts => pts.map((p,i)=>`${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')+'Z';
    let svg = `<svg viewBox="0 0 260 250" xmlns="http://www.w3.org/2000/svg" style="width:260px;height:250px;">`;
    [20,40,60,80,100].forEach(pct => {
      const r = (pct/100)*R;
      const pts2 = axes.map((_,i)=>{const a=toRad((360/n)*i);return `${(CX+r*Math.cos(a)).toFixed(1)},${(CY+r*Math.sin(a)).toFixed(1)}`;});
      svg += `<polygon points="${pts2.join(' ')}" fill="none" stroke="${C.sand}" stroke-width="0.8"/>`;
    });
    axes.forEach((_,i)=>{
      const [x,y]=pt(100,i);
      svg += `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.sand}" stroke-width="0.8"/>`;
    });
    svg += `<path d="${toPath(todayPts)}" fill="${C.navy}25" stroke="${C.navy}" stroke-width="1.5"/>`;
    svg += `<path d="${toPath(futurePts)}" fill="${C.blue}25" stroke="${C.blue}" stroke-width="1.5" stroke-dasharray="4,2"/>`;
    axes.forEach((ax,i)=>{
      const angle = toRad((360/n)*i);
      const lx = CX + LABEL_R*Math.cos(angle);
      const ly = CY + LABEL_R*Math.sin(angle);
      const anchor = Math.cos(angle)>0.1?'start':Math.cos(angle)<-0.1?'end':'middle';
      const label = (ax.axis||'').slice(0,16);
      const words = label.split(' ');
      const todayScore  = Math.round(ax.today||0);
      const futureScore = Math.round(ax.future||0);
      const delta = futureScore - todayScore;
      const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
      const deltaCol = delta > 0 ? C.navy : '#dc2626';
      // Bottom-pointing axes: extra yOff so score clears viewBox
      const isBottom = Math.sin(angle * Math.PI / 180) > 0.6;
      const yOff = isBottom ? 8 : 0;
      if (words.length > 1) {
        svg += `<text x="${lx.toFixed(1)}" y="${(ly - 2 + yOff).toFixed(1)}" text-anchor="${anchor}" font-size="7" font-weight="700" fill="${C.navy}" font-family="monospace">${words[0]}</text>`;
        svg += `<text x="${lx.toFixed(1)}" y="${(ly + 7 + yOff).toFixed(1)}" text-anchor="${anchor}" font-size="7" font-weight="700" fill="${C.navy}" font-family="monospace">${words.slice(1).join(' ')}</text>`;
        svg += `<text x="${lx.toFixed(1)}" y="${(ly + 16 + yOff).toFixed(1)}" text-anchor="${anchor}" font-size="6.5" font-weight="700" fill="${deltaCol}" font-family="monospace">${todayScore}→${futureScore} (${deltaStr})</text>`;
      } else {
        svg += `<text x="${lx.toFixed(1)}" y="${(ly + 3 + yOff).toFixed(1)}" text-anchor="${anchor}" font-size="7" font-weight="700" fill="${C.navy}" font-family="monospace">${label}</text>`;
        svg += `<text x="${lx.toFixed(1)}" y="${(ly + 12 + yOff).toFixed(1)}" text-anchor="${anchor}" font-size="6.5" font-weight="700" fill="${deltaCol}" font-family="monospace">${todayScore}→${futureScore} (${deltaStr})</text>`;
      }
    });
    svg += '</svg>';
    return svg;
  }

  // ── MOVE CARDS ───────────────────────────────────────────────────────────
  function renderMoveCards(moves) {
    if (!moves.length) return '';
    const confCol = c => ({CONFIRMED:C.green,DERIVED:C.blue,ESTIMATED:C.amber,'SIGNAL ONLY':C.red})[c]||C.amber;
    const filterLabels = { A:'₹×Speed', B:'Gap×Right', C:'Trend-Timed' };
    const filterColour = { A:C.green, B:C.blue, C:C.purple };
    return moves.slice(0,3).map((m,i) => {
      const pcfg = playConfig[m.playType] || playConfig.SCALE;
      const conf = m.confidence || 'ESTIMATED';
      const cc = confCol(conf);
      const numLabel = ['①','②','③'][i]||`${i+1}`;
      const filters = Array.isArray(m.filters)?m.filters:[];
      const orgInstr = m.orgInstruction||'';
      const scaling = m.mechanism||'';
      return `<div style="background:#fff;border:1px solid ${C.sand};border-radius:4px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="background:${pcfg.colour};padding:6px 10px;display:flex;align-items:center;gap:6px;">
          <span style="font-size:7.5px;font-weight:800;color:#fff;letter-spacing:.08em;font-family:monospace;">${pcfg.icon} ${pcfg.label}</span>
          <span style="font-size:6px;color:rgba(255,255,255,.6);font-style:italic;">${pcfg.sub}</span>
        </div>
        <div style="padding:8px 10px;flex:1;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;align-items:flex-start;gap:6px;">
            <span style="font-size:13px;color:${pcfg.colour};line-height:1;flex-shrink:0;">${numLabel}</span>
            <span style="font-size:9px;font-weight:800;color:${C.navy};line-height:1.2;white-space:normal;">${m.title||''}</span>
          </div>
          <div style="font-size:6.5px;color:${C.inkMid};font-style:italic;white-space:normal;">${m.segment||''}</div>
          <div style="display:flex;align-items:baseline;gap:4px;">
            <span style="font-size:16px;font-weight:900;color:${C.navy};line-height:1;">$${m.arrImpactM||'?'}</span>
            <span style="font-size:7px;color:${C.inkFaint};">M ARR</span>
            <span style="background:${cc};color:#fff;font-size:6px;font-weight:700;padding:1px 4px;border-radius:2px;margin-left:4px;">${conf}</span>
          </div>
          <div style="font-size:7px;color:${C.inkFaint};">First revenue: <strong style="color:${C.navy};">${m.timeToRevenue||'TBD'}</strong></div>
          <div style="font-size:7.5px;color:${C.navy};font-weight:600;line-height:1.4;border-left:2px solid ${pcfg.colour};padding-left:5px;white-space:normal;">${m.rationale||''}</div>
          ${orgInstr ? `<div style="margin-top:3px;"><div style="font-size:6px;font-weight:800;letter-spacing:.08em;color:${pcfg.colour};margin-bottom:2px;font-family:monospace;">ORG CHANGE</div><div style="font-size:7px;color:${C.inkMid};white-space:normal;">${orgInstr}</div></div>` : ''}
          ${scaling ? `<div style="font-size:6.5px;color:${C.inkFaint};white-space:normal;"><span style="font-weight:700;color:${C.inkMid};">Motion:</span> ${scaling}</div>` : ''}
          <div style="font-size:6.5px;color:${C.inkFaint};border-top:1px solid ${C.sand};padding-top:4px;margin-top:auto;white-space:normal;">${m.evidence||''}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${filters.map(f=>`<span style="background:${filterColour[f]||C.navy}22;color:${filterColour[f]||C.navy};border:1px solid ${filterColour[f]||C.navy}55;font-size:6px;font-weight:700;padding:1px 4px;border-radius:2px;font-family:monospace;">${filterLabels[f]||f}</span>`).join('')}
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // ── GLOBAL COMP STRIP ────────────────────────────────────────────────────
  function renderGlobalComps(comps) {
    if (!comps.length) return '';
    const mktCol = { US:'#1a3a5c', EU:'#1e3a5f', IL:'#7c3aed', SEA:'#059669', IN:'#d97706' };
    return `<div style="display:grid;grid-template-columns:repeat(${Math.min(comps.length,3)},1fr);gap:8px;">` +
      comps.slice(0,3).map(c => {
        const mc = mktCol[c.market] || C.navy;
        return `<div style="background:#fff;border:1px solid ${C.sand};border-radius:3px;padding:8px 10px;border-top:2.5px solid ${mc};">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <span style="background:${mc};color:#fff;font-size:6px;font-weight:800;padding:2px 5px;border-radius:2px;font-family:monospace;">${c.market||'?'}</span>
            <span style="font-size:8px;font-weight:800;color:${C.navy};white-space:normal;">${c.company||''}</span>
          </div>
          <div style="font-size:6.5px;color:${C.inkFaint};margin-bottom:3px;">At ${c.stage||'comparable stage'}</div>
          <div style="font-size:7px;color:${C.inkMid};line-height:1.3;margin-bottom:3px;white-space:normal;">${c.whatHappened||''}</div>
          <div style="font-size:7px;color:${C.blue};font-weight:600;line-height:1.3;border-left:2px solid ${C.blue};padding-left:5px;white-space:normal;">${c.prediction||''}</div>
        </div>`;
      }).join('') + '</div>';
  }

  // ── COMPETITOR THREAT TIMELINE ───────────────────────────────────────────
  function renderCompetitorThreats(comps) {
    if (!comps.length) return '';
    return `<div style="display:grid;grid-template-columns:repeat(${Math.min(comps.length,3)},1fr);gap:8px;">` +
      comps.slice(0,3).map(c => `
        <div style="background:#fff;border:1px solid ${C.sand};border-radius:3px;padding:8px 10px;border-top:2.5px solid ${C.red};">
          <div style="font-size:9px;font-weight:800;color:${C.navy};margin-bottom:3px;white-space:normal;">${c.name||''}</div>
          <div style="font-size:14px;font-weight:900;color:${C.red};margin-bottom:3px;line-height:1;">${c.arrEst||'?'}</div>
          <div style="font-size:7px;color:${C.inkMid};margin-bottom:2px;line-height:1.3;white-space:normal;">Targeting: ${c.targeting||''}</div>
          <div style="font-size:7px;color:${C.inkFaint};">Threat by: <strong style="color:${C.red};">${c.threatBy||'TBD'}</strong></div>
        </div>`).join('') + '</div>';
  }

  // ── ASSEMBLE PAGES ───────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Instrument+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;700;900&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 0; }
  body { margin: 0; padding: 0; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
</style>
</head><body>

<!-- PAGE 1 -->
<div class="page" style="${pageStyle}">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:12px;border-bottom:3px solid ${C.navy};">
    <div>
      <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${C.blue};margin-bottom:4px;font-family:monospace;">OPPORTUNITY BRIEF</div>
      <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:900;color:${C.navy};line-height:1;">${company}</div>
      <div style="font-size:9px;color:${C.inkFaint};margin-top:3px;">${subtitleLine}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(15,31,61,.18);line-height:1.2;font-family:monospace;">AdvisorSprint</div>
      <div style="font-size:7.5px;color:rgba(15,31,61,.18);letter-spacing:.04em;margin-top:2px;">Harsha Belavady</div>
    </div>
  </div>

  <!-- KPI Strip -->
  ${renderKPIs(kpis)}

  <!-- Segment Coverage Map -->
  <div style="margin-bottom:12px;">
    <div style="margin-bottom:6px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">SEGMENT COVERAGE MAP</div>
      ${sectionHdrs.segmentMap ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.segmentMap}</div>` : ''}
    </div>
    ${renderSegmentMap(segmentMap)}
  </div>

  <!-- Revenue Gap Table -->
  <div style="margin-bottom:12px;">
    <div style="margin-bottom:6px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">REVENUE GAP ANALYSIS</div>
      ${sectionHdrs.revenueGaps ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.revenueGaps}</div>` : ''}
    </div>
    ${renderRevenueGaps(revenueGaps)}
  </div>

  <!-- What The Market Is Telling You — home market competitors/challengers -->
  <div style="margin-bottom:10px;">
    <div style="margin-bottom:6px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">WHAT THE MARKET IS TELLING YOU</div>
      ${sectionHdrs.marketSignals ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.marketSignals}</div>` : ''}
    </div>
    ${renderMarketSignals(marketSignals)}
  </div>

  <!-- Competitive Edge — acquirer/investor assets or standalone structural advantage -->
  ${competitiveEdge.length ? `
  <div style="margin-bottom:10px;">
    <div style="margin-bottom:6px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">${companyMode === 'acquired' ? 'ACQUIRER EDGE NOT DEPLOYED' : 'STRUCTURAL ADVANTAGE'}</div>
      ${sectionHdrs.competitiveEdge ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.competitiveEdge}</div>` : ''}
    </div>
    ${renderCompetitiveEdge(competitiveEdge)}
  </div>` : ''}

  <!-- Page 1 → Page 2 transition -->
  ${db.page1Summary ? `
  <div style="background:${C.blueLight};border-radius:3px;padding:10px 14px;margin-bottom:6px;display:flex;align-items:center;gap:12px;">
    <div style="flex:1;">
      <div style="font-size:6px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};margin-bottom:3px;font-family:monospace;">SITUATION SUMMARY · THE CASE FOR ACTION</div>
      <div style="font-size:8px;color:${C.navy};line-height:1.5;font-weight:500;">${db.page1Summary}</div>
    </div>
    <div style="flex-shrink:0;text-align:center;padding-left:12px;border-left:2px solid ${C.sand};">
      <div style="font-size:7px;color:${C.inkFaint};margin-bottom:2px;">continued</div>
      <div style="font-size:16px;color:${C.blue};font-weight:800;line-height:1;">→</div>
      <div style="font-size:6.5px;color:${C.blue};font-weight:700;">Page 2</div>
    </div>
  </div>` : ''}

  <!-- Footer -->
  <div style="position:absolute;bottom:18px;left:36px;right:36px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:6.5px;color:${C.inkFaint};letter-spacing:.06em;font-family:monospace;">ADVISORSPRINT INTELLIGENCE · CONFIDENTIAL</div>
    <div style="font-size:6.5px;color:${C.inkFaint};font-family:monospace;">PAGE 1 OF 2</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page" style="${pageStyle}">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid ${C.sand};">
    <div>
      <div style="font-size:8px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${C.blue};font-family:monospace;">18-MONTH TRANSFORMATION</div>
      <div style="font-size:16px;font-weight:800;color:${C.navy};">${company} · Where to Play, How to Win</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;">
      <span style="background:${C.navy};color:#fff;font-size:6px;font-weight:800;padding:2px 6px;border-radius:2px;font-family:monospace;">⚡ SCALE</span>
      <span style="background:${C.purple};color:#fff;font-size:6px;font-weight:800;padding:2px 6px;border-radius:2px;font-family:monospace;">◈ TRANSFORM</span>
      <span style="background:${C.red};color:#fff;font-size:6px;font-weight:800;padding:2px 6px;border-radius:2px;font-family:monospace;">◇ DEFEND</span>
      <div style="font-size:6.5px;color:${C.inkFaint};font-family:monospace;margin-left:4px;">PAGE 2 OF 2</div>
    </div>
  </div>

  <!-- Strategic Tension — top of page 2, frames everything -->
  ${tension ? `
  <div style="background:${C.navy};border-radius:4px;padding:12px 16px;margin-bottom:14px;">
    <div style="font-size:6.5px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px;font-family:monospace;">THE STRATEGIC TENSION</div>
    <div style="font-size:11px;font-weight:600;color:#fff;line-height:1.6;font-style:italic;">${tension}</div>
  </div>` : ''}

  <!-- Radar + Move Cards -->
  <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;margin-bottom:14px;">
    <div>
      <div style="margin-bottom:6px;">
        <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">STRATEGIC POSITION GAP</div>
        ${sectionHdrs.radarGap ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.radarGap}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:4px;">
          <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" rx="1" fill="${C.navy}" fill-opacity="0.4" stroke="${C.navy}" stroke-width="1.5"/></svg>
          <span style="font-size:7px;color:${C.inkFaint};font-family:monospace;font-weight:600;">Today</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" rx="1" fill="${C.blue}" fill-opacity="0.2" stroke="${C.blue}" stroke-width="1.5" stroke-dasharray="3,1.5"/></svg>
          <span style="font-size:7px;color:${C.inkFaint};font-family:monospace;font-weight:600;">18 Months</span>
        </div>
      </div>
      ${renderRadar(radarAxes)}
    </div>
    <div>
      <div style="margin-bottom:6px;">
        <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">THE 3 MOVES</div>
        <div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">Closing the gaps identified on Page 1 — sequenced by speed and right to win.</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:8px;">
        ${renderMoveCards(moves)}
      </div>
    </div>
  </div>

  <!-- Category Read — global structural context, sits above comp signals -->
  ${categoryRead ? `
  <div style="display:grid;grid-template-columns:1fr 90px 110px;gap:0;background:#fff;border:1px solid ${C.sand};border-left:3px solid ${C.blue};border-radius:0 3px 3px 0;padding:7px 12px;margin-bottom:10px;align-items:center;">
    <div>
      <div style="font-size:6px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.blue};margin-bottom:3px;font-family:monospace;">GLOBAL CATEGORY CONTEXT</div>
      <div style="font-size:7px;color:${C.navy};line-height:1.4;font-weight:600;">${categoryRead.globalTrend||''}</div>
      <div style="font-size:6.5px;color:${C.inkMid};line-height:1.4;margin-top:2px;">${categoryRead.implication||''}</div>
    </div>
    <div style="text-align:center;padding:0 8px;border-left:1px solid ${C.sand};">
      <div style="font-size:6px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:3px;font-family:monospace;">LEAD MKT</div>
      <div style="background:${C.blue};color:#fff;font-size:9px;font-weight:800;padding:3px 6px;border-radius:2px;display:inline-block;font-family:monospace;">${categoryRead.leadMarket||'—'}</div>
    </div>
    <div style="text-align:center;padding:0 8px;border-left:1px solid ${C.sand};">
      <div style="font-size:6px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};margin-bottom:3px;font-family:monospace;">MKT LAG</div>
      <div style="font-size:7.5px;font-weight:800;color:${C.red};">${categoryRead.homeMarketLag||'—'}</div>
    </div>
  </div>` : ''}

  <!-- Country legend -->
  <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;padding:4px 8px;background:${C.parchment};border-radius:3px;flex-wrap:wrap;">
    <span style="font-size:6px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${C.inkFaint};margin-right:4px;font-family:monospace;">MARKETS</span>
    ${[['US','United States'],['EU','Europe'],['IL','Israel'],['SEA','SE Asia'],['IN','India'],['UK','UK'],['AU','Australia']].map(([code,name]) =>
      `<span style="font-size:6.5px;color:${C.inkMid};font-weight:600;"><span style="background:${C.navy};color:#fff;font-size:5.5px;font-weight:800;padding:1px 4px;border-radius:2px;margin-right:3px;font-family:monospace;">${code}</span>${name}</span>`
    ).join('')}
  </div>

  <!-- International Arrival Sequence -->
  ${arrivalSequence.length ? `
  <div style="margin-bottom:12px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};margin-bottom:6px;padding-bottom:4px;border-bottom:1.5px solid ${C.navy};font-family:monospace;">INTERNATIONAL ARRIVAL SEQUENCE</div>
    ${renderArrivalSequence(arrivalSequence)}
  </div>` : ''}

  <!-- Global Comp Signal -->
  ${globalComps.length ? `
  <div style="margin-bottom:12px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.blue};margin-bottom:6px;padding-bottom:4px;border-bottom:1.5px solid ${C.blue};font-family:monospace;">GLOBAL COMP SIGNAL — PATTERN MATCH</div>
    ${renderGlobalComps(globalComps)}
  </div>` : ''}

  <!-- Competitor Threat Timeline -->
  ${competitors.length ? `
  <div style="margin-bottom:12px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.red};margin-bottom:6px;padding-bottom:4px;border-bottom:1.5px solid ${C.red};font-family:monospace;">IF YOU DON'T MOVE — THEY WILL</div>
    ${renderCompetitorThreats(competitors)}
  </div>` : ''}

  <!-- Bold Statement — always last -->
  ${boldStatement ? `
  <div style="background:${C.navy};border-radius:4px;padding:16px 20px;margin-bottom:14px;">
    <div style="font-size:7.5px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:8px;font-family:monospace;">THE VERDICT</div>
    <div style="font-size:${boldStatement.length>100?'11':'13'}px;font-weight:700;color:#fff;line-height:1.5;font-style:italic;">${boldStatement}</div>
  </div>` : ''}

  <!-- Footer -->
  <div style="position:absolute;bottom:18px;left:36px;right:36px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:6.5px;color:${C.inkFaint};letter-spacing:.06em;font-family:monospace;">ADVISORSPRINT INTELLIGENCE · CONFIDENTIAL · FOR INTERNAL USE ONLY</div>
    <div style="font-size:6.5px;color:${C.inkFaint};font-family:monospace;">NUMBERS MARKED ESTIMATED/SIGNAL ONLY ARE DIRECTIONAL — VERIFY BEFORE PRESENTING</div>
  </div>
</div>

</body></html>`;
}

// ── PDF HTML BUILDER ────────────────────────────────────────────────────────
function buildSaaSPDFHtml({ company, acquirer, sector, stage, results, dataBlocks, sources, elapsed }) {
  const acq = acquirer && acquirer.trim() ? acquirer.trim() : null;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const mins = Math.floor((elapsed||0)/60);
  const secs = ((elapsed||0)%60).toString().padStart(2,'0');
  const elapsedStr = mins > 0 ? `In ${mins} Minutes ${secs} Seconds` : `In ${secs} Seconds`;

  const agentPages = [
    { id: 'market',      num: '01', wave: '1', title: 'Market & Category Intelligence' },
    { id: 'product',     num: '02', wave: '1', title: 'Product & Platform Architecture' },
    { id: 'gtm',         num: '03', wave: '1', title: 'Go-To-Market & Revenue Architecture' },
    { id: 'revenue',     num: '04', wave: '1', title: 'Revenue Health & Unit Economics' },
    { id: 'customer',    num: '05', wave: '1', title: 'Customer & Segment Intelligence' },
    { id: 'competitive', num: '06', wave: '1', title: 'Competitive Moat & Battleground' },
    { id: 'funding',     num: '07', wave: '2', title: `Funding, Valuation & Strategic Options` },
    { id: 'pricing',     num: '08', wave: '2', title: 'Pricing Power & Revenue Model' },
    { id: 'intl',        num: '09', wave: '2', title: 'International Expansion & Benchmarks' },
  ];

  const formatProse = (text) => {
    if (!text) return '<p style="color:#999;font-style:italic;">Agent analysis not available.</p>';
    // Strip DATA_BLOCK delimited content (both standard and raw formats)
    let t = text
      .replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '')
      .replace(/={10,}[\s\S]*?DATA BLOCK[\s\S]*?={10,}/g, '')
      .replace(/─{10,}[\s\S]*?DATA BLOCK[\s\S]*?─{10,}/g, '')
      // Strip opening orientation sentences that agents sometimes output
      .replace(/^[^\n]*(?:This (?:section|analysis|agent|report) (?:examines|covers|focuses|analyses|analyzes|looks at)|In this (?:analysis|section)|Agent \d+ (?:focuses|covers|examines))[^\n]*\n/gim, '')
      .trim()
      .replace(/\[HIGH CONFIDENCE[^\]]*\]/g, '<span style="background:#e8f5ee;color:#2d7a4f;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:2px;font-weight:600;">● High</span>')
      .replace(/\[MEDIUM CONFIDENCE[^\]]*\]/g, '<span style="background:#fef3e2;color:#c97d20;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:2px;font-weight:600;">● Medium</span>')
      .replace(/\[LOW CONFIDENCE[^\]]*\]/g, '<span style="background:#fde8e8;color:#c0392b;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:2px;font-weight:600;">● Low</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^◉\s*(.+)$/gm, '<strong style="font-size:10px;color:#0f1f3d;display:block;margin:14px 0 6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">$1</strong>')
      .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="font-size:10px;color:#0f1f3d;display:block;margin:14px 0 6px;">$1</strong>')
      .replace(/^—\s+(.+)$/gm, '<div style="padding:2px 0 2px 14px;border-left:2px solid #e2e8f0;margin:3px 0;color:#555;">$1</div>')
      .replace(/^─+$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:10px 0;"/>')
      .replace(/^━+$/gm, '')
      .replace(/\n\n+/g, '</p><p style="margin:0 0 8px;font-size:9px;line-height:1.8;color:#3a3a3a;">')
      .replace(/\n/g, '<br/>');
    return `<p style="margin:0 0 8px;font-size:9px;line-height:1.8;color:#3a3a3a;">${t}</p>`;
  };

  const header = (label) => `
    <div style="background:#0f1f3d;height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 50px;">
      <div style="font-family:'Playfair Display',serif;font-size:13px;color:#fff;letter-spacing:.03em;"><em>Advisor</em>Sprint Intelligence</div>
      <div style="font-family:monospace;font-size:7px;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.9);font-weight:700;">${label}</div>
      <div style="background:#2563eb;color:#fff;font-size:7px;font-weight:700;letter-spacing:.1em;padding:3px 9px;border-radius:9px;">HARSHA BELAVADY</div>
    </div>`;

  const footer = (pageNum) => `
    <div style="position:absolute;bottom:0;left:0;right:0;height:24px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 50px;background:#fff;">
      <span style="font-size:7px;color:#999;font-family:monospace;">AdvisorSprint Intelligence · Confidential · ${dateStr}</span>
      <span style="font-size:7px;color:#999;font-family:monospace;">${pageNum}</span>
    </div>`;

  // Cover page
  const coverHtml = `
<div style="width:794px;height:1122px;background:#0f1f3d;position:relative;overflow:hidden;page-break-after:always;">
  <div style="position:absolute;top:0;right:0;width:380px;height:380px;background:linear-gradient(135deg,rgba(37,99,235,.3) 0%,transparent 70%);border-radius:0 0 0 380px;"></div>
  <div style="position:absolute;bottom:-60px;left:-60px;width:300px;height:300px;border:1px solid rgba(255,255,255,.06);border-radius:50%;"></div>
  <div style="position:absolute;inset:0;padding:65px 50px;display:flex;flex-direction:column;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="font-family:'Playfair Display',serif;font-size:15px;color:rgba(255,255,255,.9);letter-spacing:.04em;"><em>Advisor</em>Sprint Intelligence</div>
      <div style="font-family:monospace;font-size:9px;color:rgba(255,255,255,.3);letter-spacing:.1em;">HARSHA BELAVADY</div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;margin-bottom:20px;">
      <div style="margin-bottom:40px;">
        <div style="font-family:monospace;font-size:8.5px;letter-spacing:.25em;text-transform:uppercase;color:#3b82f6;margin-bottom:14px;">10-Agent Strategic Intelligence Report</div>
        <div style="font-family:'Playfair Display',serif;font-size:52px;color:#fff;font-weight:900;line-height:.92;letter-spacing:-.02em;margin-bottom:12px;">${company}</div>
        <div style="font-size:13px;color:rgba(255,255,255,.55);font-weight:300;letter-spacing:.05em;">${acq ? `Acquisition analysis &nbsp;·&nbsp; <strong style="color:rgba(255,255,255,.8);font-weight:500;">${acq}</strong>` : `${sector} · ${stage}`}</div>
        <div style="margin-top:18px;display:flex;gap:20px;align-items:center;">
          <div style="font-family:monospace;font-size:11px;color:rgba(255,255,255,.65);letter-spacing:.06em;font-weight:600;">Generated ${dateStr}</div>
          <div style="width:1px;height:14px;background:rgba(255,255,255,.2);"></div>
          <div style="font-family:monospace;font-size:10px;color:rgba(255,255,255,.5);letter-spacing:.08em;">${elapsedStr}</div>
        </div>
      </div>
    </div>
    <div style="width:100%;">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;margin-bottom:12px;">
        ${agentPages.map(ag => `
          <div style="background:rgba(255,255,255,${ag.wave==='2'?'.07':'.05'});padding:12px 14px;">
            <div style="font-family:monospace;font-size:6px;color:rgba(${ag.wave==='2'?'59,130,246,.7':'255,255,255,.3'});letter-spacing:.14em;margin-bottom:6px;">AGENT ${ag.num} · WAVE ${ag.wave}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.85);font-weight:600;line-height:1.3;">${ag.title}</div>
          </div>`).join('')}
        <div style="background:rgba(37,99,235,.25);padding:12px 14px;">
          <div style="font-family:monospace;font-size:6px;color:rgba(59,130,246,.9);letter-spacing:.14em;margin-bottom:6px;">AGENT 10 · WAVE 3</div>
          <div style="font-size:9px;color:#fff;font-weight:700;line-height:1.3;">Executive Synopsis</div>
          <div style="font-size:7px;color:rgba(255,255,255,.4);margin-top:3px;">Opus 4 · Full synthesis</div>
        </div>
      </div>
    </div>
  </div>
</div>
`
  // Verdict Matrix page — built from verdictRow in each agent's DATA_BLOCK
  const vColors = { STRONG:'#059669', WATCH:'#d97706', OPTIMISE:'#2563eb', UNDERDELIVERED:'#dc2626', RISK:'#dc2626' };
  const vBg    = { STRONG:'#ecfdf5', WATCH:'#fffbeb', OPTIMISE:'#eff6ff', UNDERDELIVERED:'#fef2f2', RISK:'#fef2f2' };
  const vLabel = { STRONG:'● STRONG', WATCH:'◐ WATCH', OPTIMISE:'◈ OPTIMISE', UNDERDELIVERED:'▲ UNDERDELIVERED', RISK:'▲ RISK' };
  const matrixRows = agentPages.map(ag => {
    const db = dataBlocks[ag.id];
    if (!db || !db.verdictRow) return null;
    const v = db.verdictRow;
    const vc = vColors[v.verdict] || '#888';
    const vb = vBg[v.verdict] || '#f8f8f8';
    const vl = vLabel[v.verdict] || v.verdict;
    return `<tr>
      <td style="padding:7px 10px;font-weight:700;color:#0f1f3d;font-size:9px;border-bottom:1px solid #e2e8f0;">${ag.title}</td>
      <td style="padding:7px 10px;text-align:center;border-bottom:1px solid #e2e8f0;">
        <span style="background:${vb};color:${vc};font-size:7.5px;font-weight:800;padding:3px 8px;border-radius:3px;white-space:nowrap;letter-spacing:.04em;font-family:monospace;">${vl}</span>
      </td>
      <td style="padding:7px 10px;font-size:8.5px;color:#3a3a3a;line-height:1.5;border-bottom:1px solid #e2e8f0;">${v.finding || '—'}</td>
      <td style="padding:7px 10px;text-align:center;font-family:monospace;font-size:7px;color:#999;border-bottom:1px solid #e2e8f0;">[${v.confidence || 'M'}]</td>
    </tr>`;
  }).filter(Boolean).join('');

  const verdictMatrixHtml = matrixRows ? `
<div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
  ${header('VERDICT MATRIX · ALL AGENTS')}
  <div style="padding:24px 50px 0;">
    <div style="font-family:'Playfair Display',serif;font-size:18px;color:#0f1f3d;font-weight:700;margin-bottom:2px;">Verdict Matrix</div>
    <div style="height:2px;background:linear-gradient(90deg,#0f1f3d 0%,#2563eb 40%,transparent 100%);margin-bottom:6px;"></div>
    <div style="font-size:8px;color:#888;font-style:italic;margin-bottom:16px;">One-line verdict per agent — green means proceed, amber means monitor, red means act now. Drill into any agent section for the full analysis.</div>
    <table style="width:100%;border-collapse:collapse;font-size:9px;">
      <thead>
        <tr style="background:#0f1f3d;color:#fff;">
          <th style="padding:8px 10px;text-align:left;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:28%;">Agent</th>
          <th style="padding:8px 10px;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:14%;">Status</th>
          <th style="padding:8px 10px;text-align:left;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Key Finding</th>
          <th style="padding:8px 10px;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:7%;">Conf.</th>
        </tr>
      </thead>
      <tbody>${matrixRows}</tbody>
    </table>
  </div>
  ${footer(3)}
</div>` : '';

  // Agent pages
  const agentPageHtml = agentPages.map((ag, i) => `
    <div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
      ${header(`AGENT ${ag.num} · ${ag.title.toUpperCase()}`)}
      <div style="padding:20px 50px 0px;">
        <div style="font-family:'Playfair Display',serif;font-size:18px;color:${V.navy};font-weight:700;margin-bottom:2px;">${ag.title}</div>
        <div style="height:2px;background:linear-gradient(90deg,${V.navy} 0%,${V.blue} 40%,transparent 100%);margin-bottom:10px;"></div>
        ${renderSaaSAgentVisuals(ag.id, dataBlocks[ag.id])}
      </div>
      <div style="margin:0 50px 30px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:12px 16px;">
        <div style="font-family:monospace;font-size:6px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#bbb;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8ecf0;">Analysis & Strategic Implications</div>
        <div style="font-size:8.5px;line-height:1.85;color:#2a2a2a;">${formatProse(results[ag.id])}</div>
      </div>
      ${footer(i + 5)}
    </div>`).join('');

  const synopsisHtml = `
    <div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
      ${header('EXECUTIVE SYNOPSIS · OPUS 4 SYNTHESIS')}
      <div style="padding:20px 50px 0px;">
        <div style="font-family:'Playfair Display',serif;font-size:18px;color:${V.navy};font-weight:700;margin-bottom:2px;">Executive Synopsis</div>
        <div style="height:2px;background:linear-gradient(90deg,${V.navy} 0%,${V.blue} 40%,transparent 100%);margin-bottom:10px;"></div>
        ${renderSaaSAgentVisuals('synopsis', dataBlocks['synopsis'])}
      </div>
      <div style="margin:0 50px 30px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:12px 16px;">
        <div style="font-family:monospace;font-size:6px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#bbb;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e8ecf0;">Strategic Synthesis</div>
        <div style="font-size:8.5px;line-height:1.85;color:#2a2a2a;">${formatProse(results.synopsis)}</div>
      </div>
      ${footer(13)}
    </div>`;

  // 90-Day Action Plan page — built from topActions in synopsis DATA_BLOCK
  const synopsisDB = dataBlocks['synopsis'];
  const topActions = synopsisDB && synopsisDB.topActions ? synopsisDB.topActions : [];
  const effortColors = { H: '#dc2626', M: '#d97706', L: '#059669' };
  const actionPlanHtml = topActions.length ? `
<div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
  ${header('90-DAY ACTION PLAN')}
  <div style="padding:24px 50px 0;">
    <div style="font-family:'Playfair Display',serif;font-size:18px;color:${V.navy};font-weight:700;margin-bottom:2px;">90-Day Action Plan</div>
    <div style="height:2px;background:linear-gradient(90deg,${V.navy} 0%,${V.blue} 40%,transparent 100%);margin-bottom:6px;"></div>
    <div style="font-size:8px;color:#888;font-style:italic;margin-bottom:16px;">Top actions sequenced by impact × speed. Each action is specific enough to assign on Monday morning.</div>
    <table style="width:100%;border-collapse:collapse;font-size:8.5px;">
      <thead>
        <tr style="background:${V.navy};color:#fff;">
          <th style="padding:8px 10px;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:4%;">#</th>
          <th style="padding:8px 10px;text-align:left;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:38%;">Action</th>
          <th style="padding:8px 10px;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:14%;">Owner</th>
          <th style="padding:8px 10px;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:10%;">By</th>
          <th style="padding:8px 10px;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:12%;">Impact</th>
          <th style="padding:8px 10px;text-align:center;font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:8%;">Effort</th>
        </tr>
      </thead>
      <tbody>
        ${topActions.map((a, i) => {
          const ec = effortColors[a.effort] || '#888';
          const rowBg = i % 2 === 0 ? '#fff' : '#f0f4ff';
          return `<tr>
            <td style="padding:8px 10px;background:${rowBg};border-bottom:1px solid #e2e8f0;text-align:center;font-weight:800;color:${V.blue};font-size:11px;">${a.rank}</td>
            <td style="padding:8px 10px;background:${rowBg};border-bottom:1px solid #e2e8f0;font-size:8px;color:${V.ink};line-height:1.5;">${a.action}</td>
            <td style="padding:8px 10px;background:${rowBg};border-bottom:1px solid #e2e8f0;text-align:center;font-size:7.5px;color:${V.inkMid};">${a.owner || '—'}</td>
            <td style="padding:8px 10px;background:${rowBg};border-bottom:1px solid #e2e8f0;text-align:center;font-size:7.5px;font-weight:700;color:${V.navy};">${a.quarter || '—'}</td>
            <td style="padding:8px 10px;background:${rowBg};border-bottom:1px solid #e2e8f0;text-align:center;font-size:8px;font-weight:700;color:${V.blue};">${a.impactM ? '$' + a.impactM + 'M' : '—'}</td>
            <td style="padding:8px 10px;background:${rowBg};border-bottom:1px solid #e2e8f0;text-align:center;"><span style="background:${ec}18;color:${ec};font-size:7px;font-weight:800;padding:2px 7px;border-radius:3px;font-family:monospace;">${a.effort || '—'}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <div style="margin-top:20px;padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;">
      <div style="font-family:monospace;font-size:6.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${V.blue};margin-bottom:6px;">How to use this plan</div>
      <div style="font-size:7.5px;color:${V.inkMid};line-height:1.6;">Actions are sequenced by impact magnitude × speed to result. Effort ratings: <strong style="color:#dc2626;">H</strong> = significant resource commitment, <strong style="color:#d97706;">M</strong> = moderate, <strong style="color:#059669;">L</strong> = quick win. Start with low-effort, high-impact actions. For full reasoning behind each action, see the relevant agent section.</div>
    </div>
  </div>
  ${footer(14)}
</div>` : '';

  const sourcesHtml = `
    <div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
      ${header('SOURCES & RESEARCH METHODOLOGY')}
      <div style="padding:26px 50px 36px;">
        <div style="font-family:monospace;font-size:7px;letter-spacing:.18em;text-transform:uppercase;color:#2563eb;margin-bottom:4px;">Research Transparency</div>
        <div style="font-family:'Playfair Display',serif;font-size:18px;color:#0f1f3d;font-weight:700;margin-bottom:3px;">Sources & Confidence Methodology</div>
        <div style="height:2px;background:linear-gradient(90deg,#0f1f3d 0%,#2563eb 40%,transparent 100%);margin-bottom:18px;"></div>
        <div style="display:grid;grid-template-columns:1fr;gap:16px;">
          <div>
            <div style="font-size:9px;font-weight:700;color:#0f1f3d;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Confidence Framework</div>
            <div style="padding:12px;background:#f0f4ff;border-radius:5px;border:1px solid #dbeafe;margin-bottom:10px;">
              <div style="display:flex;gap:7px;margin-bottom:8px;"><span style="background:#e8f5ee;color:#2d7a4f;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:3px;font-weight:600;flex-shrink:0;">● HIGH</span><div style="font-size:7.5px;color:#3a3a3a;">Directly cited from a named, datable source — SEC filing, verified press, company announcement, industry report</div></div>
              <div style="display:flex;gap:7px;margin-bottom:8px;"><span style="background:#fef3e2;color:#c97d20;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:3px;font-weight:600;flex-shrink:0;">● MED</span><div style="font-size:7.5px;color:#3a3a3a;">Triangulated from 2+ indirect signals — funding rounds, headcount data, comparable company benchmarks</div></div>
              <div style="display:flex;gap:7px;"><span style="background:#f0f0f0;color:#888;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:3px;font-weight:600;flex-shrink:0;">● LOW</span><div style="font-size:7.5px;color:#3a3a3a;">Single unverified signal or logical extrapolation. Directional only — do not use for financial decisions.</div></div>
            </div>
            <div style="font-size:7.5px;color:#666;line-height:1.7;padding:10px;background:#f8faff;border-left:3px solid #2563eb;border-radius:0 4px 4px 0;">
              <strong style="color:#2563eb;">Note:</strong> ${company} is a private company. Revenue and valuation figures sourced from verified press and investor signals. ARR, margins, and unit economics are triangulated estimates with explicit confidence labels — treat accordingly.
            </div>
          </div>
          <div>
            <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;">
              <div style="font-size:9px;font-weight:700;color:#0f1f3d;text-transform:uppercase;letter-spacing:.06em;">Sources Cited</div>
              <div style="font-family:monospace;font-size:7px;color:#2563eb;font-weight:600;">${(sources||[]).length} sources checked</div>
            </div>
            <div style="font-size:7.5px;color:#3a3a3a;line-height:1.4;">
              ${(sources || []).slice(0, 20).map((s, i) =>
                `<div style="display:flex;gap:6px;padding:4px 6px;background:${i%2===0?'#f8faff':'#fff'};border-left:2px solid ${i%2===0?'#0f1f3d':'#dbeafe'};">
                  <span style="font-family:monospace;font-size:6.5px;color:#2563eb;font-weight:600;flex-shrink:0;width:14px;">${i+1}</span>
                  <span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${s.title || s.url}</span>
                </div>`
              ).join('') || '<div style="color:#999;font-style:italic;padding:8px;">Sources populated after full run — test mode shows Agent 1 only.</div>'}
            </div>
          </div>
        </div>
        <div style="margin-top:18px;padding:13px;background:#0f1f3d;border-radius:5px;color:rgba(255,255,255,.7);font-size:7.5px;line-height:1.7;">
          <strong style="color:#fff;">Disclaimer:</strong> Generated by AdvisorSprint Intelligence's 10-agent AI system using live web search. Strategic thinking tool only — not a substitute for primary research or professional financial advice.
        </div>
      </div>
      ${footer(2)}
    </div>`;

  return `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Instrument+Sans:wght@400;600;700&family=DM+Sans:wght@400;700;800&display=swap" rel="stylesheet"/>
    <style>
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Instrument Sans',sans-serif;background:#e2e8f0;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}
      @media print{
        @page{margin:0;size:A4 portrait;}
        body{background:#fff;}
        /* Force background colours and images to print — Puppeteer respects these */
        *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}
        div[style*="background:#0f1f3d"]{background:#0f1f3d !important;}
        div[style*="background:#2563eb"]{background:#2563eb !important;}
      }
      em{font-style:italic;}
      table{width:100%;border-collapse:collapse;margin:8px 0;font-size:7.5px;}
      thead tr{background:#0f1f3d !important;color:#fff !important;}
      thead th{padding:6px 8px;text-align:left;font-weight:700;letter-spacing:.04em;border:1px solid #0f1f3d;color:#fff !important;font-size:7px;background:#0f1f3d !important;}
      tbody tr:nth-child(even){background:#f0f4ff !important;}
      tbody tr:nth-child(odd){background:#fff !important;}
      tbody td{padding:5px 8px;border:1px solid #dbeafe;color:#1a1a2e;vertical-align:top;font-size:7px;}
      /* Ensure gradient bars and status badges render in PDF */
      div[style*="linear-gradient"]{background:inherit;}
      span[style*="background:#059669"],span[style*="background:#d97706"],span[style*="background:#dc2626"]{-webkit-print-color-adjust:exact !important;}
    </style>
  </head><body>
    ${coverHtml}
    ${sourcesHtml}
    ${verdictMatrixHtml}
    ${synopsisHtml}
    ${actionPlanHtml}
    ${agentPageHtml}
  </body></html>`;
}


// ── GA EVENT HELPER ─────────────────────────────────────────────────────────
const gaEvent = (name, params={}) => {
  if (typeof window !== 'undefined' && window.gtag) window.gtag('event', name, params);
};

// ── MAIN APP COMPONENT ──────────────────────────────────────────────────────
export default function AdvisorSprintIntelligence() {
  const [company, setCompany] = useState("Clay");
  const [acquirer, setAcquirer] = useState("");
  const [sector, setSector] = useState("SaaS");
  const [stage, setStage] = useState("Late Stage");
  const [context, setContext] = useState("");
  const [acquisitionMode, setAcquisitionMode] = useState(false);

  const [appState, setAppState] = useState("idle");
  const [testMode, setTestMode] = useState(false);
  const [results, setResults] = useState({});
  const [dataBlocks, setDataBlocks] = useState({});
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [briefGenerating, setBriefGenerating] = useState(false);
  const [retryingBrief, setRetryingBrief] = useState(false);
  const [sources, setSources] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [elapsed, setElapsed] = useState(0);

  const abortRef = useRef(null);
  const timerRef = useRef(null);

  // ── callClaude ─────────────────────────────────────────────────────────────
  const callClaude = useCallback(async (prompt, agentId, signal) => {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 1500));
      return `<<<DATA_BLOCK>>>\n{"agent":"${agentId}","kpis":[{"label":"Test","value":"OK","sub":"mock","trend":"up","confidence":"M"}],"verdictRow":{"verdict":"WATCH","finding":"Mock mode — no real data","confidence":"M"}}\n<<<END_DATA_BLOCK>>>\n\nMock analysis for ${agentId}.`;
    }

    const attemptFetch = () => fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tool-name': 'advisor-intelligence', 'Cache-Control': 'no-store' },
      signal,
      body: JSON.stringify({ prompt, agentId, market: 'US', mode: 'saas' }),
    });

    const runWithRetry = async (attempt = 1) => {
      let res;
      try {
        res = await attemptFetch();
      } catch (networkErr) {
        if (signal.aborted) throw networkErr;
        if (attempt >= 3) throw networkErr;
        console.warn(`[${agentId}] Fetch failed (attempt ${attempt}), retrying in 10s:`, networkErr.message);
        setStatuses(s => ({ ...s, [agentId]: `retrying… (${attempt}/3)` }));
        await new Promise(r => setTimeout(r, 10000));
        if (signal.aborted) throw networkErr;
        return runWithRetry(attempt + 1);
      }

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(err || `Server error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (signal.aborted) { reader.cancel(); break; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'chunk') fullText += event.text;
              if (event.type === 'searching') setStatuses(s => ({ ...s, [agentId]: `searching: ${event.query.slice(0,40)}…` }));
              if (event.type === 'done') fullText = event.text || fullText;
              if (event.type === 'source' && event.url) {
                setSources(prev => {
                  if (prev.find(s => s.url === event.url)) return prev;
                  return [...prev, { url: event.url, title: event.title, agent: event.agent }];
                });
              }
              if (event.type === 'error') {
                if (event.message?.includes('rate_limit')) throw new Error('RATE_LIMIT:' + event.message);
                throw new Error(event.message);
              }
            } catch(e) { if (e.message && !e.message.startsWith('JSON')) throw e; }
          }
        }
      } catch (streamErr) {
        reader.cancel().catch(() => {});
        // Mid-stream QUIC drop — retry if we haven't hit limit
        if (!signal.aborted && attempt < 3 && (streamErr.message?.includes('QUIC') || streamErr.message?.includes('network') || streamErr.name === 'TypeError')) {
          console.warn(`[${agentId}] Stream dropped (attempt ${attempt}), retrying in 10s:`, streamErr.message);
          setStatuses(s => ({ ...s, [agentId]: `stream retry… (${attempt}/3)` }));
          await new Promise(r => setTimeout(r, 10000));
          if (signal.aborted) throw streamErr;
          return runWithRetry(attempt + 1);
        }
        throw streamErr;
      }

      return fullText;
    };

    return runWithRetry();
  }, [setSources, setStatuses]);

  // ── runAgent ────────────────────────────────────────────────────────────────
  const runAgent = useCallback(async (id, prompt, signal) => {
    try {
      const text = await callClaude(prompt, id, signal);
      if (!signal.aborted) {
        const dbMatch = text.match(/<<<DATA_BLOCK>>>[\s\S]*?```json([\s\S]*?)```[\s\S]*?<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>/);
        const cleanText = text.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '').trim();
        if (dbMatch) {
          try {
            const raw = (dbMatch[1] || dbMatch[2] || '').trim();
            const cleaned = raw.replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
            const parsed = JSON.parse(cleaned);
            setDataBlocks(d => ({ ...d, [id]: parsed }));
          } catch(e) {
            console.warn('[DataBlock] parse failed:', id, e.message);
            // Attempt graceful recovery: try to extract verdictRow via regex even if full JSON is malformed
            let recoveredBlock = { agent: id, kpis: [{ label: 'Analysis', value: '✓', sub: 'Full analysis in prose below', trend: 'flat', confidence: 'M' }], verdictRow: null };
            try {
              const rawForRecovery = (dbMatch[1] || dbMatch[2] || '').trim();
              const vMatch = rawForRecovery.match(/"verdictRow"\s*:\s*\{[^}]+\}/);
              if (vMatch) {
                const vParsed = JSON.parse('{' + vMatch[0] + '}');
                recoveredBlock.verdictRow = vParsed.verdictRow;
              }
              // Try to extract kpis array
              const kMatch = rawForRecovery.match(/"kpis"\s*:\s*(\[[^\]]+\])/);
              if (kMatch) {
                const kParsed = JSON.parse(kMatch[1]);
                recoveredBlock.kpis = kParsed;
              }
            } catch(recovErr) { /* recovery also failed — use defaults */ }
            if (!recoveredBlock.verdictRow) {
              recoveredBlock.verdictRow = { verdict: 'WATCH', finding: 'Analysis complete — see prose below for full findings', confidence: 'L' };
            }
            setDataBlocks(d => ({ ...d, [id]: recoveredBlock }));
          }
        }
        setResults(r => ({ ...r, [id]: cleanText }));
        setStatuses(s => ({ ...s, [id]: "done" }));
      }
      return text;
    } catch(e) {
      if (e.name === "AbortError") return "";
      setStatuses(s => ({ ...s, [id]: "error" }));
      setResults(r => ({ ...r, [id]: `Error: ${e.message}` }));
      throw e;
    }
  }, [callClaude]);

  // ── runSprint ───────────────────────────────────────────────────────────────
  const runSprint = async () => {
    if (!company.trim() || appState === "running") return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const signal = ctrl.signal;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    setAppState("preparing");
    setResults({});
    setSources([]);
    setElapsed(0);

    try {
      await Promise.race([
        fetch(API_URL.replace('/api/claude', '/')),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 35000))
      ]);
    } catch(e) { console.warn('wake-up ping:', e.message); }

    const co = company.trim();
    const acq = acquisitionMode ? acquirer.trim() : '';
    const ctx = context.trim();
    const ctxWithMeta = `COMPANY: ${co}\nSECTOR: ${sector}\nSTAGE: ${stage}${acq ? `\nACQUIRER: ${acq}` : ''}\n\n${ctx}`.trim();

    const initStatus = {};
    const agentsToRun = testMode ? ['market'] : SAAS_AGENTS.map(a => a.id);
    SAAS_AGENTS.forEach(a => initStatus[a.id] = agentsToRun.includes(a.id) ? "queued" : "idle");
    setStatuses(initStatus);

    try {
      setAppState("running");
      const w1texts = {};
      const ALL_AGENTS = testMode ? ['market'] : [...W1, ...W2, 'synopsis', 'brief'];

      for (const id of ALL_AGENTS) {
        if (signal.aborted) break;
        setStatuses(s => ({ ...s, [id]: "running" }));

        let ctx_for_agent = {};
        if (id === 'brief') {
          ctx_for_agent = w1texts; // brief gets everything including synopsis
        } else if (id === 'synopsis') {
          const trimmed = {};
          Object.entries(w1texts).forEach(([k,v]) => {
            if (typeof v !== 'string') { trimmed[k] = v; return; }
            // Pass DATA_BLOCK in full (compact, information-dense) + first 3000 chars of prose
            const dbMatch = v.match(/<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>/);
            const dataBlock = dbMatch ? '<<<DATA_BLOCK>>>' + dbMatch[1] + '<<<END_DATA_BLOCK>>>' : '';
            const prose = v.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '').trim();
            const proseSlice = prose.slice(0, 3000) + (prose.length > 3000 ? ' [...truncated...]' : '');
            trimmed[k] = dataBlock + '\n\n' + proseSlice;
          });
          ctx_for_agent = trimmed;
        } else if (W2.includes(id)) {
          ctx_for_agent = w1texts;
        }

        const prompt = makeSaaSPrompt(id, co, acq, ctxWithMeta, ctx_for_agent);
        let text = "";
        try {
          text = await runAgent(id, prompt, signal);
        } catch(agentErr) {
          console.error(`[Sprint] Agent ${id} failed:`, agentErr.message);
          setAppState("error");
          return;
        }
        w1texts[id] = text;
        // Persist after each agent — protects against page refresh or brief-only retry
        try { sessionStorage.setItem(`sprint_${company.trim()}`, JSON.stringify(w1texts)); } catch(e) {}

        if (!signal.aborted && id !== 'synopsis') {
          setStatuses(s => ({ ...s, [id]: "done" }));
          if (!testMode) await new Promise(r => setTimeout(r, 60000));
        }
      }
      if (!signal.aborted) {
        setAppState("done");
        try { sessionStorage.removeItem(`sprint_${company.trim()}`); } catch(e) {}
        // Auto-generate the opportunity brief PDF immediately after sprint completes
        // Small delay to let React state settle so dataBlocks['brief'] is available
        setTimeout(() => { generateSaaSBriefAuto(company, acquirer, sector, stage); }, 800);
      }
    } catch(e) {
      console.error("Sprint error:", e);
      setAppState("error");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const retryBrief = async () => {
    if (retryingBrief) return;
    setRetryingBrief(true);
    setAppState("running");
    const co = company.trim();
    try {
      const saved = sessionStorage.getItem(`sprint_${co}`);
      if (!saved) throw new Error("No saved sprint data — please re-run the full sprint");
      const w1texts = JSON.parse(saved);
      if (!w1texts['synopsis']) throw new Error("Synopsis missing — please re-run the full sprint");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const signal = ctrl.signal;
      setStatuses(s => ({ ...s, brief: "running" }));
      const acq = acquisitionMode ? acquirer.trim() : '';
      const ctx = context.trim();
      const ctxWithMeta = `COMPANY: ${co}
SECTOR: ${sector}
STAGE: ${stage}
${acquisitionMode && acq ? `ACQUIRER: ${acq}
` : ''}${ctx ? `ADDITIONAL CONTEXT: ${ctx}
` : ''}`;
      const prompt = makeSaaSPrompt('brief', co, acq, ctxWithMeta, w1texts);
      await runAgent('brief', prompt, signal);
      setStatuses(s => ({ ...s, brief: "done" }));
      setAppState("done");
    } catch(e) {
      console.error("[RetryBrief]", e.message);
      alert(`Retry failed: ${e.message}`);
      setAppState("error");
    } finally {
      setRetryingBrief(false);
    }
  };

  const cancel = () => {
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setAppState("idle");
  };

  const generateSaaSBriefAuto = async (co, acq, sec, stg) => {
    // Called automatically at sprint end — uses passed values not stale closure state
    setBriefGenerating(true);
    try {
      // dataBlocks is from React state via setDataBlocks — read it via a ref snapshot
      // We call buildSaaSBriefHtml with the current DOM state
      const html = buildSaaSBriefHtml({ company: co, acquirer: acq, sector: sec, stage: stg, results, dataBlocks, companyMode: acquisitionMode ? 'acquired' : 'standalone' });
      const pdfRes = await fetch(API_URL.replace('/api/claude', '/api/pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, company: co, acquirer: acq }),
        signal: AbortSignal.timeout(120000),
      });
      if (!pdfRes.ok) {
        const err = await pdfRes.json().catch(() => ({ error: 'Brief generation failed' }));
        throw new Error(err.error || `Server error ${pdfRes.status}`);
      }
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${co.replace(/\s+/g,'-')}_OpportunityBrief_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      console.warn('Auto brief generation failed:', e.message);
      // Non-fatal — user can still click the button manually
    } finally {
      setBriefGenerating(false);
    }
  };

  const generateSaaSBrief = async () => {
    if (briefGenerating) return;
    setBriefGenerating(true);
    try {
      const html = buildSaaSBriefHtml({ company, acquirer, sector, stage, results, dataBlocks, companyMode: acquisitionMode ? 'acquired' : 'standalone' });
      const pdfRes = await fetch(API_URL.replace('/api/claude', '/api/pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, company, acquirer }),
        signal: AbortSignal.timeout(120000),
      });
      if (!pdfRes.ok) {
        const err = await pdfRes.json().catch(() => ({ error: 'Brief generation failed' }));
        throw new Error(err.error || `Server error ${pdfRes.status}`);
      }
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${company.replace(/\s+/g,'-')}_OpportunityBrief_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      alert(`Brief generation failed: ${e.message}`);
    } finally {
      setBriefGenerating(false);
    }
  };

  const generatePDF = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    try {
      const html = buildSaaSPDFHtml({ company, acquirer, sector, stage, results, dataBlocks, sources, elapsed });
      const pdfRes = await fetch(API_URL.replace('/api/claude', '/api/pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, company, acquirer }),
        signal: AbortSignal.timeout(120000),
      });
      if (!pdfRes.ok) {
        const err = await pdfRes.json().catch(() => ({ error: 'PDF generation failed' }));
        throw new Error(err.error || `Server error ${pdfRes.status}`);
      }
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AdvisorSprint-Intelligence-${company.replace(/\s+/g,'-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      alert(`PDF error: ${e.message}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const mins = Math.floor(elapsed/60);
  const secs = (elapsed%60).toString().padStart(2,'0');
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${elapsed}s`;

  const statusColor = { idle: N.inkFaint, preparing: N.amber, running: N.blue, done: N.green, error: N.red }[appState] || N.inkFaint;
  const statusLabel = { idle: 'Ready', preparing: 'Waking backend…', running: `Running · ${elapsedStr}`, done: `Complete · ${elapsedStr}`, error: 'Error — check console' }[appState] || appState;

  const agentStatusIcon = (s) => ({
    idle: <span style={{ color: N.inkFaint }}>○</span>,
    queued: <span style={{ color: N.amber }}>◌</span>,
    running: <span style={{ color: N.blue, animation: 'pulse 1s infinite' }}>●</span>,
    done: <span style={{ color: N.green }}>●</span>,
    error: <span style={{ color: N.red }}>✕</span>,
  }[s] || <span style={{ color: N.inkFaint }}>○</span>);

  const doneCount = SAAS_AGENTS.filter(a => statuses[a.id] === 'done').length;
  const totalAgents = SAAS_AGENTS.length;

  return (
    <div style={{ minHeight: '100vh', background: N.navy, fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: N.navyMid, borderBottom: `1px solid #ffffff15`, padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: N.blueMid }}>AdvisorSprint</div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: '#ffffff40' }}>Intelligence</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: statusColor, fontFamily: 'monospace' }}>{statusLabel}</div>
        {appState === 'error' && results['synopsis'] && (
          <button onClick={retryBrief} disabled={retryingBrief}
            style={{ padding: '6px 16px', background: retryingBrief ? '#ffffff20' : '#b85c38', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: retryingBrief ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
            {retryingBrief ? '⟳ Retrying…' : '↺ Retry Brief Only'}
          </button>
        )}
        {appState === 'done' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={generatePDF} disabled={pdfGenerating} style={{ padding: '6px 16px', background: pdfGenerating ? '#ffffff20' : N.navyMid, color: '#fff', border: '1px solid #ffffff30', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: pdfGenerating ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
              {pdfGenerating ? 'Generating…' : '⬇ Full Report'}
            </button>
            {dataBlocks['brief'] && (
              <button onClick={generateSaaSBrief} disabled={briefGenerating} style={{ padding: '6px 16px', background: briefGenerating ? '#ffffff20' : N.blue, color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: briefGenerating ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
                {briefGenerating ? 'Generating…' : '⬇ Opportunity Brief'}
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 49px)' }}>
        {/* Left panel */}
        <div style={{ width: 320, background: N.navyMid, borderRight: '1px solid #ffffff10', padding: '24px 20px', flexShrink: 0, overflowY: 'auto' }}>

          {/* Company */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: N.blueMid, marginBottom: 6 }}>Company</label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} disabled={appState === 'running'}
              placeholder="e.g. Clay, Morning Consult, Notion"
              style={{ width: '100%', padding: '9px 12px', border: `1px solid #ffffff20`, borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 14, background: '#ffffff0d', color: '#fff' }} />
          </div>

          {/* Sector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: N.blueMid, marginBottom: 6 }}>Sector</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {["SaaS", "Data & Intelligence", "Marketplace", "Consumer Tech"].map(s => (
                <button key={s} onClick={() => appState !== 'running' && setSector(s)}
                  style={{ padding: '6px 12px', border: `1px solid ${sector===s?N.blue:'#ffffff20'}`, borderRadius: 4, background: sector===s?N.blue:'transparent', color: sector===s?'#fff':'#ffffff80', fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: sector===s?700:400, cursor: appState==='running'?'not-allowed':'pointer' }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Stage */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: N.blueMid, marginBottom: 6 }}>Stage</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {["Series B", "Series C", "Late Stage", "Public"].map(s => (
                <button key={s} onClick={() => appState !== 'running' && setStage(s)}
                  style={{ padding: '6px 12px', border: `1px solid ${stage===s?N.blue:'#ffffff20'}`, borderRadius: 4, background: stage===s?N.blue:'transparent', color: stage===s?'#fff':'#ffffff80', fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: stage===s?700:400, cursor: appState==='running'?'not-allowed':'pointer' }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Acquisition toggle */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button onClick={() => appState !== 'running' && setAcquisitionMode(m => !m)}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: acquisitionMode ? N.blue : '#ffffff20', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 3, left: acquisitionMode ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </button>
              <label style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: acquisitionMode ? N.blueMid : '#ffffff40', cursor: 'pointer' }} onClick={() => appState !== 'running' && setAcquisitionMode(m => !m)}>
                Acquisition Analysis
              </label>
            </div>
            {acquisitionMode && (
              <input type="text" value={acquirer} onChange={e => setAcquirer(e.target.value)} disabled={appState === 'running'}
                placeholder="e.g. Salesforce, HubSpot, LinkedIn"
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${N.blue}`, borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 13, background: '#ffffff0d', color: '#fff' }} />
            )}
          </div>

          {/* Context */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: N.blueMid, marginBottom: 6 }}>Context & Strategic Questions</label>
            <textarea value={context} onChange={e => setContext(e.target.value)} disabled={appState === 'running'}
              placeholder="Paste context brief, specific questions, or known data points here..."
              rows={8}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid #ffffff20`, borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 12, background: '#ffffff0d', color: '#fff', resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Test mode + Run */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <button onClick={() => appState !== 'running' && setTestMode(m => !m)}
              style={{ width: 36, height: 20, borderRadius: 10, border: 'none', background: testMode ? N.amber : '#ffffff20', position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', top: 3, left: testMode ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
            </button>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: testMode ? N.amber : '#ffffff40', letterSpacing: '.08em' }}>TEST MODE</span>
          </div>

          {appState === 'idle' || appState === 'done' || appState === 'error' ? (
            <button onClick={runSprint} style={{ width: '100%', padding: '12px', background: N.blue, color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '.08em', fontFamily: 'monospace' }}>
              {testMode ? '▶ TEST RUN (Agent 1)' : '▶ RUN SPRINT'}
            </button>
          ) : (
            <button onClick={cancel} style={{ width: '100%', padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '.08em', fontFamily: 'monospace' }}>
              ■ CANCEL
            </button>
          )}

          {/* Progress */}
          {appState === 'running' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 3, background: '#ffffff10', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(doneCount/totalAgents)*100}%`, background: N.blue, transition: 'width .5s', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: '#ffffff40', fontFamily: 'monospace', marginTop: 4 }}>{doneCount} / {totalAgents} agents complete</div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {/* Agent grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
            {SAAS_AGENTS.map(agent => {
              const st = statuses[agent.id] || 'idle';
              const stColor = { idle: '#ffffff15', queued: '#ffffff15', running: `${N.blue}30`, done: '#05966920', error: '#dc262620' }[st] || '#ffffff15';
              const borderCol = { idle: '#ffffff10', queued: '#ffffff20', running: N.blue, done: N.green, error: N.red }[st] || '#ffffff10';
              return (
                <div key={agent.id} style={{ background: stColor, border: `1px solid ${borderCol}`, borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {agentStatusIcon(st)}
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', flex: 1 }}>{agent.label}</span>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#ffffff40', textTransform: 'uppercase', letterSpacing: '.06em' }}>W{agent.wave}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#ffffff50', marginBottom: st === 'running' ? 6 : 0 }}>{agent.sub}</div>
                  {st === 'running' && typeof statuses[agent.id] === 'string' && statuses[agent.id].startsWith('searching') && (
                    <div style={{ fontSize: 9, color: N.blueMid, fontFamily: 'monospace' }}>🔍 {statuses[agent.id]}</div>
                  )}
                  {st === 'done' && results[agent.id] && (
                    <div style={{ fontSize: 9, color: '#ffffff60', marginTop: 4, maxHeight: 40, overflow: 'hidden' }}>
                      {results[agent.id].slice(0,120)}…
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div style={{ background: '#ffffff08', border: '1px solid #ffffff10', borderRadius: 6, padding: '12px 16px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: N.blueMid, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Sources ({sources.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sources.slice(0,20).map((s,i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 10, color: N.blueMid, background: '#2563eb15', padding: '3px 8px', borderRadius: 10, textDecoration: 'none', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title || s.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Idle state */}
          {appState === 'idle' && (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#fff', marginBottom: 12 }}>AdvisorSprint Intelligence</div>
              <div style={{ fontSize: 14, color: '#ffffff50', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                10-agent strategic analysis for B2B SaaS and technology companies. Enter a company and run the sprint.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
                {['Clay', 'Morning Consult', 'Notion', 'Rippling', 'Linear'].map(c => (
                  <button key={c} onClick={() => setCompany(c)}
                    style={{ padding: '8px 16px', background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: 20, color: '#ffffff80', fontSize: 12, cursor: 'pointer', fontFamily: "'Instrument Sans'" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

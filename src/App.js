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

You are the most senior strategic analyst on this engagement. Your output is a 2-page visual brief for a founder or VC.

## CRITICAL — YOUR FIRST OUTPUT MUST BE THE DATA BLOCK

STOP. Do not write any introduction, preamble, or analysis text.
Your response must begin with <<<DATA_BLOCK>>> on the very first line.
Fill every field with real data. Output the closing <<<END_DATA_BLOCK>>> marker.
Only after <<<END_DATA_BLOCK>>> may you write the BOLD STATEMENT line.

## DATA BLOCK — WRITE FIRST

<<<DATA_BLOCK>>>
{
  "agent": "brief",
  "kpis": [
    {"label": "DERIVED metric — e.g. Revenue per Client", "value": "computed number with unit", "sub": "calculation shown inline e.g. ARR $7M ÷ 237 clients = $29.5k", "trend": "up|down|flat|watch", "confidence": "H|M|L"},
    {"label": "DERIVED metric — e.g. Data Monetisation Rate", "value": "computed number", "sub": "calculation shown e.g. $0 recurring ÷ 250M datapoints = $0/point", "trend": "up|down|flat|watch", "confidence": "H|M|L"},
    {"label": "DERIVED metric — e.g. Synthetic Cost Gap", "value": "ratio or delta vs competitor", "sub": "calculation shown e.g. $10k/poll vs Aaru $700/poll = 14x disadvantage", "trend": "up|down|flat|watch", "confidence": "H|M|L"},
    {"label": "DERIVED metric — e.g. Threat Clock", "value": "X months remaining", "sub": "time before named competitor reaches critical mass in this company's primary segment", "trend": "up|down|flat|watch", "confidence": "H|M|L"}
  ],
  "moat": {
    "core": "One sentence: what the core moat is — data asset, switching cost, network effect, regulatory, brand. Be specific: not 'strong brand' but '250M human-verified survey responses no AI can replicate in 24 months'.",
    "durability": "H|M|L",
    "durabilityReason": "One sentence: why it is H/M/L — what specifically protects or erodes it",
    "breaker": "One sentence: the single thing that would break this moat — technology shift, regulatory change, data commodity, competitor move",
    "leverage": "One sentence: the highest-value untapped application of this moat — what product or motion would compound it fastest"
  },
  "topChurnDriver": "One sentence: the single biggest reason clients leave or pause — be specific: not 'competition' but 'election cycle dependency — clients pause in off-years because there is no recurring product that creates value between campaigns'. This reveals the deepest product-market fit gap.",
  "strengthsAndDeltas": [
    {
      "asset": "Name of the working asset — e.g. 'Embold non-partisan brand'",
      "currentState": "One sentence: what it is today — reach, usage, revenue contribution. Be specific with numbers.",
      "delta": "One sentence: what happens to ARR if this asset is doubled down on — specific number and mechanism. Format: +$XM ARR if [specific action].",
      "arrDelta": 0
    }
  ],
  "strategicTension": "One precise sentence: [signal A] while [signal B] — this means [implication]. Max 160 chars. Name the specific metric and the specific consequence.",
  "radarAxes": [
    {"axis": "Market Timing", "today": 0, "future": 0},
    {"axis": "Product Moat", "today": 0, "future": 0},
    {"axis": "Revenue Quality", "today": 0, "future": 0},
    {"axis": "GTM Efficiency", "today": 0, "future": 0},
    {"axis": "Competitive Pos.", "today": 0, "future": 0},
    {"axis": "Capital Efficiency", "today": 0, "future": 0}
  ],
  "segmentMap": [
    {
      "segment": "Segment name",
      "sizeMr": 0,
      "status": "owned|partial|at_risk",
      "growth": "high|medium|low",
      "threat": "Named competitor colonising this segment — blank if fully owned",
      "windowMonths": 0,
      "switchingCost": "LOW|MED|HIGH — how hard is it for a client in this segment to switch to the named competitor. LOW = no contract, commodity product, zero migration cost. HIGH = deep integration, proprietary data, long contract."
    }
  ],
  "revenueGaps": [
    {
      "gap": "gap description — what is missing",
      "arrGapM": 0,
      "playType": "SCALE|TRANSFORM|DEFEND",
      "mechanism": "specific motion — what action closes this gap",
      "bestPlaced": "Named competitor best positioned to take this gap if company does not move",
      "windowMonths": 0,
      "confidence": "H|M|L"
    }
  ],
  "marketSignals": [
    {
      "signal": "signal name (max 20 chars)",
      "evidence": "one evidence line with ARR/funding/customers (max 45 chars)",
      "competitorPlay": "what that competitor is specifically doing in this signal — one action (max 50 chars)",
      "momentum": "accelerating|building|mainstream|emerging|declining",
      "months18": "accelerating|building|mainstream|emerging|declining",
      "headroomPct": 0,
      "playType": "SCALE|TRANSFORM|DEFEND"
    }
  ],
  "moves": [
    {
      "title": "4 words max — name the motion or segment",
      "segment": "segment or motion targeted",
      "arrImpactM": 0,
      "playType": "SCALE|TRANSFORM|DEFEND",
      "mechanism": "specific motion — how this company reaches scale on this gap",
      "orgInstruction": "what must change — hire, build, restructure, ring-fence. One sentence.",
      "companyHas": "What the company already has that makes this move executable — data, relationships, product, team",
      "companyNeeds": "What the company still needs to build or hire to execute — be honest",
      "companyHas": "What the company already has that makes this move executable — data, product, relationships, team. One sentence.",
      "companyNeeds": "What the company must still build or hire — be honest. One sentence.",
      "pricingNote": "If the current pricing model is misaligned with this move — name it. E.g. 'CR charges per poll; correct metric is per seat — same clients at 3x ACV'. Leave blank if pricing is correctly aligned.",
      "contrarian": "The one insight the CEO has not considered — the non-obvious angle that makes this move more valuable or more urgent than it appears. One sentence. Do not restate the mechanism.",
      "confidence": "CONFIRMED|DERIVED|ESTIMATED|SIGNAL ONLY",
      "timeToRevenue": "Q1 2026",
      "filters": ["tag1", "tag2"],
      "rationale": "one sentence max 120 chars — why this company specifically, not a generic player",
      "evidence": "one evidence line with source max 80 chars"
    }
  ],
  "competitorThreats": [
    {
      "name": "competitor name",
      "arrEst": "$XM",
      "targeting": "which segment or motion they are colonising — be specific",
      "threatBy": "Q3 2026",
      "confidence": "H|M|L"
    }
  ],
  "diffDurability": [
    {
      "advantage": "Name of the differentiator — e.g. 'Human demographic accuracy'",
      "durabilityMonths": 0,
      "durabilityLabel": "Durable|~X mo|X-Y mo — use 'Durable' if >36 months, otherwise est. months",
      "erodingForce": "One sentence: what is actively eroding this advantage and at what pace",
      "isUrgent": false
    }
  ],
  "winningScenario": "Exactly 2 sentences. S1: if all 3 moves land, what does this company look like in 18 months — specific revenue, specific product, specific market position. S2: what is the single hardest thing that must go right for this scenario to happen.",
  "arrivalSequence": [],
  "globalComps": [
    {
      "market": "US|EU|IL|SEA|IN",
      "company": "comp company name",
      "stage": "what stage they were at when facing same dynamic (max 40 chars)",
      "whatHappened": "outcome — one line (max 60 chars)",
      "prediction": "what this predicts for this company — one line (max 60 chars)",
      "expansionNote": ""
    }
  ],
  "internationalPosture": "EXPAND|DEFEND|DOMESTIC",
  "page1Summary": "Exactly 2 sentences. S1: the single most important gap right now — which segment is at risk, how large, who is moving in, what right to win this company has. S2: why the window is closing NOW — what makes this urgent in the next 18 months. Home market only. Max 280 chars total.",
  "boldStatement": "One sentence. Max 140 chars. Names the specific window, the competitor who takes it if this company does not move, and the timeframe.",
  "categoryRead": {
    "globalTrend": "One sentence: where this category is structurally heading. No company names. Max 120 chars.",
    "leadMarket": "US|EU|IL|SEA",
    "homeMarketLag": "lag description or 'US is lead market'",
    "implication": "One sentence: what the structural shift means for this company's window. Max 120 chars."
  },
  "sectionHeaders": {
    "segmentMap": "8 words max — what the coverage map reveals",
    "revenueGaps": "8 words max — the single most important gap pattern",
    "marketSignals": "8 words max — what competitors are proving this company hasn't done",
    "radarGap": "8 words max — what the transformation requires"
  }
}
<<<END_DATA_BLOCK>>>


## FIELD INSTRUCTIONS — READ BEFORE WRITING DATA BLOCK

**kpis**: 4 DERIVED metrics only — computed from combining multiple data points. Never raw ARR or headcount. Each must show a calculation inline. Pick metrics that make Mike pause: cost disadvantage vs competitor, data asset monetisation rate, competitive velocity, cycle decay.

**topChurnDriver**: Name the single most common reason clients leave or pause — not "competition" but the specific behaviour. Election cycle dependency, switching to cheaper tool, dissatisfaction with delivery time. This is what a CEO needs to hear most because it reveals the hidden product-market fit gap.

**strengthsAndDeltas**: 2-3 rows maximum. Only assets that are ACTIVELY WORKING but UNDER-LEVERAGED. Each must have a specific ARR delta with a mechanism. Never include assets that are already fully utilised or already generating subscription revenue.

**diffDurability**: 3 rows maximum. One per core differentiator. durabilityMonths must be a genuine estimate — not "forever" for any advantage. isUrgent = true if window < 12 months. erodingForce must name the specific technology or competitor creating the erosion pressure.

**moat**: This is the most important section. Be specific and honest. Durability H = competitor cannot replicate in 24 months. M = 12-18 months. L = already replicable. The breaker must be the SINGLE most plausible threat. The leverage must be the highest-value untapped application — what this company could do with its moat that no one has tried yet.

**strategicTension**: The sentence Mike reads and thinks "that's exactly it." Name the specific metric contradiction and the specific 18-month consequence. Bad: "strong growth faces competition." Good: "250M datapoints generate $0 recurring while Aaru closes accuracy gap at 1/10th cost — the archive becomes stranded in 18 months."

**segmentMap**: Maximum 5 rows. windowMonths = months before a named competitor locks this segment. 0 = already lost. 36+ = no urgency. Be honest about at_risk segments.

**revenueGaps**: Maximum 4 rows. bestPlaced = the competitor most likely to take this gap if the company does not move — name them specifically. windowMonths = months before this gap closes or gets locked. Be aggressive with estimates.

**marketSignals**: Maximum 5 rows. competitorPlay = what that specific competitor is ACTIVELY DOING in this signal space — not what they could do, what they ARE doing with evidence.

**moves**: Exactly 3 moves. companyHas must be honest about existing assets — data, product, relationships, team. companyNeeds must be honest about gaps — if they need to hire an ML engineer, say so. This is what makes the brief credible.

**winningScenario**: Make it specific. Not "becomes a platform" but "$12M ARR with 60% subscription by Q3 2027, Magnify AI SaaS at 120 enterprise seats, Embold at $4M non-partisan revenue." Then name the single hardest thing.

**globalComps**: 3 comps maximum. Pick comps where the outcome teaches something specific — one that won, one that lost, one that took a different path. The prediction must be actionable, not observational.

**page1Summary**: This is the last thing on Page 1. It must land like a punch. Two sentences, no throat-clearing, no "Change Research is a..." opener.

**boldStatement**: The thing Mike will forward to his board. One sentence. Makes the threat and the window concrete.


## AFTER THE DATA BLOCK

Write exactly this after the DATA_BLOCK — nothing else:

**BOLD STATEMENT:**
[Your boldStatement here]

Do not add any other prose, headers, or sections. The DATA_BLOCK is the complete output. The bold statement line is the only thing after it.

---

## YOUR SYNTHESIS APPROACH — READ BEFORE FILLING THE DATA BLOCK
# AGENT 11: SAAS OPPORTUNITY BRIEF

## ⚡ CRITICAL — DO THIS FIRST BEFORE ANYTHING ELSE

Your FIRST action must be to write the DATA_BLOCK below. Do not write any prose, analysis, or explanation before the DATA_BLOCK. Begin your response with <<<DATA_BLOCK>>> on the very first line. End the DATA_BLOCK with <<<END_DATA_BLOCK>>> on its own line before writing anything else.

After completing the DATA_BLOCK, write exactly:

**BOLD STATEMENT:**
[one sentence]

That is all. No other prose.

## DATA BLOCK — WRITE THIS FIRST on this engagement. You have read every agent output and the full synopsis. Your job is one thing: produce a 2-page visual brief that makes a founder or VC want to read the full report.



## YOUR SYNTHESIS APPROACH

Read every agent output systematically before writing anything:
- Agent 1 (Market): category timing, TAM, structural forces → MARKET SIGNAL TABLE (home market signals only)
- Agent 2 (Product): moat components, disintermediation risk → STRATEGIC TENSION
- Agent 3 (GTM): motion efficiency, PLG/enterprise balance → REVENUE GAP TABLE + MOVES
- Agent 4 (Revenue): ARR health, Rule of 40, unit economics → KPI STRIP (derived metrics only)
- Agent 5 (Customer): ICP coverage, segment health, churn → SEGMENT COVERAGE MAP + topChurnDriver (single biggest reason clients leave — the product-market fit gap)
- Agent 6 (Competitive): THREE things — (a) moat threats → COMPETITIVE THREAT TIMELINE; (b) home-market competitors proving untried motions → MARKET SIGNALS TABLE; (c) switching cost per segment → segmentMap.switchingCost + diffDurability (which differentiators survive 18 months and which erode)
- Agent 7 (Funding): (a) valuation context, exit scenarios → KPI STRIP + VERDICT; (b) acquirer/investor assets not yet activated for this product → COMPETITIVE EDGE section
- Agent 8 (Pricing): pricing power, model stress → REVENUE GAP TABLE + moves.pricingNote (is the value metric correctly aligned for each move)
- Agent 9 (International): global comps, expansion signals → GLOBAL COMP SIGNAL (Page 2) + ARRIVAL SEQUENCE (Page 2, conditional on internationalPosture)

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

## GLOBAL COMP SIGNAL — POSTURE-AWARE

This section renders differently based on internationalPosture. Read the posture you assigned and write accordingly:

**If EXPAND:** Pick 4-5 companies that expanded internationally from a similar starting point. For each: which markets they entered first, what motion they used (PLG self-serve vs enterprise sales), what worked and what didn't, and what it predicts for this company's expansion sequence. This is the expansion playbook section — give the founder a concrete sequencing model.

**If DEFEND:** Pick 4-5 companies that faced a similar international competitive threat arriving in their home market. For each: what the threat was, how they responded (ignored/copied/acquired/partnered), what happened, and what it predicts for this company's defence strategy.

**If DOMESTIC:** Pick 4-5 companies at a comparable stage who faced the same structural category shift (not international expansion — same product/market dynamic). For each: what they did, what happened, and what it predicts for this company. Frame as strategic mirrors, not expansion comps. Header will read "COMPARABLE TRAJECTORIES."

In all cases: company name, what stage, what happened (max 60 chars), what it predicts for this company (max 60 chars).`;

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

  // For brief: prepend the full SAAS_BRIEF_PROMPT so server receives complete instructions
  // Server passes cleanedUserContext directly for brief — so prompt must include everything
  if (id === 'brief') {
    return SAAS_BRIEF_PROMPT + '\n\n' + prompt;
  }

  // For all other agents: server injects agent prompt via SAAS_PROMPTS
  // Just pass company/agent marker so server knows which prompt to inject
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
    h += `<div style="break-inside:avoid;page-break-inside:avoid;">`;
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
// ── JSON REPAIR UTILITY — handles all known model output malformations ────────
function repairJson(raw) {
  let s = raw
    .replace(/\/\/[^\n\r]*/g, '')        // remove // comments before newline collapse
    .replace(/\r\n|\r|\n/g, ' ')          // literal newlines → space
    .replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f]/g, '') // control chars
    .replace(/,(\s*[}\]])/g, '$1')          // trailing commas
    .replace(/\[\s*\.\.\.\s*\]/g, '[]') // [...] → []
    .replace(/\{\s*\.\.\.\s*\}/g, '{}'); // {...} → {}
  const start = s.indexOf('{');
  if (start === -1) return s;
  let depth = 0, end = -1, inString = false, escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end !== -1) s = s.slice(start, end + 1);
  return s;
}

function buildSaaSBriefHtml({ company, acquirer, sector, stage, results, dataBlocks, companyMode='standalone' }) {
  const db = dataBlocks['brief'] || {};
  const raw = results['brief'] || '';

  const boldMatch = raw.match(/BOLD STATEMENT[^\n]*\n([^\n]+)/i);
  const boldStatement = boldMatch ? boldMatch[1].trim().replace(/^\*+|\*+$/g,'') : (db.boldStatement || '');

  const kpis             = Array.isArray(db.kpis)              ? db.kpis              : [];
  const radarAxes        = Array.isArray(db.radarAxes)         ? db.radarAxes         : [];
  const segmentMap       = Array.isArray(db.segmentMap)        ? db.segmentMap        : [];
  const revenueGaps      = Array.isArray(db.revenueGaps)       ? db.revenueGaps       : [];
  const marketSignals    = Array.isArray(db.marketSignals)     ? db.marketSignals     : [];
  const arrivalSequence  = Array.isArray(db.arrivalSequence)   ? db.arrivalSequence   : [];
  const intlPosture      = db.internationalPosture || 'EXPAND';
  const competitiveEdge  = Array.isArray(db.competitiveEdge)   ? db.competitiveEdge   : [];
  const moves            = Array.isArray(db.moves)             ? db.moves             : [];
  const competitors      = Array.isArray(db.competitorThreats) ? db.competitorThreats : [];
  const globalComps      = Array.isArray(db.globalComps)       ? db.globalComps       : [];
  const categoryRead     = db.categoryRead || null;
  const sectionHdrs      = db.sectionHeaders || {};
  const tension          = db.strategicTension || '';
  const strengthsDeltas  = Array.isArray(db.strengthsAndDeltas) ? db.strengthsAndDeltas : [];
  const diffDurability   = Array.isArray(db.diffDurability)    ? db.diffDurability    : [];
  const topChurnDriver   = db.topChurnDriver || '';
  const moat             = db.moat || null;

  const dateStr = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  const subtitleLine = [sector, stage, acquirer ? `Acquirer: ${acquirer}` : null].filter(Boolean).join(' · ');

  const C = {
    navy:'#0f1f3d', navyMid:'#1e3a5f',
    blue:'#2563eb', blueMid:'#3b82f6', blueLight:'#dbeafe',
    purple:'#7c3aed', purpleLight:'#ede9fe',
    green:'#059669', amber:'#d97706', red:'#dc2626',
    ink:'#1a1a2e', inkMid:'#4a5568', inkFaint:'#9aa5b4',
    sand:'#e2e8f0', parchment:'#f8fafc', white:'#ffffff',
  };

  const playConfig = {
    SCALE:     { colour:C.navy,   icon:'⚡', label:'SCALE',     sub:'Extend existing motion' },
    TRANSFORM: { colour:C.purple, icon:'◈', label:'TRANSFORM', sub:'New capability required' },
    DEFEND:    { colour:C.red,    icon:'◇', label:'DEFEND',    sub:'Protect before expanding' },
  };
  const playShort = { SCALE:'SCL', TRANSFORM:'TRF', DEFEND:'DEF' };
  const pageStyle = `width:794px;min-height:1120px;max-height:1122px;overflow:visible;background:#fff;padding:36px;box-sizing:border-box;position:relative;font-family:'Instrument Sans',sans-serif;color:${C.ink};`;

  // ── KPI STRIP ──────────────────────────────────────────────────────────
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

  // ── TENSION BANNER (with moat + churn driver sub-row) ──────────────────
  function renderTensionBanner(tension, moat, churnDriver) {
    if (!tension && !moat) return '';
    const moatText = moat ? moat.core : '';
    return `<div style="background:${C.navy};border-radius:4px;padding:12px 16px;margin-bottom:12px;">
      <div style="font-size:6.5px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px;font-family:monospace;">THE STRATEGIC TENSION</div>
      <div style="font-size:11px;font-weight:600;color:#fff;line-height:1.6;font-style:italic;">${tension}</div>
      ${(moatText || churnDriver) ? `
      <div style="display:grid;grid-template-columns:${moatText && churnDriver ? '1fr 1fr' : '1fr'};gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12);">
        ${moatText ? `<div>
          <div style="font-size:6px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#93c5fd;margin-bottom:3px;font-family:monospace;">THE MOAT</div>
          <div style="font-size:7.5px;color:#93c5fd;line-height:1.4;">${moatText}</div>
        </div>` : ''}
        ${churnDriver ? `<div>
          <div style="font-size:6px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#fca5a5;margin-bottom:3px;font-family:monospace;">TOP CHURN DRIVER</div>
          <div style="font-size:7.5px;color:#fca5a5;line-height:1.4;">${churnDriver}</div>
        </div>` : ''}
      </div>` : ''}
    </div>`;
  }

  // ── STRENGTHS + DELTAS (asset cards) ───────────────────────────────────
  function renderStrengthsDeltas(items) {
    if (!items.length) return '';
    const cols = Math.min(items.length, 3);
    let h = `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;margin-bottom:12px;">`;
    items.slice(0,3).forEach(item => {
      const arr = item.arrDelta || 0;
      const arrStr = arr > 0 ? `+$${arr}M ARR` : item.delta ? '' : '';
      h += `<div style="border:1px solid ${C.sand};border-radius:4px;overflow:hidden;">
        <div style="background:${C.parchment};padding:5px 8px;border-bottom:1px solid ${C.sand};">
          <div style="font-size:8px;font-weight:800;color:${C.navy};white-space:normal;">${item.asset||''}</div>
          <div style="font-size:6.5px;color:${C.inkMid};margin-top:2px;line-height:1.3;white-space:normal;">${item.currentState||''}</div>
        </div>
        <div style="background:#fff;padding:5px 8px;display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;align-items:center;gap:4px;">
            <div style="flex:1;height:1px;background:${C.sand};"></div>
            <span style="font-size:8px;color:${C.green};">▶</span>
          </div>
          <div style="background:#f0fdf4;border-radius:3px;padding:5px 7px;">
            ${arrStr ? `<div style="font-size:12px;font-weight:900;color:${C.green};line-height:1;">${arrStr}</div>` : ''}
            <div style="font-size:6.5px;color:#166534;line-height:1.3;margin-top:2px;white-space:normal;">${item.delta||''}</div>
          </div>
        </div>
      </div>`;
    });
    h += '</div>';
    return h;
  }

  // ── GAP VELOCITY TABLE (replaces segment map) ──────────────────────────
  function renderGapVelocity(segs) {
    if (!segs.length) return '';
    const statusCol = { owned:C.green, partial:C.amber, at_risk:C.red };
    const scCol = { LOW:C.red, MED:C.amber, HIGH:C.green };
    const scBg  = { LOW:'#fee2e2', MED:'#fef9c3', HIGH:'#dcfce7' };
    const scTxt = { LOW:'#991b1b', MED:'#854d0e', HIGH:'#166534' };
    let h = `<table style="width:100%;border-collapse:collapse;font-size:7px;">
      <thead><tr>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">SEGMENT / GAP</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:right;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">$M TAM</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">STATUS</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">THREAT — WHAT THEY'RE DOING NOW</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">SWITCH COST</th>
        <th style="background:${C.navy};color:#fff;padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">WINDOW</th>
      </tr></thead><tbody>`;
    segs.slice(0,5).forEach((s, i) => {
      const bg = i%2===0?'#fff':C.parchment;
      const sc = statusCol[s.status] || C.inkMid;
      const sl = {owned:'OWNED',partial:'PARTIAL',at_risk:'AT RISK'}[s.status] || s.status;
      const sw = s.switchingCost || 'MED';
      const swBg = scBg[sw] || scBg.MED;
      const swTxt = scTxt[sw] || scTxt.MED;
      const wm = s.windowMonths || 0;
      const wmCol = wm > 0 && wm <= 9 ? C.red : wm <= 15 ? C.amber : C.green;
      const wmPct = wm > 0 ? Math.min((wm/24)*100, 100) : 0;
      const wmLabel = wm > 0 ? `${wm} mo` : '—';
      h += `<tr>
        <td style="padding:5px 8px;background:${bg};font-weight:700;color:${C.navy};white-space:normal;">${s.segment||''}</td>
        <td style="padding:5px 8px;background:${bg};text-align:right;font-weight:700;">$${s.sizeMr||'—'}M</td>
        <td style="padding:5px 8px;background:${bg};"><span style="background:${sc}22;color:${sc};font-size:6px;font-weight:800;padding:2px 5px;border-radius:2px;font-family:monospace;">${sl}</span></td>
        <td style="padding:5px 8px;background:${bg};font-size:7px;color:${C.inkMid};white-space:normal;">${s.threat||'—'}</td>
        <td style="padding:5px 8px;background:${bg};text-align:center;"><span style="background:${swBg};color:${swTxt};font-size:6px;font-weight:800;padding:2px 5px;border-radius:2px;font-family:monospace;">${sw}</span></td>
        <td style="padding:5px 8px;background:${bg};text-align:center;">
          ${wm > 0 ? `<div style="font-size:7px;font-weight:800;color:${wmCol};font-family:monospace;margin-bottom:2px;">${wmLabel}</div>
          <div style="background:${C.sand};border-radius:2px;height:4px;"><div style="background:${wmCol};width:${wmPct}%;height:4px;border-radius:2px;"></div></div>` : '<span style="color:'+C.inkFaint+';font-size:7px;">—</span>'}
        </td>
      </tr>`;
    });
    h += '</tbody></table>';
    return h;
  }

  // ── REVENUE GAP TABLE ──────────────────────────────────────────────────
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
      const bg = i%2===0?'#fff':C.parchment;
      const pc = playConfig[g.playType] || playConfig.SCALE;
      const ps = playShort[g.playType] || g.playType;
      const cc = g.confidence==='H'?C.green:g.confidence==='M'?C.amber:C.red;
      h += `<tr>
        <td style="padding:3px 6px;background:${bg};border-left:3px solid ${pc.colour};">
          <div style="font-weight:700;color:${C.navy};font-size:7.5px;white-space:normal;">${g.gap||''}</div>
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

  // ── MARKET SIGNAL TABLE ────────────────────────────────────────────────
  function renderMarketSignals(signals) {
    if (!signals.length) return '';
    const momentumCol = { accelerating:C.green, building:C.blue, mainstream:C.navy, emerging:C.amber, declining:C.red };
    const momentumW   = { accelerating:90, building:70, mainstream:100, emerging:40, declining:20 };
    let h = `<table style="width:100%;border-collapse:collapse;font-size:7px;">
      <thead><tr style="background:${C.navy};color:#fff;">
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:100px;">SIGNAL</th>
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">EVIDENCE</th>
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">WHAT THEY'RE DOING</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:70px;">NOW → 18MO</th>
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;font-family:monospace;width:40px;">PLAY</th>
      </tr></thead><tbody>`;
    signals.slice(0,4).forEach((s, i) => {
      const bg = i%2===0?'#fff':C.parchment;
      const nowCol = momentumCol[s.momentum] || C.inkMid;
      const futCol = momentumCol[s.months18] || C.inkMid;
      const nowW = momentumW[s.momentum] || 50;
      const futW = momentumW[s.months18] || 50;
      const arrow = futW > nowW ? '↑' : futW < nowW ? '↓' : '→';
      const pc = playConfig[s.playType] || playConfig.SCALE;
      const ps = playShort[s.playType] || s.playType;
      h += `<tr>
        <td style="padding:5px 8px;background:${bg};">
          <div style="font-weight:700;color:${C.navy};">${s.signal||''}</div>
          ${s.headroomPct != null ? `<div style="margin-top:3px;background:${C.sand};border-radius:2px;height:3px;"><div style="background:${C.blue};width:${Math.min(s.headroomPct,100)}%;height:3px;border-radius:2px;"></div></div><div style="font-size:6px;color:${C.blue};margin-top:1px;">${s.headroomPct}% headroom</div>` : ''}
        </td>
        <td style="padding:3px 6px;background:${bg};color:${C.inkMid};white-space:normal;">${s.evidence||''}</td>
        <td style="padding:3px 6px;background:${bg};font-size:6.5px;color:${C.inkMid};white-space:normal;">${s.competitorPlay||s.evidence||''}</td>
        <td style="padding:5px 8px;background:${bg};text-align:center;">
          <div style="display:flex;align-items:center;gap:3px;">
            <div style="flex:1;background:${C.sand};border-radius:2px;height:4px;"><div style="background:${nowCol};width:${nowW}%;height:4px;border-radius:2px;"></div></div>
            <span style="font-size:7px;color:${C.inkFaint};">${arrow}</span>
            <div style="flex:1;background:${C.sand};border-radius:2px;height:4px;"><div style="background:${futCol};width:${futW}%;height:4px;border-radius:2px;"></div></div>
          </div>
          <div style="font-size:6px;color:${futCol};font-weight:700;text-align:center;margin-top:1px;">${s.months18||''}</div>
        </td>
        <td style="padding:5px 8px;background:${bg};text-align:center;"><span style="background:${pc.colour};color:#fff;font-size:6px;font-weight:800;padding:2px 3px;border-radius:2px;font-family:monospace;">${ps}</span></td>
      </tr>`;
    });
    h += '</tbody></table>';
    return h;
  }

  // ── RADAR ──────────────────────────────────────────────────────────────
  function renderRadar(axes) {
    if (!axes || axes.length < 3) return '<div style="height:180px;display:flex;align-items:center;justify-content:center;color:#999;font-size:10px;">No radar data</div>';
    const n = axes.length;
    const CX=140, CY=105, R=80, LABEL_R=98;
    const toRad = deg => (deg - 90) * Math.PI / 180;
    const pt = (val, i) => { const a=toRad((360/n)*i); const r=(val/100)*R; return [CX+r*Math.cos(a), CY+r*Math.sin(a)]; };
    const todayPts = axes.map((a,i) => pt(a.today||0, i));
    const futurePts = axes.map((a,i) => pt(a.future||0, i));
    const toPath = pts => pts.map((p,i)=>`${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')+'Z';
    let svg = `<svg viewBox="0 0 295 215" xmlns="http://www.w3.org/2000/svg" style="width:250px;height:182px;">`;
    [20,40,60,80,100].forEach(pct => {
      const r=(pct/100)*R;
      const pts2=axes.map((_,i)=>{const a=toRad((360/n)*i);return `${(CX+r*Math.cos(a)).toFixed(1)},${(CY+r*Math.sin(a)).toFixed(1)}`;});
      svg += `<polygon points="${pts2.join(' ')}" fill="none" stroke="${C.sand}" stroke-width="0.8"/>`;
    });
    axes.forEach((_,i)=>{ const [x,y]=pt(100,i); svg += `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${C.sand}" stroke-width="0.8"/>`; });
    svg += `<path d="${toPath(todayPts)}" fill="${C.navy}30" stroke="${C.navy}" stroke-width="1.5"/>`;
    svg += `<path d="${toPath(futurePts)}" fill="${C.blue}20" stroke="${C.blue}" stroke-width="1.5" stroke-dasharray="4,2"/>`;
    axes.forEach((ax,i)=>{
      const angle=toRad((360/n)*i);
      const lx=CX+LABEL_R*Math.cos(angle); const ly=CY+LABEL_R*Math.sin(angle);
      const anchor=Math.cos(angle)>0.15?'start':Math.cos(angle)<-0.15?'end':'middle';
      const label=(ax.axis||'').slice(0,18);
      const words=label.split(' ');
      const isBottom=Math.sin(angle)>0.4;
      const yOff=isBottom?9:0;
      if (words.length>1) {
        svg += `<text x="${lx.toFixed(1)}" y="${(ly-1+yOff).toFixed(1)}" text-anchor="${anchor}" font-size="7" font-weight="700" fill="${C.navy}" font-family="monospace">${words[0]}</text>`;
        svg += `<text x="${lx.toFixed(1)}" y="${(ly+8+yOff).toFixed(1)}" text-anchor="${anchor}" font-size="7" font-weight="700" fill="${C.navy}" font-family="monospace">${words.slice(1).join(' ')}</text>`;
      } else {
        svg += `<text x="${lx.toFixed(1)}" y="${(ly+3+yOff).toFixed(1)}" text-anchor="${anchor}" font-size="7" font-weight="700" fill="${C.navy}" font-family="monospace">${label}</text>`;
      }
    });
    svg += '</svg>';
    const scoreRows = axes.map(ax => {
      const t = Math.round(ax.today||0);
      const f = Math.round(ax.future||0);
      const d = f - t;
      const dStr = d > 0 ? `+${d}` : `${d}`;
      const dCol = d > 0 ? C.green : C.red;
      return `<tr>
        <td style="font-size:6px;color:${C.inkMid};padding:1px 4px;font-family:monospace;">${(ax.axis||'').slice(0,20)}</td>
        <td style="font-size:6px;font-weight:700;color:${C.navy};padding:1px 4px;text-align:center;">${t}</td>
        <td style="font-size:6px;font-weight:700;color:${dCol};padding:1px 4px;text-align:center;">${dStr}</td>
      </tr>`;
    }).join('');
    return svg + `<table style="width:100%;border-collapse:collapse;margin-top:4px;"><tbody>${scoreRows}</tbody></table>`;
  }



  // ── DIFFERENTIATION DURABILITY ─────────────────────────────────────────
  function renderDiffDurability(items) {
    if (!items.length) return '';
    const urgentCol = { true: C.red, false: C.green };
    return `<div style="border:1px solid ${C.sand};border-radius:4px;overflow:hidden;">
      <div style="background:${C.parchment};padding:5px 10px;border-bottom:1px solid ${C.sand};">
        <div style="font-size:7px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">DIFFERENTIATION DURABILITY</div>
      </div>` +
      items.slice(0,3).map(item => {
        const isUrgent = item.isUrgent === true;
        const badgeBg  = isUrgent ? '#fee2e2' : item.durabilityLabel === 'Durable' ? '#dcfce7' : '#fef9c3';
        const badgeTxt = isUrgent ? '#991b1b' : item.durabilityLabel === 'Durable' ? '#166534' : '#854d0e';
        return `<div style="display:grid;grid-template-columns:1fr auto;align-items:start;gap:8px;padding:7px 10px;border-bottom:1px solid ${C.sand};">
          <div>
            <div style="font-size:8px;font-weight:800;color:${C.navy};margin-bottom:2px;">${item.advantage||''}</div>
            <div style="font-size:6.5px;color:${C.inkMid};line-height:1.3;white-space:normal;">${item.erodingForce||''}</div>
          </div>
          <span style="background:${badgeBg};color:${badgeTxt};font-size:7px;font-weight:800;padding:2px 7px;border-radius:3px;white-space:nowrap;font-family:monospace;">${item.durabilityLabel||'—'}</span>
        </div>`;
      }).join('') +
      `<div style="background:${C.parchment};padding:4px 10px;border-top:1px solid ${C.sand};"><div style="font-size:6px;color:${C.inkFaint};font-family:monospace;">GREEN = durable >36 mo · AMBER = eroding · RED = closing <12 mo</div></div>
    </div>`;
  }

  // ── MOVE CARDS ──────────────────────────────────────────────────────────
  function renderMoveCards(moves) {
    if (!moves.length) return '';
    const confCol = c => ({CONFIRMED:C.green,DERIVED:C.blue,ESTIMATED:C.amber,'SIGNAL ONLY':C.red})[c]||C.amber;
    return moves.slice(0,3).map((m,i) => {
      const pcfg = playConfig[m.playType] || playConfig.SCALE;
      const conf = m.confidence || 'ESTIMATED';
      const cc = confCol(conf);
      const numLabel = ['①','②','③'][i]||`${i+1}`;
      return `<div style="background:#fff;border:1px solid ${C.sand};border-radius:4px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="background:${pcfg.colour};padding:4px 8px;display:flex;align-items:center;gap:5px;">
          <span style="font-size:7px;font-weight:800;color:#fff;letter-spacing:.08em;font-family:monospace;">${pcfg.icon} ${pcfg.label}</span>
          <span style="font-size:5.5px;color:rgba(255,255,255,.6);font-style:italic;">${pcfg.sub}</span>
        </div>
        <div style="padding:4px 7px;flex:1;display:flex;flex-direction:column;gap:2px;">
          <div style="display:flex;align-items:flex-start;gap:5px;">
            <span style="font-size:12px;color:${pcfg.colour};line-height:1;flex-shrink:0;">${numLabel}</span>
            <span style="font-size:8.5px;font-weight:800;color:${C.navy};line-height:1.2;white-space:normal;">${m.title||''}</span>
          </div>
          <div style="font-size:5.5px;color:${C.inkMid};font-style:italic;white-space:normal;">${m.segment||''} · First revenue: <strong style="color:${C.navy};">${m.timeToRevenue||'TBD'}</strong></div>
          <div style="display:flex;align-items:baseline;gap:3px;">
            <span style="font-size:15px;font-weight:900;color:${C.navy};line-height:1;">$${m.arrImpactM||'?'}</span>
            <span style="font-size:6.5px;color:${C.inkFaint};">M ARR</span>
            <span style="background:${cc};color:#fff;font-size:5.5px;font-weight:700;padding:1px 3px;border-radius:2px;margin-left:3px;">${conf}</span>
          </div>
          ${m.contrarian ? `<div style="font-size:6.5px;color:${C.blue};font-weight:600;line-height:1.3;border-left:2px solid ${C.blue};padding:2px 5px;background:${C.blueLight};border-radius:0 3px 3px 0;white-space:normal;overflow:hidden;>
            <span style="font-size:5.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${C.navy};display:block;font-family:monospace;">THE INSIGHT</span>
            ${m.contrarian}
          </div>` : ''}
          ${m.pricingNote ? `<div style="font-size:6px;color:${C.purple};background:${C.purpleLight};padding:2px 5px;border-radius:3px;border-left:2px solid ${C.purple};white-space:normal;overflow:hidden;">
            <span style="font-size:5.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${C.purple};display:block;font-family:monospace;">PRICING FIX</span>
            ${m.pricingNote}
          </div>` : ''}
          ${m.orgInstruction ? `<div style="margin-top:1px;"><span style="font-size:5.5px;font-weight:800;letter-spacing:.08em;color:${pcfg.colour};font-family:monospace;">ORG — </span><span style="font-size:6px;color:${C.inkMid};white-space:normal;">${m.orgInstruction}</span></div>` : ''}
          <div style="font-size:5.5px;color:${C.inkFaint};border-top:1px solid ${C.sand};padding-top:2px;margin-top:auto;white-space:normal;">${m.evidence||''}</div>
        </div>
      </div>`;
    }).join('');
  }


  // ── GLOBAL COMP STRIP ──────────────────────────────────────────────────
  function renderGlobalComps(comps) {
    if (!comps.length) return '';
    const mktCol = { US:'#1a3a5c', EU:'#1e3a5f', IL:'#7c3aed', SEA:'#059669', IN:'#d97706' };
    return `<div style="display:grid;grid-template-columns:repeat(${Math.min(comps.length,3)},1fr);gap:8px;">` +
      comps.slice(0,3).map(c => {
        const mc = mktCol[c.market] || C.navy;
        return `<div style="background:#fff;border:1px solid ${C.sand};border-radius:3px;padding:5px 8px;border-top:2.5px solid ${mc};">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <span style="background:${mc};color:#fff;font-size:6px;font-weight:800;padding:2px 5px;border-radius:2px;font-family:monospace;">${c.market||'?'}</span>
            <span style="font-size:8px;font-weight:800;color:${C.navy};white-space:normal;">${c.company||''}</span>
          </div>
          <div style="font-size:6.5px;color:${C.inkFaint};margin-bottom:3px;">At ${c.stage||'comparable stage'}</div>
          <div style="font-size:6.5px;color:${C.inkMid};line-height:1.3;margin-bottom:2px;white-space:normal;">${c.whatHappened||''}</div>
          ${c.expansionNote ? `<div style="font-size:6.5px;color:${C.green};font-weight:600;margin-bottom:3px;white-space:normal;">↗ ${c.expansionNote}</div>` : ''}
          <div style="font-size:6.5px;color:${C.blue};font-weight:600;line-height:1.3;border-left:2px solid ${C.blue};padding-left:4px;white-space:normal;">${c.prediction||''}</div>
        </div>`;
      }).join('') + '</div>';
  }

  // ── COMPETITOR THREATS ─────────────────────────────────────────────────
  function renderCompetitorThreats(comps) {
    if (!comps.length) return '';
    return `<div style="display:grid;grid-template-columns:repeat(${Math.min(comps.length,3)},1fr);gap:8px;">` +
      comps.slice(0,3).map(c => `
        <div style="background:#fff;border:1px solid ${C.sand};border-radius:3px;padding:6px 8px;border-top:2.5px solid ${C.red};">
          <div style="font-size:8px;font-weight:800;color:${C.navy};margin-bottom:2px;white-space:normal;">${c.name||''}</div>
          <div style="font-size:12px;font-weight:900;color:${C.red};margin-bottom:2px;line-height:1;">${c.arrEst||'?'}</div>
          <div style="font-size:6.5px;color:${C.inkMid};margin-bottom:2px;line-height:1.3;white-space:normal;">Targeting: ${c.targeting||''}</div>
          <div style="font-size:7px;color:${C.inkFaint};">Threat by: <strong style="color:${C.red};">${c.threatBy||'TBD'}</strong></div>
        </div>`).join('') + '</div>';
  }

  // ── ARRIVAL SEQUENCE ───────────────────────────────────────────────────
  function renderArrivalSequence(seq) {
    if (!seq.length) return '';
    const mktCol = { US:'#1a3a5c', EU:'#1e3a5f', IL:'#7c3aed', SEA:'#059669', IN:'#d97706' };
    const confCol = { H:C.navy, M:C.amber, L:'#bbb' };
    let h = `<table style="width:100%;border-collapse:collapse;font-size:7px;">
      <thead><tr style="background:${C.navy};color:#fff;">
        <th style="padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;width:35px;font-family:monospace;">MKT</th>
        <th style="padding:5px 8px;text-align:left;font-size:6.5px;letter-spacing:.06em;font-family:monospace;">SHIFT ARRIVING</th>
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

  // ── COMPETITIVE EDGE ───────────────────────────────────────────────────
  function renderCompetitiveEdge(assets) {
    if (!assets.length) return '';
    const statusCol = { untapped:C.red, partial:C.amber };
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

  // ── ASSEMBLE PAGE 1 ────────────────────────────────────────────────────
  const page1 = `<div class="page" style="${pageStyle}">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:12px;border-bottom:3px solid ${C.navy};">
    <div>
      <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${C.blue};margin-bottom:4px;font-family:monospace;">OPPORTUNITY BRIEF</div>
      <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:900;color:${C.navy};line-height:1;">${company}</div>
      <div style="font-size:9px;color:${C.inkFaint};margin-top:3px;">${subtitleLine}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(15,31,61,.18);font-family:monospace;">AdvisorSprint</div>
      <div style="font-size:7.5px;color:rgba(15,31,61,.18);margin-top:2px;">Harsha Belavady</div>
    </div>
  </div>

  ${renderKPIs(kpis)}

  ${renderTensionBanner(tension, moat, topChurnDriver)}

  ${strengthsDeltas.length ? `
  <div style="margin-bottom:8px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};margin-bottom:6px;font-family:monospace;">WHAT'S WORKING — AND WHAT DOUBLING DOWN UNLOCKS</div>
    ${renderStrengthsDeltas(strengthsDeltas)}
  </div>` : ''}

  <div style="margin-bottom:8px;">
    <div style="margin-bottom:6px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">GAP VELOCITY — HOW FAST EACH GAP IS CLOSING AND WHO IS CLOSING IT</div>
      ${sectionHdrs.segmentMap ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.segmentMap}</div>` : ''}
    </div>
    ${renderGapVelocity(segmentMap)}
  </div>

  <div style="margin-bottom:8px;">
    <div style="margin-bottom:6px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">REVENUE GAP ANALYSIS</div>
      ${sectionHdrs.revenueGaps ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.revenueGaps}</div>` : ''}
    </div>
    ${renderRevenueGaps(revenueGaps)}
  </div>

  <div style="margin-bottom:10px;">
    <div style="margin-bottom:6px;">
      <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};font-family:monospace;">WHAT THE MARKET IS TELLING YOU</div>
      ${sectionHdrs.marketSignals ? `<div style="font-size:7.5px;color:${C.inkMid};font-style:italic;margin-top:2px;">${sectionHdrs.marketSignals}</div>` : ''}
    </div>
    ${renderMarketSignals(marketSignals)}
  </div>

  ${competitiveEdge.length ? `
  <div style="margin-bottom:10px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};margin-bottom:6px;font-family:monospace;">${companyMode==='acquired'?'ACQUIRER EDGE NOT DEPLOYED':'STRUCTURAL ADVANTAGE'}</div>
    ${renderCompetitiveEdge(competitiveEdge)}
  </div>` : ''}

  ${db.page1Summary ? `
  <div style="background:${C.blueLight};border-radius:3px;padding:10px 14px;margin-bottom:6px;display:flex;align-items:center;gap:12px;">
    <div style="flex:1;">
      <div style="font-size:6px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};margin-bottom:3px;font-family:monospace;">SITUATION SUMMARY · THE CASE FOR ACTION</div>
      <div style="font-size:7.5px;color:${C.navy};line-height:1.4;font-weight:500;">${db.page1Summary}</div>
    </div>
    <div style="flex-shrink:0;text-align:center;padding-left:12px;border-left:2px solid ${C.sand};">
      <div style="font-size:7px;color:${C.inkFaint};margin-bottom:2px;">continued</div>
      <div style="font-size:16px;color:${C.blue};font-weight:800;line-height:1;">→</div>
      <div style="font-size:6.5px;color:${C.blue};font-weight:700;">Page 2</div>
    </div>
  </div>` : ''}

  <div style="position:absolute;bottom:18px;left:36px;right:36px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:6.5px;color:${C.inkFaint};letter-spacing:.06em;font-family:monospace;">ADVISORSPRINT INTELLIGENCE · CONFIDENTIAL</div>
    <div style="font-size:6.5px;color:${C.inkFaint};font-family:monospace;">PAGE 1 OF 2</div>
  </div>
</div>`;

  // ── ASSEMBLE PAGE 2 ────────────────────────────────────────────────────
  const page2 = `<div class="page" style="${pageStyle}">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid ${C.sand};">
    <div>
      <div style="font-size:8px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${C.blue};font-family:monospace;">WHERE TO PLAY · HOW TO WIN</div>
      <div style="font-size:16px;font-weight:800;color:${C.navy};">${company} · 18-Month Action Plan</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;">
      <span style="background:${C.navy};color:#fff;font-size:6px;font-weight:800;padding:2px 6px;border-radius:2px;font-family:monospace;">⚡ SCALE</span>
      <span style="background:${C.purple};color:#fff;font-size:6px;font-weight:800;padding:2px 6px;border-radius:2px;font-family:monospace;">◈ TRANSFORM</span>
      <span style="background:${C.red};color:#fff;font-size:6px;font-weight:800;padding:2px 6px;border-radius:2px;font-family:monospace;">◇ DEFEND</span>
      <span style="background:${intlPosture==='EXPAND'?C.green:intlPosture==='DEFEND'?C.amber:'#6b7280'};color:#fff;font-size:6px;font-weight:800;padding:2px 6px;border-radius:2px;font-family:monospace;">${intlPosture==='EXPAND'?'↗ EXPAND':intlPosture==='DEFEND'?'⚠ DEFEND MARKET':'◎ DOMESTIC'}</span>
      <div style="font-size:6.5px;color:${C.inkFaint};font-family:monospace;margin-left:4px;">PAGE 2 OF 2</div>
    </div>
  </div>

  ${tension ? `<div style="background:${C.navy};border-radius:4px;padding:7px 14px;margin-bottom:6px;">
    <div style="font-size:6.5px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px;font-family:monospace;">THE STRATEGIC TENSION</div>
    <div style="font-size:11px;font-weight:600;color:#fff;line-height:1.6;font-style:italic;">${tension}</div>
  </div>` : ''}

  <div style="display:grid;grid-template-columns:260px 1fr;gap:10px;margin-bottom:6px;">
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
      ${diffDurability.length ? `<div style="margin-top:10px;">${renderDiffDurability(diffDurability)}</div>` : ''}
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

  ${categoryRead ? `<div style="display:grid;grid-template-columns:1fr 90px 110px;gap:0;background:#fff;border:1px solid ${C.sand};border-left:3px solid ${C.blue};border-radius:0 3px 3px 0;padding:5px 10px;margin-bottom:6px;align-items:center;">
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

  ${intlPosture!=='DOMESTIC'&&arrivalSequence.length ? `
  <div style="margin-bottom:12px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.navy};margin-bottom:6px;padding-bottom:4px;border-bottom:1.5px solid ${C.navy};font-family:monospace;">${intlPosture==='EXPAND'?'INTERNATIONAL EXPANSION SEQUENCE':'INTERNATIONAL ARRIVAL THREATS'}</div>
    ${renderArrivalSequence(arrivalSequence)}
  </div>` : ''}

  ${globalComps.length ? `
  <div style="margin-bottom:6px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.blue};margin-bottom:4px;padding-bottom:3px;border-bottom:1.5px solid ${C.blue};font-family:monospace;">${intlPosture==='DOMESTIC'?'COMPARABLE TRAJECTORIES — STRATEGIC MIRRORS':'GLOBAL COMP SIGNAL — PATTERN MATCH'}</div>
    ${renderGlobalComps(globalComps)}
  </div>` : ''}

  ${competitors.length ? `
  <div style="margin-bottom:6px;">
    <div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.red};margin-bottom:4px;padding-bottom:3px;border-bottom:1.5px solid ${C.red};font-family:monospace;">IF YOU DON'T MOVE — THEY WILL</div>
    ${renderCompetitorThreats(competitors)}
  </div>` : ''}

  ${boldStatement ? `<div style="background:${C.navy};border-radius:4px;padding:16px 20px;margin-bottom:14px;">
    <div style="font-size:7.5px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:8px;font-family:monospace;">THE VERDICT</div>
    <div style="font-size:${boldStatement.length>100?'11':'13'}px;font-weight:700;color:#fff;line-height:1.5;font-style:italic;">${boldStatement}</div>
  </div>` : ''}

  <div style="position:absolute;bottom:18px;left:36px;right:36px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:6.5px;color:${C.inkFaint};letter-spacing:.06em;font-family:monospace;">ADVISORSPRINT INTELLIGENCE · CONFIDENTIAL · FOR INTERNAL USE ONLY</div>
    <div style="font-size:6.5px;color:${C.inkFaint};font-family:monospace;">NUMBERS MARKED ESTIMATED/SIGNAL ONLY ARE DIRECTIONAL — VERIFY BEFORE PRESENTING</div>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Instrument+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;700;900&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 0; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-size: 14px; -webkit-text-size-adjust: none; text-size-adjust: none; }
  .page { page-break-after: always; page-break-inside: avoid; width: 794px; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
</style>
</head><body>
${page1}
${page2}
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
  // ── Auth ─────────────────────────────────────────────────────────────────
  const [sessionToken, setSessionToken] = useState(() => sessionStorage.getItem('sprint_token') || null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [sprintCreditUsed, setSprintCreditUsed] = useState(() => sessionStorage.getItem('sprint_credit_used') === '1');

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
  const [retryingSynopsis, setRetryingSynopsis] = useState(false);
  const toolLogsRef = useRef({});  // synchronous mirror of toolLogs — avoids stale closure in sessionStorage writes
  const [toolLogs, setToolLogs] = useState({});         // per-agent search logs for trace PDF
  const [thinkingBlocks, setThinkingBlocks] = useState({}); // synopsis + brief thinking traces
  // ── Conversational agent drawer ──────────────────────────────────────────
  const [drawerAgent, setDrawerAgent] = useState(null);       // agent id currently open, null = closed
  const [drawerMessages, setDrawerMessages] = useState([]);   // full conversation history [{role,content}]
  const [drawerInput, setDrawerInput] = useState('');         // current user input
  const [drawerLoading, setDrawerLoading] = useState(false);  // API call in flight
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

    // Up to 2 attempts covering both fetch + full stream.
    // Only retries on pure network drops (ERR_NETWORK_CHANGED, QUIC, WiFi handoff).
    // API errors (rate limit, billing, server errors) are NOT retried client-side — server handles those.
    const MAX_NET_ATTEMPTS = 2;
    const RETRY_DELAYS = [8000]; // 8s before attempt 2
    let fullText = '';

    for (let attempt = 1; attempt <= MAX_NET_ATTEMPTS; attempt++) {
      if (signal.aborted) break;
      if (attempt > 1) {
        const delay = RETRY_DELAYS[attempt - 2];
        console.warn(`[${agentId}] Network retry ${attempt}/${MAX_NET_ATTEMPTS} in ${delay/1000}s…`);
        setStatuses(s => ({ ...s, [agentId]: `network error — retrying (${attempt-1}/${MAX_NET_ATTEMPTS-1})…` }));
        await new Promise(r => setTimeout(r, delay));
        if (signal.aborted) break;
      }

      let res;
      try {
        res = await fetch(API_URL, {
          method: 'POST',
          headers: authHeaders({ 'x-tool-name': 'advisor-intelligence', 'Cache-Control': 'no-store' }),
          cache: 'no-store',
          signal,
          body: JSON.stringify({ prompt, agentId, market: 'US', mode: 'saas' }),
        });
      } catch (fetchErr) {
        if (signal.aborted) throw fetchErr;
        if (attempt === MAX_NET_ATTEMPTS) throw fetchErr;
        continue; // retry
      }

      if (!res.ok) {
        const err = await res.text().catch(() => '');
        throw new Error(err || `Server error: ${res.status}`);
      }

      let streamFailed = false;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      fullText = '';

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
              if (event.type === 'retrying')  setStatuses(s => ({ ...s, [agentId]: event.message || 'API overloaded — retrying…' }));
              if (event.type === 'thinking')  setThinkingBlocks(t => ({ ...t, [event.agentId]: event.text }));
              if (event.type === 'toollog') {
                toolLogsRef.current = { ...toolLogsRef.current, [event.agentId]: event.log };
                setToolLogs(l => ({ ...l, [event.agentId]: event.log }));
              }
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
        if (signal.aborted) throw streamErr;
        const isNetworkDrop = streamErr.message?.includes('network') ||
          streamErr.message?.includes('Network') ||
          streamErr.message?.includes('ERR_') ||
          streamErr.message?.includes('QUIC') ||
          (streamErr.name === 'TypeError' && !streamErr.message?.includes('rate') &&
           !streamErr.message?.includes('credit') && !streamErr.message?.includes('billing'));
        if (attempt < MAX_NET_ATTEMPTS && isNetworkDrop) {
          streamFailed = true;
        } else {
          throw streamErr;
        }
      }

      if (!streamFailed) break;
    } // end retry loop

    return fullText;
  }, [setSources, setStatuses]);

  // ── runAgent ────────────────────────────────────────────────────────────────
  const runAgent = useCallback(async (id, prompt, signal) => {
    try {
      const text = await callClaude(prompt, id, signal);
      if (!signal.aborted) {
        // Normalise: strip outer backtick fences if model wrapped response
        const normText = text.replace(/^```json\s*/,'').replace(/\s*```$/,'');
        const dbMatch = normText.match(
          /<<<DATA_BLOCK>>>\s*```json([\s\S]*?)```\s*<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>\s*(\{[\s\S]*\})/
        );
        const cleanText = text.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '').trim();
        if (dbMatch) {
          try {
            const raw = (dbMatch[1] || dbMatch[2] || dbMatch[3] || '').trim();
            const cleaned = raw.replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
            // Sanitise: remove control characters that break JSON.parse
            const parsed = JSON.parse(repairJson(cleaned));
            setDataBlocks(d => ({ ...d, [id]: parsed }));
            // For brief: persist parsed DATA_BLOCK and flag to sessionStorage
            // so the manual button can access it even after sprint_${co} is cleared
            if (id === 'brief') {
              try {
                sessionStorage.setItem('briefReady', '1');
                sessionStorage.setItem('briefDataBlock', JSON.stringify(parsed));
              } catch(e) {}
            }
          } catch(e) {
            console.warn('[DataBlock] parse failed:', id, e.message);
            console.warn('[DataBlock] Raw (first 500):', (dbMatch[1]||dbMatch[2]||'').trim().slice(0,500));
            // Attempt graceful recovery: try to extract verdictRow via regex even if full JSON is malformed
            let recoveredBlock = { agent: id, kpis: [], verdictRow: null, strategicTension: '', moves: [], segmentMap: [], revenueGaps: [], marketSignals: [], globalComps: [], competitorThreats: [] };
            try {
              const rawForRecovery = (dbMatch[1] || dbMatch[2] || '').trim();
              // Try to extract each top-level field individually
              const tryExtract = (key, isArray) => {
                try {
                  if (isArray) {
                    const m = rawForRecovery.match(new RegExp('"' + key + '"\\s*:\\s*(\\[[\\s\\S]*?\\](?=\\s*,\\s*"[a-z]|\\s*\\}))'));
                    if (m) return JSON.parse(m[1]);
                  } else {
                    const m = rawForRecovery.match(new RegExp('"' + key + '"\\s*:\\s*"([^"]*)"'));
                    if (m) return m[1];
                  }
                } catch(e) {}
                return null;
              };
              const st = tryExtract('strategicTension', false);
              if (st) recoveredBlock.strategicTension = st;
              const bold = tryExtract('boldStatement', false);
              if (bold) recoveredBlock.boldStatement = bold;
              const page1 = tryExtract('page1Summary', false);
              if (page1) recoveredBlock.page1Summary = page1;
              const posture = tryExtract('internationalPosture', false);
              if (posture) recoveredBlock.internationalPosture = posture;
              // For brief: also write whatever we recovered to sessionStorage
              if (id === 'brief') {
                try {
                  sessionStorage.setItem('briefReady', '1');
                  sessionStorage.setItem('briefDataBlock', JSON.stringify(recoveredBlock));
                } catch(e) {}
              }
            } catch(recovErr) {}
            if (!recoveredBlock.verdictRow) {
              recoveredBlock.verdictRow = { verdict: 'WATCH', finding: 'Analysis complete — see prose below for full findings', confidence: 'L' };
            }
            setDataBlocks(d => ({ ...d, [id]: recoveredBlock }));
            // For brief: even with recovery block, write flag so button appears
            // Brief will render with partial data — better than nothing
            if (id === 'brief') {
              try {
                sessionStorage.setItem('briefReady', '1');
                sessionStorage.setItem('briefDataBlock', JSON.stringify(recoveredBlock));
              } catch(e) {}
            }
          }
        }
        // For brief: if no DATA_BLOCK found at all, log raw output and signal button
        if (id === 'brief' && !dbMatch) {
          console.warn('[Brief] NO DATA_BLOCK found in model response. Raw text (first 500):');
          console.warn(text.slice(0, 500));
          console.warn('[Brief] Full text length:', text.length);
          try { sessionStorage.setItem('briefReady', '1'); } catch(e) {}
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
    // Warn if results already exist — re-run costs full credits
    if (Object.keys(results).length > 0) {
      const confirmed = window.confirm(
        `Re-running will cost full credits (~$6) and overwrite the existing ${company.trim()} analysis.\n\nAre you sure?`
      );
      if (!confirmed) return;
    }
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const signal = ctrl.signal;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    setAppState("preparing");
    setResults({});
    setDataBlocks({});
    setSources([]);
    setToolLogs({});
    setThinkingBlocks({});
    toolLogsRef.current = {};
    try {
      sessionStorage.removeItem('briefReady');
      sessionStorage.removeItem('briefDataBlock');
    } catch(e) {}
    setElapsed(0);
    let wakeLock = null;
    try {
      if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch(wlErr) { console.warn('[WakeLock]', wlErr.message); }

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

      let totalApiCalls = 0;          // guard against runaway retry loops
      const MAX_SPRINT_API_CALLS = 16; // 11 agents + 2 retries headroom + synopsis/brief retries

      for (const id of ALL_AGENTS) {
        if (signal.aborted) break;

        totalApiCalls++;
        if (totalApiCalls > MAX_SPRINT_API_CALLS) {
          console.error(`[Sprint] API call limit reached (${totalApiCalls}) — aborting to prevent runaway spend`);
          alert(`Safety stop: the sprint made more than ${MAX_SPRINT_API_CALLS} API calls, which may indicate a retry loop. The sprint has been stopped to protect your credits.`);
          abortRef.current?.abort();
          setAppState("error");
          return;
        }
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
        if (wakeLock) { try { await wakeLock.release(); } catch(e) {} wakeLock = null; }
        markSprintComplete();
        // NOTE: sessionStorage cleared AFTER brief/gap triggers use it

        // Auto-generate the opportunity brief PDF using w1texts directly
        // Cannot use dataBlocks state here — setDataBlocks is async and stale in this closure
        // Instead: parse the brief DATA_BLOCK from w1texts and pass it explicitly
        try {
          const briefRaw = w1texts['brief'] || '';
          const dbMatch = briefRaw.match(/<<<DATA_BLOCK>>>\s*```json([\s\S]*?)```\s*<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>\s*(\{[\s\S]*\})/);
          if (dbMatch) {
            const raw = (dbMatch[1] || dbMatch[2] || dbMatch[3] || '').trim().replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
            const briefDataBlock = JSON.parse(repairJson(raw));
            // Only auto-generate if brief has real content — skip if just stub/recovery block
            if (!briefDataBlock.strategicTension && !briefDataBlock.moves?.length) {
              console.warn('[AutoBrief] Brief DATA_BLOCK is sparse — skipping auto-generation. Use button to retry.');
            } else {
            const allDataBlocks = { ...Object.fromEntries(
              Object.entries(w1texts).map(([k, v]) => {
                if (typeof v !== 'string') return [k, v];
                const m = v.match(/<<<DATA_BLOCK>>>\s*```json([\s\S]*?)```\s*<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>\s*(\{[\s\S]*\})/);
                if (!m) return [k, null];
                try { return [k, JSON.parse(repairJson((m[1]||m[2]||m[3]||'').trim().replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim()))]; }
                catch(e) { return [k, null]; }
              }).filter(([,v]) => v !== null)
            ), brief: briefDataBlock };
            const allResults = Object.fromEntries(
              Object.entries(w1texts).map(([k,v]) => [k, typeof v === 'string' ? v.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g,'').trim() : v])
            );
            generateSaaSBriefFromData(co, acq, sector, stage, allResults, allDataBlocks, acquisitionMode);
            } // end else (quality gate passed)
          }
        } catch(parseErr) {
          console.warn('[AutoBrief] Could not parse brief data block:', parseErr.message);
        }
        // Do NOT clear sprint sessionStorage — trace PDF re-parse needs it
        // Persist raw agent text + toolLogs after every agent so trace PDF can re-parse
        try {
          sessionStorage.setItem(`sprint_${co}`, JSON.stringify(w1texts));
          sessionStorage.setItem(`toolLogs_${co}`, JSON.stringify(toolLogsRef.current));
        } catch(e) { console.warn('[sessionStorage] write failed:', e.message); }
      }
    } catch(e) {
      console.error("Sprint error:", e);
      if (wakeLock) { try { await wakeLock.release(); } catch(wlErr) {} }
      setAppState("error");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };


  // ── BUILD SAAS TRACE PDF HTML ────────────────────────────────────────────
  const buildSaaSTracePdfHtml = (co, acq, sector, stage, ctx, allDataBlocks, allThinking, allToolLogs, elapsed) => {
    const date = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const navy = '#0b1829', blue = '#2563eb', purple = '#7c3aed', amber = '#d97706', green = '#059669';
    const confColor = v => v==='H'?green:v==='M'?amber:'#dc2626';
    const confBg    = v => v==='H'?'#dcfce7':v==='M'?'#fef3c7':'#fee2e2';

    // SaaS agent dependency map (no framing agent)
    const AGENT_INPUTS = {
      market:     [],
      product:    [],
      gtm:        [],
      revenue:    [],
      customer:   [],
      competitive:[],
      funding:    ['market','product','gtm','revenue','customer','competitive'],
      pricing:    ['market','product','gtm','revenue','customer','competitive'],
      intl:       ['market','product','gtm','revenue','customer','competitive'],
      synopsis:   ['market','product','gtm','revenue','customer','competitive','funding','pricing','intl'],
      brief:      ['market','product','gtm','revenue','customer','competitive','funding','pricing','intl','synopsis'],
    };
    const AGENT_SHORT = {
      market:'Market', product:'Product', gtm:'GTM', revenue:'Revenue',
      customer:'Customer', competitive:'Competitive',
      funding:'Funding', pricing:'Pricing', intl:"Int'l",
      synopsis:'Synopsis', brief:'Brief',
    };
    const AGENT_WAVE = {
      market:1, product:1, gtm:1, revenue:1, customer:1, competitive:1,
      funding:2, pricing:2, intl:2, synopsis:3, brief:4,
    };

    const CONTRADICTION_KW = [
      'however','but ','contradict','disagree','tension','conflict','inconsistent',
      'discrepancy','conflicts with','at odds','diverges','on the other hand',
      'disputes','challenges the','not align','rather than',
      'whereas','despite','although','nevertheless','yet ','revising',
    ];

    const extractSnippets = (text, keywords, maxSnippets=4) => {
      if (!text) return [];
      const sentences = text.replace(/([.!?])\s+/g,'$1\n').split('\n').filter(s=>s.trim().length>20);
      const found = [];
      for (const s of sentences) {
        if (found.length >= maxSnippets) break;
        const lower = s.toLowerCase();
        const kw = keywords.find(k=>lower.includes(k));
        if (kw) found.push({ sentence: s.trim().slice(0,280), keyword: kw });
      }
      return found;
    };

    const traceAgents = Object.keys(AGENT_WAVE).filter(id => allDataBlocks[id] || allThinking[id]);
    const totalPages = 1 + traceAgents.length;

    // ── KPI counts ──
    let hmCount = 0, totalKpis = 0;
    Object.values(allDataBlocks).forEach(db => {
      if (!db || !Array.isArray(db.kpis)) return;
      db.kpis.forEach(k => { totalKpis++; if (k.confidence==='H'||k.confidence==='M') hmCount++; });
    });
    const totalSearches = Object.values(allToolLogs).reduce((s,logs) => s+(logs||[]).length, 0);
    const totalSources  = Object.values(allToolLogs).reduce((s,logs) => s+(logs||[]).reduce((n,l)=>n+(l.results||[]).length,0), 0);
    const searchCountFinal = totalSearches > 0 ? totalSearches : (() => {
      const all = Object.values(allThinking).join(' ');
      return (all.match(/(?:let me search|now i.m (?:running )?search|i.ll search|searching for|web search)/gi)||[]).length;
    })();
    const thinkingTotal = Object.values(allThinking).reduce((s,t) => s+(t||'').length, 0);
    const elapsedStr = elapsed > 0 ? `${Math.floor(elapsed/60)}m ${elapsed%60}s` : '—';
    const agentsDone = traceAgents.length;

    // ── CSS ──
    const css = `
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:8px;}
      .page{width:794px;padding:28px 36px 36px;background:#fff;page-break-after:always;}
      .page:last-child{page-break-after:auto;}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid ${navy};}
      .eyebrow{font-size:6.5px;font-weight:700;letter-spacing:.14em;color:#b85c38;text-transform:uppercase;margin-bottom:3px;}
      h1{font-size:22px;font-weight:900;color:${navy};line-height:1.1;}
      .sub{font-size:8px;color:#666;margin-top:3px;}
      .kpi-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:18px;}
      .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;padding:8px 10px;text-align:center;}
      .kpi.dark{background:${navy};border-color:${navy};}
      .kpi-lbl{font-size:6px;font-weight:600;letter-spacing:.06em;color:#64748b;text-transform:uppercase;margin-bottom:3px;}
      .kpi.dark .kpi-lbl{color:#94a3b8;}
      .kpi-val{font-size:16px;font-weight:900;color:${navy};line-height:1;}
      .kpi.dark .kpi-val{color:#86efac;}
      .kpi-sub{font-size:5.5px;color:#64748b;margin-top:2px;}
      .kpi.dark .kpi-sub{color:#4ade80;font-weight:700;}
      .sec{font-size:6.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${navy};margin-bottom:8px;padding-bottom:4px;border-bottom:1.5px solid ${navy};}
      .sec.purple{color:${purple};border-color:${purple};}
      .agent-page-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:8px;border-bottom:1.5px solid ${navy};}
      table{width:100%;border-collapse:collapse;font-size:6.5px;margin-bottom:12px;}
      thead tr{background:${navy};color:#fff;}
      thead th{padding:4px 7px;font-size:6px;text-align:left;font-weight:600;}
      tbody tr{border-bottom:1px solid #e5e7eb;}
      tbody td{padding:4px 7px;vertical-align:top;line-height:1.5;}
      .badge{display:inline-block;font-size:5.5px;font-weight:800;font-family:monospace;padding:1px 4px;border-radius:2px;}
      .thinking-box{background:#faf5ff;border:1px solid #e9d5ff;border-left:3px solid ${purple};border-radius:2px;padding:8px 12px;margin-bottom:10px;font-size:6.5px;line-height:1.7;color:#4c1d95;font-family:monospace;white-space:pre-wrap;max-height:360px;overflow:hidden;}
      .snippet-box{background:#fffbeb;border:1px solid #fde68a;border-left:3px solid ${amber};border-radius:2px;padding:6px 10px;margin-bottom:5px;font-size:6.5px;line-height:1.6;color:#78350f;}
      .search-row{padding:4px 7px;border-bottom:1px solid #f1f5f9;font-size:6px;}
      .footer{display:flex;justify-content:space-between;margin-top:20px;padding-top:6px;border-top:1px solid #e0d8cc;}
      .footer span{font-size:6px;color:#999;font-family:monospace;}
      /* Agent interaction map */
      .wave-grid{display:flex;gap:0;align-items:flex-start;margin-bottom:14px;}
      .wave-col{display:flex;flex-direction:column;gap:4px;min-width:90px;}
      .wave-lbl{font-size:5.5px;font-weight:700;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;text-align:center;}
      .agent-box{background:#f1f5f9;border:1px solid #cbd5e1;border-radius:3px;padding:4px 6px;text-align:center;font-size:6px;font-weight:700;color:${navy};position:relative;}
      .agent-box.synopsis{background:#ede9fe;border-color:#8b5cf6;color:#4c1d95;}
      .agent-box.brief{background:#fef3c7;border-color:${amber};color:#78350f;}
      /* Heatmap */
      .heat-table{width:100%;border-collapse:collapse;font-size:6px;margin-bottom:12px;}
      .heat-table th{background:${navy};color:#fff;padding:3px 6px;text-align:left;font-size:5.5px;}
      .heat-table td{padding:3px 6px;border-bottom:1px solid #f1f5f9;vertical-align:middle;}
    `;

    // ── AGENT INTERACTION MAP SVG ──────────────────────────────────────────────
    const waves = {1:['market','product','gtm','revenue','customer','competitive'],2:['funding','pricing','intl'],3:['synopsis'],4:['brief']};
    const waveLabels = {1:'Wave 1 · 6 agents',2:'Wave 2 · 3 agents',3:'Synopsis',4:'Brief'};
    const agentMapHtml = `
      <div class="wave-grid">
        ${Object.entries(waves).map(([w,agents])=>`
          <div class="wave-col">
            <div class="wave-lbl">${waveLabels[w]||'W'+w}</div>
            ${agents.map(id=>`<div class="agent-box ${id==='synopsis'?'synopsis':id==='brief'?'brief':''}">${AGENT_SHORT[id]||id}</div>`).join('')}
          </div>
        `).join('')}
      </div>
    `;

    // ── CONFIDENCE HEATMAP ─────────────────────────────────────────────────────
    const heatRows = Object.keys(AGENT_WAVE).filter(id=>allDataBlocks[id]).map(id=>{
      const db = allDataBlocks[id]||{};
      const kpis = Array.isArray(db.kpis)?db.kpis:[];
      const overall = db.verdictRow?.confidence||'—';
      return `<tr>
        <td style="font-weight:700;color:${navy};">${AGENT_SHORT[id]||id}</td>
        <td><span class="badge" style="background:${confBg(overall)};color:${confColor(overall)};">${overall}</span></td>
        ${kpis.slice(0,4).map(k=>`<td><span class="badge" style="background:${confBg(k.confidence)};color:${confColor(k.confidence)};">${k.confidence||'—'}</span><br/><span style="font-size:5.5px;color:#666;">${(k.label||'').slice(0,14)}</span></td>`).join('')}
        ${kpis.length<4?'<td></td>'.repeat(4-kpis.length):''}
        <td style="color:#64748b;">${db.verdictRow?.verdict||'—'}</td>
      </tr>`;
    }).join('');

    // ── PAGE 1 ─────────────────────────────────────────────────────────────────
    const page1 = `<div class="page">
      <div class="hdr">
        <div>
          <div class="eyebrow">Research Trace · Sprint Intelligence Report · SaaS Tool</div>
          <h1>${co}${sector?' — '+sector:''}</h1>
          <div class="sub">${date} · Sprint duration: ${elapsedStr} · ${agentsDone}/11 agents completed${stage?' · '+stage:''}</div>
        </div>
        <div style="font-size:7px;color:#999;text-align:right;line-height:1.6;">AdvisorSprint<br/>SaaS Intelligence</div>
      </div>

      <div class="kpi-strip">
        <div class="kpi dark">
          <div class="kpi-lbl">Quality Score</div>
          <div class="kpi-val">${hmCount>0?Math.round((hmCount/Math.max(totalKpis,1))*100):'—'}<span style="font-size:11px;">%</span></div>
          <div class="kpi-sub">${hmCount>0?(Math.round((hmCount/Math.max(totalKpis,1))*100)>=75?'STRONG':'BUILDING'):'IN PROGRESS'}</div>
        </div>
        <div class="kpi">
          <div class="kpi-lbl">Agents Done</div>
          <div class="kpi-val">${agentsDone}<span style="font-size:10px;color:#94a3b8;">/11</span></div>
          <div class="kpi-sub">of 11 ran successfully</div>
        </div>
        <div class="kpi">
          <div class="kpi-lbl">Web Searches</div>
          <div class="kpi-val">${searchCountFinal}${totalSearches===0&&searchCountFinal>0?'<span style="font-size:8px;color:#94a3b8;">~</span>':''}</div>
          <div class="kpi-sub">${totalSources>0?totalSources+' sources retrieved':searchCountFinal>0?'from thinking stream':'0 sources retrieved'}</div>
        </div>
        <div class="kpi">
          <div class="kpi-lbl">H/M Confidence</div>
          <div class="kpi-val">${hmCount}<span style="font-size:10px;color:#94a3b8;">/${totalKpis}</span></div>
          <div class="kpi-sub">KPIs reliably sourced</div>
        </div>
        <div class="kpi">
          <div class="kpi-lbl">Opus Thinking</div>
          <div class="kpi-val">${thinkingTotal>0?Math.round(thinkingTotal/1000)+'<span style="font-size:10px;">k</span>':'—'}</div>
          <div class="kpi-sub">chars of reasoning</div>
        </div>
      </div>

      <div class="sec">Agent Interaction Map — How Outputs Flowed Through the Sprint</div>
      ${agentMapHtml}

      <div class="sec">Confidence Heatmap · All Agents</div>
      <table class="heat-table">
        <thead><tr><th>Agent</th><th>Overall</th><th>KPI 1</th><th>KPI 2</th><th>KPI 3</th><th>KPI 4</th><th>Verdict</th></tr></thead>
        <tbody>${heatRows}</tbody>
      </table>

      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-left:3px solid ${purple};border-radius:2px;padding:6px 10px;font-size:6px;color:#4c1d95;line-height:1.5;margin-top:8px;">
        H — sourced from a named publication, filing, or verified data. Safe to use with investor.&nbsp;&nbsp;
        M — triangulated from 2+ indirect signals. Check reasoning trace.&nbsp;&nbsp;
        L — estimated from weak signals. Verify before using.
      </div>

      <div class="footer">
        <span>AdvisorSprint Intelligence · SaaS Tool · Confidential</span>
        <span>Page 1 of ${totalPages}</span>
      </div>
    </div>`;

    // ── AGENT PAGES ────────────────────────────────────────────────────────────
    const agentPages = traceAgents.map((id, pageIdx) => {
      const db = allDataBlocks[id]||{};
      const thinking = allThinking[id]||'';
      const toolLog = allToolLogs[id]||[];
      const wave = AGENT_WAVE[id];
      const inputIds = AGENT_INPUTS[id]||[];
      const pageNum = pageIdx + 2;

      // Inputs panel (W2, Synopsis, Brief)
      const showInputs = wave >= 2 && inputIds.length > 0;
      const inputsHtml = showInputs ? `
        <div class="sec">Agent Inputs Received — What This Agent Was Given</div>
        <table>
          <thead><tr><th>Source Agent</th><th>Conf</th><th>Key Finding Passed In</th></tr></thead>
          <tbody>
            ${inputIds.map(fid=>{
              const fdb = allDataBlocks[fid]||{};
              const fkpis = Array.isArray(fdb.kpis)?fdb.kpis:[];
              const conf = fdb.verdictRow?.confidence||'—';
              const finding = fdb.verdictRow?.finding||fkpis[0]?.label||'—';
              return `<tr>
                <td style="font-weight:700;color:${navy};">${AGENT_SHORT[fid]||fid}</td>
                <td><span class="badge" style="background:${confBg(conf)};color:${confColor(conf)};">${conf}</span></td>
                <td style="color:#374151;">${finding.slice(0,120)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      ` : '';

      // Contradiction snippets from thinking
      const contradictions = extractSnippets(thinking, CONTRADICTION_KW, 4);
      const contradictHtml = contradictions.length > 0 ? `
        <div class="sec">Cross-Agent Reasoning — Where Opus Reconciled Conflicting Signals</div>
        <div style="margin-bottom:10px;font-size:6.5px;color:#64748b;">Passages from extended thinking where Opus detected tension or disagreement between prior agent outputs.</div>
        ${contradictions.map((s,i)=>`
          <div class="snippet-box">
            <div style="font-size:5.5px;font-weight:700;color:#92400e;margin-bottom:3px;">Signal ${i+1} — keyword: "${s.keyword}"</div>
            ${s.sentence}
          </div>
        `).join('')}
      ` : '';

      // Thinking stream
      const thinkingHtml = thinking ? `
        <div class="sec purple">Extended Thinking — Full Reasoning Stream</div>
        <div style="font-size:6.5px;color:#64748b;margin-bottom:6px;">${thinking.length.toLocaleString()} chars · ${Math.round(thinking.length/6.5)} words · full trace shown</div>
        <div class="thinking-box">${thinking.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0, 8000)}${thinking.length>8000?'\n\n[... '+Math.round((thinking.length-8000)/6.5)+' more words — truncated for PDF size ...]':''}</div>
      ` : '';

      // Search log
      const agentSearchMentions = !toolLog.length && thinking ?
        (thinking.match(/(?:let me search|now i.m (?:running )?search|i.ll search|searching for|web search|search results)/gi)||[]).length : 0;
      const searchHtml = toolLog.length ? `
        <div class="sec">Research Sequence — Web Searches Performed</div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:2px;overflow:hidden;margin-bottom:10px;">
          ${toolLog.map((t,i)=>`
            <div class="search-row" style="background:${i%2===0?'#fff':'#f8fafc'}">
              <span style="font-weight:700;color:${blue};">${i+1}.</span>
              <span style="font-weight:600;color:${navy};margin-left:4px;">${(t.query||'').slice(0,80)}</span>
              ${t.results&&t.results.length?`<span style="color:#64748b;margin-left:6px;">(${t.results.length} result${t.results.length>1?'s':''})</span>`:''}
            </div>
          `).join('')}
        </div>
      ` : agentSearchMentions > 0 ? `
        <div style="padding:8px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-left:3px solid ${navy};border-radius:2px;margin-bottom:10px;">
          <div style="font-size:6.5px;color:#0369a1;line-height:1.6;">~${agentSearchMentions} web search reference(s) detected in thinking stream. Detailed log was not captured — the thinking stream above shows what was searched and found.</div>
        </div>
      ` : '';

      // KPI provenance
      const kpis = Array.isArray(db.kpis)?db.kpis:[];
      const hasProvenance = id==='brief' && kpis.length>0 &&
        kpis[0]?.label!=='Analysis Complete' &&
        (Array.isArray(db.revenueGaps)||Array.isArray(db.moves)||db.strategicTension);
      const provenanceHtml = hasProvenance ? `
        <div class="sec purple">Calculation Provenance — How Key Metrics Were Derived</div>
        <table>
          <thead><tr><th>Metric / KPI</th><th>Value</th><th>Arithmetic Shown</th><th>Conf</th></tr></thead>
          <tbody>
            ${kpis.map(k=>`<tr>
              <td style="font-weight:700;color:${navy};">${k.label||'—'}</td>
              <td style="font-weight:900;font-size:7.5px;">${k.value||'—'}</td>
              <td style="color:#374151;font-size:6px;font-style:italic;">${k.sub||'—'}</td>
              <td><span class="badge" style="background:${confBg(k.confidence)};color:${confColor(k.confidence)};">${k.confidence||'—'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      ` : '';

      return `<div class="page">
        <div class="agent-page-hdr">
          <div>
            <div class="eyebrow">Agent ${pageIdx+1} · Wave ${wave} · Reasoning Trace</div>
            <div style="font-size:13px;font-weight:900;color:${navy};">${(db.verdictRow?.dimension||AGENT_SHORT[id]||id).toUpperCase()}</div>
            <div style="font-size:7px;color:#666;margin-top:2px;">Received input from: ${inputIds.length>0?inputIds.map(i=>AGENT_SHORT[i]||i).join(' → '):'No prior agents — first wave'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:7px;color:#666;font-family:monospace;">PAGE ${pageNum} OF ${totalPages}</div>
            ${db.verdictRow?.verdict?`<div style="margin-top:4px;"><span class="badge" style="background:${
              db.verdictRow.verdict==='STRONG'?'#dcfce7':db.verdictRow.verdict==='RISK'?'#fee2e2':'#fef3c7'
            };color:${
              db.verdictRow.verdict==='STRONG'?'#15803d':db.verdictRow.verdict==='RISK'?'#dc2626':amber
            };font-size:7px;padding:2px 8px;">${db.verdictRow.verdict}</span></div>`:''}
          </div>
        </div>

        ${inputsHtml}
        ${provenanceHtml}
        ${thinkingHtml}
        ${searchHtml}
        ${contradictHtml}

        <div class="footer">
          <span>AdvisorSprint Intelligence · SaaS Tool · Confidential</span>
          <span>Page ${pageNum} of ${totalPages}</span>
        </div>
      </div>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${css}</style></head><body>${page1}${agentPages}</body></html>`;
  };

  // ── GENERATE SAAS TRACE PDF ────────────────────────────────────────────────
  const [tracePdfGenerating, setTracePdfGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const generateTracePDF = async () => {
    if (tracePdfGenerating) return;
    setTracePdfGenerating(true);
    try {
      // Resolve dataBlocks from sessionStorage — not stale React state
      let resolvedDataBlocks = { ...dataBlocks };
      try {
        const saved = sessionStorage.getItem(`sprint_${company.trim()}`);
        if (saved) {
          const w1 = JSON.parse(saved);
          Object.entries(w1).forEach(([id, raw]) => {
            if (typeof raw !== 'string') return;
            const m = raw.match(/<<<DATA_BLOCK>>>\s*\`\`\`json([\s\S]*?)\`\`\`\s*<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>\s*(\{[\s\S]*\})/);
            if (m) {
              try {
                const parsed = JSON.parse(repairJson((m[1]||m[2]||m[3]||'').trim().replace(/^\`\`\`[a-z]*\n?/,'').replace(/\n?\`\`\`$/,'').trim()));
                resolvedDataBlocks[id] = parsed;
              } catch(e) {}
            }
          });
        }
      } catch(e) { console.warn('[TracePDF] sessionStorage read:', e.message); }

      // Restore toolLogs from sessionStorage
      let resolvedToolLogs = toolLogs;
      try {
        const stored = sessionStorage.getItem(`toolLogs_${company.trim()}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const stateCount = Object.values(toolLogs).reduce((s,l)=>s+(l||[]).length,0);
          const storedCount = Object.values(parsed).reduce((s,l)=>s+(l||[]).length,0);
          if (storedCount > stateCount) resolvedToolLogs = parsed;
        }
      } catch(e) {}

      const html = buildSaaSTracePdfHtml(
        company.trim(), acquisitionMode ? acquirer.trim() : '',
        sector, stage, context.trim(),
        resolvedDataBlocks, thinkingBlocks, resolvedToolLogs, elapsed
      );

      const pdfRes = await fetch(API_URL.replace('/api/claude', '/api/pdf'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ html, company: company.trim() }),
        signal: AbortSignal.timeout(120000),
      });
      if (!pdfRes.ok) {
        const errBody = await pdfRes.json().catch(() => ({ error: `Server error ${pdfRes.status}` }));
        throw new Error(errBody.error || `Trace PDF failed — server ${pdfRes.status}`);
      }
      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${company.trim().replace(/\s+/g,'-')}_ResearchTrace_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      alert(`Trace PDF failed: ${e.message}`);
    } finally {
      setTracePdfGenerating(false);
    }
  };


  // ── AGENT DRAWER HELPERS ──────────────────────────────────────────────────

  // Extract a clean 2-sentence summary from agent prose (auto-extract, no extra API call)
  const getAgentSummary = (agentId) => {
    const raw = results[agentId] || '';
    if (!raw) return '';
    // Strip any residual DATA_BLOCK markers
    const clean = raw
      .replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '')
      .replace(/◉◉ VERDICT_STAMP[\s\S]*?◉◉ END_STAMP/g, '')
      .trim();
    // Take first 280 chars, cut at sentence boundary
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];
    const summary = sentences.slice(0, 2).join(' ').trim();
    return summary.slice(0, 320) || clean.slice(0, 280);
  };

  // Generate 3 suggested questions from the agent's DATA_BLOCK
  // These are grounded in what the agent actually found — prevents hallucination bait
  const getSuggestedQuestions = (agentId) => {
    const db = dataBlocks[agentId] || {};
    const kpis = Array.isArray(db.kpis) ? db.kpis : [];
    const verdict = db.verdictRow || {};
    const questions = [];

    // Q1: Ask about the top KPI calculation — most useful question
    if (kpis[0]?.label && kpis[0]?.value) {
      questions.push(`How did you calculate ${kpis[0].label} of ${kpis[0].value}?`);
    } else {
      questions.push(`What is your single most important finding for ${company}?`);
    }

    // Q2: Ask about confidence on a medium/low KPI if present, else the verdict
    const lowConf = kpis.find(k => k.confidence === 'L' || k.confidence === 'M');
    if (lowConf?.label) {
      questions.push(`Your confidence on ${lowConf.label} was ${lowConf.confidence} — what would make it H?`);
    } else if (verdict.finding) {
      questions.push(`What's the evidence behind: "${verdict.finding.slice(0, 60)}${verdict.finding.length > 60 ? '...' : ''}"?`);
    } else {
      questions.push('What data were you unable to verify through web search?');
    }

    // Q3: Implication question — always useful regardless of data quality
    const agentImplications = {
      market:      `What does the category trajectory mean for ${company}'s next 18 months?`,
      product:     `How long before a competitor can replicate ${company}'s core moat?`,
      gtm:         `What is the single highest-impact GTM change ${company} could make?`,
      revenue:     `What would it take for ${company} to improve its Rule of 40 score?`,
      customer:    `Which customer segment is most at risk of churning and why?`,
      competitive: `What is the most plausible way a competitor breaks ${company}'s moat?`,
      funding:     `What acquirer would pay the most for ${company} and what would they pay for?`,
      pricing:     `Where is ${company} leaving ARR on the table through its pricing model?`,
      intl:        `Should ${company} expand internationally now or defend its home market first?`,
      synopsis:    `Where did agents disagree most and how did you resolve the tension?`,
      brief:       `What is the single move ${company} must make in the next 18 months?`,
    };
    questions.push(agentImplications[agentId] || `What is the most important implication of your analysis for ${company}?`);

    return questions;
  };

  // Build the system prompt for the agent chat — grounded in actual output only
  // This is the anti-hallucination anchor: the model can ONLY answer from what it produced
  const buildAgentSystemPrompt = (agentId) => {
    const agentMeta = SAAS_AGENTS.find(a => a.id === agentId) || {};
    const PROSE_CAP = agentId === 'synopsis' ? 4000 : agentId === 'brief' ? 3000 : 6000;
    const prose = (results[agentId] || '')
      .replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '')
      .replace(/◉◉ VERDICT_STAMP[\s\S]*?◉◉ END_STAMP/g, '')
      .trim();
    const db = dataBlocks[agentId] || {};
    const thinking = thinkingBlocks[agentId] || '';
    const toolLog = toolLogs[agentId] || [];

    // Build a structured context block the model can reference
    const dataBlockStr = Object.keys(db).length > 0
      ? `

STRUCTURED DATA (your DATA_BLOCK output):
${JSON.stringify(db, null, 2)}`
      : '';

    const thinkingStr = thinking
      ? `

YOUR REASONING TRACE (extended thinking — shows how you arrived at conclusions):
${thinking.slice(0, 4000)}${thinking.length > 4000 ? '
[...truncated for context length...]' : ''}`
      : '';

    const searchStr = toolLog.length > 0
      ? `

WEB SEARCHES YOU PERFORMED:
${toolLog.map((t,i) => `${i+1}. Query: "${t.query}" — ${t.results?.length || 0} results`).join('
')}`
      : '';

    return `You are the ${agentMeta.label || agentId} agent from an AdvisorSprint analysis of ${company}${sector ? ` (${sector})` : ''}.

CRITICAL RULES — follow these exactly:
1. You can ONLY answer based on what you actually found and wrote in this sprint. Do not invent new data, statistics, or findings.
2. If asked about something not in your output, say clearly: "I did not analyse that in this sprint — my scope was [your scope]."
3. If a number came from a web search result, say so. If it was estimated or derived, say so and show the arithmetic.
4. If your confidence was L or M on something, explain why and what would change it to H.
5. Keep answers concise — 3-5 sentences unless the user asks for detail.
6. Never speculate beyond what your output supports. Qualify everything uncertain with "estimated", "derived", or "not confirmed".
7. If the user asks about something not visible in your output above, acknowledge the analysis may be truncated and direct them to the full report.

YOUR FULL ANALYSIS OUTPUT:
${prose.slice(0, PROSE_CAP)}${prose.length > PROSE_CAP ? '
[...truncated — full analysis in report...]' : ''}${dataBlockStr}${thinkingStr}${searchStr}`;
  };

  // Send a message to the agent — streaming SSE, full conversation history (Option A)
  const sendDrawerMessage = async () => {
    if (!drawerInput.trim() || drawerLoading || !drawerAgent) return;
    const userMessage = drawerInput.trim();
    setDrawerInput('');

    // Append user message + empty assistant placeholder immediately (optimistic UI)
    const newMessages = [...drawerMessages, { role: 'user', content: userMessage }];
    setDrawerMessages([...newMessages, { role: 'assistant', content: '', isStreaming: true }]);
    setDrawerLoading(true);

    try {
      const systemPrompt = buildAgentSystemPrompt(drawerAgent);
      // Option A: full history every time — model maintains conversation context
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(API_URL.replace('/api/claude', '/api/chat'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          system: systemPrompt,
          messages: apiMessages,
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(err || `Server error ${response.status}`);
      }

      // Read SSE stream — tokens arrive as they are generated
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('
');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'chunk') {
              fullReply += event.text;
              // Update the streaming placeholder in real time
              setDrawerMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullReply, isStreaming: true };
                return updated;
              });
            }
            if (event.type === 'done') {
              fullReply = event.text || fullReply;
            }
            if (event.type === 'error') {
              throw new Error(event.message || 'Stream error');
            }
          } catch(parseErr) {
            if (parseErr.message !== 'Stream error' && !parseErr.message.startsWith('JSON')) continue;
            throw parseErr;
          }
        }
      }

      // Finalise — remove streaming flag
      setDrawerMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: fullReply, isStreaming: false };
        return updated;
      });

    } catch(e) {
      // Replace streaming placeholder with error message
      setDrawerMessages(prev => {
        const updated = [...prev.filter(m => !m.isStreaming)];
        return [...updated, {
          role: 'assistant',
          content: `Unable to get a response: ${e.message}. Please try again.`,
          isError: true,
        }];
      });
    } finally {
      setDrawerLoading(false);
    }
  };

  // Open drawer for a specific agent — reset conversation
  const openDrawer = (agentId) => {
    setDrawerAgent(agentId);
    setDrawerMessages([]);
    setDrawerInput('');
    setDrawerLoading(false);
  };

  // Close drawer
  const closeDrawer = () => {
    setDrawerAgent(null);
    setDrawerMessages([]);
    setDrawerInput('');
  };


  const authHeaders = (extra = {}) => ({
    'Content-Type': 'application/json',
    'x-session-token': sessionToken || '',
    ...extra,
  });

  const handleAuth = async () => {
    if (!authPassword.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(API_URL.replace('/api/claude', '/api/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: authPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      sessionStorage.setItem('sprint_token', data.token);
      setSessionToken(data.token);
    } catch(e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const markSprintComplete = async () => {
    if (sprintCreditUsed) return;
    try {
      const res = await fetch(API_URL.replace('/api/claude', '/api/sprint-complete'), {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.status === 403 || res.ok) {
        sessionStorage.setItem('sprint_credit_used', '1');
        setSprintCreditUsed(true);
      }
    } catch(e) { console.warn('[SprintComplete]', e.message); }
  };


  const saveSprint = async () => {
    if (shareLoading) return;
    setShareLoading(true);
    try {
      const res = await fetch(API_URL.replace('/api/claude', '/api/save-sprint'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          company: company.trim(),
          tool: 'saas',
          sector,
          results,
          dataBlocks,
          thinking: thinkingBlocks,
          toolLogs,
          sources,
          elapsed,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setShareUrl(data.shareUrl);
      setShowShareModal(true);
    } catch(e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setShareLoading(false);
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

  // ── RETRY SYNOPSIS + BRIEF ──────────────────────────────────────────
  const retrySynopsisAndBrief = async () => {
    if (retryingSynopsis) return;
    setRetryingSynopsis(true);
    setAppState("running");
    const co = company.trim();
    try {
      const saved = sessionStorage.getItem(`sprint_${co}`);
      if (!saved) throw new Error("No saved sprint data — please re-run the full sprint");
      const w1texts = JSON.parse(saved);
      // Verify we have enough agent outputs to synthesise from
      const agentsDone = Object.keys(w1texts).filter(k => !['synopsis','brief'].includes(k));
      if (agentsDone.length < 5) throw new Error("Too few agents completed — please re-run the full sprint");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const signal = ctrl.signal;
      const acq = acquisitionMode ? acquirer.trim() : '';
      const ctx = context.trim();
      const ctxWithMeta = `COMPANY: ${co}\nSECTOR: ${sector}\nSTAGE: ${stage}${acquisitionMode && acq ? `\nACQUIRER: ${acq}` : ''}${ctx ? `\nADDITIONAL CONTEXT: ${ctx}` : ''}`;

      // Run synopsis
      setStatuses(s => ({ ...s, synopsis: "running" }));
      const synopsisPrompt = makeSaaSPrompt('synopsis', co, acq, ctxWithMeta, w1texts);
      const synopsisText = await runAgent('synopsis', synopsisPrompt, signal);
      w1texts['synopsis'] = synopsisText;
      setStatuses(s => ({ ...s, synopsis: "done" }));

      // 60s gap before brief
      if (!signal.aborted) await new Promise(r => setTimeout(r, 60000));

      // Run brief
      setStatuses(s => ({ ...s, brief: "running" }));
      const briefPrompt = makeSaaSPrompt('brief', co, acq, ctxWithMeta, w1texts);
      const briefText = await runAgent('brief', briefPrompt, signal);
      w1texts['brief'] = briefText;
      setStatuses(s => ({ ...s, brief: "done" }));

      // Update sessionStorage with completed synopsis+brief
      try { sessionStorage.setItem(`sprint_${co}`, JSON.stringify(w1texts)); } catch(e) {}

      // Auto-generate brief PDF
      try {
        const briefRaw = briefText || '';
        const dbMatch = briefRaw.match(/<<<DATA_BLOCK>>>\s*```json([\s\S]*?)```\s*<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>\s*(\{[\s\S]*\})/);
        if (dbMatch) {
          const raw = (dbMatch[1] || dbMatch[2] || '').trim().replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
          const briefDataBlock = JSON.parse(repairJson(raw));
          const allDataBlocks = { ...Object.fromEntries(
            Object.entries(w1texts).map(([k, v]) => {
              if (typeof v !== 'string') return [k, v];
              const m = v.match(/<<<DATA_BLOCK>>>\s*```json([\s\S]*?)```\s*<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>\s*(\{[\s\S]*\})/);
              if (!m) return [k, null];
              try { return [k, JSON.parse(repairJson((m[1]||m[2]||m[3]||'').trim().replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim()))]; }
              catch(e) { return [k, null]; }
            }).filter(([,v]) => v !== null)
          ), brief: briefDataBlock };
          const allResults = Object.fromEntries(
            Object.entries(w1texts).map(([k,v]) => [k, typeof v === 'string' ? v.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g,'').trim() : v])
          );
          generateSaaSBriefFromData(co, acq, sector, stage, allResults, allDataBlocks, acquisitionMode);
        }
      } catch(e) { console.warn('[RetrySynopsis AutoBrief]', e.message); }

      setAppState("done");
    } catch(e) {
      console.error("[RetrySynopsisAndBrief]", e.message);
      alert(`Retry failed: ${e.message}`);
      setAppState("error");
    } finally {
      setRetryingSynopsis(false);
    }
  };

  // ── AGENT 12: GAP ANALYSIS ─────────────────────────────────────────;

  // ── BUILD TRACE PDF ──────────────────────────────────────────────────


  const cancel = () => {
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setAppState("idle");
  };

  const generateSaaSBriefFromData = async (co, acq, sec, stg, allResults, allDataBlocks, acqMode) => {
    // Called at sprint end with fully resolved data — no stale React state
    setBriefGenerating(true);
    try {
      const html = buildSaaSBriefHtml({
        company: co, acquirer: acq, sector: sec, stage: stg,
        results: allResults, dataBlocks: allDataBlocks,
        companyMode: acqMode ? 'acquired' : 'standalone'
      });
      const pdfRes = await fetch(API_URL.replace('/api/claude', '/api/pdf'), {
        method: 'POST',
        headers: authHeaders(),
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
      // Non-fatal — button still available for manual retry
    } finally {
      setBriefGenerating(false);
    }
  };

  const generateSaaSBrief = async () => {
    if (briefGenerating) return;
    setBriefGenerating(true);
    try {
      // Resolve brief DATA_BLOCK — React state may be stale if clicked after page settle
      // Priority: 1) React state (settled), 2) sessionStorage briefDataBlock (always fresh)
      let resolvedDataBlocks = dataBlocks;
      if (!dataBlocks['brief']?.agent) {
        try {
          const saved = sessionStorage.getItem('briefDataBlock');
          if (saved) {
            const parsed = JSON.parse(saved);
            resolvedDataBlocks = { ...dataBlocks, brief: parsed };
          }
        } catch(e) { console.warn('[Brief] sessionStorage fallback failed:', e.message); }
      }
      const html = buildSaaSBriefHtml({ company, acquirer, sector, stage, results, dataBlocks: resolvedDataBlocks, companyMode: acquisitionMode ? 'acquired' : 'standalone' });
      const pdfRes = await fetch(API_URL.replace('/api/claude', '/api/pdf'), {
        method: 'POST',
        headers: authHeaders(),
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
        headers: authHeaders(),
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

      {/* ── Password gate — shown until authenticated ── */}
      {!sessionToken && (
        <div style={{ position: 'fixed', inset: 0, background: N.navy, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 340, padding: '40px 36px', background: N.navyMid, border: '1px solid #ffffff15', borderRadius: 8 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: N.blueMid, marginBottom: 8 }}>AdvisorSprint</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: '#ffffff30', marginBottom: 28 }}>Intelligence · SaaS Tool</div>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: N.blueMid, marginBottom: 8 }}>Access Code</label>
            <input
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !authLoading && handleAuth()}
              placeholder="Enter access code…"
              autoFocus
              style={{ width: '100%', padding: '10px 12px', background: '#ffffff0d', border: '1px solid #ffffff20', borderRadius: 4, color: '#fff', fontFamily: 'monospace', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
            />
            {authError && (
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: N.red, marginBottom: 10 }}>{authError}</div>
            )}
            <button
              onClick={handleAuth}
              disabled={authLoading || !authPassword.trim()}
              style={{ width: '100%', padding: '11px', background: authLoading ? '#ffffff20' : N.blue, border: 'none', borderRadius: 4, color: '#fff', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', cursor: authLoading || !authPassword.trim() ? 'not-allowed' : 'pointer' }}
            >
              {authLoading ? 'Verifying…' : 'Enter Sprint'}
            </button>
          </div>
        </div>
      )}

      {/* ── Sprint credit exhausted notice ── */}
      {sessionToken && sprintCreditUsed && appState === 'idle' && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: N.navyMid, border: `1px solid ${N.amber}40`, borderRadius: 6, padding: '12px 18px', zIndex: 90, maxWidth: 320 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: N.amber, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Sprint credit used</div>
          <div style={{ fontSize: 11, color: '#ffffff70', lineHeight: 1.5 }}>Your complimentary sprint has been used. Contact Harsha for additional access.</div>
        </div>
      )}
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
        {appState === 'error' && !results['synopsis'] && Object.keys(results).length >= 5 && (
          <button onClick={retrySynopsisAndBrief} disabled={retryingSynopsis}
            style={{ padding: '6px 16px', background: retryingSynopsis ? '#ffffff20' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: retryingSynopsis ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
            {retryingSynopsis ? '⟳ Retrying…' : '↺ Retry Synopsis + Brief'}
          </button>
        )}
        {(appState === 'done' || appState === 'error') && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {appState === 'done' && (
              <button onClick={generatePDF} disabled={pdfGenerating} style={{ padding: '6px 16px', background: pdfGenerating ? '#ffffff20' : N.navyMid, color: '#fff', border: '1px solid #ffffff30', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: pdfGenerating ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
                {pdfGenerating ? 'Generating…' : '⬇ Full Report'}
              </button>
            )}
            {results['brief'] && (
              <button onClick={generateSaaSBrief} disabled={briefGenerating} style={{ padding: '6px 16px', background: briefGenerating ? '#ffffff20' : N.blue, color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: briefGenerating ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
                {briefGenerating ? 'Generating…' : '⬇ Opportunity Brief'}
              </button>
            )}
            {Object.keys(results).length >= 3 && (
              <button onClick={generateTracePDF} disabled={tracePdfGenerating} style={{ padding: '6px 16px', background: tracePdfGenerating ? '#ffffff20' : '#4c1d95', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: tracePdfGenerating ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
                {tracePdfGenerating ? '⟳ Building Trace…' : '⬇ Research Trace'}
              </button>
            )}
            {appState === 'done' && (
              <button onClick={saveSprint} disabled={shareLoading} style={{ padding: '6px 16px', background: shareLoading ? '#ffffff20' : '#059669', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: shareLoading ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
                {shareLoading ? '⟳ Saving…' : shareUrl ? '✓ Saved' : '⤴ Save & Share'}
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

          {/* Reference Document upload — UI only, coming soon */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: N.blueMid, marginBottom: 6 }}>
              Reference Document
              <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#ffffff30', fontSize: 10 }}>Optional · 1 PDF · Max 500 KB</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px',
                  background: '#ffffff08',
                  border: '1.5px dashed #ffffff20',
                  borderRadius: 4,
                  fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                  color: '#ffffff40',
                  cursor: 'not-allowed',
                  userSelect: 'none',
                  opacity: 0.7,
                }}

              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 13h10M7 1v8M4 6l3 3 3-3" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Attach PDF
                <input type="file" accept=".pdf" disabled style={{ display: 'none' }} />
              </label>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#ffffff25', fontStyle: 'italic' }}>
                No file attached
              </span>
            </div>
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
            <button onClick={sprintCreditUsed ? undefined : runSprint}
              disabled={sprintCreditUsed}
              style={{ width: '100%', padding: '12px', background: sprintCreditUsed ? '#ffffff15' : N.blue, color: sprintCreditUsed ? '#ffffff40' : '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: sprintCreditUsed ? 'not-allowed' : 'pointer', letterSpacing: '.08em', fontFamily: 'monospace' }}>
              {sprintCreditUsed ? 'Sprint Credit Used' : testMode ? '▶ TEST RUN (Agent 1)' : '▶ RUN SPRINT'}
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
                    <div style={{ fontSize: 9, color: '#ffffff60', marginTop: 4, maxHeight: 32, overflow: 'hidden' }}>
                      {results[agent.id].replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g,'').trim().slice(0,110)}…
                    </div>
                  )}
                  {st === 'done' && results[agent.id] && agent.id !== 'brief' && (
                    <button
                      onClick={() => openDrawer(agent.id)}
                      style={{
                        marginTop: 8, padding: '4px 10px',
                        background: 'transparent',
                        border: `1px solid ${N.blue}60`,
                        borderRadius: 4,
                        color: N.blueMid,
                        fontSize: 9, fontWeight: 700,
                        fontFamily: 'monospace',
                        letterSpacing: '.06em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      Ask Agent ↗
                    </button>
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

      {/* ── Share Modal ── */}
      {showShareModal && shareUrl && (
        <>
          <div onClick={() => setShowShareModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 420, background: N.navyMid, border: '1px solid #ffffff20', borderRadius: 10, padding: '28px 32px', zIndex: 70 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: N.green, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Sprint saved</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.4 }}>Share this link with your recipient — they can ask questions of each agent directly.</div>
            <div style={{ background: '#0b1829', border: '1px solid #ffffff15', borderRadius: 4, padding: '10px 12px', fontFamily: 'monospace', fontSize: 10, color: N.blueMid, wordBreak: 'break-all', marginBottom: 12 }}>
              {shareUrl}
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#ffffff40', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Scan to open</div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=${encodeURIComponent(shareUrl)}&color=2563eb&bgcolor=0b1829`}
                  alt="QR code"
                  width={88} height={88}
                  style={{ borderRadius: 4, border: '1px solid #ffffff15', display: 'block' }}
                />
              </div>
              <div style={{ flex: 1, fontSize: 10, color: '#ffffff50', lineHeight: 1.7, paddingTop: 20 }}>
                Share this link or scan the QR code. Recipients can ask questions of each agent — they cannot run new sprints.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  const btn = document.activeElement;
                  if (btn) { const orig = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = orig; }, 2000); }
                }}
                style={{ flex: 1, padding: '9px', background: N.blue, border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', cursor: 'pointer' }}
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #ffffff20', borderRadius: 4, color: '#ffffff60', fontSize: 11, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 9, color: '#ffffff30', fontFamily: 'monospace' }}>
              Link expires in 30 days · Recipients can ask questions — they cannot run sprints
            </div>
          </div>
        </>
      )}

      {/* ── Agent Conversation Drawer ── */}
      {drawerAgent && (() => {
        const agentMeta = SAAS_AGENTS.find(a => a.id === drawerAgent) || {};
        const db = dataBlocks[drawerAgent] || {};
        const verdict = db.verdictRow || {};
        const kpis = Array.isArray(db.kpis) ? db.kpis : [];
        const summary = getAgentSummary(drawerAgent);
        const suggestedQs = getSuggestedQuestions(drawerAgent);
        const verdictColor = { STRONG:'#059669', WATCH:'#d97706', RISK:'#dc2626', OPTIMISE:'#2563eb', UNDERDELIVERED:'#9333ea' }[verdict.verdict] || '#64748b';
        const verdictBg   = { STRONG:'#dcfce7', WATCH:'#fef3c7', RISK:'#fee2e2', OPTIMISE:'#dbeafe', UNDERDELIVERED:'#ede9fe' }[verdict.verdict] || '#f1f5f9';

        return (
          <>
            {/* Overlay — click to close */}
            <div
              onClick={closeDrawer}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                zIndex: 40,
              }}
            />

            {/* Drawer panel */}
            <div style={{
              position: 'fixed',
              top: 49, right: 0,
              width: 420,
              height: 'calc(100vh - 49px)',
              background: N.navyMid,
              borderLeft: `1px solid #ffffff15`,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'hidden',
            }}>

              {/* Drawer header */}
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #ffffff10', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, color: N.blueMid, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 3 }}>
                      W{agentMeta.wave} · Agent Conversation
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                      {agentMeta.label || drawerAgent}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {verdict.verdict && (
                      <span style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: verdictBg, color: verdictColor }}>
                        {verdict.verdict}
                      </span>
                    )}
                    <button
                      onClick={closeDrawer}
                      style={{ background: 'transparent', border: '1px solid #ffffff20', borderRadius: 4, color: '#ffffff60', fontSize: 14, cursor: 'pointer', padding: '2px 8px', lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Summary */}
                {summary && (
                  <div style={{ marginTop: 10, fontSize: 10, color: '#94a3b8', lineHeight: 1.6, background: '#ffffff08', borderRadius: 4, padding: '7px 10px' }}>
                    {summary}
                  </div>
                )}

                {/* KPI chips */}
                {kpis.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {kpis.slice(0, 4).map((k, i) => (
                      <div key={i} style={{ background: '#0b1829', border: '1px solid #ffffff10', borderRadius: 4, padding: '3px 8px' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{(k.label||'').slice(0,16)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{k.value||'—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversation area — scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Suggested questions — shown only when no messages yet */}
                {drawerMessages.length === 0 && (
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#64748b', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Suggested questions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {suggestedQs.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setDrawerInput(q);
                          }}
                          style={{
                            textAlign: 'left',
                            background: '#0b1829',
                            border: `1px solid ${N.blue}40`,
                            borderRadius: 6,
                            padding: '7px 11px',
                            color: '#93c5fd',
                            fontSize: 11,
                            cursor: 'pointer',
                            lineHeight: 1.5,
                            fontFamily: "'Instrument Sans', sans-serif",
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Anti-hallucination notice */}
                    <div style={{ marginTop: 12, padding: '6px 10px', background: '#7c3aed15', border: '1px solid #7c3aed30', borderRadius: 4, fontSize: 9, color: '#a78bfa', lineHeight: 1.6 }}>
                      This agent will only answer from what it found in the sprint. It will not invent new data or speculate beyond its analysis.
                    </div>
                  </div>
                )}

                {/* Conversation messages */}
                {drawerMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.role === 'assistant' && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: N.purple + '40', border: `1px solid ${N.purple}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#c4b5fd', flexShrink: 0, marginRight: 7, marginTop: 2 }}>
                        {(SAAS_AGENTS.find(a=>a.id===drawerAgent)||{}).icon||'◈'}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '82%',
                      padding: '8px 12px',
                      borderRadius: msg.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                      background: msg.role === 'user' ? '#1e3a5f' : (msg.isError ? '#3f1515' : '#0d1e33'),
                      border: `1px solid ${msg.role === 'user' ? '#2563eb40' : msg.isError ? '#dc262640' : '#7c3aed25'}`,
                      fontSize: 11,
                      color: msg.isError ? '#fca5a5' : '#e2e8f0',
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}{msg.isStreaming ? <span style={{ opacity: 0.7, animation: 'none', borderRight: '2px solid #c4b5fd', marginLeft: 1 }}>&nbsp;</span> : null}
                    </div>
                  </div>
                ))}

                {/* Typing indicator — only shown before first token arrives */}
                {drawerLoading && !drawerMessages.some(m => m.isStreaming && m.content.length > 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: N.purple + '40', border: `1px solid ${N.purple}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#c4b5fd', flexShrink: 0 }}>
                      {(SAAS_AGENTS.find(a=>a.id===drawerAgent)||{}).icon||'◈'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>Thinking…</div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #ffffff10', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={drawerInput}
                    onChange={e => setDrawerInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !drawerLoading) { e.preventDefault(); sendDrawerMessage(); } }}
                    placeholder={`Ask the ${agentMeta.label || 'agent'}…`}
                    disabled={drawerLoading}
                    style={{
                      flex: 1,
                      background: '#0b1829',
                      border: '1px solid #ffffff20',
                      borderRadius: 4,
                      padding: '8px 11px',
                      color: '#e2e8f0',
                      fontSize: 11,
                      fontFamily: "'Instrument Sans', sans-serif",
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={sendDrawerMessage}
                    disabled={drawerLoading || !drawerInput.trim()}
                    style={{
                      padding: '8px 14px',
                      background: drawerLoading || !drawerInput.trim() ? '#ffffff15' : N.blue,
                      border: 'none',
                      borderRadius: 4,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      cursor: drawerLoading || !drawerInput.trim() ? 'not-allowed' : 'pointer',
                      letterSpacing: '.06em',
                    }}
                  >
                    {drawerLoading ? '…' : 'Send'}
                  </button>
                </div>
                <div style={{ marginTop: 7, fontSize: 9, color: '#ffffff25', fontFamily: 'monospace' }}>
                  Enter to send · Esc to close · ~$0.01 per exchange
                </div>
              </div>

            </div>
          </>
        );
      })()}

    </div>
  );
}

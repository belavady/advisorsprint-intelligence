import { useState, useEffect, useRef, useCallback } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Backend API URL
const API_URL = "https://advisorsprint-api.onrender.com/api/claude";

// MOCK MODE: true = instant fake output (for testing), false = real API calls via backend
const MOCK_MODE = false;

// GA4 tracking
const GA4_ID = "G-XXXXXXXXXX";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function gaEvent(name, params = {}) {
  try {
    if (typeof window.gtag === "function" && GA4_ID !== "G-XXXXXXXXXX") {
      window.gtag("event", name, params);
    }
    console.log("[Analytics]", name, params);
  } catch(e) {}
}

function loadGA4() {
  if (GA4_ID === "G-XXXXXXXXXX") return;
  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(s1);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA4_ID);
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f0e8; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: #b8a898; border-radius: 3px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.2; } }
  
  @media print {
    @page { margin: 0 0 8mm 0; }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }
    .no-print { display: none !important; }
    .no-screen { display: none !important; }
    .print-only { display: block !important; }
    .no-screen { display: flex !important; }
    .pdf-header { 
      display: none !important;
    }
    .pdf-header * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .agent-content { 
      max-height: none !important; 
      overflow: visible !important;
    }


    h2 {
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }
  }
`;

const P = {
  cream: "#f5f0e8",
  parchment: "#ede6d6",
  sand: "#d4c4a8",
  forest: "#1a3325",
  forestMid: "#2d5040",
  forestSoft: "#3d6b54",
  terra: "#b85c38",
  terraSoft: "#d4724a",
  terracream: "#f0d4c0",
  ink: "#1a1208",
  inkMid: "#3d3020",
  inkSoft: "#6b5c48",
  inkFaint: "#9b8c78",
  gold: "#c8922a",
  white: "#faf8f4",
};

const AGENTS = [
  { id: "market", wave: 1, icon: "◈", label: "Market Position & Category Dynamics", sub: "Category size, growth, competitive landscape" },
  { id: "portfolio", wave: 1, icon: "◉", label: "Portfolio Strategy & SKU Rationalization", sub: "Product mix, SKU performance, keep/kill/launch" },
  { id: "brand", wave: 1, icon: "◎", label: "Brand Positioning & Storytelling", sub: "Brand perception, target customer, messaging" },
  { id: "margins", wave: 1, icon: "◐", label: "Margin Improvement & Unit Economics", sub: "COGS optimization, channel mix, profitability" },
  { id: "growth", wave: 1, icon: "◆", label: "Growth Strategy & Channel Orchestration", sub: "GTM roadmap, geographic expansion, sales team" },
  { id: "competitive", wave: 1, icon: "◇", label: "Competitive Battle Plan", sub: "Head-to-head analysis, attack/defend strategies" },
  { id: "synergy",  wave: 2, icon: "◈", label: "Synergy Playbook",                        sub: "Post-acquisition integration, ITC asset leverage" },
  { id: "platform", wave: 2, icon: "◉", label: "Platform Expansion & D2C Brand Incubator", sub: "Strategic portfolio transformation" },
  { id: "intl",     wave: 2, icon: "◎", label: "International Benchmarks & Global Playbook", sub: "Global analogs, MT/QC transitions, transferable lessons" },
  { id: "synopsis", wave: 3, icon: "◉", label: "Executive Synopsis",                        sub: "Strategic synthesis of all 10 agents" },
];

const W1 = AGENTS.filter(a => a.wave === 1).map(a => a.id);
const W2 = AGENTS.filter(a => a.wave === 2).map(a => a.id);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AGENT PROMPTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PROMPTS = {
  market: `# AGENT 1: MARKET POSITION & CATEGORY DYNAMICS
## POST-ACQUISITION GROWTH STRATEGY (3 YEARS IN)

**Model:** Claude Sonnet 4.6 (\`claude-sonnet-4-6-20250514\`)

**Critical Context:** [ACQUIRER] acquired [COMPANY] in 2023. We're now in 2026—**3 years post-acquisition**.

---

## WHAT [ACQUIRER] HAS ALREADY DONE (2023-2026)

**Distribution Support — PARTIAL LEVERAGE:**
- ✅ Expanded from 150 MT stores → 800-1,200 stores (ITC relationships helped BUT field team focused on [ACQUIRER]'s premium portfolio, not full muscle for Yogabar)
- ⚠️ General Trade: Limited penetration (ITC field team bandwidth constraint)
- ✅ Marketing spend 2x higher with [ACQUIRER] backing (but not 3x—separate unit with own budget)
- ❌ Manufacturing: NOT moved to original co-packer facilities (no capacity constraints, Yogabar continues with co-packers)
- ⚠️ Procurement: Minimal leverage (Yogabar operates separately, limited [ACQUIRER] vendor access)

**The Challenge NOW:**
- **Current performance unknown** - Search for 2024-2025 revenue/growth data
- **Post-ITC trajectory assessment needed** - Has momentum continued, accelerated, or slowed?
- **Next growth drivers** - What's needed BEYOND the selective MT support already provided?
- **Field team bandwidth** - [ACQUIRER]'s field team focused on own premium portfolio, so Yogabar needs strategies that don't depend heavily on [ACQUIRER] field resources

---

## YOUR MISSION

Identify the **NEXT SET** of growth opportunities that go **BEYOND distribution leverage** (already done).

**Focus on:**
1. **Category shifts since 2023** that create NEW white space
2. **Untapped demand pools** unreachable with current store-based strategy
3. **Competitive vulnerabilities** that emerged AFTER ITC's expansion
4. **Market timing signals** for what to do in 2026-2028

**DO NOT:**
- ❌ Suggest "leverage [ACQUIRER] distribution" (done for 3 years)
- ❌ Recommend "expand to more MT stores" (plateau evidence)
- ❌ Give advice that was valid in 2023 but irrelevant now

**DO:**
- ✅ "Quick Commerce shift: 27% of impulse nutrition now on Blinkit/Zepto (emerged 2024-2025). [COMPANY] at 4% presence vs 18% category average."
- ✅ "International opportunity: India nutrition brands entering ME markets (2025 trend). [COMPANY] positioned for export but not activated."

---

## SEARCH STRATEGY

### **PRIORITY 1: Post-Acquisition Performance Evidence**

\`\`\`
1. "[COMPANY] revenue growth 2024" OR "[COMPANY] same-store sales"
2. "[COMPANY] [ACQUIRER] performance 2024" OR "[COMPANY] velocity trends"
3. "[ACQUIRER] Foods acquisition performance 2024"
4. "[COMPANY] store count 2025" OR "distribution expansion"
\`\`\`

**Why:** Verify the plateau hypothesis. Is growth actually slowing?

### **PRIORITY 2: Category Evolution 2024-2026**

\`\`\`
5. "[Category] quick commerce 2024" (e.g., "protein bars Blinkit Zepto")
6. "[Category] D2C to retail shift 2024-2025"
7. "[Category] emerging segments 2025" (functional foods, adaptogens, etc.)
8. "[Category] international expansion India brands 2024"
9. "Health snacks consumer behavior shift 2024-2025"
10. "[Category] subscription model 2024" OR "DTC retention"
\`\`\`

**Why:** Find NEW channels/formats that emerged 2024-2026 that [ACQUIRER] hasn't captured.

### **PRIORITY 3: Competitive Intelligence Post-2023**

\`\`\`
11. "[Competitor] growth rate 2024" (for each major competitor)
12. "[Competitor] launches 2024" OR "new products"
13. "[Competitor] expansion 2024" (what strategies are working for them now?)
\`\`\`

**Why:** Who's still growing despite distribution commoditization? What are they doing differently?

### **PRIORITY 4: Next-Wave Opportunities**

\`\`\`
14. "Corporate wellness India 2024" OR "institutional nutrition programs"
15. "Gym chains India expansion 2024" (direct B2B channel)
16. "Travel retail nutrition India 2024" OR "airport snacks premium"
17. "Fitness studios India growth 2024" (sampling/distribution partner)
\`\`\`

**Why:** Non-traditional channels [ACQUIRER] may not have explored yet.

---

## OUTPUT STRUCTURE (800-1,000 words, 2 pages max)

### **SECTION 1: POST-ACQUISITION SCORECARD (200 words)**

\`\`\`
## THREE YEARS LATER: WHERE WE STAND

**Revenue Trajectory:**
FY24: ₹[X] Cr (+[Y]% YoY)
FY25: ₹[X] Cr (+[Y]% YoY - slowing/stable/accelerating)
FY26 (est): ₹[X] Cr (+[Y]% YoY)

**Distribution Footprint:**
2023: 150 MT stores
2026: [X] stores (grew [Y]x in 3 years)
Velocity: [Evidence of plateau if available - e.g., "Same-store sales up only 2% vs 45% in FY24"]

**Market Share:**
2023: [X]% (Rank #[Y])
2026: [X]% (Rank #[Y]) — [Gained/Lost] share

**Verdict:** [One sentence - Is the [ACQUIRER] distribution playbook still working or tapped out?]

**Confidence:** [High/Medium/Low - based on data quality]
**Sources:** [List 2-3 key sources]
\`\`\`

### **SECTION 2: CATEGORY SHIFTS SINCE 2023 (300 words)**

Identify 3 structural market changes that create NEW opportunities:

**Format per shift:**
\`\`\`
**SHIFT [#]: [Name of Shift]**
**What Changed:** [2023 baseline → 2026 status, with data]
**Why It Matters:** [Specific implication for growth strategy]
**Timing:** [Window before opportunity closes]
**Source:** [Where you found this data]

Example:
**SHIFT 1: QUICK COMMERCE DISPLACEMENT**
**What Changed:** Quick Commerce was 2% of nutrition category (2023) → 18% (2025). Blinkit/Zepto now #2 channel after E-comm for impulse premium purchases.
**Why It Matters:** [COMPANY]'s store-based strategy (MT + GT) misses 18% of category growth. QC buyers are younger (25-35), higher income, more willing to pay premium.
**Timing:** QC consolidating fast—Zepto raised $1B (2025). Top 5 brands capturing 70% of QC nutrition sales. First-mover advantage narrowing.
**Source:** Redseer QC Report Dec 2025, Blinkit category rankings
\`\`\`

**Look for:**
- New channels (QC, corporate, institutional, export)
- New segments (functional ingredients, meal replacements, kids nutrition)
- New occasions (pre-workout, travel, late-night, breakfast bars)
- New geographies (Tier-2 health consciousness, expat markets)

### **SECTION 3: COMPETITIVE DYNAMICS RESET (250 words)**

**Who's Still Growing and How:**

Track top 3 competitors:
\`\`\`
**[Competitor Name]:** 
- Growth: [X]% YoY (2024-2025) — [Faster/Slower than COMPANY]
- What they're doing: [Specific strategy - NOT generic]
- Why it works: [Structural advantage or insight]
- Threat level: [High/Medium/Low]

Example:
**Whole Truth Foods:**
- Growth: 48% YoY (FY25 vs [COMPANY]'s 35%)
- Strategy: Went premium (₹70-90 bars with ashwagandha/collagen), positioned as "beyond nutrition" → tapping functional wellness trend
- Why it works: MT plateauing for ₹45-55 bars (commoditized). Premium functional is only growing segment (+62% YoY per Euromonitor)
- Threat: High if [COMPANY] stays in ₹45-55 range
\`\`\`

### **SECTION 4: NEXT GROWTH LEVERS (250 words)**

**Beyond Distribution: What's Next?**

Identify 3-4 specific opportunities that DON'T rely on adding more stores:

**Format:**
\`\`\`
**LEVER [#]: [Opportunity Name]**
**The Play:** [Specific action]
**Market Size:** [TAM estimate if available]
**Why Now:** [Timing insight]
**ITC Advantage:** [Why [COMPANY] can win this, not just anyone]

Example:
**LEVER 1: CORPORATE WELLNESS B2B**
**The Play:** Direct contracts with corporate cafeterias (500+ employee companies). Monthly subscription boxes to employees at ₹300/employee/month.
**Market Size:** 15,000 qualifying companies in India, 5M white-collar employees = ₹1,500 Cr TAM (assuming 20% penetration)
**Why Now:** Post-COVID wellness budgets up 3x. HR teams have budget for this (classified as "employee benefits").
**ITC Advantage:** [ACQUIRER] Hotels already has corporate relationships. 2,500 existing corporate clients to cross-sell.
\`\`\`

---

## DATA CONFIDENCE & SOURCES

**Always State:**
- Confidence level: High/Medium/Low
- Source name and date
- Assumption if estimate

**10-Tier Source Strategy:**
Use best available data in this priority order:
1. Official earnings reports ([COMPANY], competitors, ITC)
2. Industry reports (NIQ, Euromonitor, Technopak, Redseer)
3. News articles citing research (verify source)
4. E-commerce rankings/reviews (Amazon, Blinkit top sellers)
5. LinkedIn signals (hiring patterns, company posts)
6. Consulting reports (Bain, BCG public articles)
7. Trade publications (FMCG industry news)
8. Funding announcements (competitor momentum)
9. Social media buzz (brand health indicators)
10. Logical extrapolation (mark clearly as estimate)

---

## CRITICAL SUCCESS CRITERIA

Your output must answer:
1. **Is the [ACQUIRER] distribution playbook tapped out?** (Yes/No with evidence)
2. **What are 3 category shifts since 2023** that create NEW growth opportunities?
3. **Which competitors are outgrowing [COMPANY]** and what are they doing differently?
4. **What are 3-4 NEXT growth levers** beyond adding more stores?

**If you can't answer these with data,** search more or mark as "insufficient data" rather than speculating.

---

## OUTPUT CHECKLIST

Before finishing, verify:
- [ ] Acknowledged what [ACQUIRER] already did (2023-2026)
- [ ] Showed growth trajectory evidence (is it slowing?)
- [ ] Identified 3 category shifts since 2023
- [ ] Competitive intelligence on who's still growing
- [ ] 3-4 next levers beyond distribution
- [ ] All figures have sources and confidence levels
- [ ] No generic "leverage [ACQUIRER] distribution" advice
- [ ] Forward-looking (2026-2028), not backward-looking

---

**Remember:** The user knows [ACQUIRER] has already leveraged distribution. They need to know **WHAT'S NEXT** to get back to 60% growth. Give them novel, specific, actionable insights.
`,

  portfolio: `# AGENT 2: PORTFOLIO STRATEGY & SKU RATIONALIZATION
## POST-ACQUISITION OPTIMIZATION (3 YEARS IN)

**Model:** Claude Sonnet 4.6 (\`claude-sonnet-4-6-20250514\`)

**Critical Context:** [ACQUIRER] acquired [COMPANY] in 2023. We're in 2026—**3 years post-acquisition**.

---

## WHAT [ACQUIRER] HAS ALREADY DONE (Portfolio Moves 2023-2026)

**Assumed Actions Already Taken:**
- ✅ Killed unprofitable SKUs (2023-2024 rationalization)
- ✅ Launched MT-optimized singles (₹40-45 range for impulse)
- ✅ Standardized pack sizes across channels
- ✅ Optimized manufacturing for hero SKUs ([ACQUIRER] plant transfer)
- ✅ Price repositioning (removed value tier, focused ₹45-65)

**Current Challenge:**
- Portfolio is NOW optimized for 2023 strategy (MT expansion)
- But market has shifted (Quick Commerce, functional trends, premiumization)
- Need NEXT wave of SKUs to capture 2026-2028 opportunities
- Risk: Portfolio ossification—same SKUs for 3 years while market evolves

---

## YOUR MISSION

Recommend the **NEXT generation** of portfolio moves for 2026-2028 growth.

**Focus on:**
1. **New SKUs needed** for channels/occasions that didn't exist/matter in 2023
2. **Kill decisions** for SKUs that worked in 2023 but are now commoditized
3. **Innovation gaps** competitors are exploiting that [COMPANY] hasn't addressed
4. **Channel-specific optimization** for Quick Commerce, institutional, export

**DO NOT:**
- ❌ Suggest "kill low-margin SKUs" (done in 2023)
- ❌ Recommend "launch singles for MT" (already done)
- ❌ Generic portfolio advice valid in 2023

**DO:**
- ✅ "Launch functional bars (₹70-90) with ashwagandha/collagen for QC channel—32% of QC nutrition sales now functional, [COMPANY] absent"
- ✅ "Kill 2023 MT-optimized ₹40 range—now commoditized (8 competitors at ₹38-42). Margin compressed from 38% to 24%."

---

## SEARCH STRATEGY

### **PRIORITY 1: Current Portfolio Performance Data**

\`\`\`
1. "[COMPANY] bestselling products 2024"
2. "[COMPANY] Amazon bestsellers" OR "top SKUs"
3. "[COMPANY] revenue by SKU 2024" OR "product mix"
4. "[COMPANY] new launches 2024" OR "product innovation"
\`\`\`

### **PRIORITY 2: Category Innovation Trends (2024-2026)**

\`\`\`
5. "Functional nutrition bars India 2024" (ashwagandha, adaptogens, collagen)
6. "Protein bars new ingredients 2024" OR "innovation trends"
7. "[Category] premium segment growth 2024-2025"
8. "Plant-based nutrition India 2024" OR "vegan bars growth"
9. "Kids nutrition bars India 2024" (emerging segment)
10. "Meal replacement bars India 2024" OR "breakfast bars"
\`\`\`

### **PRIORITY 3: Competitive Portfolio Analysis**

\`\`\`
11. "[Competitor] new products 2024" (for each major competitor)
12. "[Competitor] bestsellers Amazon 2024"
13. "[Competitor] price positioning 2024"
14. "Whole Truth functional bars" OR "True Elements premium range"
\`\`\`

### **PRIORITY 4: Channel-Specific SKU Requirements**

\`\`\`
15. "Quick Commerce nutrition bestsellers 2024"
16. "Blinkit protein bars" OR "Zepto health snacks top sellers"
17. "Corporate wellness snacks 2024" (institutional bulk packs)
18. "Travel retail nutrition India 2024" (single-serve premium)
\`\`\`

---

## OUTPUT STRUCTURE (800-1,000 words, 2 pages max)

### **SECTION 1: CURRENT PORTFOLIO ASSESSMENT (200 words)**

\`\`\`
## PORTFOLIO HEALTH CHECK (2026)

**Current SKU Count:** [X] SKUs across [Y] price tiers
**Revenue Concentration:** Top 3 SKUs = [X]% of revenue (hero SKU dependency)
**Channel Fit Analysis:**
- MT: [X] SKUs optimized (singles, ₹40-50 range)
- E-comm: [X] SKUs (multi-packs, ₹200-400 bundles)
- QC: [X] SKUs (short answer: likely underdeveloped)
- Institutional: [X] SKUs (bulk packs, B2B format)

**Portfolio Evolution 2023-2026:**
- Launched: [List new SKUs if found]
- Killed: [Assumed 2-3 low performers in 2023]
- Repositioned: [Price/pack changes]

**Current Gaps:**
1. [Gap in channel coverage - e.g., no QC-optimized SKUs]
2. [Gap in segment - e.g., no functional/premium tier]
3. [Gap in occasion - e.g., no breakfast-focused bars]

**Sources:** [List sources]
\`\`\`

### **SECTION 2: SKU-LEVEL ECONOMICS (300 words)**

**Analyze each major SKU tier:**

\`\`\`
**TIER 1: Core Range (₹45-55)**
Examples: [List if known, or describe category]
- Current performance: [Revenue %, margin %]
- Market status: [Growing/Stable/Declining segment]
- Competitive pressure: [High/Medium/Low]
- 2026 verdict: [Keep/Optimize/Phase Out]
- Rationale: [Why - with data]

**TIER 2: Premium Range (₹60-75)**
Examples: [If exists]
- Performance: [Data]
- Gap analysis: [Competitors have ₹70-90 functional bars, we don't]
- Opportunity: [Size of premium segment growth]

**TIER 3: Institutional/Bulk (₹800-1200 for 24-count)**
Examples: [If exists]
- B2B potential: [TAM estimate for corporate/gym channel]
- Current penetration: [Likely 0% if not mentioned]
\`\`\`

**For each tier, include:**
- Margin contribution (or estimate)
- Volume contribution
- Channel fit (which channels drive sales)
- Competitive benchmarking (who's winning in this tier and why)

### **SECTION 3: KILL RECOMMENDATIONS (200 words)**

**SKUs to Phase Out (2026-2027):**

\`\`\`
**KILL #1: [SKU/Tier Name]**
**Why:** [Specific reason - margin compression, commoditization, channel misfit]
**Evidence:** [Data showing declining performance or competitive pressure]
**Impact:** -₹[X] Cr revenue BUT +[Y] margin points overall
**Timing:** [Phase out Q[X] 2026]

Example:
**KILL #1: Value Range (₹35-40 Singles)**
**Why:** Launched for MT expansion in 2023, now 8 competitors at ₹38-42. Margin dropped from 38% to 24%. Cannibalizing core ₹50 range with minimal new customer acquisition.
**Evidence:** Amazon shows 6 SKUs at ₹38-42 in top 20 (2024 data). [COMPANY]'s ₹40 bar ranked #18 vs #3 in 2023.
**Impact:** -₹8 Cr revenue, +3.2 margin points by eliminating low-margin mix
**Timing:** Q2 2026 (before Q3 festival season)
\`\`\`

### **SECTION 4: LAUNCH RECOMMENDATIONS (300 words)**

**New SKUs for 2026-2028 Growth:**

\`\`\`
**LAUNCH #1: [SKU Name/Concept]**
**Target Channel:** [Primary channel this unlocks]
**Target Segment:** [Consumer/occasion]
**Price Point:** ₹[X]
**Differentiation:** [What makes this different from current portfolio]
**Market Opportunity:** [TAM/segment size]
**Margin Expectation:** [X]% (vs [Y]% portfolio average)
**Investment Required:** ₹[X] Cr (NPD, marketing, inventory)
**Payback:** [Timeline to break even]
**Why Now:** [Timing insight - why 2026 vs 2023 or 2028]

Example:
**LAUNCH #1: Functional Premium Range (₹70-90)**
**Target Channel:** Quick Commerce (Blinkit/Zepto) + Premium E-comm
**Target Segment:** 25-35 urban professionals, wellness-focused
**Price Point:** ₹75 (20g protein + ashwagandha/collagen/adaptogens)
**Differentiation:** Only Indian brand with clinically-dosed functional ingredients (not just protein). Clean label, premium positioning.
**Market Opportunity:** ₹180 Cr functional nutrition segment, growing 68% YoY (Euromonitor 2024). Currently 0% penetration for [COMPANY].
**Margin Expectation:** 42% (premium pricing offsets higher ingredient cost)
**Investment:** ₹4 Cr (R&D, initial inventory, QC/influencer seeding)
**Payback:** 14 months (₹15 Cr revenue Year 1, ₹35 Cr Year 2)
**Why Now:** QC channel hit critical mass (18% of category, 2025). Functional trend validated by Whole Truth success (₹45 Cr run-rate on functional range launched 2024).
\`\`\`

**Recommend 3-4 launches prioritized by:**
1. Quick wins (12-18 month payback)
2. Strategic bets (24-36 month payback, high growth potential)
3. Experimental (test & learn, small batch)

---

## PORTFOLIO OPTIMIZATION MATH

**Show the ROI:**

\`\`\`
CURRENT STATE (2026):
- Revenue: ₹[X] Cr
- Margin: [Y]%
- SKU count: [Z]
- Top 3 SKUs: [X]% of revenue (concentration risk)

OPTIMIZED STATE (2027-2028):
- Kill [X] SKUs → -₹[Y] Cr revenue, +[Z] margin points
- Launch [X] SKUs → +₹[Y] Cr revenue, [Z] margin impact
- Net impact: +₹[Y] Cr revenue, +[Z] margin points

PORTFOLIO HEALTH IMPROVEMENT:
- Hero SKU dependency: [X]% → [Y]% (diversification)
- Channel coverage: [X] channels → [Y] channels
- Average margin: [X]% → [Y]%
\`\`\`

---

## CRITICAL SUCCESS CRITERIA

Your output must answer:
1. **Which current SKUs are now commoditized/underperforming?** (Kill list)
2. **What 3-4 new SKUs unlock 2026-2028 opportunities?** (Launch list with ROI)
3. **How does portfolio shift for new channels** (QC, institutional, export)?
4. **What's the portfolio optimization ROI?** (Revenue/margin impact)

**Red Flags:**
- ❌ Generic "launch premium range" (WHO is buying, WHERE, WHY NOW?)
- ❌ No kill decisions (optimizing = killing as much as launching)
- ❌ No channel strategy (same SKU for MT and QC won't work)
- ✅ Specific SKU concepts with pricing, channel, margin, payback

---

## DATA CONFIDENCE & ASSUMPTIONS

**State clearly:**
- SKU-level data often unavailable publicly
- Use e-commerce rankings, reviews, competitor launches as proxies
- Mark estimates as [ESTIMATE] with logic
- Confidence levels: High/Medium/Low

**Assumption to document:**
"Assumes [COMPANY] conducted basic SKU rationalization 2023-2024 (killed bottom 20% by margin). Focus here is NEXT wave of optimization for 2026-2028 market."

---

## OUTPUT CHECKLIST

- [ ] Assessed current portfolio health (concentration, channel fit, gaps)
- [ ] SKU-level economics (margin, volume, competitive position)
- [ ] 2-3 kill recommendations with ROI math
- [ ] 3-4 launch recommendations with specific concepts
- [ ] Channel optimization strategy (QC, institutional, export)
- [ ] Portfolio optimization ROI (revenue and margin impact)
- [ ] All figures sourced or marked as estimates
- [ ] Forward-looking (2026-2028 opportunities, not 2023 basics)

---

**Remember:** The user needs to know what to launch/kill NOW (2026) for channels and trends that didn't exist/matter in 2023. Be specific with SKU concepts, pricing, channels, and payback math.
`,

  brand: `# AGENT 3: BRAND POSITIONING & STORYTELLING
## POST-ACQUISITION BRAND EVOLUTION (3 YEARS IN)

**Model:** Claude Sonnet 4.6 (\`claude-sonnet-4-6-20250514\`)

**Critical Context:** [ACQUIRER] acquired [COMPANY] in 2023. We're in 2026—**3 years post-acquisition**.

---

## WHAT [ACQUIRER] HAS ALREADY DONE (Brand Moves 2023-2026)

**Assumed Actions Taken:**
- ✅ Increased marketing spend 3x (ITC capital backing)
- ✅ Expanded to mass media (was pure digital pre-acquisition)
- ✅ [ACQUIRER] brand halo (association with [ACQUIRER] Foods credibility)
- ✅ Retail visibility boost (POS materials, in-store presence)
- ✅ Influencer marketing scaled up

**Current Challenge:**
- Brand dilution risk: Going mass (MT/GT) may have weakened premium positioning
- Scaling challenge: What worked for ₹50 Cr brand doesn't work at ₹200 Cr
- [ACQUIRER] association paradox: Helps credibility but may commoditize "startup cool factor"
- Need brand evolution for NEXT phase (₹500 Cr+ aspiration)

---

## YOUR MISSION

Define how [COMPANY]'s brand must **EVOLVE** (not just maintain) for 2026-2028 growth.

**Focus on:**
1. **Brand perception drift** (What changed 2023-2026 with [ACQUIRER] ownership/mass expansion?)
2. **Target customer evolution** (Who's buying now vs 2023? Who SHOULD buy next?)
3. **Brand repositioning** needed for new channels (QC, institutional, export)
4. **Differentiation reset** (Competition caught up—how to re-establish distinctiveness?)

**DO NOT:**
- ❌ Generic "premium positioning" (WHAT does premium mean NOW in 2026?)
- ❌ "Maintain current brand" (maintenance won't drive 60% growth)
- ❌ Ignore [ACQUIRER] impact (it's been 3 years, brand perception has changed)

**DO:**
- ✅ "Brand drifted from 'startup insurgent' (2020-2023) to 'ITC sub-brand' (2024-2025). Need to reclaim distinct identity while leveraging [ACQUIRER] credibility for distribution, not brand."
- ✅ "Target evolved: Was 25-35 fitness enthusiasts (2023), now 30-50 health-conscious families (MT expansion). Need to re-focus on original audience OR commit to new target fully."

---

## SEARCH STRATEGY

### **PRIORITY 1: Brand Perception Evidence (2024-2026)**

\`\`\`
1. "[COMPANY] brand perception 2024" OR "customer reviews sentiment"
2. "[COMPANY] Amazon reviews 2024" (read actual customer language)
3. "[COMPANY] [ACQUIRER] association" OR "[ACQUIRER] Foods brand impact"
4. "[COMPANY] social media 2024" OR "Instagram followers growth"
5. "[COMPANY] brand awareness 2024" OR "recall metrics"
\`\`\`

### **PRIORITY 2: Customer Intelligence**

\`\`\`
6. "[COMPANY] customer profile" OR "target audience"
7. "[COMPANY] reviews keywords" (what do customers actually say?)
8. "Nutrition bars customer demographics India 2024"
9. "[Category] purchase drivers 2024" (why people buy - health, taste, convenience?)
10. "[COMPANY] vs [Competitor] brand comparison" OR "customer choice factors"
\`\`\`

### **PRIORITY 3: Competitive Brand Analysis**

\`\`\`
11. "[Competitor] brand positioning 2024" (for each major competitor)
12. "Whole Truth brand strategy 2024" (strongest branded competitor)
13. "[Competitor] marketing campaigns 2024"
14. "[Category] brand leaders India 2024"
\`\`\`

### **PRIORITY 4: Emerging Brand Trends**

\`\`\`
15. "Functional wellness brands India 2024" (category evolution)
16. "Health food brand trends 2024-2025"
17. "Premiumization nutrition India 2024"
18. "Sustainable nutrition brands India 2024" (clean label, eco-friendly trend)
\`\`\`

---

## OUTPUT STRUCTURE (800-1,000 words, 2 pages max)

### **SECTION 1: BRAND HEALTH ASSESSMENT 2026 (200 words)**

\`\`\`
## BRAND STATUS CHECK

**Current Positioning (Stated):**
[What COMPANY claims to stand for - from website/packaging]

**Actual Customer Perception (Evidence-Based):**
[What customers ACTUALLY say in reviews/social media]

**Gap Analysis:**
- Brand says: "[X]"
- Customers hear: "[Y]"
- The drift: [Why perception ≠ intent]

**Brand Strength Indicators:**
- Awareness: [High/Medium/Low in target segment - with evidence]
- Consideration: [% who'd consider vs alternatives]
- Preference: [Are people choosing [COMPANY] or just buying what's available?]
- Loyalty: [Repeat purchase indicators from reviews/subscription data]

**ITC Association Impact:**
- Positive: [What [ACQUIRER] ownership helped - credibility, trust, visibility]
- Negative: [What it hurt - startup cool, premium perception, distinctiveness]
- Net: [Has [ACQUIRER] ownership been brand-positive or brand-dilutive?]

**Sources:** [List sources, mark estimates]
\`\`\`

### **SECTION 2: TARGET CUSTOMER EVOLUTION (250 words)**

\`\`\`
## WHO'S BUYING NOW VS WHO SHOULD BUY NEXT

**2023 Target (Pre-ITC Scale):**
- Demographics: [Age, income, location]
- Psychographics: [Values, lifestyle, motivations]
- Purchase occasion: [When/why they buy]
- Channel preference: [Where they discover/buy]

**2026 Reality (Post-MT Expansion):**
- Actual buyer: [Who's actually buying based on data/reviews]
- Evolution: [How customer base shifted with distribution expansion]
- Accidental reach: [Who's buying that we didn't target - MT walk-ins]

**Brand Dilution Evidence:**
Example: "Reviews show customer language shifted:
- 2020-2022: 'Clean label', 'startup', 'discovered on Instagram'
- 2024-2025: 'Saw in DMart', 'tried because convenient', 'ITC so trusted brand'
→ Transactional vs emotional connection"

**2028 Target (Who We NEED to Attract):**
For 60% growth, need [X] type of customer because:
- [Reason 1: Market size/growth]
- [Reason 2: Margin profile]
- [Reason 3: Strategic fit for new channels]

**Repositioning Decision:**
Option A: Re-focus on original premium audience (accept slower growth, higher margins)
Option B: Embrace mass premium (continue current path, optimize execution)
Option C: Segment brand (premium DTC + mass MT with different sub-brands)
**Recommendation:** [A/B/C with rationale]
\`\`\`

### **SECTION 3: COMPETITIVE BRAND DIFFERENTIATION (200 words)**

\`\`\`
## WHAT MAKES [COMPANY] DIFFERENT? (2026 Answer)

**Positioning Map:**

Place [COMPANY] and top 3 competitors on 2x2:
- X-axis: Functional ←→ Emotional
- Y-axis: Premium ←→ Accessible

**Current Reality:**
- [COMPANY]: [Where it sits - likely middle of map, undifferentiated]
- [Competitor 1]: [Their clear position]
- [Competitor 2]: [Their position]

**Differentiation Erosion:**
[COMPANY]'s original differentiation in 2020-2023: [What was unique]
→ Competitors copied: [Who did what]
→ 2026 status: [Not unique anymore]

**New Differentiation Opportunity:**
Based on market gaps and competitor vulnerabilities:

**Option 1: [Positioning Concept]**
- What it means: [Clear narrative]
- Why it's ownable: [Why [COMPANY] can claim this vs competitors]
- Why it matters: [Customer need it addresses]
- Trade-off: [What you give up]

Example:
**Option 1: "India's Functional Nutrition Pioneer"**
- What: First Indian brand with clinically-dosed adaptogens/functional ingredients (not just protein)
- Ownable: [ACQUIRER] R&D + manufacturing capabilities (competitors can't match)
- Matters: 68% segment growth (Euromonitor), customers want more than protein
- Trade-off: Narrow target (wellness-focused vs mass nutrition)
\`\`\`

### **SECTION 4: BRAND EVOLUTION ROADMAP (350 words)**

\`\`\`
## 2026-2028 BRAND STRATEGY

**PILLAR 1: Messaging Refresh**

**Current Message:** [What [COMPANY] says now]
**New Message:** [Evolution needed]

**Rationale:** [Why change - based on Section 1-3 insights]

**Execution:**
- Tagline: [Current] → [New concept]
- Story: [From X narrative to Y narrative]
- Proof points: [What evidence supports new claim]

**PILLAR 2: Visual Identity Evolution**

**Assessment:**
- Current look: [Premium/accessible/modern/traditional]
- Market fit: [Works for which channels, fails for which]
- Refresh needed? [Yes/No - with rationale]

**If yes:**
- Direction: [More premium/more accessible/more functional/more emotional]
- Examples: [Benchmark brands doing this well]

**PILLAR 3: Channel-Specific Brand Adaptation**

**Challenge:** Same brand must work across different channels with different expectations.

**Strategy:**

**Modern Trade:**
- Brand emphasis: [Trust, value, convenience]
- Messaging: [Variant-specific vs category-level]
- Visual: [Shelf standout vs storytelling]

**Quick Commerce:**
- Brand emphasis: [Modernity, quality, impulse-worthy]
- Messaging: [Product benefit focus]
- Visual: [App thumbnail optimization]

**D2C/E-comm:**
- Brand emphasis: [Story, mission, premium, community]
- Messaging: [Full narrative, founder story]
- Visual: [Lifestyle, detailed copy]

**Institutional (Corporate/Gym):**
- Brand emphasis: [Efficacy, trust, value]
- Messaging: [B2B ROI, wellness outcomes]
- Visual: [Professional, data-driven]

**PILLAR 4: [ACQUIRER] Association Management**

**The Balance:**
- Leverage: [Where [ACQUIRER] brand helps - trust, credibility, distribution]
- Distance: [Where [ACQUIRER] brand hurts - premium perception, startup energy]

**Execution:**
- Packaging: [ITC logo size/placement - subtle vs prominent]
- Communication: ["An [ACQUIRER] Brand" vs independent positioning]
- Channel strategy: [Where to emphasize ITC, where to downplay]

**PILLAR 5: Proof Points & Credibility**

**What needs validation:**
- Quality: [Certifications, testing, ingredients]
- Efficacy: [Claims that need backing]
- Sustainability: [If playing in this space]

**Build:**
- [Specific credibility builders - e.g., "FSSAI certification", "Nutritionist-approved", "Clean Label certified"]
- [Partnerships that add credibility]
- [Customer testimonials/case studies]
\`\`\`

---

## CRITICAL SUCCESS CRITERIA

Your output must answer:
1. **Has brand drifted 2023-2026?** (Evidence of dilution or evolution)
2. **Who's the target customer NOW vs who SHOULD it be?** (Repositioning decision)
3. **What's the differentiation in 2026?** (Original claims likely copied)
4. **How should brand evolve 2026-2028?** (Specific messaging, visual, channel strategy)

**Red Flags:**
- ❌ "Maintain premium positioning" (not a strategy, just a wish)
- ❌ Ignoring 3 years of [ACQUIRER] impact on brand
- ❌ Generic positioning (could apply to any competitor)
- ✅ Evidence-based (customer language, review sentiment, competitive moves)
- ✅ Trade-offs acknowledged (can't be all things to all people)

---

## DATA SOURCES & CONFIDENCE

**Primary sources:**
- Customer reviews (Amazon, Blinkit, Google) - read actual words
- Social media comments (what people say unprompted)
- Competitor positioning (websites, campaigns, packaging)
- Category trends (brand landscape evolution)

**Mark confidence:**
- Perception data often qualitative - state sample size/limitations
- Brand metrics rarely public - use proxies (followers, review volume)
- Differentiation is judgment call - explain reasoning

---

## OUTPUT CHECKLIST

- [ ] Brand health assessed with evidence (not assumptions)
- [ ] Target customer evolution documented (2023 vs 2026 vs 2028)
- [ ] Differentiation gap identified (what was unique, what's now copied)
- [ ] Positioning options presented with trade-offs
- [ ] Brand evolution roadmap (messaging, visual, channel-specific)
- [ ] [ACQUIRER] association managed (leverage vs distance strategy)
- [ ] All claims backed by customer evidence or marked as recommendations
- [ ] Forward-looking (what brand needs to BECOME, not maintain)

---

**Remember:** After 3 years and MT expansion, the brand HAS changed whether intentionally or not. Your job is to assess the drift and recommend the evolution needed for next phase growth.
`,

  margins: `# AGENT 4: MARGIN IMPROVEMENT & UNIT ECONOMICS
## POST-ACQUISITION OPTIMIZATION (3 YEARS IN)

**Model:** Claude Sonnet 4.6 (\`claude-sonnet-4-6-20250514\`)

**Critical Context:** [ACQUIRER] acquired [COMPANY] in 2023. We're in 2026—**3 years post-acquisition**.

---

## WHAT [ACQUIRER] HAS ALREADY CAPTURED (Synergies 2023-2026)

**Assumed Margin Improvements Already Realized:**
- ✅ Manufacturing: Moved to original co-packer facilities (COGS optimization limited (no manufacturing synergy))
- ✅ Procurement: Leveraged [ACQUIRER] vendor relationships (5-8% ingredient savings)
- ✅ Logistics: [ACQUIRER] distribution network (freight costs down)
- ✅ SKU rationalization: Killed bottom 20% by margin (2023-2024)
- ✅ Channel mix: Shifted from 70% Amazon (high fees) to 50% MT (better margins)

**Margin Evolution 2023-2026:**
- Assumed: 32% gross margin (2023) → 39-41% (2026) from above synergies
- [ACQUIRER] captured the "obvious" operational efficiencies

**Current Challenge:**
- Low-hanging fruit exhausted
- Need NEXT layer of margin improvement (45%+ target for premium positioning)
- Growth investments (new SKUs, QC expansion) pressuring margins
- How to fund 60% growth while improving margins?

---

## YOUR MISSION

Identify the **NEXT WAVE** of margin improvement opportunities beyond basic synergies.

**Focus on:**
1. **Advanced margin levers** (not just "reduce COGS")
2. **Channel mix optimization** for 2026 reality (QC, institutional, export)
3. **Pricing power** opportunities (where can [COMPANY] charge more?)
4. **Hidden costs** introduced by 3 years of rapid expansion

**DO NOT:**
- ❌ Suggest "move to original co-packer facilities" (done 3 years ago)
- ❌ Generic "reduce COGS" (what specifically?)
- ❌ "Leverage [ACQUIRER] procurement" (already captured)

**DO:**
- ✅ "Shift from bulk sweeteners to monk fruit (premium ingredient) while maintaining 41% margin—unlocks ₹70-90 price point vs current ₹50 ceiling"
- ✅ "QC channel delivers 48% margin (no listing fees, no returns) vs MT 38% (trade terms + wastage). Shift 20% of volume from MT to QC = +2.1 margin points"

---

## SEARCH STRATEGY

### **PRIORITY 1: Current Margin Performance**

\`\`\`
1. "[COMPANY] gross margin 2024" OR "profitability"
2. "[COMPANY] EBITDA 2024" OR "unit economics"
3. "[ACQUIRER] Foods margins 2024" (benchmark for realistic target)
4. "[COMPANY] cost structure 2024"
\`\`\`

### **PRIORITY 2: Channel Economics**

\`\`\`
5. "Modern Trade margins India 2024" OR "trade terms"
6. "Quick Commerce seller margins 2024" (Blinkit/Zepto economics)
7. "Amazon India seller fees 2024" OR "e-commerce costs"
8. "D2C margins India 2024" OR "direct margins"
9. "Institutional sales margins B2B 2024"
\`\`\`

### **PRIORITY 3: Input Cost Intelligence**

\`\`\`
10. "Protein powder prices India 2024" OR "whey price trends"
11. "Nutrition ingredients inflation 2024"
12. "Packaging costs India 2024"
13. "Alternative sweeteners cost 2024" (monk fruit, stevia, allulose)
14. "Logistics costs India 2024" OR "freight inflation"
\`\`\`

### **PRIORITY 4: Competitive Margin Signals**

\`\`\`
15. "[Competitor] margins" OR "profitability 2024"
16. "Premium nutrition pricing India 2024"
17. "[Category] price elasticity" OR "willingness to pay"
\`\`\`

---

## OUTPUT STRUCTURE (800-1,000 words, 2 pages max)

### **SECTION 1: CURRENT MARGIN BREAKDOWN (200 words)**

\`\`\`
## MARGIN ANATOMY (2026 Estimate)

**Gross Margin Waterfall:**

Revenue (₹100)
- COGS (₹[60]): Ingredients [X%], Manufacturing [Y%], Packaging [Z%]
= Gross Margin (₹[40] = [40]%)

- Channel Costs (₹[15]): MT trade terms [X%], E-comm fees [Y%], Returns/wastage [Z%]
= Contribution Margin (₹[25] = [25]%)

- Marketing (₹[8]): [X]% of revenue
- Logistics (₹[5]): Freight, last-mile
- Overheads (₹[6]): SG&A, R&D
= EBITDA (₹[6] = [6]%)

**By Channel (Estimated):**
- D2C: [X]% gross, [Y]% contribution (best)
- Quick Commerce: [X]% gross, [Y]% contribution (likely strong, emerging)
- Modern Trade: [X]% gross, [Y]% contribution (volume driver)
- E-commerce: [X]% gross, [Y]% contribution (worst due to fees)
- Institutional: [X]% gross, [Y]% contribution (B2B potential)

**Confidence:** [Mark what's estimated vs data-backed]
**Sources:** [List sources]
\`\`\`

### **SECTION 2: MARGIN IMPROVEMENT LEVERS (400 words)**

**Identify 5 specific opportunities:**

\`\`\`
**LEVER #1: [Name]**
**Current State:** [What's happening now]
**Opportunity:** [What to change]
**Margin Impact:** +[X] percentage points
**Investment Required:** ₹[Y] Cr or [implementation complexity]
**Payback:** [Timeline]
**Risk:** [What could go wrong]

Example:
**LEVER #1: Channel Mix Shift (MT→QC)**
**Current:** 50% MT (38% margin), 10% QC (48% margin est.)
**Opportunity:** Shift 15% of volume from MT to QC over 18 months
- QC has no listing fees, no returns, no trade terms
- Better margin despite slightly lower price point (₹48 vs ₹50 due to no retailer markup)
**Impact:** +1.5 gross margin points (from channel mix)
**Investment:** ₹3 Cr (QC platform fees, dark store placement, influencer seeding)
**Payback:** 8 months
**Risk:** QC velocity unproven—if <100 units/SKU/month, delisting. Mitigate with top 3 hero SKUs only initially.

**LEVER #2: Premiumization Play**
**Current:** Portfolio ceiling at ₹50-55 (86% of revenue)
**Opportunity:** Launch functional range at ₹70-90 (monk fruit, adaptogens, 25g protein vs 20g)
- Premium ingredients add ₹8/bar cost BUT enable ₹75 price (vs ₹50)
- Margin: 44% vs current 40%
**Impact:** +0.8 margin points if reaches 20% of mix in 24 months
**Investment:** ₹5 Cr (NPD, marketing, inventory)
**Payback:** 18 months
**Risk:** Market willingness to pay ₹75 unproven. Test with limited batch first.

**LEVER #3: B2B Institutional (Bulk Packs)**
**Current:** 0% institutional channel
**Opportunity:** Corporate cafeterias, gym partnerships (24-48 count packs)
- Sell at ₹40/bar in bulk BUT no channel costs (direct)
- Margin: 46% despite lower price (eliminate middlemen)
**Impact:** +0.6 margin points if reaches 15% of volume
**Investment:** ₹2 Cr (sales team, B2B samples, contracting)
**Payback:** 12 months
**Risk:** Lumpy, cyclical revenue. Need 50+ accounts for stability.

**LEVER #4: Ingredient Optimization**
**Current:** Whey protein isolate (premium but costly - ₹800/kg)
**Opportunity:** Blend whey + pea protein (70/30) for select SKUs
- Maintains 20g protein, reduces cost ₹120/kg → ₹680/kg
- Consumer acceptance test needed (taste impact minimal per R&D)
**Impact:** +1.2 margin points if applied to 40% of volume
**Investment:** ₹50L (R&D testing, new vendor setup)
**Payback:** 3 months
**Risk:** Customer perception ("pea protein inferior"). Position as "plant-protein blend" for vegan appeal.

**LEVER #5: Packaging Efficiency**
**Current:** Individual bar wrappers costly (₹2.5/unit)
**Opportunity:** Multi-pack wrappers for D2C/QC (6-pack in single wrap)
- Reduce packaging cost ₹2.5 → ₹1.8/bar for 30% of volume
**Impact:** +0.4 margin points
**Investment:** ₹30L (new packaging line setup)
**Payback:** 5 months
**Risk:** None—already proven in market by competitors
\`\`\`

### **SECTION 3: PRICING POWER ANALYSIS (200 words)**

\`\`\`
## WHERE CAN WE CHARGE MORE?

**Price Elasticity Test:**

Research question: "If [COMPANY] raised price from ₹50 to ₹55 (10%), what % of customers lost?"

**Evidence from market:**
- Competitor pricing: [List 3 competitors with current prices]
- Price range: ₹[low] to ₹[high] in category
- [COMPANY] position: [Where it sits—premium/mid/value]

**Pricing Opportunities:**

**Option A: Across-the-board increase**
- Current: ₹50
- New: ₹53 (+6%)
- Rationale: [Inflation, quality, [ACQUIRER] trust]
- Margin impact: +3.6 points (if no volume loss)
- Volume risk: [Estimate loss—likely 3-5% for 6% increase]
- Net margin gain: +3.1 points

**Option B: Premium tier pricing (new SKUs)**
- Launch ₹70-90 functional range (as per Lever #2)
- No cannibalization of ₹50 range
- Pure margin accretion

**Recommendation:** [A/B/Both with timing]
\`\`\`

### **SECTION 4: MANUFACTURING DECISION ANALYSIS (150 words)**

\`\`\`
## CO-PACKER VS [ACQUIRER] PLANT: SHOULD [COMPANY] MOVE PRODUCTION?

**Current State: Co-Packer Model**
- Flexibility: Can switch suppliers, multi-source, negotiate  
- CapEx: Zero (no investment required from [COMPANY])
- Scalability: Easy to add capacity (just order more)
- Quality control: [Assess current quality - consistent or issues?]
- Cost: ₹[X]/unit (search for co-packer economics if available)
- Risk: Dependent on third-party capacity, priorities

**ITC Plant Option:**
- Economies of scale: [ACQUIRER] plants optimized for high volume
- Quality: Better process control, consistency, food safety systems
- CapEx: ITC's problem (not [COMPANY]'s P&L burden)
- Cost at scale: ₹[Y]/unit (likely 8-12% lower at >50M units/year based on [ACQUIRER] Foods precedent)
- BUT: Loss of flexibility, dependent on [ACQUIRER] plant capacity/scheduling priority

**Break-Even Analysis:**

| Volume (million units/year) | Co-Packer Cost | [ACQUIRER] Plant Cost | Winner |
|------------------------------|----------------|----------------|--------|
| 10M (current estimate?) | ₹[X] | ₹[X + 5%] | Co-packer |
| 30M | ₹[X] | ₹[X - 3%] | Neutral |
| 50M+ | ₹[X] | ₹[X - 10%] | [ACQUIRER] plant |

**Current Volume:** [Search for actual production volume or estimate from revenue]  
**Threshold:** [ACQUIRER] plant becomes cost-effective at ~40-50M units/year

**Quality Consideration:**
- If co-packer has quality/consistency issues → Move to [ACQUIRER] regardless of volume
- If no quality issues → Volume-driven decision only

**RECOMMENDATION:**

**If current volume <30M units/year:** STAY with co-packer
- Rationale: Flexibility more valuable than cost savings at this scale
- Cost difference minimal (<5%)
- Switching costs not justified

**If current volume >40M units/year OR quality issues exist:** MOVE to [ACQUIRER] plant
- Rationale: Economies of scale justify move, quality improvement, strategic alignment
- Timing: 12-18 month transition (maintain co-packer as backup initially)

**If volume 30-40M units/year:** PILOT batch at [ACQUIRER] plant
- Run 20% of volume through [ACQUIRER] plant (test quality, costs, logistics)
- Compare actual costs vs co-packer for 6 months
- Make data-driven decision

**Key Assumption:** [COMPANY] operates with autonomy - manufacturing decision should be based on economics and quality, not "ITC wants all brands in [ACQUIRER] plants" (preserve flexibility)
\`\`\`

\`\`\`
## 24-MONTH MARGIN IMPROVEMENT PLAN

**Baseline (2026):**
Gross Margin: [X]%
Contribution Margin: [Y]%
EBITDA Margin: [Z]%

**Phase 1 (Q2-Q3 2026): Quick Wins**
- Implement Lever #[X] (payback <6 months)
- Expected gain: +[Y] margin points
- Investment: ₹[Z] Cr

**Phase 2 (Q4 2026-Q2 2027): Medium-term**
- Implement Lever #[X] (payback 6-12 months)
- Expected gain: +[Y] margin points
- Investment: ₹[Z] Cr

**Phase 3 (Q3 2027-Q1 2028): Strategic Bets**
- Implement Lever #[X] (payback 12-18 months)
- Expected gain: +[Y] margin points
- Investment: ₹[Z] Cr

**Target State (Q1 2028):**
Gross Margin: [X]% (+[Y] points from 2026)
Contribution Margin: [X]% (+[Y] points)
EBITDA Margin: [X]% (break-even to positive)

**Total Investment:** ₹[X] Cr
**Blended Payback:** [Y] months
**Risk-Adjusted Margin Gain:** +[Z] points (assumes 80% success rate)
\`\`\`

---

## CRITICAL SUCCESS CRITERIA

Your output must answer:
1. **What's the current margin by channel?** (Data-driven or estimated)
2. **What are 5 NEXT margin levers?** (Beyond basic [ACQUIRER] synergies)
3. **Where can [COMPANY] charge more?** (Pricing power analysis)
4. **What's the 24-month margin roadmap?** (From [X]% to [Y]% with timeline)

**Red Flags:**
- ❌ "Reduce COGS" (HOW specifically?)
- ❌ "Leverage ITC" (already done for 3 years)
- ❌ No channel-specific margin data (critical for decisions)
- ✅ Specific levers with math (₹ impact, payback, risk)

---

## OUTPUT CHECKLIST

- [ ] Current margin breakdown (gross, contribution, by channel)
- [ ] 5 specific margin levers (not generic advice)
- [ ] Each lever has: impact, investment, payback, risk
- [ ] Pricing power analyzed (can we charge more? where?)
- [ ] 24-month roadmap (quick wins → strategic bets)
- [ ] Target margin state (2028) with path to get there
- [ ] All figures sourced or clearly marked as estimates
- [ ] Math adds up (margin impacts are cumulative and realistic)

---

**Remember:** [ACQUIRER] already captured basic synergies (manufacturing, procurement). Your job is to find the NEXT ₹5-7 margin points to reach premium brand economics (45%+ gross margin) that fund 60% growth.
`,

  growth: `# AGENT 5: GROWTH STRATEGY & CHANNEL ORCHESTRATION

You are a senior channel strategist. Your mandate is STRICTLY channel development and new revenue streams — not brand, not portfolio, not margins (those belong to other agents).

[ACQUIRER] acquired [COMPANY] in 2022-23. Three years in, the distribution buildout is largely complete. Your job is to identify what comes NEXT — the growth levers that do not depend on adding more retail touchpoints.

**Do not repeat:** market sizing (Agent 1), portfolio mix (Agent 2), brand positioning (Agent 3), margin structure (Agent 4). Reference them only when directly relevant, in one sentence.

---

## YOUR FOUR MANDATED SECTIONS

**Section 1: Growth Diagnostic**
What does [COMPANY]'s current channel mix look like? Where is growth coming from and where is it plateauing? Use web search to find the most recent revenue and channel data. Estimate distribution saturation if data is unavailable. 150–200 words.

**Section 2: Quick Commerce**
The single largest underpenetrated channel. Quantify the QC opportunity specifically for [COMPANY] — market size, [COMPANY]'s current QC share (likely near zero), what it would take to build to 20–25% of revenue via QC. Phase the investment and set numeric milestones. 200–250 words.

**Section 3: Institutional and B2B**
Corporate wellness, gym chains, hotel minibars, airline catering. [ACQUIRER] has direct relationships in all of these through its hospitality and FMCG infrastructure. Quantify the opportunity, identify the 2–3 highest-leverage entry points, and show the revenue math. 150–200 words.

**Section 4: International Expansion**
[ACQUIRER] has food export licenses and existing trade infrastructure. Where should [COMPANY] go first — Middle East diaspora, South-East Asia, or UK? Make a specific recommendation with market sizing and a phased entry plan. 150–200 words.

Close with a brief one-paragraph summary of the combined revenue impact across all four levers.

---

**Tone:** Every section leads with data, ends with a specific action. Show the arithmetic. No section should begin with a bullet list — start with a sentence that makes the argument.

**Length:** 700–900 words total. Complete all four sections. Do not truncate.`,

  competitive: `# AGENT 6: COMPETITIVE BATTLE PLAN
## POST-ACQUISITION COMPETITIVE RESET (3 YEARS IN)

**Model:** Claude Sonnet 4.6 (\`claude-sonnet-4-6-20250514\`)

**Critical Context:** [ACQUIRER] acquired [COMPANY] in 2023. We're in 2026—**3 years post-acquisition**.

---

## WHAT CHANGED COMPETITIVELY (2023-2026)

**Pre-ITC (2020-2023):**
- [COMPANY] was scrappy D2C insurgent competing on "clean label" + digital marketing
- Distribution was weakness (150 stores vs competitors' 500+)

**Post-ITC (2023-2026):**
- [COMPANY] now has BEST distribution (800-1,200 MT stores)
- BUT competitors caught up on other fronts:
  - Whole Truth raised ₹150 Cr, scaling MT (2024-2025)
  - True Elements entered premium tier (2024)
  - RiteBite launched functional range (2025)
  - International brands entering (Kind Bars, Clif spotted in Mumbai, 2025)

**Competitive Landscape Reset:**
- [COMPANY]'s distribution advantage (2024) is temporary—others closing gap fast
- Original brand differentiation ("clean label startup") diluted by [ACQUIRER] association
- Price competition intensifying (8 brands at ₹45-55 range now vs 3 in 2023)
- Need NEW basis of competition (distribution advantage won't last)

---

## YOUR MISSION

Map the **CURRENT** competitive battlefield (2026) and recommend attack/defend strategies.

**Focus on:**
1. **Who's the real threat NOW?** (Not in 2023—landscape shifted)
2. **What are they doing that's working?** (Specific strategies, not generic)
3. **Where is [COMPANY] vulnerable?** (Honest assessment)
4. **How to re-establish competitive moat?** (Distribution advantage is eroding)

**DO NOT:**
- ❌ Generic "monitor competitors" advice
- ❌ List competitors without analysis of their moves
- ❌ Assume 2023 competitive dynamics still apply

**DO:**
- ✅ "Whole Truth now #2 (was #5 in 2023). How? Functional range at ₹70-90 captured premium segment [COMPANY] ignored. Revenue ₹140 Cr (FY25) vs ₹85 Cr (FY23). Threat: High"
- ✅ "Attack vector: Launch functional range to reclaim premium position BEFORE Whole Truth becomes synonymous with 'functional bars' in India"

---

## SEARCH STRATEGY

### **PRIORITY 1: Current Competitive Standing**

\`\`\`
1. "[COMPANY] market share 2024" OR "ranking 2025"
2. "[COMPANY] vs [Competitor] 2024" (for each major competitor)
3. "[Category] top brands India 2024"
4. "[COMPANY] competitive position 2024"
\`\`\`

### **PRIORITY 2: Competitor Intelligence (2024-2026)**

For EACH major competitor:
\`\`\`
5. "[Competitor] revenue 2024" OR "growth rate"
6. "[Competitor] funding 2024" OR "valuation"
7. "[Competitor] new products 2024" OR "launches"
8. "[Competitor] expansion 2024" (what's their growth strategy?)
9. "[Competitor] pricing 2024" (are they competing on price?)
\`\`\`

### **PRIORITY 3: Emerging Threats**

\`\`\`
10. "New nutrition brands India 2024" (startups that emerged post-2023)
11. "International protein bars India 2024" (Kind, Clif, Quest entry?)
12. "ITC competitors 2024" (could Britannia, HUL enter category?)
13. "[Category] acquisitions 2024" (who else is doing M&A?)
\`\`\`

### **PRIORITY 4: Competitive Moves**

\`\`\`
14. "[Competitor] marketing campaigns 2024"
15. "[Competitor] distribution strategy 2024"
16. "[Competitor] partnerships 2024" (celeb, gym, corporate tie-ups)
17. "[Competitor] innovation 2024" (functional ingredients, formats)
\`\`\`

---

## OUTPUT STRUCTURE (800-1,000 words, 2 pages max)

### **SECTION 1: COMPETITIVE LANDSCAPE 2026 (250 words)**

\`\`\`
## MARKET SHARE & MOMENTUM (Current State)

**Top 5 Players:**

| Rank | Brand | Est. Revenue (FY25) | Market Share | YoY Growth | Movement vs 2023 |
|------|-------|---------------------|--------------|------------|------------------|
| #1 | [Brand] | ₹[X] Cr | [Y]% | +[Z]% | ↑/↓/→ |
| #2 | [COMPANY] | ₹[X] Cr | [Y]% | +[Z]% | ↑/↓/→ |
| #3 | [Brand] | ₹[X] Cr | [Y]% | +[Z]% | ↑/↓/→ |

**Key Observations:**
- [COMPANY]'s position: [Held/Gained/Lost share] since 2023
- Fastest growing: [Competitor name] at [X]% YoY (why?)
- Biggest mover: [Competitor] jumped from #[Y] to #[X] (2023→2026)
- Consolidation: Top 3 now control [X]% share (was [Y]% in 2023)

**Competitive Intensity:**
- 2023: 5 funded players, mostly D2C-focused
- 2026: 9 funded players + 2 international entrants = Fragmentation OR consolidation?
- Price bands: [X] brands now in ₹45-55 range (commoditization signal)

**Sources:** [List sources, mark estimates]
\`\`\`

### **SECTION 2: THREAT MATRIX (300 words)**

**Analyze top 3 competitive threats:**

\`\`\`
**THREAT #1: [Competitor Name]**

**Current Position:** Rank #[X], ₹[Y] Cr revenue, growing [Z]% YoY

**What They're Doing (2024-2026):**
- Strategy: [Specific—NOT generic "they're growing"]
- Channel focus: [Where they're winning]
- Product strategy: [What SKUs/segments they prioritize]
- Pricing: [How they compete—premium/value/parity]

**Why It's Working:**
[Structural advantage or insight. Examples:]
- "Functional range (₹70-90) captured premium segment—32% of category growth but [COMPANY] absent"
- "Celebrity partnerships (Virat Kohli) drove brand awareness 3x vs [COMPANY]'s organic approach"
- "Quick Commerce focus—62% of revenue from QC vs [COMPANY]'s 5%"

**Their Vulnerabilities:**
- [Weakness 1]: [Evidence]
- [Weakness 2]: [Evidence]

**Threat Level:** HIGH / MEDIUM / LOW
- High: [If directly competing for same customer + winning]
- Medium: [If adjacency competition + growing fast]
- Low: [If different segment or slowing growth]

**Recommended Response:**

**Attack Option:** [If we should go after their position]
- What: [Specific action]
- Where: [Channel/segment to compete]
- Timeline: [When to execute]

**Defend Option:** [If they're attacking our position]
- What: [Specific defensive move]
- Where: [Our vulnerable segment to protect]
- Timeline: [Urgency]

**Ignore Option:** [If threat is overstated]
- Rationale: [Why not worth responding]

Example:
**THREAT #1: Whole Truth Foods**

**Position:** #3, ₹145 Cr (FY25), +48% YoY (vs [COMPANY]'s 35%)

**What They're Doing:**
- Launched functional premium range (₹70-90) with ashwagandha/collagen in 2024
- QC-first strategy: 60% of sales from Blinkit/Zepto
- Brand positioning: "Beyond nutrition—functional wellness"
- Celebrity: Partnered with nutritionists, micro-influencers (authenticity vs celebrity)

**Why It Works:**
- Functional segment growing 68% YoY (Euromonitor)—they're riding the wave
- QC has no returns, better margins (48% vs MT 38%)
- Premium pricing (₹75) acceptable for functional claims (willingness to pay proven)

**Their Vulnerabilities:**
- Small distribution (500 MT stores vs [COMPANY]'s 2,500)—can't leverage offline
- Functional trend may be fad (2-3 year window before next trend)
- High marketing burn (35% of revenue vs [COMPANY]'s 18%)—unprofitable

**Threat Level:** HIGH
- Reason: Directly competing for premium health-conscious customer. If they become synonymous with "functional bars" before [COMPANY] responds, position lost.

**Recommended Response:**

**Attack:**
- What: Launch [COMPANY] functional range (₹70-90) within 6 months
- Where: Quick Commerce + premium E-comm (don't compete in their MT weakness)
- Differentiation: [ACQUIRER] R&D = clinically-dosed ingredients (vs their marketing claims)
- Timeline: Q2 2026 launch, scale Q3-Q4

**Defend:**
- Protect existing ₹50 range by emphasizing [ACQUIRER] trust/quality vs startup
- Leverage 800-1,200 MT stores for visibility (they can't match offline presence)
\`\`\`

[Repeat format for Threat #2 and #3]

### **SECTION 3: COMPETITIVE POSITIONING (150 words)**

\`\`\`
## WHERE WE WIN & WHERE WE LOSE

**[COMPANY]'s Competitive Advantages (2026):**
1. Distribution: 800-1,200 MT stores (best in category)
2. [ACQUIRER] backing: Capital, manufacturing, procurement scale
3. Established brand: 6+ years, customer trust
4. [Other advantages based on data]

**[COMPANY]'s Competitive Disadvantages (2026):**
1. Brand dilution: [ACQUIRER] association weakened "startup premium" perception
2. Innovation lag: No functional range while competitors launched 2024-2025
3. QC absence: 0-5% of revenue while category average 18%
4. [Other weaknesses based on competitive analysis]

**Net Assessment:**
- Winning: [Segments/channels where [COMPANY] dominates]
- Losing: [Segments/channels where competitors ahead]
- Draw: [Segments where competitive parity]
\`\`\`

### **SECTION 4: BATTLE PLAN (300 words)**

\`\`\`
## 12-MONTH COMPETITIVE STRATEGY

**OFFENSIVE PLAYS (Going After Competitor Positions):**

**Play #1: [Name]**
**Target Competitor:** [Who we're attacking]
**Segment to Capture:** [Their stronghold we want]
**Attack Vector:** [Specific strategy]
**Timeline:** [When]
**Success Metric:** [How to measure win]

Example:
**Play #1: Premium Functional Reclaim**
**Target:** Whole Truth's functional segment
**Capture:** ₹180 Cr functional bar segment (68% YoY growth)
**Vector:** 
- Launch 3 functional SKUs (₹70-90) with clinically-dosed ingredients
- Position as "science-backed" vs their "wellness marketing"
- [ACQUIRER] R&D credibility as proof point
**Timeline:** Q2 2026 launch, ₹35 Cr revenue target by Q1 2027
**Metric:** Capture 25% of functional segment (₹45 Cr), Whole Truth growth slows to 30% YoY

**DEFENSIVE PLAYS (Protecting Our Position):**

**Play #1: [Name]**
**Our Vulnerable Position:** [Where we're at risk]
**Threat:** [Who's attacking]
**Defense Strategy:** [Specific defensive move]
**Timeline:** [Urgency]

Example:
**Play #1: MT Fortress Defense**
**Vulnerable:** 2,500 MT stores (our key advantage)
**Threat:** Whole Truth + True Elements scaling MT (will reach 1,500 stores combined by Q4 2026)
**Defense:**
- Exclusivity contracts with top 500 MT stores (premium shelf space locked)
- In-store activation (sampling, visibility) to boost velocity
- Retailer incentives (margin bonuses) for hitting targets
**Timeline:** Q1 2026 (before competitors scale)
**Metric:** Maintain >80% share of shelf space in top MT chains

**NO-GO ZONES (Where Not to Compete):**

**Zone #1: [Segment/Channel]**
**Rationale:** [Why not worth competing]

Example:
**Zone #1: Ultra-Budget (₹25-35 range)**
**Rationale:** 
- RiteBite dominates with scale (₹280 Cr revenue)
- 18-22% margins (unacceptable for premium brand)
- Customer segment doesn't value [COMPANY]'s differentiation
- Better to cede low-end, focus on profitable premium
\`\`\`

---

## CRITICAL SUCCESS CRITERIA

Your output must answer:
1. **Who are the top 3 competitive threats NOW?** (2026, not 2023)
2. **What are they doing that's working?** (Specific strategies with data)
3. **Where is [COMPANY] vulnerable?** (Honest weaknesses)
4. **What's the 12-month battle plan?** (2-3 offensive plays, 2-3 defensive plays)

**Red Flags:**
- ❌ Generic "monitor competitors" (not a strategy)
- ❌ No mention of threats that emerged 2024-2026
- ❌ No defensive thinking (only talking about our strengths)
- ✅ Specific competitor moves with evidence
- ✅ Attack/defend strategies with metrics

---

## OUTPUT CHECKLIST

- [ ] Competitive landscape 2026 (market share, momentum, intensity)
- [ ] Top 3 threats analyzed (what they're doing, why it works, vulnerabilities)
- [ ] [COMPANY]'s competitive position (advantages, disadvantages, net)
- [ ] Offensive plays (2-3 specific attacks on competitor positions)
- [ ] Defensive plays (2-3 specific defenses of our position)
- [ ] No-go zones (where NOT to compete)
- [ ] All claims backed by data or clearly marked as estimates
- [ ] 12-month timeline with success metrics

---

**Remember:** Competitive landscape changed DRAMATICALLY 2023-2026. [ACQUIRER] gave [COMPANY] distribution dominance BUT competitors evolved (functional, QC, international). Your job: map the NEW battlefield and recommend how to win in 2026-2027, not fight yesterday's war.
`,

  synergy: `# AGENT 7: SYNERGY PLAYBOOK
## POST-ACQUISITION REALITY CHECK (3 YEARS IN)

**Model:** Claude Opus 4.6 (\`claude-opus-4-6-20250514\`)

**Critical Context:** [ACQUIRER] acquired [COMPANY] in 2023. We're in 2026—**3 YEARS post-acquisition**.

---

## SYNERGIES ALREADY CAPTURED (2023-2026)

**What [ACQUIRER] Promised (2023):**
- Distribution leverage (4M outlets)
- Manufacturing optimization (original co-packer facilities)
- Procurement scale (vendor leverage)
- Brand-building muscle (marketing spend)
- Institutional credibility (ITC halo)

**What Actually Happened (2023-2026):**
- ✅ Distribution: 150 → 800-1,200 MT stores (16x growth) ✅ DELIVERED
- ✅ Manufacturing: Moved to original co-packer facilities, COGS optimization limited (no manufacturing synergy) ✅ DELIVERED
- ✅ Procurement: Vendor leverage captured, 5-8% savings ✅ DELIVERED
- ⚠️ Brand: Marketing spend up 3x BUT growth slowing (diminishing returns)
- ⚠️ GT reach: Added 5,000 stores BUT velocity low (distribution ≠ sales)

**Synergy Value Captured (Est.):**
- Cost synergies: ₹12-15 Cr annual (COGS + procurement)
- Revenue synergies: ₹80 Cr (FY24-25 incremental from distribution)
- **Total: ₹92-95 Cr value creation** in 3 years

**BUT:**
- Growth trajectory (to be discovered from dataion: 60% YoY → [search for actual data] (momentum lost)
- Margin plateau: 41% gross (target was 45%+)
- Integration friction: [COMPANY] team attrition (startup→corporate culture shock)

---

## YOUR MISSION

Based on Agents 1-6 analysis, synthesize:
1. **What synergies are NOW exhausted?** (Don't double-count)
2. **What NEXT-wave synergies exist?** (Beyond distribution/manufacturing)
3. **Institutional strengths mapping** (ITC's assets + Yogabar's digital DNA - how each leverages the other)
4. **What integration issues are blocking synergy capture?** (Culture, processes, brand dilution)
5. **How to get ANOTHER ₹50-100 Cr of synergy value in 2026-2028?**

**CRITICAL NEW FOCUS: Two-Way Institutional Leverage**

**ITC's Unique Assets (Beyond Distribution):**
- **ITC Agri Business** → Backward integration (ingredient sourcing at scale, quality control, farmer relationships)
- **[ACQUIRER] Hotels** → Premium positioning expertise, corporate B2B relationships (2,500 clients), institutional credibility
- **ITC Commodities & Exports** → International trade infrastructure, export licenses, regulatory expertise (50+ countries)
- **ITC Life Sciences R&D** → Food science capabilities, clinical validation labs, ingredient innovation
- **ITC Brand-building Muscle** → Mass media buying power, consumer insights, premium brand management (Aashirvaad, Sunfeast precedent)

**Yogabar's Digital-Native DNA (What [ACQUIRER] Lacks):**
- **Quick Commerce Mastery** → Platform relationships (Blinkit/Zepto), dark store optimization, QC-specific marketing
- **Marketplace Dynamics** → Amazon/Flipkart algorithms, review management, search optimization, seller performance
- **Influencer Strategy** → Authentic partnerships, content creation, community building, micro-influencer activation
- **D2C Playbook** → Conversion optimization, retention mechanics, subscription models, LTV maximization, performance marketing
- **Digital Agility** → Fast experimentation, A/B testing culture, data-driven decision making, startup speed

**The Synergy Opportunity:**
- **Yogabar → ITC:** Teach Quick Commerce, influencer marketing, D2C mechanics to entire [ACQUIRER] Foods portfolio (₹5,000 Cr) - Strategic value beyond revenue
- **ITC → Yogabar:** Unlock Agri Business for clean-label sourcing, Hotels for premium B2B, Exports for international, R&D for functional innovation

**This is a SYNTHESIS agent—you receive outputs from Agents 1-6. Connect the dots and map INSTITUTIONAL STRENGTHS, not just operational synergies.**

**DO NOT:**
- ❌ Repeat "leverage [ACQUIRER] distribution" (done for 3 years)
- ❌ Generic synergy advice (check any M&A playbook)
- ❌ Ignore integration challenges (pretend everything is smooth)

**DO:**
- ✅ "Agent 5 identified QC opportunity (₹45 Cr). [ACQUIRER] lacks QC presence BUT has capital for dark store partnerships. Synergy: Fund [COMPANY] to pioneer [ACQUIRER]'s QC entry = ₹45 Cr revenue + learning for [ACQUIRER] Foods portfolio"
- ✅ "Agent 3 showed brand dilution from [ACQUIRER] association. Counter-intuitive synergy: Give [COMPANY] MORE autonomy (separate brand identity) while using [ACQUIRER] backend (distribution, manufacturing)"

---

## INPUT SYNTHESIS

You will receive outputs from:
- Agent 1: Market dynamics, category shifts
- Agent 2: Portfolio gaps, SKU opportunities
- Agent 3: Brand positioning issues
- Agent 4: Margin improvement levers
- Agent 5: Growth channels (QC, B2B, international)
- Agent 6: Competitive threats

**Your job:** Connect these insights to [ACQUIRER]'s capabilities and find synergies.

---

## OUTPUT STRUCTURE (800-1,000 words, 2 pages max)

### **SECTION 1: SYNERGY SCORECARD (200 words)**

\`\`\`
## THREE YEARS LATER: SYNERGY REALITY CHECK

**Synergies Captured (2023-2026):**

| Synergy Type | Promise (2023) | Reality (2026) | Value Captured | Grade |
|--------------|----------------|----------------|----------------|-------|
| Distribution | 4M outlets | 2,500 MT + ~500 GT pilot stores | ₹80 Cr revenue | A |
| Manufacturing | original co-packer facilities | COGS optimization limited (no manufacturing synergy) | ₹8 Cr annual | A |
| Procurement | Vendor leverage | 5-8% savings | ₹4 Cr annual | B+ |
| Brand-building | [ACQUIRER] muscle | 3x spend, momentum lost | ₹15 Cr (?) | C |
| GT Reach | Premium kirana | 5K stores, low velocity | ₹8 Cr (?) | C |

**Total Value Created:** ₹92-115 Cr (3 years)

**Synergies NOT Captured (Gaps):**
- Quick Commerce ([ACQUIRER] has no QC presence)
- International export (ITC infrastructure not leveraged)
- Cross-selling to [ACQUIRER] Hotels/corporate clients (partnership unexplored)
- R&D capabilities (ITC labs underutilized for innovation)

**Integration Challenges:**
- Culture clash: [COMPANY] startup team → [ACQUIRER] corporate (attrition?)
- Brand dilution: [ACQUIRER] association hurt premium positioning
- Decision speed: [COMPANY] slower (ITC approval layers)

**Net Assessment:**
Basic operational synergies captured. Strategic synergies (brand, innovation, new channels) underexploited. Need NEXT wave.
\`\`\`

### **SECTION 2: NEXT-WAVE SYNERGIES (400 words)**

**Map INSTITUTIONAL STRENGTHS - Two-way value creation:**

**Framework: What can Yogabar leverage FROM [ACQUIRER] that it can't build alone? What can [ACQUIRER] learn FROM Yogabar for its ₹5,000 Cr Foods portfolio?**

\`\`\`
**SYNERGY #1: [ACQUIRER] Agri Business → Clean Label Sourcing (from Agent 2 Portfolio insights)**

**ITC's Asset:** 
- Agri Business division with direct farmer relationships (wheat, spices, fruits)
- Backward integration at scale (reduces middlemen, ensures quality)
- [ACQUIRER] precedent: Aashirvaad atta = farm-to-fork traceability

**Yogabar's Need (from Agent 2):** 
- Clean label positioning requires transparent sourcing
- Competitors make claims without proof ("natural ingredients")
- Premium customers willing to pay for traceable, quality ingredients

**Synergy Logic:**
- [ACQUIRER] Agri can source nuts, oats, dates directly from farmers (10-15% cost reduction + quality story)
- Yogabar gets "farm-traceable" claim (differentiation vs competitors)
- Marketing: "Sourced through ITC's farmer network - 5,000+ farmers, verified clean-label"

**Value Potential:** 
- Direct: ₹2-3 Cr annual savings (procurement) + 2-3 margin points from premium pricing
- Brand: Unique claim (no competitor can match ITC's farmer network scale)
- [ACQUIRER] Learning: Yogabar teaches "clean label premium" playbook → [ACQUIRER] can apply to Sunfeast, other brands

**What's Needed:**
- Agri Business team integration (pilot with 2-3 ingredients)
- Traceability system (farmer → facility → product)
- Marketing narrative (storytelling around sourcing)

---

**SYNERGY #2: [ACQUIRER] Hotels → Premium Corporate B2B (from Agent 5 Growth insights)**

**ITC's Asset:**
- [ACQUIRER] Hotels serves 2,500+ corporate clients (MNCs, large Indian cos)
- Relationships with HR teams, procurement, wellness program managers
- Premium brand = trust for corporate gifting, employee programs

**Yogabar's Need (from Agent 5):**
- B2B institutional channel identified as ₹25 Cr opportunity
- Cold corporate outreach is hard (6-12 month sales cycles)
- Need warm introductions to decision-makers

**Synergy Logic:**
- [ACQUIRER] Hotels' account managers cross-sell Yogabar to existing corporate clients
- Position as "employee wellness program" (nutrition bars for office pantries, WFH kits)
- Leverage [ACQUIRER] Hotels' premium association (if hotels use it, it's premium-quality signal)

**Value:** 
- Revenue: ₹25 Cr in 24 months (300 corporate accounts @ ₹8L/year)
- Margin: 46% (direct sales, no middlemen)
- [ACQUIRER] Learning: Yogabar's digital marketing tactics can help [ACQUIRER] Hotels with younger corporate clients

**What's Needed:**
- Incentive alignment ([ACQUIRER] Hotels sales team gets commission on Yogabar cross-sell)
- Bundling (hotel stay packages + wellness kits for corporate events)

---

**SYNERGY #3: [ACQUIRER] Commodities/Exports → International Expansion (from Agent 5)**

**ITC's Asset:**
- Food export infrastructure to 50+ countries (licenses, logistics, distributor network)
- Existing relationships in Middle East, Southeast Asia
- Regulatory clearances (FSSAI, export certifications)

**Yogabar's Need (from Agent 5):**
- International opportunity (ME markets, Indian diaspora = ₹25 Cr potential)
- Can't export independently (regulatory barriers, logistics complexity, no distributor network)

**Synergy Logic:**
- Yogabar piggybacks on [ACQUIRER]'s existing export infrastructure
- Target: UAE, Saudi Arabia (280k+ Indian expats, high purchasing power)
- Use ITC's distributor relationships (e.g., [ACQUIRER] already exports to Lulu, Choithrams)

**Value:**
- Revenue: ₹25 Cr in 24 months (Year 1: ₹8 Cr UAE pilot, Year 2: ₹17 Cr regional scale)
- Margin: 42% (premium pricing in international markets)
- [ACQUIRER] Learning: Yogabar teaches "premium health food export" playbook

**What's Needed:**
- Leverage ITC's Sharjah/Dubai distributor relationships
- Export under [ACQUIRER] Foods umbrella (faster regulatory approval)
- Adapt packaging for international markets (shelf-life, labeling requirements)

---

**SYNERGY #4: Yogabar → [ACQUIRER] Foods (Quick Commerce Playbook Transfer)**

**Yogabar's Asset (from Agent 5):**
- Quick Commerce expertise (platform relationships, dark store optimization)
- QC marketing playbook (what works on Blinkit/Zepto vs traditional retail)
- Category insights: QC buyers prefer singles (₹50 impulse) vs multi-packs

**ITC's Need:**
- [ACQUIRER] Foods wants QC presence (Bingo chips, Sunfeast biscuits, YiPPee noodles need QC strategy)
- ₹5,000 Cr Foods portfolio has 0-5% QC penetration (category average 18%)
- Lacks QC-specific know-how (pricing, packaging, dark store negotiation)

**Synergy Logic (REVERSE - Yogabar teaches ITC):**
- Yogabar pioneers QC for [ACQUIRER] (becomes test brand)
- Learnings transfer to entire Foods portfolio (what QC pricing works, which SKUs to push, how to negotiate with platforms)
- Strategic value to [ACQUIRER] >> Yogabar's direct revenue

**Value:**
- Yogabar direct: ₹45 Cr revenue (18 months)
- [ACQUIRER] strategic: If learnings help [ACQUIRER] Foods capture even 2% more QC share across portfolio = ₹100+ Cr impact
- Positioning: Yogabar as "ITC's innovation lab for digital channels"

**What's Needed:**
- Yogabar autonomy to experiment (not [ACQUIRER] approval layers)
- Knowledge transfer system (Yogabar team trains [ACQUIRER] Foods brand managers)
- Measure & share learnings (what worked, what didn't)

---

**SYNERGY #5: Yogabar → [ACQUIRER] Foods (Influencer Marketing Playbook)**

**Yogabar's Asset:**
- Influencer strategy (authentic partnerships, content creation, ROI tracking)
- Knows which influencers work (nutritionists, fitness creators vs celebrities)
- Digital-native measurement (cost per acquisition, engagement vs reach)

**ITC's Need:**
- [ACQUIRER] Foods relies on traditional media (TV, print)
- Younger consumers (18-35) don't watch TV, consume content on Instagram/YouTube
- [ACQUIRER] tried influencer marketing but doesn't know ROI, picks wrong influencers (celebrity vs micro)

**Synergy Logic:**
- Yogabar's influencer playbook becomes [ACQUIRER] template
- Teach: How to identify authentic influencers, negotiate rates, measure ROI, create content that converts
- [ACQUIRER] applies to Sunfeast, Bingo, YiPPee targeting younger audiences

**Value:**
- Yogabar: Retains expertise, becomes strategic asset to [ACQUIRER] (not just distribution burden)
- ITC: 20-30% better marketing efficiency = ₹50+ Cr impact across portfolio
- Cultural: Yogabar's digital team upskills ITC's marketing function

**What's Needed:**
- Yogabar team runs influencer workshops for [ACQUIRER] Foods marketers
- Co-create 2-3 campaigns (Yogabar + [ACQUIRER] brand) to demonstrate ROI
- Reverse mentorship (startup teaching corporate)
\`\`\`

Example:
**SYNERGY #1: Quick Commerce Pioneer (from Agent 5)**

**Opportunity:** QC is 18% of category, [COMPANY] at 0%. Agent 5 identified ₹45 Cr potential (18 months).

**ITC Capability:** 
- Capital: ₹8 Cr to fund QC expansion (dark store fees, marketing)
- Strategic intent: [ACQUIRER] Foods wants QC presence (Bingo, Sunfeast also need QC)
- Learning value: [COMPANY] pioneers, [ACQUIRER] learns for broader portfolio

**Synergy Logic:**
- [COMPANY] gets capital + ITC's risk appetite (can experiment)
- [ACQUIRER] gets QC playbook for entire Foods division (₹8 Cr investment = portfolio-wide learning)
- Dark stores willing to stock "ITC brand" (credibility advantage)

**Value Potential:** 
- Direct: ₹45 Cr revenue (48% margin = ₹21.6 Cr contribution)
- Indirect: [ACQUIRER] Foods learns QC, applies to ₹5,000 Cr portfolio = strategic value

**What's Needed:**
- [COMPANY] team autonomy (QC strategy, [ACQUIRER] doesn't micromanage)
- Capital approval: ₹8 Cr (Q1 2026)
- Dark store partnerships: [ACQUIRER] corporate relationships unlock doors

**SYNERGY #2: International Export Leverage (from Agent 5)**

**Opportunity:** ME market (₹25 Cr in 24 months per Agent 5)

**ITC Capability:**
- Export licenses: [ACQUIRER] has food export infrastructure (regulatory clearances)
- Logistics: [ACQUIRER] shipping contracts (lower freight costs)
- Trade relationships: [ACQUIRER] exports to 50+ countries (distributor network)

**Synergy Logic:**
[COMPANY] couldn't export independently (regulatory barriers, logistics complexity). [ACQUIRER] makes it viable.

**Value:** ₹25 Cr revenue (42% margin) + opens international for [ACQUIRER] snacks

**What's Needed:**
- Leverage ITC's Sharjah distributor (existing relationship)
- Export certification under [ACQUIRER] Foods (faster approval)

**SYNERGY #3: Functional Innovation (from Agent 2 + [ACQUIRER] R&D)**

**Opportunity:** Functional bars (₹70-90) = ₹35 Cr potential per Agent 2

**ITC Capability:**
- Life Sciences & Technology Centre (ITC R&D labs in Bangalore)
- Clinically-validated ingredients (vs competitors' marketing claims)
- Food scientists (can develop functional formulations)

**Synergy Logic:**
Competitors (Whole Truth) have functional bars but unvalidated claims. [ACQUIRER] R&D can create ACTUALLY functional formulations = differentiation.

**Value:** ₹35 Cr revenue + brand repositioning as "science-backed"

**What's Needed:**
- R&D team collaboration (6-month NPD timeline)
- Clinical trials (₹2 Cr investment for validation)

**SYNERGY #4: B2B Cross-Sell (from Agent 5 + [ACQUIRER] Hotels)**

**Opportunity:** Corporate wellness (₹25 Cr per Agent 5)

**ITC Capability:**
- [ACQUIRER] Hotels has 2,500 corporate clients (HR relationships)
- Existing B2B sales team (can add [COMPANY] to portfolio)

**Synergy Logic:**
Cold corporate outreach is hard. Warm intro from [ACQUIRER] Hotels' account managers = faster conversion.

**Value:** ₹25 Cr revenue (46% margin, direct sales)

**What's Needed:**
- Cross-sell training for [ACQUIRER] Hotels B2B team
- Incentive alignment (commission structure)
\`\`\`

### **SECTION 3: INTEGRATION OPTIMIZATION (200 words)**

\`\`\`
## FIXING WHAT'S BROKEN

**Challenge #1: Brand Dilution (from Agent 3)**

**Problem:** [ACQUIRER] association weakened [COMPANY]'s startup premium positioning

**Counter-Intuitive Synergy:**
- Give [COMPANY] brand autonomy (separate identity)
- BUT leverage [ACQUIRER] backend (distribution, manufacturing)
- "House of brands" model (like P&G, Unilever)

**Implementation:**
- Packaging: Remove/shrink [ACQUIRER] logo
- Communication: Position as "[COMPANY] - powered by ITC" NOT "ITC's [COMPANY]"
- Team: Dedicated brand team, reports to [COMPANY] CEO (not [ACQUIRER] Foods head)

**Value:** Reclaim premium positioning = pricing power (+₹5 per bar = 10% margin impact)

**Challenge #2: Decision Speed (Culture Clash)**

**Problem:** [COMPANY] slower post-acquisition (ITC approval layers)

**Fix:**
- Defined autonomy boundaries: <₹5 Cr decisions = [COMPANY] CEO authority
- Board seat for [COMPANY] founder (skin in game, accountability)
- Separate P&L (entrepreneurial ownership vs division mindset)

**Value:** Innovation speed = faster to market with new SKUs (12 months → 6 months NPD cycle)

**Challenge #3: Talent Retention**

**Problem:** Startup team attrition (corporate culture shock)

**Fix:**
- Retention equity: 3-year vesting for key team (25% vested)
- Startup perks: Flexible WFH, flat hierarchy, fast decision-making
- Career paths: Rotate [COMPANY] talent into [ACQUIRER] Foods leadership (2-way street)

**Value:** Retain institutional knowledge, avoid rebuild costs
\`\`\`

### **SECTION 4: SYNERGY ROADMAP 2026-2028 (200 words)**

\`\`\`
## 24-MONTH SYNERGY CAPTURE PLAN

**Phase 1 (Q1-Q2 2026): Quick Wins**
- Quick Commerce setup (₹8 Cr investment, 8-month payback)
- B2B cross-sell activation (₹2 Cr, 12-month payback)
- Brand autonomy reset (organizational change, no cost)
**Value:** ₹30 Cr revenue, +2 margin points

**Phase 2 (Q3 2026-Q2 2027): Strategic Builds**
- Functional range R&D (₹2 Cr, 14-month payback)
- International export (₹3 Cr, 18-month payback)
- Channel mix optimization (shift MT→QC)
**Value:** ₹50 Cr revenue, +1.5 margin points

**Phase 3 (Q3 2027-Q1 2028): Scale**
- QC expansion to 50 cities
- International to 5 ME countries
- Functional range scale
**Value:** ₹80 Cr revenue, EBITDA positive

**Total Incremental Synergy Value (24M):**
- Revenue: ₹160 Cr (on top of ₹80 Cr already captured)
- Margin: +3.5 points
- Total value created: ₹240 Cr (original ₹95 Cr + ₹160 Cr new)

**Investment Required:** ₹23 Cr
**Blended Payback:** 11 months
\`\`\`

---

## CRITICAL SUCCESS CRITERIA

Your output must:
1. **Synthesize insights from Agents 1-6** (connect dots, not repeat)
2. **Assess what synergies are exhausted** vs **what's untapped**
3. **Identify 4 NEXT-wave synergies** (specific, valued, with [ACQUIRER] capability match)
4. **Address integration challenges** honestly (culture, brand, speed)
5. **Provide 24-month roadmap** with investment and value

**Red Flags:**
- ❌ Repeating Agent 1-6 content (synthesis, not summary)
- ❌ Generic M&A synergy advice (could apply to any deal)
- ❌ Ignoring that 3 years have passed (what's NEXT, not repeat)
- ✅ Novel connections (QC = [ACQUIRER] portfolio learning)
- ✅ Counter-intuitive insights (brand autonomy = better synergy)

---

**Remember:** You're the SYNTHESIS agent. Agents 1-6 gave pieces. You assemble the puzzle and show HOW [ACQUIRER] should evolve the relationship 2026-2028 to capture the NEXT ₹100 Cr of value beyond basic operational synergies.
`,

  synopsis: `# EXECUTIVE SYNOPSIS

You are the senior partner who has read every page of this report. You write two pages for Hemant and the [ACQUIRER] leadership team. You give the aggregated synthesis first — your conclusions, your narrative, your reading of the situation — and only after that do you attribute where each insight came from. The reader should understand the full strategic picture before they see the source attribution.

**Tone:** [ACQUIRER] is playing offense. Yogabar is growing. Frame everything as acceleration and opportunity. Never write: "exhausted," "saturated," "broken," "collapsed," "risk," "concern," "weakness," "challenge," "problem," or any language implying difficulty. There are no negatives of the [ACQUIRER] acquisition — only untapped advantages. Every finding is an opportunity, every gap is a space to move into.

**Numbers:** Every number from agent outputs. Cite the agent as source. If unavailable, write "not confirmed through available data." Do not invent.

**Writing style:** Dense prose. No bullet points. No numbered lists. Paragraphs only — each making one argument, developing it with evidence, landing on an implication. The narrative should flow: each sentence doing work, each paragraph connecting to the next.

---

## PART 1: THE SYNTHESIS — WRITE THIS FIRST

**THE SITUATION (one paragraph, 100 words maximum)**

Where Yogabar stands today — growth trajectory, channel mix, competitive position — using numbers the agents found. Then the single most important thing the next phase requires. Read like a Financial Times analysis opener: confident, specific, no wasted words.

---

**THE RECOMMENDATION**

One clear strategic direction for 2026–2028. One direction, stated as a narrative paragraph — not a list, not a framework, not "Yogabar should explore multiple avenues."

THE RECOMMENDATION:
[One paragraph. What [ACQUIRER] will do, which direction Yogabar grows, what the outcome looks like in 24 months. No investment figures. No timelines as constraints. [ACQUIRER] has no capital constraints — do not frame the strategy around cost.]

---

**THE STRATEGIC NARRATIVE (four to five connected paragraphs)**

This is the heart of the synopsis. Do not list findings. Tell the story of what the agents collectively found and what it means — written as connected paragraphs where each flows into the next.

Paragraph 1 — The market and competitive situation: Connect Agent 1's category findings with Agent 6's competitive mapping. What does the market trajectory mean for how long the competitive window stays open?

Paragraph 2 — The portfolio and brand story: Connect Agents 2 and 3. Don't summarise them separately — find the connection. What does the SKU analysis reveal that the brand analysis confirms, or vice versa?

Paragraph 3 — The growth and margin story: Connect Agents 4 and 5. These are not separate topics. Which growth moves improve margin and which ones compress it?

Paragraph 4 — The [ACQUIRER] advantage: What Agent 7 found that no external buyer could have offered. Name the specific asset. What does Yogabar get from [ACQUIRER] that it could not have built independently?

Paragraph 5 (if warranted) — The international lens: What Agent 10's most relevant global analog reveals about where Yogabar is in its trajectory, and what it means for decisions [ACQUIRER] needs to make now.

---

**SIX INSIGHTS (after the narrative)**

Six findings the leadership team would not arrive at without this report. Each insight is a ◉-tagged block — four to five sentences in prose: finding → why non-obvious → which agents' data supports it → what [ACQUIRER] should do.

◉ [INSIGHT TITLE IN CAPS]
[Four to five sentences of dense prose. No sub-bullets within an insight.]

Cover: the category opportunity, portfolio concentration, the margin lever, the competitive window, the [ACQUIRER] institutional advantage, the international precedent. Do not include Agent 9's platform thesis here — it stands alone as a separate section.

---

## PART 2: THE ATTRIBUTION AND ACTION PLAN — WRITE THIS SECOND

**WHERE EACH INSIGHT COMES FROM**

After the full synthesis, write one paragraph explicitly crediting the agents. Example structure: "The market sizing and competitive window draw from Agent 1's category analysis and Agent 6's competitive mapping. The portfolio and brand conclusions synthesise Agents 2 and 3. The margin lever comes from Agent 4's unit economics analysis, validated against Agent 5's channel findings. The [ACQUIRER] institutional advantage is from Agent 7, with international confirmation from Agent 10." Use your own words, but make clear where each major conclusion originated.

---

**CRITICAL SUCCESS FACTORS**

Four things [ACQUIRER] will do to deliver this strategy. Written as actions in prose — not a bulleted list, not numbered standalone lines. "The first priority is [action], confirmed by [metric] at Month 6. The second..."

Do not include founder retention. Focus on strategy execution and capability deployment.

---

`
};

PROMPTS.platform = `# AGENT 9: PLATFORM EXPANSION & D2C BRAND INCUBATOR

You are a senior strategy analyst. [ACQUIRER] is a ₹75,000 Cr conglomerate with no capital constraints. The question is not whether [ACQUIRER] can afford this. The question is whether [COMPANY]'s D2C brand-building capability is a platform [ACQUIRER] should activate to build new premium brands in categories where its legacy portfolio cannot compete.

**The central question:** Should [ACQUIRER] use [COMPANY] not just as a nutrition bar company but as a D2C brand-building studio — incubating new premium brands in categories where ITC's offline heritage is a liability?

**Tone:** This is a growth proposal for a company playing offense. Frame it as the highest-value deployment of the D2C capability [ACQUIRER] has acquired — not as a risky experiment. Be direct, be confident, show the logic.

**Writing style:** Dense prose. No bullet points. No numbered lists. Tables only for category comparison and investment breakdown.

**Your inputs:** Outputs from Agents 1–7. Build on what they found. Do not repeat it.

---

## STEP 1: SEARCH BEFORE WRITING

- Unilever Dollar Shave Club acquisition strategy outcome 2024
- P&G Native deodorant acquisition integration results
- Marico Beardo D2C brand building India 2023 2024
- HUL D2C brand incubator India strategy
- functional wellness India market size 2024 2025
- Oziva Wellbeing Nutrition revenue funding 2024
- India D2C brand valuation multiples 2024
- [ACQUIRER] Life Sciences Technology Centre R&D capabilities
- premium snacking India market size D2C brands 2024

---

## STEP 2: THE D2C STUDIO CONCEPT

[COMPANY] has something ITC's Foods division does not have: the lived experience of building a D2C brand from zero — QC relationships, influencer authenticity, subscription mechanics, packaging iteration speed. This is a capability that cannot be trained into an existing team; it has to be acquired.

Test this thesis against what you find in search: what do global FMCG acquirers actually do with D2C capabilities post-acquisition? Do they integrate, or do they run them as platforms? What does the Marico/Beardo precedent show? What does the HUL D2C experience show? State what the evidence shows — if it is mixed, say so and explain why the ITC-[COMPANY] case is specifically different.

---

## STEP 3: CATEGORY SELECTION — EVIDENCE FIRST

For each category, search before recommending. All five criteria must be met: D2C brands demonstrably winning on economics (gross margin >45%, proven repeat purchase), [ACQUIRER] has a specific named activatable asset, [ACQUIRER]'s existing brands cannot credibly compete in this space, TAM large enough to build ₹100–150 Cr brand within 3 years, consumer premiumisation trend demonstrated with data.

Evaluate Functional Wellness, Premium Snacking, and Functional Beverages. For each: state market size found through search (with source or estimation method), name the specific [ACQUIRER] advantage, give a Go/No-Go verdict with one-sentence reason grounded in evidence.

---

## STEP 4: THE D2C BUSINESS UNIT MODEL

The recommendation is not "launch a new brand." It is: create a D2C Business Unit within ITC, with [COMPANY]'s team as the founding studio, operating with the speed and autonomy of a startup while drawing on ITC's ingredient sourcing, R&D validation, and distribution infrastructure when ready.

New brands are independent identities with separate P&Ls — not sub-brands of [COMPANY] or ITC. No conflict with [ACQUIRER]'s existing Foods portfolio — these are categories [ACQUIRER] is not in. The critical governance question: what level of autonomy must this unit have to move at D2C speed? Use the Marico/Beardo or HUL/Indulekha precedent if found.

---

## STEP 5: THE INVESTMENT CASE

Build from components found through search — NPD and formulation cost, initial inventory buffer, paid acquisition budget (search: D2C brand CAC India 2024), brand identity and packaging, platform infrastructure incremental cost. Show each line with basis.

For Brand #1 revenue projection: benchmark to a comparable Indian D2C brand trajectory found through search (Oziva, Wellbeing Nutrition, or equivalent). Adjust for [COMPANY]'s advantages (ITC capital, no funding constraint) and disadvantages (not founder-driven, corporate decision cycles). Show the calculation.

---

## OUTPUT

Three sections — one dense page:

Section 1: The strategic case — why [COMPANY] specifically is the platform, grounded in precedents found and ITC's activatable assets from Agent 7.

Section 2: Category sequence and investment case — recommended categories with evidence, revenue projections benchmarked, investment built bottom-up, valuation using India multiples found through search. You MUST present candidate category scoring as an HTML table. Output it EXACTLY like this, replacing values:

<table>
<thead><tr><th>Category</th><th>Strategic Fit (1-5)</th><th>Market Readiness (1-5)</th><th>ITC Leverage (1-5)</th><th>Revenue Potential</th><th>Priority</th></tr></thead>
<tbody>
<tr><td>Example Category</td><td>4</td><td>3</td><td>5</td><td>80–120</td><td>1</td></tr>
</tbody>
</table>

Do not describe the table in prose — output the raw HTML table.

Section 3: The governance model — D2C Business Unit structure, autonomy required, how it draws on [ACQUIRER] infrastructure, how it avoids cannibalising [ACQUIRER] brands. Close with: the specific condition under which this creates exceptional value, and the condition under which it does not.`;

PROMPTS.intl = `# AGENT 10: INTERNATIONAL BENCHMARKS & GLOBAL PLAYBOOK

You are a global strategy analyst. Find the two or three brands internationally that most closely mirror [COMPANY]'s current situation — a premium nutrition brand navigating the transition from D2C insurgency to omnichannel scale through Modern Trade and Quick Commerce. Extract lessons [ACQUIRER] can act on.

**Context:** [ACQUIRER] acquired [COMPANY] in 2023. [COMPANY] grew >60% YoY on D2C, beginning MT expansion. It is 2026.

**Writing style:** Dense prose. The brand stories are business journalism — not case study templates. The lessons are dense analytical paragraphs. No bullet points within stories or lessons.

---

## STEP 1: QUALIFY EVERY CANDIDATE — SCORE AGAINST 6 CRITERIA

Score each candidate (1 point each): D2C-native origin, MT or QC transition documented, FMCG acquisition, premium positioning maintained post-acquisition, revenue equivalent to ₹100–500 Cr at transition, lessons transferable to India 2026.

Search: RXBAR Kellogg post-acquisition 2022 2023 2024, Grenade bar UK Modern Trade revenue 2023 2024, Barebells Sweden MT expansion 2023 2024, Fulfil nutrition Ireland UK Modern Trade, Huel D2C to retail 2023 2024, Kind bar Mars acquisition, GCC health food premium MT 2024.

Publish scoring table: Brand | Score | Criteria Met | Region | Selected Y/N. Select 2–3 brands scoring 4+, with non-overlapping lessons.

---

## STEP 2: ONE NARRATIVE PER BRAND

Business journalism — not a template. Each story weaves together: how they built D2C, what happened when they entered MT or QC (including what went wrong first and how they corrected), the acquisition dynamics (multiple, what changed, what didn't), growth numbers with source, current state and the one decision that most determined the outcome. Write it as one continuous narrative without sub-headers. A story with no friction is not useful.

---

## STEP 3: FIVE TRANSFERABLE LESSONS

Each lesson is a dense analytical paragraph containing: what the analog brand actually did (sourced), why it worked — the specific causal logic, the [COMPANY]-specific equivalent action in 2026, the one assumption required for transferability, and how [COMPANY] would know at Month 6 whether the lesson is working.

Five non-overlapping dimensions: pricing architecture at MT entry, SKU rationalisation for retail, brand identity through acquisition, QC-native product formats, D2C retention while scaling offline.

---

## STEP 4: WHAT [ACQUIRER] SHOULD DO DIFFERENTLY

Two paragraphs. First: where international evidence validates ITC's current direction — name the specific plan element and the analog that supports it. Second: where evidence flags something [ACQUIRER] has not yet addressed or a move it should make — direct, named, specific. If the evidence entirely validates the current plan, say so.

---

## STEP 5: SYNOPSIS HOOK — WRITE THIS LAST

◉ INTERNATIONAL BENCHMARKS HOOK
[Sentence 1: Most surprising finding — name the brand and the specific non-obvious insight]
[Sentence 2: Most transferable lesson — stated as a specific action [COMPANY] should take now]
[Sentence 3: The one thing evidence says [ACQUIRER] is at risk of getting wrong]
[Sentence 4: Why the India strategy looks different after reading this section]

---

## FORMAT
Output the Step 1 scoring as an HTML table (see template in Step 1 above). Prose narrative per brand — no sub-headers within stories. Dense lesson paragraphs. Output the summary comparison as an HTML table EXACTLY like this:
<table>
<thead><tr><th>Brand</th><th>Market</th><th>Revenue at Transition</th><th>Acquirer</th><th>Primary Lesson</th><th>ITC Equivalent Action</th></tr></thead>
<tbody>
<tr><td>Brand Name</td><td>US</td><td>₹840 Cr</td><td>Nestlé</td><td>Kept D2C premium while entering MT</td><td>Maintain yogabar.co as hero channel</td></tr>
</tbody>
</table>

Every data point cited with source and date. All revenue figures in ₹ Cr.

COMPLETION IS MANDATORY: You must complete all 5 Steps plus the summary table. If running long, compress Step 3 lessons — but never stop before Step 5 and the summary table. A truncated response is a failed response.`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MOCK = {
  market: `## MARKET POSITION & CATEGORY DYNAMICS

**HOME MARKET:** India  
**CATEGORY:** Nutrition Bars (Protein/Energy Bars)  
**STAGE:** Growth Stage (D2C scaling → Omnichannel expansion)

## MARKET SIZE & SHARE

**Category TAM:** ₹950 Cr (FY24), growing at 28% CAGR  
**YoY Growth:** Category up 31% (FY23 to FY24)  
**Yogabar Position:** Estimated ₹125 Cr revenue (FY24), ~13% market share, Rank #3  
**#1 Player:** RiteBite (~18% share, ₹170 Cr)  
**#2 Player:** Whole Truth (~15% share, ₹140 Cr)  
**#3 Player:** Yogabar (~13% share, ₹125 Cr)

**Key Sub-segment:** Premium bars (₹45-65 price point) = ₹420 Cr, growing 42% YoY. This is where Yogabar competes.

## COMPETITIVE LANDSCAPE INSIGHTS

**Seven funded players entered in last 18 months** → Category validation by institutional capital BUT low barriers suggest commoditization risk ahead.

**Fragment pattern:** No player >18% share indicates open competitive landscape. Window for category leadership: 12-18 months before customer preferences solidify.

**Distribution determines winners:** Correlation analysis shows revenue scales 1:1 with MT store count. Yogabar's 150 MT stores vs Whole Truth's 500 target = growth constraint.

## STRATEGIC INSIGHT: ITC TIMING ADVANTAGE

**Market timing signal:** Category at inflection point—D2C saturation evident (Whole Truth Amazon review velocity -38% YoY) forcing offline expansion.

**ITC's 4M outlet reach unlocks ₹270 Cr path:**  
- Current: 150 MT stores = ₹125 Cr  
- ITC-enabled: 500 MT + 2,000 GT = ₹270 Cr (18 months vs 48 months independently)

**Competitive moat window:** First to 2,500 stores likely captures 20-25% category share (anchor brand status). Current trajectory puts Yogabar 24-36 months behind Whole Truth. ITC compresses this to 12 months.`,

  portfolio: `## PORTFOLIO STRATEGY & SKU RATIONALIZATION

**Current Portfolio:** 12 SKUs across 3 price tiers  
**Revenue Concentration:** Top 3 SKUs = 67% of revenue (hero SKU problem)  
**Channel-SKU Mismatch:** E-comm optimized (multi-packs) vs MT needs (singles)

## SKU-LEVEL ECONOMICS

**Stars (Invest):**  
- Peanut Butter Protein Bar (₹50): 42% of revenue, 38% gross margin, Amazon #1 rank  
- Chocolate Brownie (₹50): 25% of revenue, 35% margin, growing 78% YoY

**Cash Cows (Maintain):**  
- Vanilla Almond (₹50): 15% of revenue, 34% margin, stable D2C repeat

**Question Marks (Test):**  
- Premium Superfood range (₹65): 8% of revenue, 41% margin, MT potential unclear

**Dogs (Kill):**  
- Value bars (₹35): 10% of revenue, 22% margin, unprofitable vs competition

## COMPETITIVE PORTFOLIO BENCHMARKING

**Whole Truth:** Focused (8 SKUs), 70% from top 3 → Clean portfolio discipline  
**True Elements:** Sprawling (25 SKUs), diluted brand → Cautionary tale  
**RiteBite:** Tiered (budget/mid/premium) → Market coverage but complex

**Yogabar positioning:** Currently "focused premium" but missing mass-accessible tier for MT expansion.

## RECOMMENDATIONS

**KILL (3 SKUs):** Value bars ₹35 range → Free ₹2.8 Cr inventory, eliminate 22% margin drag  

**INVEST (2 SKUs):** Top 2 stars → ₹8 Cr incremental marketing = ₹25 Cr revenue potential  

**LAUNCH (2 SKUs):** MT-optimized singles (₹40-45) → Bridge premium-accessible gap, target ₹15 Cr Year 1

**ROI:** Portfolio rationalization = 3.2 margin points + ₹40 Cr growth headroom`,

  brand: `## BRAND POSITIONING & STORYTELLING

**Current Stated Positioning:** "Premium nutrition bars with clean, real ingredients for health-conscious millennials"

**Actual Customer Perception (from 200+ reviews):**  
- Top phrase: "Tastes like real food" (87 mentions)  
- Not mentioned: "Clean ingredients" (12 mentions)  
- Gap: Functional benefit (post-workout) mentioned 3x more than lifestyle positioning

## POSITIONING MAP (2×2)

**Axes:** Functional ↔ Emotional × Premium ↔ Accessible

**Competitors:**  
- Whole Truth: Emotional × Premium (authenticity premium)  
- RiteBite: Functional × Accessible (gym recovery)  
- True Elements: Emotional × Accessible (everyday wellness)  
- **Yogabar:** Currently Emotional × Premium BUT customer language suggests Functional × Premium opportunity

## CUSTOMER JOBS-TO-BE-DONE

**Primary job:** "Get 20g protein after workout without cooking" (62% of use cases)  
**Secondary job:** "Healthy snack when traveling" (28%)  
**Tertiary:** "Meal replacement when busy" (10%)

**Brand claim mismatch:** Positioning emphasizes lifestyle but customers hire for performance.

## POSITIONING RECOMMENDATION

**Sharpen to:** "The post-workout protein bar that tastes like real food"

**Why:** Aligns with actual usage (gym/fitness), differentiates on taste (vs chalky competitors), maintains premium (performance = premium), enables MT expansion (gyms, sports nutrition retailers).

**Avoid:** Mainstream wellness positioning (True Elements owns this, lower margins)`,

  margins: `## MARGIN IMPROVEMENT & UNIT ECONOMICS

**Current Gross Margin:** 32% (FY24 estimated)  
**Category Benchmark:** Premium D2C 38-42%, Mid-tier 30-34%, Mass 25-28%  
**Gap to Premium Benchmark:** -6 to -10 percentage points

## MARGIN PRESSURE ANALYSIS

**By Channel:**  
- D2C: 54-60% contribution margin (strong)  
- E-comm: 28-40% (Amazon fees + competition)  
- MT: 40-48% (trade terms + sampling)

**Input Cost Inflation:**  
- Nuts/protein: +18% (FY23-FY24)  
- Packaging: +12%  
- Logistics: +15%

**Current COGS Breakdown (estimated):**  
- Ingredients: 42% of revenue  
- Co-packer manufacturing: 18%  
- Packaging: 12%  
- Total COGS: 68% → 32% gross margin

## 5 MARGIN IMPROVEMENT INITIATIVES

**1. ITC Manufacturing Consolidation:** +4.8 pts  
- Reduce co-packer cost from ₹3 to ₹2.30 per bar = ₹0.70 savings  
- On 10M bars = ₹7 Cr annual benefit  
- Payback: <12 months

**2. ITC Procurement Scale:** +2.2 pts  
- 8-10% reduction on ingredient basket via ITC vendor relationships  
- ₹25 Cr ingredient spend × 9% = ₹2.25 Cr savings

**3. Channel Mix Optimization:** +2.5 pts  
- Shift 15% of E-comm volume to D2C (higher margin)  
- Shift 20% to MT (better than Amazon, worse than D2C)  
- Net: +2.5 pts blended margin

**4. SKU Rationalization:** +2.0 pts  
- Kill 22% margin products  
- Portfolio avg lifts from 32% to 34%

**5. Promotional Discipline:** +1.2 pts  
- Reduce trade spend from 12% to 9% of MT revenue  
- Maintain pricing discipline (no deep discounting)

**TOTAL REALISTIC SCENARIO:** +9.3 pts → 32% to 41% gross margin in 24 months  
**Path to Break-even:** FY26 at ₹270 Cr revenue with 37-41% margin = EBITDA positive`,

  growth: `## GROWTH STRATEGY & CHANNEL ORCHESTRATION

**Current Revenue Mix (FY24):**  
- D2C: 45% (₹56 Cr)  
- E-comm: 35% (₹44 Cr)  
- MT: 15% (₹19 Cr)  
- QC: 5% (₹6 Cr)

**Growth Rate by Channel:**  
- D2C: +18% (decelerating, hitting ceiling)  
- E-comm: +22% (competitive, mature)  
- MT: +68% (early stage, accelerating)  
- QC: +95% (fastest, small base)

## CHANNEL-SPECIFIC STRATEGIES

**MT EXPANSION (Highest Opportunity):** ⭐  
**Target:** 500 stores (from 150) = ₹30 Cr incremental  
**ITC Advantage:** Opens stores in 12 months vs 36 independently  
**Economics:** ₹6 lakh/store/year, 40-48% margin  
**Risk:** Velocity <80 bars/month = retailer delisting  
**Mitigation:** 100-store pilot first, scale only if >80/month validated

**GENERAL TRADE (ITC Distribution Asset):**  
**Target:** 2,000 premium kirana via ITC distributors = ₹43 Cr incremental  
**Advantage:** Zero field sales cost (ITC team handles)  
**Strategy:** 3-4 hero SKUs only, avoid complexity

**QUICK COMMERCE (Fast Growth):**  
**Target:** 25-30 cities on Blinkit/Zepto = 3x current = ₹12 Cr incremental  
**Strategy:** Lead with single bars (₹50-60), impulse purchase optimization

**D2C (Retention Focus):**  
**Target:** 30% growth via LTV expansion  
**Strategy:** Subscription (10% of revenue), conversion optimization (3.5% CVR target)

## 24-MONTH ROADMAP

**FY25:** ₹180 Cr (44% growth)  
- MT: 300 stores by Q2, 500 by Q4  
- GT: 200 pilot stores Q3, 1,000 by Q4  
- Investment: ₹26 Cr

**FY26:** ₹270 Cr (50% growth)  
- MT: Optimize 500, GT scale to 2,000  
- Break-even achieved  
- Investment: ₹25 Cr

**Total Synergy Value:** ₹145 Cr incremental revenue via ITC distribution vs independent path`,

  competitive: `## COMPETITIVE BATTLE PLAN

**Tier 1 Threats (Direct Combat):**  
- **Whole Truth:** Same premium positioning, ₹60 price, 70% D2C, expanding MT (500 store target)  
- **True Elements:** Mid-premium, ₹40-45 price, omnichannel (50% MT already)

**Tier 2 Threats (Adjacency):**  
- **RiteBite:** Mass market leader moving up (₹25 → ₹35 new range)  
- **Kellogg's/ITC:** Incumbents could enter premium segment

## HEAD-TO-HEAD: YOGABAR VS WHOLE TRUTH

**Our Advantages:**  
- Price: ₹50 vs ₹60 (17% cheaper, appeals to 70% of premium buyers)  
- Distribution: ITC enables 3x store reach in 18 months  
- Manufacturing: ITC scale = better economics

**Their Advantages:**  
- Brand heat: 2x Instagram followers, stronger community  
- D2C margins: 60% vs our 54-56%  
- First-mover: 18-month MT head start

**Attack Vector:** "90% of the quality, 83% of the price, 3x the availability"  
Target their price-sensitive customers who value accessibility over ultra-premium positioning.

**Counter-move Expected:** They'll defend premium with community/content, accelerate MT to close distribution gap, or launch ₹45 accessible line.

**Our Response:** Pre-empt with exclusive MT shelf commitments (ITC relationships), maintain ₹50 sweet spot, don't engage in price war.

## HEAD-TO-HEAD: YOGABAR VS TRUE ELEMENTS

**Where We Compete:** Protein bars (₹50 vs ₹45)

**Our Advantage:** Category focus (specialist beats generalist narrative)

**Their Advantage:** Established omnichannel (50% MT, 30% E-comm, 20% GT)

**Strategy:** Peaceful coexistence—we own protein bars premium, they own breakfast category. Only escalate if they refocus on bars.

## WIN CONDITIONS (24 Months)

**Market Share:** Top 3 by revenue (₹270 Cr = 15-18% estimated share) ✓  
**Distribution Moat:** 2,500 stores (vs competitors <1,000) ✓  
**Profitability:** Break-even FY26 ✓  
**Brand Awareness:** Top 3 aided awareness in premium nutrition ✓`,

  synergy: `## SYNERGY PLAYBOOK

**Strategic Frame:** ITC's institutional strengths (distribution, manufacturing, procurement) unlock growth acceleration that Yogabar cannot achieve independently—while preserving the digital-native capabilities that justify the acquisition premium.

## SYNERGY MAPPING (4 Dimensions)

**1. DISTRIBUTION REACH**  
**ITC Strength:** 4M+ outlets, 1,170 dealer partners, relationships with all MT chains  
**Yogabar Need:** Currently 150 MT stores, 70% D2C/E-comm dependent (ceiling hit)  

**Synergy Value:**  
- Direct: ₹30-40 Cr (500 MT stores in 12 months vs 36 independently)  
- Cost Avoided: ₹4-5 Cr (eliminate field sales team hiring)  
- Competitive: 18-month head start vs competitors = category anchor position

**2. MANUFACTURING & PROCUREMENT**  
**ITC Strength:** Existing food plants, procurement scale, quality systems  
**Yogabar Need:** Co-packer costs ₹2.50-3 per bar, quality variance, 8-10% ingredient premium  

**Synergy Value:**  
- Manufacturing: ₹6 Cr annual (₹0.60 savings × 10M bars)  
- Procurement: ₹2 Cr annual (8% reduction on ₹25 Cr spend)  
- Margin Impact: +4.8 percentage points

**3. BRAND-BUILDING CAPABILITIES**  
**ITC Strength:** Mass media buying power, consumer insights, marketing ROI discipline  
**Yogabar Need:** CAC rising ₹800 → ₹1,200, limited Tier-2 awareness  

**Synergy Value:**  
- Media Efficiency: 20-30% better CPMs = ₹3-4 Cr equivalent reach  
- CAC Reduction: ₹1,200 → ₹900 = ₹300 savings per customer

**Trade-off Risk:** Mass positioning could dilute premium brand  
**Mitigation:** Dual-track (maintain D2C digital + selective mass reach)

**4. TALENT & SYSTEMS**  
**ITC Strength:** FMCG operations expertise, structured processes  
**Yogabar Need:** Operational maturity for scale (startup → growth stage)  

**Synergy Value:** Avoid costly mistakes (5-10% revenue risk from out-of-stocks, quality issues)

## INTEGRATION MODEL: HYBRID (RECOMMENDED)

**Fully Integrated:**  
- Distribution (MT + GT via ITC network) ✓  
- Manufacturing (in ITC plants) ✓  
- Procurement (through ITC vendors) ✓  
- Back-office (finance, HR, legal) ✓

**Remains Independent:**  
- Brand management (separate team, own identity) ✓  
- Product development (maintain innovation velocity) ✓  
- D2C platform (keep digital capabilities) ✓  
- Digital marketing (preserve performance marketing expertise) ✓

**Synergy Capture:** 70-80% of maximum (₹37-46 Cr annual)  
**Value Preservation:** 70-80% of startup strengths (brand, agility, digital)

## 3-YEAR ROADMAP

**FY25:** Foundation (₹11-13 Cr synergies)  
- Procurement: ₹1.8 Cr (immediate)  
- Manufacturing: ₹1.5 Cr (pilot phase)  
- Distribution: ₹8-10 Cr (first 200 stores)

**FY26:** Scale (₹36-40 Cr synergies)  
- Full manufacturing transfer  
- 500 MT + 1,500 GT stores  
- Break-even achieved

**FY27:** Optimization (₹57-67 Cr synergies)  
- 2,500+ stores, Tier-2 expansion  
- 5-8% EBITDA margin

**CRITICAL SUCCESS FACTOR:** MT velocity must achieve 80-120 bars/store/month. Pilot 100 stores first, scale only if validated.`,

  platform: `## PLATFORM EXPANSION & D2C BRAND INCUBATOR

Yogabar has built something ITC's Foods division cannot replicate through training: the lived capability of building a D2C brand from zero. The question is whether ITC activates this as a studio to incubate additional premium brands in categories where its legacy portfolio is a liability.

Global precedents are instructive. Marico acquired Beardo and ran it with near-complete operational autonomy, using Marico's supply chain only when Beardo's volume justified it. The brand remained independent and grew from ₹20 Cr to ₹200 Cr in five years without the "Marico" name appearing anywhere on the product. Unilever did the opposite with Dollar Shave Club — integrated it into the Unilever system — and DSC's growth plateaued within two years of acquisition as the founder energy dissipated into corporate process.

The category recommendation is Functional Wellness — collagen, adaptogens, immunity — where ITC's Life Sciences and Technology Centre provides clinical validation capability that no D2C startup can access independently, where ITC's existing Foods brands have no presence, and where the TAM is estimated at ₹800 Cr growing at 35% annually. Premium Snacking is a conditional second — the Bingo adjacency creates distribution channel conflict risk. Functional Beverages should be deferred due to cold chain complexity.

The structure proposed is a D2C Business Unit within ITC — not a sub-brand, not a division of Yogabar's operations, but a separate entity with its own P&L, its own team (seeded from Yogabar's brand-building talent), and a defined level of autonomy that allows 48-hour spend decisions and direct founder-equivalent authority. ITC contributes R&D access, ingredient sourcing through the Agri Business Division, and manufacturing scale when volume justifies a plant move. The new brand launches with a separate identity that carries no Yogabar or ITC branding.

The condition for activation: Yogabar reaches ₹500 Cr revenue in FY27, demonstrating that the core business is healthy and the team has bandwidth. Brand 1 must be in market within 18 months of activation decision, with a ₹30 Cr run-rate as the go/no-go signal for Brand 2.`,
  intl: `## INTERNATIONAL BENCHMARKS & GLOBAL PLAYBOOK

Three brands qualify against the six scoring criteria, each offering a different lesson. Grenade UK scores 5/6 and is the most directly relevant: founded in 2010 as a gym-channel D2C brand, Grenade built £50M in revenue before Mondelez acquired it in 2021. The critical moment came when Tesco demanded shelf pricing below Grenade's threshold to protect their private label margin. Grenade refused, accepted a 40% reduction in Tesco shelf space, and rebuilt distribution through Sainsbury's and Boots at full price over 18 months. The brand is now at £75M and growing at 8% — slower than its 40%+ D2C peak, but with margin intact. The lesson is not that MT is dangerous; it is that the first MT buyer conversation is the most important one, and the outcome of that conversation is set by whether the brand has alternatives.

Barebells Sweden scores 5/6 and offers the QC lesson. Before approaching any MT buyer, Barebells built three months of Gorillas and Glovo Quick Commerce data showing repeat purchase rates and basket attachment. That data became the buyer pitch: Barebells did not ask MT buyers to take a risk on an unknown brand, they showed documented consumer demand at full price in the channel adjacent to MT. Orkla acquired Barebells in 2022 with manufacturing support but no brand direction. The brand is now at €80M growing at 25%. The QC data strategy is directly replicable: Blinkit and Zepto provide exportable analytics to brand partners, and that data is [COMPANY]'s strongest MT entry argument.

RXBAR scores 4/6 and provides the acquisition integration cautionary note. Kellogg acquired RXBAR in 2017 for $600M — 4.6x revenue. The founders were contractually retained for three years with brand autonomy. Revenue grew 40% in years one and two. In year three, Kellogg integrated the marketing function into its corporate structure. Growth plateaued. The RXBAR lesson for ITC is specific: the governance document matters more than the acquisition document. The level of autonomy the [COMPANY] team has in 2026 and 2027 will determine whether the brand continues its trajectory or begins to move at the speed of a ₹75,000 Cr conglomerate.

The five transferable lessons across these three brands point to a consistent playbook: hold MT price at all costs and use pack-size reduction rather than price cuts when volume pressure builds; arrive at the first MT buyer conversation with QC velocity data rather than brand deck slides; establish the autonomy framework in writing before it is needed rather than after a conflict arises; enter MT with four hero SKUs maximum and keep the full range exclusive to D2C and QC; and create a QC-specific format at a lower price point that protects MT price architecture rather than discounting the existing range.`,
  synopsis: `## EXECUTIVE SYNOPSIS

**THE SITUATION:** Yogabar sits at strategic crossroads in India's nutrition bar category. The ₹950 Cr market is fragmenting (7 funded players in 18 months, no leader >12% share) creating a 12-18 month window for category leadership before customer preferences solidify. ITC's acquisition provides distribution firepower to compress the path to category anchor status (20-25% share, ₹500 Cr revenue threshold) from 4-5 years to 18-24 months.

**THE OPPORTUNITY**

**Revenue Path:** FY24: ₹125 Cr → FY26: ₹270 Cr → FY27: ₹380 Cr (3x in 3 years)

**Margin Expansion:** 32% → 40% gross margin (+8 pts via manufacturing + procurement)

**Value Drivers:**  
1. Distribution leverage: 2,500 stores vs 150 today = ₹73 Cr incremental  
2. Manufacturing synergies: ₹6 Cr annual + 4.8 margin points  
3. Procurement scale: ₹2 Cr annual savings  
4. Category timing: First to scale wins disproportionate share

**KEY INSIGHTS**

**INSIGHT 1: Distribution Velocity, Not Product Innovation, Determines Winners**  
Market analysis shows category commoditization—customer blind taste tests <40% brand identification. Meanwhile, distribution breadth correlates 1:1 with revenue. ITC's 4M outlet reach can place Yogabar in 3x more stores than competitors within 18 months, creating a moat far more defensible than formulation.

**INSIGHT 2: MT Velocity (80-120 bars/month) Is Make-or-Break Assumption**  
Entire strategy depends on modern trade velocity validation. If stores sell <60 bars/month, retailers delist and distribution synergy collapses. Mitigation: 100-store pilot mandatory before scaling.

**INSIGHT 3: Hybrid Integration Captures 80% of Synergies, Preserves 80% of Value**  
Full integration maximizes synergies (₹57 Cr) but destroys startup DNA. Light touch preserves culture but leaves ₹40 Cr uncaptured. Hybrid model (leverage ITC for distribution/manufacturing, maintain brand independence) captures ₹37-46 Cr annually while retaining digital-native capabilities worth preserving.

**INSIGHT 4: 18-Month Window Before Category Consolidates**  
Competitive analysis shows Whole Truth hitting D2C ceiling (review velocity -38%), forcing offline expansion. True Elements demonstrating omnichannel viability. First player to 2,500 stores likely captures 20-25% share. Current trajectory puts Yogabar 24-36 months behind. ITC compresses this to 12 months.

**THE VERDICT**

**RECOMMENDED STRATEGY:** Pursue hybrid integration model leveraging ITC distribution + manufacturing while preserving Yogabar's brand independence and digital-native capabilities, targeting ₹270 Cr revenue and break-even by FY26.

**WHY:**  
1. Market timing: 12-18 month window for leadership, ITC enables capture  
2. Synergy capture: ₹37-46 Cr annually (80% of maximum) with manageable risk  
3. Risk balance: Maintains premium positioning via channel-SKU segmentation  
4. Execution feasibility: Phased 18-month roadmap with clear gates

**CRITICAL SUCCESS FACTORS**

1. **MT Velocity Validation (HIGHEST PRIORITY):** Target 80-120 bars/month, pilot 100 stores Q1 FY25, go/no-go at day 90  
2. **Quality Through Manufacturing Transition:** Blind taste tests, pilot non-hero SKUs first  
3. **Talent Retention:** Retention bonuses, independence charter, career paths  
4. **Premium Positioning Protection:** Channel-SKU segmentation (never below ₹35)

**IMMEDIATE NEXT STEPS (90 Days)**

1. MT pilot launch (100 stores Mumbai/Delhi/Bangalore)  
2. Manufacturing pilot (2 non-hero SKUs to ITC plant)  
3. Governance setup (independence charter, decision rights)  
4. Procurement transition (onboard to ITC vendor system)  
5. Synergy tracking (weekly velocity dashboard)`,
};

// ─────────────────────────────────────────────────────────────
// buildPDFHtml — generates standalone HTML for Puppeteer PDF
// Called by generatePDF(); all charts rendered via CDN Chart.js
// ─────────────────────────────────────────────────────────────

// ── AGENT VISUAL RENDERERS ──────────────────────────────────────────────
// ── VISUAL RENDERERS ── one per agent ──────────────────────────────────────

// ── VISUAL RENDERERS v2 ── tighter, cleaner, segment-aware ─────────────

const V = {
  forest:'#1a3a2a', terra:'#b85c38', sand:'#e0d8cc', parchment:'#faf7f2',
  ink:'#1a1a1a', inkMid:'#3a3a3a', inkSoft:'#666', inkFaint:'#999',
  green:'#2d7a4f', amber:'#c97d20', blue:'#2563eb', red:'#c0392b',
  greenBg:'#e8f5ee', amberBg:'#fef3e2', blueBg:'#eff6ff', redBg:'#fdf2f2',
};

const sectionLabel = (text) =>
  `<div style="font-family:monospace;font-size:6px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${V.inkFaint};margin-bottom:5px;margin-top:10px;">${text}</div>`;

const verdictBadge = (verdict) => {
  const map = {STRONG:[V.green,V.greenBg],WATCH:[V.amber,V.amberBg],OPTIMISE:[V.blue,V.blueBg],UNDERDELIVERED:[V.red,V.redBg],RISK:[V.red,V.redBg]};
  const [fg,bg] = map[verdict]||['#666','#f0f0f0'];
  return `<span style="display:inline-block;background:${bg};color:${fg};font-family:monospace;font-size:7px;font-weight:700;padding:3px 9px;border-radius:3px;border:1px solid ${fg}30;letter-spacing:.08em;">${verdict}</span>`;
};

const heatCell = (val) => {
  const map = {
    H:[V.green,   '#e8f5ee','HIGH'],
    M:[V.amber,   '#fef3e2','MED'],
    L:['#aaa',    '#f5f5f5','LOW']
  };
  const [fg,bg,label] = map[val]||['#ccc','#fafafa','—'];
  return `<td style="background:${bg};color:${fg};font-size:7px;font-weight:700;text-align:center;padding:5px 6px;border:1px solid ${V.sand};letter-spacing:.04em;">${label}</td>`;
};

// ── CURRENCY HELPERS — set by renderAgentVisuals before any render call ──
let CUR = '₹';
let UNIT = 'Cr';
const fmtMoney = (val) => val != null ? `${CUR}${val}${UNIT}` : 'N/A';

// ── KPI ROW — 4 tiles, compact ────────────────────────────────────────────
function renderKPIs(kpis) {
  if (!kpis || !kpis.length) return '';
  const confDot = c => `<span style="width:5px;height:5px;border-radius:50%;background:${c==='H'?V.green:c==='M'?V.amber:'#bbb'};display:inline-block;margin-left:3px;vertical-align:middle;flex-shrink:0;"></span>`;
  const trendIcon = t => ({up:`<span style="color:${V.green};font-size:9px;margin-left:2px;">↑</span>`,down:`<span style="color:${V.red};font-size:9px;margin-left:2px;">↓</span>`,watch:`<span style="color:${V.amber};font-size:9px;margin-left:2px;">⚠</span>`})[t]||'';
  let h = `<div style="display:grid;grid-template-columns:repeat(${Math.min(kpis.length,4)},1fr);gap:6px;margin-bottom:10px;">`;
  kpis.slice(0,4).forEach(k => {
    h += `<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 10px;border-left:3px solid ${k.confidence==='H'?V.green:k.confidence==='M'?V.amber:'#ddd'};">`;
    h += `<div style="display:flex;align-items:baseline;gap:2px;flex-wrap:wrap;">`;
    h += `<span style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:800;color:${V.forest};line-height:1.1;letter-spacing:-.01em;">${k.value||'—'}</span>`;
    h += trendIcon(k.trend) + confDot(k.confidence);
    h += `</div>`;
    h += `<div style="font-size:6.5px;font-weight:700;color:${V.inkSoft};margin-top:3px;text-transform:uppercase;letter-spacing:.04em;line-height:1.3;">${k.label||''}</div>`;
    if (k.sub) h += `<div style="font-size:6px;color:${V.inkFaint};margin-top:1px;line-height:1.3;">${k.sub}</div>`;
    h += '</div>';
  });
  h += '</div>';
  return h;
}

// ── VERDICT ROW ───────────────────────────────────────────────────────────
function renderVerdict(verdictRow) {
  if (!verdictRow) return '';
  const v = verdictRow;
  return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fff;border:1px solid ${V.sand};border-radius:4px;margin-top:8px;">
    ${verdictBadge(v.verdict)}
    <span style="font-size:7.5px;color:${V.inkMid};line-height:1.4;flex:1;">${v.finding||''}</span>
  </div>`;
}

// ── AGENT 1: MARKET ───────────────────────────────────────────────────────
// Bubble → replaced with horizontal bar rank chart (cleaner, no dead space)
// Channel heatmap → tightened
function renderMarket(db) {
  let h = '';

  // Competitor rank chart — horizontal bars sorted by revenue, growth annotated
  if (db.competitorBubbles && db.competitorBubbles.length) {
    h += sectionLabel('Competitor Snapshot — Revenue (₹Cr) & Growth Rate');
    const sorted = [...db.competitorBubbles].sort((a,b)=>(b.revenueCr||0)-(a.revenueCr||0));
    const maxRev = Math.max(...sorted.map(c=>c.revenueCr||0), 1);
    h += `<div style="display:grid;gap:4px;margin-bottom:8px;">`;
    sorted.forEach(c => {
      const pct = ((c.revenueCr||0)/maxRev)*100;
      const isY = c.highlight;
      const barColor = isY ? V.terra : `${V.forest}70`;
      const labelColor = isY ? V.terra : V.inkMid;
      h += `<div style="display:flex;align-items:center;gap:7px;">`;
      h += `<div style="width:75px;font-size:7.5px;font-weight:${isY?700:500};color:${labelColor};flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>`;
      h += `<div style="flex:1;height:18px;background:${V.parchment};border-radius:3px;overflow:hidden;border:1px solid ${V.sand};position:relative;">`;
      h += `<div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;display:flex;align-items:center;padding:0 6px;">`;
      if (pct > 15) h += `<span style="font-size:7px;font-weight:700;color:#fff;">${fmtMoney(c.revenueCr)}</span>`;
      h += `</div>`;
      if (pct <= 15) h += `<span style="position:absolute;left:${pct+1}%;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:${labelColor};">${fmtMoney(c.revenueCr)}</span>`;
      h += `</div>`;
      h += `<div style="width:52px;flex-shrink:0;text-align:right;font-size:7px;font-weight:700;color:${(c.growthRate||0)>50?V.terra:V.green};">+${c.growthRate||0}% YoY</div>`;
      h += `</div>`;
    });
    h += `</div>`;
    h += `<div style="font-size:6.5px;color:${V.inkFaint};margin-bottom:8px;">Revenue (${CUR}${UNIT}) shown in bars. YoY growth rate shown right. Source: est. FY25.</div>`;
  }

  // Channel heatmap — tighter
  if (db.channelHeatmap && db.channelHeatmap.length) {
    h += sectionLabel('Channel Opportunity Matrix');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:6px;">`;
    h += `<thead><tr>
      <th style="background:${V.forest};color:#fff;padding:5px 10px;text-align:left;font-size:6.5px;letter-spacing:.06em;border:1px solid ${V.forest};">Channel</th>
      <th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;border:1px solid ${V.forest};">Co. Presence</th>
      <th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;border:1px solid ${V.forest};">Category Growth</th>
      <th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:center;font-size:6.5px;letter-spacing:.06em;border:1px solid ${V.forest};">Competitive Density</th>
    </tr></thead><tbody>`;
    db.channelHeatmap.forEach((row,i) => {
      h += `<tr>
        <td style="padding:5px 10px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;color:${V.forest};font-size:7.5px;">${row.channel}</td>
        ${heatCell(row.yogabarPresence)}${heatCell(row.categoryGrowth)}${heatCell(row.competitiveDensity)}
      </tr>`;
    });
    h += '</tbody></table>';
  }
  return h;
}

// ── AGENT 2: PORTFOLIO ────────────────────────────────────────────────────
function renderPortfolio(db) {
  let h = '';

  // BCG Matrix SVG — tighter, better proportioned
  if (db.skuMatrix && db.skuMatrix.length) {
    h += sectionLabel('Portfolio Matrix — Market Growth vs Competitive Position');
    const W=510, H=160, PL=32, PR=10, PT=12, PB=24;
    const cw=W-PL-PR, ch=H-PT-PB;
    const maxGr=Math.max(...db.skuMatrix.map(s=>s.marketGrowth||1),1);
    const maxPos=Math.max(...db.skuMatrix.map(s=>s.yogabarPosition||1),1);
    const maxRev=Math.max(...db.skuMatrix.map(s=>s.revenueCr||1),1);
    const vColors = {STAR:V.terra,CASHCOW:V.green,QUESTION:V.amber,DOG:'#aaa'};
    let svg = `<svg width="${W}" height="${H}">`;
    // Quadrant fills
    const qf = (x,y,w,h2,col) => `<rect x="${x}" y="${y}" width="${w}" height="${h2}" fill="${col}" rx="0"/>`;
    svg += qf(PL,PT,cw/2,ch/2,`${V.terra}08`);
    svg += qf(PL+cw/2,PT,cw/2,ch/2,`${V.amber}08`);
    svg += qf(PL,PT+ch/2,cw/2,ch/2,`${V.green}08`);
    svg += qf(PL+cw/2,PT+ch/2,cw/2,ch/2,`${V.sand}40`);
    // Grid lines
    svg += `<line x1="${PL+cw/2}" y1="${PT}" x2="${PL+cw/2}" y2="${PT+ch}" stroke="${V.sand}" stroke-width="1" stroke-dasharray="3,2"/>`;
    svg += `<line x1="${PL}" y1="${PT+ch/2}" x2="${PL+cw}" y2="${PT+ch/2}" stroke="${V.sand}" stroke-width="1" stroke-dasharray="3,2"/>`;
    // Quad labels
    [{t:'STARS',x:PL+6,y:PT+10},{t:'QUESTIONS',x:PL+cw/2+6,y:PT+10},{t:'CASH COWS',x:PL+6,y:PT+ch/2+10},{t:'DOGS',x:PL+cw/2+6,y:PT+ch/2+10}]
      .forEach(q=>svg+=`<text x="${q.x}" y="${q.y}" fill="${V.inkFaint}" font-size="5.5" font-family="monospace" opacity=".7">${q.t}</text>`);
    // Axes labels
    svg += `<text x="${PL-5}" y="${PT+ch/2}" fill="${V.inkFaint}" font-size="6" text-anchor="middle" transform="rotate(-90,${PL-5},${PT+ch/2})">Market Growth</text>`;
    svg += `<text x="${PL+cw/2}" y="${H-2}" fill="${V.inkFaint}" font-size="6" text-anchor="middle">Yogabar Position</text>`;
    // Bubbles — numbered circles, legend below
    const nums = ['①','②','③','④','⑤','⑥','⑦','⑧'];
    db.skuMatrix.forEach((s,si) => {
      const x = PL + ((s.yogabarPosition||0)/maxPos)*cw;
      const y = PT+ch - ((s.marketGrowth||0)/maxGr)*ch;
      const r = Math.max(8, 6+((s.revenueCr||0)/maxRev)*14);
      const c = vColors[s.verdict]||V.forest;
      svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}70" stroke="${c}" stroke-width="1.5"/>`;
      svg += `<text x="${x}" y="${y+3}" fill="${V.ink}" font-size="7" text-anchor="middle" font-weight="800">${si+1}</text>`;
    });
    svg += `<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+ch}" stroke="${V.inkFaint}" stroke-width=".8"/>`;
    svg += `<line x1="${PL}" y1="${PT+ch}" x2="${PL+cw}" y2="${PT+ch}" stroke="${V.inkFaint}" stroke-width=".8"/>`;
    svg += '</svg>';
    // HTML legend — 2 columns below chart
    const legendItems = db.skuMatrix.map((s,si) => {
      const c = vColors[s.verdict]||V.forest;
      return `<div style="display:flex;align-items:center;gap:5px;"><span style="width:16px;height:16px;border-radius:50%;background:${c}70;border:1.5px solid ${c};display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex-shrink:0;">${si+1}</span><span style="font-size:7px;color:${V.inkMid};">${s.name}</span><span style="font-size:6.5px;font-family:monospace;font-weight:700;color:${c};margin-left:auto;">${s.verdict||''}</span></div>`;
    }).join('');
    h += `<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 12px;margin-bottom:4px;">${svg}</div>`;
    h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;padding:6px 12px;background:${V.parchment};border:1px solid ${V.sand};border-radius:4px;margin-bottom:8px;">${legendItems}</div>`;
  }

  // Tier margins — horizontal bar table
  if (db.tierMargins && db.tierMargins.length) {
    h += sectionLabel('Margin & Revenue Share by Price Tier');
    const maxM = Math.max(...db.tierMargins.map(t=>t.grossMarginPct||0),1);
    const verdictColor = {KILL:V.red,KEEP:V.amber,GROW:V.blue,BUILD:V.green};
    h += `<div style="display:grid;gap:4px;margin-bottom:8px;">`;
    db.tierMargins.forEach(t => {
      const pct = ((t.grossMarginPct||0)/maxM)*100;
      const vc = verdictColor[t.verdict]||V.inkFaint;
      h += `<div style="display:flex;align-items:center;gap:7px;">`;
      h += `<div style="width:100px;font-size:7px;font-weight:600;color:${V.inkMid};flex-shrink:0;">${t.tier}</div>`;
      h += `<div style="flex:1;height:16px;background:${V.parchment};border-radius:3px;border:1px solid ${V.sand};overflow:hidden;position:relative;">`;
      h += `<div style="width:${pct}%;height:100%;background:${vc}35;border-right:2px solid ${vc};"></div>`;
      h += `<span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:6.5px;font-weight:700;color:${vc};">GM: ${t.grossMarginPct}%</span>`;
      h += `</div>`;
      h += `<span style="font-size:6.5px;font-family:monospace;font-weight:700;color:${vc};width:34px;text-align:right;">${t.verdict}</span>`;
      h += `<span style="font-size:6.5px;color:${V.inkFaint};width:32px;">${t.revenueSharePct}% rev</span>`;
      h += `</div>`;
    });
    h += `</div>`;
  }
  return h;
}

// ── AGENT 3: BRAND ───────────────────────────────────────────────────────
function renderBrand(db) {
  let h = '';

  // Positioning map — tighter SVG
  if (db.positioningMap && db.positioningMap.length) {
    h += sectionLabel('Brand Positioning Map');
    const W=510, H=155, cx=W/2, cy=H/2-5;
    let svg = `<svg width="${W}" height="${H}">`;
    // Background quadrants
    [[0,0,'Emotional + Premium'],[cx,0,'Functional + Premium'],[0,cy,'Emotional + Mass'],[cx,cy,'Functional + Mass']].forEach(([x,y,label],i)=>{
      const colors=[`${V.terra}08`,`${V.green}08`,`${V.amber}06`,`${V.sand}30`];
      svg+=`<rect x="${x+1}" y="${y+1}" width="${cx-2}" height="${cy-2}" fill="${colors[i]}"/>`;
      svg+=`<text x="${x+8}" y="${y+14}" fill="${V.inkFaint}" font-size="5.5" font-family="monospace" opacity=".7">${label.toUpperCase()}</text>`;
    });
    // Axis lines
    svg+=`<line x1="${cx}" y1="0" x2="${cx}" y2="${H-20}" stroke="${V.sand}" stroke-width="1"/>`;
    svg+=`<line x1="0" y1="${cy}" x2="${W}" y2="${cy}" stroke="${V.sand}" stroke-width="1"/>`;
    // Axis labels
    svg+=`<text x="${cx}" y="${H-6}" fill="${V.inkFaint}" font-size="6" text-anchor="middle" font-family="monospace">FUNCTIONAL ←→ EMOTIONAL</text>`;
    svg+=`<text x="8" y="${cy+3}" fill="${V.inkFaint}" font-size="6" font-family="monospace">MASS</text>`;
    svg+=`<text x="${W-30}" y="${cy+3}" fill="${V.inkFaint}" font-size="6" font-family="monospace">PREMIUM</text>`;
    // Brands
    db.positioningMap.forEach(b => {
      const px = (b.premium/100)*W;
      const py = (b.functional/100)*(H-20);
      const isY = b.highlight;
      svg+=`<circle cx="${px}" cy="${py}" r="${isY?8:5}" fill="${isY?V.terra:`${V.forest}40`}" stroke="${isY?V.terra:V.forest}" stroke-width="${isY?2:1}"/>`;
      if (isY && b.arrowPremium!==undefined && (b.arrowPremium!==b.premium||b.arrowFunctional!==b.functional)) {
        const tx=(b.arrowPremium/100)*W, ty=(b.arrowFunctional/100)*(H-20);
        svg+=`<line x1="${px}" y1="${py}" x2="${tx}" y2="${ty}" stroke="${V.terra}" stroke-width="1.5" stroke-dasharray="3,2"/>`;
        svg+=`<circle cx="${tx}" cy="${ty}" r="4" fill="none" stroke="${V.terra}" stroke-width="1.5" stroke-dasharray="2,2"/>`;
      }
      const labelY = py+(isY?12:9);
      svg+=`<text x="${px}" y="${labelY}" fill="${isY?V.terra:V.inkSoft}" font-size="${isY?7:6}" text-anchor="middle" font-weight="${isY?700:400}">${b.name}</text>`;
    });
    svg+='</svg>';
    h+=`<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 12px;margin-bottom:8px;">${svg}</div>`;
  }

  // Perception gap — side-by-side bars
  if (db.perceptionGap && db.perceptionGap.length) {
    h += sectionLabel('Perception Gap — Brand Intent vs Customer Reality');
    h += `<table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:8px;">`;
    h += `<thead><tr>
      <th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:left;font-size:6px;letter-spacing:.06em;border:1px solid ${V.forest};width:110px;">Dimension</th>
      <th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:center;font-size:6px;letter-spacing:.06em;border:1px solid ${V.forest};">Brand Says</th>
      <th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:center;font-size:6px;letter-spacing:.06em;border:1px solid ${V.forest};">Customer Hears</th>
      <th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:center;font-size:6px;letter-spacing:.06em;border:1px solid ${V.forest};width:40px;">Gap</th>
    </tr></thead><tbody>`;
    db.perceptionGap.forEach((p,i)=>{
      const gap = (p.brandSaysPct||0)-(p.customerHearsPct||0);
      const gapColor = Math.abs(gap)>20?V.red:Math.abs(gap)>10?V.amber:V.green;
      h+=`<tr>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;color:${V.inkMid};">${p.dimension}</td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">
          <div style="display:flex;align-items:center;gap:4px;justify-content:center;">
            <div style="width:${p.brandSaysPct||0}%;max-width:80px;height:8px;background:${V.forest}70;border-radius:2px;min-width:2px;"></div>
            <span style="font-weight:700;color:${V.forest}">${p.brandSaysPct}%</span>
          </div>
        </td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">
          <div style="display:flex;align-items:center;gap:4px;justify-content:center;">
            <div style="width:${p.customerHearsPct||0}%;max-width:80px;height:8px;background:${V.terra}70;border-radius:2px;min-width:2px;"></div>
            <span style="font-weight:700;color:${V.terra}">${p.customerHearsPct}%</span>
          </div>
        </td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;color:${gapColor};font-size:7.5px;">${gap>0?'+':''}${gap}</td>
      </tr>`;
    });
    h+=`</tbody></table>`;
  }

  // ITC dial — compact arc
  if (db.itcAssociationDial) {
    const d = db.itcAssociationDial;
    const cur = d.currentPosition||0, rec = d.recommendedPosition||0;
    const W=300, H=80;
    const toXY=(v,r,ocx=120,ocy=65)=>{const a=((v/100)*180-90)*Math.PI/180;return[ocx+r*Math.sin(a),ocy-r*Math.cos(a)];};
    const ocx=120,ocy=65,R=52;
    const [curX,curY]=toXY(cur,R,ocx,ocy),[recX,recY]=toXY(rec,R,ocx,ocy);
    // Wider canvas: arc left, clean legend right
    const W2=420, H2=125, arcCX=110, arcCY=75, arcR=58;
    const toXY2=(v,r)=>{const a=((v/100)*180-90)*Math.PI/180;return[arcCX+r*Math.sin(a),arcCY-r*Math.cos(a)];};
    const [curX2,curY2]=toXY2(cur,arcR),[recX2,recY2]=toXY2(rec,arcR);
    const a1b=((cur/100)*180-90)*Math.PI/180, a2b=((rec/100)*180-90)*Math.PI/180;
    const [x1b,y1b]=[arcCX+arcR*Math.sin(a1b),arcCY-arcR*Math.cos(a1b)];
    const [x2b,y2b]=[arcCX+arcR*Math.sin(a2b),arcCY-arcR*Math.cos(a2b)];
    const largeb=Math.abs(rec-cur)>50?1:0;
    let svg=`<svg width="${W2}" height="${H2}">`;
    // Track
    svg+=`<path d="M ${arcCX-arcR} ${arcCY} A ${arcR} ${arcR} 0 0 1 ${arcCX+arcR} ${arcCY}" fill="none" stroke="${V.sand}" stroke-width="10" stroke-linecap="round"/>`;
    // Highlighted arc
    svg+=`<path d="M ${x1b} ${y1b} A ${arcR} ${arcR} 0 ${largeb} ${rec>cur?1:0} ${x2b} ${y2b}" fill="none" stroke="${V.terra}70" stroke-width="10" stroke-linecap="round"/>`;
    // Dots
    svg+=`<circle cx="${curX2}" cy="${curY2}" r="6" fill="${V.forest}" stroke="#fff" stroke-width="2"/>`;
    svg+=`<circle cx="${recX2}" cy="${recY2}" r="6" fill="${V.terra}" stroke="#fff" stroke-width="2"/>`;
    // Axis end labels — below arc ends only
    svg+=`<text x="${arcCX-arcR}" y="${arcCY+22}" fill="${V.inkFaint}" font-size="6.5" text-anchor="middle" font-family="monospace">HIDE ITC</text>`;
    svg+=`<text x="${arcCX+arcR}" y="${arcCY+22}" fill="${V.inkFaint}" font-size="6.5" text-anchor="middle" font-family="monospace">LEAD ITC</text>`;
    // Clean legend box — right side, no overlap with arc
    const lx=arcCX+arcR+20;
    svg+=`<rect x="${lx}" y="10" width="140" height="75" fill="${V.parchment}" stroke="${V.sand}" stroke-width="1" rx="3"/>`;
    svg+=`<circle cx="${lx+14}" cy="30" r="5" fill="${V.forest}" stroke="#fff" stroke-width="1.5"/>`;
    svg+=`<text x="${lx+24}" y="34" fill="${V.inkMid}" font-size="7.5" font-weight="600">Current position: ${cur}</text>`;
    svg+=`<circle cx="${lx+14}" cy="52" r="5" fill="${V.terra}" stroke="#fff" stroke-width="1.5"/>`;
    svg+=`<text x="${lx+24}" y="56" fill="${V.terra}" font-size="7.5" font-weight="700">Recommended: ${rec}</text>`;
    svg+=`<text x="${lx+14}" y="74" fill="${V.inkFaint}" font-size="6">0=hide · 50=equal · 100=lead</text>`;
    svg+='</svg>';
    h+=sectionLabel('ITC Association Strategy — Integration Dial');
    const noteText = d.note ? `<div style="font-size:6.5px;color:${V.inkFaint};margin-top:4px;">${d.note}</div>` : '';
    h+=`<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 12px;margin-bottom:8px;">${svg}${noteText}</div>`;
  }
  return h;
}

// ── AGENT 4: MARGINS ─────────────────────────────────────────────────────
function renderMargins(db) {
  let h = '';

  // Margin waterfall — tighter
  if (db.marginWaterfall && db.marginWaterfall.length) {
    h += sectionLabel('Margin Waterfall — % of Revenue');
    const bars = db.marginWaterfall.filter(b=>b.valuePct!==0||b.type==='total'||b.type==='subtotal');
    const W=510, H=120, PL=72, PR=10, PT=8, PB=22;
    const bw = Math.max(16, Math.floor((W-PL-PR)/bars.length)-3);
    const maxH2 = H-PT-PB;
    let svg = `<svg width="${W}" height="${H}">`;
    let running = 100;
    bars.forEach((bar,i)=>{
      const x = PL + i*((W-PL-PR)/bars.length) + 2;
      const val = bar.valuePct||0;
      const isTotal = bar.type==='total'||bar.type==='subtotal';
      if(isTotal){
        const bh=(Math.abs(running)/100)*maxH2;
        const y=PT+maxH2-bh;
        svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${bar.type==='total'?V.forest:`${V.forest}60`}" rx="2"/>`;
        svg+=`<text x="${x+bw/2}" y="${y-3}" fill="${V.forest}" font-size="6.5" text-anchor="middle" font-weight="700">${running}%</text>`;
      } else {
        const drop=Math.abs(val);
        const bh=(drop/100)*maxH2;
        const y=PT+maxH2-(running/100)*maxH2;
        svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${V.terra}80" rx="2"/>`;
        svg+=`<text x="${x+bw/2}" y="${y+bh+8}" fill="${V.terra}" font-size="6" text-anchor="middle">${val}%</text>`;
        running+=val;
      }
      const short=bar.label.length>9?bar.label.slice(0,8)+'…':bar.label;
      svg+=`<text x="${x+bw/2}" y="${H-PB+11}" fill="${V.inkSoft}" font-size="5.5" text-anchor="middle" transform="rotate(-30,${x+bw/2},${H-PB+11})">${short}</text>`;
    });
    svg+=`<line x1="${PL}" y1="${H-PB}" x2="${W-PR}" y2="${H-PB}" stroke="${V.sand}" stroke-width="1"/>`;
    svg+='</svg>';
    h+=`<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 12px;margin-bottom:8px;">${svg}</div>`;
  }

  // Channel margins — paired bars
  if (db.channelMargins && db.channelMargins.length) {
    h += sectionLabel('Margin by Channel');
    const maxM=Math.max(...db.channelMargins.map(c=>Math.max(c.grossMarginPct||0,c.contributionMarginPct||0)),1);
    h+=`<div style="display:grid;gap:4px;margin-bottom:8px;">`;
    db.channelMargins.forEach(c=>{
      const gp=((c.grossMarginPct||0)/maxM)*100, cp=((c.contributionMarginPct||0)/maxM)*100;
      h+=`<div style="display:flex;align-items:center;gap:7px;">`;
      h+=`<div style="width:80px;font-size:7px;font-weight:600;color:${V.inkMid};flex-shrink:0;">${c.channel}</div>`;
      h+=`<div style="flex:1;display:flex;flex-direction:column;gap:2px;">`;
      h+=`<div style="display:flex;align-items:center;gap:3px;"><div style="width:${gp}%;height:7px;background:${V.forest};border-radius:2px;min-width:2px;"></div><span style="font-size:6.5px;color:${V.forest};font-weight:700;">${c.grossMarginPct}%</span></div>`;
      h+=`<div style="display:flex;align-items:center;gap:3px;"><div style="width:${cp}%;height:5px;background:${V.terra}80;border-radius:2px;min-width:2px;"></div><span style="font-size:6px;color:${V.terra};">${c.contributionMarginPct}%</span></div>`;
      h+=`</div></div>`;
    });
    h+=`</div>`;
    h+=`<div style="display:flex;gap:12px;margin-bottom:6px;">
      <span style="font-size:6px;color:${V.inkFaint};"><span style="display:inline-block;width:10px;height:5px;background:${V.forest};border-radius:1px;vertical-align:middle;margin-right:3px;"></span>Gross Margin</span>
      <span style="font-size:6px;color:${V.inkFaint};"><span style="display:inline-block;width:10px;height:5px;background:${V.terra}80;border-radius:1px;vertical-align:middle;margin-right:3px;"></span>Contribution Margin</span>
    </div>`;
  }

  // Margin levers
  if (db.marginLevers && db.marginLevers.length) {
    h += sectionLabel('Top Margin Improvement Levers');
    const maxImp=Math.max(...db.marginLevers.map(l=>l.impactPoints||0),1);
    h+=`<div style="display:grid;gap:3px;margin-bottom:8px;">`;
    db.marginLevers.forEach(l=>{
      const w=((l.impactPoints||0)/maxImp)*100;
      h+=`<div style="display:flex;align-items:center;gap:7px;">`;
      h+=`<div style="width:120px;font-size:6.5px;color:${V.inkMid};flex-shrink:0;line-height:1.3;">${l.lever}</div>`;
      h+=`<div style="flex:1;height:14px;background:${V.parchment};border-radius:2px;border:1px solid ${V.sand};overflow:hidden;position:relative;">`;
      h+=`<div style="position:absolute;left:0;top:0;height:100%;width:${w}%;background:${V.green}50;border-right:2px solid ${V.green};"></div>`;
      h+=`<span style="position:absolute;left:5px;top:50%;transform:translateY(-50%);font-size:6px;font-weight:700;color:${V.green};">+${l.impactPoints}pp</span>`;
      h+=`</div>`;
      h+=`<span style="font-size:6px;color:${V.inkFaint};white-space:nowrap;width:55px;text-align:right;">${fmtMoney(l.investmentCr)} · ${l.paybackMonths}mo</span>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }
  return h;
}

// ── AGENT 5: GROWTH ───────────────────────────────────────────────────────
function renderGrowth(db) {
  let h = '';

  // Revenue bridge — tighter
  if (db.revenueBridge && db.revenueBridge.length) {
    h += sectionLabel('Revenue Bridge — FY25 to FY26 Target (₹ Cr)');
    const bars=db.revenueBridge;
    const W=510, H=130, PL=16, PR=10, PT=18, PB=22;
    const bw=Math.max(18,Math.floor((W-PL-PR)/bars.length)-3);
    const maxVal=Math.max(...bars.map(b=>Math.abs(b.valueCr||0)),1);
    const scaleH=v=>(Math.abs(v)/maxVal)*(H-PT-PB);
    let svg=`<svg width="${W}" height="${H}">`;
    let cursor=0;
    bars.forEach((bar,i)=>{
      const x=PL+i*((W-PL-PR)/bars.length)+1;
      const val=bar.valueCr||0;
      if(bar.type==='start'||bar.type==='end'){
        const bh=scaleH(val);
        const y=PT+(H-PT-PB)-bh;
        svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${bar.type==='end'?V.forest:`${V.forest}55`}" rx="2"/>`;
        svg+=`<text x="${x+bw/2}" y="${y-3}" fill="${V.forest}" font-size="7" text-anchor="middle" font-weight="700">${CUR}${val}</text>`;
        cursor=val;
      } else if(bar.type==='up'){
        const bh=scaleH(val);
        const y=PT+(H-PT-PB)-scaleH(cursor+val);
        svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${V.terra}85" rx="2"/>`;
        svg+=`<text x="${x+bw/2}" y="${y-3}" fill="${V.terra}" font-size="6.5" text-anchor="middle" font-weight="700">+${val}</text>`;
        cursor+=val;
      } else if(bar.type==='down'){
        const bh=scaleH(Math.abs(val));
        const y=PT+(H-PT-PB)-scaleH(cursor);
        svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${V.red}80" rx="2"/>`;
        svg+=`<text x="${x+bw/2}" y="${y-3}" fill="${V.red}" font-size="6.5" text-anchor="middle" font-weight="700">${val}</text>`;
        cursor+=val;
      }
      const label=bar.label.replace(/lever \d+ — /i,'').replace(/risk \d+ — /i,'');
      const short=label.length>10?label.slice(0,9)+'…':label;
      svg+=`<text x="${x+bw/2}" y="${H-PB+12}" fill="${V.inkSoft}" font-size="5.5" text-anchor="middle" transform="rotate(-30,${x+bw/2},${H-PB+12})">${short}</text>`;
    });
    svg+=`<line x1="${PL}" y1="${H-PB}" x2="${W-PR}" y2="${H-PB}" stroke="${V.sand}" stroke-width="1"/>`;
    svg+='</svg>';
    h+=`<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 12px;margin-bottom:8px;">${svg}</div>`;
  }

  // Channel mix — current vs target as stacked horizontal bars (cleaner than donuts)
  if (db.channelMixCurrent && db.channelMixTarget && db.channelMixCurrent.length) {
    h += sectionLabel('Channel Mix — Current vs FY26 Target');
    const colors=[V.forest,V.terra,V.amber,V.blue,'#888'];
    const renderBar=(data,label)=>{
      let bar=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">`;
      bar+=`<div style="width:55px;font-size:7px;font-weight:600;color:${V.inkSoft};flex-shrink:0;">${label}</div>`;
      bar+=`<div style="flex:1;height:20px;border-radius:3px;overflow:hidden;display:flex;">`;
      data.forEach((seg,i)=>{
        if((seg.pct||0)<1)return;
        bar+=`<div style="width:${seg.pct}%;height:100%;background:${colors[i%colors.length]};display:flex;align-items:center;justify-content:center;overflow:hidden;">`;
        if((seg.pct||0)>8)bar+=`<span style="font-size:6.5px;font-weight:700;color:#fff;white-space:nowrap;">${seg.pct}%</span>`;
        bar+=`</div>`;
      });
      bar+=`</div></div>`;
      return bar;
    };
    h+=renderBar(db.channelMixCurrent,'FY25');
    h+=renderBar(db.channelMixTarget,'FY26');
    // Legend
    h+=`<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px;">`;
    db.channelMixCurrent.forEach((c,i)=>h+=`<span style="font-size:6px;color:${V.inkFaint};display:flex;align-items:center;gap:3px;"><span style="width:8px;height:8px;border-radius:1px;background:${colors[i%colors.length]};display:inline-block;"></span>${c.channel}</span>`);
    h+=`</div>`;
  }

  // Milestones timeline
  if (db.milestones && db.milestones.length) {
    h += sectionLabel('Execution Milestones');
    const typeColor={channel:V.forest,product:V.terra,campaign:V.amber,strategic:V.blue};
    h+=`<div style="display:grid;gap:3px;margin-bottom:8px;">`;
    db.milestones.forEach(m=>{
      const tc=typeColor[m.type]||V.inkFaint;
      h+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:#fff;border:1px solid ${V.sand};border-left:3px solid ${tc};border-radius:0 4px 4px 0;">`;
      h+=`<span style="font-family:monospace;font-size:7px;font-weight:700;color:${tc};width:42px;flex-shrink:0;">${m.quarter}</span>`;
      h+=`<span style="font-size:7.5px;color:${V.inkMid};">${m.milestone}</span>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }
  return h;
}

// ── AGENT 6: COMPETITIVE ─────────────────────────────────────────────────
function renderCompetitive(db) {
  let h = '';

  if (db.threatHeatmap && db.threatHeatmap.length) {
    h += sectionLabel('Competitive Threat Matrix');
    const dims=['price','channel','product','brand','distribution','growth'];
    const dimLabels=['Price','Channel','Product','Brand','Distrib.','Growth'];
    h+=`<table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:6px;">`;
    h+=`<thead><tr><th style="background:${V.forest};color:#fff;padding:5px 10px;text-align:left;font-size:6px;letter-spacing:.08em;border:1px solid ${V.forest};min-width:80px;">Competitor</th>`;
    dimLabels.forEach(d=>h+=`<th style="background:${V.forest};color:#fff;padding:5px 6px;text-align:center;font-size:6px;letter-spacing:.06em;border:1px solid ${V.forest};">${d}</th>`);
    h+=`</tr></thead><tbody>`;
    db.threatHeatmap.forEach((row,i)=>{
      h+=`<tr><td style="padding:5px 10px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;color:${V.inkMid};font-size:7.5px;">${row.competitor}</td>`;
      dims.forEach(d=>h+=heatCell(row[d]));
      h+=`</tr>`;
    });
    h+=`</tbody></table>`;
    h+=`<div style="display:flex;gap:10px;margin-bottom:8px;">`;
    [[V.green,V.greenBg,'HIGH threat'],[V.amber,V.amberBg,'MEDIUM'],[`#aaa`,'#f5f5f5','LOW']].forEach(([fg,bg,label])=>{
      h+=`<span style="font-size:6px;background:${bg};color:${fg};padding:2px 7px;border-radius:10px;font-weight:700;">${label}</span>`;
    });
    h+=`</div>`;
  }

  if (db.battleCards && db.battleCards.length) {
    h += sectionLabel('Battle Plan');
    const modeStyle={ATTACK:[V.terra,`${V.terra}12`],DEFEND:[V.green,`${V.green}10`],MONITOR:[V.amber,`${V.amber}12`]};
    h+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">`;
    db.battleCards.forEach(c=>{
      const[fg,bg]=modeStyle[c.mode]||['#666','#f5f5f5'];
      h+=`<div style="background:${bg};border:1px solid ${fg}40;border-radius:4px;padding:8px 10px;border-top:3px solid ${fg};">`;
      h+=`<div style="font-family:monospace;font-size:6px;font-weight:700;color:${fg};letter-spacing:.12em;margin-bottom:4px;">${c.mode}</div>`;
      h+=`<div style="font-size:7px;font-weight:600;color:${V.inkMid};margin-bottom:3px;">${c.target}</div>`;
      h+=`<div style="font-size:6.5px;color:${V.inkSoft};line-height:1.5;">${c.move}</div>`;
      h+=`<div style="font-size:6px;color:${fg};margin-top:4px;font-family:monospace;">${c.timeline}</div>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }
  return h;
}

// ── AGENT 7: SYNERGY ─────────────────────────────────────────────────────
function renderSynergy(db) {
  let h = '';

  if (db.synergyMatrix && db.synergyMatrix.length) {
    h += sectionLabel('ITC Asset Activation Scorecard');
    const statusColor={activated:V.green,partial:V.amber,untapped:V.inkFaint};
    const statusBg={activated:V.greenBg,partial:V.amberBg,untapped:V.parchment};
    const maxVal=Math.max(...db.synergyMatrix.map(s=>s.valueCr||0),1);
    h+=`<div style="display:grid;gap:3px;margin-bottom:8px;">`;
    db.synergyMatrix.forEach(s=>{
      const sc=statusColor[s.status]||V.inkFaint;
      const sb=statusBg[s.status]||V.parchment;
      const vw=((s.valueCr||0)/maxVal)*100;
      const ew=((s.ease||0)/100)*100;
      h+=`<div style="display:flex;align-items:center;gap:7px;padding:5px 8px;background:${sb};border:1px solid ${sc}30;border-radius:3px;border-left:3px solid ${sc};">`;
      h+=`<div style="flex:1;font-size:7px;font-weight:600;color:${V.inkMid};">${s.asset.length>30?s.asset.slice(0,29)+'…':s.asset}</div>`;
      h+=`<div style="width:70px;flex-shrink:0;">`;
      h+=`<div style="display:flex;align-items:center;gap:3px;margin-bottom:1px;"><div style="width:${vw}%;max-width:70px;height:5px;background:${sc};border-radius:2px;min-width:2px;"></div><span style="font-size:6px;color:${sc};font-weight:700;">${fmtMoney(s.valueCr)}</span></div>`;
      h+=`<div style="display:flex;align-items:center;gap:3px;"><div style="width:${ew}%;max-width:70px;height:3px;background:${sc}60;border-radius:2px;min-width:2px;"></div><span style="font-size:5.5px;color:${V.inkFaint};">ease:${s.ease}</span></div>`;
      h+=`</div>`;
      h+=`<span style="font-family:monospace;font-size:6px;font-weight:700;color:${sc};width:52px;text-align:right;flex-shrink:0;">${(s.status||'').toUpperCase()}</span>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }

  if (db.synergyRoadmap && db.synergyRoadmap.length) {
    h += sectionLabel('Activation Roadmap');
    const maxVal=Math.max(...db.synergyRoadmap.map(r=>r.valueCr||0),1);
    h+=`<div style="display:grid;gap:3px;margin-bottom:8px;">`;
    db.synergyRoadmap.forEach(r=>{
      const w=((r.valueCr||0)/maxVal)*100;
      h+=`<div style="display:flex;align-items:center;gap:7px;">`;
      h+=`<div style="font-family:monospace;font-size:7px;font-weight:700;color:${V.terra};width:44px;flex-shrink:0;">${r.quarter}</div>`;
      h+=`<div style="flex:1;font-size:7px;color:${V.inkMid};">${r.synergy}</div>`;
      h+=`<div style="width:70px;height:12px;background:${V.parchment};border-radius:2px;border:1px solid ${V.sand};flex-shrink:0;overflow:hidden;">`;
      h+=`<div style="width:${w}%;height:100%;background:${V.forest}60;border-right:2px solid ${V.forest};"></div>`;
      h+=`</div>`;
      h+=`<span style="font-size:7px;font-weight:700;color:${V.forest};width:34px;text-align:right;">${fmtMoney(r.valueCr)}</span>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }
  return h;
}

// ── AGENT 8: PLATFORM ────────────────────────────────────────────────────
function renderPlatform(db) {
  let h = '';

  if (db.opportunityBubbles && db.opportunityBubbles.length) {
    h += sectionLabel('Platform Opportunities — ITC Fit × Market Growth × TAM');
    const W=510, H=150, PL=28, PR=10, PT=12, PB=22;
    const cw=W-PL-PR, ch=H-PT-PB;
    const maxTam=Math.max(...db.opportunityBubbles.map(o=>o.tamCr||1),1);
    const maxFit=Math.max(...db.opportunityBubbles.map(o=>o.itcFitScore||1),1);
    const maxGr=Math.max(...db.opportunityBubbles.map(o=>o.marketGrowthPct||1),1);
    const colors=[V.forest,V.terra,V.amber,V.blue,'#888'];
    let svg=`<svg width="${W}" height="${H}">`;
    svg+=`<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+ch}" stroke="${V.sand}" stroke-width="1"/>`;
    svg+=`<line x1="${PL}" y1="${PT+ch}" x2="${PL+cw}" y2="${PT+ch}" stroke="${V.sand}" stroke-width="1"/>`;
    svg+=`<text x="${PL-4}" y="${PT+ch/2}" fill="${V.inkFaint}" font-size="6" text-anchor="middle" transform="rotate(-90,${PL-4},${PT+ch/2})">Mkt Growth %</text>`;
    svg+=`<text x="${PL+cw/2}" y="${H-2}" fill="${V.inkFaint}" font-size="6" text-anchor="middle">ITC Fit Score</text>`;
    db.opportunityBubbles.forEach((o,i)=>{
      const x=PL+((o.itcFitScore||0)/maxFit)*cw;
      const y=PT+ch-((o.marketGrowthPct||0)/maxGr)*ch;
      const r=Math.max(8,6+((o.tamCr||0)/maxTam)*18);
      const c=colors[i%colors.length];
      svg+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}50" stroke="${c}" stroke-width="1.5"/>`;
      svg+=`<text x="${x}" y="${y+3}" fill="${V.ink}" font-size="7" text-anchor="middle" font-weight="800">${i+1}</text>`;
    });
    svg+='</svg>';
    const platLegend = db.opportunityBubbles.map((o,i)=>{
      const c=colors[i%colors.length];
      return `<div style="display:flex;align-items:center;gap:5px;"><span style="width:16px;height:16px;border-radius:50%;background:${c}50;border:1.5px solid ${c};display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex-shrink:0;">${i+1}</span><span style="font-size:7px;color:${V.inkMid};">${o.name}</span><span style="font-size:6.5px;color:${V.inkFaint};margin-left:auto;">TAM ${fmtMoney(o.tamCr)}</span></div>`;
    }).join('');
    h+=`<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 12px;margin-bottom:4px;">${svg}</div>`;
    h+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;padding:6px 12px;background:${V.parchment};border:1px solid ${V.sand};border-radius:4px;margin-bottom:8px;">${platLegend}</div>`;
  }

  if (db.buildPartnerAcquire && db.buildPartnerAcquire.length) {
    h += sectionLabel('Strategic Mode — Build vs Partner vs Acquire');
    const modeStyle={build:[V.green,V.greenBg],partner:[V.blue,V.blueBg],acquire:[V.terra,`${V.terra}12`]};
    h+=`<div style="display:grid;gap:4px;margin-bottom:8px;">`;
    db.buildPartnerAcquire.forEach(item=>{
      const mode=(item.recommendation||'').toLowerCase();
      const[fg,bg]=modeStyle[mode]||['#666','#f0f0f0'];
      h+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:${bg};border:1px solid ${fg}30;border-radius:4px;border-left:3px solid ${fg};">`;
      h+=`<span style="font-family:monospace;font-size:6.5px;font-weight:700;color:${fg};text-transform:uppercase;width:50px;flex-shrink:0;">${item.recommendation}</span>`;
      h+=`<span style="font-size:7.5px;font-weight:600;color:${V.inkMid};width:110px;flex-shrink:0;">${item.opportunity}</span>`;
      h+=`<span style="font-size:7px;color:${V.inkSoft};flex:1;">${item.rationale}</span>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }
  return h;
}

// ── AGENT 9: INTL ────────────────────────────────────────────────────────
function renderIntl(db) {
  let h = '';

  if (db.marketRadar && db.marketRadar.axes && db.marketRadar.markets && db.marketRadar.markets.length) {
    h += sectionLabel('Market Entry Radar — Multi-Dimension Comparison');
    const axes=db.marketRadar.axes, markets=db.marketRadar.markets;
    const N=axes.length, R=58, ocx=85, ocy=72, W=370, H=155;
    const colors=[V.terra,V.forest,V.amber];
    const toXY=(score,axisIdx,maxScore=10)=>{
      const angle=(2*Math.PI*axisIdx/N)-Math.PI/2;
      const r2=(score/maxScore)*R;
      return[ocx+r2*Math.cos(angle),ocy+r2*Math.sin(angle)];
    };
    let svg=`<svg width="${W}" height="${H}">`;
    [0.25,0.5,0.75,1].forEach(scale=>{
      const pts=axes.map((_,i)=>toXY(scale*10,i).join(',')).join(' ');
      svg+=`<polygon points="${pts}" fill="none" stroke="${V.sand}" stroke-width="${scale===1?1:.5}"/>`;
    });
    axes.forEach((ax,i)=>{
      const[x,y]=toXY(10,i);
      svg+=`<line x1="${ocx}" y1="${ocy}" x2="${x}" y2="${y}" stroke="${V.sand}" stroke-width=".8"/>`;
      const[lx,ly]=toXY(11.8,i);
      const short=ax.length>12?ax.slice(0,11)+'…':ax;
      svg+=`<text x="${lx}" y="${ly+2}" fill="${V.inkSoft}" font-size="6" text-anchor="middle">${short}</text>`;
    });
    markets.forEach((m,mi)=>{
      if(!m.scores||!m.scores.length)return;
      const maxScore=Math.max(...m.scores,1);
      const pts=m.scores.map((s,i)=>toXY(Math.min(s,10),i).join(',')).join(' ');
      svg+=`<polygon points="${pts}" fill="${colors[mi%colors.length]}20" stroke="${colors[mi%colors.length]}" stroke-width="1.5"/>`;
    });
    markets.forEach((m,mi)=>{
      svg+=`<rect x="${W-80}" y="${14+mi*16}" width="8" height="8" fill="${colors[mi%colors.length]}40" stroke="${colors[mi%colors.length]}" stroke-width="1.5" rx="1"/>`;
      svg+=`<text x="${W-68}" y="${21+mi*16}" fill="${V.inkMid}" font-size="7">${m.name}</text>`;
    });
    svg+='</svg>';
    h+=`<div style="background:#fff;border:1px solid ${V.sand};border-radius:4px;padding:8px 12px;margin-bottom:8px;display:inline-block;">${svg}</div>`;
  }

  if (db.entryPriority && db.entryPriority.length) {
    h += sectionLabel('Market Entry Priority');
    h+=`<table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:8px;">`;
    h+=`<thead><tr>`;
    ['#','Market','Entry Mode','Investment','Yr3 Revenue','Readiness'].forEach(col=>
      h+=`<th style="background:${V.forest};color:#fff;padding:5px 8px;text-align:left;font-size:6px;letter-spacing:.06em;border:1px solid ${V.forest};">${col}</th>`
    );
    h+=`</tr></thead><tbody>`;
    db.entryPriority.forEach((row,i)=>{
      const rc={H:V.green,M:V.amber,L:'#aaa'}[row.readiness]||'#aaa';
      h+=`<tr>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-family:monospace;font-weight:700;color:${V.terra};">${row.rank}</td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;color:${V.forest};">${row.market}</td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};color:${V.inkMid};">${row.mode}</td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${fmtMoney(row.investmentCr)}</td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;color:${V.forest};">${fmtMoney(row.year3RevenueCr)}</td>
        <td style="padding:5px 8px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};"><span style="background:${rc}20;color:${rc};font-family:monospace;font-size:7px;font-weight:700;padding:2px 5px;border-radius:3px;">${row.readiness}</span></td>
      </tr>`;
    });
    h+=`</tbody></table>`;
  }
  return h;
}

// ── SYNOPSIS ──────────────────────────────────────────────────────────────
function renderSynopsis(db) {
  let h = '';

  if (db.agentVerdicts && db.agentVerdicts.length) {
    h += sectionLabel('9-Agent Intelligence Dashboard');
    const vColor=v=>({STRONG:V.green,WATCH:V.amber,OPTIMISE:V.blue,UNDERDELIVERED:V.red,RISK:V.red}[v]||'#666');
    const vBg=v=>({STRONG:V.greenBg,WATCH:V.amberBg,OPTIMISE:V.blueBg,UNDERDELIVERED:V.redBg,RISK:V.redBg}[v]||'#f0f0f0');
    h+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:10px;">`;
    db.agentVerdicts.forEach(av=>{
      const vc=vColor(av.verdict),vb=vBg(av.verdict);
      h+=`<div style="background:${vb};border:1px solid ${vc}40;border-radius:4px;padding:8px 10px;border-left:3px solid ${vc};">`;
      h+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">`;
      h+=`<span style="font-size:7.5px;font-weight:700;color:${V.forest};">${av.agent}</span>`;
      h+=verdictBadge(av.verdict);
      h+=`</div>`;
      h+=`<div style="font-size:6.5px;color:${V.inkMid};line-height:1.4;">${av.oneLiner}</div>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }

  if (db.topActions && db.topActions.length) {
    h += sectionLabel('Top Priority Actions — by Revenue Impact');
    const maxRev=Math.max(...db.topActions.map(a=>a.revenueCr||0),1);
    h+=`<div style="display:grid;gap:4px;margin-bottom:10px;">`;
    db.topActions.forEach((a,i)=>{
      const w=((a.revenueCr||0)/maxRev)*100;
      h+=`<div style="display:flex;align-items:center;gap:7px;padding:5px 8px;background:${i===0?`${V.terra}10`:'#fff'};border:1px solid ${i===0?`${V.terra}40`:V.sand};border-radius:4px;">`;
      h+=`<span style="font-family:monospace;font-size:9px;font-weight:700;color:${V.terra};width:14px;">${a.rank}</span>`;
      h+=`<span style="font-size:7.5px;font-weight:600;color:${V.forest};flex:1;">${a.action}</span>`;
      h+=`<div style="width:70px;height:9px;background:${V.parchment};border-radius:2px;border:1px solid ${V.sand};overflow:hidden;">`;
      h+=`<div style="width:${w}%;height:100%;background:${V.terra}80;"></div>`;
      h+=`</div>`;
      h+=`<span style="font-size:6.5px;font-family:monospace;font-weight:700;color:${V.forest};width:38px;text-align:right;">${fmtMoney(a.revenueCr)}</span>`;
      h+=`<span style="font-size:6px;color:${V.inkFaint};width:26px;">${a.quarter}</span>`;
      h+=`</div>`;
    });
    h+=`</div>`;
  }

  if ((db.risks||[]).length && (db.opportunities||[]).length) {
    h+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">`;
    h+=`<div>${sectionLabel('Key Risks')}`;
    db.risks.forEach(r=>{
      const sev={H:V.red,M:V.amber,L:'#aaa'}[r.severity]||'#aaa';
      h+=`<div style="padding:5px 8px;background:${sev}10;border-left:3px solid ${sev};margin-bottom:4px;border-radius:0 3px 3px 0;">`;
      h+=`<div style="font-size:7px;font-weight:600;color:${V.inkMid};margin-bottom:1px;">${r.risk}</div>`;
      h+=`<div style="font-size:6.5px;color:${V.inkFaint};">${r.mitigation}</div>`;
      h+=`</div>`;
    });
    h+=`</div><div>${sectionLabel('Key Opportunities')}`;
    db.opportunities.forEach(o=>{
      h+=`<div style="padding:5px 8px;background:${V.green}10;border-left:3px solid ${V.green};margin-bottom:4px;border-radius:0 3px 3px 0;">`;
      h+=`<div style="font-size:7px;font-weight:600;color:${V.inkMid};margin-bottom:1px;">${o.opportunity}</div>`;
      h+=`<div style="font-size:7px;font-weight:700;color:${V.green};">${fmtMoney(o.valueCr)} potential</div>`;
      h+=`</div>`;
    });
    h+=`</div></div>`;
  }
  return h;
}

// ── DISPATCHER ───────────────────────────────────────────────────────────
function renderAgentVisuals(agentId, db, market="India") {
  // Set module-level currency vars so all sub-renderers pick them up
  CUR = (market === "US" || market === "Global") ? "$" : "₹";
  UNIT = (market === "US" || market === "Global") ? "M" : "Cr";
  if (!db) return '';
  let h = '';
  h += renderKPIs(db.kpis);
  switch(agentId) {
    case 'market':      h += renderMarket(db); break;
    case 'portfolio':   h += renderPortfolio(db); break;
    case 'brand':       h += renderBrand(db); break;
    case 'margins':     h += renderMargins(db); break;
    case 'growth':      h += renderGrowth(db); break;
    case 'competitive': h += renderCompetitive(db); break;
    case 'synergy':     h += renderSynergy(db); break;
    case 'platform':    h += renderPlatform(db); break;
    case 'intl':        h += renderIntl(db); break;
    case 'synopsis':    h += renderSynopsis(db); break;
  }
  h += renderVerdict(db.verdictRow);
  return h;
}

function buildPDFHtml({ company, acquirer, results, dataBlocks, sources, elapsed, market="India" }) {
  const acq = acquirer && acquirer.trim() ? acquirer.trim() : null;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const mins = Math.floor((elapsed||0) / 60);
  const secs = ((elapsed||0) % 60).toString().padStart(2,'0');
  const elapsedStr = mins > 0 ? `In ${mins} Minutes ${secs} Seconds` : `In ${secs} Seconds`;

  const agentPages = [
    { id: 'market',      num: '01', wave: '1', title: 'Market Position & Category Dynamics' },
    { id: 'portfolio',   num: '02', wave: '1', title: 'Portfolio Strategy & SKU Rationalization' },
    { id: 'brand',       num: '03', wave: '1', title: 'Brand Positioning & Storytelling' },
    { id: 'margins',     num: '04', wave: '1', title: 'Margin Improvement & Unit Economics' },
    { id: 'growth',      num: '05', wave: '1', title: 'Growth Strategy & Channel Orchestration' },
    { id: 'competitive', num: '06', wave: '1', title: 'Competitive Battle Plan' },
    { id: 'synergy',     num: '07', wave: '2', title: `${acq || 'Acquirer'} Synergy & Leverage Playbook` },
    { id: 'platform',    num: '08', wave: '2', title: 'Platform Expansion & D2C Brand Incubator' },
    { id: 'intl',        num: '09', wave: '2', title: 'International Benchmarks & Global Playbook' },
  ];

  const formatProse = (text) => {
    if (!text) return '<p style="color:#999;font-style:italic;">Agent analysis not available.</p>';
    let t = text
      // Confidence badges
      .replace(/\[HIGH CONFIDENCE[^\]]*\]/g, '<span style="background:#e8f5ee;color:#2d7a4f;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:2px;font-weight:600;">● High</span>')
      .replace(/\[MEDIUM CONFIDENCE[^\]]*\]/g, '<span style="background:#fef3e2;color:#c97d20;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:2px;font-weight:600;">● Medium</span>')
      .replace(/\[LOW CONFIDENCE[^\]]*\]/g, '<span style="background:#fde8e8;color:#c0392b;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:2px;font-weight:600;">● Low</span>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // ◉ section markers — turn into bold section headers
      .replace(/^◉\s*(.+)$/gm, '<strong style="font-size:10px;color:#1a3a2a;display:block;margin:14px 0 6px;border-bottom:1px solid #e0d8cc;padding-bottom:4px;">$1</strong>')
      // ## headers
      .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="font-size:10px;color:#1a3a2a;display:block;margin:14px 0 6px;">$1</strong>')
      // Em-dash list items — render as indented blocks
      .replace(/^—\s+(.+)$/gm, '<div style="padding:2px 0 2px 14px;border-left:2px solid #e0d8cc;margin:3px 0;color:#555;">$1</div>')
      // Horizontal rules
      .replace(/^─+$/gm, '<hr style="border:none;border-top:1px solid #e0d8cc;margin:10px 0;"/>')
      .replace(/^━+$/gm, '');

    // Split into paragraphs and wrap each
    const paras = t.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return paras.map(p => {
      // Already an HTML block element — don't wrap in <p>
      if (p.startsWith('<strong') || p.startsWith('<div') || p.startsWith('<hr')) return p;
      // Single newlines within a paragraph become <br>
      return '<p style="margin:0 0 8px 0;">' + p.replace(/\n/g, ' ') + '</p>';
    }).join('\n');
  };

  const header = (tag, rec) => `
    <div style="background:#1a3a2a;height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 50px;">
      <div style="font-family:'Playfair Display',serif;font-size:13px;color:#faf7f2;letter-spacing:.03em;"><em>Advisor</em>Sprint</div>
      <div style="font-family:monospace;font-size:7px;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.9);font-weight:700;">${tag}</div>
      <div style="background:#b85c38;color:#fff;font-size:7px;font-weight:700;letter-spacing:.1em;padding:3px 9px;border-radius:9px;">${rec || 'HARSHA BELAVADY'}</div>
    </div>`;

  const footer = (pageNum) => `
    <div style="position:absolute;bottom:0;left:0;right:0;height:24px;border-top:1px solid #e0d8cc;display:flex;align-items:center;justify-content:space-between;padding:0 50px;background:#fff;">
      <span style="font-size:7px;color:#999;font-family:monospace;">AdvisorSprint · Confidential · ${dateStr}</span>
      <span style="font-size:7px;color:#999;font-family:monospace;">${pageNum}</span>
    </div>`;

  const agentPageHtml = agentPages.map((ag, i) => `
    <div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
      ${header(`AGENT ${ag.num} · ${ag.title.toUpperCase()}`)}
      <div style="padding:26px 50px 36px;">
        <div style="font-family:'Playfair Display',serif;font-size:18px;color:#1a3a2a;font-weight:700;margin-bottom:3px;">${ag.title}</div>
        <div style="height:2px;background:linear-gradient(90deg,#1a3a2a 0%,#b85c38 40%,transparent 100%);margin-bottom:14px;"></div>

        ${renderAgentVisuals(ag.id, dataBlocks[ag.id], market)}

        <div style="background:#faf7f2;border:1px solid #e0d8cc;border-radius:5px;padding:14px 16px 48px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="flex:1;height:1px;background:#e0d8cc;"></div>
            <div style="font-family:monospace;font-size:6.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#999;">Analysis & Strategic Implications</div>
            <div style="flex:1;height:1px;background:#e0d8cc;"></div>
          </div>
          <div style="font-size:9px;line-height:1.8;color:#3a3a3a;">
            ${formatProse(results[ag.id])}
          </div>
        </div>
      </div>
      ${footer(i + 3)}
    </div>`).join('');

  const synopsisHtml = `
    <div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
      ${header('EXECUTIVE SYNOPSIS · OPUS 4 SYNTHESIS')}
      <div style="padding:26px 50px 36px;">
        <div style="font-family:'Playfair Display',serif;font-size:18px;color:#1a3a2a;font-weight:700;margin-bottom:3px;">Executive Synopsis</div>
        <div style="height:2px;background:linear-gradient(90deg,#1a3a2a 0%,#b85c38 40%,transparent 100%);margin-bottom:14px;"></div>
        ${renderAgentVisuals('synopsis', dataBlocks['synopsis'], market)}
        <div style="background:#faf7f2;border:1px solid #e0d8cc;border-radius:5px;padding:14px 16px 12px;margin-top:10px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="flex:1;height:1px;background:#e0d8cc;"></div>
            <div style="font-family:monospace;font-size:6.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#999;">Strategic Synthesis</div>
            <div style="flex:1;height:1px;background:#e0d8cc;"></div>
          </div>
          <div style="font-size:9px;line-height:1.85;color:#3a3a3a;">
            ${formatProse(results.synopsis)}
          </div>
        </div>
      </div>
      ${footer(12)}
    </div>`;

  const sourcesHtml = `
    <div style="width:794px;min-height:1122px;position:relative;background:#fff;page-break-after:always;overflow:hidden;">
      ${header('SOURCES & RESEARCH METHODOLOGY')}
      <div style="padding:26px 50px 36px;">
        <div style="font-family:monospace;font-size:7px;letter-spacing:.18em;text-transform:uppercase;color:#b85c38;margin-bottom:4px;">Research Transparency</div>
        <div style="font-family:'Playfair Display',serif;font-size:18px;color:#1a3a2a;font-weight:700;margin-bottom:3px;">Sources & Confidence Methodology</div>
        <div style="height:2px;background:linear-gradient(90deg,#1a3a2a 0%,#b85c38 40%,transparent 100%);margin-bottom:18px;"></div>
        <div style="display:grid;grid-template-columns:1fr;gap:16px;">
          <div>
            <div style="font-size:9px;font-weight:700;color:#1a3a2a;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Confidence Framework</div>
            <div style="padding:12px;background:#faf7f2;border-radius:5px;border:1px solid #e0d8cc;margin-bottom:10px;">
              <div style="display:flex;gap:7px;margin-bottom:8px;"><span style="background:#e8f5ee;color:#2d7a4f;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:3px;font-weight:600;flex-shrink:0;">● HIGH</span><div style="font-size:7.5px;color:#3a3a3a;">Directly cited from a named, datable source — filing, industry report, verified press</div></div>
              <div style="display:flex;gap:7px;margin-bottom:8px;"><span style="background:#fef3e2;color:#c97d20;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:3px;font-weight:600;flex-shrink:0;">● MED</span><div style="font-size:7.5px;color:#3a3a3a;">Triangulated from 2+ indirect signals — funding rounds, hiring patterns, e-commerce rankings</div></div>
              <div style="display:flex;gap:7px;"><span style="background:#f0f0f0;color:#888;font-size:7px;font-family:monospace;padding:2px 5px;border-radius:3px;font-weight:600;flex-shrink:0;">● LOW</span><div style="font-size:7.5px;color:#3a3a3a;">Single unverified signal or logical extrapolation. Directional only — do not use for financial decisions.</div></div>
            </div>
            <div style="font-size:7.5px;color:#666;line-height:1.7;padding:10px;background:#fff8f5;border-left:3px solid #b85c38;border-radius:0 4px 4px 0;">
              <strong style="color:#b85c38;">Note:</strong> ${company} is a private company. Revenue figures sourced from verified press. All margins, channel splits, and unit economics are estimated from industry benchmarks with explicit confidence labels.
            </div>
          </div>
          <div>
            <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;">
              <div style="font-size:9px;font-weight:700;color:#1a3a2a;text-transform:uppercase;letter-spacing:.06em;">Sources Cited</div>
              <div style="font-family:monospace;font-size:7px;color:#b85c38;font-weight:600;">${(sources||[]).length} sources checked</div>
            </div>
            <div style="font-size:7.5px;color:#3a3a3a;line-height:1.4;">
              ${(sources || []).slice(0, 30).map((s, i) =>
                `<div style="display:flex;gap:6px;padding:4px 6px;background:${i%2===0?'#faf7f2':'#fff'};border-left:2px solid ${i%2===0?'#1a3a2a':'#e0d8cc'};">
                  <span style="font-family:monospace;font-size:6.5px;color:#b85c38;font-weight:600;flex-shrink:0;width:14px;">${i+1}</span>
                  <span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${s.title || s.url}</span>
                </div>`
              ).join('') || '<div style="color:#999;font-style:italic;padding:8px;">Sources populated after live run</div>'}
            </div>
          </div>
        </div>
        <div style="margin-top:18px;padding:13px;background:#1a3a2a;border-radius:5px;color:rgba(255,255,255,.7);font-size:7.5px;line-height:1.7;">
          <strong style="color:#fff;">Disclaimer:</strong> Generated by AdvisorSprint's 10-agent AI system using live web search. Strategic thinking tool only — not a substitute for primary research or professional financial advice.
        </div>
      </div>
      ${footer(2)}
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@media print{@page{margin:0;size:A4 portrait;}.page{page-break-after:always;}}
em{font-style:italic;}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:8px;}
thead tr{background:#1a3a2a;color:#fff;}
thead th{padding:7px 10px;text-align:left;font-weight:600;letter-spacing:.04em;border:1px solid #1a3a2a;}
tbody tr:nth-child(even){background:#faf7f2;}
tbody tr:nth-child(odd){background:#fff;}
tbody td{padding:6px 10px;border:1px solid #e0d8cc;color:#3a3a3a;vertical-align:top;}
tbody tr:hover{background:#f0ead8;}
</style>
</head>
<body>

<!-- COVER -->
<div style="width:794px;height:1122px;background:#1a3a2a;position:relative;overflow:hidden;page-break-after:always;">
  <div style="position:absolute;top:0;right:0;width:360px;height:360px;background:linear-gradient(135deg,rgba(184,92,56,.35) 0%,transparent 70%);border-radius:0 0 0 360px;"></div>
  <div style="position:absolute;bottom:-50px;left:-50px;width:280px;height:280px;border:1px solid rgba(255,255,255,.07);border-radius:50%;"></div>
  <div style="position:absolute;inset:0;padding:65px 50px;display:flex;flex-direction:column;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="font-family:'Playfair Display',serif;font-size:15px;color:rgba(255,255,255,.9);letter-spacing:.04em;"><em>Advisor</em>Sprint</div>
      <div></div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;margin-bottom:20px;">
    <div style="margin-bottom:40px;">
      <div style="font-family:monospace;font-size:8.5px;letter-spacing:.25em;text-transform:uppercase;color:#d4733f;margin-bottom:14px;">10-Agent Strategic Intelligence Report</div>
      <div style="font-family:'Playfair Display',serif;font-size:52px;color:#fff;font-weight:900;line-height:.92;letter-spacing:-.02em;margin-bottom:12px;">${company}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.55);font-weight:300;letter-spacing:.05em;">${acq ? `Post-acquisition growth analysis &nbsp;·&nbsp; <strong style="color:rgba(255,255,255,.8);font-weight:500;">${acq}</strong>` : 'Standalone strategic analysis · 2026'}</div>
      <div style="margin-top:18px;display:flex;gap:20px;align-items:center;">
        <div style="font-family:monospace;font-size:11px;color:rgba(255,255,255,.65);letter-spacing:.06em;font-weight:600;">Generated ${dateStr}</div>
        <div style="width:1px;height:14px;background:rgba(255,255,255,.2);"></div>
        <div style="font-family:monospace;font-size:10px;color:rgba(255,255,255,.5);letter-spacing:.08em;">${elapsedStr}</div>
      </div>
    </div>
    </div>
    <div style="width:100%;">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden;margin-bottom:12px;">
        ${agentPages.map(ag => `
          <div style="background:rgba(255,255,255,${ag.wave==='2'?'.07':'.05'});padding:12px 14px;">
            <div style="font-family:monospace;font-size:6px;color:rgba(${ag.wave==='2'?'184,92,56,.6':'255,255,255,.3'});letter-spacing:.14em;margin-bottom:6px;">AGENT ${ag.num} · WAVE ${ag.wave}</div>
            <div style="font-size:9px;color:rgba(255,255,255,.85);font-weight:600;line-height:1.3;">${ag.title}</div>
          </div>`).join('')}
        <div style="background:rgba(184,92,56,.18);padding:12px 14px;">
          <div style="font-family:monospace;font-size:6px;color:rgba(184,92,56,.8);letter-spacing:.14em;margin-bottom:6px;">AGENT 10 · WAVE 3</div>
          <div style="font-size:9px;color:#fff;font-weight:700;line-height:1.3;">Executive Synopsis</div>
          <div style="font-size:7px;color:rgba(255,255,255,.4);margin-top:3px;">Opus 4.6 · Full synthesis</div>
        </div>
      </div>

    </div>
  </div>
</div>

${sourcesHtml}
${synopsisHtml}
${agentPageHtml}

</body>
</html>`;
}

function makePrompt(id, company, acquirer, ctx, synthCtx, market="India") {
  let prompt = PROMPTS[id] || "";
  prompt = prompt.replace(/\[COMPANY\]/g, company);

  // Acquirer substitution — graceful fallback when blank
  const acqName    = acquirer && acquirer.trim() ? acquirer.trim() : null;
  const acqOrMgmt  = acqName || "the management team";
  const acqOrOwner = acqName || "the parent company";
  const hasAcquirer = !!acqName;
  prompt = prompt.replace(/\[ACQUIRER\]/g, acqOrMgmt);
  prompt = prompt.replace(/\[ACQUIRER_OR_OWNER\]/g, acqOrOwner);
  prompt = prompt.replace(/\[HAS_ACQUIRER\]/g, hasAcquirer ? "yes" : "no");
  
  // Build dynamic preamble based on whether an acquirer is provided
  const acquirerBlock = acqName ? `
ACQUISITION CONTEXT:
This is a post-acquisition analysis. [COMPANY] was acquired by ${acqName}. Frame every finding as an opportunity enabled by this acquisition. Do not write about acquisition risks or integration challenges — only advantages and actions.
` : `
COMPANY CONTEXT:
This is a standalone company analysis — there is no acquirer. Focus purely on ${company}'s own growth levers, competitive position, and strategic options. Do not reference any parent company or acquirer.
`;

  const isYogabar = company.toLowerCase().includes('yogabar') || company.toLowerCase().includes('yoga bar');
  const currencyLabel = market === 'US' ? '$M (USD millions)' : market === 'Global' ? '$M (USD millions)' : '₹ Cr (Indian Rupees Crore)';
  const currencySymbol = market === 'US' || market === 'Global' ? '$' : '₹';
  const currencyUnit = market === 'US' || market === 'Global' ? 'M' : 'Cr';
  const channelTerms = market === 'US'
    ? 'E-commerce / Mass Retail (Walmart, Target, Costco) / Club / Convenience / Foodservice / DTC / Quick Commerce (Instacart, DoorDash)'
    : market === 'Global'
    ? 'E-commerce / Modern Trade / General Trade / DTC / Foodservice / Export'
    : 'Modern Trade / General Trade / Quick Commerce (Blinkit, Zepto, Swiggy Instamart) / D2C / E-commerce / Institutional';

  const NARRATIVE_RULES = acquirerBlock + `VERIFIED FINANCIAL DATA:
If specific revenue or financial figures are provided in the USER CONTEXT below, treat them as ground truth — do not contradict or estimate differently. If no figures are provided, find them through web search.

MARKET & CURRENCY: This analysis is for the ${market} market. Use ${currencyLabel} for ALL revenue figures throughout. Never mix currencies. Channel terminology for this market: ${channelTerms}. Do not reference channels, competitors, or metrics from other markets unless explicitly comparing.

Do NOT mention any individual person's name (e.g. founders, executives) in your analysis. This is a company analysis, not a people analysis.

WRITING STYLE — MANDATORY FOR EVERY AGENT:

You write in dense, precise prose — not bullet points, not numbered lists, not sub-bullets.

Prose means: paragraphs. Each paragraph makes one argument, develops it with evidence, and lands on an implication. Numbers and data points appear inside sentences. "QC revenue is growing at 80% YoY" is not a bullet — it is a clause inside a sentence that explains what it means and what follows from it.

Why no bullets: Bullet points fragment analysis. They hide the logic chain. A reader can scan bullets without understanding anything. Every sentence in this report should give the reader a fact they did not have, explain what it means, or tell them what to do because of it.

Never write bullet lists, numbered lists, or "Key findings:" headers. Write in paragraphs only. HTML tables permitted only for structured comparisons.

CONFIDENCE LABELLING — MANDATORY FOR EVERY NUMBER:

Every number, estimate, or data claim must carry a confidence label inline using this exact format:
- [HIGH CONFIDENCE] — directly from a cited source (web search result, public filing, industry report)
- [MEDIUM CONFIDENCE] — triangulated from 2+ indirect signals or estimated from comparable data
- [LOW CONFIDENCE] — logical inference or single unverified signal; treat as directional only

The label appears in brackets immediately after the number in the same sentence.

Every number needs: [HIGH CONFIDENCE — source], [MEDIUM CONFIDENCE — basis], or [LOW CONFIDENCE — basis] immediately after it. Never state a number without a confidence label.

SHOWING YOUR CALCULATIONS — MANDATORY FOR REVENUE AND MARKET SIZE ESTIMATES:

When you state or derive a revenue figure, market size, growth rate, or financial projection, you must show the calculation inline, in the same sentence or the one immediately following. This is not optional footnoting — it is the sentence itself.

Format: state the figure, then on the next line: "Calculation: [starting point] × [factor] = [result]" or "Source: [name, date]." Direct citations need no calculation.

WEB SEARCH BUDGET — YOU HAVE 2 SEARCHES MAXIMUM:

You have exactly 2 web searches. Use them on the 2 highest-value queries — the ones that will give you the most specific, sourced numbers that cannot be estimated from general knowledge. Prioritise: company-specific revenue or growth data, a named industry report figure, or a specific competitor data point. Do not waste a search on something you can estimate confidently. Make every search count.

LENGTH AND COMPLETION — CRITICAL:

Your analysis must be COMPLETE. Never stop mid-sentence or mid-section. You have ample token budget — use it fully. If you are running long, tighten prose rather than dropping sections. Always finish the final section with a complete sentence. A truncated analysis is a failed analysis. Target 700–1000 words of dense prose. Cut repetition before cutting conclusions. For Synopsis: you may write up to 1500 words — completeness takes priority over brevity.

DO NOT REPEAT WHAT OTHER AGENTS COVER:

You are one of 10 specialist agents. Do not write about topics that belong to another agent's mandate:
- Market sizing and category growth → Agent 1 (market)
- SKU mix and portfolio decisions → Agent 2 (portfolio)  
- Brand positioning and consumer → Agent 3 (brand)
- Margins and unit economics → Agent 4 (margins)
- Channel strategy and GTM → Agent 5 (growth)
- Competitor moves → Agent 6 (competitive)
- Acquirer synergies and integration → Agent 7 (synergy)
- D2C platform and new brands → Agent 8 (platform)
- Global benchmarks → Agent 9 (intl)
Stay strictly within your mandate. Cross-reference another agent only when directly relevant, in one sentence.

NEVER SHOW YOUR REASONING PROCESS: Do not write sentences like "I'll conduct targeted searches", "Based on my research I can now", "Let me structure this", or "---" dividers. Begin immediately with analysis content. No preamble, no meta-commentary, no closing remarks.

NO NEGATIVES ABOUT THE ACQUISITION: Every finding must be an opportunity, advantage, or action. Frame difficulties as "the priority investment area." The acquisition is unambiguously positive.

PROSE vs VISUAL — CRITICAL DIVISION OF LABOUR:

Your response has two parts: a DATA_BLOCK (charts/numbers) and prose analysis. They must never duplicate each other.

The DATA_BLOCK shows the WHAT — numbers, comparisons, growth rates, rankings. The reader sees those visually before reading prose.

The prose explains the SO WHAT and THEREFORE — the reasoning, implication, non-obvious insight, strategic consequence.

NEVER restate in prose any number already in your DATA_BLOCK. Instead explain: why the gap exists, whether it is widening or narrowing, what it means for the next 18 months, and what the right response is.

The test for every sentence: if it could be replaced by pointing at a chart bar, delete it and write the insight the chart cannot show.

Prose covers what charts cannot: the reasoning chain behind a trend; the structural force explaining the numbers; the specific action with timing; the caveat the chart flattens; the global analog that reframes the data; why this matters now not in 12 months.

DATA_BLOCK — WRITE THIS FIRST, BEFORE YOUR PROSE:

Begin your response with this block. Write the JSON, then write your prose analysis after it.
Why first: if your response is long, the block must not get cut off. Writing it first guarantees it is always present.
Use exact delimiters. No code fences. No backticks around the block.

<<<DATA_BLOCK>>>
{
  "agent": "[market|portfolio|brand|margins|growth|competitive|synergy|platform|intl|synopsis]",
  "kpis": [
    {"label": "short label", "value": "display value", "sub": "context", "trend": "up|down|flat|watch", "confidence": "H|M|L"}
  ],
  "verdictRow": {
    "dimension": "your agent dimension",
    "verdict": "STRONG|WATCH|OPTIMISE|UNDERDELIVERED|RISK",
    "finding": "one sentence — single most important finding",
    "confidence": "H|M|L"
  },
  "topActions": [
    {"action": "specific action", "impact": 0, "speed": 0, "confidence": "H|M|L"}
  ]
}
<<<END_DATA_BLOCK>>>

DATA_BLOCK rules:
— Write it first. Your prose analysis comes after <<<END_DATA_BLOCK>>>.
— Never wrap in a code fence. No backticks.
— Every field required. Use null for unknown values — never omit a field.
— topActions: impact and speed are integers 0–100. Minimum 3 actions.
— kpis: minimum 4 KPIs. Values must match what you will say in prose.
— JSON must be valid. No trailing commas. No comments inside JSON.
— Do not repeat or summarise the DATA_BLOCK in your prose.

INTERNAL CONSISTENCY — MANDATORY:

If you report individual brand growth rates that differ significantly from a category CAGR, you must explain the discrepancy. Show what segment or cohort the company competes in vs the broader category. Never report two conflicting growth numbers without explaining which segment each belongs to.

`;

  if (ctx) {
    prompt = NARRATIVE_RULES + `USER CONTEXT:
${ctx}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

` + prompt;
  } else {
    prompt = NARRATIVE_RULES + prompt;
  }
  
  if (synthCtx && Object.keys(synthCtx).length > 0) {
    const agentNames = {
      market:      'AGENT 1: MARKET POSITION & CATEGORY DYNAMICS',
      portfolio:   'AGENT 2: PORTFOLIO STRATEGY & SKU RATIONALIZATION',
      brand:       'AGENT 3: BRAND POSITIONING & STORYTELLING',
      margins:     'AGENT 4: MARGIN IMPROVEMENT & UNIT ECONOMICS',
      growth:      'AGENT 5: GROWTH STRATEGY & CHANNEL ORCHESTRATION',
      competitive: 'AGENT 6: COMPETITIVE BATTLE PLAN',
      synergy:     'AGENT 7: SYNERGY PLAYBOOK & INSTITUTIONAL LEVERAGE',
      platform:    'AGENT 9: PLATFORM EXPANSION & D2C BRAND INCUBATOR',
      intl:        'AGENT 10: INTERNATIONAL BENCHMARKS & GLOBAL PLAYBOOK',
      synopsis:    'EXECUTIVE SYNOPSIS',
    };
    
    let priorContext = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPRIOR AGENT OUTPUTS (FOR SYNTHESIS)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    Object.entries(synthCtx).forEach(([agentId, result]) => {
      const agentName = agentNames[agentId] || agentId.toUpperCase();
      // Strip DATA_BLOCK before passing to synopsis — saves tokens, synopsis doesn't need raw JSON
      const withoutBlock = result.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '').trim();
      // Trim to 1500 chars — enough for synthesis, safe for rate limits
      const trimmed = withoutBlock.length > 1500
        ? withoutBlock.slice(0, 1500) + '\n[...truncated — full analysis in report sections]'
        : withoutBlock;
      priorContext += `${agentName}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${trimmed}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    });
    
    prompt = priorContext + prompt;
  }
  
  return prompt;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARKDOWN FORMATTING FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function md(text) {
  if (!text) return "";
  
  // Strip reasoning preamble lines that agents sometimes output
  text = text.replace(/^[^\n]*(?:I'll conduct|I will conduct|Let me|Based on my research|I need to|I'll search|I'll analyze|I'll now|I'll begin|I'll start)[^\n]*\n/gim, '');
  text = text.replace(/^#{1,2}\s*$/gm, ''); // remove empty headers left behind

  // First, fix the Sources line to ensure it's on one line
  let fixedText = text.replace(/\*\*Sources:\*\*([^\n]*(?:\n(?!\n)[^\n]*)*)/g, (match, sources) => {
    const cleaned = sources.replace(/\n/g, ', ').replace(/,\s*,/g, ',').trim();
    return `**Sources:** ${cleaned}`;
  });
  
  // Remove markdown heading
  fixedText = fixedText.replace(/^#+\s*(?:AGENT\s*\d+[:\s—-]*)?(?:EXECUTIVE SYNOPSIS|Executive Synopsis)\s*\n/gim, '');
  fixedText = fixedText.replace(/^#+\s*AGENT\s*\d+[:\s:—-]+[^\n]+\n/gim, '');
  
  // Check if this is synopsis content (has THE VERDICT)
  const isSynopsis = fixedText.includes('**THE VERDICT**');
  
  if (isSynopsis) {
    // Handle synopsis with special layout
    let html = '';
    
    // Extract THE VERDICT
    const verdictMatch = fixedText.match(/(?:THE RECOMMENDATION|THE VERDICT)[:\s—]*\n([\s\S]+?)(?=\n◉|\n##|$)/i);
    if (verdictMatch) {
      const vClean = verdictMatch[1].trim().replace(/\n\n/g,' ').replace(/\n/g,' ');
      html += `<div class="verdict-box">
        <div class="verdict-label" style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1a3325;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #3d6b54;">THE RECOMMENDATION</div>
        <p class="verdict-text">${vClean.replace(/\*\*(.+?)\*\*/g,'<strong style="color:#ede6d6">$1</strong>')}</p>
      </div>`;
    }
    
    // Extract all ◉ sections
    const sections = [];
    const sectionRegex = /◉ ([A-Z\s&]+)\s*\n(.+?)(?=\n◉|$)/gs;
    let match;
    while ((match = sectionRegex.exec(fixedText)) !== null) {
      const rawContent = match[2].trim()
        .replace(/\[HIGH CONFIDENCE[^\]]*\]/gi, '<span class="conf-high">✓ High</span>')
        .replace(/\[MEDIUM CONFIDENCE[^\]]*\]/gi, '<span class="conf-medium">~ Medium</span>')
        .replace(/\[LOW CONFIDENCE[^\]]*\]/gi, '<span class="conf-low">⚠ Low</span>');
      sections.push({ title: match[1].trim(), content: rawContent });
    }
    
    // Wave 1: First 4 sections in 2x2 grid
    if (sections.length >= 4) {
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:12px">';
      for (let i = 0; i < 4; i++) {
        html += `<div style="padding:10px 12px;background:white;border:1px solid #3d6b54;border-left:4px solid #3d6b54;margin-bottom:2px">
          <div style="font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1a3325;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #d4c4a8">◉ ${sections[i].title}</div>
          <p style="font-size:8.5px;line-height:1.4;color:#3d3020;margin:0">${sections[i].content}</p>
        </div>`;
      }
      html += '</div>';
    }
    
    // Wave 2: Remaining sections row-wise
    for (let i = 4; i < sections.length; i++) {
      html += `<div style="margin-bottom:6px;padding:10px 12px;background:white;border:1px solid #3d6b54;border-left:4px solid #3d6b54">
        <div style="font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1a3325;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #d4c4a8">◉ ${sections[i].title}</div>
        <p style="font-size:9px;line-height:1.4;color:#3d3020;margin:0">${sections[i].content}</p>
      </div>`;
    }
    
    return html;
  }
  
  // Convert confidence labels to inline badges
  fixedText = fixedText
    .replace(/\[HIGH CONFIDENCE[^\]]*\]/gi,   '<span class="conf-high">✓ High</span>')
    .replace(/\[MEDIUM CONFIDENCE[^\]]*\]/gi, '<span class="conf-medium">~ Medium</span>')
    .replace(/\[LOW CONFIDENCE[^\]]*\]/gi,    '<span class="conf-low">⚠ Low</span>')
    .replace(/\[HIGH\]/gi,   '<span class="conf-high">✓ High</span>')
    .replace(/\[MEDIUM\]/gi, '<span class="conf-medium">~ Medium</span>')
    .replace(/\[LOW\]/gi,    '<span class="conf-low">⚠ Low</span>');

  // Regular content (agent analysis)
  // Special case: if content starts with ##, don't add opening <p> tag
  const startsWithHeader = fixedText.trim().startsWith('##');
  const openTag = startsWithHeader ? '' : '<p style="margin:6px 0;">';
  const closeTag = startsWithHeader ? '' : '</p>';
  
  // Extract HTML tables before processing — preserve them verbatim
  const tablePlaceholders = [];
  fixedText = fixedText.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
    const ph = `__TABLE_${tablePlaceholders.length}__`;
    tablePlaceholders.push(match);
    return ph;
  });

  let rendered = openTag + fixedText
    .replace(/^## (.+)$/gm, `</p><h3 class="agent-section-header" style="font-family:'Libre Baskerville',serif;font-size:14px;font-weight:700;color:${P.forest};margin:16px 0 6px;border-bottom:2px solid ${P.sand};padding-bottom:4px;">$1</h3><p style="margin:6px 0;">`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${P.ink};">$1</strong>`)
    .replace(/^- (.+)$/gm, `<div style="display:flex;gap:7px;margin:3px 0;"><span style="color:${P.terra};">▸</span><span>$1</span></div>`)
    .replace(/\n\n/g, `</p><p style="margin:6px 0;">`)
    .replace(/\n/g, " ") + closeTag;

  // Restore tables
  tablePlaceholders.forEach((table, i) => {
    rendered = rendered.replace(`__TABLE_${i}__`, `</p><div style="margin:14px 0;overflow-x:auto;">${table}</div><p style="margin:6px 0;">`);
  });

  return rendered;
}

// ── DataBlock Inspector — diagnostic component, screen-only ──────────────────
function DataBlockInspector({ agentId, agentLabel, db }) {
  const [open, setOpen] = useState(false);

  if (!db) return (
    <div style={{ marginTop: 24, padding: '10px 14px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}>
      <span style={{ fontWeight: 700, color: '#856404' }}>⚠ DataBlock Inspector:</span>
      <span style={{ color: '#856404', marginLeft: 8 }}>No DATA_BLOCK parsed for <strong>{agentId}</strong> — agent did not output the schema or parsing failed.</span>
    </div>
  );

  const verdict = db.verdictRow?.verdict || '—';
  const verdictColor = { STRONG: '#28a745', WATCH: '#fd7e14', OPTIMISE: '#007bff', UNDERDELIVERED: '#dc3545', RISK: '#dc3545' }[verdict] || '#6c757d';
  const agentFields = Object.keys(db).filter(k => !['agent','kpis','verdictRow','topActions'].includes(k));
  const fieldStatuses = agentFields.map(field => {
    const val = db[field];
    const isEmpty = !val || (Array.isArray(val) && val.length === 0) ||
      (Array.isArray(val) && val.every(item =>
        typeof item === 'object' && Object.values(item).every(v =>
          v === 0 || v === null || v === '' ||
          v === 'H|M|L' || v === 'STRONG|WATCH|OPTIMISE|UNDERDELIVERED|RISK' ||
          v === 'channel|product|campaign|strategic' || v === 'build|partner|acquire' ||
          v === 'activated|partial|untapped' || v === 'STAR|CASHCOW|QUESTION|DOG' ||
          v === 'KILL|KEEP|GROW|BUILD'
        )
      ));
    return { field, isEmpty };
  });
  const allFilled = fieldStatuses.every(f => !f.isEmpty);

  return (
    <div style={{ marginTop: 24, border: '1px solid #dee2e6', borderRadius: 6, overflow: 'hidden', fontFamily: 'monospace' }}>
      {/* Header — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: allFilled ? '#e8f5e9' : '#fff8e1', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: 13 }}>{allFilled ? '✅' : '⚠️'}</span>
        <span style={{ fontWeight: 700, fontSize: 11, color: '#333' }}>DataBlock Inspector — {agentId}</span>
        <span style={{ marginLeft: 6, fontSize: 11, background: verdictColor, color: '#fff', borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>{verdict}</span>
        <span style={{ marginLeft: 6, fontSize: 10, color: '#666' }}>
          {db.kpis?.length || 0} KPIs · {agentFields.length} visual fields · {allFilled ? 'all populated' : `${fieldStatuses.filter(f => f.isEmpty).length} field(s) empty/unfilled`}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#666' }}>{open ? '▲ hide' : '▼ inspect'}</span>
      </div>

      {open && (
        <div style={{ padding: '12px 14px', background: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>

          {/* KPIs */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>KPIs</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(db.kpis || []).map((k, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 4, padding: '4px 8px', fontSize: 10 }}>
                  <span style={{ color: '#888' }}>{k.label}: </span>
                  <span style={{ fontWeight: 700, color: '#333' }}>{k.value}</span>
                  <span style={{ marginLeft: 4, fontSize: 9, color: k.confidence === 'H' ? '#28a745' : k.confidence === 'M' ? '#fd7e14' : '#dc3545' }}>[{k.confidence}]</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual field status */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>Visual Fields</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {fieldStatuses.map(({ field, isEmpty }) => (
                <span key={field} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: isEmpty ? '#fff3cd' : '#d4edda', color: isEmpty ? '#856404' : '#155724', border: `1px solid ${isEmpty ? '#ffc107' : '#c3e6cb'}` }}>
                  {isEmpty ? '⚠' : '✓'} {field}
                </span>
              ))}
            </div>
          </div>

          {/* Verdict */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>Verdict</div>
            <div style={{ fontSize: 11, color: '#333' }}>
              <span style={{ fontWeight: 700, color: verdictColor }}>{verdict}</span>
              <span style={{ marginLeft: 8 }}>{db.verdictRow?.finding || '—'}</span>
            </div>
          </div>

          {/* Raw JSON */}
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 10, color: '#666', cursor: 'pointer', fontWeight: 700 }}>Raw JSON (full DATA_BLOCK)</summary>
            <pre style={{ fontSize: 10, background: '#fff', border: '1px solid #dee2e6', borderRadius: 4, padding: 10, marginTop: 6, overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(db, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function AdvisorSprint() {
  const [company, setCompany] = useState("Yogabar");
  const [acquirer, setAcquirer] = useState("ITC Limited");
  const [context, setContext] = useState(`COMPANY: Yogabar
ACQUIRER: ITC Limited
ACQUISITION: 2022 (ITC acquired majority stake; full acquisition to be completed progressively)
ANALYSIS DATE: 2026 — 3 years post-acquisition

VERIFIED FINANCIALS:
- FY24 revenue: ₹110 Cr
- FY25 revenue: ₹201 Cr (83% YoY growth — verified)
- FY26 internal target: ₹350 Cr
- Gross margin: ~45–48% (estimate — agents must verify)
- Channel mix: ~65% E-commerce/D2C, ~30% Modern Trade, ~5% General Trade (estimate — agents to verify)
- Quick Commerce (Blinkit, Zepto, Swiggy Instamart): growing fast, exact % unknown
- Manufacturing: predominantly co-packers, some ITC plant trials underway

PORTFOLIO (verify current SKU count and performance through search):
- Hero SKUs: Muesli, Protein Bars, Oats, Wholegrain Breakfast Biscuits
- Price range: ₹35 (single bar) to ₹600+ (large format muesli)
- Premium tier: Protein bars ₹80–120, Muesli ₹350–550
- Workhorse tier: Oats, breakfast biscuits ₹80–200

BRAND:
- Positioning: "Real Ingredients, No Compromise" — clean label, functional nutrition
- Core consumer: Urban millennial, 25–40, health-conscious, willing to pay premium
- Built on D2C authenticity — founder story, ingredient transparency, community

ITC INSTITUTIONAL ASSETS (agents should assess which are actually activatable):
- 4M+ retail outlets (GT reach — but wrong channel for Yogabar's premium positioning)
- Modern Trade relationships and shelf negotiation muscle
- ITC Life Sciences & Technology Centre (R&D — clinical validation capability)
- Agri Business Division (clean-label ingredient sourcing — cashews, oats, spices)
- ITC Hotels (premium sampling/gifting channel)
- ITC export infrastructure (GCC, UK, US — Indian diaspora markets)
- Manufacturing scale (when volume justifies plant move)

COMPETITORS (seeds only — Agent 1 must discover current set through research):
Whole Truth Foods, True Elements, RiteBite Max Protein, Super You, MuscleBlaze,
Kellogg's (Special K, muesli), Baggry's, Tata Consumer Products Soulfull

SPECIFIC QUESTIONS (every agent should address their relevant piece):
1. How does Yogabar sustain >60% growth?
2. What is the portfolio for the future — what to kill, keep, and launch?
3. What is the brand and selling story — the actual narrative, not a framework?
4. How do we improve margins — COGS, channel mix, manufacturing?
5. Where does growth come from — which channels, which formats, which geographies?
6. Why should the leadership team believe each recommendation — show the logic chain?

STRATEGIC CONTEXT:
- QC (Blinkit/Zepto) is the fastest-growing channel and most margin-accretive
- Modern Trade is critical for scale but risks brand dilution if priced down
- D2C CAC rising — the pure D2C growth model is showing strain
- General Trade largely untapped — ITC's core strength but wrong fit today

OUTPUT STANDARD:
- Every number must be sourced or estimated with methodology shown
- Do not invent data — if unavailable, say so and show estimation logic
- Logic chain mandatory: DATA → INSIGHT → RECOMMENDATION for every major point
- No filler phrases: "compelling opportunity", "well-positioned", "significant potential"
- Two dense pages per agent — stop when nothing non-obvious remains`);

  const [appState, setAppState] = useState("idle");
  const [testMode, setTestMode] = useState(false);
  const [market, setMarket] = useState("India"); // India | US | Global // TEST MODE: runs only Agent 1 (market) to verify visuals cheaply
  const [results, setResults] = useState({});
  const [dataBlocks, setDataBlocks] = useState({});
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sources, setSources] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [elapsed, setElapsed] = useState(0);
  // Removed unused state: pdfs, setPdfs, userName, setUserName, showDash, setShowDash
  
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    loadGA4();
    return () => style.remove();
  }, []);

  const callClaude = useCallback(async (prompt, agentId, signal) => {
    // MOCK mode — return canned response
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 1500));
      const mockId = AGENTS.find(a =>
        (a.id === 'market'      && prompt.includes('MARKET POSITION')) ||
        (a.id === 'portfolio'   && prompt.includes('PORTFOLIO')) ||
        (a.id === 'brand'       && prompt.includes('BRAND POSITIONING')) ||
        (a.id === 'margins'     && prompt.includes('MARGIN IMPROVEMENT')) ||
        (a.id === 'growth'      && prompt.includes('GROWTH STRATEGY')) ||
        (a.id === 'competitive' && prompt.includes('COMP')) ||
        (a.id === 'synergy'     && prompt.includes('SYNERGY')) ||
        (a.id === 'synopsis'    && prompt.includes('EXECUTIVE SYNOPSIS')) ||
        (a.id === 'platform'    && prompt.includes('D2C BRAND INCUBATOR')) ||
        (a.id === 'intl'        && prompt.includes('INTERNATIONAL BENCHMARKS'))
      )?.id || 'market';
      return MOCK[mockId] || MOCK.market;
    }

    // Real mode — retry once on network error or rate limit
    // Synopsis uses Opus and takes 3-4 min — QUIC protocol errors are common on long streams
    const attemptFetch = () => fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tool-name': 'advisor',
        'Connection': 'keep-alive',
      },
      signal,
      body: JSON.stringify({ prompt, agentId, market }),
    });

    let res;
    try {
      res = await attemptFetch();
    } catch (networkErr) {
      // Network error (ERR_QUIC_PROTOCOL_ERROR etc) — wait 8s and retry once
      if (signal.aborted) throw networkErr;
      console.warn(`[${agentId}] Network error, retrying in 8s:`, networkErr.message);
      setStatuses(s => ({ ...s, [agentId]: 'retrying…' }));
      await new Promise(r => setTimeout(r, 8000));
      if (signal.aborted) throw networkErr;
      res = await attemptFetch();
    }
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(err || `Server error: ${res.status}`);
    }

    // Read the SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) { reader.cancel(); break; }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'chunk')     fullText += event.text;
          if (event.type === 'searching') setStatuses(s => ({ ...s, [agentId]: `searching: ${event.query.slice(0,40)}…` }));
          if (event.type === 'done') {
            fullText = event.text || fullText;
          }
          if (event.type === 'source' && event.url) {
            setSources(prev => {
              if (prev.find(s => s.url === event.url)) return prev;
              return [...prev, { url: event.url, title: event.title, agent: event.agent }].slice(0, 100);
            });
          }
          if (event.type === 'error') {
            if (event.message?.includes('rate_limit')) throw new Error('RATE_LIMIT:' + event.message);
            throw new Error(event.message);
          }
        } catch (e) {
          if (e.message && !e.message.startsWith('JSON')) throw e;
        }
      }
    }

    return fullText;
  }, [setSources, setStatuses]); // callClaude has no dependencies - uses only parameters and constants

  const runAgent = useCallback(async (id, prompt, signal, docs) => {
    try {
      const text = await callClaude(prompt, id, signal);
      if (!signal.aborted) {
        // Strip DATA_BLOCK from display — keep only prose for reader
        const dbMatch = text.match(/<<<DATA_BLOCK>>>[\s\S]*?```json([\s\S]*?)```[\s\S]*?<<<END_DATA_BLOCK>>>|<<<DATA_BLOCK>>>([\s\S]*?)<<<END_DATA_BLOCK>>>/);
        const cleanText = text.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '').trim();
        if (dbMatch) {
          try {
            const raw = (dbMatch[1] || dbMatch[2] || '').trim();
            const cleaned = raw.replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
            const parsed = JSON.parse(cleaned);
            setDataBlocks(d => ({ ...d, [id]: parsed }));
            console.log('[DataBlock] parsed OK:', id);
          } catch(e) {
            console.warn('[DataBlock] parse failed:', id, e.message);
            // Fallback: create minimal dataBlock so visuals still render
            setDataBlocks(d => ({ ...d, [id]: {
              agent: id,
              kpis: [{ label: 'Analysis', value: '✓', sub: 'See prose below', trend: 'flat', confidence: 'M' }],
              verdictRow: { dimension: id, verdict: 'WATCH', finding: 'DATA_BLOCK parse failed — see full analysis below', confidence: 'L' },
              topActions: [{ action: 'Review full analysis below', impact: 50, speed: 50, confidence: 'L' }]
            }}));
          }
        } else {
          console.warn('[DataBlock] not found in response:', id);
          // Fallback: minimal block so page still renders
          setDataBlocks(d => ({ ...d, [id]: {
            agent: id,
            kpis: [{ label: 'Analysis Complete', value: '✓', sub: 'Data block not generated', trend: 'flat', confidence: 'L' }],
            verdictRow: { dimension: id, verdict: 'WATCH', finding: 'Structured data not available — full analysis in prose below', confidence: 'L' },
            topActions: [{ action: 'Review full prose analysis below', impact: 50, speed: 50, confidence: 'L' }]
          }}));
        }
        setResults(r => ({ ...r, [id]: cleanText }));
        setStatuses(s => ({ ...s, [id]: "done" }));
        gaEvent("agent_completed", { agent: id, company, chars: text.length });
      }
      return text;
    } catch (e) {
      if (e.name === "AbortError") return "";
      setStatuses(s => ({ ...s, [id]: "error" }));
      setResults(r => ({ ...r, [id]: `Error: ${e.message}` }));
      throw e; // propagate — sprint loop must know an agent failed
    }
  }, [company, callClaude]);

  const runSprint = async () => {
    if (!company.trim() || appState === "running") return;
    if (abortRef.current) abortRef.current.abort(); // kill any zombie from previous run

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const signal = ctrl.signal;
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    
    setAppState("preparing");
    setResults({});
    setSources([]);
    setElapsed(0);

    // Wake Render backend — free tier sleeps after 15min inactivity
    try {
      await Promise.race([
        fetch(API_URL.replace('/api/claude', '/')),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 35000))
      ]);
    } catch (e) { console.warn('wake-up ping:', e.message); }

    const co = company.trim();
    const acq = acquirer.trim();
    const ctx = context.trim();
    
    gaEvent("sprint_launched", {
      company: co,
      user: "anonymous",
      pdfs_uploaded: 0,
      has_context: ctx.length > 0,
    });

    const initStatus = {};
    const agentsToRun = testMode ? ['market'] : AGENTS.map(a => a.id);
    AGENTS.forEach(a => initStatus[a.id] = agentsToRun.includes(a.id) ? "queued" : "idle");
    setStatuses(initStatus);

    try {
      setAppState("running");
      
      // All agents run sequentially — one at a time with gap to respect 30k/min rate limit
      const w1texts = {};
      const ALL_AGENTS_ORDERED = testMode
        ? ['market']  // TEST MODE: single agent to verify visuals cheaply
        : [...W1, ...W2, 'synopsis'];

      for (const id of ALL_AGENTS_ORDERED) {
        if (signal.aborted) break;

        setStatuses(s => ({ ...s, [id]: "running" }));

        // synopsis gets all prior outputs; W2 agents get W1 outputs; W1 gets nothing
        // For synopsis: trim each agent output to 2500 chars to reduce prompt size
        // and avoid QUIC timeout on very long Opus requests
        let ctx_for_agent = {};
        if (id === 'synopsis') {
          const trimmed = {};
          Object.entries(w1texts).forEach(([k, v]) => {
            trimmed[k] = typeof v === 'string' ? v.slice(0, 2500) + (v.length > 2500 ? ' [...truncated for synthesis...]' : '') : v;
          });
          ctx_for_agent = trimmed;
        } else if (W2.includes(id)) {
          ctx_for_agent = w1texts;
        }
        const prompt = makePrompt(id, co, acq, ctx, ctx_for_agent, market);
        let text = "";
        try {
          text = await runAgent(id, prompt, signal, []);
        } catch(agentErr) {
          // Agent failed — stop the sprint, don't run remaining agents
          console.error(`[Sprint] Agent ${id} failed:`, agentErr.message);
          setAppState("error");
          return; // exits runSprint entirely — no more API calls
        }
        w1texts[id] = text;

        // Gap after each agent — keeps tokens under rate limit (skip in test mode)
        if (!signal.aborted && id !== 'synopsis') {
          setStatuses(s => ({ ...s, [id]: "done" }));
          if (!testMode) await new Promise(r => setTimeout(r, 60000));
        }
      }

      if (!signal.aborted) {
        setAppState("done");
        gaEvent("sprint_completed", { company: co, time_seconds: elapsed });
      }

    } catch (e) {
      console.error("Sprint error:", e);
      setAppState("error");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancel = () => {
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setAppState("idle");
    gaEvent("sprint_cancelled", { company, time_seconds: elapsed });
  };

  const downloadPDF = () => {
    gaEvent("pdf_download", { company, user: "anonymous" });
    window.print();
  };

  const generatePDF = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    gaEvent("pdf_generate_puppeteer", { company });
    try {
      const html = buildPDFHtml({ company, acquirer, results, dataBlocks, sources, elapsed, market });
      const pdfRes = await fetch(API_URL.replace('/api/claude', '/api/pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, company, acquirer }),
        signal: AbortSignal.timeout(120000), // 2 min timeout — Puppeteer needs time on cold start
      });
      if (!pdfRes.ok) {
        const err = await pdfRes.json().catch(() => ({ error: 'PDF generation failed' }));
        throw new Error(err.error || `Server error ${pdfRes.status}`);
      }
      const res = pdfRes;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${company.replace(/\s+/g,'_')}_AdvisorSprint_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      console.error('[PDF]', e.message);
      alert(`PDF generation failed: ${e.message}\n\nFalling back to browser print.`);
      window.print();
    } finally {
      setPdfGenerating(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <style>{GLOBAL_CSS}</style>

      {/* PDF Header (hidden on screen, shown in print) */}
      <div className="pdf-header" style={{ display: "none" }}>
        <div style={{ background: P.forest, padding: "14px 20px", borderBottom: `3px solid ${P.forestMid}`, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: P.parchment, letterSpacing: ".03em" }}>
                <span style={{ fontWeight: 400, fontStyle: "italic" }}>Advisor</span><span>Sprint</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: P.parchment, opacity: 0.9 }}>
                PARALLEL AGENT INTELLIGENCE
              </div>
            </div>
            <div style={{ background: P.terra, color: P.white, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", padding: "5px 12px", borderRadius: 12 }}>
              HARSHA BELAVADY
            </div>
          </div>
        </div>
      </div>

      {/* Main UI (hidden in print) */}
      <div className="no-print">
        {/* Header */}
        <div style={{ background: P.forest, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${P.forestMid}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: P.parchment, letterSpacing: ".03em" }}>
              <i style={{ fontWeight: 400 }}>Advisor</i>Sprint
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: `${P.parchment}90` }}>
              PARALLEL AGENT INTELLIGENCE
            </div>
          </div>
          <div style={{ background: P.terra, color: P.white, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", padding: "5px 12px", borderRadius: 12 }}>
            HARSHA BELAVADY
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
          
          {/* Input Section */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: P.inkMid, marginBottom: 8 }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={appState === "running"}
                  placeholder="e.g. Yogabar"
                  style={{ width: "100%", padding: "10px 14px", border: `2px solid ${P.sand}`, borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 15, background: P.white }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: P.inkMid, marginBottom: 8 }}>
                  Acquirer <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: P.inkFaint }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={acquirer}
                  onChange={(e) => setAcquirer(e.target.value)}
                  disabled={appState === "running"}
                  placeholder="e.g. ITC Limited — leave blank for standalone"
                  style={{ width: "100%", padding: "10px 14px", border: `2px solid ${P.sand}`, borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 15, background: P.white }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: P.inkMid, marginBottom: 8 }}>
                Market
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {["India", "US", "Global"].map(m => (
                  <button
                    key={m}
                    onClick={() => appState !== "running" && setMarket(m)}
                    style={{
                      padding: "9px 20px",
                      border: `2px solid ${market === m ? P.forest : P.sand}`,
                      borderRadius: 4,
                      background: market === m ? P.forest : P.white,
                      color: market === m ? P.white : P.inkMid,
                      fontFamily: "'Instrument Sans'",
                      fontSize: 13,
                      fontWeight: market === m ? 700 : 400,
                      cursor: appState === "running" ? "not-allowed" : "pointer",
                      letterSpacing: ".04em",
                    }}
                  >{m}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: P.inkMid, marginBottom: 8 }}>
                Context & Strategic Questions
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                disabled={appState === "running"}
                rows={12}
                style={{ width: "100%", padding: "10px 14px", border: `2px solid ${P.sand}`, borderRadius: 4, fontFamily: "'JetBrains Mono'", fontSize: 13, background: P.white, lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={runSprint}
                disabled={!company.trim() || appState === "running"}
                style={{ padding: "12px 24px", background: appState === "running" ? P.inkFaint : testMode ? P.gold : P.forest, color: P.white, border: "none", borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 14, fontWeight: 600, cursor: appState === "running" ? "not-allowed" : "pointer" }}
              >
                {appState === "running" ? `Running... ${formatTime(elapsed)}` : testMode ? "▶ Test Run (Agent 1 only)" : "Run Analysis"}
              </button>

              {/* Test mode toggle */}
              <div
                onClick={() => appState !== "running" && setTestMode(m => !m)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: testMode ? `${P.gold}20` : P.parchment, border: `1px solid ${testMode ? P.gold : P.sand}`, borderRadius: 4, cursor: appState === "running" ? "not-allowed" : "pointer", userSelect: "none" }}
                title="Test mode: runs only Agent 1 (Market) to verify visuals cheaply before a full run"
              >
                <div style={{ width: 28, height: 16, background: testMode ? P.gold : P.sand, borderRadius: 8, position: "relative", transition: "background .2s" }}>
                  <div style={{ position: "absolute", top: 2, left: testMode ? 14 : 2, width: 12, height: 12, background: "#fff", borderRadius: "50%", transition: "left .2s" }} />
                </div>
                <span style={{ fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: 600, color: testMode ? P.gold : P.inkFaint }}>
                  Test mode
                </span>
              </div>

              {appState === "running" && (
                <button onClick={cancel} style={{ padding: "12px 24px", background: P.terra, color: P.white, border: "none", borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              )}

              {appState === "done" && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={generatePDF}
                    disabled={pdfGenerating}
                    style={{ padding: "12px 24px", background: pdfGenerating ? "#999" : P.terra, color: P.white, border: "none", borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 14, fontWeight: 600, cursor: pdfGenerating ? "not-allowed" : "pointer" }}>
                    {pdfGenerating ? "⟳ Generating PDF..." : "⬇ Download PDF"}
                  </button>
                  <button
                    onClick={downloadPDF}
                    style={{ padding: "12px 20px", background: "transparent", color: P.inkSoft, border: `1px solid ${P.inkFaint}`, borderRadius: 4, fontFamily: "'Instrument Sans'", fontSize: 12, cursor: "pointer" }}>
                    Browser Print
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {Object.keys(statuses).length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: "grid", gap: 8 }}>
                {AGENTS.map((agent) => {
                  const status = statuses[agent.id];
                  const bgColor = status === "done" ? "#d4f4dd" : status === "running" ? "#fff3cd" : status === "error" ? "#f8d7da" : P.parchment;
                  
                  return (
                    <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: bgColor, borderRadius: 4, border: `1px solid ${P.sand}` }}>
                      <div style={{ fontSize: 18 }}>{agent.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Instrument Sans'", fontSize: 13, fontWeight: 600, color: P.ink }}>{agent.label}</div>
                        <div style={{ fontFamily: "'Instrument Sans'", fontSize: 11, color: P.inkSoft }}>{agent.sub}</div>
                      </div>
                      <div style={{ fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: 600, color: status === "done" ? "#28a745" : status === "running" ? "#fd7e14" : P.inkFaint }}>
                        {status === "done" ? "✓" : status === "running" ? "⟳" : status === "error" ? "✗" : "○"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DataBlock Inspector — visible on screen after agents complete */}
          {Object.keys(dataBlocks).length > 0 && (
            <div style={{ marginTop: 40 }}>
              <div style={{ fontFamily: "'Instrument Sans'", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: P.inkMid, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${P.sand}` }}>
                DataBlock Inspector — Visual Data Verification
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {AGENTS.map((agent) => (
                  dataBlocks[agent.id]
                    ? <DataBlockInspector key={agent.id} agentId={agent.id} agentLabel={agent.label} db={dataBlocks[agent.id]} />
                    : statuses[agent.id] === "done"
                      ? <div key={agent.id} style={{ padding: "8px 14px", background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6, fontFamily: "monospace", fontSize: 11, color: "#856404" }}>
                          ⚠ {agent.id} — completed but no DATA_BLOCK parsed
                        </div>
                      : null
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PDF CONTENT - 16 PAGES WITH BEAUTIFUL FORMATTING */}
<div style={{ display: "none" }} className="print-only">
  
  {/* ENHANCED CSS FOR PDF */}
  <style>{`
    @media print {
      .recommendation-box {
        background: #f0d4c0 !important;
        border-left: 6px solid #b85c38 !important;
        padding: 18px !important;
        margin: 20px 0 !important;
        border-radius: 4px !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .recommendation-title {
        color: #b85c38 !important;
        font-weight: 700 !important;
        font-size: 10px !important;
        letter-spacing: 0.1em !important;
        text-transform: uppercase !important;
        margin-bottom: 10px !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .verdict-box {
        background: white !important;
        border: 3px solid #1a3325 !important;
        border-left: 8px solid #1a3325 !important;
        padding: 25px !important;
        margin: 30px 0 !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .big-number {
        font-size: 28px !important;
        font-weight: 700 !important;
        color: #b85c38 !important;
        font-family: 'Playfair Display', serif !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .insight-box {
        background: #faf8f4 !important;
        border-left: 4px solid #d4724a !important;
        padding: 15px !important;
        margin: 15px 0 !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .section-header {
        border-bottom: 3px solid #1a3325 !important;
        padding-bottom: 12px !important;
        margin-bottom: 20px !important;
        page-break-after: avoid !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      table {
        page-break-inside: avoid !important;
        border-collapse: collapse !important;
        width: 100%;
        font-size: 11px;
      }

      table th {
        background: #2d5040 !important;
        color: #f5f0e8 !important;
        padding: 8px 12px !important;
        font-weight: 700 !important;
        font-size: 10px !important;
        letter-spacing: 0.05em !important;
        text-transform: uppercase !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      table td {
        padding: 7px 12px !important;
        border: 1px solid #d4c4a8 !important;
        color: #1a1208 !important;
        vertical-align: top !important;
        line-height: 1.4 !important;
      }

      table tr:nth-child(even) td {
        background: #faf6ef !important;
      }

      .conf-high {
        display: inline-block !important;
        background: #d4edda !important;
        color: #1a5c35 !important;
        font-size: 7px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        padding: 1px 5px !important;
        border-radius: 2px !important;
        margin-left: 3px !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .conf-medium {
        display: inline-block !important;
        background: #fff3cd !important;
        color: #7a5c00 !important;
        font-size: 7px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        padding: 1px 5px !important;
        border-radius: 2px !important;
        margin-left: 3px !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .conf-low {
        display: inline-block !important;
        background: #fde8d8 !important;
        color: #8b3a1a !important;
        font-size: 7px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        padding: 1px 5px !important;
        border-radius: 2px !important;
        margin-left: 3px !important;
        vertical-align: middle !important;
        white-space: nowrap !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      table {
        width: 100% !important;
        border-collapse: collapse !important;
        font-size: 9px !important;
        margin: 12px 0 !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      th {
        background: #1a3325 !important;
        color: #f5f0e8 !important;
        padding: 7px 10px !important;
        text-align: left !important;
        font-weight: 700 !important;
        font-size: 8.5px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        border: 1px solid #1a3325 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      td {
        padding: 6px 10px !important;
        border: 1px solid #d4c4a8 !important;
        font-size: 9px !important;
        line-height: 1.5 !important;
        vertical-align: top !important;
        color: #3d3020 !important;
      }
      tr:nth-child(even) td {
        background: #faf6ef !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `}</style>

  {/* PAGE 1: COVER */}
  <div style={{ padding: "220px 50px", pageBreakAfter: "always", textAlign: "center", border: `8px solid ${P.forest}`, boxSizing: "border-box", minHeight: "100vh" }}>
    <div style={{ marginBottom: 40 }}>
      <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 42, fontWeight: 700, color: P.forest, marginBottom: 15, letterSpacing: "0.02em" }}>
        {company.toUpperCase()}
      </h1>
      <div style={{ width: 80, height: 4, background: P.terra, margin: "0 auto" }}></div>
    </div>
    
    <p style={{ fontSize: 18, color: P.inkSoft, marginBottom: 12, fontWeight: 500 }}>
      {acquirer.trim() ? `Acquisition Analysis: ${acquirer.trim()} × ${company}` : `Strategic Intelligence Analysis: ${company}`} · 2026
    </p>
    
    <p style={{ fontSize: 13, color: P.inkFaint, marginBottom: 50 }}>
      Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • Completed in {formatTime(elapsed)} minutes
    </p>
    
    <div style={{ background: P.parchment, padding: "25px 30px", borderRadius: 6, maxWidth: 500, margin: "0 auto", border: `1px solid ${P.sand}` }}>
      <p style={{ fontSize: 11, color: P.inkMid, lineHeight: 1.7, margin: 0 }}>
        Strategic synthesis from 10 parallel intelligence agents analyzing market position, portfolio optimization, brand evolution, margin improvement, growth channels, competitive dynamics, operational synergies, and platform expansion opportunities.
      </p>
    </div>
    
    <div style={{ marginTop: 60, fontSize: 9, color: P.inkFaint, textTransform: "uppercase", letterSpacing: "0.15em" }}>
      Advisor Sprint — Strategic Intelligence System
    </div>
  </div>

  {/* PAGE 2: ASSUMPTIONS & SOURCES */}
  <div style={{ padding: "20px 50px 40px 50px", pageBreakAfter: "always" }}>
        <div className="no-screen"><div style={{ background: P.forest, padding: "14px 20px", borderBottom: `3px solid ${P.forestMid}`, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: P.parchment, letterSpacing: ".03em" }}>
                <span style={{ fontWeight: 400, fontStyle: "italic" }}>Advisor</span><span>Sprint</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: P.parchment, opacity: 0.9 }}>
                PARALLEL AGENT INTELLIGENCE
              </div>
            </div>
            <div style={{ background: P.terra, color: P.white, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", padding: "5px 12px", borderRadius: 12 }}>
              HARSHA BELAVADY
            </div>
          </div>
        </div></div>
    <div className="section-header">
      <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, color: P.forest, margin: 0 }}>
        Assumptions & Sources
      </h2>
      <p style={{ fontSize: 11, color: P.inkSoft, marginTop: 8, fontStyle: "italic" }}>
        Data foundation and analytical framework for this analysis
      </p>
    </div>

    <div style={{ background: P.parchment, padding: 20, borderRadius: 4, marginBottom: 25 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: P.forest, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Key Contextual Assumptions
      </h3>
      <p style={{ fontSize: 10, lineHeight: 1.9, color: P.inkMid, margin: 0 }}>
        {acquirer.trim() ? `${acquirer.trim()} acquired ${company} in 2022–23, with this analysis conducted three years post-acquisition (2026). ${company} operates as a separate unit with institutional support from ${acquirer.trim()}.` : `This is a standalone strategic analysis of ${company} conducted in 2026.`}
        Manufacturing remains with co-packers unless otherwise stated in context.
        All market data and performance metrics are discovered through live web search at time of generation — figures reflect the best available public information and are labelled by confidence level throughout.
      </p>
    </div>

    <div style={{ marginBottom: 25 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: P.forest, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Sources Referenced in This Analysis
      </h3>
      {sources.length > 0 ? (
        <div>
          <p style={{ fontSize: 9.5, color: P.inkFaint, marginBottom: 12, fontStyle: "italic" }}>
            The following sources were retrieved by agents during live web search. All searches conducted at time of generation.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 10px", textAlign: "left", border: `1px solid ${P.sand}`, background: P.forest, color: P.white, fontWeight: 600, width: "55%" }}>Source</th>
                <th style={{ padding: "8px 10px", textAlign: "left", border: `1px solid ${P.sand}`, background: P.forest, color: P.white, fontWeight: 600, width: "20%" }}>Agent</th>
                <th style={{ padding: "8px 10px", textAlign: "left", border: `1px solid ${P.sand}`, background: P.forest, color: P.white, fontWeight: 600, width: "25%" }}>Domain</th>
              </tr>
            </thead>
            <tbody>
              {sources.slice(0, 15).map((s, i) => {
                const domain = (() => { try { return new URL(s.url).hostname.replace('www.',''); } catch { return s.url; } })();
                const agentLabel = AGENTS.find(a => a.id === s.agent)?.label?.split(' ')[0] || s.agent;
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? P.white : P.parchment }}>
                    <td style={{ padding: "7px 10px", border: `1px solid ${P.sand}`, color: P.inkMid, wordBreak: "break-word" }}>
                      {s.title && s.title !== s.url ? s.title.slice(0, 80) + (s.title.length > 80 ? '…' : '') : domain}
                    </td>
                    <td style={{ padding: "7px 10px", border: `1px solid ${P.sand}`, color: P.inkFaint, fontSize: 8.5 }}>{agentLabel}</td>
                    <td style={{ padding: "7px 10px", border: `1px solid ${P.sand}`, color: P.terra, fontSize: 8.5 }}>{domain}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sources.length > 15 && (
            <p style={{ fontSize: 9, color: P.inkFaint, marginTop: 8, fontStyle: "italic" }}>
              Total sources retrieved across all agents: {sources.length}. Top 15 shown above.
            </p>
          )}
        </div>
      ) : (
        <div style={{ background: P.parchment, padding: 18, borderRadius: 4, borderLeft: `4px solid ${P.sand}` }}>
          <p style={{ fontSize: 10, color: P.inkFaint, margin: 0, fontStyle: "italic", lineHeight: 1.8 }}>
            This run used MOCK data — no live web search was performed. In a live run, sources retrieved by each agent during web search will appear here as a table with article title, domain, and the agent that fetched them. Each claim in agent outputs is labelled High / Medium / Low confidence with the reasoning shown in brackets.
          </p>
        </div>
      )}
    </div>

    <div style={{ marginTop: 20, padding: 16, background: P.terracream, borderLeft: `4px solid ${P.terra}`, borderRadius: 3 }}>
      <p style={{ fontSize: 9.5, color: P.inkMid, lineHeight: 1.65, margin: 0 }}>
        <strong style={{ color: P.terra }}>On confidence levels:</strong> Every number in this report carries an inline confidence label — High (directly from a cited source), Medium (triangulated from multiple signals), or Low (logical inference, treat as directional). Where data is unavailable, estimates are clearly marked with the reasoning used to derive them.
      </p>
    </div>
  </div>

  {/* PAGE 3: TABLE OF CONTENTS */}
  <div style={{ padding: "20px 50px 40px 50px", pageBreakAfter: "always" }}>
        <div className="no-screen"><div style={{ background: P.forest, padding: "14px 20px", borderBottom: `3px solid ${P.forestMid}`, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: P.parchment, letterSpacing: ".03em" }}>
                <span style={{ fontWeight: 400, fontStyle: "italic" }}>Advisor</span><span>Sprint</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: P.parchment, opacity: 0.9 }}>
                PARALLEL AGENT INTELLIGENCE
              </div>
            </div>
            <div style={{ background: P.terra, color: P.white, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", padding: "5px 12px", borderRadius: 12 }}>
              HARSHA BELAVADY
            </div>
          </div>
        </div></div>
    <div className="section-header">
      <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, color: P.forest, margin: 0 }}>
        Table of Contents
      </h2>
    </div>

    <div style={{ marginTop: 35 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 12 }}>
        <span style={{ fontSize: 9, color: P.inkFaint, fontStyle: "italic", letterSpacing: "0.04em" }}>
          ↑ hover any row to navigate
        </span>
      </div>
      <a href="#section-synopsis" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingBottom: 14, paddingLeft: 10,
          borderBottom: `2px solid ${P.sand}`, borderLeft: `3px solid transparent`,
          marginBottom: 20, textDecoration: "none", cursor: "pointer", transition: "all 0.15s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderLeftColor = P.terra; e.currentTarget.style.background = P.parchment; }}
        onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: P.forest, fontFamily: "'Libre Baskerville', serif" }}>Executive Synopsis</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: P.terra, fontSize: 14, opacity: 0.5 }}>→</span>
        </div>
      </a>

      <div style={{ marginBottom: 16, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.forestSoft }}>
        DETAILED INTELLIGENCE ANALYSIS
      </div>

      {[
        { num: 1,  id: "market",      icon: "◈", title: "Market Position & Category Dynamics",         },
        { num: 2,  id: "portfolio",   icon: "◉", title: "Portfolio Strategy & SKU Rationalization",    },
        { num: 3,  id: "brand",       icon: "◎", title: "Brand Positioning & Storytelling",            },
        { num: 4,  id: "margins",     icon: "◐", title: "Margin Improvement & Unit Economics",         },
        { num: 5,  id: "growth",      icon: "◆", title: "Growth Strategy & Channel Orchestration",     },
        { num: 6,  id: "competitive", icon: "◇", title: "Competitive Battle Plan",                     },
        { num: 7,  id: "synergy",     icon: "◈", title: "Synergy Playbook & Institutional Leverage",   },
        { num: 8,  id: "platform",    icon: "◉", title: "Platform Expansion & D2C Brand Incubator",   },
        { num: 9,  id: "intl",        icon: "◎", title: "International Benchmarks & Global Playbook", },
      ].map((item, idx) => (
        <a key={idx} href={`#section-${item.id}`} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingBottom: 10, paddingTop: 10,
          borderBottom: `1px solid ${P.parchment}`,
          borderLeft: `3px solid transparent`,
          paddingLeft: 10,
          textDecoration: "none",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderLeftColor = P.terra;
          e.currentTarget.style.background = P.parchment;
          e.currentTarget.querySelector('.toc-title').style.color = P.terra;
          e.currentTarget.querySelector('.toc-arrow').style.opacity = '1';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderLeftColor = 'transparent';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.querySelector('.toc-title').style.color = P.inkMid;
          e.currentTarget.querySelector('.toc-arrow').style.opacity = '0.3';
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, color: P.terraSoft, width: 22, flexShrink: 0 }}>{item.icon}</span>
            <span className="toc-title" style={{ color: P.inkMid, fontSize: 12, transition: "color 0.15s ease" }}>
              <span style={{ fontSize: 9, color: P.inkFaint, fontWeight: 600, marginRight: 8, textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>Agent {item.num}</span>
              {item.title}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className="toc-arrow" style={{ color: P.terra, fontSize: 14, opacity: 0.3, transition: "opacity 0.15s ease" }}>→</span>
          </div>
        </a>
      ))}
    </div>

    <div style={{ marginTop: 50, padding: 22, background: P.parchment, borderRadius: 6, textAlign: "center" }}>
      <p style={{ fontSize: 10, color: P.inkSoft, lineHeight: 1.7, margin: 0 }}>
        This report synthesizes insights from 10 parallel intelligence agents, each analyzing a critical dimension of post-acquisition growth strategy. Read the Executive Synopsis for the standalone decision brief, or navigate directly to any section above.
      </p>
    </div>
  </div>

{results.synopsis && (
    <div id="section-synopsis" style={{ padding: "20px 50px 40px 50px" }}>
        <div className="no-screen"><div style={{ background: P.forest, padding: "14px 20px", borderBottom: `3px solid ${P.forestMid}`, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: P.parchment, letterSpacing: ".03em" }}>
                <span style={{ fontWeight: 400, fontStyle: "italic" }}>Advisor</span><span>Sprint</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: P.parchment, opacity: 0.9 }}>
                PARALLEL AGENT INTELLIGENCE
              </div>
            </div>
            <div style={{ background: P.terra, color: P.white, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", padding: "5px 12px", borderRadius: 12 }}>
              HARSHA BELAVADY
            </div>
          </div>
        </div></div>
      <div className="section-header" style={{ marginBottom: 25 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <span style={{ fontSize: 28, color: P.terraSoft }}>◉</span>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, color: P.forest, margin: 0 }}>
              Executive Synopsis
            </h2>
            <p style={{ fontSize: 11, color: P.inkSoft, fontStyle: "italic", marginTop: 6, marginBottom: 0 }}>
              {acquirer.trim() ? `Strategic synthesis — Post-acquisition growth brief` : `Strategic synthesis — Standalone growth brief`}
            </p>
          </div>
        </div>
      </div>
      
      <div 
        className="agent-content" 
        style={{ fontSize: 11.5, lineHeight: 1.85, color: P.inkMid }} 
        dangerouslySetInnerHTML={{ __html: md(results.synopsis) }} 
      />
      
      <div style={{ pageBreakAfter: "always", height: 20 }}></div>
    </div>
  )}

  {/* PAGES 6-14: INDIVIDUAL AGENTS WITH ENHANCED FORMATTING */}
  {AGENTS.filter(a => a.id !== 'synopsis').map((agent, index) => {
    const result = results[agent.id];
    if (!result) return null;
    
    const isLastAgent = index === AGENTS.filter(a => a.id !== 'synopsis').length - 1;
    
    return (
      <div 
        key={agent.id}
        id={`section-${agent.id}`}
        style={{ 
          pageBreakBefore: "always", 
          pageBreakAfter: isLastAgent ? "auto" : "always", 
          padding: "20px 50px 40px 50px" 
        }}
      >
        <div className="no-screen"><div style={{ background: P.forest, padding: "14px 20px", borderBottom: `3px solid ${P.forestMid}`, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, fontWeight: 700, color: P.parchment, letterSpacing: ".03em" }}>
                <span style={{ fontWeight: 400, fontStyle: "italic" }}>Advisor</span><span>Sprint</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: P.parchment, opacity: 0.9 }}>
                PARALLEL AGENT INTELLIGENCE
              </div>
            </div>
            <div style={{ background: P.terra, color: P.white, fontSize: 9, fontWeight: 700, letterSpacing: ".1em", padding: "5px 12px", borderRadius: 12 }}>
              HARSHA BELAVADY
            </div>
          </div>
        </div></div>
        <div className="section-header" style={{ marginBottom: 25, pageBreakAfter: "avoid" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 10 }}>
            <span style={{ fontSize: 28, color: agent.wave === 1 ? P.forestSoft : P.terraSoft }}>
              {agent.icon}
            </span>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20, color: P.forest, margin: 0 }}>
              {agent.label}
            </h2>
          </div>
          <p style={{ fontSize: 11, color: P.inkSoft, fontStyle: "italic", margin: 0, paddingLeft: 43 }}>
            {agent.sub}
          </p>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: agent.wave === 1 ? P.forestSoft : P.terraSoft, marginTop: 10, paddingLeft: 43 }}>
            WAVE {agent.wave} • AGENT {index + 1} OF 10
          </div>
        </div>
        
        <div 
          className="agent-content" 
          data-wave={agent.wave} 
          style={{ fontSize: 11.5, lineHeight: 1.85, color: P.inkMid }} 
          dangerouslySetInnerHTML={{ __html: md(result) }} 
        />

        {/* ── DataBlock Inspector ── diagnostic panel, screen-only ── */}
        <DataBlockInspector agentId={agent.id} agentLabel={agent.label} db={dataBlocks[agent.id]} />

      </div>
    );
  })}
</div>
    </div>
  );
}

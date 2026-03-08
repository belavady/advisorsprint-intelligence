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
      const withoutBlock = typeof result === 'string'
        ? result.replace(/<<<DATA_BLOCK>>>[\s\S]*?<<<END_DATA_BLOCK>>>/g, '').trim()
        : '';
      const trimmed = withoutBlock.slice(0, 2500) + (withoutBlock.length > 2500 ? ' [...truncated for synthesis...]' : '');
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
  // Category map — horizontal bar chart by revenue
  if (db.categoryMap && db.categoryMap.length) {
    h += sectionLabel('Competitive Landscape — Est. Revenue $M');
    const maxRev = Math.max(...db.categoryMap.map(c => c.revenueM||0), 1);
    const posColors = { leader: V.navy, challenger: V.blue, niche: V.inkMid, emerging: V.amber };
    db.categoryMap.forEach(c => {
      const pct = Math.max(((c.revenueM||0)/maxRev)*100, 2);
      const col = posColors[c.position] || V.inkMid;
      h += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <div style="width:90px;font-size:7px;font-weight:600;color:${V.inkMid};flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.competitor}</div>
        <div style="flex:1;position:relative;height:14px;background:${V.sand};border-radius:2px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${col};border-radius:2px;"></div>
          ${pct > 15 ? `<span style="position:absolute;left:4px;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:#fff;">${fmtMoney(c.revenueM)}</span>` : ''}
          ${pct <= 15 ? `<span style="position:absolute;left:${pct+1}%;top:50%;transform:translateY(-50%);font-size:7px;font-weight:700;color:${V.inkMid};">${fmtMoney(c.revenueM)}</span>` : ''}
        </div>
        <span style="font-size:6px;color:${col};font-family:monospace;font-weight:700;width:55px;text-align:right;">${c.position}${c.growth ? ' · +'+c.growth+'%' : ''}</span>
      </div>`;
    });
    h += `<div style="font-size:6.5px;color:${V.inkFaint};margin-top:3px;">Revenue estimates from public signals. Growth = YoY signal.</div>`;
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;font-size:6.5px;letter-spacing:.06em;">Threat</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Probability</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Timeline</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Impact</th>
      </tr></thead><tbody>`;
    db.disintermediationRisks.forEach((r,i) => {
      const impactCol = r.impact === 'existential' ? V.red : r.impact === 'serious' ? V.amber : V.green;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};">${r.threat}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;color:${r.probability==='H'?V.red:r.probability==='M'?V.amber:V.green};">${r.probability}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${r.timeline}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;color:${impactCol};">${r.impact}</td>
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;font-size:6.5px;">Company</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Model</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Est. ACV</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">NRR Signal</th>
      </tr></thead><tbody>`;
    db.pricingComps.forEach((c,i) => {
      const nrrCol = c.nrrSignal === 'strong' ? V.green : c.nrrSignal === 'moderate' ? V.amber : V.red;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${c.company}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};">${c.model}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;">${c.avcEst||c.avgACV||'—'}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;color:${nrrCol};">${c.nrrSignal}</td>
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;font-size:6.5px;">Method</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Estimate</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Confidence</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Basis</th>
      </tr></thead><tbody>`;
    db.arrTriangulation.forEach((m,i) => {
      const confCol = m.confidence === 'H' ? V.green : m.confidence === 'M' ? V.amber : V.red;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${m.method}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:800;color:${V.navy};">${m.estimate}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;color:${confCol};">${m.confidence}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-size:6.5px;">${m.basis}</td>
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;font-size:6.5px;">Segment</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Size</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Retention</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Expansion</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Verdict</th>
      </tr></thead><tbody>`;
    db.segmentMap.forEach((s,i) => {
      const vColors = { engine: V.green, neutral: V.amber, anchor: V.red };
      const vc = vColors[s.verdict] || V.inkMid;
      const sig = v => v === 'strong' ? `<span style="color:${V.green}">●</span>` : v === 'moderate' ? `<span style="color:${V.amber}">●</span>` : `<span style="color:${V.red}">●</span>`;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${s.segment}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${s.sizeEst}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${sig(s.retentionSignal)}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${sig(s.expansionSignal)}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;color:${vc};">${s.verdict}</td>
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;font-size:6.5px;">Competitor</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Revenue</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Attack Vector</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Vulnerability</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Threat</th>
      </tr></thead><tbody>`;
    db.competitorBattlecard.forEach((c,i) => {
      const tc = c.threat === 'H' ? V.red : c.threat === 'M' ? V.amber : V.green;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${c.competitor}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${fmtMoney(c.revenueM)}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-size:6.5px;">${c.attackVector}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-size:6.5px;">${c.vulnerability}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:800;color:${tc};">${c.threat}</td>
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;font-size:6.5px;">Company</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">ARR</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Multiple</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Outcome</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Acquirer</th>
      </tr></thead><tbody>`;
    db.compTable.forEach((c,i) => {
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${c.company}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${fmtMoney(c.arrM)}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;">${c.multiple ? c.multiple+'x' : '—'}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${c.outcome}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};">${c.acquirer||'—'}</td>
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;font-size:6.5px;">Company</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Model</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Avg ACV</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Lesson</th>
      </tr></thead><tbody>`;
    db.pricingComps.forEach((c,i) => {
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${c.company}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};">${c.model}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;">${c.avgACV||c.avcEst||'—'}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-size:6.5px;">${c.lesson||'—'}</td>
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
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;font-size:6.5px;">#</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Market</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">TAM</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:center;">Readiness</th>
        <th style="background:${V.navy};color:#fff;padding:4px 7px;text-align:left;">Main Barrier</th>
      </tr></thead><tbody>`;
    db.expansionMarkets.forEach((m,i) => {
      const rc = m.readiness === 'H' ? V.green : m.readiness === 'M' ? V.amber : V.red;
      h += `<tr>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:800;color:${V.blue};">${m.priority||i+1}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-weight:600;">${m.market}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;">${m.tam}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};text-align:center;font-weight:700;color:${rc};">${m.readiness}</td>
        <td style="padding:4px 7px;background:${i%2?V.parchment:'#fff'};border:1px solid ${V.sand};font-size:6.5px;">${m.barrier}</td>
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

function renderSaaSAgentVisuals(agentId, db) {
  CUR = '$'; UNIT = 'M';
  if (!db) return '';
  let h = '';
  h += renderSaaSKPIs(db.kpis);
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
        <div style="font-family:monospace;font-size:8.5px;letter-spacing:.25em;text-transform:uppercase;color:#3b82f6;margin-bottom:14px;">10-Agent B2B Intelligence Report</div>
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
      ${footer(i + 3)}
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
      ${footer(12)}
    </div>`;

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
              ${(sources || []).slice(0, 40).map((s, i) =>
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
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Instrument+Sans:wght@400;600&family=DM+Sans:wght@400;800&display=swap" rel="stylesheet"/>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#e2e8f0;font-family:'Instrument Sans',sans-serif;}@media print{body{background:#fff;}}</style>
  </head><body>
    ${coverHtml}
    ${sourcesHtml}
    ${synopsisHtml}
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
      headers: { 'Content-Type': 'application/json', 'x-tool-name': 'advisor-intelligence', 'Connection': 'keep-alive' },
      signal,
      body: JSON.stringify({ prompt, agentId, market: 'US', mode: 'saas' }),
    });

    let res;
    try {
      res = await attemptFetch();
    } catch (networkErr) {
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
              return [...prev, { url: event.url, title: event.title, agent: event.agent }].slice(0,100);
            });
          }
          if (event.type === 'error') {
            if (event.message?.includes('rate_limit')) throw new Error('RATE_LIMIT:' + event.message);
            throw new Error(event.message);
          }
        } catch(e) { if (e.message && !e.message.startsWith('JSON')) throw e; }
      }
    }
    return fullText;
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
            setDataBlocks(d => ({ ...d, [id]: { agent: id, kpis: [{ label: 'Analysis', value: '✓', sub: 'See prose below', trend: 'flat', confidence: 'M' }], verdictRow: { verdict: 'WATCH', finding: 'DATA_BLOCK parse failed — see full analysis below', confidence: 'L' } } }));
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
      const ALL_AGENTS = testMode ? ['market'] : [...W1, ...W2, 'synopsis'];

      for (const id of ALL_AGENTS) {
        if (signal.aborted) break;
        setStatuses(s => ({ ...s, [id]: "running" }));

        let ctx_for_agent = {};
        if (id === 'synopsis') {
          const trimmed = {};
          Object.entries(w1texts).forEach(([k,v]) => {
            trimmed[k] = typeof v === 'string' ? v.slice(0,2500) + (v.length > 2500 ? ' [...truncated...]' : '') : v;
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

        if (!signal.aborted && id !== 'synopsis') {
          setStatuses(s => ({ ...s, [id]: "done" }));
          if (!testMode) await new Promise(r => setTimeout(r, 60000));
        }
      }
      if (!signal.aborted) setAppState("done");
    } catch(e) {
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
        {appState === 'done' && (
          <button onClick={generatePDF} disabled={pdfGenerating} style={{ padding: '6px 16px', background: pdfGenerating ? '#ffffff20' : N.blue, color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: pdfGenerating ? 'not-allowed' : 'pointer', letterSpacing: '.05em' }}>
            {pdfGenerating ? 'Generating…' : '⬇ PDF'}
          </button>
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

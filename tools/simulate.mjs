// Random playthroughs. Reports outcomes by starting background, scene and event reach,
// dead ends, and any random state change that was never shown on a card.
// Usage: node tools/simulate.mjs [--runs 10000] [--seed 1] [--samples 0]
// Exits 1 on a dead end or a display-rule violation.

import { loadNodeContent } from './node-content.mjs';
import { newGame, current, choose, chooseByLottery, proceed, decisionChoices } from '../engine/story.js';
import { drawChild } from '../engine/state.js';
import { uniform } from '../engine/rng.js';
import { fieldOf } from '../engine/economy.js';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, a, i, all) => (a.startsWith('--') ? [...pairs, [a.slice(2), all[i + 1]]] : pairs), []),
);
const RUNS = Number(args.runs ?? 1000);
const BASE_SEED = Number(args.seed ?? 1);
const SAMPLES = Number(args.samples ?? 0);
const LOTTERY_SHARE = 0.1; // share of runs that use "Let chance decide"

const content = await loadNodeContent();
const d1Scene = Object.values(content.scenes).find((s) => s.decisionId === 'D1' && !s.retryOf);
const backgrounds = d1Scene.choices.map((c) => c.id);

// ---- One playthrough ----------------------------------------------------------

function play(seed, background) {
  const state = newGame(content, { seed, child: drawChild(seed, content.data) });
  const useLottery = uniform(seed, 'sim:lottery') < LOTTERY_SHARE;
  for (let step = 0; step < 400; step++) {
    const card = current(state, content);
    if (card.type === 'ending') return state;
    if (card.type !== 'decision') {
      proceed(state, content);
      continue;
    }
    const scene = content.scenes[card.sceneId];
    if (scene.decisionId === 'D1' && !scene.retryOf) {
      if (useLottery) chooseByLottery(state, content);
      else choose(state, content, background);
      continue;
    }
    const open = decisionChoices(state, content, scene.id).filter((o) => o.status !== 'unavailable');
    if (open.length === 0) throw new Error(`dead end: no open options at ${scene.id}`);
    const pick = open[Math.floor(uniform(seed, `sim:${scene.id}:${step}`) * open.length)];
    choose(state, content, pick.choice.id);
  }
  throw new Error(`dead end: no ending after 400 steps (stuck near ${state.sceneId})`);
}

// The display rule: every consequential roll was shown, and every chance entry in the
// history has a matching display-log entry.
function displayViolations(state) {
  const out = [];
  for (const r of state.rolls) if (r.mustShow && !r.shown) out.push(`roll ${r.key} changed state without a card`);
  const shown = new Set(state.displayLog);
  for (const e of state.history) {
    if (e.category === 'chance' && !shown.has(e.shownAs)) out.push(`chance entry ${e.id} has no displayed card`);
  }
  return out;
}

// ---- Run ------------------------------------------------------------------------

const groups = {};
const sceneReach = Object.fromEntries(Object.keys(content.scenes).map((id) => [id, 0]));
const eventCounts = Object.fromEntries(content.events.map((e) => [e.id, 0]));
const resultCounts = {};
const deadEnds = {};
const violations = [];
const samples = [];

for (let i = 0; i < RUNS; i++) {
  const seed = BASE_SEED + i;
  let state;
  try {
    state = play(seed, backgrounds[i % backgrounds.length]);
  } catch (err) {
    deadEnds[err.message] = (deadEnds[err.message] || 0) + 1;
    continue;
  }
  for (const v of displayViolations(state)) violations.push(`seed ${seed}: ${v}`);
  for (const id of new Set(state.visited)) sceneReach[id]++;
  for (const key of state.displayLog) {
    const [type, id] = key.split(':');
    if (type === 'event') eventCounts[id]++;
    if (type === 'result') resultCounts[id] = (resultCounts[id] || 0) + 1;
  }

  const background = state.choices.find((c) => c.decisionId === 'D1').choiceId;
  const g = (groups[background] ||= {
    runs: 0, income25: [], earned: [], debt: [], credential: {}, tier: {}, field: {}, jobField: {}, eliteTried: 0, eliteAdmitted: 0,
  });
  const e = state.economy;
  const inc = (obj, key) => { obj[key ?? 'none'] = (obj[key ?? 'none'] || 0) + 1; };
  g.runs++;
  g.income25.push(e.incomeByAge[25] ?? 0);
  g.earned.push(Object.values(e.incomeByAge).reduce((s, v) => s + (v ?? 0), 0));
  g.debt.push(e.studentDebt);
  inc(g.credential, e.credential);
  inc(g.tier, e.collegeTier);
  inc(g.field, fieldOf(state));
  if (e.job) inc(g.jobField, e.job.field);
  const eliteRoll = state.rolls.find((r) => r.key.endsWith(':elite_private') && r.kind === 'longshot');
  if (eliteRoll) {
    g.eliteTried++;
    if (eliteRoll.hit) g.eliteAdmitted++;
  }
  if (samples.length < SAMPLES) samples.push(state);
}

// ---- Report ----------------------------------------------------------------------

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : '—');
const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const quantile = (xs, q) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0;
};
const top = (obj, total) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, total)}`).join(', ');

console.log(`Simulated ${RUNS} playthroughs (seeds ${BASE_SEED}–${BASE_SEED + RUNS - 1}; ${pct(LOTTERY_SHARE, 1)} use the birth lottery).\n`);
console.log('BY STARTING BACKGROUND (D1)');
for (const b of backgrounds) {
  const g = groups[b];
  if (!g) continue;
  console.log(`\n  ${b} (${g.runs} runs)`);
  console.log(`    Income at 25:     median ${usd(quantile(g.income25, 0.5))}  (p10 ${usd(quantile(g.income25, 0.1))}, p90 ${usd(quantile(g.income25, 0.9))})`);
  console.log(`    Earned 18–25:     median ${usd(quantile(g.earned, 0.5))}`);
  console.log(`    Student debt:     median ${usd(quantile(g.debt, 0.5))}, p90 ${usd(quantile(g.debt, 0.9))}`);
  console.log(`    Elite admission:  ${g.eliteAdmitted}/${g.eliteTried} applicants admitted (${pct(g.eliteAdmitted, g.eliteTried)})`);
  console.log(`    Credential:       ${top(g.credential, g.runs)}`);
  console.log(`    College tier:     ${top(g.tier, g.runs)}`);
  console.log(`    Job field at 25:  ${top(g.jobField, g.runs)}  [${Object.keys(g.jobField).filter((f) => f !== 'entry_level').length} of 7 career fields]`);
}

const totalRuns = RUNS - Object.values(deadEnds).reduce((s, v) => s + v, 0);
console.log('\nSCENES REACHED');
for (const [id, n] of Object.entries(sceneReach)) console.log(`  ${id.padEnd(24)} ${pct(n, totalRuns)}`);
const unreachable = Object.entries(sceneReach).filter(([, n]) => n === 0).map(([id]) => id);
console.log(`\nUNREACHABLE SCENES: ${unreachable.length ? unreachable.join(', ') : 'none'}`);

console.log('\nEVENTS FIRED (share of runs)');
for (const [id, n] of Object.entries(eventCounts)) console.log(`  ${id.padEnd(24)} ${pct(n, totalRuns)}`);

console.log('\nRESULTS SHOWN (share of runs)');
for (const [id, n] of Object.entries(resultCounts)) console.log(`  ${id.padEnd(24)} ${pct(n, totalRuns)}`);

console.log(`\nDEAD ENDS: ${Object.keys(deadEnds).length ? '' : 'none'}`);
for (const [msg, n] of Object.entries(deadEnds)) console.log(`  ✗ ${n}× ${msg}`);

console.log(`\nDISPLAY RULE: ${violations.length ? `${violations.length} violations` : 'every random change was shown'}`);
for (const v of violations.slice(0, 20)) console.log(`  ✗ ${v}`);

for (const s of samples) {
  console.log(`\n---- Sample: ${s.child.name}, seed ${s.seed}`);
  console.log(`  Choices: ${s.choices.map((c) => `${c.sceneId}=${c.choiceId}`).join(' · ')}`);
  console.log(`  Events:  ${s.displayLog.filter((k) => k.startsWith('event:')).join(', ') || 'none'}`);
  console.log(`  Economy: ${JSON.stringify({ ...s.economy, offers: undefined, aid: undefined })}`);
  console.log(`  Stats:   ${JSON.stringify(s.stats)}`);
}

process.exit(Object.keys(deadEnds).length || violations.length ? 1 : 0);

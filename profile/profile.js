// Turns the final state into the data the age-25 profile shows. Pure: no DOM.

import { test } from '../engine/conditions.js';
import { makeCtx } from '../engine/story.js';

const AGES = [18, 19, 20, 21, 22, 23, 24, 25];

function sumAbs(obj) {
  return Object.values(obj || {}).reduce((sum, v) => sum + Math.abs(v), 0);
}

// How much an entry changed the life: stat changes plus traceable dollars
// (each $1,000 counts as one point).
function weight(entry) {
  const econ = entry.economy || {};
  const dollars = Math.abs(econ.familyIncomeDelta || 0) + Math.abs(econ.studentDebtDelta || 0);
  return sumAbs(entry.effects) + dollars / 1000;
}

export function attribution(state) {
  const totals = { start: 0, choice: 0, chance: 0 };
  for (const e of state.history) if (e.category in totals) totals[e.category] += weight(e);
  const all = totals.start + totals.choice + totals.chance || 1;
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / all]));
}

export function turningPoints(state, count = 3) {
  const ranked = state.history
    .filter((e) => ['start', 'choice', 'chance'].includes(e.category))
    .map((e) => ({ entry: e, weight: weight(e) }))
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const picked = [];
  let starts = 0;
  for (const x of ranked) {
    if (x.entry.category === 'start') {
      if (starts >= 1) continue;
      starts++;
    }
    picked.push(x.entry);
    if (picked.length === count) break;
  }
  return picked;
}

export function sourcesUsed(state, content) {
  const ids = [];
  for (const e of state.history) ids.push(...(e.sourceIds || []));
  for (const key of state.displayLog) {
    if (!key.startsWith('note:')) continue;
    const stage = content.stages.find((s) => `note:${s.researchNote?.id}` === key);
    if (stage) ids.push(...stage.researchNote.sourceIds);
  }
  for (const p of selectPolicies(state, content)) ids.push(...p.sourceIds);
  ids.push(...content.ui.profile.leavesOutSourceIds);
  return [...new Set(ids)].filter((id) => content.sources[id]);
}

// The two highest stats, described in words on the profile (no numbers).
export function strengths(state, count = 2) {
  return Object.entries(state.stats).sort((a, b) => b[1] - a[1]).slice(0, count).map(([stat]) => stat);
}

// The chance event that changed the most, for the narrative.
export function biggestEvent(state) {
  return state.history
    .filter((e) => e.kind === 'event')
    .sort((a, b) => weight(b) - weight(a))[0]?.id ?? null;
}

// Policies whose relevantIf matches this life, in file order, then the rest.
export function selectPolicies(state, content, count = 4) {
  const ctx = makeCtx(state, content);
  const all = content.data.policies.policies;
  const relevant = all.filter((p) => test(p.relevantIf, ctx));
  return [...relevant, ...all.filter((p) => !relevant.includes(p))].slice(0, count);
}

export function buildProfile(state, content) {
  const e = state.economy;
  const incomeByAge = AGES.map((age) => ({ age, income: e.incomeByAge[age] ?? null }));
  const earned = incomeByAge.reduce((sum, x) => sum + (x.income ?? 0), 0);
  const missingYears = incomeByAge.filter((x) => x.income == null).length;
  return {
    child: state.child,
    credential: e.credential,
    collegeTier: e.collegeTier,
    someCollege: state.flags.includes('some_college'),
    job: e.job,
    income25: e.incomeByAge[25] ?? null,
    studentDebt: e.studentDebt,
    earned,
    missingYears,
    incomeByAge,
    stats: { ...state.stats },
    strengths: strengths(state),
    biggestEvent: biggestEvent(state),
    policies: selectPolicies(state, content),
    startIncome: state.startIncome,
    attribution: attribution(state),
    turningPoints: turningPoints(state),
    sourcesUsed: sourcesUsed(state, content),
  };
}

// Game state: creation, stat and economy changes, and recorded random draws.

import { uniform } from './rng.js';
import { valueOf } from './conditions.js';

// Rules entries are either plain values or { value, assumption, note }.
export function param(rules, key) {
  const v = rules[key];
  return v && typeof v === 'object' && !Array.isArray(v) && 'value' in v ? v.value : v;
}

const PRONOUNS = {
  F: { subj: 'she', obj: 'her', poss: 'her', possPro: 'hers', refl: 'herself' },
  M: { subj: 'he', obj: 'him', poss: 'his', possPro: 'his', refl: 'himself' },
};

export function drawChild(seed, data) {
  const sex = uniform(seed, 'child:sex') < 0.5 ? 'F' : 'M';
  const list = sex === 'F' ? data.names.female : data.names.male;
  const name = list[Math.floor(uniform(seed, 'child:name') * list.length)];
  return { name, sex, pronouns: { ...PRONOUNS[sex] } };
}

export function createState(content, { seed, child }) {
  const { rules } = content;
  return {
    version: rules.saveVersion,
    seed,
    child,
    age: 0,
    stageIndex: 0,
    sceneId: null,
    stats: Object.fromEntries(rules.stats.map((s) => [s, rules.startingStat])),
    flags: [],
    economy: {
      familyIncome: null,
      familyIncomeBracket: null,
      collegeTier: null,
      credential: null,
      studentDebt: 0,
      aid: null,
      offers: [],
      job: null,
      incomeByAge: {},
    },
    history: [],
    displayLog: [],
    rolls: [],
    choices: [],
    attempts: {},
    firedEvents: [],
    yearsReviewed: [],
    visited: [],
    queue: [],
    then: null,
    pending: null,
    done: false,
  };
}

export function updateBracket(state, data) {
  const income = state.economy.familyIncome;
  if (income == null) return;
  const brackets = data['net-price'].incomeBrackets.values;
  const found = brackets.find((b) => income >= b.min && (b.max == null || income <= b.max));
  state.economy.familyIncomeBracket = (found ?? brackets[0]).id;
}

// Applies stat changes and returns the changes that actually happened.
// `multiplier` scales negative changes only (the resource buffer, state-model rule 6).
export function applyEffects(state, effects, rules, multiplier = 1) {
  const { above, below, factor } = rules.diminishingReturns;
  const applied = {};
  for (const [stat, raw] of Object.entries(effects || {})) {
    const current = state.stats[stat];
    let delta = raw < 0 ? raw * multiplier : raw;
    if (delta > 0 && current > above) delta *= factor;
    if (delta < 0 && current < below) delta *= factor;
    const next = Math.min(100, Math.max(0, current + Math.round(delta)));
    if (next !== current) applied[stat] = next - current;
    state.stats[stat] = next;
  }
  return applied;
}

export function applyEconomy(state, econ, ctx) {
  if (!econ) return undefined;
  const e = state.economy;
  const record = {};
  if (econ.setFamilyIncome !== undefined) {
    e.familyIncome = Math.round(valueOf(econ.setFamilyIncome, ctx));
    record.familyIncome = e.familyIncome;
  }
  if (econ.familyIncomeMultiplier !== undefined) {
    const before = e.familyIncome;
    e.familyIncome = Math.round(before * valueOf(econ.familyIncomeMultiplier, ctx));
    record.familyIncomeDelta = e.familyIncome - before;
  }
  if (econ.familyIncomeDelta) {
    e.familyIncome = Math.max(0, e.familyIncome + econ.familyIncomeDelta);
    record.familyIncomeDelta = econ.familyIncomeDelta;
  }
  if (econ.set) {
    Object.assign(e, structuredClone(econ.set));
    record.set = Object.keys(econ.set);
  }
  if (econ.studentDebtDelta) {
    e.studentDebt += econ.studentDebtDelta;
    record.studentDebtDelta = econ.studentDebtDelta;
  }
  if (econ.studentDebt !== undefined) {
    record.studentDebtDelta = econ.studentDebt - e.studentDebt;
    e.studentDebt = econ.studentDebt;
  }
  if (econ.income) {
    Object.assign(e.incomeByAge, econ.income);
    record.income = econ.income;
  }
  updateBracket(state, ctx.data);
  return record;
}

// One change: { effects, economy, setFlags, clearFlags }.
export function applyChange(state, change, ctx, multiplier = 1) {
  if (!change) return { effects: {} };
  const effects = applyEffects(state, change.effects, ctx.rules, multiplier);
  const economy = applyEconomy(state, change.economy, ctx);
  for (const f of change.setFlags || []) if (!state.flags.includes(f)) state.flags.push(f);
  if (change.clearFlags) state.flags = state.flags.filter((f) => !change.clearFlags.includes(f));
  return { effects, economy };
}

export function clampStats(state, [lo, hi]) {
  for (const s of Object.keys(state.stats)) state.stats[s] = Math.min(hi, Math.max(lo, state.stats[s]));
}

// Every random draw is recorded. A draw that changes anything must be shown on a card
// (story.js marks it shown when the card is presented; simulate.mjs checks).
export function roll(state, key, probability, kind) {
  const value = uniform(state.seed, key);
  const hit = value < probability;
  state.rolls.push({ key, kind, probability, hit, mustShow: kind === 'longshot' || hit, shown: false });
  return hit;
}

export function pickWeighted(state, key, items, weightOf) {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let target = uniform(state.seed, key) * total;
  let chosen = items[items.length - 1];
  for (const item of items) {
    target -= weightOf(item);
    if (target < 0) {
      chosen = item;
      break;
    }
  }
  state.rolls.push({ key, kind: 'pick', hit: true, mustShow: true, shown: false });
  return chosen;
}

export function markShown(state, keys) {
  for (const key of keys || []) {
    for (const r of state.rolls) if (r.key === key) r.shown = true;
  }
}

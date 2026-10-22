// Conditions, data references, and probability formulas.
//
// ctx is { state, data, rules } (see story.js makeCtx).

// "net-price:tiers.[tier].netPriceByBracket.values.[bracket].value"
export function resolveRef(data, ref, vars = {}) {
  const colon = ref.indexOf(':');
  if (colon < 0) return undefined;
  const file = ref.slice(0, colon);
  const path = ref.slice(colon + 1).replace(/\[(\w+)\]/g, (_, k) => vars[k] ?? `[${k}]`);
  return path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), data[file]);
}

export function tierKeyOf(data, collegeTier) {
  if (!collegeTier) return undefined;
  const mapped = data['net-price']?.collegeTierMap?.[collegeTier];
  return typeof mapped === 'object' ? mapped.use?.[0] : mapped;
}

export function refVars(ctx) {
  const econ = ctx.state?.economy;
  return {
    bracket: econ?.familyIncomeBracket,
    tier: tierKeyOf(ctx.data, econ?.collegeTier),
  };
}

// A number, or { "data": "<ref>" }.
export function valueOf(spec, ctx) {
  if (spec == null) return undefined;
  if (typeof spec === 'number') return spec;
  if (typeof spec === 'object' && spec.data) return resolveRef(ctx.data, spec.data, refVars(ctx));
  return undefined;
}

// The dollar cost named by the first `cost` field in a condition tree.
export function findCost(cond, ctx) {
  if (!cond || typeof cond !== 'object') return undefined;
  if (cond.cost !== undefined) return valueOf(cond.cost, ctx);
  for (const key of ['all', 'any']) {
    for (const sub of cond[key] || []) {
      const c = findCost(sub, ctx);
      if (c !== undefined) return c;
    }
  }
  return cond.not ? findCost(cond.not, ctx) : undefined;
}

export function hasFlag(state, flag) {
  return state.flags.includes(flag);
}

export function test(cond, ctx) {
  if (cond == null) return true;
  const { state } = ctx;
  if (cond.all) return cond.all.every((c) => test(c, ctx));
  if (cond.any) return cond.any.some((c) => test(c, ctx));
  if (cond.not) return !test(cond.not, ctx);
  if (cond.hasFlag) return hasFlag(state, cond.hasFlag);
  if (cond.notFlag) return !hasFlag(state, cond.notFlag);
  if (cond.hasAnyFlag) return cond.hasAnyFlag.some((f) => hasFlag(state, f));
  if (cond.stat) {
    const v = state.stats[cond.stat];
    if (cond.gte !== undefined && !(v >= cond.gte)) return false;
    if (cond.lt !== undefined && !(v < cond.lt)) return false;
    return true;
  }
  if (cond.bracket) return cond.bracket.includes(state.economy.familyIncomeBracket);
  if (cond.startBracket) return cond.startBracket.includes(state.startBracket);
  if (cond.attempted) return Object.values(state.attempts).some((tried) => tried.includes(cond.attempted));
  if (cond.economy && cond.costShareAbove === undefined) {
    const v = state.economy[cond.economy];
    if ('eq' in cond) return v === cond.eq;
    if ('in' in cond) return cond.in.includes(v);
    if ('notIn' in cond) return !cond.notIn.includes(v);
    return v != null;
  }
  if (cond.costShareAbove !== undefined) {
    const cost = valueOf(cond.cost, ctx);
    const income = state.economy.familyIncome;
    if (cost == null || !income) return false;
    return cost / income > cond.costShareAbove;
  }
  if (cond.incomeAbove !== undefined) {
    const limit = valueOf(cond.incomeAbove, ctx);
    return limit != null && state.economy.familyIncome > limit;
  }
  throw new Error(`Unknown condition: ${JSON.stringify(cond)}`);
}

// `next` is a scene id, "@nextStage", or a list of { if, to } entries.
export function resolveNext(next, ctx) {
  if (!Array.isArray(next)) return next;
  for (const entry of next) if (test(entry.if, ctx)) return entry.to;
  return undefined;
}

// Probability formula:
// { base, min?, max?, terms: [ { label, missingLabel?, add, stat?, above?, per?, if? } ] }
// A stat term adds `add` for every `per` points above `above`; a condition term adds
// `add` when `if` is true. Returns the clamped probability and the factors to show.
export function evaluateFormula(formula, ctx) {
  const [lo, hi] = ctx.rules.probabilityBounds;
  if (typeof formula === 'number') return { p: Math.min(hi, Math.max(lo, formula)), factors: [] };
  let p = valueOf(formula.base, ctx) ?? 0;
  const factors = [];
  for (const term of formula.terms || []) {
    let add = 0;
    let applies;
    if (term.stat) {
      const over = ctx.state.stats[term.stat] - term.above;
      applies = over > 0;
      add = applies ? (term.add * over) / term.per : 0;
    } else {
      applies = test(term.if, ctx);
      add = applies ? term.add : 0;
    }
    p += add;
    if (applies && term.label) factors.push({ label: term.label, kind: add >= 0 ? 'helped' : 'hurt' });
    else if (!applies && term.missingLabel) factors.push({ label: term.missingLabel, kind: 'missing' });
  }
  if (formula.max !== undefined) p = Math.min(p, formula.max);
  if (formula.min !== undefined) p = Math.max(p, formula.min);
  return { p: Math.min(hi, Math.max(lo, p)), factors };
}

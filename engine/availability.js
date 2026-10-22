// Option availability: available, stretch, unavailable (with a reason), or hidden.
// See "Option availability" in docs/state-model.md.

import { test, findCost } from './conditions.js';
import { formatUSD, formatPct } from './text.js';

export function choiceStatus(choice, ctx) {
  const a = choice.availability;
  const base = { status: 'available', longShot: Boolean(choice.longShot), tokens: {}, sourceIds: [] };
  if (choice.hiddenIf && test(choice.hiddenIf, ctx)) return { ...base, status: 'hidden' };
  if (!a) return base;

  const tokensFor = (cond) => {
    const cost = findCost(cond, ctx);
    if (cost == null) return {};
    const income = ctx.state.economy.familyIncome;
    return { cost: formatUSD(cost), costShare: income ? formatPct(cost / income) : '[data needed]' };
  };
  const sourceIds = a.sourceIds || [];

  if (a.unavailableIf && test(a.unavailableIf, ctx)) {
    return { ...base, status: 'unavailable', reason: a.reason, tokens: tokensFor(a.unavailableIf), sourceIds };
  }
  if (a.stretchIf && test(a.stretchIf, ctx)) {
    return { ...base, status: 'stretch', note: a.stretchNote, tokens: tokensFor(a.stretchIf), sourceIds };
  }
  return { ...base, sourceIds };
}

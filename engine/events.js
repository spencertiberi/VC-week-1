// Random life events: slot rolls and event cards.

import { test } from './conditions.js';
import { roll, pickWeighted, param } from './state.js';

function eventWeight(ev, ctx) {
  let w = ev.baseProbability;
  for (const m of ev.modifiers || []) if (test(m.if, ctx)) w *= m.multiply;
  return w;
}

// The resource buffer (state-model rule 6): how hard a negative event lands.
export function resourceScale(ev, ctx) {
  if (!ev.scaleByResources) return { multiplier: 1, impactKey: 'default' };
  const bracket = ctx.state.economy.familyIncomeBracket;
  const table = ctx.rules.resourceMultiplier;
  const multiplier = table[bracket] ?? table.default;
  const impactKey = multiplier > 1 ? 'low' : multiplier < 1 ? 'high' : 'default';
  return { multiplier, impactKey };
}

export function eventCard(ev, ctx, { slot, rollKeys }) {
  const { multiplier, impactKey } = resourceScale(ev, ctx);
  return {
    type: 'event',
    key: `event:${ev.id}:${slot}`,
    eventId: ev.id,
    slot,
    impactKey,
    scale: multiplier,
    apply: { effects: ev.effects, economy: ev.economy, setFlags: ev.setFlags, clearFlags: ev.clearFlags },
    kind: 'event',
    category: 'chance',
    historyId: ev.id,
    sourceIds: ev.sourceIds,
    rollKeys,
  };
}

// Rolls one slot (E1, E2, E3, or a career year). Returns an event card or null.
// rateKey is a key in rules.json, or a probability the caller already computed.
export function rollSlot(state, ctx, slot, rateKey = 'eventSlotFireRate', keyPrefix = slot) {
  const candidates = ctx.events.filter(
    (ev) => ev.slots?.includes(slot) && !state.firedEvents.includes(ev.id) && test(ev.requires, ctx),
  );
  if (candidates.length === 0) return null;
  const fireKey = `${keyPrefix}:fires`;
  const rate = typeof rateKey === 'number' ? rateKey : param(ctx.rules, rateKey);
  if (!roll(state, fireKey, rate, 'slot')) return null;
  const whichKey = `${keyPrefix}:which`;
  const ev = pickWeighted(state, whichKey, candidates, (e) => eventWeight(e, ctx));
  state.firedEvents.push(ev.id);
  return eventCard(ev, ctx, { slot, rollKeys: [fireKey, whichKey] });
}

// A chance event attached to a choice (for example, the party consequence).
export function rollChanceEvent(state, ctx, sceneId, chanceEvent) {
  const ev = ctx.events.find((e) => e.id === chanceEvent.eventId);
  const key = `${sceneId}:chance:${chanceEvent.eventId}`;
  if (!roll(state, key, chanceEvent.probability, 'chance')) return null;
  state.firedEvents.push(ev.id);
  return eventCard(ev, ctx, { slot: sceneId, rollKeys: [key] });
}

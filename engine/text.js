// Template tokens and number formatting. All story text passes through fill().

import { resolveRef, refVars } from './conditions.js';

export const PRONOUN_TOKENS = ['subj', 'obj', 'poss', 'possPro', 'refl', 'Subj', 'Poss'];
export const STATE_TOKENS = ['name', 'familyIncome', 'startIncome', 'namesYear'];
export const PARAM_TOKENS = ['stat', 'usd', 'pct'];
// Filled from the card being shown (availability reasons, results, offers).
export const CARD_TOKENS = ['cost', 'costShare', 'odds', 'college', 'jobTitle', 'salary', 'age', 'amount', 'tierPhrase'];

export const TOKEN_PATTERN = /\{([A-Za-z]+)(?::([^}]+))?\}/g;

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatUSD(n) {
  if (n == null || Number.isNaN(n)) return '[data needed]';
  const rounded = Math.round(n / 100) * 100;
  return '$' + rounded.toLocaleString('en-US');
}

export function formatPct(share) {
  if (share == null || Number.isNaN(share)) return '[data needed]';
  return `${Math.round(share * 100)}%`;
}

export function formatBenchmark(b) {
  if (!b || !b.value) return '[data needed]';
  if (b.unit === 'USD') return formatUSD(b.value);
  if (b.unit === 'share') return `${Number((b.value * 100).toFixed(1))}%`;
  if (b.unit === 'percent') return `${b.value}%`;
  return Number(b.value).toLocaleString('en-US');
}

// ctx: { state, data } ; extra: card tokens (already formatted strings)
export function fill(template, ctx, extra = {}) {
  if (template == null) return '';
  const { state, data } = ctx;
  const child = state?.child;
  return String(template).replace(TOKEN_PATTERN, (whole, token, param) => {
    if (param !== undefined) {
      if (token === 'stat') return formatBenchmark(data.benchmarks?.benchmarks?.find((b) => b.id === param));
      if (token === 'usd') return formatUSD(resolveRef(data, param, refVars(ctx)));
      if (token === 'pct') return formatPct(resolveRef(data, param, refVars(ctx)));
      return whole;
    }
    if (token in extra) return extra[token];
    if (token === 'name') return child?.name ?? '';
    if (token === 'familyIncome') return formatUSD(state?.economy.familyIncome);
    if (token === 'startIncome') return formatUSD(state?.startIncome);
    if (token === 'namesYear') return String(data.names?.year ?? '');
    if (child && PRONOUN_TOKENS.includes(token)) {
      const lower = token.charAt(0).toLowerCase() + token.slice(1);
      const word = child.pronouns[lower];
      return token === lower ? word : capitalize(word);
    }
    return whole;
  });
}

export function paragraphs(text) {
  return String(text).split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

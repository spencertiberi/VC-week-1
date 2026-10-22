// Checks content and data files against docs/content-schema.md.
// Usage: node tools/validate.mjs        Exits 1 if any error is found.

import { loadNodeContent, readJson } from './node-content.mjs';
import { newGame, choose, current, decisionChoices } from '../engine/story.js';
import { resolveRef } from '../engine/conditions.js';
import { TOKEN_PATTERN, PRONOUN_TOKENS, STATE_TOKENS, PARAM_TOKENS, CARD_TOKENS } from '../engine/text.js';

const errors = [];
const warnings = [];
const authorFlags = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const content = await loadNodeContent();
const { rules, data, scenes, events, stages, manifest } = content;
const sourceIds = new Set(data.sources.sources.map((s) => s.id));
const benchmarkIds = new Set(data.benchmarks.benchmarks.map((b) => b.id));
const KNOWN_TOKENS = new Set([...PRONOUN_TOKENS, ...STATE_TOKENS, ...CARD_TOKENS,
  'tierLabel', 'academicYear', 'bracketLabel']);
const SPECIAL_NEXT = new Set(['@nextStage', '@ending']);
const BANNED = /\b(good|bad|right|wrong|smart|stupid|lazy|failure|winner|loser)\b/i;
const SECOND_PERSON = /\b(you|your|yours|yourself)\b/i;
const words = (s) => String(s).replace(TOKEN_PATTERN, 'x').split(/\s+/).filter(Boolean).length;
const visibleLength = (s) => String(s).replace(TOKEN_PATTERN, 'xxxxxxxx').length;

// ---- Helpers ----------------------------------------------------------------

function checkSources(where, ids, required = true) {
  if (!ids || ids.length === 0) {
    if (required) err(where, 'needs at least one source id');
    return;
  }
  for (const id of ids) if (!sourceIds.has(id)) err(where, `unknown source id "${id}"`);
}

// Starting-point scenes (D1–D2) only warn on the ±15 cap: state-model.md's starting-values
// table sets one change at −18, which conflicts with rule 2. Open question for the author.
function checkEffects(where, effects, isStart = false) {
  if (!effects) return;
  const keys = Object.keys(effects);
  if (keys.length > rules.maxStatsPerChoice) err(where, `changes ${keys.length} stats (max ${rules.maxStatsPerChoice})`);
  for (const [stat, v] of Object.entries(effects)) {
    if (!rules.stats.includes(stat)) err(where, `unknown stat "${stat}"`);
    if (Math.abs(v) > rules.maxEffect) (isStart ? warn : err)(where, `${stat} change ${v} is outside ±${rules.maxEffect}`);
  }
}

const BRACKETS = data['net-price'].incomeBrackets.values.map((b) => b.id);
const TIERS = Object.keys(data['net-price'].tiers);

function checkRef(where, ref) {
  const combos = [];
  for (const bracket of ref.includes('[bracket]') ? BRACKETS : [undefined]) {
    for (const tier of ref.includes('[tier]') ? TIERS : [undefined]) combos.push({ bracket, tier });
  }
  for (const vars of combos) {
    const v = resolveRef(data, ref, vars);
    if (typeof v !== 'number') err(where, `data reference "${ref}" does not resolve to a number (${JSON.stringify(vars)})`);
  }
}

function checkTokens(where, text) {
  if (typeof text !== 'string') return;
  for (const [, token, param] of text.matchAll(TOKEN_PATTERN)) {
    if (param !== undefined) {
      if (!PARAM_TOKENS.includes(token)) err(where, `unknown token {${token}:…}`);
      else if (token === 'stat' && !benchmarkIds.has(param)) err(where, `unknown benchmark "${param}"`);
      else if (token !== 'stat') checkRef(where, param);
    } else if (!KNOWN_TOKENS.has(token)) {
      err(where, `unknown token {${token}}`);
    }
  }
}

// Every string anywhere in an object gets a token check.
function walkStrings(where, obj) {
  if (typeof obj === 'string') return checkTokens(where, obj);
  if (Array.isArray(obj)) return obj.forEach((x, i) => walkStrings(`${where}[${i}]`, x));
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'authorFlag') authorFlags.push(`${where}: ${v}`);
      if (k === 'data' || k === 'weights') continue; // data references, not text
      walkStrings(`${where}.${k}`, v);
    }
  }
  return undefined;
}

function checkNext(where, next) {
  if (next == null) return err(where, 'missing next');
  if (typeof next === 'string') {
    if (!SPECIAL_NEXT.has(next) && !scenes[next]) err(where, `next points to missing scene "${next}"`);
    return undefined;
  }
  if (Array.isArray(next)) return next.forEach((n, i) => checkNext(`${where}[${i}]`, n.to));
  checkNext(`${where}.ifSuccess`, next.ifSuccess);
  checkNext(`${where}.ifFailure`, next.ifFailure);
  return undefined;
}

function narrativeChecks(where, text, allowSecondPerson) {
  if (!text) return;
  if (!allowSecondPerson && SECOND_PERSON.test(text)) warn(where, 'second-person word in narrative text');
  if (/PLACEHOLDER/.test(text)) warnings.placeholders = (warnings.placeholders || 0) + 1;
}

// ---- Stage files --------------------------------------------------------------

const seen = new Map();
for (const file of manifest.stages) {
  const raw = await readJson(`content/${file}`);
  for (const s of raw.scenes) {
    if (seen.has(s.id)) err(file, `duplicate scene id "${s.id}" (also in ${seen.get(s.id)})`);
    seen.set(s.id, file);
  }
  if (!scenes[raw.firstScene]) err(file, `firstScene "${raw.firstScene}" is missing`);
  walkStrings(file, raw);
}

for (const stage of stages) {
  const n = stage.researchNote;
  const where = `${stage.stage}.researchNote`;
  if (!n) {
    err(stage.stage, 'missing researchNote');
    continue;
  }
  checkSources(where, n.sourceIds);
  if (words(n.text) > 100) err(where, `research note is ${words(n.text)} words (max 100)`);
  for (const id of n.benchmarkIds || []) if (!benchmarkIds.has(id)) err(where, `unknown benchmark "${id}"`);
  narrativeChecks(where, n.text);
}

for (const scene of Object.values(scenes)) {
  const where = scene.id;
  if (scene.kind !== 'event_slot') {
    checkSources(where, scene.sourceIds);
    if (!scene.title) err(where, 'missing title');
  }
  if (scene.age === undefined) err(where, 'missing age');
  if (scene.text && words(scene.text) > 170) err(where, `text is ${words(scene.text)} words (max 170)`);
  narrativeChecks(where, scene.text, scene.allowSecondPerson);
  for (const v of scene.textVariants || []) narrativeChecks(where, v.append || v.prepend);

  if (scene.kind === 'decision') {
    if (!['family', 'child'].includes(scene.chooser)) err(where, 'chooser must be "family" or "child"');
    if (!scene.decisionId) err(where, 'missing decisionId');
    if (scene.retryOf) {
      if (!scenes[scene.retryOf]) err(where, `retryOf points to missing scene "${scene.retryOf}"`);
      continue;
    }
    const choices = scene.choices || [];
    const total = choices.length + (scene.dynamicChoices ? 1 : 0);
    // The schema says 2–5 choices, but the outline gives D11 and D12 seven each.
    if (total < 2 || choices.length > 7) err(where, `has ${choices.length} choices (2–7)`);
    else if (choices.length > 5) warn(where, `has ${choices.length} choices (schema says 2–5; outline needs 7)`);
    if (scene.offerChoice) checkNext(`${where}.offerChoice`, scene.offerChoice.next);
    const ids = new Set();
    for (const c of choices) {
      const cw = `${where}.${c.id}`;
      if (ids.has(c.id)) err(cw, 'duplicate choice id');
      ids.add(c.id);
      if (!c.label) err(cw, 'missing label');
      else if (visibleLength(c.label) > 70) warn(cw, 'label is over 70 characters');
      if (c.description && visibleLength(c.description) > 110) warn(cw, 'description is over 110 characters');
      if (BANNED.test(c.label) || BANNED.test(c.outcome || '')) warn(cw, 'label or outcome uses a judgment word');
      narrativeChecks(cw, c.outcome);
      checkEffects(cw, c.effects, scene.category === 'start');
      if (c.sourceIds) checkSources(cw, c.sourceIds);
      if (c.availability?.sourceIds) checkSources(`${cw}.availability`, c.availability.sourceIds);
      if (c.longShot) {
        const ls = c.longShot;
        if (!scenes[ls.resultScene] || scenes[ls.resultScene].kind !== 'result') err(cw, `longShot.resultScene "${ls.resultScene}" is not a result scene`);
        checkEffects(`${cw}.onSuccess`, ls.onSuccess?.effects);
        checkEffects(`${cw}.onFailure`, ls.onFailure?.effects);
        checkSources(`${cw}.longShot`, ls.sourceIds, false);
      } else {
        checkNext(cw, c.next);
      }
      if (c.chanceEvent && !events.find((e) => e.id === c.chanceEvent.eventId)) err(cw, `unknown chance event "${c.chanceEvent.eventId}"`);
      const vals = Object.values(c.effects || {});
      if (scene.category !== 'start' && vals.length && (vals.every((v) => v > 0) || vals.every((v) => v < 0))) {
        warn(cw, 'effects are all positive or all negative');
      }
    }
  } else if (scene.kind === 'result') {
    const types = ['lottery', 'admission', 'aid', 'completion', 'job_offers', 'year_review'];
    if (!types.includes(scene.resultType)) err(where, `unknown resultType "${scene.resultType}"`);
    if (['lottery', 'admission', 'completion'].includes(scene.resultType) && (!scene.textIfSuccess || !scene.textIfFailure)) {
      err(where, 'needs textIfSuccess and textIfFailure');
    }
    checkEffects(`${where}.onSuccess`, scene.onSuccess?.effects);
    checkEffects(`${where}.onFailure`, scene.onFailure?.effects);
    checkNext(where, scene.next);
  } else if (scene.kind === 'event_slot') {
    if (!scene.slot) err(where, 'missing slot');
    checkNext(where, scene.next);
  } else {
    err(where, `unknown kind "${scene.kind}"`);
  }
}

// ---- Events -------------------------------------------------------------------

const eventIds = new Set();
for (const ev of events) {
  const where = `events.${ev.id}`;
  if (eventIds.has(ev.id)) err(where, 'duplicate event id');
  eventIds.add(ev.id);
  checkSources(where, ev.sourceIds);
  checkEffects(where, ev.effects);
  if (!ev.impactText) err(where, 'missing impactText');
  else if (typeof ev.impactText === 'object' && !ev.impactText.default) err(where, 'impactText needs a "default" version');
  if (ev.scaleByResources && typeof ev.impactText === 'string') warn(where, 'scaleByResources event has one impactText; add low/high versions');
  if (!['positive', 'negative', 'mixed'].includes(ev.tone)) err(where, 'tone must be positive, negative, or mixed');
  if (words(ev.text) > 150) warn(where, `text is ${words(ev.text)} words (aim for 60–120)`);
  narrativeChecks(where, ev.text);
}
walkStrings('events', { events });
walkStrings('ui', content.ui);

// ---- Data files ---------------------------------------------------------------

function walkSourceIds(where, obj) {
  if (Array.isArray(obj)) return obj.forEach((x, i) => walkSourceIds(`${where}[${i}]`, x));
  if (!obj || typeof obj !== 'object') return undefined;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'sourceId' && v !== null && !sourceIds.has(v)) err(where, `unknown sourceId "${v}"`);
    if ((k === 'sourceIds' || k === 'definitionSourceIds') && Array.isArray(v)) {
      for (const id of v) if (!sourceIds.has(id)) err(where, `unknown source id "${id}"`);
    }
    walkSourceIds(`${where}.${k}`, v);
  }
  return undefined;
}
for (const name of manifest.data) if (name !== 'sources') walkSourceIds(name, data[name]);

const seenSources = new Set();
for (const s of data.sources.sources) {
  if (seenSources.has(s.id)) err('sources', `duplicate id "${s.id}"`);
  seenSources.add(s.id);
  if (!s.url) err(`sources.${s.id}`, 'missing url');
}
for (const b of data.benchmarks.benchmarks) {
  if (!b.sourceId) err(`benchmarks.${b.id}`, 'missing sourceId');
  if (!b.value || !b.year) warn(`benchmarks.${b.id}`, 'value or year is still 0');
}
for (const p of data.policies.policies) {
  checkSources(`policies.${p.id}`, p.sourceIds);
  for (const field of ['name', 'summary', 'connection', 'evidence', 'tradeoffs', 'learnMoreUrl']) {
    if (!p[field]) err(`policies.${p.id}`, `missing ${field}`);
  }
}
walkStrings('policies', data.policies);
for (const sex of ['female', 'male']) {
  const n = data.names[sex]?.length;
  if (n !== 200) err('names', `${sex} list has ${n} names (needs exactly 200)`);
}

// ---- At least two options for every starting background ------------------------

const d1 = Object.values(scenes).find((s) => s.decisionId === 'D1' && !s.retryOf);
const d2 = Object.values(scenes).find((s) => s.decisionId === 'D2' && !s.retryOf);
const checkedScenes = Object.values(scenes).filter((s) => s.kind === 'decision' && s.category !== 'start' && !s.retryOf && !s.dynamicChoices);
for (const a of d1.choices) {
  for (const b of d2.choices) {
    const state = newGame(content, { seed: 1, child: { name: 'Test', sex: 'F', pronouns: { subj: 'she', obj: 'her', poss: 'her', possPro: 'hers', refl: 'herself' } } });
    current(state, content);
    state.queue.shift();
    current(state, content);
    choose(state, content, a.id);
    current(state, content);
    choose(state, content, b.id);
    for (const scene of checkedScenes) {
      const open = decisionChoices(state, content, scene.id).filter((o) => o.status !== 'unavailable');
      if (open.length < 2) err(scene.id, `only ${open.length} option(s) open for background ${a.id} + ${b.id}`);
    }
  }
}

// ---- Report -------------------------------------------------------------------

const placeholders = warnings.placeholders || 0;
console.log(`Validated ${Object.keys(scenes).length} scenes, ${events.length} events, ${data.sources.sources.length} sources, ${data.benchmarks.benchmarks.length} benchmarks.\n`);
if (errors.length) {
  console.log(`ERRORS (${errors.length})`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log();
}
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length})`);
  for (const w of warnings) console.log(`  ! ${w}`);
  console.log();
}
if (placeholders) console.log(`PLACEHOLDER text remaining: ${placeholders} passages\n`);
if (authorFlags.length) {
  console.log(`FLAGGED FOR THE AUTHOR (${authorFlags.length})`);
  for (const f of authorFlags) console.log(`  ? ${f}`);
  console.log();
}
console.log(errors.length ? 'FAILED' : 'OK');
process.exit(errors.length ? 1 : 0);

// Renders the age-25 profile, the comparison, policy connections, and sources.
// See docs/profile-spec.md. Still to come: the income chart with a national reference
// line, the projection beyond 25, and a longer generated narrative.

import { buildProfile } from './profile.js';
import { replayWithBackground } from './compare.js';
import { formatUSD, formatPct } from '../engine/text.js';

function choiceLabel(content, sceneId, choiceId, t, state) {
  const scene = content.scenes[sceneId];
  const base = scene.retryOf ? content.scenes[scene.retryOf] : scene;
  const choice = base.choices?.find((c) => c.id === choiceId);
  return choice ? t(choice.label, state) : choiceId;
}

function entryLabel(entry, content, t, state) {
  if (entry.kind === 'event') {
    const ev = content.events.find((e) => e.id === entry.id);
    return t(ev?.profileLine ?? ev?.title ?? entry.id, state);
  }
  const scene = content.scenes[entry.sceneId];
  const title = scene ? t(scene.title, state, { age: String(entry.age) }) : entry.id;
  if (entry.via === 'lottery' || (entry.choiceId && entry.kind === 'decision')) {
    return `${title}: ${choiceLabel(content, entry.sceneId, entry.choiceId, t, state)}`;
  }
  return title;
}

export function renderProfile(state, content, { h, t, sourceList, heading, onPlayAgain }) {
  const ui = content.ui;
  const P = ui.profile;
  const p = buildProfile(state, content);
  const money = (n) => (n == null ? P.notEstimated : formatUSD(n));

  // ---- Headline and narrative ----------------------------------------------
  const headline = p.job
    ? t(P.headline.working, state, { jobTitle: p.job.title })
    : t(P.headline.searching, state);
  const educationKey = p.someCollege && p.credential === 'hs_diploma' ? 'some_college' : p.credential;
  const event = content.events.find((e) => e.id === p.biggestEvent);
  const narrative = [
    t(P.startLine, state),
    t(P.educationLines[educationKey] ?? '', state, { tierPhrase: P.tierPhrases[p.collegeTier] ?? '' }),
    event ? t(event.profileLine, state) : null,
    p.studentDebt > 0 ? t(P.debtLine, state, { amount: formatUSD(p.studentDebt) }) : t(P.noDebtLine, state),
  ].filter(Boolean).join(' ');

  function snapshot(q, s) {
    const credential = ui.credentials[q.credential] ?? q.credential ?? P.none;
    const tier = q.collegeTier ? ` · ${ui.tiers[q.collegeTier] ?? q.collegeTier}` : '';
    const rows = [
      [P.education, `${credential}${tier}`],
      [P.job, q.job?.title ?? P.none],
      [P.income25, money(q.income25)],
      [P.debt, formatUSD(q.studentDebt)],
      [P.earned, formatUSD(q.earned)],
    ];
    return h('dl', { class: 'snapshot' }, rows.map(([k, v]) => [h('dt', {}, t(k, s)), h('dd', {}, v)]));
  }

  // ---- Income table with bars ------------------------------------------------
  const maxIncome = Math.max(1, ...p.incomeByAge.map((x) => x.income ?? 0));
  const incomeTable = h('table', { class: 'income-table' },
    h('caption', { class: 'visually-hidden' }, P.incomeTable),
    h('thead', {}, h('tr', {},
      h('th', { scope: 'col' }, P.ageColumn),
      h('th', { scope: 'col', class: 'num' }, ui.results.yearRows.income),
      h('th', { scope: 'col', 'aria-hidden': 'true' }, ''))),
    h('tbody', {}, p.incomeByAge.map((x) => h('tr', {},
      h('th', { scope: 'row' }, String(x.age)),
      h('td', { class: 'num' }, money(x.income)),
      h('td', { class: 'bar-cell', 'aria-hidden': 'true' },
        h('span', { class: 'bar', style: `width:${(((x.income ?? 0) / maxIncome) * 100).toFixed(1)}%` }))))));

  // ---- Attribution -------------------------------------------------------------
  const labels = P.attributionLabels;
  const segClass = { start: 'start', choice: 'choice-seg', chance: 'chance' };
  const swatch = { start: 'var(--start)', choice: 'var(--choice)', chance: 'var(--chance)' };
  const attributionText = Object.keys(labels).map((k) => `${labels[k]} ${formatPct(p.attribution[k])}`).join(', ');

  // ---- Comparison ---------------------------------------------------------------
  let comparison = null;
  try {
    const replay = replayWithBackground(state, content);
    const q = buildProfile(replay.state, content);
    const d1Label = (s) => choiceLabel(content, s.choices.find((c) => c.decisionId === 'D1').sceneId,
      s.choices.find((c) => c.decisionId === 'D1').choiceId, t, s);
    comparison = h('section', { 'aria-labelledby': 'compare-heading' },
      h('h2', { id: 'compare-heading' }, P.compare),
      h('p', {}, P.compareIntro),
      h('div', { class: 'compare' },
        h('section', {}, h('h3', {}, d1Label(state)), snapshot(p, state)),
        h('section', {}, h('h3', {}, d1Label(replay.state)), snapshot(q, replay.state))),
      replay.substitutions.length
        ? h('ul', { class: 'meta' }, replay.substitutions.map((s) => h('li', {},
          `${P.compareSubstitution}: ${s.wanted ? choiceLabel(content, s.sceneId, s.wanted, t, state) : '—'} → ${choiceLabel(content, s.sceneId, s.used, t, replay.state)}`)))
        : null);
  } catch (err) {
    console.error(err);
  }

  // ---- Policies -----------------------------------------------------------------
  const policyCards = p.policies.map((pol) => h('section', { class: 'policy' },
    h('h3', {}, pol.name),
    h('p', {}, t(pol.summary, state)),
    h('h4', {}, t(P.policyConnection, state)),
    h('p', {}, t(pol.connection, state)),
    h('h4', {}, P.policyEvidence),
    h('p', {}, t(pol.evidence, state)),
    h('h4', {}, P.policyTradeoffs),
    h('p', {}, t(pol.tradeoffs, state)),
    h('p', { class: 'meta' },
      h('a', { href: pol.learnMoreUrl, target: '_blank', rel: 'noopener' }, P.policyLearnMore,
        h('span', { class: 'visually-hidden' }, ` ${ui.newTab}`)))));

  return h('article', { class: 'card profile' },
    h('p', { class: 'tag' }, t(P.heading, state)),
    heading(headline),
    h('p', { class: 'lede' }, narrative),

    h('h2', {}, P.snapshot),
    snapshot(p, state),

    h('h2', {}, P.strengthsHeading),
    h('ul', {}, p.strengths.map((s) => h('li', {}, t(P.strengths[s], state)))),

    h('h2', {}, P.incomeTable),
    incomeTable,
    p.missingYears ? h('p', { class: 'meta' }, P.notEstimatedNote) : null,

    h('h2', {}, P.turningPoints),
    h('ol', {}, p.turningPoints.map((e) => h('li', {},
      h('strong', {}, `${labels[e.category]}: `), entryLabel(e, content, t, state)))),

    h('h2', {}, P.attribution),
    h('div', { class: 'attribution', role: 'img', 'aria-label': attributionText },
      Object.keys(labels).map((k) => h('span', { class: segClass[k], style: `width:${(p.attribution[k] * 100).toFixed(1)}%` }))),
    h('ul', { class: 'legend' }, Object.keys(labels).map((k) =>
      h('li', { style: `--swatch:${swatch[k]}` }, `${labels[k]}: ${formatPct(p.attribution[k])}`))),
    h('p', { class: 'meta' }, P.attributionCaveat),

    comparison,

    h('h2', {}, P.policiesHeading),
    h('div', { class: 'policies' }, policyCards),

    h('h2', {}, P.takeActionHeading),
    h('ul', {}, P.takeAction.map((a) => h('li', {},
      h('a', { href: content.sources[a.sourceId].url, target: '_blank', rel: 'noopener' }, a.label,
        h('span', { class: 'visually-hidden' }, ` ${ui.newTab}`))))),
    h('p', { class: 'meta' }, P.takeActionNote),

    h('h2', {}, P.leavesOutHeading),
    h('p', {}, P.leavesOut),
    sourceList(P.leavesOutSourceIds),

    h('h2', {}, t(P.usedSources, state)),
    sourceList(p.sourcesUsed),

    h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'button', onclick: onPlayAgain }, P.playAgain)));
}

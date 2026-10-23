// DOM rendering. All text comes from content files and is filled with template tokens.

import { fill, paragraphs, formatUSD, formatPct } from './text.js';
import { test } from './conditions.js';
import { param } from './state.js';
import { decisionChoices, makeCtx } from './story.js';
import { renderProfile } from '../profile/render.js';
import { confetti } from './confetti.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export function createUI(content, handlers) {
  const ui = content.ui;
  const main = document.getElementById('main');
  const progress = document.getElementById('progress');
  const announcer = document.getElementById('announcer');
  const t = (template, state, extra) => fill(template, { state, data: content.data }, extra);

  function announce(message) {
    announcer.textContent = '';
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }

  // A brief visual pulse on a choice, so a sighted or mouse user who clicks an unavailable
  // choice sees something happen too (announce() alone only reaches screen readers).
  function flash(el) {
    window.clearTimeout(el._flashTimer);
    el.classList.remove('choice--flash');
    void el.offsetWidth; // restart the effect if the choice is clicked again quickly
    el.classList.add('choice--flash');
    el._flashTimer = window.setTimeout(() => el.classList.remove('choice--flash'), 1100);
  }

  function show(article, { focusSelector = 'h1' } = {}) {
    main.replaceChildren(article);
    window.scrollTo(0, 0);
    const target = article.querySelector(focusSelector) || main;
    target.focus({ preventScroll: true });
  }

  // ---- Shared pieces --------------------------------------------------------

  function sourceItem(id) {
    const s = content.sources[id];
    return h('li', {},
      h('a', { href: s.url, target: '_blank', rel: 'noopener' },
        s.title, h('span', { class: 'visually-hidden' }, ` ${ui.newTab}`)),
      ` (${s.publisher}${s.year ? `, ${s.year}` : ''}) · `,
      h('a', { href: `#sources/${id}` }, ui.sourceDetails));
  }

  function sourceList(ids) {
    const unique = [...new Set((ids || []).filter((id) => content.sources[id]))];
    if (unique.length === 0) return null;
    return h('div', { class: 'sources' },
      h('p', { class: 'tag' }, unique.length > 1 ? ui.sourcesHeading : ui.sourceLabel),
      h('ul', {}, unique.map(sourceItem)));
  }

  function continueButton(label = ui.continue) {
    return h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'button', onclick: handlers.onContinue }, label));
  }

  function card(...children) {
    return h('article', { class: 'card' }, children);
  }

  function heading(text) {
    return h('h1', { tabindex: '-1' }, text);
  }

  function textBlock(template, state, extra) {
    return paragraphs(t(template, state, extra)).map((p) => h('p', {}, p));
  }

  function sceneParagraphs(scene, state, template = scene.text, extra) {
    const ctx = makeCtx(state, content);
    const pre = [];
    const post = [];
    for (const v of scene.textVariants || []) {
      if (!test(v.if, ctx)) continue;
      if (v.prepend) pre.push(v.prepend);
      if (v.append) post.push(v.append);
    }
    const paras = paragraphs(template || '');
    if (paras.length && pre.length) paras[0] = `${pre.join(' ')} ${paras[0]}`;
    if (paras.length && post.length) paras[paras.length - 1] += ` ${post.join(' ')}`;
    return paras.map((p) => h('p', {}, t(p, state, extra)));
  }

  function factorLists(factors, state) {
    const groups = [['helped', ui.results.helped], ['hurt', ui.results.hurt], ['missing', ui.results.missing]];
    const sections = groups
      .map(([kind, title]) => [title, (factors || []).filter((f) => f.kind === kind)])
      .filter(([, list]) => list.length)
      .map(([title, list]) => h('section', {},
        h('h2', {}, t(title, state)),
        h('ul', {}, list.map((f) => h('li', {}, t(f.label, state))))));
    return sections.length ? h('div', { class: 'factors' }, sections) : null;
  }

  function oddsLine(p, state) {
    return h('p', { class: 'odds' }, t(ui.results.odds, state, { odds: formatPct(p) }));
  }

  function rowsTable(rows, caption) {
    return h('table', {},
      caption ? h('caption', {}, caption) : null,
      h('tbody', {}, rows.filter(Boolean).map(([label, value]) =>
        h('tr', {}, h('th', { scope: 'row' }, label), h('td', { class: 'num' }, value)))));
  }

  // ---- Cards ----------------------------------------------------------------

  function renderIntro(state) {
    const o = ui.opening;
    return card(
      heading(t(o.title, state)),
      textBlock(o.text, state),
      h('p', { class: 'meta' }, t(o.nameNote, state)),
      sourceList(o.sourceIds),
      continueButton(o.start));
  }

  function choiceButton(state, option) {
    const { choice, status } = option;
    const extra = { ...option.tokens, ...(choice.tokens || {}) };
    const parts = [h('span', { class: 'choice__label' }, t(choice.label, state, extra))];
    if (choice.description) parts.push(h('span', { class: 'choice__desc' }, t(choice.description, state, extra)));
    if (status === 'unavailable') {
      parts.push(h('span', { class: 'choice__note' },
        h('span', { class: 'choice__badge' }, ui.unavailable), t(option.reason, state, extra)));
    } else if (status === 'stretch') {
      parts.push(h('span', { class: 'choice__note' },
        h('span', { class: 'choice__badge' }, ui.stretch), t(option.note, state, extra)));
    } else if (option.longShot) {
      parts.push(h('span', { class: 'choice__note' }, h('span', { class: 'choice__badge' }, ui.longShot)));
    }
    const unavailable = status === 'unavailable';
    const onclick = () => {
      if (unavailable) {
        announce(t(option.reason, state, extra));
        flash(btn);
      } else {
        handlers.onChoose(choice.id);
      }
    };
    const btn = h('button', {
      type: 'button',
      class: `choice choice--${status}`,
      'aria-disabled': unavailable ? 'true' : null,
      onclick,
    }, parts);
    return btn;
  }

  function renderDecision(state, c) {
    const scene = content.scenes[c.sceneId];
    const options = decisionChoices(state, content, scene.id);
    return card(
      h('p', { class: 'tag' }, t(ui.chooser[scene.chooser], state)),
      heading(t(scene.title, state)),
      sceneParagraphs(scene, state),
      h('ul', { class: 'choices' }, options.map((o) => h('li', {}, choiceButton(state, o)))),
      scene.lottery
        ? h('div', { class: 'lottery' },
          h('button', { type: 'button', class: 'button button--secondary', onclick: handlers.onLottery }, ui.letChance),
          h('p', {}, t(ui.letChanceNote, state)))
        : null,
      sourceList([...scene.sourceIds, ...options.flatMap((o) => o.sourceIds)]));
  }

  function renderOutcome(state, c) {
    const scene = content.scenes[c.sceneId];
    return card(
      h('p', { class: 'tag' }, t(ui.chooser[scene.chooser], state)),
      heading(t(scene.title, state)),
      textBlock(c.text, state, c.tokens),
      continueButton());
  }

  function renderEvent(state, c) {
    const ev = content.events.find((e) => e.id === c.eventId);
    const impact = typeof ev.impactText === 'string' ? ev.impactText : ev.impactText[c.impactKey] ?? ev.impactText.default;
    return card(
      h('p', { class: 'tag tag--event' }, ui.eventTag),
      heading(t(ev.title, state)),
      textBlock(ev.text, state),
      h('div', { class: 'impact' }, h('h2', {}, t(ui.impactHeading, state)), textBlock(impact, state)),
      sourceList(ev.sourceIds),
      continueButton());
  }

  function renderNote(state, c) {
    const note = content.stages[c.stageIndex].researchNote;
    const benchmarkSources = (note.benchmarkIds || [])
      .map((id) => content.data.benchmarks.benchmarks.find((b) => b.id === id)?.sourceId);
    return card(
      h('p', { class: 'tag tag--note' }, ui.noteTag),
      heading(t(note.title, state)),
      h('div', { class: 'note-box' }, textBlock(note.text, state)),
      sourceList([...note.sourceIds, ...benchmarkSources]),
      continueButton());
  }

  function renderLongShot(state, c, scene) {
    const extra = { college: t(c.college, state), odds: formatPct(c.probability) };
    return [
      sceneParagraphs(scene, state, c.success ? scene.textIfSuccess : scene.textIfFailure, extra),
      oddsLine(c.probability, state),
      scene.showFactors ? factorLists(c.factors, state) : null,
    ];
  }

  function renderBirthLottery(state, c) {
    return [
      textBlock(ui.results.birthLotteryText, state),
      h('ul', {}, c.picks.map((p) => {
        const choice = content.scenes[p.sceneId].choices.find((x) => x.id === p.choiceId);
        return h('li', {},
          h('strong', {}, t(choice.label, state)),
          choice.description ? [' — ', t(choice.description, state)] : null);
      })),
    ];
  }

  function renderAid(state, c, scene) {
    const a = c.aid;
    const r = ui.results.aidRows;
    const bracket = content.data['net-price'].incomeBrackets.values.find((b) => b.id === state.economy.familyIncomeBracket);
    return [
      sceneParagraphs(scene, state),
      rowsTable([
        [r.costOfAttendance, formatUSD(a.costOfAttendance)],
        [r.grants, formatUSD(a.grants)],
        [r.netPrice, formatUSD(a.netPrice)],
        [r.years, String(a.years)],
        [t(r.projectedDebt, state), formatUSD(a.projectedDebt)],
      ]),
      h('p', { class: 'meta' }, t(ui.results.aidNote, state, {
        tierLabel: a.tierLabel, academicYear: a.academicYear, bracketLabel: bracket?.label ?? '',
      })),
    ];
  }

  function renderOffers(state, c, scene) {
    return [
      sceneParagraphs(scene, state),
      h('ul', { class: 'offers' }, c.offers.map((o) => h('li', { class: 'offer' },
        h('p', { class: 'offer__title' }, o.title),
        h('p', { class: 'offer__salary' }, formatUSD(o.salary)),
        h('p', { class: 'meta' }, ui.results.salaryBasis[o.basis], ' · ', ui.results.offerVia[o.via])))),
      c.referral?.hit ? h('p', {}, t(ui.results.referralHit, state)) : null,
    ];
  }

  function renderYear(state, c, scene) {
    const r = ui.results.yearRows;
    return [
      sceneParagraphs(scene, state),
      rowsTable([
        [ui.results.yearStatus[c.status], c.job?.title ?? '—'],
        [r.income, formatUSD(c.income)],
        c.raise && !c.raise.missing ? [r.raise, formatPct(c.raise.rate)] : null,
        c.loan ? [r.loanPayment, formatUSD(c.loan.monthly)] : null,
        c.loan ? [r.loanBalance, formatUSD(c.loan.balanceEnd)] : null,
      ]),
      c.loan && param(content.rules, 'loanInterestRate') == null ? h('p', { class: 'meta' }, ui.results.noInterestNote) : null,
    ];
  }

  // Admission decisions open like a college applicant portal: a status update first, then
  // the letter. Acceptances get confetti. Both outcomes use the same reveal, so the
  // button doesn't give the result away.
  // True for a long-shot result whose success places the child in a college, so the
  // portal never appears for other tryouts, lotteries, or selective high schools.
  function admitsToCollege(c) {
    if (!c.choiceId) return false;
    return Object.values(content.scenes).some((s) => (s.choices || []).some((ch) =>
      ch.id === c.choiceId
      && ch.longShot?.resultScene === c.sceneId
      && ch.longShot.onSuccess?.economy?.set?.collegeTier));
  }

  function renderAdmission(state, c, scene) {
    const n = ui.results.admissionNotice;
    const reveal = h('div', { class: 'reveal', hidden: true },
      renderLongShot(state, c, scene),
      sourceList(c.sourceIds),
      continueButton());
    const letter = h('div', { class: 'notice__letter', hidden: true },
      h('h2', { class: 'notice__heading', tabindex: '-1' }, t(c.success ? n.acceptHeading : n.rejectHeading, state)),
      h('p', {}, t(c.success ? n.acceptBody : n.rejectBody, state)),
      h('p', { class: 'notice__signoff' }, n.signoff));
    const status = h('div', { class: 'notice__status' },
      h('p', { class: 'notice__label' }, n.status),
      h('p', { class: 'notice__update' }, n.updated),
      h('button', { type: 'button', class: 'button', onclick: open }, n.view));
    function open() {
      status.remove();
      letter.hidden = false;
      reveal.hidden = false;
      letter.querySelector('h2').focus();
      if (c.success) {
        const css = getComputedStyle(document.documentElement);
        confetti(['--pink', '--teal', '--lavender', '--cream'].map((v) => css.getPropertyValue(v).trim()));
      }
    }
    return card(
      heading(t(scene.title, state)),
      h('section', { class: 'notice', 'aria-label': n.portal },
        h('p', { class: 'notice__bar' }, h('span', { class: 'notice__dot', 'aria-hidden': 'true' }), n.portal),
        status,
        letter),
      reveal);
  }

  function renderResult(state, c) {
    const scene = content.scenes[c.sceneId];
    if (admitsToCollege(c)) return renderAdmission(state, c, scene);
    let title = scene.title;
    let body;
    if (c.resultType === 'birth_lottery') {
      title = ui.results.birthLotteryTitle;
      body = renderBirthLottery(state, c);
    } else if (c.resultType === 'lottery' || c.resultType === 'admission' || c.resultType === 'completion') {
      body = renderLongShot(state, c, scene);
    } else if (c.resultType === 'aid') body = renderAid(state, c, scene);
    else if (c.resultType === 'job_offers') body = renderOffers(state, c, scene);
    else if (c.resultType === 'year_review') body = renderYear(state, c, scene);
    return card(
      heading(t(title, state, { age: String(c.age ?? state.age) })),
      body,
      sourceList(c.sourceIds),
      continueButton());
  }

  function renderEnding(state) {
    return renderProfile(state, content, { h, t, sourceList, heading, onPlayAgain: handlers.onPlayAgain });
  }

  const RENDERERS = {
    intro: renderIntro,
    decision: renderDecision,
    outcome: renderOutcome,
    event: renderEvent,
    note: renderNote,
    result: renderResult,
    ending: renderEnding,
  };

  function renderCard(state, c, { storageOk = true } = {}) {
    const stageIndex = c.stageIndex ?? state.stageIndex;
    const stage = content.stages[stageIndex];
    progress.textContent = c.type === 'intro' ? '' : `${stage.title} · ${t(ui.ageLabel, state, { age: String(c.age ?? state.age) })}`;
    const article = RENDERERS[c.type](state, c);
    if (!storageOk) article.prepend(h('p', { class: 'warning ui' }, ui.storageWarning));
    show(article);
  }

  function renderSources(state, targetId) {
    const used = state ? [...new Set(state.history.flatMap((e) => e.sourceIds || []))] : [];
    const byTopic = {};
    for (const s of content.data.sources.sources) (byTopic[s.topic] ||= []).push(s);
    const entry = (s) => h('li', { id: `src-${s.id}`, tabindex: '-1' },
      `${s.authors}${s.year ? ` (${s.year})` : ''}. `,
      h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.title,
        h('span', { class: 'visually-hidden' }, ` ${ui.newTab}`)),
      `. ${s.publisher}.`);
    const article = card(
      heading(ui.sourcesHeading),
      h('div', { class: 'actions' }, h('button', { type: 'button', class: 'button button--secondary', onclick: handlers.onBack }, ui.menu.back)),
      used.length ? [
        h('h2', {}, t(ui.profile.usedSources, state)),
        h('ul', { class: 'bibliography' }, used.map((id) => content.sources[id]).filter(Boolean).map((s) =>
          h('li', {}, h('a', { href: `#sources/${s.id}` }, s.title)))),
      ] : null,
      h('h2', {}, ui.profile.allSources),
      Object.entries(byTopic).map(([topic, list]) => [
        h('h3', {}, content.data.sources.topics[topic] ?? topic),
        h('ol', { class: 'bibliography' }, list.map(entry)),
      ]));
    progress.textContent = '';
    show(article, { focusSelector: targetId ? `#src-${CSS.escape(targetId)}` : 'h1' });
  }

  function showError(message) {
    main.replaceChildren(card(heading('Something went wrong'), h('p', {}, message)));
  }

  return { renderCard, renderSources, showError, announce };
}

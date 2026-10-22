// Result cards: lottery, admission, aid, completion, job offers, and year review.
// Each builder returns { cards, next }. Rolls happen here; their effects are applied
// only when story.js presents the card.

import { evaluateFormula, resolveNext, tierKeyOf } from './conditions.js';
import { roll, param } from './state.js';
import { rollSlot } from './events.js';
import { generateOffers, earlyIncome, annualGrowth, monthlyLoanPayment, balanceAfterYear } from './economy.js';

export const union = (...lists) => [...new Set(lists.flat().filter(Boolean))];

function nextFor(scene, success, ctx) {
  const n = scene.next;
  if (n && typeof n === 'object' && !Array.isArray(n)) return resolveNext(success ? n.ifSuccess : n.ifFailure, ctx);
  return resolveNext(n, ctx);
}

export function findChoice(ctx, sceneId, choiceId) {
  const scene = ctx.content.scenes[sceneId];
  const base = scene.retryOf ? ctx.content.scenes[scene.retryOf] : scene;
  return base.choices.find((c) => c.id === choiceId);
}

function resultCard(scene, fields) {
  return {
    type: 'result',
    resultType: scene.resultType,
    key: `result:${scene.id}`,
    sceneId: scene.id,
    kind: 'result',
    category: 'economy',
    historyId: scene.id,
    sourceIds: scene.sourceIds,
    rollKeys: [],
    ...fields,
  };
}

function longShotResult(state, ctx, scene) {
  const pend = state.pending;
  if (!pend) throw new Error(`${scene.id} was reached without a long shot`);
  state.pending = null;
  const ls = findChoice(ctx, pend.sceneId, pend.choiceId).longShot;
  const card = resultCard(scene, {
    key: `result:${scene.id}:${pend.choiceId}`,
    success: pend.success,
    probability: pend.p,
    factors: pend.factors,
    college: ls.label,
    apply: pend.success ? ls.onSuccess : ls.onFailure,
    category: 'chance',
    choiceId: pend.choiceId,
    sourceIds: union(scene.sourceIds, ls.sourceIds),
    rollKeys: [pend.rollKey],
  });
  return { cards: [card], next: nextFor(scene, pend.success, ctx) };
}

function aidResult(state, ctx, scene) {
  const { rules } = ctx;
  const e = state.economy;
  const t = ctx.data['net-price'].tiers[tierKeyOf(ctx.data, e.collegeTier)];
  const bracket = e.familyIncomeBracket;
  const netPrice = t.netPriceByBracket.values[bracket].value;
  const costOfAttendance = t.costOfAttendance.value;
  const aid = {
    tier: e.collegeTier,
    tierLabel: t.label,
    costOfAttendance,
    grants: costOfAttendance - netPrice,
    netPrice,
    years: rules.yearsByTier[e.collegeTier] ?? 4,
    projectedDebt: t.debtByFamilyIncome.values[rules.debtBandByBracket[bracket]].value,
    academicYear: t.netPriceByBracket.academicYear,
  };
  const card = resultCard(scene, { aid, apply: { economy: { set: { aid } } } });
  return { cards: [card], next: nextFor(scene, true, ctx) };
}

function completionResult(state, ctx, scene) {
  const { p, factors } = evaluateFormula(scene.probability, ctx);
  const success = roll(state, scene.id, p, 'longshot');
  const tier = state.economy.collegeTier;
  const outcome = (success ? scene.onSuccess : scene.onFailure) || {};
  const credential = success ? scene.credentialByTier[tier] ?? scene.credentialByTier.default : undefined;
  const share = success ? 1 : param(ctx.rules, 'nonCompleterDebtShare');
  const debt = Math.round((state.economy.aid?.projectedDebt ?? 0) * share);
  const apply = {
    ...outcome,
    economy: { ...(credential ? { set: { credential } } : {}), studentDebtDelta: debt },
  };
  const card = resultCard(scene, {
    success,
    probability: p,
    factors,
    credential,
    debt,
    apply,
    category: 'chance',
    rollKeys: [scene.id],
  });
  return { cards: [card], next: nextFor(scene, success, ctx) };
}

function jobOffersResult(state, ctx, scene) {
  const income = earlyIncome(state, ctx.data, ctx.rules);
  const { offers, rollKeys, referral } = generateOffers(state, ctx, scene);
  const card = resultCard(scene, {
    offers,
    referral,
    apply: { economy: { set: { offers }, income } },
    category: rollKeys.length ? 'chance' : 'economy',
    rollKeys,
    sourceIds: union(scene.sourceIds, ...offers.map((o) => o.sourceIds)),
  });
  return { cards: [card], next: nextFor(scene, true, ctx) };
}

// One card per year. The scene re-enters itself until every age is reviewed, so each
// year sees the effects of the year before.
function yearReviewResult(state, ctx, scene) {
  const { rules } = ctx;
  const e = state.economy;
  const has = (f) => state.flags.includes(f);
  const age = scene.ages.find((a) => !state.yearsReviewed.includes(a));
  state.yearsReviewed.push(age);
  state.age = age;
  const more = scene.ages.some((a) => !state.yearsReviewed.includes(a));
  const next = more ? scene.id : resolveNext(scene.next, ctx);

  const cards = [];
  const rollKeys = [];
  const change = { setFlags: [], clearFlags: [], economy: { set: {} } };
  let job = e.job ? { ...e.job } : null;
  let status;
  let raise = null;

  if (has('in_grad_school')) {
    if (age < rules.gradSchool.finishAge) {
      status = 'grad_school';
    } else {
      const { offers } = generateOffers(state, ctx, null, 'graduate');
      job = { ...offers[0], startAge: age };
      status = 'grad_finished';
      change.economy.set.credential = 'graduate';
      change.clearFlags.push('in_grad_school');
      change.setFlags.push('grad_degree');
    }
  } else if (!job) {
    const key = `jobsearch:${age}`;
    if (e.offers.length && roll(state, key, param(rules, 'jobSearchRate'), 'chance')) {
      job = { ...e.offers[0], startAge: age };
      rollKeys.push(key);
      status = 'found_job';
    } else {
      status = 'searching';
    }
  } else {
    status = 'working';
    if (age > job.startAge) {
      raise = annualGrowth(job.roleId, ctx.data, rules);
      job.salary = Math.round(job.salary * (1 + raise.rate));
    }
  }

  let income = job ? job.salary : 0;
  let eventId = null;
  if (job) {
    const eventCard = rollSlot(state, ctx, 'career', 'careerEventFireRate', `career:${age}`);
    if (eventCard) {
      const ev = ctx.events.find((x) => x.id === eventCard.eventId);
      eventId = ev.id;
      if (ev.career?.salaryMultiplier) {
        job.salary = Math.round(job.salary * ev.career.salaryMultiplier);
        income = job.salary;
      }
      if (ev.career?.jobLoss) {
        income = Math.round(income * ev.career.incomeShareThisYear);
        job = null;
      }
      cards.push(eventCard);
    }
  }

  let loan = null;
  if (e.studentDebt > 0 && status !== 'grad_school') {
    const principal = e.loanPrincipal ?? e.studentDebt;
    const monthly = monthlyLoanPayment(principal, rules);
    loan = { monthly: Math.round(monthly), balanceStart: e.studentDebt, balanceEnd: balanceAfterYear(e.studentDebt, monthly, rules) };
    change.economy.set.loanPrincipal = principal;
    change.economy.studentDebt = loan.balanceEnd;
  }

  change.economy.set.job = job;
  change.economy.income = { [age]: income };
  cards.push(resultCard(scene, {
    key: `result:${scene.id}:${age}`,
    age,
    status,
    income,
    previousIncome: e.incomeByAge[age - 1] ?? null,
    job,
    raise,
    loan,
    eventId,
    apply: change,
    category: rollKeys.length ? 'chance' : 'economy',
    rollKeys,
    sourceIds: union(scene.sourceIds, job?.sourceIds, raise?.sourceIds),
  }));
  return { cards, next };
}

const BUILDERS = {
  lottery: longShotResult,
  admission: longShotResult,
  aid: aidResult,
  completion: completionResult,
  job_offers: jobOffersResult,
  year_review: yearReviewResult,
};

export function buildResult(state, ctx, scene) {
  const build = BUILDERS[scene.resultType];
  if (!build) throw new Error(`Unknown resultType ${scene.resultType} in ${scene.id}`);
  return build(state, ctx, scene);
}

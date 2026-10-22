// Salaries, job offers, early-career income, and loan repayment.
// Every dollar figure comes from content/data/salaries.json or net-price.json.

import { tierKeyOf, evaluateFormula } from './conditions.js';
import { param, roll } from './state.js';

const CREDENTIAL_RANK = {
  none: 0,
  hs_diploma: 1,
  some_college: 2,
  certificate: 2,
  apprenticeship: 2,
  military_service: 2,
  associate: 3,
  bachelors: 4,
  masters: 5,
  graduate: 5,
  professional: 6,
  doctoral: 6,
};

export const credentialRank = (c) => CREDENTIAL_RANK[c] ?? 0;

export function qualifies(role, credential) {
  if (role.typicalCredential === 'apprenticeship') return credential === 'apprenticeship';
  return credentialRank(credential) >= credentialRank(role.typicalCredential);
}

export function fieldOf(state) {
  const flag = state.flags.find((f) => f.startsWith('field_'));
  return flag ? flag.slice('field_'.length) : 'entry_level';
}

export function roleById(data, id) {
  return data.salaries.roles.values.find((r) => r.id === id);
}

// Starting salary: the Scorecard 1-year median for the role's program (times the
// college-tier ratio for bachelor's programs), or else the OOH 10th percentile.
export function entrySalary(role, state, data) {
  const s = data.salaries;
  const credential = state.economy.credential;
  const link = role.scorecardLink;
  if (link && credentialRank(credential) >= credentialRank(link.credential)) {
    const row = s.earningsByFieldOfStudy.values[role.field]?.find(
      (r) => r.cip === link.cip && r.credential === link.credential,
    );
    if (row?.earn1yrMedian) {
      const tierKey = tierKeyOf(data, state.economy.collegeTier);
      const ratio = credentialRank(link.credential) >= credentialRank('bachelors')
        ? s.model.collegeTierRatio.values[tierKey] ?? 1
        : 1;
      return {
        amount: Math.round(row.earn1yrMedian * ratio),
        basis: ratio === 1 ? 'scorecard' : 'scorecard_tier',
        tierRatio: ratio,
        sourceIds: ['college_scorecard'],
        year: s.earningsByFieldOfStudy.year,
      };
    }
  }
  const ooh = role.ooh;
  if (ooh.p10Annual) return { amount: ooh.p10Annual, basis: 'ooh_p10', sourceIds: ['bls_ooh'], year: ooh.year };
  if (ooh.p10Hourly) {
    return {
      amount: Math.round(ooh.p10Hourly * param(s.model, 'hoursPerYearFullTime')),
      basis: 'ooh_p10_hourly',
      sourceIds: ['bls_ooh', 'bls_oews_technical'],
      year: ooh.year,
    };
  }
  return null;
}

export function annualGrowth(roleId, data, rules) {
  const role = roleById(data, roleId);
  const link = role?.scorecardLink;
  const row = link && data.salaries.model.annualGrowth.values[role.field]?.find(
    (r) => r.cip === link.cip && r.credential === link.credential,
  );
  if (!row) return { rate: 0, missing: true };
  return { rate: Math.max(param(rules, 'minAnnualGrowth'), row.annualGrowth), sourceIds: ['college_scorecard'] };
}

function toOffer({ role, salary }, via) {
  return {
    roleId: role.id,
    title: role.title,
    field: role.field,
    salary: salary.amount,
    basis: salary.basis,
    tierRatio: salary.tierRatio,
    sourceIds: salary.sourceIds,
    year: salary.year,
    via,
  };
}

// 2–3 offers in the child's field. `network` sets how far up the field's pay ladder the
// best ordinary offer reaches; a referral (a shown chance roll) can add the top role.
export function generateOffers(state, ctx, scene, credentialOverride) {
  const { data, rules } = ctx;
  const view = credentialOverride
    ? { ...state, economy: { ...state.economy, credential: credentialOverride } }
    : state;
  const credential = view.economy.credential;
  const priced = (r) => ({ role: r, salary: entrySalary(r, view, data) });
  const byPay = (a, b) => a.salary.amount - b.salary.amount;
  const roles = data.salaries.roles.values;
  const pool = roles
    .filter((r) => r.field === fieldOf(state) && qualifies(r, credential))
    .map(priced)
    .filter((o) => o.salary)
    .sort(byPay);
  const entry = roles
    .filter((r) => r.field === 'entry_level' && qualifies(r, credential))
    .map(priced)
    .filter((o) => o.salary)
    .sort(byPay);

  const o = rules.offers;
  const bonus = state.stats.network >= o.bonusNetworkAt || o.bonusTiers.includes(state.economy.collegeTier);
  const count = Math.min(o.max, o.base + (bonus ? 1 : 0));
  const offers = [];
  const top = Math.min(pool.length - 1, Math.floor((state.stats.network / 100) * pool.length));
  for (let i = top; i >= 0 && offers.length < count; i--) offers.push(toOffer(pool[i], 'search'));
  for (let i = entry.length - 1; i >= 0 && offers.length < count; i--) offers.push(toOffer(entry[i], 'search'));

  const rollKeys = [];
  let referral = null;
  if (scene?.referral && pool.length) {
    const { p, factors } = evaluateFormula(scene.referral.probability, ctx);
    const key = `${scene.id}:referral`;
    referral = { p, factors, hit: false };
    if (roll(state, key, p, 'chance')) {
      referral.hit = true;
      rollKeys.push(key);
      const best = pool[pool.length - 1];
      const existing = offers.find((x) => x.roleId === best.role.id);
      if (existing) existing.via = 'referral';
      else offers.unshift(toOffer(best, 'referral'));
    }
  }
  return { offers, rollKeys, referral };
}

// Income from 18 to 22, before the first full-time job.
export function earlyIncome(state, data, rules) {
  const hoursFull = param(data.salaries.model, 'hoursPerYearFullTime');
  const hoursPart = param(rules, 'partTimeHoursPerWeek') * 52;
  const partRole = roleById(data, rules.earlyIncome.partTimeRole);
  const fullRole = roleById(data, rules.earlyIncome.fullTimeRole);
  const has = (f) => state.flags.includes(f);
  const income = {};
  for (let age = 18; age <= 22; age++) {
    if (age in state.economy.incomeByAge) continue;
    if (has('path_college')) income[age] = has('works_in_college') ? Math.round(partRole.ooh.p10Hourly * hoursPart) : 0;
    else if (has('path_work')) income[age] = Math.round(fullRole.ooh.p10Hourly * hoursFull);
    else income[age] = null; // Apprenticeship and military pay are not in the data yet.
  }
  return income;
}

export function monthlyLoanPayment(principal, rules) {
  const n = rules.loanRepaymentYears * 12;
  const rate = param(rules, 'loanInterestRate');
  if (!principal) return 0;
  if (!rate) return principal / n;
  const i = rate / 12;
  return (principal * i) / (1 - (1 + i) ** -n);
}

export function balanceAfterYear(balance, monthly, rules) {
  const rate = param(rules, 'loanInterestRate');
  let b = balance;
  for (let m = 0; m < 12 && b > 0; m++) b = b * (1 + (rate || 0) / 12) - monthly;
  return Math.max(0, Math.round(b));
}

// The story state machine. State holds a queue of cards and a pointer (`then`) to what
// comes after them. When the queue empties, the next scene is entered, which adds cards.
//
// The display rule: a card's effects are applied only when the card is presented by
// current(), which also writes the display log and marks the card's rolls as shown.

import { createState, applyChange, clampStats, pickWeighted, markShown, roll } from './state.js';
import { resolveNext, evaluateFormula, resolveRef } from './conditions.js';
import { choiceStatus } from './availability.js';
import { rollSlot, rollChanceEvent } from './events.js';
import { buildResult, findChoice, union } from './results.js';
import { formatUSD } from './text.js';

export function makeCtx(state, content) {
  return { state, content, data: content.data, rules: content.rules, events: content.events };
}

export function newGame(content, { seed, child }) {
  const state = createState(content, { seed, child });
  state.queue.push({ type: 'intro', key: 'intro' });
  state.then = '@stage:0';
  return state;
}

// ---- Decisions --------------------------------------------------------------

function offerChoices(state, scene) {
  const t = scene.offerChoice;
  return state.economy.offers.map((offer, i) => ({
    ...t,
    id: `offer_${i}`,
    tokens: { jobTitle: offer.title, salary: formatUSD(offer.salary) },
    economy: { set: { job: { ...offer, startAge: t.startAge } } },
    sourceIds: offer.sourceIds,
  }));
}

// The options for a decision scene, with availability. Hidden options are left out.
export function decisionChoices(state, content, sceneId) {
  const ctx = makeCtx(state, content);
  const scene = content.scenes[sceneId];
  let choices = scene.choices || [];
  if (scene.retryOf) {
    const tried = state.attempts[scene.retryOf] || [];
    choices = content.scenes[scene.retryOf].choices.filter((c) => !tried.includes(c.id));
  }
  if (scene.dynamicChoices === 'jobOffers') choices = [...offerChoices(state, scene), ...choices];
  return choices
    .map((choice) => ({ choice, ...choiceStatus(choice, ctx) }))
    .filter((o) => o.status !== 'hidden');
}

function applyChoice(state, ctx, scene, choice, via) {
  const result = applyChange(state, choice, ctx);
  const category = scene.category || 'choice';
  if (category === 'start') {
    clampStats(state, ctx.rules.startBounds);
    state.startBracket = state.economy.familyIncomeBracket;
    state.startIncome = state.economy.familyIncome;
  }
  state.history.push({
    id: scene.decisionId || scene.id,
    sceneId: scene.id,
    kind: 'decision',
    category,
    age: state.age,
    choiceId: choice.id,
    effects: result.effects,
    economy: result.economy,
    sourceIds: union(scene.sourceIds, choice.sourceIds, choice.availability?.sourceIds),
    via,
  });
  state.choices.push({ sceneId: scene.id, decisionId: scene.decisionId, choiceId: choice.id, via });
}

export function choose(state, content, choiceId) {
  const card = current(state, content);
  if (card?.type !== 'decision') throw new Error('No decision is waiting');
  const scene = content.scenes[card.sceneId];
  const option = decisionChoices(state, content, scene.id).find((o) => o.choice.id === choiceId);
  if (!option || option.status === 'unavailable') throw new Error(`${scene.id}: ${choiceId} is not available`);
  const { choice } = option;
  const ctx = makeCtx(state, content);
  state.queue.shift();
  applyChoice(state, ctx, scene, choice);

  if (choice.outcome) {
    state.queue.push({
      type: 'outcome',
      key: `outcome:${scene.id}:${choice.id}`,
      sceneId: scene.id,
      text: choice.outcome,
      tokens: choice.tokens,
    });
  }
  if (choice.chanceEvent) {
    const eventCard = rollChanceEvent(state, ctx, scene.id, choice.chanceEvent);
    if (eventCard) state.queue.push(eventCard);
  }
  if (choice.longShot) {
    const baseId = scene.retryOf || scene.id;
    const { p, factors } = evaluateFormula(choice.longShot.probability, ctx);
    const rollKey = `${baseId}:${choice.id}`;
    const success = roll(state, rollKey, p, 'longshot');
    (state.attempts[baseId] ||= []).push(choice.id);
    state.pending = { sceneId: scene.id, choiceId: choice.id, success, p, factors, rollKey };
    state.then = choice.longShot.resultScene;
  } else {
    state.then = resolveNext(choice.next, ctx);
  }
}

// "Let chance decide": draws this scene's option (and any `alsoDraws` scenes) by weight.
export function chooseByLottery(state, content) {
  const card = current(state, content);
  const scene = content.scenes[card?.sceneId];
  if (card?.type !== 'decision' || !scene.lottery) throw new Error('No lottery is available here');
  const ctx = makeCtx(state, content);
  const picks = [];
  let then;
  const draw = (sceneId, weightsRef) => {
    const weights = resolveRef(content.data, weightsRef);
    const options = content.scenes[sceneId].choices.filter((c) => weights[c.id]);
    const rollKey = `${sceneId}:lottery`;
    const choice = pickWeighted(state, rollKey, options, (c) => weights[c.id].weight);
    picks.push({ sceneId, choiceId: choice.id, rollKey });
    then = resolveNext(choice.next, ctx);
  };
  draw(scene.id, scene.lottery.weights);
  for (const extra of scene.lottery.alsoDraws || []) draw(extra.scene, extra.weights);
  state.queue.shift();
  state.queue.push({
    type: 'result',
    resultType: 'birth_lottery',
    key: `result:${scene.id}:lottery`,
    sceneId: scene.id,
    picks: picks.map(({ sceneId, choiceId }) => ({ sceneId, choiceId })),
    kind: 'result',
    category: 'start',
    rollKeys: picks.map((p) => p.rollKey),
    sourceIds: scene.lottery.sourceIds,
  });
  state.then = then;
}

// ---- Flow -------------------------------------------------------------------

function enterScene(state, ctx, id) {
  const scene = ctx.content.scenes[id];
  if (!scene) throw new Error(`Missing scene: ${id}`);
  state.sceneId = id;
  state.stageIndex = scene.stageIndex;
  if (scene.age !== undefined) state.age = scene.age;
  state.visited.push(id);

  if (scene.kind === 'decision') {
    state.queue.push({ type: 'decision', key: `decision:${id}`, sceneId: id });
  } else if (scene.kind === 'event_slot') {
    const card = rollSlot(state, ctx, scene.slot);
    if (card) state.queue.push(card);
    state.then = resolveNext(scene.next, ctx);
  } else if (scene.kind === 'result') {
    const { cards, next } = buildResult(state, ctx, scene);
    state.queue.push(...cards);
    state.then = next;
  } else {
    throw new Error(`Unknown scene kind ${scene.kind} in ${id}`);
  }
}

function fillQueue(state, ctx) {
  const { content } = ctx;
  let guard = 0;
  while (state.queue.length === 0 && !state.done) {
    if (++guard > 100) throw new Error(`Story is stuck after ${state.sceneId}`);
    const target = state.then;
    state.then = null;
    if (!target) throw new Error(`No next scene after ${state.sceneId}`);
    if (target === '@nextStage') {
      const stage = content.stages[state.stageIndex];
      if (stage.researchNote) {
        state.queue.push({ type: 'note', key: `note:${stage.researchNote.id}`, stageIndex: state.stageIndex });
      }
      const nextIndex = state.stageIndex + 1;
      state.then = nextIndex < content.stages.length ? `@stage:${nextIndex}` : '@ending';
    } else if (target.startsWith('@stage:')) {
      state.stageIndex = Number(target.slice('@stage:'.length));
      const stage = content.stages[state.stageIndex];
      applyChange(state, stage.onEnter, ctx);
      state.then = stage.firstScene;
    } else if (target === '@ending') {
      state.queue.push({ type: 'ending', key: 'ending' });
      state.displayLog.push('ending');
      state.done = true;
    } else {
      enterScene(state, ctx, target);
    }
  }
}

function present(state, ctx, card) {
  for (const p of card.picks || []) {
    applyChoice(state, ctx, ctx.content.scenes[p.sceneId], findChoice(ctx, p.sceneId, p.choiceId), 'lottery');
  }
  if (card.apply) {
    const result = applyChange(state, card.apply, ctx, card.scale ?? 1);
    state.history.push({
      id: card.historyId,
      sceneId: card.sceneId,
      kind: card.kind,
      category: card.category,
      age: state.age,
      choiceId: card.choiceId,
      effects: result.effects,
      economy: result.economy,
      sourceIds: card.sourceIds || [],
      shownAs: card.key,
    });
  }
  markShown(state, card.rollKeys);
  if (card.type !== 'ending') state.displayLog.push(card.key);
  card.shown = true;
}

// The card to show now. Presenting it applies its effects (once).
export function current(state, content) {
  const ctx = makeCtx(state, content);
  fillQueue(state, ctx);
  const card = state.queue[0];
  if (card && !card.shown) present(state, ctx, card);
  return card;
}

// Moves past a card that needs no decision.
export function proceed(state, content) {
  const card = current(state, content);
  if (!card || card.type === 'decision' || card.type === 'ending') {
    throw new Error(`Cannot continue past a ${card?.type ?? 'missing'} card`);
  }
  state.queue.shift();
}

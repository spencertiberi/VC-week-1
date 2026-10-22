// "Same choices, different start": replays the reader's choices with the same seed and
// place, but a different family background. Pure: runs the engine headless.

import { newGame, current, choose, proceed, decisionChoices } from '../engine/story.js';

export function comparisonStart(state, content) {
  const c = content.rules.compare;
  return c.lowBrackets.includes(state.startBracket) ? c.highStart : c.lowStart;
}

export function replayWithBackground(state, content, startChoiceId = comparisonStart(state, content)) {
  const alt = newGame(content, { seed: state.seed, child: state.child });
  const recorded = {};
  for (const c of state.choices) (recorded[c.sceneId] ||= []).push(c.choiceId);
  const substitutions = [];

  for (let steps = 0; steps < 500; steps++) {
    const card = current(alt, content);
    if (card.type === 'ending') return { state: alt, startChoiceId, substitutions };
    if (card.type !== 'decision') {
      proceed(alt, content);
      continue;
    }
    const scene = content.scenes[card.sceneId];
    const open = decisionChoices(alt, content, scene.id).filter((o) => o.status !== 'unavailable');
    const wanted = scene.decisionId === 'D1' ? startChoiceId : recorded[scene.id]?.shift();
    let pick = open.find((o) => o.choice.id === wanted);
    if (!pick) {
      // Closest option: one the content names, or else the first one open.
      const closest = content.scenes[scene.retryOf || scene.id].choices
        ?.find((c) => c.id === wanted)?.closest || [];
      pick = closest.map((id) => open.find((o) => o.choice.id === id)).find(Boolean) || open[0];
      substitutions.push({ sceneId: scene.id, wanted: wanted ?? null, used: pick.choice.id });
    }
    choose(alt, content, pick.choice.id);
  }
  throw new Error('Replay did not reach the ending');
}

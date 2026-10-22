// Browser entry point: loads content, resumes or starts a game, and wires the UI.

import { loadContent, browserReadJson } from './loader.js';
import { newGame, current, choose, chooseByLottery, proceed } from './story.js';
import { drawChild } from './state.js';
import { newSeed } from './rng.js';
import { loadSave, writeSave, clearSave } from './save.js';
import { createUI } from './ui.js';

let content;
let state;
let ui;

function startNew() {
  const seed = newSeed();
  state = newGame(content, { seed, child: drawChild(seed, content.data) });
}

function render() {
  const sourcesRoute = window.location.hash.match(/^#sources(?:\/(.+))?$/);
  if (sourcesRoute) {
    ui.renderSources(state, sourcesRoute[1]);
    return;
  }
  const card = current(state, content);
  const storageOk = writeSave(state);
  ui.renderCard(state, card, { storageOk });
}

function act(fn) {
  try {
    fn();
    render();
  } catch (err) {
    console.error(err);
    ui.showError(err.message);
  }
}

const handlers = {
  onChoose: (choiceId) => act(() => choose(state, content, choiceId)),
  onLottery: () => act(() => chooseByLottery(state, content)),
  onContinue: () => act(() => proceed(state, content)),
  onPlayAgain: () => act(() => {
    clearSave();
    startNew();
  }),
  onBack: () => {
    window.location.hash = '';
  },
};

async function boot() {
  try {
    content = await loadContent(browserReadJson);
  } catch (err) {
    console.error(err);
    document.getElementById('main').textContent = `The story could not load: ${err.message}`;
    return;
  }
  document.getElementById('site-title').textContent = content.ui.siteTitle;
  ui = createUI(content, handlers);

  state = loadSave(content.rules.saveVersion);
  if (state) {
    try {
      current(state, content);
    } catch (err) {
      // The saved game doesn't fit the current content; start fresh instead of crashing.
      console.warn('Discarding saved game:', err);
      state = null;
    }
  }
  if (!state) startNew();

  document.getElementById('nav-sources').addEventListener('click', () => {
    window.location.hash = 'sources';
  });
  document.getElementById('nav-restart').addEventListener('click', () => {
    if (window.confirm(content.ui.menu.restartConfirm)) {
      window.location.hash = '';
      handlers.onPlayAgain();
    }
  });
  document.getElementById('nav-sources').textContent = content.ui.menu.sources;
  document.getElementById('nav-restart').textContent = content.ui.menu.restart;
  window.addEventListener('hashchange', render);
  render();
}

boot();

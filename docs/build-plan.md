# Build Plan

How the engine works and the order the project is built in. It follows `kickoff-prompts.md`,
adjusted for the data files that already exist.

## Architecture

The engine is pure logic with no DOM, so the browser and the Node tools run the same code.
Rendering lives only in `engine/ui.js` and `profile/render.js`.

| Module | Responsibility |
|---|---|
| `engine/loader.js` | Loads `content/manifest.json`, then every stage, event, rule, UI, and data file. Takes a `readJson` function, so the browser uses `fetch` and the tools use `fs`. |
| `engine/rng.js` | Keyed randomness: `uniform(seed, key)`. The same seed and key always give the same number, so a replay with a different background meets the same chance events. |
| `engine/state.js` | Creates state, applies effects (clamping, diminishing returns, resource scaling), applies economy changes, records rolls. |
| `engine/conditions.js` | Conditions (`hasFlag`, `stat`, `bracket`, `costShareAbove`, `all`/`any`/`not`, …), data references, and probability formulas with their plain-language factors. |
| `engine/availability.js` | Decides whether each option is available, a stretch, unavailable (with its reason), or hidden. |
| `engine/events.js` | Rolls event slots and builds event cards, including the resource buffer. |
| `engine/economy.js` | Entry salaries, job offers, salary growth, income from 18 to 25, loan repayment. |
| `engine/results.js` | Builds result cards: lottery, admission, aid, completion, job offers, year review. |
| `engine/story.js` | The state machine: `newGame`, `current`, `choose`, `chooseByLottery`, `proceed`. |
| `engine/text.js` | Template tokens and number formatting. |
| `engine/save.js` | localStorage save and resume, wrapped in try/catch. |
| `engine/ui.js`, `engine/main.js` | DOM rendering, focus management, menu, sources page. |
| `profile/profile.js` | Turns the final state into the profile model (pure). |
| `profile/compare.js` | "Same choices, different start": replays the recorded choices with another background. |
| `profile/render.js` | Renders the profile. |

### How the story moves
State holds a **queue of cards** and a pointer to what comes after them (`then`). When the
queue is empty, the engine enters the next scene, which adds cards: a decision, a result,
an event (if a slot fires), or a research note at the end of a stage.

### How "every random outcome is shown" is enforced
1. Every random draw goes through `roll()` or `pickWeighted()`, which record it in
   `state.rolls`.
2. Random outcomes never change state directly. They become cards, and a card's effects are
   applied only when the card is **presented** (`current()`), which also writes the
   display log and marks the card's rolls as shown.
3. `tools/simulate.mjs` fails if any roll that changed something was never shown, or any
   `chance` history entry has no matching display-log entry.

### Additions to `content-schema.md`
These were needed to build the engine. Each is noted in the schema.
- `content/manifest.json` (stage order and data files), `content/rules.json` (model
  parameters, not statistics), `content/ui.json` (interface text).
- Scene kind `event_slot` for E1–E3.
- Scene `category: "start"` marks D1–D2 for attribution.
- `retryOf` makes a decision reuse another scene's options, minus the ones already tried.
- `next` can be a list of `{ "if": <condition>, "to": "<id>" }` entries.
- Probability formula objects and data references (`"net-price:tiers.[tier].…"`).
- Tokens `{usd:<ref>}`, `{pct:<ref>}`, `{namesYear}`, plus card-specific tokens.

## Build order (each step ends playable)
1. **Engine skeleton with placeholder content** (one decision per stage, one result of
   each type, events, notes, a placeholder profile). Validator, simulator, and link checker.
2. **Remaining data:** `benchmarks.json` values, `policies.json`, and the data gaps listed
   by the tools.
3. **Stages 0–6, one per session** (real scenes, events, and notes for every decision in
   `story-outline.md`).
4. **Full economy calibration** against the research.
5. **Ending:** profile, income chart, comparison, policy cards, sources page.
6. **Balance and fairness review**, then **accessibility polish**, then **deploy**.

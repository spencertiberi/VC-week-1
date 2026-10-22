# Life Path — Interactive Story

## What this is
A browser-based choose-your-own-adventure that follows one child in the United States
from birth to age 25. The child gets a random name from the Social Security
Administration's current top 200 baby names, and the story is told in third person. The
reader makes about 13 decisions: family background, preschool, K–12 schooling,
extracurriculars, social life, academics, life after high school, and a first job. Random
life events happen along the way, and every one is shown to the reader.

The story ends with a profile of the person at 25, including their income from 18 to 25,
the policies that could have changed their path, and a linked list of every source.

**Purpose:** show young adults how inequality shapes American lives, using real research,
and encourage them to think about policy change.

Read these before starting any task:
- `docs/brief.md` — purpose, audience, scope, definition of done
- `docs/story-outline.md` — every decision, event, and reveal, in order
- `docs/state-model.md` — stats, flags, economy (family income, admissions, aid, jobs,
  income), random events, and the rules for changing them
- `docs/content-schema.md` — JSON formats for scenes, events, and data files
- `docs/story-bible.md` — voice, tone, fairness and policy-framing rules
- `docs/sample-scene.md` — reference examples for prose quality and length
- `docs/profile-spec.md` — what the age-25 profile contains and how it is generated
- `docs/sources.md` — the research, with ids used throughout content

## Tech constraints
- Static site hosted on GitHub Pages. No server, no database, no API keys, no LLM calls at runtime.
- Vanilla HTML, CSS, and JavaScript (ES modules). No framework and no build step.
- All asset and fetch paths must be relative (`./content/k12.json`, not `/content/k12.json`),
  because the site is served from `https://<user>.github.io/<repo-name>/`.
- Story text lives in `content/*.json`; numbers and citations live in `content/data/*.json`.
  Never hardcode story text, statistics, or citations in JavaScript.
- Save progress in `localStorage`. Wrap every read and write in try/catch so the game still
  works when storage is unavailable.
- External links (sources, policy resources) open in a new tab with `rel="noopener"`.
- Must work on phones (from 360px wide), with the keyboard alone, and with a screen reader.

## Folder layout
```
index.html
styles.css
engine/        state machine, rendering, stat and economy logic, save/load (no story text)
content/       one JSON file per life stage, plus events.json
content/data/  names.json, sources.json, benchmarks.json, family-income.json,
               net-price.json, salaries.json, policies.json
profile/       turns the final state into the age-25 profile, comparison, and sources page
tools/         simulate.mjs, validate.mjs, check-links.mjs (Node, dev-only)
docs/          planning documents
```

## Non-negotiable rules
- **Every random outcome is shown.** Any random event, chance roll, or long-shot result gets
  its own card telling the reader what happened, how it affects the child, and why
  (with a source). Nothing random changes the state silently.
- **Research first.** Every decision, event, and number cites one or more source ids from
  `content/data/sources.json`. If no source supports an effect, keep the effect small and
  flag it for the author.
- **Third person, present tense**, using the child's generated name and pronouns via
  template tokens (see `content-schema.md`).
- **Show inequity without blaming individuals.** Constraints (cost, eligibility, lotteries,
  connections) are visible and explained; no path is portrayed as a moral failure.
- **Policy framing is evidence-based and nonpartisan.** Describe policies, their evidence,
  and their trade-offs. Never name parties or politicians.

## Commands
- `python3 -m http.server 8000` — serve locally at http://localhost:8000 (fetch() does not work over file://)
- `node tools/simulate.mjs --runs 10000` — random playthroughs; reports outcome and income
  distributions by starting background, unreachable scenes, dead ends, and event rates
- `node tools/validate.mjs` — check content and data files against the schema
- `node tools/check-links.mjs` — check that every source and policy URL responds

## Working agreements
- Build the engine with placeholder content before writing real story content.
- After changing content, stat rules, or data, run the validator and the simulator and
  report anything notable.
- Do not add dependencies without asking.
- Never invent a statistic. If a number is needed and isn't in `content/data/`, ask.
- When a document in /docs and the code disagree, ask which one is right; don't guess.

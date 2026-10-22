# Life Path

An interactive story that follows one American child from birth to 25. The reader makes
the choices that shape the child's life, sees every chance event along the way, and ends
with a profile at 25: income, debt, turning points, the same life replayed from a
different family background, and research-backed policies that could change the odds.

Every number on screen comes from a cited source. It's a static site with no
dependencies, no build step, and no server.

## Run it locally

You need Python 3 (to serve the files) and Node 22+ (only for the dev tools).

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly won't work, because
browsers block `fetch()` from `file://` pages.

Progress is saved in the browser's localStorage. Use **Start over** in the menu to reset.

## Dev tools

```sh
node tools/validate.mjs              # check content and data against the schema
node tools/simulate.mjs --runs 10000 # random playthroughs: outcomes by background, dead ends, display rule
node tools/check-links.mjs           # check that every source URL responds
```

The validator and simulator exit with an error if something is broken. Both run in CI
on every push, and again before each deploy.

## Deploy to GitHub Pages

The site deploys from the `production` branch through GitHub Actions
(`.github/workflows/deploy.yml`). The workflow validates the content, runs the simulator,
and publishes only the files the site needs: `index.html`, `styles.css`, `engine/`,
`profile/`, and `content/`.

One-time setup on GitHub:
1. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions**.
2. Push the `production` branch (`git push origin main:production` publishes `main`).
3. If the deploy fails with "Branch "production" is not allowed to deploy to
   github-pages", go to **Settings → Environments → github-pages → Deployment branches and
   tags**, add `production`, and re-run the workflow.

The site is then served at `https://<user>.github.io/<repo>/`. Every path in the site is
relative, so it works from that subfolder.

To release: merge into `main`, then push `main` to `production`.

## Project layout

```
index.html, styles.css   the page
engine/                  state machine, rendering, economy, save/load (no story text)
profile/                 the age-25 profile, comparison, and policy cards
content/                 story text: one JSON file per life stage, events, UI text, rules
content/data/            names, sources, benchmarks, income, prices, salaries, policies
tools/                   validate, simulate, check-links (Node, dev only)
docs/                    planning documents: start with docs/brief.md and docs/build-plan.md
```

## Status

This is the MVP: one decision in most life stages (13 are planned), with real data for
family income, college prices and aid, completion, and salaries. `docs/build-plan.md`
lists what comes next, and `node tools/validate.mjs` lists every value and effect still
waiting on a source.

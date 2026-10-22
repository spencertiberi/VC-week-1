# Kickoff Prompts

A suggested sequence of Claude Code sessions. Each prompt assumes `CLAUDE.md` and `/docs`
are in the repo. Start a fresh session when a conversation gets long; `CLAUDE.md` carries
the context forward.

---

## Before session 1
1. Resolve every **TODO(author)** in `/docs` (search the folder for `TODO(author)`).
   The big ones: race and gender modeling, the birth lottery, and your list of policies.
2. Open each link in `docs/sources.md` and confirm it supports its claim.
3. Run `git init` in this folder (or create a GitHub repository and copy these files into
   it), then open the folder in VS Code and start Claude Code there.

---

## Session 1 — Plan (use plan mode)
> Read CLAUDE.md and everything in /docs. Then propose:
> 1. The file structure and the responsibility of each engine module
> 2. How scenes, availability, long shots, results, events, and the economy model are
>    evaluated, and how the display rule ("every random outcome is shown") is enforced
> 3. A build order with a working, playable milestone at each step
> 4. Any gaps, contradictions, or open questions in the docs
>
> Don't write code yet.

Answer its questions, update the docs where they were unclear, then approve the plan.

## Session 2 — Data files
> Build content/data/sources.json from docs/sources.md. Then create names.json from the
> SSA top 200 names for the most recent year available (200 female and 200 male, in rank
> order). Create family-income.json, net-price.json, salaries.json, and benchmarks.json
> using only the sources in sources.json. For each value, record sourceId and year, and
> list in a table which values you couldn't find so I can fill them in. Never estimate.

Spot-check at least ten values against the source pages yourself.

## Session 3 — Engine skeleton
> Build the engine following the approved plan, with placeholder content: one decision per
> stage, one event, one result of each type, and one research note, all using the real
> schema and data files. Include the name draw and pronoun tokens, option availability
> (unaffordable and stretch states), the seeded RNG, the display log, save/resume, and a
> placeholder profile screen listing final state. Make it run with
> `python3 -m http.server 8000`.

Play it end to end yourself before moving on.

## Session 4 — Tools
> Write tools/validate.mjs, tools/simulate.mjs, and tools/check-links.mjs as described in
> content-schema.md and CLAUDE.md. The simulator should report, by starting background:
> median and spread of income at 25, earnings from 18 to 25, debt, credential, collegeTier,
> and field; how often each scene, event, and result is reached; unreachable scenes; dead
> ends; and any random state change without a displayed card (fail on this).

## Session 5 — Deploy
> Set up deployment to GitHub Pages from the main branch root. Check that every path is
> relative and that the site works from a subfolder. Tell me which repository settings to
> change.

## Sessions 6–12 — One stage per session
> Write content/02-elementary.json following story-outline.md (D4, D5, R2, E1, N2),
> content-schema.md, and story-bible.md. Match the voice and length of sample-scene.md.
> Add the events this stage needs to events.json. Cite source ids for every scene, choice,
> and event. Then run the validator and the simulator and summarize anything unbalanced,
> especially options that are unavailable for every low-income background.

After each stage, play it twice: once from the lowest starting background and once from the
highest, making the same choices. Give specific feedback ("the private school option feels
like the obvious choice when it's affordable").

## Session 13 — Economy and income
> Implement the full admissions, aid, completion, job offer, and income model from
> state-model.md using the data files. Add a simulator report comparing income at 25 and
> elite-college admission rates across starting backgrounds, next to the figures in
> the cited research, so I can judge whether the gaps are realistic.

## Session 14 — Ending
> Build the ending from profile-spec.md: profile, income chart (follow the dataviz skill),
> turning points, chosen/chance/starting-point bar, "what the model leaves out,"
> "Same choices, different start," policy cards from policies.json, take-action links,
> and the sources page. Add a simulator option that prints 10 complete sample endings
> so I can read them.

## Session 15 — Balance and fairness review
> Run the simulator with 10,000 runs and compare against the definition of done in
> brief.md. Then read every scene, event, and policy card and flag anything that breaks
> the fairness or policy-framing rules in story-bible.md. Propose changes; don't apply them
> until I approve.

## Session 16 — Polish and accessibility
> Review the site for mobile layout, keyboard navigation, focus management between scenes,
> screen-reader announcements (including disabled options and their reasons), chart
> accessibility, color contrast, and reduced motion. Fix issues and list anything you
> couldn't fix.

---

## Useful prompts at any time
- "Show me every place a starting background changes which options are available."
- "Which numbers on screen don't have a sourceId and year?"
- "Play through as a child from the lowest bracket and narrate what's out of reach at each step."
- "Which choices does the simulator say matter least? Suggest ways to make them matter more."
- "Write a facilitator's guide with discussion questions for each research note."

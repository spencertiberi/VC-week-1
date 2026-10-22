# Project Brief

> Lines marked **TODO(author)** are decisions only you can make. Replace them before your
> first build session; Claude Code will treat everything else here as settled.

## One-line pitch
Follow one American child from birth to 25, make the choices that shape their life, and
see how much of where they end up was chosen, how much was luck, and how much was decided
before they were born.

## Audience
**Young adults (roughly 18–30).** Many are close to the decisions in the story (college,
first jobs, debt), and they are old enough to vote, organize, and push for policy change.

## Purpose
1. **Make inequality concrete.** Readers should *feel* how family income, parents'
   education, and place change the options a child has, using real prices, eligibility
   rules, odds, and outcomes.
2. **Keep it honest about agency.** Choices still matter. The story shows both what
   individuals control and what they don't.
3. **Connect the story to policy.** The ending links what happened to specific,
   research-backed policies, and points readers to ways to learn more and get involved.
4. **Ground it in research.** Every decision, event, and number traces to a linked source,
   and all sources are listed at the end.

## What the reader should walk away with
- "The same kid with the same choices can end up in very different places depending on
  where they started."
- "Some of what looks like merit (admissions, internships, first jobs) runs through money
  and connections."
- "There are specific policies with evidence behind them that change these odds."
- **TODO(author):** Add or replace with the one or two inequities you most want readers to
  notice (for example: childcare costs, school funding, legacy admissions, student debt).

## Experience goals
- One playthrough takes 12–15 minutes: about **13 decisions**, plus random-event cards,
  results (admissions, financial aid, job offers), and short research notes.
- Random events add variety, and **every event that happens is shown to the reader**.
- Two playthroughs with different backgrounds and identical choices should look visibly
  different, especially in options available, college access, debt, and income at 25.
- The ending feels earned: the profile names the specific choices, starting conditions,
  and chance events that mattered most.
- Every life is portrayed with dignity. No path is a "losing" path, even when it's harder.

## Tone
Warm, observant, and honest, with the clarity of good explanatory journalism. The story
shows inequity through concrete detail and lets the research notes carry the evidence.
See `story-bible.md`.

## Realism
**Data-calibrated.** Stat effects, odds, prices, and incomes come from the research and data
in `sources.md`. Real numbers appear on screen in research notes, results screens, and the
profile, always with a linked source.

## Open questions for the author
- **TODO(author): Race and ethnicity.** Racial gaps in US opportunity are large and well
  documented (see `oi_race` in `sources.md`). Options:
  (a) don't assign race; say clearly on the profile that the model leaves it out, and cite
  the research on racial gaps in a research note; or
  (b) model it explicitly with research-backed effects.
  Recommendation for v1: (a), because modeling race responsibly takes much more care.
- **TODO(author): Gender.** The name list includes the sex SSA records, which sets the
  child's pronouns. Should gender affect outcomes (for example, the pay gap at 25)? If yes,
  it must be shown explicitly and cited, never applied silently. Recommendation for v1: no
  effect on outcomes, plus a research note about the gender pay gap.
- **TODO(author): Birth lottery.** Should the first screen offer "Let chance decide" for the
  family background (D1–D2), alongside choosing it? Recommendation: yes. It makes the
  point that nobody chooses their parents.

## In scope (v1)
- 7 life stages, 13 decisions, 3 random-event slots, and automatic results screens
  (school lottery, admissions, financial aid, degree completion, job offers, yearly income)
- A random name and pronouns from SSA's top 200 names for the latest year
- Hidden stats plus an explicit economy model (family income, debt, salary, income 18–25)
- A research note at the end of each stage, with a linked source
- Age-25 profile: narrative, income chart, turning points, "chosen, chance, or starting
  point" breakdown, policy connections, take-action links
- **"Same choices, different start":** re-run the reader's choices with a different family
  background and show the two lives side by side (this can slip to v2 if needed)
- A sources page listing every source, with links, separated into "used in this story" and
  "full bibliography"
- Save and resume with localStorage; start-over button
- Mobile-friendly, keyboard-accessible, screen-reader friendly
- Deployed to GitHub Pages

## Out of scope (v1)
- User accounts, backends, analytics that identify readers
- AI-generated text at runtime
- Collecting reader data or sending messages to officials from the site (link out instead)
- Multiple languages

## Ideas for v2
- "What if?" mode: change one past decision and see the alternate life
- Shareable result card (no personal data)
- Facilitator guide with discussion questions for classes and organizers
- State-specific data (for example, pre-K access or tuition in the reader's state)

## Definition of done (v1)
- [ ] Every scene is reachable, and every path reaches the profile (simulator)
- [ ] Every random event and chance roll that fires shows a card (simulator check: no state
      change from randomness without a matching card in the log)
- [ ] Every scene, event, research note, and data value has at least one valid source id
      (validator)
- [ ] Every source URL responds (link checker), and the sources page lists them all
- [ ] Simulator shows a clear gap in median income at 25 and in elite-college access
      between the lowest and highest starting backgrounds, with sizes in line with the
      research cited (author reviews the report)
- [ ] Every starting background can still reach at least 5 of the 7 career fields
- [ ] Passes a keyboard-only playthrough and a Lighthouse accessibility score of 95+
- [ ] Live on GitHub Pages and loads in under 2 seconds on a phone

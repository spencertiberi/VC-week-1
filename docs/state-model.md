# State Model

The story uses **state-based branching**: choices change hidden stats and set flags, and
later scenes read that state to decide which text, options, and events appear. On top of
the stats sits an **economy model** with real dollar figures (family income, prices, aid,
debt, salary) drawn from `content/data/`.

All numbers in this document are starting points. **TODO(author):** tune them with the
simulator, and check them against the sources cited.

## The child
At the start of each playthrough:
1. Pick a sex 50/50, then a name uniformly at random from that sex's column in
   `content/data/names.json` (SSA's top 200 names for the most recent year).
2. Set pronouns from the SSA sex column: `{ subj: "she", obj: "her", poss: "her",
   possPro: "hers", refl: "herself" }` or the "he" equivalent.
3. Never infer race, ethnicity, religion, or class from the name.
4. Recurring side characters draw names from a separate list and must never match the
   child's name.

Gender has no effect on outcomes unless the author decides otherwise (see `brief.md`).

## Stats
Integers from 0 to 100. Hidden during play; explained in plain language on the profile.

| Stat | Meaning | Examples of what raises it |
|---|---|---|
| `academics` | Skills, grades, credentials | Bedtime reading, quality preschool, rigorous courses, tutoring |
| `finances` | The child's economic security (family resources as a child; own savings and debt as an adult) | Higher family income, a part-time job, grants |
| `network` | Social capital: mentors, cross-class friendships, knowing how systems work | Parents' degrees, school peers, teams, internships |
| `wellbeing` | Mental and physical health, sense of belonging | Close friends, stable home, sleep, health insurance |
| `resilience` | Ability to recover from setbacks | Working through challenges, caregiving, a job |

### Starting values
Every stat starts at 50, then D1 and D2 adjust it. These defaults roughly track the size of
gaps in the cited research (`bls_education_pays`, `oi_land_of_opportunity`, `oi_atlas`):

| D1 Parents' education | academics | finances | network |
|---|---|---|---|
| No high school diploma | −10 | −18 | −15 |
| High school diploma | −5 | −10 | −8 |
| Some college or associate | 0 | −4 | −3 |
| Bachelor's | +6 | +10 | +10 |
| Graduate or professional | +9 | +15 | +14 |

D2 adjusts by up to ±10 more (high-poverty neighborhood: `network` −8, `academics` −4;
affluent suburb: `network` +8, `academics` +4). Starting values stay between 15 and 85.

## Economy
Concrete dollar values the reader sees. Every value comes from a file in `content/data/`
with source ids.

| Field | Set by | Data file |
|---|---|---|
| `familyIncome` | D1 + D2, then changed by events (job loss, illness) | `family-income.json`: median household income by parents' education (`bls_education_pays`, `census_acs`) |
| `familyIncomeBracket` | Derived from `familyIncome`: `low` · `lower_middle` · `middle` · `upper_middle` · `high` | Bracket edges match College Scorecard net-price bands |
| `collegeTier` | D13 + R5 | `elite_private` · `flagship` · `regional` · `community` · `none` |
| `credential` | R7 | `hs_diploma` · `certificate` · `associate` · `bachelors` · `graduate` · `apprenticeship` · `military_service` |
| `studentDebt` | R6, grows with grad school | `net-price.json` (`college_scorecard`, `cb_trends`, `fsa_pell`) |
| `job` | D15 | `salaries.json` (`bls_ooh`, `nyfed_recent_grads`, `college_scorecard`) |
| `incomeByAge` | Income model, ages 18–25 | Derived |

## Option availability
Each option is **available**, **a long shot**, **unaffordable or ineligible**, or **hidden**.

- **Available:** always selectable.
- **Long shot:** selectable; the outcome uses a chance roll, and the result is always shown
  on a result (R) card with the factors that helped and hurt.
- **Unaffordable or ineligible:** shown but disabled, with the reason on the button and a
  source link. Examples: private preschool tuition is more than 20% of `familyIncome`;
  Head Start requires income at or below the poverty guideline; homeschool requires a
  parent at home. **This is the main way the story makes inequity visible.**
  Between "affordable" and "unaffordable" sits **a stretch**: still selectable, but the
  button shows the share of income ("about 14% of the family's income; the federal
  benchmark for affordable childcare is 7%") and the `finances` cost is larger.
  **TODO(author):** confirm the 7% benchmark against `hhs_childcare_affordability` and choose
  your own cutoff for "unaffordable."
- **Hidden:** only when an option makes no sense in the story (no "stays on the varsity
  team" for a child who never played).

Rule: every decision must leave **at least two available options** for every starting
background.

## Rules for changing stats
1. A single choice changes at most 3 stats.
2. Typical change: ±3 to ±8. A big moment: up to ±15. Never more than ±15.
3. Every option has at least one plus and one minus (D1–D2 are exempt). The validator
   warns otherwise.
4. Clamp stats to 0–100 after every change.
5. **Diminishing returns:** above 80, positive changes are halved; below 20, negative
   changes are halved.
6. **Resources buffer shocks:** a negative event's effects are scaled by family resources.
   Multiply by 1.5 when `familyIncomeBracket` is `low` and by 0.5 when `high`. Show this
   on the event card ("Because the family had savings, …" or "With no paid sick leave, …").
   Cite `oreopoulos_displacement` and `kff_health_costs`.
7. Every choice, event, and result stores `sourceIds`; the profile's sources page is built
   from them.

## Long shots and results
Probabilities are formula objects (see `content-schema.md`), clamped between 0.02 and 0.95.
The result card lists each factor that applied, in plain language.

### Elite private college admission (R5)
Modeled on `oi_college_admissions`, which finds that among applicants with the same test
scores, children from the richest families are admitted more often, mainly because of
legacy preferences, recruited athletics, and higher non-academic ratings.

| Factor | Effect on probability |
|---|---|
| Base | 0.03 |
| `academics` | +0.05 per 10 points above 70 |
| Strong activities (`activity_deep`, `leadership`, or `varsity`) | +0.04 |
| `network` ≥ 65 (counselor attention, essay help, test prep) | +0.05 |
| `legacy` flag (set at D1 for some graduate-degree families) | +0.15 |
| `recruited_athlete` flag (set by the recruiting card at age 17) | +0.20 |
| Cap | 0.60 |

The R5 card names the factors, for example: "Factors that helped: grades, debate team.
Factors that weren't available to {name}: legacy status, private counseling."

Public flagship: base 0.50, +0.08 per 10 `academics` above 55, cap 0.92.
Regional public universities, HBCUs, community colleges, apprenticeships, and the military
are available to everyone with a diploma. An apprenticeship may involve a short waitlist
event.

### Sports tryout (R4)
**TODO(author):** no source yet supports these odds, so they are placeholders. Keep the
effects small until one is found.

| Factor | Effect on probability |
|---|---|
| Base | 0.30 |
| `activity_sport` (played at D5 or D7) | +0.25 |
| `activity_deep` (stuck with one activity since childhood) | +0.15 |
| `finances` ≥ 60 (private coaching or camps); its `missingLabel` lists it as "wasn't available" | +0.10 |
| Cap | 0.90 |

Success sets `varsity`. A failed roll shows the card and sends {name} back to the other
D10 options (`retryOf`). The result scene uses `resultType: "lottery"`, the plain long-shot
card, so it isn't styled like a college admissions decision.

### Recruiting card (age 17)
An `event_slot` with its own `probability` formula (scene `hs_recruiting`, event
`college_recruiting`). Only players with `varsity` or `club_sport` can get it. Base 0.03;
`club_sport` +0.07 (showcases where coaches scout); `activity_deep` +0.05; cap 0.25. If it
fires, a card shows it and sets `recruited_athlete`. **TODO(author):** these odds need a
source; NCAA research on how many high school athletes go on to play in college is a
candidate to verify and add.

### Activity and club costs
`aspen_parent_survey_2024` reports what families spend on a child's main sport by household
income, and how many play on travel or club teams, but not what a club team costs. So the
travel and club options at D7 and D10 have no cost cutoff. They are a **stretch** for the
`low` and `lower_middle` brackets, and the button shows the real spending and participation
gaps from `benchmarks.json`. Matching those two brackets to the survey's "under $50,000"
group is an assumption.

### High school choice (D8 and R3)
- **Selective public high school:** a long shot. Base 0.10, +0.10 per 10 `academics` above
  60, +0.10 if `network` ≥ 65 (tutoring and test prep; listed as "wasn't available"
  otherwise), cap 0.70. Success sets `school_selective`. **TODO(author):** placeholder odds.
- **Private high school:** a long shot that combines admission and paying for it. The option
  shows average private high school tuition from `content/data/private-school.json`
  (`nces_private_school`, 2020–21). Base 0.80; −0.68 when tuition is more than 20% of
  `familyIncome`, because the family then needs a scarce scholarship; cap 0.90. Success
  sets `school_private`. **TODO(author):** admission and scholarship odds need a source.
- A failed attempt shows R3 and returns to the remaining D8 options (`retryOf`). R3 uses
  `resultType: "admission"`, but the applicant-portal styling only applies to results whose
  success sets a `collegeTier`.

### Course access (D9)
Students at public schools in high-poverty, rural, or small-town areas (no
`school_selective` or `school_private` flag) see "takes every AP class the school offers"
(smaller `academics` gain) in place of the full AP-heavy load. **TODO(author):** this needs a
statistic on AP access by school poverty or rurality (`college_board_ap`, `nces_coe`).

### Sticking with one activity (`activity_deep`)
Set by D6 (shared-interest club) or, through `setFlagsIf`, by continuing an activity: a
team sport at D5 and again at D7, music or clubs at D5 then band or robotics at D7, music at
D5 then arts at D11, or clubs or robotics before competitions at D11.

### Financial aid (R6)
Net price comes from `net-price.json`, by `collegeTier` × `familyIncomeBracket`. The R6 card
shows: sticker price, grants, net price, how it's covered (family, work, loans), and
projected debt at graduation. Choosing to work more lowers debt and lowers the completion
odds.

### Completion (R7)
Base by tier, from `nsc_completion`. Modifiers: `finances` (+/−), work hours above 20 a
week (−), `wellbeing` < 35 (−), and a negative E3 (−). If {name} doesn't finish, the card
explains why and what comes next (some credits, a certificate, re-enrolling later).

## Income model (ages 18–25)
Computed once a year and stored in `incomeByAge`. The R9 cards show each year from 23 to
25, and the profile shows a chart covering 18–25.

1. **While in school full time:** part-time earnings only (if working), from `salaries.json`.
2. **Apprenticeship:** wages rise each year on a schedule (`dol_apprenticeship`).
3. **Military:** basic pay by rank and year (`dfas_pay`); show housing and benefits as a note.
4. **Working after high school:** entry wage for high-school-diploma jobs in the region (`bls_ooh`).
5. **After the credential:** starting salary from the chosen offer (D15).
6. **Each later year:** salary × (1 + base growth for the field) + any career event.
7. **Modifiers** applied when offers are generated (not silently each year):
   - `collegeTier`: offer quality and count (elite > flagship > regional), from
     `college_scorecard` and `oi_college_admissions`
   - `network`: number of offers and chance of a referral-based offer
   - Region: wage level (and the profile mentions cost of living)
8. **Debt:** standard 10-year repayment from age 22 (or after grad school); show the
   monthly payment and remaining balance on R9 cards.

Career events (promotion, layoff, side income, employer-paid certification) are rolled each
year, and **every one that fires is shown on that year's card**.

## Random events
- Use a seeded random number generator saved in state, so a playthrough can be replayed
  exactly and tests are reproducible.
- Slots: E1 (age 9), E2 (age 16), E3 (age 20), plus chance events attached to specific
  choices (party consequence) and career events in R9.
- Each slot has a 70% chance that an event fires. **Every event that fires gets a card.** A
  slot that fires nothing shows nothing.
- Event probabilities depend on state where research supports it: a parent's job loss is
  more likely in the `low` and `lower_middle` brackets, health shocks are spread more
  evenly, but their effects are buffered by income (rule 6 above).
- Roughly equal numbers of positive, negative, and mixed events in the event pool.
- Required events in the pool include: a parent becomes seriously ill, a parent loses their
  job, the family moves, an exceptional teacher or mentor, a financial windfall, and a
  close friend moves away.

## The display rule (enforced in code)
The engine logs every state change with its cause: `choice`, `event`, `roll`, or `economy`.
For any change caused by `event` or `roll`, the log must show that a card was displayed.
`tools/simulate.mjs` fails if it finds one that wasn't.

## Attribution (for the profile)
Each history entry is tagged:
- `start`: D1, D2, and their starting adjustments
- `choice`: reader decisions D3–D15
- `chance`: random events, lotteries, and long-shot rolls

The profile totals the absolute stat changes in each category (and the dollar effects where
traceable) to show how much of the life came from the starting point, choices, and chance.

## History
`state.history` entries: `{ id, kind: "decision"|"event"|"result", category:
"start"|"choice"|"chance", age, choiceId?, effects, economy?, sourceIds }`.

## Saved state shape
```json
{
  "version": 2,
  "seed": 834201,
  "child": { "name": "Mateo", "sex": "M", "pronouns": { "subj": "he", "obj": "him", "poss": "his", "possPro": "his", "refl": "himself" } },
  "age": 18,
  "sceneId": "ahs_path",
  "stats": { "academics": 66, "finances": 34, "network": 48, "wellbeing": 57, "resilience": 70 },
  "flags": ["first_gen", "region_town", "school_public", "activity_sport", "had_job"],
  "economy": {
    "familyIncome": 52000,
    "familyIncomeBracket": "lower_middle",
    "collegeTier": null,
    "credential": "hs_diploma",
    "studentDebt": 0,
    "job": null,
    "incomeByAge": { "16": 4200, "17": 6100 }
  },
  "history": [
    { "id": "D1", "kind": "decision", "category": "start", "age": 0, "choiceId": "hs_diploma",
      "effects": { "academics": -5, "finances": -10, "network": -8 }, "sourceIds": ["bls_education_pays"] }
  ],
  "displayLog": ["E1:parent_illness"]
}
```
The example income figures above are placeholders, not data. Bump `version` whenever the
shape changes, and discard older saves instead of crashing.

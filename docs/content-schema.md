# Content Schema

Story text lives in `content/`; numbers, names, and citations live in `content/data/`.

```
content/
  00-beginnings.json
  01-early-childhood.json
  02-elementary.json
  03-middle-school.json
  04-high-school.json
  05-after-high-school.json
  06-early-adulthood.json
  events.json
  data/
    names.json           SSA top 200 names by sex, latest year
    sources.json         every citation, with id and URL
    benchmarks.json      statistics shown on screen
    family-income.json   household income by parents' education and place
    net-price.json       college net price by tier × income bracket
    salaries.json        entry wages and salaries by role, credential, region
    policies.json        policy levers shown on the profile
```

## Template tokens
All text fields support these tokens, filled from `state.child`:

| Token | Example (she / he) |
|---|---|
| `{name}` | Ava / Mateo |
| `{subj}` / `{Subj}` | she / he (capitalized: She / He) |
| `{obj}` | her / him |
| `{poss}` / `{Poss}` | her / his |
| `{possPro}` | hers / his |
| `{refl}` | herself / himself |
| `{familyIncome}` | $52,000 (formatted from `state.economy`) |
| `{stat:<benchmarkId>}` | A value from `benchmarks.json`, formatted |

The validator fails on unknown tokens. Pronoun tokens only ever produce he/she forms, so
verbs stay singular ("{Subj} walks").

## Stage file
```json
{
  "stage": "high_school",
  "title": "High School",
  "ageRange": [14, 18],
  "firstScene": "hs_school_choice",
  "scenes": [ ... ],
  "researchNote": { ... }
}
```

## Decision scene
```json
{
  "id": "hs_friday_party",
  "kind": "decision",
  "decisionId": "D10",
  "age": 16,
  "chooser": "child",
  "title": "Friday Night",
  "text": "Jordan's parents are out of town, and by third period everyone knows it. ...",
  "textVariants": [
    { "if": { "hasFlag": "varsity" }, "append": "Coach has a 7 a.m. practice tomorrow, and he notices who's tired." },
    { "if": { "hasFlag": "had_job" }, "append": "{Subj} is on the schedule at the grocery store at 9." }
  ],
  "sourceIds": ["cdc_yrbs"],
  "choices": [
    {
      "id": "stay_late",
      "label": "{Subj} goes and stays until the end",
      "effects": { "network": 8, "wellbeing": 3, "academics": -4 },
      "setFlags": ["party_regular"],
      "chanceEvent": { "eventId": "party_consequence", "probability": 0.1 },
      "outcome": "{name} gets home at 2:40. ...",
      "next": "@nextStage"
    }
  ]
}
```

### Scene fields
| Field | Required | Description |
|---|---|---|
| `id` | yes | Unique across all content. Prefix with the stage (`hs_`, `ms_`, …). |
| `kind` | yes | `"decision"`, `"result"`, or `"note"` (events live in `events.json`). |
| `decisionId` | decisions | Matches the outline (`D10`). |
| `age` | yes | The child's age. |
| `chooser` | decisions | `"family"` or `"child"`. Shown as "Family decision" or "{name}'s decision." |
| `title` | yes | Short heading. |
| `text` | yes | 80–150 words, third person, present tense. `\n\n` for paragraph breaks. |
| `textVariants` | no | Sentences appended or prepended when a condition is true. 1–2 sentences each. |
| `sourceIds` | yes | Source ids that justify the scene's options and effects. At least one. |
| `choices` | decisions | 2–5 choices. Order them so no option sits in a "best" position. |

### Choice fields
| Field | Required | Description |
|---|---|---|
| `id` | yes | Unique within the scene. |
| `label` | yes | Under 70 characters. Third person action ("{Subj} joins the robotics club"). |
| `description` | no | One line under the label, under 110 characters. |
| `effects` | yes | At most 3 stats; each between −15 and +15. |
| `economy` | no | Economy changes, e.g. `{ "familyIncomeDelta": -12000 }` or `{ "set": { "collegeTier": "flagship" } }`. |
| `setFlags` / `clearFlags` | no | Arrays of flag names. |
| `availability` | no | See below. |
| `longShot` | no | `{ "probability": <expression>, "factors": [...], "resultScene": "<id>" }`. The result scene always renders the outcome and the factors. |
| `chanceEvent` | no | `{ "eventId": "...", "probability": 0.1 }`. If it fires, the event card is shown before moving on. |
| `next` | yes* | Next scene id, or `"@nextStage"`. *Not needed with `longShot`. |
| `outcome` | no | 1–2 sentences shown before moving on. |
| `sourceIds` | no | Extra sources specific to this choice. |

### Availability
```json
"availability": {
  "unavailableIf": { "economy": "familyIncome", "costShareAbove": 0.20, "cost": { "data": "childcare.private_preschool" } },
  "reason": "About {cost} a year, more than {name}'s family can afford",
  "stretchIf": { "economy": "familyIncome", "costShareAbove": 0.07, "cost": { "data": "childcare.private_preschool" } },
  "stretchNote": "About {costShare} of the family's income",
  "sourceIds": ["dol_childcare_prices", "hhs_childcare_affordability"]
}
```
Other forms: `{ "unavailableIf": { "notFlag": "parent_at_home" }, "reason": "No parent is home during the day" }`.
An unavailable option is rendered disabled, with its reason visible and announced to
screen readers.

## Result scene (R)
Results are rendered from engine data plus a short text template:
```json
{
  "id": "ahs_admission_result",
  "kind": "result",
  "resultType": "admission",
  "age": 18,
  "title": "The Email",
  "textIfSuccess": "...",
  "textIfFailure": "...",
  "showFactors": true,
  "sourceIds": ["oi_college_admissions"],
  "next": { "ifSuccess": "ahs_aid_offer", "ifFailure": "ahs_path_retry" }
}
```
Result types: `lottery`, `admission`, `aid`, `completion`, `job_offers`, `year_review`.
The `aid`, `job_offers`, and `year_review` types render dollar tables from the economy
model.

## Research note (N)
```json
"researchNote": {
  "id": "n2_school_spending",
  "title": "Behind the Story: School Funding",
  "text": "Because many schools are funded partly by local property taxes, ...",
  "benchmarkIds": ["school_spending_effect"],
  "sourceIds": ["jackson_school_spending"]
}
```
Under 90 words, one key statistic, with the source linked inline.

## Events (`content/events.json`)
```json
{
  "events": [
    {
      "id": "parent_illness",
      "slots": ["E1", "E2", "E3"],
      "baseProbability": 0.12,
      "modifiers": [],
      "tone": "negative",
      "title": "A Diagnosis",
      "text": "{name}'s dad has been tired for months. ...",
      "impactText": "...",
      "effects": { "finances": -10, "wellbeing": -8, "resilience": 5 },
      "economy": { "familyIncomeDelta": -15000 },
      "scaleByResources": true,
      "setFlags": ["parent_ill"],
      "sourceIds": ["kff_health_costs", "oreopoulos_displacement"]
    }
  ]
}
```

| Field | Description |
|---|---|
| `text` | What happened, 60–120 words. |
| `impactText` | Required. One or two plain sentences on how this affects {name}, including the buffering note when `scaleByResources` is true ("Without paid sick leave, …"). |
| `scaleByResources` | Applies the resource multiplier from `state-model.md`, rule 6. |
| `tone` | `positive`, `negative`, or `mixed`. |

Every event that fires renders as its own card: **title, what happened, how it affects
{name}, and the source link**. There is no way to apply an event without rendering it.

## Data files

### `sources.json`
```json
{ "id": "oi_college_admissions", "authors": "Chetty, Deming & Friedman", "year": 2023,
  "title": "Diversifying Society's Leaders? The Determinants and Causal Effects of Admission to Highly Selective Private Colleges",
  "publisher": "National Bureau of Economic Research", "url": "https://...", "topic": "after_high_school" }
```

### `benchmarks.json`
```json
{ "id": "median_income_25", "claim": "Median earnings of 25-to-29-year-olds working full time",
  "value": 0, "unit": "USD", "population": "US, full-time workers", "year": 0, "sourceId": "census_acs" }
```
Values are filled in from the source by hand or by Claude Code with the source open, and
checked by the author. Never estimate.

### `names.json`
```json
{ "year": 2025, "sourceId": "ssa_names",
  "female": ["Olivia", "Emma", "..."], "male": ["Liam", "Noah", "..."] }
```
Each list has exactly 200 names, in rank order.

### `salaries.json`, `net-price.json`, `family-income.json`
Every record includes `sourceId` and `year`. Example:
```json
{ "role": "registered_nurse", "field": "health", "credential": "bachelors",
  "entrySalary": 0, "annualGrowth": 0.03, "regionMultiplier": { "city": 1.1, "rural": 0.9 },
  "sourceId": "bls_ooh", "year": 0 }
```

### `policies.json`
```json
{ "id": "universal_prek", "name": "Universal pre-K",
  "connectsTo": ["D3"], "summary": "...", "evidence": "...", "tradeoffs": "...",
  "sourceIds": ["boston_prek", "nieer_yearbook"], "learnMoreUrl": "https://..." }
```

## Validation (`tools/validate.mjs`)
Fail on:
- Duplicate ids, or a `next` that points to a missing scene
- More than 3 stats in `effects`, or any change outside −15..+15
- A missing or unknown `sourceIds` entry, or a scene, event, note, benchmark, or data
  record without a source
- An event without `impactText`
- Unknown template tokens
- A decision where some starting background has fewer than 2 available options
- `names.json` lists that don't contain exactly 200 names
- Scene text over 170 words; research notes over 100 words

Warn on:
- A choice whose effects are all positive or all negative (except D1–D2)
- Second-person words ("you," "your") in narrative text
- "good," "bad," "right," "wrong," "smart," "stupid," "lazy" in labels or outcomes
- A benchmark whose `value` or `year` is still 0

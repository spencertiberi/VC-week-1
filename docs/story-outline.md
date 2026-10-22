# Story Outline

Every screen the reader sees, in order. There are four kinds:

| Code | Kind | Reader acts? | Notes |
|---|---|---|---|
| **D** | Decision | Yes, picks an option | 15 in total, the most the brief allows |
| **E** | Random life event | No, reads a card | Shown only when an event fires; every event that fires is shown |
| **R** | Result | No, reads a card | Outcome of a lottery, application, tryout, aid offer, completion roll, or job search |
| **N** | Research note | No, reads a card | One per stage: a real statistic plus a linked source |

Stat and flag names refer to `state-model.md`. Source ids refer to `sources.md`.

> **TODO(author):** Rewrite the "Inequity shown" column in your own words. That column is
> the argument the story makes.

## Who is choosing?
The story is told in third person about the child ({name}). The reader is like an author
of the child's life:
- **Ages 0–4:** "Family decision." The reader decides for the parents.
- **Ages 5–13:** "Family decision" or "{name}'s decision," depending on the scene.
- **Ages 14+:** "{name}'s decision."

Each scene shows this label.

## Some options are out of reach, and the reader sees why
To make inequity visible, some options are shown but **unavailable**, with the reason
right on the button (for example, "Private preschool: about $X a year, more than
{name}'s family can afford"). The reader always has at least two real options. See
"Option availability" in `state-model.md`.

---

## Opening
- **Name reveal.** "This is {name}." The child's name and pronouns are drawn at random from
  SSA's top 200 names for the most recent year. A small note explains where the name came
  from (`ssa_names`).

## Stage 0 — Beginnings (age 0)

| # | Decision | Options | Main effects | Inequity shown | Sources |
|---|---|---|---|---|---|
| D1 | Parents' education and work | Neither parent finished high school (hourly service work) · High school diploma (trades or retail) · Some college or associate degree (health care support, office work) · Bachelor's degree (salaried) · Graduate or professional degree | Sets `familyIncome` bracket (the dollar figure is shown on each option), starting `academics`, `finances`, `network`; sets `first_gen` if no bachelor's degree | Income and know-how differ sharply by parents' education | `bls_education_pays`, `oi_land_of_opportunity`, `lareau_unequal` |
| D2 | Where they grow up | High-poverty city neighborhood · Working-class suburb · Affluent suburb · Small town · Rural area | Sets `region_*` flag and `neighborhood_opportunity`; affects school funding, school options, job market | Place shapes mobility, even for children from similar families | `oi_atlas`, `oi_mto`, `jackson_school_spending` |

Option: **"Let chance decide"** picks D1 and D2 at random, weighted by real national
shares (TODO(author) in `brief.md`).

**N0:** How much a child's adult income depends on their parents' income and where they
grow up (`oi_land_of_opportunity`, `oi_atlas`).

## Stage 1 — Early Childhood (ages 3–4)

| # | Decision | Options | Main effects | Inequity shown | Sources |
|---|---|---|---|---|---|
| D3 | Childcare and preschool | A parent or grandparent at home · Home-based daycare · Head Start (income-eligible families only) · Public pre-K (only where the state offers it; may be a lottery) · Private preschool (cost shown vs. family income) | `academics`, `network`, `finances`, `wellbeing` | The price of care against family income; eligibility gaps for families just above the Head Start line | `dol_childcare_prices`, `hhs_head_start_impact`, `nieer_yearbook`, `boston_prek`, `perry_preschool`, `hhs_poverty_guidelines` |

**R1** (if public pre-K is a lottery): shows whether {name} got a seat.
**N1:** Long-term effects of high-quality preschool (`perry_preschool`, `boston_prek`).

## Stage 2 — Elementary School (ages 5–10)

| # | Decision | Options | Main effects | Inequity shown | Sources |
|---|---|---|---|---|---|
| D4 | Elementary school | Assigned public school (quality depends on D2) · Magnet or charter (lottery) · Private school (tuition shown) · Homeschool (requires a parent at home) | `academics`, `network`, `finances` | School funding tied to local property wealth; tuition out of reach for many families | `jackson_school_spending`, `nces_private_school`, `lubienski_public_advantage`, `nces_coe` |
| D5 | Activities (age 8) | Team sport (fees, travel) · Music lessons · Free clubs at school or the library · Free play outside · Watching younger siblings after school | Sets `activity_*` flag; `network`, `resilience`, `finances` | Spending on activities by family income; caregiving duties | `aspen_state_of_play`, `snellman_engagement_gap`, `putnam_our_kids` |

**R2** (if magnet or charter): lottery result.
**E1 — Random life event (age 9):** see `events.json`. Examples: a parent becomes seriously
ill, a parent loses their job, the family moves, an exceptional teacher, a family windfall.
**N2:** School spending and later earnings (`jackson_school_spending`).

## Stage 3 — Middle School (ages 11–13)

| # | Decision | Options | Main effects | Inequity shown | Sources |
|---|---|---|---|---|---|
| D6 | Friends and social life (includes a first phone) | Stays close to childhood friends · Joins the popular crowd · Finds kids with shared interests (a club or team) · Keeps mostly to self, lots of time online | `network`, `wellbeing`, sets `friend_group_*` | Friendships across class lines predict mobility | `oi_social_capital`, `surgeon_general_social_media`, `add_health` |
| D7 | Activities (age 12) | School sports team (low fee) · Travel team (a stretch for the two lowest brackets, with real spending and participation gaps shown) · School band or robotics club · Free after-school program at the rec center · Watching the younger kids after school | Sets `activity_sport`, `club_youth`, `activity_club`, `activity_rec`, or `caregiver`; `network`, `resilience`, `finances` | Spending on youth sports and travel-team participation by family income; who can afford to specialize early | `aspen_parent_survey_2024`, `snellman_engagement_gap`, `putnam_our_kids` |

**N3:** Cross-class friendship ("economic connectedness") and upward mobility (`oi_social_capital`).

## Stage 4 — High School (ages 14–18)

| # | Decision | Options | Main effects | Inequity shown | Sources |
|---|---|---|---|---|---|
| D8 | High school | Assigned public high school · Apply to a selective public or magnet high school (long shot based on `academics`) · Private or boarding school (tuition shown; need-based aid is a long shot) | `academics`, `network`, `finances`; may set `school_selective` | Who gets access to selective schools, and what paid test prep buys | `nces_coe`, `lubienski_public_advantage`, `nces_private_school` |
| D9 | Course load | AP or IB-heavy (only if the school offers it) · Balanced with some honors · Career and technical (CTE) track · Dual enrollment at the community college · Does the minimum | `academics`, `wellbeing`; sets `track_*` | Uneven access to advanced courses across schools | `college_board_ap`, `nces_coe` |
| D10 | Sports (age 15) | Tries out for a school team (long shot; result on R4) · Plays for a club team with college showcases (a stretch for the two lowest brackets) · Plays intramural or pickup games · Skips sports | Sets `varsity` or `club_sport`; `wellbeing`, `network`, `resilience`; school-team and club players can get the recruiting card | Higher-income families spend far more on youth sports and are about twice as likely to play club or travel; recruited athletes get a large admissions boost at Ivy-Plus colleges | `aspen_parent_survey_2024`, `oi_college_admissions`, `snellman_engagement_gap` |
| D11 | Time outside class (besides sports) | Leadership (student government, debate, newspaper) · Arts (theater, band, choir) · Robotics or academic competitions · Part-time job (adds income) · Caring for family · Unstructured time with friends | `network`, `finances`, `resilience`, application strength | Jobs and caregiving build real skills but count less in selective admissions | `snellman_engagement_gap`, `oi_college_admissions` |
| D12 | Friday night party | Goes and stays late · Goes for an hour, then leaves · Stays home · Invites a few friends over | `network`, `wellbeing`, `academics`; a small chance of a consequence event (shown if it fires) | The same mistake can cost different families very different amounts | `cdc_yrbs`, `add_health` |

**R3** (if a selective or private high school was attempted): admission result.
**R4** (if {name} tries out at D10): makes the team or is cut, with the factors that
helped and the ones that weren't available (years of play, private coaching or camps).
If cut, {name} picks again from the other sports options.
**E2 — Random life event (age 16):** see `events.json`.
**Recruiting card (age 17, if `varsity` or `club_sport`):** a chance roll. If a college
coach reaches out, a card shows it and sets `recruited_athlete`, which raises the
elite-college odds on R5 (`oi_college_admissions`). If the roll fails, nothing is shown.
**N4:** Who gets access to AP courses and school counselors (`college_board_ap`, `asca_ratios`).

## Stage 5 — After High School (ages 18–22)

| # | Decision | Options | Main effects | Inequity shown | Sources |
|---|---|---|---|---|---|
| D13 | Path after high school | **Elite private college** (long shot) · Public flagship university (long shot if `academics` is low) · Regional public university or HBCU · Community college with plans to transfer · Registered apprenticeship · Military · Starts working full time | Sets `path_*` and `collegeTier`; triggers the R5–R6 results | Equally qualified applicants have different odds at elite colleges depending on legacy status, recruited athletics, and resources | `oi_college_admissions`, `oi_mobility_report_cards`, `college_scorecard`, `dol_apprenticeship`, `dfas_pay` |
| D14 | Field of study or training | Options depend on path: health, technology, business, skilled trades, education, creative, public service | Sets `field_*`; affects job offers and salary | Earnings by field and by college | `college_scorecard`, `nyfed_recent_grads`, `bls_ooh` |

**R5 — Admissions result** (four-year paths): admitted or not, with the factors that
helped and hurt listed. If rejected, the reader chooses again from the paths still open.
This is not a dead end.
**R6 — Financial aid offer** (college paths): net price for {name}'s family income at that
type of college, the grants, loans, and work required, and the expected debt
(`college_scorecard`, `cb_trends`, `fsa_pell`). Elite private colleges with large aid
budgets may cost low-income families less than a state school. Show that when the data
supports it.
**E3 — Random life event (age 20):** see `events.json`.
**R7 — Completion** (college and apprenticeship paths): does {name} finish? Odds depend on
`finances`, work hours, `wellbeing`, debt, and E3. The card always explains the outcome
(`nsc_completion`).
**N5:** Completion rates and the role of money in who finishes (`nsc_completion`, `cb_trends`).

## Stage 6 — Early Adulthood (ages 22–25)

**R8 — Job offers:** 2–3 offers generated from credential, `collegeTier`, field, `network`,
and region. Each shows title, employer type, city, and starting salary (`salaries.json`).
Elite-college and high-`network` paths get more and better offers, and the card says why
(recruiting pipelines, referrals) (`oi_college_admissions`, `oi_social_capital`).

| # | Decision | Options | Main effects | Inequity shown | Sources |
|---|---|---|---|---|---|
| D15 | First real job | One of the R8 offers · Graduate or professional school (if eligible; adds debt, raises later salary) · Moves home to save and keeps looking | Sets `job`, starting salary, location; `wellbeing`, `finances` | Who can afford unpaid gaps, low-paid "dream jobs," or moving to an expensive city | `bls_ooh`, `nyfed_recent_grads`, `pew` |

**R9 — Years 23, 24, 25:** one short card per year showing salary, raise or change, loan
balance, and any career event (promotion, layoff, side income), each displayed when it
happens. See "Income model" in `state-model.md`.
**N6:** Median income and debt of 25-year-olds nationally (`census_acs`, `cb_trends`).

## Ending — Age 25
1. Profile (see `profile-spec.md`)
2. "Same choices, different start" comparison
3. What could change this: policy connections and take-action links
4. Sources: used in this story, then the full bibliography with links

# Sample Scenes

These are the reference for prose quality, length, and tone. Every new scene should read
like it belongs next to these. They're shown with example names (Mateo, Ava); in content
files, use template tokens (`{name}`, `{subj}`, `{poss}`, …).

Bracketed values like **[$X]** come from `content/data/` at runtime. They are placeholders,
not data.

> **TODO(author):** Rewrite at least one of these in your own voice; Claude Code will
> imitate whatever is here more closely than any style description.

---

## Sample 1 — Opening (D1, family decision, age 0)

**Title:** Before Mateo Remembers

> Mateo arrives on a Tuesday in March, a little early and very loud. He won't remember
> this room, or the nurse who calls him "the opinionated one," or the way his father
> holds him like he might break.
>
> What Mateo grows up inside of started long before today. It's in the books on the shelf
> at home, or the lack of them. It's in whether his parents know what a FAFSA is, which
> teacher to ask for, or what to say when the school calls. It's in what they learned and
> what they had to figure out alone.
>
> Mateo doesn't get to choose any of this. For now, you do.

**Choices** (each shows household income from `family-income.json`):
- **Neither parent finished high school.** *They work hourly jobs with shifting schedules. Household income: about [$X].*
- **His parents finished high school.** *Steady jobs in retail and a trade. Household income: about [$X].*
- **His mom has an associate degree; his dad did some college.** *She's a medical assistant; he manages a warehouse. Household income: about [$X].*
- **Both parents have bachelor's degrees.** *Salaried jobs, a mortgage, and an assumption that Mateo will go to college. Household income: about [$X].*
- **Both parents have master's degrees.** *A school counselor and an engineering manager. More money and more pressure. Household income: about [$X].*

Button below the list: **Let chance decide.**

**Note:** this is the one place the narrator speaks to the reader directly, to set up the
reader's role. Every other scene stays in third person.

---

## Sample 2 — Friday Night (D10, Ava's decision, age 16)

**Title:** Friday Night

> Jordan's parents are out of town, and by third period everyone knows it. By lunch the
> group chat has a playlist. By the last bell somebody's older brother has agreed to "help
> with supplies," which everyone understands to mean exactly what it sounds like.
>
> Ava has a chemistry test Monday. She also has a feeling, the kind that only comes at
> sixteen, that this is one of those nights people will talk about for years, and that
> she'll either be in the stories or hear them secondhand.
>
> Her mom thinks she's going to a movie. She hasn't asked which one.

**Variant (if `varsity`):** *Coach has a 7 a.m. practice tomorrow, and he notices who's tired.*
**Variant (if `had_job`):** *She's on the schedule at the grocery store at 9.*

**Choices:**
- She goes and stays until the end
- She shows up for an hour, then heads home
- She stays home tonight
- She invites a few friends over instead

**Outcome lines:**
- *Stays late:* "Ava gets home at 2:40. It's the best night of the year, and the chemistry test goes about as well as anyone would expect."
- *Leaves early:* "She's there long enough to be in the photos and home in time to sleep. Nobody remembers that she left."
- *Stays home:* "She aces the test. On Monday, everyone has an inside joke she doesn't get."
- *Hosts:* "Five friends, two pizzas, a movie nobody watches. It's quieter, and she'll remember it longer than she expects."

---

## Sample 3 — Random event card (E1, age 9): a parent becomes sick

**Title:** A Diagnosis

> Mateo's dad has been tired for months. He blames the double shifts. In October, a
> doctor at the urgent care clinic tells him to see a specialist, and by Thanksgiving
> there's a word nobody in the family can pronounce taped to the refrigerator next to
> Mateo's spelling list.
>
> His dad keeps working as long as he can. Then he can't.

**How this affects Mateo** *(low-income version; `scaleByResources` applies)*:
> His dad's job has no paid sick leave, so the family loses about **[$X]** of income this
> year. Mateo's aunt picks him up from school now, and homework happens at her kitchen
> table, when it happens.

**How this affects Mateo** *(high-income version)*:
> His dad's employer covers short-term disability, and the family has savings. Money gets
> tighter, but the bills get paid. Mostly, Mateo notices that his dad is home more, and
> that he's quieter.

**Source:** links to `kff_health_costs` and `oreopoulos_displacement`.

**Note:** the event is the same for every family. What changes is how much it costs the
child, and the card says so.

---

## Sample 4 — Admissions result (R4, age 18): elite private college, not admitted

**Title:** The Email

> It isn't an envelope, of course. It's an email, and the first word is "Unfortunately."
>
> Ava reads it twice in the school parking lot, then a third time at home with the door
> closed. Her mom knocks once and doesn't ask. At dinner her little brother asks if she's
> still going to be a doctor, and her dad says "Of course," in a voice she's never heard
> him use.

**What helped Ava's application:** strong grades · four years of debate · a teacher's
glowing recommendation

**What wasn't available to Ava:** legacy status · a private admissions counselor · a
recruited-athlete spot · a school counselor with time for her (she shared one with
hundreds of students)

**Ava's odds:** about **[X]%**. Applicants with similar grades from the top 1% of family
incomes were admitted at a higher rate. *(Source: `oi_college_admissions`)*

**What's still open:** the state flagship that said yes in December, the community college
nursing pathway, or a gap year. → *Choose Ava's path.*

**Note:** the result card shows odds and factors so readers can see how the system works,
and a rejection always leads to real options.

---

## Sample 5 — Research note (N5, end of Stage 5)

**Title:** Behind the Story: Who Finishes College

> Getting in is only half of it. Students from lower-income families are less likely to
> finish a degree once they start, often because of cost, work hours, and family
> emergencies rather than grades. **[Statistic from `benchmarks.json`, e.g., six-year
> completion rate by income or institution type.]**

**Source:** National Student Clearinghouse Research Center, *Completing College* [year] →
link.

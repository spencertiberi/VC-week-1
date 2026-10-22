# Research Sources

Every decision, event, research note, data value, and policy in the story cites one or more
of these sources by **id**. Claude Code turns this list into `content/data/sources.json`,
and the story ends with a linked list of the sources used plus the full bibliography.

> **TODO(author):** This list is a starting point. Open each link, confirm it says what
> the "Use it for" column claims, remove any source you don't trust, and add any your
> audience will expect. `node tools/check-links.mjs` checks that links respond, not that
> they support the claim.
>
> **Link check (Oct 22, 2026):** every link below returned a page, except that bls.gov,
> cdc.gov, dol.gov, hhs.gov, ssa.gov, dfas.mil, povertycenter.columbia.edu,
> simonandschuster.com, and journals.sagepub.com block automated requests (HTTP 403).
> Open those in a browser to confirm them. `tools/check-links.mjs` should treat 403 from
> these domains as "check manually," not as a failure.

## Rules for using sources
- **Any number shown to the reader** comes from `content/data/` and carries a `sourceId`
  and `year`. Never type a statistic into a scene or template.
- **Use the most recent edition** of recurring reports (yearbooks, annual surveys) and
  record the year used.
- **Stat effects follow the research in direction and rough size.** The stats are a
  storytelling device, not a precise model, and the profile says so.
- **Where research is mixed** (private school effects, screen time, Head Start fade-out),
  keep effects small, show the trade-off, and say in the research note that findings are
  mixed.
- **Prefer primary sources** (the study or the government dataset) over news coverage.

---

## Names
| id | Source | Link | Use it for |
|---|---|---|---|
| `ssa_names` | Social Security Administration, Popular Baby Names (latest year) | https://www.ssa.gov/oact/babynames/ | `names.json`: top 200 names by sex |

## Family background, place, and mobility
| id | Source | Link | Use it for |
|---|---|---|---|
| `oi_land_of_opportunity` | Chetty, Hendren, Kline & Saez (2014), "Where Is the Land of Opportunity?", *Quarterly Journal of Economics* | https://opportunityinsights.org/paper/land-of-opportunity/ | How much adult income depends on parents' income and place (D1, D2, N0) |
| `oi_atlas` | Opportunity Insights, The Opportunity Atlas | https://www.opportunityatlas.org/ | Neighborhood differences in adult outcomes (D2) |
| `oi_race` | Chetty, Hendren, Jones & Porter (2020), "Race and Economic Opportunity in the United States," *QJE* | https://opportunityinsights.org/paper/race/ | "What the model leaves out" note |
| `oi_mto` | Chetty, Hendren & Katz (2016), "The Effects of Exposure to Better Neighborhoods on Children," *American Economic Review* | https://opportunityinsights.org/paper/newmto/ | Effects of moving to lower-poverty neighborhoods (D2, policy) |
| `oi_cmto` | Bergman, Chetty, DeLuca, Hendren, Katz & Palmer, "Creating Moves to Opportunity" | https://opportunityinsights.org/paper/cmto/ | Housing mobility policy |
| `oi_social_capital` | Chetty et al. (2022), "Social Capital I & II," *Nature*; Social Capital Atlas | https://www.socialcapital.org/ | Cross-class friendship and mobility (D6, N3, `network` stat) |
| `bls_education_pays` | U.S. Bureau of Labor Statistics, Earnings and unemployment rates by educational attainment | https://www.bls.gov/emp/chart-unemployment-earnings-education.htm | Parents' income by education (D1, `family-income.json`) |
| `census_acs` | U.S. Census Bureau, American Community Survey | https://data.census.gov/ | Household income, family structure, benchmarks for 25-year-olds (N6) |
| `census_income_report` | U.S. Census Bureau (2026), *Income in the United States: 2025* (P60-289), Table 1 | https://www.census.gov/library/publications/2026/demo/p60-289.html | Household income by householder education, residence, and household type (D1, D2, `family-income.json`) |
| `census_h13` | U.S. Census Bureau, Historical Income Tables: Households, Table H-13 (household income by educational attainment of householder) | https://www.census.gov/data/tables/time-series/demo/income-poverty/historical-income-households.html | Detailed household income by householder degree (D1, `family-income.json`) |
| `lareau_unequal` | Annette Lareau, *Unequal Childhoods: Class, Race, and Family Life* (2nd ed., 2011), University of California Press | https://www.ucpress.edu/books/unequal-childhoods/paper | Parenting and class; scene texture |
| `putnam_our_kids` | Robert D. Putnam, *Our Kids: The American Dream in Crisis* (2015), Simon & Schuster | https://www.simonandschuster.com/books/Our-Kids/Robert-D-Putnam/9781476769905 | Opportunity gaps in family, school, and community; scene texture |
| `columbia_ctc` | Columbia University Center on Poverty and Social Policy, research on the Child Tax Credit | https://www.povertycenter.columbia.edu/ | Child tax credit policy |

## Early childhood
| id | Source | Link | Use it for |
|---|---|---|---|
| `dol_childcare_prices` | U.S. Department of Labor Women's Bureau, National Database of Childcare Prices | https://www.dol.gov/agencies/wb/topics/featured-childcare | Childcare prices by county and type (D3) |
| `hhs_childcare_affordability` | U.S. HHS Administration for Children and Families, Child Care and Development Fund rules on family copayments (7%-of-income benchmark) | https://acf.gov/occ | The affordability benchmark (D3 "stretch" options) |
| `hhs_poverty_guidelines` | U.S. HHS, Poverty Guidelines | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | Head Start eligibility (D3) |
| `hhs_head_start_impact` | U.S. HHS, Head Start Impact Study and Follow-up | https://acf.gov/opre/project/head-start-impact-study-and-follow-2000-2015 | Head Start effects, including fade-out of test-score gains (D3) |
| `nieer_yearbook` | National Institute for Early Education Research, *State of Preschool Yearbook* | https://nieer.org/state-preschool-yearbook | Public pre-K access by state (D3, policy) |
| `perry_preschool` | HighScope Perry Preschool Study | https://highscope.org/perry-preschool-study/ | Long-run effects of high-quality preschool (N1, policy) |
| `abecedarian` | Carolina Abecedarian Project, FPG Child Development Institute | https://abc.fpg.unc.edu/ | Long-run effects of intensive early education |
| `boston_prek` | Gray-Lobe, Pathak & Walters, "The Long-Term Effects of Universal Preschool in Boston," NBER Working Paper | https://www.nber.org/papers/w28756 | Universal pre-K effects on college-going (N1, policy) |

## K–12 schooling
| id | Source | Link | Use it for |
|---|---|---|---|
| `nces_coe` | National Center for Education Statistics, *Condition of Education* | https://nces.ed.gov/programs/coe/ | Enrollment by school type, graduation rates, course access |
| `nces_private_school` | NCES, Private School Universe Survey | https://nces.ed.gov/surveys/pss/ | Private school enrollment and tuition (D4, D7) |
| `lubienski_public_advantage` | Lubienski & Lubienski, *The Public School Advantage* (2013), University of Chicago Press (ISBN 9780226088914); excerpt in *Stanford Social Innovation Review* | https://ssir.org/articles/entry/the_public_school_advantage_why_public_schools_outperform_private_schools | Private-school effects shrink after accounting for background (keeps D4/D7 effects modest) |
| `jackson_school_spending` | Jackson, Johnson & Persico (2016), "The Effects of School Spending on Educational and Economic Outcomes," *QJE* (NBER Working Paper) | https://www.nber.org/papers/w20847 | School funding and adult outcomes (D2, D4, N2, policy) |
| `college_board_ap` | College Board, AP Program Results | https://reports.collegeboard.org/ap-program-results | AP participation (D8, N4) |
| `asca_ratios` | American School Counselor Association, student-to-school-counselor ratios | https://www.schoolcounselor.org/About-School-Counseling/School-Counselor-Roles-Ratios | Counselor access (N4, R4, policy) |
| `nces_ecls` | NCES, Early Childhood Longitudinal Study (ECLS-K) | https://nces.ed.gov/ecls/ | Kindergarten readiness and reading at home |

## Activities and social life
| id | Source | Link | Use it for |
|---|---|---|---|
| `snellman_engagement_gap` | Snellman, Silva, Frederick & Putnam (2015), "The Engagement Gap," *Annals of the American Academy of Political and Social Science* | https://journals.sagepub.com/doi/10.1177/0002716214548398 | Class gaps in extracurriculars (D5, D9) |
| `aspen_state_of_play` | Aspen Institute Project Play, *State of Play* | https://projectplay.org/research | Youth sports costs and participation by income (D5) |
| `cdc_yrbs` | CDC, Youth Risk Behavior Survey | https://www.cdc.gov/yrbs/ | Teen drinking and risk rates (D10) |
| `add_health` | Add Health, National Longitudinal Study of Adolescent to Adult Health | https://addhealth.cpc.unc.edu/ | Adolescent social life and adult outcomes (D6, D10) |
| `surgeon_general_social_media` | U.S. Surgeon General, *Social Media and Youth Mental Health* advisory (2023) | https://www.hhs.gov/surgeongeneral/reports-and-publications/youth-mental-health/social-media/index.html | First phone and social media (D6) |

## After high school, careers, and income
| id | Source | Link | Use it for |
|---|---|---|---|
| `oi_college_admissions` | Chetty, Deming & Friedman (2023), "Diversifying Society's Leaders? The Determinants and Causal Effects of Admission to Highly Selective Private Colleges" | https://opportunityinsights.org/paper/collegeadmissions/ | Elite admissions odds by family income, legacy, athletics; effects on top jobs (D11, R4, R7, policy) |
| `oi_mobility_report_cards` | Chetty, Friedman, Saez, Turner & Yagan (2020), "Income Segregation and Intergenerational Mobility Across Colleges in the United States," *QJE* | https://opportunityinsights.org/paper/mobilityreportcards/ | Who attends which colleges and their later earnings (D11, policy) |
| `college_scorecard` | U.S. Department of Education, College Scorecard | https://collegescorecard.ed.gov/ | Net price by income, earnings by college and field (R5, D12, `net-price.json`, `salaries.json`) |
| `cb_trends` | College Board, *Trends in College Pricing and Student Aid* | https://research.collegeboard.org/trends | Prices, aid, and debt (R5, N5, N6) |
| `fsa_pell` | Federal Student Aid, Pell Grants | https://studentaid.gov/understand-aid/types/grants/pell | Grant eligibility and amounts (R5, policy) |
| `nsc_completion` | National Student Clearinghouse Research Center, *Completing College* | https://nscresearchcenter.org/completing-college/ | Completion rates by sector (R6, N5) |
| `dol_apprenticeship` | U.S. Department of Labor, Apprenticeship data and statistics | https://www.apprenticeship.gov/data-and-statistics | Apprenticeship wages and completion (D11, income model, policy) |
| `dfas_pay` | Defense Finance and Accounting Service, Military Pay Tables | https://www.dfas.mil/MilitaryMembers/payentitlements/Pay-Tables/ | Military pay (income model) |
| `nyfed_recent_grads` | Federal Reserve Bank of New York, The Labor Market for Recent College Graduates | https://www.newyorkfed.org/research/college-labor-market | Early-career wages and underemployment by major (D12, R7) |
| `bls_ooh` | U.S. Bureau of Labor Statistics, *Occupational Outlook Handbook* | https://www.bls.gov/ooh/ | Pay and education requirements by role (`salaries.json`) |
| `cew_college_payoff` | Georgetown University Center on Education and the Workforce, *The College Payoff* (2021) | https://cew.georgetown.edu/cew-reports/collegepayoff2021/ | Lifetime earnings by education (projection beyond 25) |
| `pew` | Pew Research Center | https://www.pewresearch.org/ | Young-adult living arrangements, debt, attitudes (D13) |

## Shocks and safety nets
| id | Source | Link | Use it for |
|---|---|---|---|
| `oreopoulos_displacement` | Oreopoulos, Page & Stevens (2008), "The Intergenerational Effects of Worker Displacement," *Journal of Labor Economics* (NBER Working Paper) | https://www.nber.org/papers/w11587 | Effects of a parent's job loss on children (events, resource buffer) |
| `kff_health_costs` | KFF, health costs research | https://www.kff.org/topic/health-costs/ | Medical costs and debt (parent illness event, policy) |

## Take action (nonpartisan)
| id | Resource | Link |
|---|---|---|
| `usa_officials` | USA.gov, Contact your elected officials | https://www.usa.gov/elected-officials |

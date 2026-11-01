# Addendum 1: gameplay depth, cameras, real-world rules

Source: Tim's addendum to the main build prompt. Where it conflicts with the main prompt, this addendum wins. Status: accepted into the plan; no code yet.

## 1. Core gameplay loop
- Time: days. Pause, 1x, 2x, 4x, and "skip to next event". Builder Mode can run month by month.
- Daily (Life layer): time blocks (work, family, meetings, events, campaigning, social media, rest). Each block changes needs, relationships, reputation.
- Weekly: council meeting (agenda, public comment, votes), advisor briefing, polling update, news cycle.
- Monthly: budget actuals vs plan, growth report, lake report, interest-group sentiment.
- Yearly: budget adoption, elections on the real cycle, state/county grant cycles, decade review screen.
- Pre-office: a resident cannot zone or build. Influence comes from public comment, commissions, volunteering, posts, relationships. Builder tools unlock only through offices Tim holds, with the real powers of those offices.

## 2. Game modes (same sim and save; differ only in what Tim controls)
- Life Mode: resident to mayor (default).
- Builder Mode: starts as mayor, political pressure turned down.
- Politics Mode: city auto-builds from staff proposals; Tim focuses on votes, campaigns, media.
- Spectator / Time-lapse: AI mayors run the city for decades.

## 3. Camera presets (switchable live; config in src/config/cameras.ts)
City Cam (default, ~45 degree overhead), Street Cam (walking level), Lake Cam (from water toward shore), Planner Cam (top-down with zoning and risk overlays), Free Cam. Smooth transitions. Cameras never change sim state.

## 4. Real-world rules research (mandatory before money or politics systems)
Primary sources only: City of Lake Elsinore site, budget, general plan, municipal and zoning code; California state law (city governance, open meetings, elections, land use, property tax); county and regional agencies.
- Findings in docs/research/<topic>.md with source URL and "as of" date per rule/number.
- Encoded in src/config/realworld/<topic>.ts with source comments. Unsourced = // TUNABLE — not sourced.
- Topics: mayor/council selection; council size and districts; terms and election timing; what council can and cannot decide alone; open-meeting and public-comment rules; budget scale and revenue sources (property tax share, sales tax, fees); state limits on taxes/fees and how new taxes pass; bond rules; land-use process (general plan, zoning, permits, environmental review); state housing requirements; who controls the lake and its water; documented lake water-quality and level issues; wildfire and flood risk zones; campaign finance limits; recall process.
- If the real process is slower or more limited than fun, keep the real rule as default and add a labeled "Fast Track" difficulty toggle. Never silently change the real rule.
- STOP for Tim's review of docs/research/ before coding politics, budget or land-use.

## 5. AI conversations: extra depth
- Commitments ledger: every promise Tim makes is extracted to structured data and shown on a Promises screen. Sim tracks kept/broken; NPCs and press raise broken ones.
- Advisors can disagree; briefings show conflicting recommendations, each tied to sim data.
- Voice input in Phase 9, same intent pipeline.
- Content growth: NPC memories, past posts, news build a searchable city history the AI draws on.

## 6. Phase changes
- Phase 2 adds time controls and daily/weekly/monthly/yearly loops.
- Phase 3 adds camera presets.
- New Phase 5.5 (research): Section 4, then STOP for review.
- Phase 6 adds the commitments ledger.
- Phase 8 adds the four game modes.

## 7. Success criterion
Tim plays Life Mode from resident to mayor using only the real powers of each office (per docs/research/); switches all five camera presets live without changing sim results; sees every promise on the Promises screen with kept/broken status; every real-world rule or number in config has a source and date, or a TUNABLE flag.

## Revised phase order
0 Scaffold (done, awaiting review) -> 1 Real map -> 2 City sim core + time controls + loops -> 3 Lake system + camera presets -> 4 AI conversation package -> 5 Life sim -> 5.5 Real-world research (STOP) -> 6 Politics + commitments ledger -> 7 Social & press -> 8 Elections + four game modes -> 9 Crises, polish, voice, Tauri.
Gate: no phase starts before Tim reviews the previous phase report.

# Phase 6 report: politics (sim layer) and commitments ledger

## Built
- src/sim/council.ts: council votes from member trust and proposal fit; whipping a member lifts or lowers their trust by outcome (agree, counter, refuse).
- src/sim/politics.ts (Phase 2 scenario): simple majority of seated members.
- src/sim/commitments.ts: the promises ledger. A promise stays open until the sim settles it. It becomes broken after its due day if unkept. Brokenness can be recalled by NPC.
- All council and seat numbers are SCENARIO placeholders (src/config/scenarios/politics.ts, D-019).

## Success criterion (Phase 6)
- The zoning change passes after whipping votes with good relationships (pass rate above 80%).
- The same proposal fails with worse relationships (pass rate below 35%).
- Whipping a member through a successful conversation raises the pass rate.
- These are tested with seeded RNG, and the thresholds are stated in the tests.

## Not done
- Public comment periods, interest-group sentiment meters, ballot measures.
- Advisors (five roles). The briefing needs the AI layer wired to the sim's numbers.
- The Promises screen in the UI.
- Council chamber UI.
- All thresholds and the fit table are placeholders until the research step.

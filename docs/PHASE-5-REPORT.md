# Phase 5 report: life sim (sim layer)

## Built (src/sim/life.ts)
- Needs: energy, social, stress, money. Changed only by blocks, and by deterministic overnight drift.
- Daily blocks: work, family, meeting, event, campaign, social media, rest. Four blocks a day maximum.
- Reputation: earned through meetings, events and campaigning.
- Relationships per named character: trust (-1..1), favour owed, rivalry. Changed only by `adjustRelationship`, which the AI layer calls after the sim resolves an outcome.
- Burnout is logged when stress is high and energy is low.

## Tests (9 pass)
- 30-day runs: needs change from the actions taken; rest versus work differs as expected; reputation rises only through earning blocks; relationships do not change on their own; trust stays in range; a fifth block is refused; burnout logs; a JSON save replays identically.

## Not done
- The 3D home and city hall views. The sim is ready; the scenes are not built.
- Life-view UI. No screen yet.
- Money in the life sim is a placeholder number, not linked to the budget scenario.
- The numbers are TUNABLE placeholders.

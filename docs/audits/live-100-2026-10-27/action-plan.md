# Live portfolio audit — paused

Paused at the owner’s request on October 27, 2026. **82 of 100 planned cases have recorded observations: 45 prompt/follow-up cases, 25 interaction cases, and 12 visual cases.** This is a preliminary action plan, not a completed quality certification. No further tests were run after the pause request.

All browser testing targeted https://seiler.page/. No product source changes were made in this audit pass. Raw observations are in [results.json](results.json); screenshots are beside this document. Individual observations still marked `Review` have not received final grading. Do not interpret the number of completed cases as the number of passing cases or model calls.

## Preliminary assessment

The interface has a coherent restrained style and several dependable controls. The larger weakness is answer selection: a valid, attractive layout can still fail to answer the visitor’s actual question. The experience does not yet meet the requested standard.

## Prioritized action plan

| Priority | Change | Evidence | Acceptance criteria |
| --- | --- | --- | --- |
| P1 | Select the exact evidence section before composing the view. Resolve named subjects, requested aspect, and section together. | Test 12 asks about creating the 100 Day Report but opens Building the press list; manual section selection works in 66. Tests 23–26 ask about Study Mode, Pulse, Atlas and group chats but receive the same general ChatGPT Lab overview. | Each named-topic prompt opens its relevant published passage, or explicitly acknowledges missing evidence. Correct project selection alone is insufficient. |
| P1 | Add grounded career synthesis and relevant role selection. | Tests 4–5 ask about strengths and public service but show the default Summation detail. | Strengths are supported by specific work; public service prioritizes the relevant public-service roles. Avoid presenting the entire career index as the answer to every career question. |
| P1 | Resolve conversational references against the displayed order and preserve the requested subject. | Test 45 asks for the second project after an AI policy/Taiwan comparison; the result opens AI policy. Test 44 asks Tell me more but repeats the Taiwan overview. | First/second references match visible order. More expands relevant detail rather than returning unchanged content. Keep successful metric and aspect follow-ups from 41–43. |
| P1 | Distinguish findings, lessons, outputs and accomplishments in routing and authored content. | Test 9 asks what Isaac learned in Taiwan but opens published use cases. Test 20 asks what the journalism research discovered but receives the project overview. Test 14 asks what the congressional office accomplished but receives a broad contribution summary. | Lead with the requested kind of answer and its evidence. Preserve accurate team attribution and the benchmark’s August 2025 date. |
| P2 | Bring useful controls and evidence forward on mobile without moving the anchored composer. | Screenshots 85–86 place the project tabs at the bottom of the first 390px-wide screen; 89–90 show repeated project labels and little substantive comparison above the fold at 320px. | Reduce vertical overhead inside results; make the first meaningful answer and next action easy to find. Preserve readable type, normal page scrolling and containment. |
| P2 | Make comparisons explain differences, not merely juxtapose summaries. | Tests 38–40 select the correct projects, but primarily repeat their authored contribution/outcome descriptions. | Add a concise, evidence-backed explanation of what differs and what connects the work, with interactive details underneath. No invented impact claims. |
| P2 | Simplify the result footer and separate visitor sources from diagnostics. | Test 62 exposes provider names and token counts inside Sources. Multiple visual checks show Share, project switching, Sources and Adjust view competing with content. | Keep citations accessible and collapsed. Move provider diagnostics out of ordinary visitor reading. Keep only controls that help a visitor make a meaningful choice. |

## Preserve what is working

Autocomplete draft preservation, arrow selection, Escape/Tab dismissal and typo matching worked in tests 51–56. Process selection and reading expansion/collapse worked in 66–68. Back/Forward worked in 60–61, and a shared view survived reload in 78. Benchmark metric, region, government and distribution controls worked in 71–74. These observations are specific to the tested interactions, not a claim that all states are correct.

## Evidence limits and resumption

- Initial verified production baseline: `ffd2971e32874da6fd6022b143d83aa0513ecf19`, deployment `dpl_jc6KQ1rnvSK51cPQLR8idNcmk311`. Concurrent repository changes were committed and pushed during this audit. The production version must be checked before resuming; these observations must not be represented as a single immutable-build certification.
- Visual evidence requires final review. Screenshots 82 and 84 captured an open-menu state rather than the intended idle frame; 87 captured an unsettled frame. Repeat those same case IDs on resumption, without counting them as new cases. Preserve the existing files as preliminary evidence.
- Early `elapsedMs` values include opening and closing Sources. They are observation durations, not response-latency measurements. Later `settledMs` values use a different measurement boundary and must not be combined with them.
- Source disclosures sometimes retained their open state across cases. Some raw text therefore includes source lists and native select options, which are not all simultaneously displayed as body copy.
- Final grading, provider-log correlation, transition/accessibility review and deployment revalidation remain unfinished. No final pass rate is claimed.
- Unrun case IDs: **46–50, 57, 75–76, 79–80, 93–100**. Resume only when the owner requests it.

Suggested implementation order: exact section selection → career relevance → reference resolution → findings/lessons coverage → mobile result hierarchy → comparison synthesis → footer cleanup. Then rerun the failed cases on the deployed build and finish the remaining cases.

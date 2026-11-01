# A more cohesive portfolio — October 31, 2026

The main bottleneck on the live site is answer relevance. It often identifies the right project but leaves the visitor with a generic overview, the wrong passage or repeated content. The visual system is restrained and worth preserving.

## Live evidence

Tested https://seiler.page in a real Chromium browser. The public content version was `canvas-2026-10-22-v7`. Captured 20 natural-language questions/follow-ups, desktop screenshots and narrow/light/dark states. Actual responses included 17 Jev-routed results (`jev-1.14.0`), three local uncertain-routing results and four completed Mistral composition streams (`mistral-small-2603`). No uncaught page errors occurred in those question flows. Provider configuration was supplemented by actual response evidence, rather than treated as proof of health.

| Visitor need | Live observation | Candidate response |
| --- | --- | --- |
| Strengths, public service, connections across roles | Default Summation detail and the whole role index | Specific synthesis, relevant role choices and supporting projects |
| Creating the 100 Day Report | Opens Building the press list | Opens the report passage and preserves team attribution |
| Study Mode, Pulse, Atlas, Group Chats feedback | Repeats the general Lab overview | Opens the relevant product passage; specific feedback leads the preview |
| Lessons from Taiwan | Opens published use cases | Shows both published lessons immediately |
| Educators’ influence | Relevant section, but the adaptation example is hidden | Session design and participant-driven changes are visible without expanding |
| Journalism findings | Contribution overview | Documented research themes, with a clear distinction from unpublished detailed conclusions |
| Comparisons | Adjacent summaries with little interpretation | Authored explanation of differences and connections; redundant Role row removed |
| “The second one” and “Tell me more” | Wrong project, then unchanged overview | Display-order reference resolution and expanded relevant detail |
| Measurement and tradeoffs | Proposal text or partial reflections | A direct, grounded explanation; no invented assessment scores or causal impact |
| Leadership | One project overview | Program ownership, office setup and teaching-team coordination, with relevant role controls |

A second live pass tested Work navigation, keyboard project opening, photo opening/Escape, Explore controls, Back/Forward, draft preservation and normal-motion Clear at 1440 and 320px in light/dark. Twenty functional journey checks passed. Four accessibility checks failed: each live photo viewer lacked accessible modal semantics. These are distinct from functional keyboard success.

The settled desktop homepage loaded its first three gallery images and began photography at y=701 in a 1000px-high viewport (29.9% visible height), consistent with the quiet entry-frame requirement. Early screenshots taken immediately after DOM readiness were not used to judge image loading.

Raw evidence: [live questions](live/results.json), [live journeys](live-journeys/results.json), [settled live homepage](live/settled-home.png). This is a new controlled audit, not a claim to have completed or regraded the original 100-case production audit.

## Implemented refinement

The candidate keeps the original site shell, Satoshi, Lucide outlines, gallery behavior and shared corner/spacing tokens. It builds on the earlier seven-priority fixes rather than adding another visual system.

- Specific published paragraphs now lead the answer. Full reading remains expandable. Both Taiwan lessons and the actual participant-adaptation example are visible immediately.
- A bounded question angle identifies leadership, tradeoffs or measurement. Rendered claims remain authored; models cannot supply arbitrary prose. Provider reconciliation preserves the locally identified subject, section, focus and angle.
- Career questions expose relevant examples instead of an undifferentiated role list. Comparison interpretation is followed by responsibilities and outputs, without a repeated role-summary row.
- Photo viewing uses the installed accessible dialog primitive: named controls, readable icon contrast, modal keyboard containment, Escape, restored opener focus and reduced motion. The browser test found a missing focus-restoration path during implementation; the final journey rerun passed it.
- Concurrent mobile safe-area, viewport and touch-target changes were preserved and included in the integrated browser/build checks. They are separate work, not attributed to this pass.

## Candidate verification

Candidate content version: `canvas-2026-10-31-v9`. Local providers remained unconfigured; no keys were restored. Candidate API/browser results establish authored behavior and mocked provider boundaries, not live model behavior on this unreleased source.

- **153 tests passed** in 11 focused files, including stale-response protection, provider disagreement, exact evidence selection, portable views, browser tools, held-out phrasing and visible-answer checks.
- **110 browser checks passed** across 1440/390/320px and light/dark: natural-language answers, both Taiwan lessons, honest measurement answers, follow-ups, photo requests without model calls, navigation and containment.
- **20 complete candidate journey checks passed** in normal motion, including modal focus containment/restoration, Work, photo navigation, result history, draft preservation and Clear.
- **22 local API evaluation cases passed.**
- Typecheck, focused ESLint, production build, server-import verification and diff checks passed. The build still reports large JavaScript bundles; no speed improvement is claimed.
- Production-preview checks restored a shared Taiwan section with both lessons, kept citations, omitted development diagnostics/Adjust view, and opened/closed the accessible photo viewer.

Evidence: [unit results](unit-results.json), [browser results](browser-v9/browser-results.json), [candidate journeys](journeys/results.json), [API results](api-results.json). [Candidate manifest](candidate-manifest.json) records changed source hashes and the base commit. Initial comparison captures in `candidate/` document the refinement process and are not a separate immutable release certification.

## Plan to reach the next release

1. **Review the coherent candidate.** Preview at http://127.0.0.1:8080/ . Judge the direct answer, evidence and next interaction together; the gates above now pass locally.
2. **Publish only on the owner’s instruction.** Freeze the candidate source and deployment identity, then rerun these same live questions and journeys against that exact release. Prioritize wrong-section, ordinal, measurement and photo-accessibility regressions. Correlate provider request IDs and final compositions.
3. **Expand from observed visitor gaps.** Add unfamiliar wording and genuinely unsupported questions to the retained corpus. Add only grounded coverage backed by published material. Keep quality gates tied to visible usefulness and factual support, not the number of tests or attractive preset renders.

No push or deployment was performed. The live site still serves the older content version, so production acceptance remains open. “Perfect” is not claimed from local checks; the next concrete milestone is a released candidate that passes the same live acceptance cases.

# Raising the quality of Explore

## Verdict

The visual cleanup is worthwhile, but the overall experience is not yet consistently compelling. It is a grounded portfolio browser with some good specific answers, presented through an open-ended question interface. That interface promises more understanding than the current routing and answer coverage reliably deliver.

The next investment should improve what the visitor learns, how directly the question is answered, and what becomes possible next. Keep the quiet shell, restrained typography, straight selection line, normal page scrolling, and bounded authored content. Do not add back Sources panels, Back/Forward toolbars, résumé filters, decorative subtitles, or role/year labels on project briefs.

## What this audit checked

- Captured all **16 live presets**, all **32 curated prompt outputs**, and **14 additional questions**: 62 authored response captures in `authored-output-catalog.json`.
- This capture renders the authored components and records headings, paragraphs, controls, composition state, and contextual suggestions. It is not a screenshot of every state, and text under closed disclosures is included in the capture.
- Reproduced in the active browser: cross-project synthesis, Taiwan evaluation, Boehringer challenges, an ordinary hiring paraphrase, the Outcomes preset mismatch, and mobile strengths hierarchy.
- Ran the existing API routing evaluation: **22/22 passed**, with **0 live Jev routes and 0 Mistral compositions**. Results describe local authored fallback behavior.
- Reviewed the implementation, supplied Graphical audit guidance, current theme definitions, and preceding motion evidence. The previous pass's 277 tests/build are historical evidence, not a fresh production-quality verdict.
- No production deployment or exhaustive model-output evaluation was performed. No application fixes were made in this audit. The checkout contains concurrent work; findings apply to the inspected state.

## Findings, ordered by impact

### 1. High: related content is being mistaken for an answer

**Confirmed browser examples:**

| Visitor asks | Actual result | Missing value |
| --- | --- | --- |
| What connects all this work? | Strengths heading, government project responsibilities | A cross-project synthesis |
| What are Isaac’s strongest skills? | Government benchmark contribution and practice | Named capabilities supported by more than one example |
| What is Isaac best at? | Try one of these starting points | Recognition of an ordinary strengths paraphrase |
| What were the challenges in the Boehringer rebrand? | Standard contribution and rollout results | A documented challenge, or an honest statement that this is not documented |

Source: `src/components/canvas/PortfolioViews.tsx:99` selects paragraphs only by active role. `src/lib/portfolioIntent.ts:49` has narrow career wording. `src/lib/portfolioEvidence.ts:145` supports special angle answers only for Taiwan.

**Introduced regression:** my last cleanup removed the strengths/leadership synthesis along with the unwanted introductory copy. The replacement improved navigation but lost the response's central argument. Restoring a generic subtitle would not solve it: the synthesis must become the primary answer.

**Fix:** introduce explicit answer intents and reviewed answer records. Distinguish identity, current work, strengths, connections, leadership, contribution, method, outcomes, lessons, tradeoffs, and measurement. Select a direct answer first, then its useful interactive view. Keep facts and interpretation traceable internally. For unsupported angles, state the specific evidence gap briefly and show the nearest relevant material as a clearly optional next action.

### 2. High: layout, focus, and section can disagree

Selecting **Outcomes** in `/?layouts` visibly selects “04 Proposing the Lab” and displays “From the Idea to the Lab.” The normal Taiwan outcomes question selects the appropriate outcome section, so preset and natural-language paths are inconsistent.

Cause: `src/lib/genui.ts:207` constructs presets with the default section. `src/components/canvas/PortfolioViews.tsx:18` appends an out-of-focus section and makes it active. `withLayout` does not normalize story focus/section.

**Fix:** one semantic normalization function for presets, providers, shared links, and manual changes. Default sections must belong to the selected focus. Preserve an explicit section request only when its interpretation is deliberate and visible; do not treat a default zero as an explicit request. Test rendered content, not merely valid IDs.

Evidence: [Outcomes preset screenshot](outcomes-preset-mismatch.png).

### 3. High: the evaluation measures routing more than usefulness

`scripts/evaluate-portfolio.mjs:12` checks kind, project/state IDs, focus, and role ID. It does not check whether the visible answer addresses the question, whether the selected section matches its tab, or whether the next suggestion repeats the current answer. A synthesis question passes by returning any timeline block.

**Fix:** retain those safety checks and add answer-level expectations: required claims, forbidden claims, required distinctions, evidence gaps, selected content, useful next actions, and first visible answer. Curated prompts must not be the only test inputs. Build a separate paraphrase/holdout set and multi-turn journeys.

### 4. Medium-high: suggestions do not understand what was just answered

The captured government-methodology view offers **zero** empty-draft contextual suggestions: the only single-topic policy prompt is filtered out because its aspect matches the view's focus. After Taiwan lessons, the first suggested question is “What did Isaac learn in Taiwan?” again.

Source: `src/lib/experiencePrompts.ts:93`. Context contains project IDs, kind and focus, but no answered question, semantic answer ID, role, selected section, or visited answers. “Lessons” and the rendered “outcomes” focus are different vocabularies.

**Fix:** rank only answerable next steps using the current answer and session history. Exclude the current answer and recently completed equivalents. Prefer a new dimension within the subject, then one relevant connection. Return fewer excellent suggestions when coverage is thin. Keep all typing local and preserve keyboard/IME behavior.

### 5. Medium: several output families are visually distinct only in name

Both career layout IDs render the same `CareerExplorer` (`ExplorationCanvas.tsx:99`). A career timeline request therefore produces no chronology. Many project questions become the same heading, image, three tabs, article paragraphs, project switcher, and Share action. Arbitrary project comparisons have no synthesis unless they match one of four authored pairs (`portfolioEvidence.ts:113`).

**Fix:** give each view a clear visitor task. Do not increase the layout count as a quality goal. Consolidate aliases, or implement their promised behavior only for explicit requests. A comparison should explain a meaningful similarity/difference before asking the visitor to reconcile two biographies.

### 6. Medium: the mobile hierarchy delays the answer

At 390 × 844, the strengths paragraph begins around **y=627**, after the composer, general heading, role choices, and a second heading. It is contained, but containment alone is a low bar. The visitor must read navigation before learning the answer. The same work can also change voice from third person to “I” between adjacent passages.

Source: `PortfolioViews.tsx:108`, `home-explore.css:274` and `:305`. Screenshot: [Mobile strengths view](strengths-mobile.png).

**Fix:** put the direct answer ahead of secondary navigation on narrow screens. Prefer one useful heading, one concise answer, and the minimum controls needed to explore it. Use the existing Satoshi, spacing and neutral tokens. Standardize assistant-facing text in third person; preserve first-person prose only in an explicitly opened authored reading view.

### 7. Medium: polish evidence is narrower than the quality claim

The prior geometry samples establish a stable composer and monotonic sampled expansion/collapse. They do not establish smooth frame delivery across devices, virtual-keyboard behavior, readability during transitions, or robustness to rapid interruption. The final sampled collapse begins narrowing only after about 699ms and then uses a 560ms width transition; smoothness and responsiveness need to be judged together.

**Fix:** test opening, switching, expanding reading, clearing, immediately resubmitting, resizing, and slow-response interruption as one journey. Keep content state mounted, exiting content inert, and reduced motion immediate. Measure both time-to-useful-content and total settling time. Do not tune durations in isolation.

### 8. Lower: obsolete controls and parallel implementations remain in the source

Styles for removed Sources/history/labels and older role/project components remain. Layout descriptions still promise filters that were removed. These are maintenance and future routing hazards, not evidence that excluded classroom/photo tools are currently reachable.

**Fix:** after the answer contracts settle, reconcile the live catalog, public descriptions, provider schema, component dispatch, and tests. Remove demonstrably unused variants/styles without disturbing the permanent gallery or Photo Map.

## What is already good

- Known IDs, authored data, revision protection, and local controls provide a sound foundation.
- Specific Taiwan learning/participant questions and OpenAI product-feedback questions reach useful, concrete material.
- Taiwan measurement and journalism findings acknowledge limits rather than inventing research conclusions.
- Government benchmark views expose actual comparable data and retain the August 2025 date.
- The quiet shell, restrained selection treatment, and reduced interface clutter are worth retaining.

## Implementation sequence

### Phase 1 — Repair the promise of the question box

Deliver a semantic answer layer shared by the local fallback and provider reconciliation. A bounded record should contain an answer ID, intent, subject IDs, concise answer, internal supporting references, evidence limitations where relevant, and compatible view/section IDs. Providers may select supported answers and controls; they must not invent personal facts or UI markup.

Start with the reproduced failures: connections, strengths/hiring paraphrases, challenges/measurement outside Taiwan, and preset focus/section normalization. Reconcile the two career layout IDs. Update tests alongside these repairs.

**Acceptance:** every reproduced failure either answers directly or identifies its specific evidence limit. Presets and natural-language requests agree on the visible section. No chronology is implied by a non-chronological result. No regressions in manual edits, cancellation, shared views, or excluded topics.

### Phase 2 — Make each answer worth opening

Build a small set of useful output patterns, reusing the existing theme:

| Visitor goal | Preferred experience |
| --- | --- |
| Understand Isaac | Short orientation with two concrete paths into the work |
| Assess strengths or connections | One synthesis with two or three evidence-backed examples; select an example to explore it |
| Understand a contribution | Clear ownership and what was produced, with a specific next step |
| Understand a method | A few meaningful decisions or stages, with a concrete example for each |
| Assess outcomes | Separate outputs, observed outcomes, team outcomes, and unmeasured impact |
| Compare projects | One meaningful contrast, aligned evidence, and controls that change the comparison |
| Explore government data | Existing data view, plus concise interpretation when the question requests it |
| Read an artifact | Open the requested known artifact/story through an explicit reading action; no restored Sources footer |
| Contact Isaac | Existing minimal contact actions |

**Example target for “What connects all this work?”:** “Isaac’s work repeatedly turns complicated systems into something people can use: a benchmark for comparing government AI adoption, a program built around educators’ questions, and communications that made a new congressional office’s work understandable.” Present the three examples as selectable evidence, not an additional introductory subtitle.

**Acceptance:** a visitor can identify the answer before using a control. Related questions that require different answers produce meaningfully different primary content. Standard answers begin with roughly 45–90 useful words where appropriate; tables and data views need not obey a prose quota. No invented capability scores, causal claims, dates, or accomplishments.

### Phase 3 — Make suggestions lead somewhere new

Extend context with semantic answer ID, subject/role, selected section, and recent answered IDs. Build candidate suggestions from actual answer coverage. Review all 32 current prompts and add only questions with strong destinations.

**Acceptance:** every displayed suggestion has a verified answer; none repeats the current answer or a recent equivalent; the government-methodology dead end is resolved. Typing still makes zero provider calls, highlighting leaves the draft intact, and freeform submission/IME/keyboard behavior remains usable. Do not add another persistent suggestion panel or new explanatory labels.

### Phase 4 — Refine composition and motion around the answers

Move secondary choices below the primary answer on narrow layouts. Remove repetition across headings, tabs, row labels, and paragraphs. Keep imagery where it adds context; do not let a repeated image dominate every type of answer. Preserve the existing quiet homepage and gallery proportions.

Use one documented set of motion roles for opening, replacing details, resizing, and clearing. Keep the current opacity-based transitions and avoid scaling text. Proposed performance targets should be validated on representative devices: useful local feedback within 250ms, no visible reflow oscillation, and no unnecessary pause at the end of collapse. Shorten the full fold/narrow sequence where it feels slow without violating the required ordering.

**Acceptance:** at 320/390/768px and desktop, the primary answer precedes secondary navigation; no overflow, trapped controls, lost focus, or stale result overwrite. Check both themes, reduced motion, keyboard use, virtual keyboard, rapid interruption, and loading/error states. Preserve the user's appearance after testing.

### Phase 5 — Establish a release gate based on actual outputs

Create a reviewed evaluation set before enabling broader output coverage:

- All curated questions and live presets.
- At least two independently phrased variants for each supported answer intent; keep a subset out of implementation-driven tuning.
- Multi-turn paths: ask → choose suggestion → change controls → ask follow-up → edit draft → cancel/clear → reopen/share.
- Missing-evidence and ambiguous questions, including ownership versus team outcomes.
- Same cases against local authored fallback, mocked provider contracts, and real configured providers, with results reported separately.

Score directness, specificity, grounding, usefulness of interaction, and visual hierarchy on an editorial 0–2 rubric (absent/weak/strong). These are internal review ratings, never visitor-facing scores. A release candidate must have no zero on directness or grounding for any offered suggestion, no unsupported factual claims, no mismatched active section, and no critical interaction/accessibility failures. Improve weak cases before expanding the catalog.

Only after that gate should a separately authorized release be deployed and checked on the custom domain. A successful build or a matching route ID is not the completion criterion.

## Recommended first work package

Implement Phase 1 plus one complete strengths/connections experience from Phase 2. That would immediately fix the largest gap between what the input promises and what the result delivers. Validate its follow-ups and mobile composition before generalizing the pattern to the remaining outputs. Keep the current visual restraint throughout.

## Implemented first package — October 31

- Added reviewed direct answers for strengths, connections, leadership, public service, identity, current work, and explicit chronology; examples now support the answer rather than substituting for it.
- Normalized story preset focus/section selection and verified Taiwan Outcomes starts with published use cases.
- Added evidence-gap responses for undocumented retrospectives, failures, and causal measurement. This does not create missing evidence.
- Extended suggestions with selected section, semantic answer, current question, and recent question history. Added government contribution/outcome destinations and corrected “best at” matching Atlas.
- Put the main career answer before secondary navigation on narrow screens. At 390×844 its top is approximately 407px, versus approximately 627px in the initial audit; document width and scroll width both 390px.
- Converted reviewed project summaries to third person. Original case-study excerpts retain their authored voice; a complete separation of assistant summaries from reading excerpts remains future work.
- Added rendered answer regressions, paraphrases, evidence-gap checks, and contextual suggestion tests. Current suite: 290 passing tests across 32 files. Build, lint, and typecheck pass.
- Browser checked strengths, interactive Taiwan drill-down and Outcomes, a Michigan/California comparison, clear, album opening, desktop/narrow rendering, and light/dark appearance. Restored dark mode and desktop viewport. Evidence: `strengths-improved-desktop.png`, `strengths-improved-mobile.png`.

These checks establish local authored behavior. The preview reports AI unavailable; real Jev/Mistral response quality, production behavior, full mobile-device motion/virtual-keyboard qualification, every comparison pair, and the comprehensive editorial release gate above are not established by this package. No release was requested here.

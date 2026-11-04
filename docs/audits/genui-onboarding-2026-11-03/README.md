# Generative UI: first-visit exploration and composer refinement

This pass addresses responsive screenshot proportions, question-field expansion and retraction, questions for unfamiliar visitors, and an in-pane “How to explore” answer. Claude reviewed the direction, actual responsive screenshots, and implementation; the final verification is recorded below.

The latest complete unit run passed 1,091 tests. The most recent full UI/motion run passed 67 browser cases, followed by 10 focused newcomer-flow cases six focused guide cases, and nine draft/guide cases after the reading refinements. Typecheck, lint and production build passed. Later sections record the continued findings and fixes.

## Changes

- Screenshots and other artifacts retain their intrinsic proportions. Removing the fixed tablet height eliminates the artificial white bars around widescreen screenshots; square images retain their shape. Photographs keep their authored editorial crop. The original image remains available from the image link.
- A single native multiline textarea stays mounted during editing and reading. A hidden copy measures its wrapping; the field grows to six lines and then scrolls. Focus no longer swaps an input for a wrapped display. First-line alignment stays stable as action buttons appear. Native selection, composition input, freeform submission, and reduced motion remain available.
- “Who is Isaac?” introduces the portfolio before detailed roles. The Taiwan question explicitly introduces teachers. Broad ChatGPT suggestions introduce product testing before feature-specific feedback questions.
- “How to explore” opens an authored answer inside the existing results pane. It includes four starting questions, a quick explanation, optional technical details, and a feedback invitation. It works without a provider request. Clear/Undo and returning to a previous exploration remain available.
- Help content arrives in three short opacity stages. The main pane retains its measured reveal and vertical-fold-before-width-retraction behavior. Help remains available from the empty-field shortcuts and the existing “Explore further” disclosure.

## Verification

The initial checkpoint passed 1,073 unit tests across 71 files, TypeScript checks, lint, and the production build. The build retains the pre-existing large-bundle advisory.

- The responsive audit checked 156 combinations of theme, viewport and project state with no horizontal overflow, escaped controls or artifact-ratio errors. The later square-image/text and first-visit-edge refinements have dedicated browser assertions and refreshed screenshots.
- Forty frame-sampled opening, focus/blur, Clear, Undo and interruption cases passed. The composer’s top edge had zero measured drift during opening at 1440, 768, 390 and 320 CSS pixels.
- Thirty-six text-resilience cases passed: ordinary and larger text, text-spacing overrides, Unicode, long words/URLs and multiline entry. Typing did not call the intent provider.
- The initial 43 UI/browser cases passed in 31.9 seconds; details are recorded in `verification.json`. An accumulated sequential browser context run had a post-assertion teardown hang; independent cases now run over two bounded workers. The same 40 cases completed in 27.5 seconds with parallel scheduling, and the final suite includes three additional feature-prefix cases.
- Sustained interaction checks passed: 3,834 operations over 1,203 seconds on the composer/help candidate, plus 1,977 operations over 618 seconds after the spacing refinement. Across 1,455 settled samples, neither run found horizontal overflow, escaped controls, stranded faded content, or page errors. See `sustained-interactions.json`.

Browser checks intercept intent/composition calls. They establish local rendering, keyboard and lifecycle behavior, not live model accuracy, real-device keyboard behavior or mobile Safari behavior. Text-spacing checks use explicit CSS overrides; they are not a claim of physical-device testing.

## Visual proof

- [Before tablet screenshot](before-tablet-screenshot.png) · [after](after-tablet-screenshot.png)
- [Phone entry questions](entry-phone.png)
- [Desktop help](help-desktop.png) · [dark phone help](help-phone-dark.png)
- [Square product image and aligned explanation](square-artifact-desktop.png)
- [Motion recording](motion-demo.mp4): actual browser capture, with long idle frame gaps capped at half a second for a concise demo. It is not a frame-rate benchmark.

## Claude iterations

1. [Initial direction](claude-1.md): identified the input/mirror jump and fixed screenshot frames.
2. [Responsive visual review](claude-2.md): stronger example questions, readable help measure, consistent in-place action arrows, and quieter footer.
3. [Code review](claude-3.md): corrected hover/Enter behavior, empty-Enter Undo loss, keyboard shortcut reachability and composition recovery. Suggested field focus rings were not applied because the owner explicitly requires the existing faint shared inset focus cue. React 18 inert handling and programmatic heading focus were checked against the actual implementation.
4. [Final visual review](claude-4.md): left-aligned square media, removed the large gap between its selector and explanation, aligned initial suggestion text with the field, and increased spacing below stacked Lab screenshots.

The final matching changes also preserve completion for partial feature names and bounded typos. Specific product questions remain opt-in. Prefixes and bounded typos still work once a visitor starts naming a feature, including Back to School and compressed names such as “studymode.”

## Continued motion audit

The first pushed checkpoint is confirmed live at https://seiler.page/: the native textarea and four-question in-pane guide are deployed, the guide has technical and feedback sections, the square-image left offset is zero, the selector-to-explanation gap is 12px, and there is no viewport overflow. Provider calls were intercepted; this is a deployment/rendering check. See `live-deployment.json`.

A subsequent frame audit found that shared-image layout projection briefly stretched new screenshots when switching between square Pulse and widescreen Study Mode images. Six of 24 transitions showed more than 2% anisotropic scaling, peaking at about 26%. Both ends of the shared image handoff now use Motion’s aspect-preserving layout mode: equal-shape images can still grow into the reader, while changed shapes animate position without stretching their pixels. Native image nodes and their fallback handling remain mounted.

The expanded check covers 60 transitions across all eight Lab sections, at 1440/768/390px, with normal and reduced motion. None exceeded 2% anisotropic scaling on visible frames. See `image-transition-frames.json`. Thirteen motion browser cases passed, including four new deterministic square/widescreen regression cases. Typecheck, lint, and production build passed. These checks establish Chrome rendering, not mobile Safari or live model accuracy.

## Short-window keyboard refinement

At 844×390, the suggestion list is deliberately height-constrained. Previously Arrow Up could select “Browse work” below its clipped edge (selected row y321–353, visible list y157–313, scrollTop 0). Selection now scrolls only the list, keeping the active row visible (y281–313, scrollTop 40) and the page at scrollY 0. A ResizeObserver preserves visibility when the selected row reflows. The field itself does not move.

Two browser regressions passed with normal/reduced motion, all six keyboard options, and 24px suggestion text. The six autocomplete unit tests, typecheck, lint, and production build also passed.

## Image loading and interruption recovery

A delayed-image check exposed a second motion problem: the initial image box was 0×0, then grew to 656×369 for Study Mode or 480×480 for Pulse at a 768px viewport. Published Lab images now carry measured width/height metadata. The story reserves their actual capped footprint before loading; pixels can arrive with the existing fade without shifting the layout. Sizing follows the displayed source, and an unknown fallback removes the previous dimensions and sizing styles. Other photographs retain their editorial crop.

Eight deterministic delayed-image browser checks passed at 390×844, 768×1000, 1440×900 and 844×390 for square/widescreen sources. Loaded and unloaded boxes match within 1px. The full current genui/motion browser run passed all 57 cases in 31.4 seconds. The 48 focused image-fallback, evidence-transition and content-growth unit tests, typecheck, lint and production build passed. See `delayed-image-geometry.json` for the original bug, corrected geometry and actual source measurements.

Eight additional browser-suspension checks passed for opening, technical disclosure, Clear and Undo at 390/1440px, including changing motion preferences during Undo. After resuming there were no stranded closing panes, expanded empty shells, overflows or height gaps above 1px. These are Chrome lifecycle checks, not real mobile operating-system backgrounding claims. See `interruption-recovery.json`.

## Stable return navigation

Browser Back restored the guide and draft but lost native disclosure state. The bounded, memory-only history entry now captures open disclosures before the outgoing DOM is removed. Returning content restores them before the pane's first measurement, rather than measuring the closed height and then expanding. The same initial measurement behavior also helps newly remounted Undo content. Page scroll remains coordinated with the existing route manager.

The initial restored-frame audit measured up to 82px of height mismatch on phone and 59px on desktop. The corrected first-to-last returning frames have zero mismatch at both widths, with Technical details open and the existing text fully visible. Eight focused browser tests passed, including phone/desktop with normal/reduced motion, help/Clear/Undo, and guide keyboard access. Thirty-one navigation/lifecycle unit tests, typecheck, lint and build passed. See `return-reading-state.json`.

## Live provider follow-up

Two public deployed starter questions rendered the expected identity and Taiwan views without overflow. Chrome could not capture the consumed streaming bodies, so this does not establish generated-vs-authored success. The process-scoped endpoint health subsequently reported a provider timeout, and a direct retry of only the public Taiwan question returned `invalid_output` after 27.19 seconds. The local fallback remains usable; live generation reliability is still unresolved. See `live-starter-check.json`.

Diagnostics now recognize the SDK's canonical `finishReason=length` as an output-token limit instead of losing it under a generic JSON failure. The last-failure health record exposes only allowlisted error-type/category labels and clears them after a healthy uncached call; cached responses do not overwrite provider health. Generated text, raw responses and private fields remain excluded. The pending UI says “Refining your view…” when a usable view is already present. The 109 focused provider-policy, observability, API and primary-interface unit tests passed, along with typecheck, lint and build.

The deployed refinement label is verified with intercepted provider calls. One subsequent real public Taiwan request returned `invalid_output` in 27.03 seconds; its fresh process-scoped health reported generic `Error`, with no token-truncation diagnostic. This points toward selection validation rather than token exhaustion; provider limits were left unchanged. The next diagnostic preserves the exact validation rules and adds only a bounded rejection label to failed stream events (for example `paragraph_indices`, `answer_plan`, or `layout_kind`). No raw output is emitted. All 1,077 unit tests, typecheck, lint and build passed. See `live-selection-failure.json`.

A subsequent uncached public Taiwan starter request completed successfully in 18.12 seconds (17.76 seconds server-side), selecting program-design section 1 and paragraphs 0/1/3. It returned a validated source-backed answer with 1,832 output tokens. See `live-starter-success.json`. This is one successful live case; the earlier intermittent timeout/selection failures are not claimed fixed, and no model settings were changed.

The current integrated browser run passed all 61 cases. A preceding run passed its 48 UI assertions but stalled while retiring workers before the motion file. The files had different worker-scoped `launchOptions`; these now live once in Playwright configuration, avoiding that worker handoff. With the shared configuration, UI and motion files completed together and exited 0. Config type checking and lint passed. See `browser-tests-current.txt`.

## Newcomer testing explanation

Reviewing the actual motion recording found that “How did Isaac test new ChatGPT features?” opened on Sources. Retrieval chose the introductory section, but its absence from the product-specific process index changed the lens to evidence; the answer-plan pass then moved to a named product. Broad testing questions now introduce the Lab's published general process at section 0, including product diaries and feedback sessions. Specific feature questions, source requests and detailed published headings retain their existing routes. The server applies the same broad-introduction rule after valid provider selection.

All 1,080 unit tests passed, including three new broad-question variants and existing feature/source and content-growth contracts. Two phone/desktop browser cases verify the general explanation, choosing Pulse, and opening its actual sources. Typecheck, lint and build passed. No further live provider calls were used for this refinement.

## Focus during expansion

Focusing a lower control while the pane was opening caused the `overflow:hidden` reveal to scroll internally: up to 645px on phone and 525px on desktop. Its contents then slid back into place as the height grew. The reveal now uses `overflow:clip` (with the prior hidden fallback) and retains its flow-root layout. It clips the same height animation without becoming an internal scroll container. Native page scrolling follows focus; the evidence stays aligned inside the pane.

The frame check now measures zero internal scroll and zero content offset throughout. All 67 UI/motion browser cases passed in 51.0 seconds, including four new focus cases with normal/reduced motion. Lint and build passed. The prior complete unit run remains 1,080 passed; the production change in this step is CSS only. See `focus-during-expansion.json`.

## Answering the actual first question

The real renderer review found that the Taiwan starter question explained the proposal but omitted what teachers actually did. Its initial view now shows the six-session program, lesson preparation, feedback and language-learning work, and how participant questions shaped later sessions. A method question about helping teachers learn no longer becomes a reflection question about Isaac; explicit personal lessons and evaluation retain their original routes. The same distinction is used by focus, angle and answer-facet selection.

All 1,086 unit tests passed, including teaching/support wording, teacher-learning wording, preserved personal reflection/evaluation, and the actual visible first answer. Ten first-visit/ChatGPT browser cases passed at phone/desktop sizes. Typecheck, lint and production build passed. `starter-reading.json` records the before/after visible prose and the five reviewed starter questions. This step uses no live provider calls.

## Photo framing and finding Help

The visible 736px preview revealed a tight conference-photo crop that cut off the top of the head. Main story and career photographs now use a higher crop position while retaining the existing editorial frames. Screenshots/artifacts keep their intrinsic-ratio treatment. Five widths (390/736/844/900/1440) were checked without overflow; the 736px crop now preserves headroom. The original photo is unchanged. Compare `tablet-photo-before.png` and `tablet-photo-after.png`; geometry is recorded in `photo-framing.json`.

“How to explore” is now also available inside greeting, ambiguous and unmatched-question guidance, opening the same local guide. In-place guidance/follow-up actions use right arrows; external image/source links keep their external-link indicators. The visible browser was refreshed and this path was checked directly. All 1,088 unit tests, typecheck, lint and build passed; six focused guide browser cases passed, including keyboard access after both greeting/unmatched requests at 320/1440px with no additional provider posts for Help.

## Help beside preserved drafts

Stopping a first unknown request retained the draft but hid the guide. The quiet guide action is now available when there is no active view or request and suggestions are dismissed, including beside an unsubmitted or stopped draft. Escape closes local suggestion state even when no options match; it still bubbles normally when there was no visible list. It does not submit, erase text or move the field. Existing Undo retains priority.

All 1,091 unit tests passed, including cancellation, late-response rejection and both matching/unmatched drafts. Nine focused browser cases passed across 320/1440px, with normal/reduced cancellation behavior, preserved draft text, fixed field position, and no added provider posts for the guide. Typecheck, lint and production build passed. See `draft-help.json`.


## Owner-directed reading edges and role selector

The owner’s November 3 screenshots identified a padded, floating “AI & communications” label, an operating-system select popup, and a clipped heavy focus outline. The narrow role selector now uses `PortfolioChoice`: a native disclosure button with a labelled group of choice buttons, expanding in normal flow with theme motion timing. Text starts at the same reading edge as the composer and answer; the chevron/check marks end at the opposite edge. There is no filled select surface or platform popup. Desktop role navigation also removes its inherited horizontal button padding.

Arrow keys, Home/End, Enter, Tab and Escape work without replacing the draft or making provider requests. Escape and selection return focus to the trigger; leaving the control closes it. Closed choices are hidden from accessibility and keyboard navigation. Reduced motion removes the height/opacity animation. Keyboard focus is a visible inset underline rather than a clipped rounded outline.

Validation: 26 canvas unit tests passed; typecheck and production build passed; lint had zero errors and the existing HomeExplore cleanup-ref warning. Eight browser cases passed at 390/736px in light/dark and normal/reduced motion, verifying shared reading edges and keyboard selection. The eight existing newcomer browser cases also passed. The first alignment attempt sampled separate elements while the shell was animating; a single-frame DOM comparison resolved that measurement race. The visible 736px IAB preview was refreshed and inspected. [Current screenshot](role-selector-alignment.png).

## Fifth Claude review and guide copy

A fifth actual Claude review used public deployed screenshots only, with portfolio generation intercepted. See [review and disposition](claude-5-public-visuals.md). Its guide instruction clarification was adopted; its header-overlap concern was disproved by full-viewport geometry. Fourteen existing guide/return/focus browser cases and 15 focused interface unit cases passed for that copy change.

# UI feedback implementation and verification

Source: `/Users/isaac/Desktop/seiler-page-ui-feedback.md`.
Plan: `docs/plans/ui-feedback-2026-11-04.md`.
Local review: http://127.0.0.1:8086/.

## Implemented

| Source sections | Finding | Result and evidence |
| --- | --- | --- |
| 1.1, 1.3, 13, 16.5 | Long requests look inactive | Immediate authored previews remain intact. Empty pending views now have reserved text placeholders and offer useful starting points after three seconds. Progress wording distinguishes preparation from refinement. Unit coverage includes the delayed empty path. |
| 1.3 | Completion removes the status row and moves the answer | The progress slot remains mounted with a 44px minimum height while results/guidance are present. A browser regression measures the result's vertical position before and after completion. |
| 1.3, 16.5 | Spinner competes with visible content | The full loading spinner is shown only before a view exists; refinement retains progress text and Stop. |
| 13, 16.5 | Stop has no clear outcome; failures lack visible recovery | Stop announces and displays “Stopped updating.” Timeout/provider errors display a recovery message while keeping usable authored content. Unit coverage rejects a late result after Stop and exercises a timeout. |
| 16.5 | Follow-ups append to the previous query | A committed question is selected for replacement when the textbox keeps focus. A dedicated follow-up action clears/focuses the draft while preserving the answer. Reproduced before the fix and verified with real typing afterward. |
| 1.1, 1.2 | Hidden shortcuts, spellcheck, uneven suggestions | Keyboard shortcuts are visible; Explore and project filtering disable spellcheck; suggestions top-align text/arrows and transition hover fill. Native textbox, IME, Enter, Escape, and Alt+Down behavior is preserved. |
| 1.5 | Image links have inconsistent cues | Project, career, comparison, and connection image links share a visible Lucide external-image cue in both themes. Original-image links and accessible names remain intact. |
| 1.6 | Feedback and history details are visually inconsistent | Feedback keeps its themed native controls with a fixed textarea; secondary history text uses the existing 12px role. The footer gains an explicit follow-up action without adding another composer. |
| 2, 12, 16.4 | Small icon targets and inconsistent social artwork | Header menu/search targets are 44px. Contact icons share Lucide outlines; icon and theme controls have titles and hover feedback. Focus rings on changed non-text controls are rounded and clearer. |
| 7, 15.1 | Stat labels are narrow and low contrast | Labels can use the full card width and consume the current muted-foreground token. No values or labels were rewritten. |
| 7, 15.1 | Source-row hover appears disabled | Source rows use positive background feedback rather than dimming the text. |
| 8, 16.3 | Writing placeholder is faint and misaligned | The existing message uses the readable muted token and the same maximum measure as About. |
| 15.2 | Atlas play glyph overlaps its mobile title | At small widths, the play glyph sits beside the title in the caption row. Confirmed overlap at 320px before the fix; a browser regression checks separate bounds afterward. |
| 15.2 | OpenAI floated media leaves a narrow text column | Floated media is capped at 260px / 36%; existing small-screen block treatment remains. |
| 15.2 | X embed ignores dark mode | The embed receives the resolved theme. This is source/typechecked; the external embed's live rendering is not claimed. |
| 15.5 | Search shifts/squeezes the page | Search is a 560px desktop overlay with a backdrop; phone search remains full width. Search owns focus in both layouts, Escape restores its trigger, and opening it no longer changes route content width/offset. Browser checks cover 320px and 1280px. |
| 15.5 | Search query alignment and duplicate results | Queries are left-aligned, literal title matches are emphasized, and destinations are deduplicated across groups with Work preferred. Unit and browser regressions cover Taiwan. |
| 3, 4, 14.8, 16.1 | Cover pop-in and giant orphan tiles | Homepage covers fade in after load over a theme-aware surface. Odd album rows use the same row-height relationship as paired rows, retaining the documented mosaic and seams. |
| 4, 16.2 | Lightbox controls/counter and changing frame | Counter is visible, close has a contrasting surface, and photos fit a stable viewport box. Real-image browser navigation confirmed an unchanged 1168×688 frame at 1280×800 and counter progression. Existing decode-aware cross-fade and rapid-navigation protection remain. |
| 9, 16.3 | Selected map card cannot be dismissed | Added an explicit close control, Escape dismissal, and focus return to the marker. Marker stacking now belongs to the transformed parent, with hover/focus elevation. Live map verification is unavailable without this checkout's Mapbox token. |
| 10, 16.3 | Pale music covers lack boundaries | Covers have an inset edge and external-link cue; the page uses stable viewport height. The existing continuous-sheet design is preserved. |
| 11, 14.11 | Static 404 can clip and ignores reduced motion | The recovery link has button-sized geometry, hover/focus states, and the document scrolls on short screens. Animation respects reduced motion. The existing blue-screen design remains. |
| 14.1 | Fontshare CSS blocks initial font discovery | Original Satoshi WOFF2 files are served locally, with 400/500 preloaded. Existing 300/700 consumers remain supported on demand; no fictitious 600 face is declared. The complete official license/provenance is retained in `public/fonts/`. Google-hosted JetBrains Mono remains unchanged. |
| 14.8 | Full-sized project images are sent to small screens | Six existing local assets now have 480/960px JPEG variants plus the original 1600px source. Work, project heroes, project index, and resolved Explore images use appropriate `srcSet`/`sizes` and actual intrinsic dimensions where known. A phone-width browser check verifies the 480px source loads. |
| 15.2 | AI index table has no scroll affordance | Its scroll region is keyboard-focusable, named, and has a visible thin scrollbar. Its search has an explicit accessible name and readable placeholder. |

## Already present or intentionally preserved

- Current code already reopens suggestions on a focused click, retains one textarea, guards stale request revisions, supports cancellation/deadlines, preserves manual edits, and supplies local previews. Existing and added regressions exercise these contracts; no provider rewrite was necessary.
- Current portable `#view` sharing restores the composition; an unchanged address bar during exploration is not evidence that copied links fail. Existing shared-view/browser coverage was retained.
- React Router, persistent chrome, route loading/recovery, theme View Transitions, active navigation, a 768px mobile drawer, decoded-photo transitions, image preloading/reveal, and footer fitting already exist. The feedback's older bundle counts are not an inventory of this checkout.
- Kept the quiet homepage, normal page scrolling, inline autocomplete, flat input focus treatment, portaled difference-blend header, shared 7px corners, continuous photo sheets, document-lifetime shuffle, viewport-triggered ticker, and hover/focus desktop Work captions. These follow current project direction rather than the report's alternative redesign proposals.
- Did not add introductory marketing copy, signup forms, made-up captions/dates, photo requests to the AI, a new theme option, or content/SEO edits.

## Validation

- Production build and TypeScript checks pass.
- All 71 Vitest files pass: 1,096 tests.
- Final-build browser coverage: all 105 Explore cases and all six feedback cases passed, including local fonts, responsive image delivery, new follow-up behavior, stable completion geometry, search focus/width, and mobile video bounds. All 13 motion cases passed in a separate run: 124 passing cases in total.
- Runner limitation: the combined invocation stalled after the 111 Explore/feedback passes while switching worker configuration for the motion file. It was stopped, and the motion file completed independently (13/13). This is not a claim that the combined invocation exited cleanly. Earlier assertions were updated to reflect the added follow-up button and actual responsive fallback dimensions; the focus-preservation checks themselves remain.
- Manual browser checks: desktop light and 320px dark across all six project pages plus About, Writing, and Music, with no horizontal document overflow. Also checked suggestions, typed follow-ups, sidebar/theme controls, album navigation, numeric lightbox counter/frame, search overlay/duplicates, and map recovery.
- Light appearance and the temporary viewport override were restored after inspection. The local preview is retained for review.
- ESLint has no errors and retains one pre-existing `resultsRef.current` effect-cleanup warning in `HomeExplore.tsx`. Build retains the existing large-chunk warning. Neither is reported as a new regression.
- Local authored UI, mocked streaming/provider tests, live provider responses, and production behavior are distinct. No production publish, live provider health claim, or restored local provider keys are included.

## Verification limits and optional follow-ups

- Real phone hardware, pinch/zoom/swipe feel, and the on-screen keyboard still need a device pass. Browser width and short-viewport coverage are not hardware certification.
- Live map collision/zoom styling and selected-card dismissal need a configured Mapbox environment. The local recovery page was verified; no token was added or exposed.
- Actual provider latency still needs a deployed/provider-enabled measurement. This pass improves feedback and recovery; it does not claim to make a remote model finish in three seconds.
- JPEG responsive sizes cover the six prepared project assets. Remote album originals and other remote media retain their existing source URLs; AVIF/WebP conversion and a wider image pipeline are additional work, not claimed complete here.
- General CSS token-count normalization, a new global palette/radius/type system, bespoke focal-point retouching across every album, new captions, alternate project taxonomy, page-title changes, and a different 404 design were not applied as blanket fixes. They require contextual review or change the established scope/direction.
- The report's “one sentence” answer-shape observation requires a separate routing/response-format reproduction; this UI pass preserves the current bounded authored views and does not claim a semantic routing fix.

## Review images

- `explore-desktop-light.png`
- `explore-mobile-light.png`

Images illustrate the local authored UI, not live provider output.

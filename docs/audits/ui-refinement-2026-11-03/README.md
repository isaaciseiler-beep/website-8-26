# Portfolio UI refinement — November 3, 2026

## Scope and baseline

Reviewed the idle homepage, autocomplete, long questions, the 2×2 guide, all 16 authored Explore presets, and natural-language entry into projects, comparisons, roles, connections, government benchmarks, contact, and the Work explorer. Also inspected greeting/unmatched recovery, empty searches, feedback, History/Back, pending/cancelled requests, late and failed images, keyboard focus, the Korea album and lightbox, Work, Writing, and Photo Map's local unavailable state.

The screenshot matrix covered 390px and 1280px in light and dark mode: 96 settled captures per pass. Separate interaction checks cover 320px, short landscape panes, tablets, reduced motion, and mid-animation reversals. Matrix inspection found no horizontal page overflow, controls outside their shared panel, or uncaught page errors. The matrix is authored UI coverage, not evidence that a live model chose every preset correctly. Screenshots and intermediate measurement files are under `/tmp/portfolio-ui-pass/` for this session.

## Refinements

- Aligned the expanded composer's text with the content and role controls. Padding joins the existing continuous expansion/retraction curve; exiting content retains its measured width.
- Kept newly focused result controls visible as the pane and disclosures grow. Wheel, touch, and native scrolling keys release this assistance so late image changes do not pull readers back.
- Put the desktop result utilities on one quiet edge. Narrow panes retain two readable rows; benchmark-specific margins no longer offset Share from Feedback. History opens on the full reading edge, with each question and view title on separate lines.
- Increased small recovery, Clear, Stop, history, and feedback actions to usable targets. Preserved existing visible focus, multiline editing, IME, native controls, and inert exit states.
- Made empty Work searches span the full results grid and kept Clear search returning focus to its input.
- Made feedback fields readable and visibly bounded with the same faint inset frame used by other controls. The site's deliberate global border suppression remains intact; no exterior glow or focus ring was added.
- Gave mobile benchmark selectors enough width to wrap rather than crowding the return action. Increased the measure control's text size while retaining native select behavior.
- Aligned Search's pending and empty states with its result list, using ordinary text and a useful next step instead of a large centered message.
- Added an accessible initial photo-loading message. Failed photos retain recovery navigation and focus returns to the album tile on Close.
- Shortened the guide's technical description while preserving its 2×2 starters, privacy disclosure, and visible feedback action.
- Removed the full-page focus outline from programmatically focused route landmarks. Interactive controls retain their own keyboard focus treatments.

## Verification and limits

- 298 focused portfolio, API-contract, Explore, autocomplete, history, reading-restoration, and page-transition tests passed.
- 126 browser contracts passed in `genui.spec.ts`, `explore-fold.spec.ts`, and `ui-polish.spec.ts`: local interactions, mocked provider responses, image availability/fallbacks, empty states, keyboard recovery, and measured motion geometry.
- Production build and targeted ESLint. The existing route-restoration ref cleanup warning in HomeExplore remains; no lint errors were introduced.
- Photo Map's unavailable state and link back to photographs were inspected. The interactive Mapbox map was not configured locally.
- `/api/compose` reported `configured: false`; live Mistral composition was not tested. Provider-contract fixtures and local authored routing are separate from live AI and deployed behavior.
- Screenshots and tests used Chromium. Physical iOS/Safari was not tested. User browser tabs, appearance preferences, and the preview at port 8080 were preserved.
- Build-generated feed timestamps were reviewed and excluded. No push or deployment was requested for this pass.

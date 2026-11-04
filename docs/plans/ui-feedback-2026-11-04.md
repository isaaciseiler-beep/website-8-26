# UI feedback implementation plan

Date: November 4, 2026
Source: `/Users/isaac/Desktop/seiler-page-ui-feedback.md`
Scope: planning for visual design, interaction, responsiveness, and accessibility. No implementation or deployment is included in this planning pass.

Execution record: [implemented changes, verification, and remaining limits](../audits/ui-feedback-2026-11-04/README.md).

## How to use the feedback

Treat the document as observations and proposed remedies, not authorization to apply every suggestion. Deduplicate repeated findings across sections 1–16. Preserve existing project direction in `AGENTS.md` and use the design guides when implementation begins. Reproduce issues against the current checkout before changing them: the report inspected a deployed bundle that may differ from current source.

For each finding, track its source section, reproduction steps, route/state/theme/viewport, current status, affected file, chosen fix, and verification evidence. Statuses: unverified, reproduced, already addressed, intentional, deferred, fixed and verified. Code inspection alone does not establish that an interaction works in the browser.

Existing untracked audit documents, plans, and test results must be preserved.

## What current source already tells us

- `HomeExplore.tsx` contains local authored previews, cancellation and revision guards, request deadlines, streaming state, history, and portable sharing. Test their behavior before replacing them. The compose request has a 40-second timeout; its existence does not establish an acceptable waiting experience.
- Shared views are encoded in a `#view` URL and decoded on entry. An unchanged address bar is not proof that the copied link cannot restore a view. Test the actual copied URL in a fresh tab.
- `ExperienceAutocomplete.tsx` already reopens suggestions on click. Reproduce the reported failure under focus, dismissal, and result states.
- `ThemeProvider.tsx` already uses View Transitions when available and respects reduced motion. A missing theme fade needs reproduction and browser-support checks.
- `App.tsx` already uses React Router, route preloading, and page transitions. Diagnose specific hard navigations or blank loading states rather than planning a routing rewrite.
- No browser walkthrough, live provider request, performance measurement, or test run was performed for this plan. Reported bugs remain unverified unless explicitly stated otherwise.

## Design decisions to preserve

| Feedback proposal | Planned treatment |
| --- | --- |
| Add visible homepage name/tagline and persistent photograph labels | Keep the quiet homepage and hover/focus labels; improve spacing and legibility within that direction. Touch-specific visibility remains supported. |
| Add input glow/ring, floating autocomplete, or internal panel scrolling | Keep the flat resting composer, inline suggestions, anchored input, one expanding AI window, and normal page scrolling. Improve focus visibility and stability within those constraints. |
| Force every answer into lead/image/detail/actions | Standardize the surrounding shell, spacing, controls, and states; preserve distinct interactive views and compact answers where appropriate. |
| Replace header inversion with a blurred scrim | Preserve the documented portaled difference-blend header; first test whether the current implementation reproduces the reported legibility defect. A different header treatment is a separate design decision. |
| Replace album mosaics with justified rows; fix order across reloads | Preserve alternating landscape/square pairs, 3px seams, and shuffle once per document load. Improve focal points and investigate orphan-tile sizing within that layout. |
| Show the gallery ticker immediately | Preserve its viewport-occupancy trigger; polish entrance and contrast. |
| Add a visible Work heading and permanent desktop titles | Preserve the documented hidden heading and hover/focus titles, with titles visible on touch devices. Verify touch behavior. |
| Restore system theme selection or introduce a new radius hierarchy | Preserve the Light/Dark interface, current preference migration, and shared 7px site corners. Test initialization consistency without adding options. |
| Add photo queries to Explore | Keep photography outside AI routing; verify photo requests do not call providers and gallery/map navigation remains functional. |
| Normalize page titles, taxonomy, apostrophes, or add signup/footer copy | Defer content and SEO edits. Semantic accessibility fixes that preserve copy remain in scope. Do not invent captions, facts, dates, or assets. |

## Delivery sequence

### 0. Establish a reproducible baseline

- Build the deduplicated issue ledger, separating defects, design proposals, and stale bundle observations.
- Reuse an existing local server if present. Compare local behavior with the reviewed deployment only when implementation verification calls for it; record build/environment differences.
- Capture idle home, suggestions, first submission, refinement, completion, timeout, Stop, Clear, history, Share, and theme switching.
- Baseline desktop at 1280×800; 320, 375, 390, 430, 768, and 1024px widths; zoom at 175–300%; light/dark; keyboard and reduced motion.
- Prioritize the Explore experience. Queue other confirmed P0 defects, especially the Atlas play-button overlap, immediately after that first batch.

Exit: every P0 has reproduction evidence or a clear unreproduced status; the first implementation batch is bounded and testable.

### 1. Explore reliability and immediate feedback — first implementation batch

Sources: §§1.1–1.3, 1.8, 13, 16.5.

Files: `src/components/canvas/HomeExplore.tsx`, `ExperienceAutocomplete.tsx`, `home-explore.css`; request APIs only if a reproduced lifecycle defect requires it.

- Reproduce first-character loss, failed first Enter, focused-click reopening, double Enter, IME composition, multiline input, and keyboard selection.
- Separate draft text from the committed request in interaction behavior. Prevent accidental query concatenation while preserving intentional editing and history restoration.
- Make pending feedback immediate; show a useful authored preview or guidance within 2–3 seconds where local evidence supports it. Do not misrepresent a local preview as completed model output.
- Tie progress wording to actual lifecycle states. Stop initial-loading treatment when useful content arrives; distinguish ongoing refinement from completion.
- Remove the completion-row layout jump and prevent changing input width from unexpectedly rewrapping the draft or shifting its anchor. Preserve intentional compact-to-expanded shell behavior.
- Verify Stop freezes updates immediately, deadlines show usable fallback, and cancelled/older responses cannot overwrite newer requests or manual edits.
- Verify theme preference survives a long request, result changes, route changes, and reload.

Acceptance: no lost keystrokes or duplicate submissions; useful feedback appears without waiting for the provider; no stale result overwrite; no abrupt completion shift; Stop and timeout visibly settle; theme remains stable.

### 2. Explore layout and interaction consistency

Sources: §§1.2, 1.4–1.7, 1.9, 16.5.

Files: `HomeExplore.tsx`, `ExplorationCanvas.tsx`, `LayoutViews.tsx`, `ProjectAnswer.tsx`, related portfolio view components and styles.

- Align suggestion text/arrows, preserve composer anchoring, and prevent clipping during open/close/filter transitions.
- Establish shared content edges and spacing while retaining view-specific layouts. Keep tabs anchored above the changing content and use one tab treatment.
- Prevent overlapping filtered cards; align subtitle rows; make image actions discoverable and avoid raw-JPG navigation surprises.
- Stabilize action-bar grouping across result/history states. Style any reachable feedback controls with existing primitives.
- Make follow-up entry clear without automatically adding another composer. Document Escape behavior and preserve autocomplete's existing keyboard contract.
- Test Back/Forward query synchronization, nested-project return paths, Clear/Undo, invalid shared links, and a copied view opened in a fresh tab. Separate in-panel history from browser history requirements.
- Review all 16 authored presets plus natural-language entry to representative views. Rendering a preset does not prove correct routing.

Acceptance: view changes remain inside the AI window; no controls escape or overlap; actions remain predictable; copied links restore the intended view; focus and reading position remain usable.

### 3. Shared shell, readability, and accessible controls

Sources: §§2, 12, 14.1–14.7, 14.9–14.12, 15.3, 15.5, 16.4.

Files: `SiteHeader.tsx`, `Sidebar.tsx`, `SearchOverlay.tsx`, `ThemeProvider.tsx`, `Footer.tsx`, `src/index.css`, scoped AI theme/composition styles, shared motion utilities.

- Fix reproduced header/search legibility, sidebar squeezing, footer clipping, and active-nav defects while preserving the approved chrome.
- Apply a small shared set of type, surface, muted-text, focus, and interaction tokens to affected components. Avoid a blanket CSS rewrite or global palette change based solely on bundle counts.
- Make controls readable, give icon buttons 40–44px hit targets, and provide keyboard, hover, and touch-press feedback with the approved Lucide outline family.
- Make search avoid displacing content, left-align queries, improve selection feedback, and deduplicate equivalent destinations. Preserve keyboard controls and intentional sidebar handoff behavior.
- Ensure theme initialization agrees between the head script and provider. Verify transition fallback and stored preferences without restoring removed theme options.
- Audit current font requests and actual faces before changing loading/weights. Investigate self-hosting only with available licensed font assets; prevent fallback reflow.
- Fix breakpoint boundary defects and unsafe viewport heights where reproduced. Keep visible scroll affordances and contain overscroll only where needed.
- Consolidate tokens and remove dead selectors incrementally as touched, after confirming selectors are unused in reachable routes. Counts in a minified bundle do not establish a user-visible defect.

Acceptance: ordinary text meets 4.5:1 contrast, large text and relevant non-text controls meet 3:1; keyboard focus is discernible; no sidebar or wordmark overlap; search is usable at phone widths; reduced motion remains effective.

### 4. Project pages and secondary routes

Sources: §§5–11, 13, 15.1–15.2, 16.3.

Files: `ProjectDetailPage.tsx`, dedicated AI index/thesis pages, project styles, `WorkPage.tsx`, `AboutPage.tsx`, `WritingPage.tsx`, `MusicPage.tsx`, route loading/error components, and static 404 document if applicable.

- Fix confirmed Atlas play-button/title overlap promptly; then correct the OpenAI thumbnail squeeze, thesis light surfaces/takeaway alignment, clipped AI table, and Congress embed theme.
- Standardize shared project widths, subtitle scale, section spacing, stat cards, link rows, and light/dark contrast. Keep deliberate editorial variants and existing content.
- Make no-hero cases deliberate using existing assets or layout; do not invent a new hero requirement.
- Correct narrow subtitle/header collisions, Work focal points and touch captions, and unnecessary empty bands without overriding the approved Work structure.
- Align About/Writing content and improve the existing empty state's presentation. Keep Music navigation chrome present while covers load and add cover boundaries where needed.
- Reproduce slow/blank 404 rendering before changing its loading path. Keep the existing parody unless a separate redesign is selected; improve recovery control, focus, and short-screen fit.

Acceptance: all six project pages remain readable and coherent in both themes; important labels are legible; no clipped title, table, or floated text; secondary routes present a useful loading/error state.

### 5. Photography, image delivery, and map

Sources: §§3–4, 9–10, 14.8, 15.4, 16.1–16.3.

Files: `PhotoHomePage.tsx`, `photo-home.css`, photo/lightbox components, `photoAlbums.ts`, `PhotoMapPage.tsx`, image helpers and available image-generation scripts.

- Use reserved aspect ratios/dimensions, theme-aware placeholders, and image fade-in. Tune preloading/lazy-load margins against fast scrolling without eagerly downloading the entire library.
- Verify the reported missing responsive sources against current code. Add responsive variants and appropriate formats where existing asset tooling supports them; keep above-the-fold images prioritized.
- Improve known focal points, orphan tile sizing, gallery filter stability, and hover/focus feedback within the current mosaic direction and document-lifetime ordering.
- Keep lightbox controls and frame bounds stable, provide a readable counter using existing metadata, and add a modest photo transition. Preserve arrows, Escape, backdrop close, and focus return.
- Test album/lightbox browser history before changing it. Treat pinch/zoom, wheel mapping, and wraparound as optional refinements, avoiding accidental wheel-driven photo changes.
- Give the map a useful loading state, improve viewport fit and light-theme contrast, resolve marker/label collisions, and keep selected markers visible beside the album card. Verify close/Escape and attribution visibility.

Acceptance: no avoidable image-driven layout shift; no long blank placeholder walls under representative throttling; no shuffle during navigation; lightbox/map controls remain visible and reachable on touch screens.

### 6. Final verification and review package

- Run focused existing Vitest coverage for Explore, autocomplete, composition/cancellation, history/sharing, theme, and affected routes. Add regression tests only for reproduced behavioral defects.
- Follow the repository's required focused checks and production build. Run lint/typecheck and applicable Playwright journeys for the changed areas; review build-generated feed/sitemap changes separately.
- Capture before/after screenshots and short interaction recordings for loading-to-complete, Stop, tab changes, filter changes, sidebar/search, footer, and lightbox.
- Cover light/dark, keyboard-only, reduced motion, zoom, and phone-width touch emulation. Perform a real-device pass with the on-screen keyboard when a device is available; mark it outstanding if unavailable.
- Keep separate claims for local authored UI, mocked provider lifecycle tests, live provider behavior, and deployed behavior. Do not report a local preview as evidence of production latency.
- Close each ledger item with evidence, an intentional-design explanation, or a documented remaining limitation. Leave the local preview available; publishing or pushing is a separate owner-requested action.

## Recommended review boundaries

1. Explore request lifecycle and input reliability.
2. Explore result layout, actions, history, and sharing.
3. Shared shell, controls, and token fixes.
4. Project pages and secondary routes, with the Atlas P0 pulled forward after batch 1 if reproduced.
5. Gallery, lightbox, responsive images, and map.
6. Cross-route/device regression evidence and remaining-issue ledger.

Avoid a single large polish rewrite. Each batch should have a bounded diff, explicit acceptance criteria, and a working local preview before moving to the next.

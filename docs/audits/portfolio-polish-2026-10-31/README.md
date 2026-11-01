# Portfolio polish audit — October 31, 2026

## Assessment

The site has a convincing visual identity: sparse shell, Satoshi, generous space, photographic sheets, small outline icons, and an interactive answer surface that expands around a question. Preserve those decisions. The most consequential remaining work concerns continuity and control: a visitor should always understand what is interactive, where they are, how to get back, and what happens while something loads or fails.

This is a design and interaction audit, not a review of Isaac's writing, professional claims, project facts, or editorial content. It is read-only with respect to application source. The only new files are this report and audit evidence. Pre-existing changes were preserved.

The earlier six refinements improved normal screens. This pass deliberately includes the less polished states around those screens.

## Evidence and coverage

Current Desktop checkout, local development server at http://127.0.0.1:8080. Browser checks used the in-app browser through its supported controls.

- All 16 live presets: initial-state geometry at 320×740, 768×1024, and 1440×900 in Light: 48 checks. No document overflow, escaped panel controls, or horizontally clipped sampled paragraphs/headings/buttons were found.
- All 16 presets in Dark at desktop width, with the sidebar open: 16 checks. No document overflow or unnamed result buttons were found. Inspected heading/panel colors were white and #141414.
- All 16 presets in Dark at 320×740, with available top-level disclosures opened: 16 checks. No document overflow or oversized inspected result descendants were found. This is 80 sampled fixture-state checks in total, not 80 exhaustive usability tests.
- Direct interaction checks: Search empty/results/Escape; mobile menu Tab/Shift+Tab/Escape; album filtering/open/return; lightbox open/Escape and focus return; autocomplete ArrowDown/Enter; draft editing while a committed result remains; natural-language career and Taiwan-process requests; keyboard entry from Work; Music; missing-page and map fallback routes.
- Additional inspected sizes: 390×844, the existing 600×896 pane, 320×568, and 568×320 landscape.
- Source inspection: shared shell/navigation, route/scroll lifecycle, image loading/preloads, fonts, core CSS, result layouts, theme and reduced-motion ownership, and existing verification coverage.

Important limits: these are local authored UI checks. Natural-language requests used the local fallback when AI was unavailable. Presets do not prove model routing. No deployment, live provider qualification, mobile Safari/Android device test, screen-reader session, production network benchmark, or complete accessibility conformance audit was performed. Reduced motion was traced in current source; its OS preference was not changed during this audit. No build or generated public files were changed during this pass.

Machine-readable measurements: [Light layout matrix](evidence/layout-matrix.json), [desktop Dark checks](evidence/dark-matrix.json), [expanded Dark checks at 320px](evidence/expanded-dark-320.json).

## Priority definitions

- **P1:** breaks reliable navigation or recovery in an observed state.
- **P2:** material interaction, visual-coherence, accessibility, or delivery improvement.
- **P3:** restrained refinement or experiment; validate before adopting.

“Observed” means browser-confirmed. “Source” means confirmed implementation behavior, with the user-facing effect still needing targeted measurement. “Judgment” is an explicit design recommendation rather than a defect.

## 1. Navigation and overlay ownership

### F01 · P1 · Mobile overlays must own keyboard focus — Observed

At 390px, opening the menu left focus on the menu trigger. Tab moved to the separate header Search button. From there, three Shift+Tabs moved through menu and Home to **Open New Zealand album**, behind the full-screen menu. The background page scrolled to that hidden focused album. Escape did not close the menu. Search implements Escape but closing it left focus on `body` after its input/results disappeared.

**Change:** share a deliberate overlay lifecycle. On mobile, move focus into the visible panel, make obscured content inert, contain focus, close on Escape, and return focus to the actual opener. Keep desktop navigation non-modal where the page remains visible and useful. Include the portalled header/search controls in the focus design.

**Owner:** [Sidebar.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/Sidebar.tsx:194), [SearchOverlay.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/SearchOverlay.tsx:126), [close handler](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/SearchOverlay.tsx:220). Existing `MotionSurface` already makes exiting content inert; reuse that principle for covered content.

**Done when:** Tab and Shift+Tab cannot reach obscured content; Escape closes either mobile panel; closing returns focus to its opener without scrolling the underlying page. [Menu screenshot](evidence/mobile-menu.png).

### F02 · P2 · Destinations should behave like links — Source

Sidebar destinations and Search results are buttons calling `navigate` or `window.open`. They lack normal link affordances such as a destination preview, copying an address, and opening an internal page in another tab through native link behavior.

**Change:** use Router links/anchors for destinations; retain buttons for menu toggles, in-place filters, and local view changes. Preserve route warming, return-state data, and current visual styling.

**Owner:** [Sidebar.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/Sidebar.tsx:219), [SearchOverlay.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/SearchOverlay.tsx:42).

**Done when:** internal destinations expose real hrefs and support normal browser link actions; filter/toggle actions remain buttons.

### F03 · P2 · Give the current route a quiet visual home — Source / Judgment

The sidebar computes active state, but its active/inactive branches both assign `text-foreground`; the destination buttons have no `aria-current`. The open menu does not clearly identify the current destination.

**Change:** use a modest weight or small existing underline treatment and `aria-current="page"`. Avoid a new filled selection card or a color accent.

**Owner:** [Sidebar.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/Sidebar.tsx:221).

**Done when:** exactly one appropriate destination is identified on each main route, including project routes grouped under Work.

## 2. Search as a quiet utility

### F04 · P2 · Replace large Search posters with compact result rows — Observed / Judgment

Search turns a 200px desktop side panel into 152px-wide image cards with 18px heavy titles wrapping across several lines. At 390px, each result becomes a roughly 342×257px poster: two results consume most of the screen. The same subject can appear in separate Work and News groups, multiplying large images. Distinct destinations may be valid; the treatment is what makes this repetitive.

**Change:** retain the side panel but use restrained rows: a small thumbnail, title, and minimal destination/type cue. Distinguish external sources with the existing outline arrow. Keep literal Search visibly simpler than interactive Explore. Preserve all valid results and categories; do not collapse distinct destinations solely because titles match.

**Owner:** [SearchOverlay.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/SearchOverlay.tsx:65).

**Done when:** several results can be compared without scrolling through repeated large photographs; long titles remain readable in the desktop panel. [Desktop](evidence/search-desktop.png), [mobile](evidence/search-mobile.png).

### F05 · P3 · Make the empty Search state intentional — Observed / Judgment

Opening Search with an empty query creates an empty side panel on desktop and a largely empty screen on mobile. The component explicitly returns no content for an empty query.

**Change:** retain the focused input and add at most one understated instruction, or avoid revealing the result region until there is a query. Do not fill it with project recommendations or marketing copy.

**Owner:** [SearchOverlay.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/SearchOverlay.tsx:136).

**Done when:** the empty state looks intentional and typing produces results without a disruptive re-layout.

## 3. Recovery and failure states

### F06 · P1 · The 404 recovery link is clipped in landscape — Observed

At 568×320, the Home link starts at y=345.5 and ends at y=365, below the 320px viewport. The page has a fixed, overflow-hidden main and document height remains 320, so ordinary page scrolling cannot reveal it. At 320×568 the link is barely inside the bottom edge, with subsequent information clipped.

**Change:** make the missing-page view scrollable and keep its recovery action within the first screen at short heights. Preserve any deliberately playful visual idea only if navigation and readable layout still work. Prefer the shared shell and Satoshi if the goal is a coherent mature artifact.

**Owner:** [NotFound.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/NotFound.tsx:12).

**Done when:** Home is visible or normally scroll-reachable at 320×568 and 568×320, with keyboard focus visible. [Landscape evidence](evidence/404-landscape.png).

### F07 · P2 · Failure states should retain the site shell — Observed / Source

The local Photo Map fallback shows environment-variable setup instructions and returns before rendering the header/sidebar. It has no in-page route back to photographs. This is evidence about the local fallback, not proof that the deployed map is broken. The route render-error fallback similarly offers only Refresh.

**Change:** preserve navigation and offer a direct route back to photographs or Work. Keep technical diagnostics in development/logs. A failed dependency should leave a useful visitor-facing route, with a brief status and one recovery action.

**Owner:** [PhotoMapPage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/PhotoMapPage.tsx:448), [App.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/App.tsx:101).

**Done when:** map/configuration/render failures remain navigable in both themes and narrow layouts, without asking a visitor to configure the application.

### F08 · P3 · Long loading and broken thumbnails need deliberate treatment — Source

The route loader is a largely blank, subtly pulsing screen with an accessible Loading status. Gallery image errors are marked ready by the global image loader, without a dedicated gallery failure treatment. The lightbox already has a brief image failure message and can serve as the behavioral reference.

**Change:** preserve frames during loading; reveal a small loading cue only after a short grace period. For failed gallery images, retain the exact geometry and provide a restrained way to continue or retry. Avoid per-photo spinners and ornamental skeleton animation.

**Owner:** [RouteLoader.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/RouteLoader.tsx:1), [ImagePreloader.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/ImagePreloader.tsx:24), [PhotoPreview.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/PhotoPreview.tsx:40).

**Done when:** test a slow route and failed cover without layout collapse, indefinite ambiguity, or loss of navigation. Network failure was not injected in this audit.

## 4. Photography and touch controls

### F09 · P2 · Complete the lightbox target-size refinement — Observed

At 320px, the next button measures 48×48px, but Close photograph measures only **16×16px**. The glyph can stay small; its activation area should be generous. The earlier arrow refinement therefore leaves the most important exit action inconsistent.

**Change:** provide an invisible minimum 44×44 activation area around Close, respecting safe-area insets. Retain the quiet glyph and visible keyboard focus. Apply the same hit-area discipline to other icon-only close actions.

**Owner:** [PhotoPreview.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/PhotoPreview.tsx:91).

**Done when:** measured Close bounds meet the site's existing 44px mobile target convention without covering image navigation. [Lightbox screenshot](evidence/lightbox-320.png).

### F10 · P2 · Keep every filter legible and the selection visible — Observed

At 320px, the ticker spans x=14–306. North America spans x=257.8–363.7 and is clipped. Selecting it leaves the active label partly outside the visible strip. The page itself has no horizontal overflow, so a document-overflow test misses this issue.

**Change:** ensure selection scrolls fully into view; provide a very subtle indication that the strip can scroll when clipped. Retain one row and the existing neutral treatment. Do not shrink labels to fit or replace them with unexplained abbreviations.

**Owner:** [PhotoHomePage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/PhotoHomePage.tsx:118), [home-explore.css](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/canvas/home-explore.css:199).

**Done when:** each selected label is fully visible at 320px and keyboard selection reaches it. [Evidence](evidence/filter-320.png).

### F11 · P2 · Restore focus to the originating album — Observed / Source

The filter and scroll position survived album return in the checked path, but focus returned to the generic main container rather than the album opener. Navigation restoration records `main a[href]`; album openers are `div[role=button]`, so they do not participate in that focus restoration.

**Change:** preserve the album opener's stable identity and restore it, with `preventScroll`, after the gallery has returned. Keep the existing once-per-document album/photo ordering. The lightbox successfully returned focus to its photograph opener after its exit completed; preserve that behavior.

**Owner:** [navigationScroll.ts](/Users/isaacseiler/Desktop/personal/website-8-26/src/lib/navigationScroll.ts:16), [ScrollManager.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/ScrollManager.tsx:37), [PhotoHomePage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/PhotoHomePage.tsx:81).

**Done when:** returning to a filtered album sheet retains filter, order, scroll and the correct focused opener.

### F12 · P2 · Restore the intended album rhythm — Source / Judgment

The album stylesheet explicitly sets uniform 4:3 images, a 90%-width sheet on wider panes, and one column below 767px. This differs from the project's requested continuous alternating landscape/square pairs and adds a second inset beyond the shell gutter.

**Change:** use the established alternating pairs and 3px seams, with perimeter-only site corners and shell-aligned edges. Choose and document an intentional narrow-pane rule rather than inheriting the current uniform-layout exception.

**Owner:** [photo-home.css](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/photo-home.css:10).

**Done when:** overview, album, and Work read as related photographic sheets; no unexpected extra inset appears at the breakpoint; lightbox order still matches the sheet.

## 5. Explore and local state

### F13 · P2 · Make the existing exploration history available to visitors — Observed / Source / Judgment

The application maintains bounded past/future state and exposes travel to browser tools, but normal users have no general Back/Undo control after changing questions or local views. The available Back to projects action covers a specific collection-to-story path. Clear deletes history as well as the current result. Two successive submitted explorations left no visible history action in the checked interface.

**Change:** expose a quiet contextual Back only when useful history exists, near the existing result actions. Consider one recoverable undo after Clear, without a confirmation dialog. Preserve the specific Back to projects behavior.

**Owner:** [HomeExplore.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/canvas/HomeExplore.tsx:200), [Clear](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/canvas/HomeExplore.tsx:139).

**Done when:** a visitor can recover the preceding committed view, including its controls, without retyping or invoking browser tools; Clear remains quick and the idle frame remains clean.

### F14 · P3 · Give a new visitor one small starting cue — Observed / Judgment

The initial frame offers the input and Beta disclosure, with no portfolio example visible before typing. Autocomplete works once a visitor enters a relevant term. This makes the system's boundary less discoverable than its visual simplicity suggests.

**Change:** trial one short curated example beneath the input, using existing experience prompts and the established measured crossfade behavior if cycling is used. Keep the Beta explanation visually secondary. Do not introduce a grid of recommendations, an introductory paragraph, or unfamiliar project names.

**Owner:** [HomeExplore.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/canvas/HomeExplore.tsx:247), [experiencePrompts.ts](/Users/isaacseiler/Desktop/personal/website-8-26/src/lib/experiencePrompts.ts:1).

**Done when:** a first-time visitor can infer a useful question while the input remains the single focal point. Treat this as a design experiment, not a confirmed functional defect.

## 6. Typography, surfaces and alignment

### F15 · P2 · Flatten static metadata and overbuilt source links — Observed / Source / Judgment

Article year/type metadata still uses bordered pill surfaces and a literal 999px radius on spans, outside the shared 7px corner system. Article source links use bordered cards plus a second bordered 32px circular arrow container. These treatments add control-like shapes around read-only labels and a second container inside a simple link.

**Change:** render metadata as plain inline text and reuse the site's simpler text-and-outline-arrow link language. Keep necessary dates and source identification. Use spacing and type hierarchy to separate roles; preserve the shared neutral palette rather than reintroducing faded olive or extra accent colors.

**Owner:** [index.css metadata](/Users/isaacseiler/Desktop/personal/website-8-26/src/index.css:3824), [source links](/Users/isaacseiler/Desktop/personal/website-8-26/src/index.css:4068).

**Done when:** metadata cannot be mistaken for filters, and a source link has one clear interactive surface rather than nested decoration.

### F16 · P2 · Align peer photo surfaces to one shell gutter — Observed / Source / Judgment

The mobile Music title/grid starts at 16px while the shared header, homepage and Work use 24px. Wider albums add their own 90% width on top of the shell. These are small but visible alignment changes when navigating between related image-led pages.

**Change:** reuse the existing shell gutter and safe-area behavior for peer photo surfaces. Preserve a deliberately narrower reading measure for articles; editorial prose does not need to be as wide as photographs.

**Owner:** [index.css Music override](/Users/isaacseiler/Desktop/personal/website-8-26/src/index.css:2208), [shared shell](/Users/isaacseiler/Desktop/personal/website-8-26/src/index.css:5701), [photo-home.css](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/photo-home.css:12).

**Done when:** image-sheet edges align with the shell before and after a route change, in portrait, landscape and an open-sidebar desktop pane.

### F17 · P3 · Standardize typography by role, not by making everything identical — Judgment

The shell, result views, article pages and Search use different type scales. Some distinction is useful: reading prose should remain larger than compact controls. Search's tiny category labels and dense heavy card titles are the clearest inconsistency; article metadata creates a second one through its containers.

**Change:** explicitly assign a small set of roles: navigation, result title, body, control, metadata, photo caption. Reuse AI `--size-*`, `--line-*`, and weight tokens inside its scope. Keep Satoshi and existing shell styles outside it. Do not shrink body type to force a panel into one screen or add manual line breaks.

**Done when:** peer roles match within a view and across the views where they serve the same purpose. Check real wrapping, especially 320px, instead of treating matching token names as sufficient.

## 7. Accessibility details that also improve polish

### F18 · P2 · Finish keyboard behavior for declared composite controls — Source

Photo filters use tablist/tab roles without roving focus or arrow-key selection. Appearance uses radio roles on buttons without arrow-key behavior. Both are operable by Tab and activation, but their declared semantics imply a richer keyboard interaction than is implemented.

**Change:** implement the appropriate composite keyboard behavior, or use simpler native controls/semantics where that better matches the intended interaction. Keep native select menus and the existing autocomplete interaction.

**Owner:** [PhotoHomePage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/PhotoHomePage.tsx:118), [Sidebar.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/Sidebar.tsx:27).

**Done when:** the selected item has a predictable tab stop and arrow keys behave consistently; selection is exposed and visibly identifiable.

### F19 · P2 · Strengthen focus at returns and reading entry points — Source / Judgment

The shared Back arrow removes the outline and dims its SVG to .55 for focus. Route arrival focuses the entire main container; Work intentionally has no visible page heading and provides its subjects as h2s. These choices can be refined without outlining the AI panel or adding a visible page heading.

**Change:** give icon actions a clear, local keyboard focus treatment using existing ink/ring roles. Focus an appropriate destination heading on new reading routes where useful; restore the originating control on returns. Add visually hidden page headings where a meaningful page title is absent from heading navigation.

**Owner:** [back-arrow.css](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/back-arrow.css:2), [ScrollManager.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/ScrollManager.tsx:37), [WorkPage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/WorkPage.tsx:63).

**Done when:** focus identifies the action or subject, never depends on a faint opacity change alone, and never introduces a persistent outline around the AI surface. Preserve the intentional flat input styling.

## 8. Delivery and perceived performance

### F20 · P2 · Consolidate image preloading around viewport and intent — Source

PhotoHome schedules all album covers. The global ImagePreloader also schedules all deferred document images and promotes near-viewport images to eager loading. Album hover/focus separately warms several photographs. The shared requested-image map deduplicates repeated URLs, which is good, but there are multiple policies deciding what should load. The global loader checks Save-Data/2G for deferred images; the gallery's independent cover scheduler does not.

**Change:** have one gallery loading policy: visible covers first, the next row near the viewport, and a small intent-based album warm-up. Respect low-data connections throughout. Cancel queued speculative work when leaving a route. Preserve adjacent lightbox warming and decode-before-image replacement.

**Owner:** [PhotoHomePage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/PhotoHomePage.tsx:150), [ImagePreloader.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/components/ImagePreloader.tsx:66), [imagePreload.ts](/Users/isaacseiler/Desktop/personal/website-8-26/src/lib/imagePreload.ts:103).

**Done when:** a production network trace shows restrained first-screen loading, no bulk album warm-up on low-data mode, and no avoidable contention with the UI/font load. No bandwidth or speed gain is claimed before measurement.

### F21 · P2 · Deliver the right image derivative for each presentation — Observed / Source

Sampled covers used single source URLs without srcset. Natural widths included 1086 and 2172px for 462px-wide desktop tiles. Cover cropping and pixel density matter, so width ratios alone do not establish waste. Work and article images also use single sources; the image shown as a cover is not necessarily the right delivery size for a lightbox.

**Change:** use responsive derivatives sized for the actual cover crop and device density, and retain larger originals for the lightbox. Specify dimensions/aspect ratios before load. Audit visual sharpness at 1× and 2×, not only transferred bytes.

**Owner:** [PhotoHomePage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/PhotoHomePage.tsx:96), [WorkPage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/WorkPage.tsx:21), [ProjectDetailPage.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/pages/ProjectDetailPage.tsx:340).

**Done when:** thumbnails are appropriately cropped/sharp without requiring a full-size original, and the lightbox retains photographic quality. Measure production transfer/decode cost separately.

### F22 · P3 · Isolate legacy styling and route-only font costs — Source

The global stylesheet is 5,778 lines and contains substantial legacy/Skull treatments, while Google font families for alternate visual treatments are requested in the root HTML alongside Satoshi. Late broad color/corner overrides help enforce the new style but make ownership harder to reason about. This is maintenance and delivery debt, not evidence that every legacy rule is currently harming a visitor.

**Change:** inventory actual core-route font/style usage and load alternate-route assets with those routes. Consolidate shared decisions at their owning definitions; preserve intentional local adaptations. Avoid a wholesale CSS rewrite during the visual refinement pass.

**Owner:** [index.html](/Users/isaacseiler/Desktop/personal/website-8-26/index.html:31), [index.css](/Users/isaacseiler/Desktop/personal/website-8-26/src/index.css:5680), [App.tsx](/Users/isaacseiler/Desktop/personal/website-8-26/src/App.tsx:7).

**Done when:** production asset comparison demonstrates fewer unnecessary core-route font/style requests and unchanged screenshots/interactions. Do not infer speed from source line count.

## 9. Motion and state continuity

This dimension is substantially stronger than the edge-state navigation. Current source centralizes reduced motion, disables CSS animation/transitions under that preference, keeps exiting content inert, measures result height, preserves local view state while resizing, and holds a displayed photograph until its replacement loads/decodes. These are valuable and should survive refinement.

The next work is qualification rather than adding effects:

- Record a normal-motion submit → expand → manual change → edit → Clear → fold sequence at phone and desktop sizes. Confirm the composer does not move vertically, Clear finishes the fold before width release, and text is never scaled.
- Exercise repeated navigation while a route is loading and while a theme transition is in progress; verify one live route, one usable focus target and no leftover overlay.
- Repeat the same sequence with reduced motion. The existing motion suite covers related behavior, but that suite was not rerun during this read-only audit.
- Evaluate slow font/image/provider arrival separately from authored preset changes. The local fallback cannot establish that a generated view feels stable under real response latency.

No extra parallax, cursor effects, hover tilt, pulsing depth, or decorative entrance choreography is needed to make this artifact feel special. Consistent timing and reliable continuity will do more.

## 10. Recommended implementation order

### Pass 1 — Finish control and recovery

F01, F06, F07, F09, F10, F11 and F18–F19. This fixes the states where the interface stops behaving as carefully as it looks. Add focused regressions for mobile overlay focus/Escape, Search return focus, lightbox Close bounds, landscape 404 recovery, selected filter visibility and album-opener restoration.

### Pass 2 — Make the visible system more coherent

F02–F05, F12–F17. Compact Search, native destination links, current-location feedback, gallery geometry, metadata/link simplification, shared gutters, and contextual exploration history. Trial the one-line initial example separately so it does not silently change the homepage's restraint.

### Pass 3 — Qualify delivery and finish

F08 and F20–F22, plus the motion/latency checks above. Use a production build with controlled cache/network conditions. Measure image and font requests, layout shifts, input responsiveness and meaningful visual arrival. Then check real mobile browsers, touch behavior, keyboard-only navigation and a screen reader. Keep local, provider and deployed evidence separate.

## What should remain recognizable

- Original IIS/header and sidebar identity, with per-pixel inversion over photographs.
- One centered Explore field, restrained initial photography, flat resting surface and normal page scrolling.
- Satoshi, the neutral palette, small Lucide outline icons and the shared corner token.
- Editorial Work pairs and 3px photographic seams.
- One answer window, local controls, evidence on demand, and no unsolicited article/project-card wall.
- Clear distinctions between interactive exploration, literal Search, photographic browsing and reading, with shared navigation/focus/recovery behavior across them.

The defining finish should be precision: the same care in a failed request, a keyboard return, a narrow filter strip and an image transition as in the initial homepage.

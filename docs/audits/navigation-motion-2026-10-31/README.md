# Search and sidebar motion

Audited the local Desktop checkout at 1280, 768, 767, 390, and 320 pixels, including Light and Dark, populated search, Escape/focus restoration, and sidebar-to-search handoff.

## Findings and repairs

- Search had two magnifiers: closing revealed the fixed trigger immediately while the form's glyph was still moving. One persistent glyph now follows the expanding width in both directions. Its difference layer remains separate from the form and results.
- The shrinking form clipped its input and close control into the icon. Those controls now fade early and become inert immediately; results retain their text through the fold. Reopening during a close reverses the same mounted surfaces.
- Mobile page translation always used 340ms while panels used 340ms opening and 220ms closing. Both now use 460ms opening / 340ms closing, with the shared navigation curve `cubic-bezier(0.12, 1, 0.22, 1)`: quick initial movement, long deceleration, no overshoot. Header chevron rotation follows the same motion and honors reduced motion.
- Search previously used a numeric 200px exit on desktop and mounted/unmounted for every toggle. Its persistent panel now uses its actual width at every breakpoint.
- Search chrome dimensions now respond directly to CSS viewport changes, including resizing an already-open search across 767/768 pixels. Touch hit targets remain 44px.

## Verification

- 170 tests passed across the five required canvas/composition suites plus navigationTheme and portfolioPolish. Added a regression for closing/reopening populated search without replacing its glyph/input or exposing exiting controls to keyboard navigation.
- Production build, focused ESLint, and whitespace checks passed. Generated feed changes were timestamp-only and restored separately.
- Browser checks confirmed a 200px search panel at 768px and a full-width panel at 767px; no horizontal overflow at tested widths. Checked the comparison preset beneath the sidebar, both themes, and focus returning to Search after Escape.
- Existing Vite dependency optimization became stale during route verification (504 Outdated Optimize Dep). Refreshed the development server with forced dependency optimization; this was a development-cache issue, not a source change.
- After the refresh, confirmed the Taiwan project story loads and homepage album navigation opens the actual Taiwan photographs. Restored Light appearance and the default viewport; left the homepage preview running on port 8080.
- Reduced-motion paths retain zero-duration Motion and CSS transitions. No provider calls or deployment were needed for this audit.

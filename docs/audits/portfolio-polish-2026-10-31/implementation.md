# Portfolio polish implementation

Implemented locally on October 31, 2026, from the companion audit. Existing content, provider changes, and unrelated work were preserved. Nothing was published or pushed.

## Changes by finding

| Finding | Status | Result |
| --- | --- | --- |
| F01 | Implemented | Shared mobile overlay focus ownership, covered content inertness, Tab wrapping, Escape, and trigger focus restoration. Search input and results belong to one modal region. |
| F02–F03 | Implemented | Native sidebar and album destination links, route warming, and a restrained current-page marker with `aria-current`. |
| F04–F05 | Implemented | Compact Search rows, small mobile thumbnails, ordinary links, and a purposeful empty-state hint. |
| F06–F07 | Implemented | Shared quiet recovery shell for 404, unavailable map, and route errors. Home remains reachable in short landscape layouts. Map recovery links directly to the gallery. |
| F08 | Implemented; failure simulation pending | Delayed visible route-loading status and image error treatment. Failed image preloads can retry. Full offline/chunk-failure browser qualification remains outstanding. |
| F09 | Implemented | Lightbox Close has a 44px target and safe-area offsets; visible keyboard focus is retained. |
| F10 | Implemented | Horizontally scrollable filter strip, nonshrinking labels, and selected-tab reveal. North America fits after keyboard selection at 320px. |
| F11 | Implemented | Native album links let navigation restoration focus the originating album. Album order persisted across open/return in the browser. |
| F12 | Implemented | Continuous alternating landscape/square pairs, 3px seams, and perimeter-only corners. |
| F13 | Implemented | Contextual Back for exploration history plus transient Undo clear; saved controls restore without another provider request. |
| F14 | Implemented | One small introductory example under the idle input. |
| F15–F17 | Implemented for audited surfaces | Flattened article metadata/source rows, aligned Music to photo shell gutters, and standardized utility typography. No site-wide typography redesign. |
| F18–F19 | Implemented | Arrow/Home/End behavior and roving tab stops for filters/appearance; route-heading entry focus, album return focus, and visible Back focus. |
| F20 | Implemented; performance qualification pending | One viewport image policy, native lazy loading, reduced speculative album warming, Save-Data/slow-connection checks, cancelable scheduled preloads, and bounded image cache. No measured speed improvement claimed. |
| F21 | Deferred | Responsive image derivatives require a verified image transformation or generated-asset pipeline. Original source URLs remain intact; fabricated width query parameters were not introduced. |
| F22 | Partial | Unused homepage font families removed and the legacy mono font loads only on its route. A broad legacy CSS extraction remains a separate regression-sensitive refactor. |

## Verification

- Required five focused suites plus navigation, history, overlay/recovery, and image policy regressions: **175 tests passed across nine files**.
- Production build passed. Existing large-chunk warnings remain, especially Mapbox. Generated SEO output was reviewed separately; only the RSS build timestamp changed and was removed as build noise.
- Real browser at 1440px and 390px: all 16 development presets selected and inspected for document overflow; none overflowed horizontally. This is a geometry smoke check, not natural-language routing evidence or exhaustive control containment certification. See `evidence/implemented-presets.json`.
- Real browser: initial homepage in Light/Dark; mobile Search results; Escape and focus return; sidebar Tab wrapping; short 568×320 recovery page; map fallback and gallery anchor; alternating album geometry; album-origin focus restoration; lightbox Close target; 320px selected filter reveal; Explore first example, Undo clear, Taiwan story, and Back.
- Initial photography began at y=631 in a 900px viewport (less than 30% visible). No horizontal homepage overflow.
- Appearance restored to Light and viewport override reset. Local server remains available at http://127.0.0.1:8080/.
- React review covered native semantics, effect cleanup, stable callbacks, bounded scheduling, and conditional route assets. No new dependencies were added.
- Full app TypeScript checking remains red on repository issues: ES library support for `Object.hasOwn`/`replaceAll`, existing route comparisons, and test typing errors. Focused runtime tests and build pass; this is not a claim that the repository typecheck is clean.
- Local authored views were exercised with the UI reporting AI unavailable. This does not verify live Typesafe/Mistral service behavior or deployed behavior. No provider secrets were restored.

## Evidence

- `evidence/implemented-home-light.png`
- `evidence/implemented-home-dark.png`
- `evidence/implemented-mobile-search.png`
- `evidence/implemented-presets.json`

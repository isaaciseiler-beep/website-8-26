# Concurrent menu fold and page arrival

The previous route handoff captured the entire viewport, including navigation, while each route mounted its own header and sidebar. The snapshot could freeze or hide the fold; changing routes also replaced the moving navigation elements.

`SiteChromeProvider` now owns the persistent sidebar and header surfaces. Pages register their existing controls without changing their page layouts. Registration cleanup cannot remove a destination's newer controls. Standalone component usage remains supported.

`PageTransitions` warms destination code immediately, retains the live outgoing page through React Suspense, and commits the destination with a subtle content-only opacity arrival. It no longer captures frozen viewport snapshots or waits for the fold to finish. Navigation, keyboard focus, reduced motion, scroll restoration, and superseded-request protection remain intact.

## Verification

- 178 tests across PageTransitions, portfolioPolish, navigationTheme, and the five required canvas/composition suites passed. Regression coverage checks persistent DOM identity across menu navigation, live content during delayed imports without a loading fallback, rapid supersession, and browser Back state restoration.
- Production build, the repository typecheck command, focused ESLint, and whitespace checks passed. The generated feed change was only its build timestamp and was restored separately.
- Browser checks: desktop Light and Dark; 390px phone layout; Work, Writing, About, and search-to-Taiwan project navigation. Restored Light and the default viewport.
- `narrow-overlap.json`: the new `/work` content was already present while the sidebar moved from x=-73 through x=-296 on a 390px viewport. No loading fallback was present in any sampled frame.
- `wide-overlap.json`: `/about` was already present while its 200px sidebar moved from x=-49 through x=-122. No loading fallback was present.
- One header and one sidebar remained mounted. The phone document width stayed at 390px, without horizontal overflow. Browser console showed no errors after navigation.

Local preview remains available at http://127.0.0.1:8080/. No deployment was performed.

Follow-up: increased navigation retraction from 340ms to 560ms at the owner's request. Sidebar, search, header chevron, desktop content offsets, and mobile page translation share that closing duration. Opening remains 460ms; page arrival keeps its separate 340ms fade.

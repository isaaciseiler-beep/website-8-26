# UI best-practice review — November 3, 2026

This review builds on the [visual refinement pass](../ui-refinement-2026-11-03/README.md). It checks the current implementation against primary guidance, then fixes observed gaps. It is not a WCAG conformance assessment or a claim about live model quality.

## Research and decisions

| Area | Primary guidance | Implementation and verification |
| --- | --- | --- |
| Status updates | [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | Search now keeps one polite, atomic status region through pending, result-count, empty and closed states. Photo loading and errors share a persistent status outside the busy image stage. Neither moves focus. |
| HTML and ARIA | [ARIA in HTML](https://www.w3.org/TR/html-aria/), [active descendant](https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant) | Removed the guide trigger’s reference to an unmounted panel. Autocomplete shortcut groups now use a valid group inside a presentation list item. The native multiline textarea remains a textbox, with controls/active-descendant references tested against actual DOM targets. |
| Page structure | [W3C page regions](https://www.w3.org/WAI/tutorials/page-structure/regions/) | The portaled header is now a native header/banner. Explore results have an explicit named region, making their existing label valid. White difference blending and the portal remain intact. |
| Readability | [W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | Replaced the footer signature’s 20% foreground opacity with the shared foreground token. This is a readability improvement; a brand logotype may qualify for the criterion’s exception. |
| Reflow and spacing | [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) | Tested 320px layouts and user overrides: 1.5 line height, .12em letter spacing, .16em word spacing and 2em paragraph spacing. Kept these as test overrides rather than imposing them on the design. |
| Targets and forms | [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [form labels](https://www.w3.org/WAI/tutorials/forms/labels/) | Retained the prior pass’s larger primary targets, labelled feedback fields, native selects and visible keyboard focus. WCAG AA’s 24px minimum/spacing exceptions and enhanced 44px targets are distinct requirements. |
| Modal keyboard use | [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | Added browser contracts for mobile Search and desktop/mobile photo dialogs: Tab/Shift+Tab stay in the modal, Escape closes it and focus returns to its opener. |
| Motion | [web.dev reduced motion](https://web.dev/articles/prefers-reduced-motion), [animation performance](https://web.dev/articles/animations-guide) | Retained reduced motion and the user-approved continuous fold. Normal-flow width/height changes are an intentional exception to transform/opacity preference: scaling text would violate the product direction. Geometry regressions check continuity and reversals; this is not a device-performance benchmark. |

## Automated and browser evidence

- Axe-core 4.14.0, run without adding a project dependency, scanned 28 visible states at 320px: 14 each in light and dark mode. States included idle, suggestions and selection, guide/privacy, Taiwan, feedback, government comparison, Work/empty Work, Search, Korea album, lightbox and Work index.
- Before fixes: 58 state/rule findings across invalid attribute values, an invalid role, missing region structure and contrast. After fixes: 26 of 28 states have no reported violations; two contrast warnings remain on the inverted IIS mark.
- In both flagged states, rendered screenshots show dark mark pixels near #0a0a0a on #f5f5f5. The raw tool compares the source white text without the difference blend. These two warnings were reviewed as tool limitations for those captures; this does not guarantee contrast over every photograph.
- Axe also returns incomplete checks, which are not passes: blended/image contrast, textarea controls references, modal-background focusability and Search’s dialog context. Actual controls targets are covered by DOM assertions; modal focus is covered by keyboard browser tests. Contrast and assistive-technology behavior still warrant human review beyond these samples.
- Twelve exploratory text-spacing states at 320px and 768px showed no page overflow or clipped checked controls. Permanent light/dark 320px regressions cover the guide, benchmark and Taiwan view, plus the header landmark.
- 383 focused unit tests passed across portfolio/schema/API contracts, Explore, autocomplete, history, motion lifecycle, reading restoration, page transitions and Search status updates.
- 130 browser checks passed in `genui.spec.ts`, `explore-fold.spec.ts` and `ui-polish.spec.ts`, including continuous motion, reversals, focus visibility, modal focus loops, opener restoration, text-spacing overrides and image failures.
- Production build, TypeScript (`npm run typecheck`) and `git diff --check` passed. Targeted ESLint reports no errors; the existing HomeExplore route-restoration ref-cleanup warning remains. Build chunk-size notices are unchanged.
- Reviewed and excluded the generated feed timestamp. No dependency or lockfile changes were needed.

A compact [scan summary](scan-summary.json) preserves the before/after counts and sampled header pixels. Session scripts, raw axe output, pixel samples and logs are under `/tmp/portfolio-best-practices/`. These are temporary diagnostic artifacts. Permanent behavioral regressions live in `src/test/SearchPanelStatus.test.tsx`, `src/test/ExperienceAutocomplete.test.tsx` and `tests/e2e/ui-polish.spec.ts`.

## Limits

Chromium with isolated browser preferences was used. VoiceOver and physical Safari/iOS testing were not performed, and automated scans cannot prove accessibility. Live Mistral composition and the configured interactive Photo Map were not available locally. This review verifies authored UI and mocked provider contracts. The local preview and the owner’s browser appearance remain unchanged. No push or deployment was requested.

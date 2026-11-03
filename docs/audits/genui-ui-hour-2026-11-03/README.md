# Generative UI: visual and motion pass, November 3, 2026

The earlier pass mostly polished small details. This pass changes the visible result hierarchy and the way a visitor moves between states. Work started at 20:53 UTC and included four Claude check-ins; the fourth reviewed actual before/after screenshots.

## Visible changes

- A prominent project title doubles as the native project selector. The separate bottom project-switching row is removed.
- Larger introductory text, image-first desktop layouts, and clearer comparison/career typography establish a reading order.
- Facets use one moving selected surface. Narrow controls reserve space for bold labels; three benchmark choices size to their actual text.
- Lab product selection sits beside its reading content on desktop and before the image on narrow screens. Artifact frames use a 16:9 ratio with `object-fit: contain`, preserving the complete image without the previous white strips.

## Motion and interaction

- A shared image carries a project from its work tile into the reader. Sharing is disabled for multi-module answers and reduced motion; reading text does not scale.
- Search results rearrange by position, with inert exiting cards. Back restores the filter, tile focus, and reading position.
- Clear fades at the end of the vertical fold, then releases the expanded width. Undo and interrupted exits preserve the active controls.
- Native disclosures animate their own height while the outer shell follows intrinsically. Closing controls leave keyboard navigation immediately; canceled clicks roll back that exclusion. Nested disclosures, programmatic toggles, history restoration, and reduced-motion changes were checked.

## Evidence

[Before](before-desktop.png) · [After](after-desktop.png) · [Dark mobile](after-mobile-dark.png) · [Motion recording](motion-demo.mp4)

The recording condenses idle pauses; it is a behavior demonstration, not a frame-rate benchmark.

- 1,050 unit tests across 71 files; type checking, production build, and lint pass.
- 23 browser cases pass, including narrow selected labels, image handoff, native selector state, disclosure focus, Clear/Undo, and photo navigation.
- 50 natural-question result layouts and 96 authored-preset combinations pass control and text containment checks.
- A 613-second candidate stress run passed 2,070 operations. After the final visual refinements, another 121 seconds passed 414 operations. The checked-in audit script passed an additional 138 operations.
- 80 rapid close-and-Tab sequences and four deep-navigation cases passed with zero measured scroll drift. Normal/reduced-motion lifecycle samples and CPU diagnostics are attached separately.

All portfolio intent/composition endpoints were intercepted during scripted checks. These results establish authored UI and mocked protocol behavior, not live provider health. Chrome was used at responsive widths; physical devices and other browser engines were not claimed as tested.

One exploratory stress assertion initially counted the intentional image hover dimming as a stranded fade. Moving the pointer away before settled-state checks resolved the false positive. The final runs retain the opacity, containment, marker, and page-error assertions.

The disclosure enhancement follows the browser's native [details-content and intrinsic-size transition support](https://developer.chrome.com/blog/styling-details). Browsers without that support keep ordinary native disclosures.

## Reproduce the motion audit

With a local preview running, set `PORTFOLIO_EVAL_URL` to its URL and run `node scripts/audit-genui-interactions.mjs`. `PORTFOLIO_STRESS_DURATION_MS` accepts 1,000–3,600,000; `PLAYWRIGHT_EXECUTABLE_PATH` can select an installed browser. The script intercepts provider endpoints and exercises filtering, image handoff reversal, native disclosures, Clear/Undo, reduced motion, and containment.

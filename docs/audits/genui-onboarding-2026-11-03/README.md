# Generative UI: first-visit exploration and composer refinement

This pass addresses responsive screenshot proportions, question-field expansion and retraction, questions for unfamiliar visitors, and an in-pane “How to explore” answer. Claude reviewed the direction, actual responsive screenshots, and implementation; the final verification is recorded below.

## Changes

- Screenshots and other artifacts retain their intrinsic proportions. Removing the fixed tablet height eliminates the artificial white bars around widescreen screenshots; square images retain their shape. Photographs keep their authored editorial crop. The original image remains available from the image link.
- A single native multiline textarea stays mounted during editing and reading. A hidden copy measures its wrapping; the field grows to six lines and then scrolls. Focus no longer swaps an input for a wrapped display. First-line alignment stays stable as action buttons appear. Native selection, composition input, freeform submission, and reduced motion remain available.
- “Who is Isaac?” introduces the portfolio before detailed roles. The Taiwan question explicitly introduces teachers. Broad ChatGPT suggestions introduce product testing before feature-specific feedback questions.
- “How to explore” opens an authored answer inside the existing results pane. It includes four starting questions, a quick explanation, optional technical details, and a feedback invitation. It works without a provider request. Clear/Undo and returning to a previous exploration remain available.
- Help content arrives in three short opacity stages. The main pane retains its measured reveal and vertical-fold-before-width-retraction behavior. Help remains available from the empty-field shortcuts and the existing “Explore further” disclosure.

## Verification

The implementation passed 1,073 unit tests across 71 files, TypeScript checks, lint, and the production build. The build retains the pre-existing large-bundle advisory.

- The responsive audit checked 156 combinations of theme, viewport and project state with no horizontal overflow, escaped controls or artifact-ratio errors. The later square-image/text and first-visit-edge refinements have dedicated browser assertions and refreshed screenshots.
- Forty frame-sampled opening, focus/blur, Clear, Undo and interruption cases passed. The composer’s top edge had zero measured drift during opening at 1440, 768, 390 and 320 CSS pixels.
- Thirty-six text-resilience cases passed: ordinary and larger text, text-spacing overrides, Unicode, long words/URLs and multiline entry. Typing did not call the intent provider.
- All 43 current UI/browser cases passed in 31.9 seconds; details are recorded in `verification.json`. An accumulated sequential browser context run had a post-assertion teardown hang; independent cases now run over two bounded workers. The same 40 cases completed in 27.5 seconds with parallel scheduling, and the final suite includes three additional feature-prefix cases.
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

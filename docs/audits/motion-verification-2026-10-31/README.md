# Motion implementation and verification

Implemented from [the motion audit](../motion-2026-10-31.md) in the Desktop checkout. Application changes remain local; nothing was pushed or deployed. Existing content, provider, and portfolio edits were preserved.

## Implemented

- Routes hand off immediately and enter once. Removed the outgoing wait and duplicate main-page/gallery/tile entrances. Code warms on navigation intent; the footer stays outside the route fade.
- Sidebar, Search, and page offset share a 340ms opening / 220ms closing clock. Navigation text stays crisp and full size, with no repeated stagger or blur. Closed sidebar content stays mounted and inert. Search and photo-viewer exits become inert and hidden from assistive technology through a ref-forwarding presence surface.
- Theme switching uses one short root snapshot transition, with an immediate fallback and no descendant transition override. Reduced motion bypasses the snapshot.
- Explore retains intrinsic-height measurement, anchored composer, current results while editing, and fold-before-width-release on Clear. Removed the extra module entrance. Local selection changes fade only the changed detail region, keeping headings and controls stable.
- Album covers show one preview after a 340ms hover/focus dwell and hold it. They reuse document photo order, do not cycle on touch, and remain static when hidden or reduced motion is requested.
- The lightbox holds its last photograph until the latest requested image loads and decodes. Its backdrop and controls stay mounted; late loads cannot overwrite a more recent request. It provides a failure message while retaining the prior image. Kept the existing backdrop appearance; no unmeasured blur-performance claim.
- Editorial text no longer uses layered blur/translation reveals or decorative scroll-linked parallax. Benchmark chart animation uses a bounded 340ms transition and is disabled for reduced motion. Removed the extra clipping reveal around charts and delayed top-performer labels.
- One live media-query policy covers Motion consumers, map camera actions, imperative scrolling, charts, and photo previews. The CSS policy also reaches portals, pseudo-elements, and shared UI primitives. Map flights are no longer marked essential; an in-flight camera stops when reduced motion is enabled.
- Scroll reveal observes added subtrees rather than rescanning the document for every text mutation, handles live preference changes, and no longer leaves compositor hints on settled content. Arcade rendering stops while hidden and reduces paused rendering to an idle cadence; active gameplay retains its animation loop.

The original shell, typography, corner tokens, photo layout/order, content/routing restrictions, local controls, focus indicators, and provider boundaries remain in place. No animation package was added or upgraded.

## Checks

- **118 tests passed across eight Vitest files:** the five required suites, existing motion/navigation-theme suites, and the new lifecycle suite. The latter checks live preference subscription cleanup and stale image-load rejection. Existing canvas tests cover all 16 live presets and delayed provider responses versus manual edits.
- **ESLint for `src` passed.**
- **Production build passed.** The existing large-chunk warning remains. Generated feed/sitemap output was reviewed separately; only the feed build timestamp changed and was removed from the final diff.
- **Connected Chrome preview:** exercised comparison submit/Clear, Taiwan Outcomes → Process, stable control opacity, sidebar → Work, Light/Dark switching, album → viewer → rapid next → Escape, and restored opener focus. The original dark appearance and normal viewport were restored. No browser error logs were reported for this preview session.
- **Responsive Chrome checks:** comparison at 320, 390, 768, and 1440px had no horizontal overflow and all measured AI controls stayed within the window. Also exercised Taiwan and Work at 320px. See [recorded containment measurements](responsive-checks.json) and [desktop result screenshot](desktop-comparison.png).

## Verification limits

- The new nine-case Playwright suite is saved at `tests/e2e/motion.spec.ts`. It was **not executed successfully**: the default headless binary was absent, and cached browsers failed at launch (including SIGABRT/EPERM), before page assertions ran. The suite deliberately uses unavailable-provider responses to isolate authored UI, and does not certify live provider behavior.
- Live reduced-motion switching is unit-tested and implemented across the independent engines, but browser emulation of that preference and the automated eight-combination theme/viewport/motion matrix remain unverified. Chrome visual checks above were performed through the connected browser.
- The local Photo Map has no Mapbox token. Camera policy is source-reviewed; configured map playback remains unverified. No provider keys were restored.
- The explicit application TypeScript check still reports existing ES2020 `replaceAll` incompatibilities, redundant route narrowing, and older test typing errors. No new errors from this change appeared in that check; build and ESLint passed independently.
- No before/after frame traces or physical-device measurements were obtained. The implementation removes redundant animation work, but no numerical speed/FPS improvement is claimed. Broad regression playback of every special route remains separate from the checked main journeys.

Review preview: `http://127.0.0.1:8080`.

# Generative UI refinement — 3 November 2026

Priorities: visual polish, transitions between states, and backend safeguards. The existing sidebar/page-transition edits were present before this session and were preserved. No push, publication or live portfolio-provider execution is part of this pass.

## Implemented

- Committed questions wrap as ordinary text while the original native search combobox remains the accessible editing control. The visual copy is hidden from assistive technology; clicking or typing returns to the existing editing/autocomplete behavior. Enter, IME, keyboard selection, Clear/Undo and resize are preserved.
- Project, comparison, connections and benchmark controls share a native-button facet component. A per-instance Motion selection marker connects states. Reserved bold-label widths prevent the control row from shifting as selection changes. The marker skips first-paint travel, remains outside pointer handling, and switches immediately with reduced motion.
- The broken Atlas primary image (confirmed HTTP 404) was replaced with the already-authored reviewed video poster (HTTP 200). The local cover remains the fallback. Four light/dark desktop/mobile checks confirmed decoded pixels, full rail width, correct picker order, settled opacity and no request to the broken URL. See `media-repair-evidence.json` and `atlas-final-checks.json`.
- The Lab work picker precedes the media/reading grid in DOM order, so a mobile visitor encounters the control before the product image. Artifact media fills a stable contain frame using the existing neutral surface, site radius, and desktop/mobile aspect ratios.
- Compact government rankings animate row position as the measure changes, retaining each state's identity and exact displayed score/rank. Text is not scaled. Expanded lists switch immediately to avoid long flights across dozens of rows. The CSS transform transition is excluded from these rows so it cannot chase Motion's layout projection.
- Compose admits at most four active requests per instance by default, configurable through `COMPOSE_CONCURRENT_CALL_LIMIT`. Zero disables new model work. Cache hits and local controls bypass admission. A saturated instance responds with HTTP 503 and `Retry-After: 1`, preserving the authored UI without an automatic retry. Capacity rejection does not consume the daily call budget; it still counts toward the existing network rate safeguard. The permit spans advice, stream reading, final validation and usage, and releases on success, errors, deadline or disconnect.
- Clear has a bounded recovery for a folded pane whose exit completion was lost after repeated interruption. It checks that the pane is visually collapsed before resetting presence and releasing width, preserving the normal fold and new-request reversal.
- Composition cache identity now respects `JEV_COMPOSITION_ADVICE=off`, so changing that configuration cannot reuse a selection produced with the opposite advisory policy.

The capacity bound is process-local. It does not enforce a distributed quota or guarantee that a remote transport honors cancellation.

## Verification so far

- 1,036 unit tests passed across 70 files.
- All 17 generative-UI/browser lifecycle tests passed against a dedicated local production preview, including rapid replacement, local control changes, shared views, Clear/Undo, resize, both themes, runtime reduced-motion changes and photo navigation.
- 96 layout checks passed: all 16 review presets at 1280, 390 and 320 px in light and dark mode. No document overflow, escaped controls, stranded text opacity or page errors. See `layout-matrix.json` and the accompanying PNGs. Preset checks do not establish natural-language routing or provider quality.
- Frame-position sampling observed nine intermediate selection-marker positions with motion enabled and zero under reduced motion; both finished with no transform. See `marker-motion-samples.json`. This establishes the intended movement, not a frame-rate guarantee.
- The offline visible-answer release gate passed all 21 quality cases, with no provider calls.
- App/Node typechecks, project ESLint, explicit server TypeScript lint and the final production build passed. The pre-existing bundle-size advisory remains.

Two stale browser assertions were corrected: connection buttons have project-specific accessible names, and programmatic focus after mouse input is not keyboard `:focus-visible`. The containment assertion now waits for the documented final-width state, since opening deliberately clips destination-width content inside the growing shell. An overlapping early browser run lost its shared preview server; the final suite used an independently managed preview and passed.

## Extended interaction audit

The initial exploratory run reached 263 operations, then timed out awaiting Undo after Clear. It recorded no page errors, overflow, faded content or escaped controls before the timeout. A captured 15-minute repetition then completed 2,610 operations and 870 settled-state checks without reproducing that timeout. A later captured repetition reproduced the same timeout at operation 263. The pane had reached zero visual height but remained mounted while its completion bookkeeping was pending, retaining expanded width and suppressing Undo. The application now recovers a visually folded exit with bounded checks and a presence reset; width is never released while the vertical fold remains open. The post-fix repetition passed 360 operations and 120 checks over 123 seconds, including the previously failing cycle. All 17 browser cases and all 1,036 unit tests passed again after this repair. Typechecking, lint and the rebuilt production preview also passed. See `stress-results.json`, `final-stress/` for the captured failure, and `exit-recovery/` for the repair verification.

A portable, bounded audit is available in `scripts/audit-genui-interactions.mjs`. It intercepts all model endpoints, changes viewport and reduced-motion preference, cycles real portfolio views, interrupts facet changes, and exercises Clear/replacement/Undo. Default duration is one minute; limits are validated before launching the browser. Example:

```sh
PLAYWRIGHT_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
PORTFOLIO_EVAL_URL=http://127.0.0.1:4173 \
PORTFOLIO_AUDIT_OUTPUT=docs/audits/genui-iteration-2026-11-03 \
PORTFOLIO_STRESS_DURATION_MS=900000 \
node scripts/audit-genui-interactions.mjs
```

The first final-build attempt also flagged a late offscreen image as stranded opacity. The direct image probe recorded a normal decoded image finishing its arrival animation. The audit now distinguishes pending image pixels and active arrival effects from stuck opacity; this adjustment does not relax text-opacity, containment, selected-control or page-error checks. See `lazy-image-probe.json`.

Recorded heap readings are observations only; they are not proof of leak freedom. Real mobile hardware, assistive-technology operation and live provider performance remain separate verification.

## Claude iteration

Four Claude review passes are complete: three in the desktop app and the final read-only pass through the CLI. See `claude-pass-1.md` and `claude-pass-4.md`. Claude reviewed supplied source excerpts and reported checks, without independently viewing frames or executing tests. The final review identified the textarea/combobox role conflict; the implementation retains the native search input instead. This follows the W3C [ARIA in HTML role allowances](https://www.w3.org/TR/html-aria/#el-textarea).

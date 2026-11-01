# GenUI refinement — October 31, 2026

Local review of the Desktop checkout, with separate content, motion, and backend agents. This pass did not push or deploy. Concurrent About and Beta Preview work was preserved at the owner's request.

## Changes

- Mistral interprets and composes directly when configured, with optional time-bounded Jev advice (see follow-up below). Jev remains the optional classifier when Mistral is not configured. Published section excerpts and reviewed career answers give the composer usable evidence. Valid sections, multiple subjects, and requested companion modules survive reconciliation.
- Follow-ups preserve selected controls and other modules. Generated views update their downstream request context. A pending configuration probe cannot suppress server-confirmed generation. Manual changes cancel stale responses.
- Project evidence is reachable through an Evidence tab, with term-based search, original links in collapsed Sources, published metrics, and their team attribution. Specific product outcomes, feedback, tradeoffs, and evaluation questions open the relevant evidence. Repeated default metrics were removed.
- Back to projects restores the work search and keyboard focus. Opening a project focuses its heading. Narrow process navigation wraps within the window. Loading announcements live outside the busy result region.
- Benchmark ties use consistent ranks; government selectors are alphabetical; evidence has table semantics. Government-name parsing handles West Virginia and Washington, D.C., and personal methodology questions take precedence over incidental score/location words.
- Request bodies, references, quotas, caches, and cancellation handling have focused regression coverage. Photography synonyms bypass generation. Public JSON, Markdown, and generated project HTML retain source metrics.

## Evidence boundaries

Unit/API generation checks use mocked providers. Local HTTP evaluation uses actual development endpoints with providers unconfigured. Browser checks cover authored fallback UI and explicitly identified generated-response fixtures; neither establishes current Mistral service quality or production behavior. No local provider secrets were restored.

The browser matrix covers all 16 presets at 320, 768, and 1440 pixels in light and dark modes, both initially and with disclosures opened. A separate motion suite checks normal/reduced motion, measured height, resize state, inert exits, and photo navigation. A repeated interaction soak exercises submitting, editing, manual controls, resizing, clearing, project navigation, and theme changes. Final results are recorded in verification.json.

The generated Boehringer and congressional Markdown changes add exact labeled statistics. Other generated route files remain unchanged; the feed timestamp is build noise and is excluded from the final change.

## Final checks

435 unit tests across 37 files, 11 targeted browser scenarios, 22 local HTTP cases, lint, TypeScript, and the production build passed. Both 96-case preset/disclosure matrices passed without overflow or browser errors.

The soak attempted 697 workflows and 6640 interactions, completing 696 workflows with zero uncaught page errors. One career-button click-stability timeout recovered on reload; 12 targeted replays did not reproduce it and measured no layout oscillation. Its root cause remains unproven. This is recorded as an automation timeout, not counted as a successful workflow.


## Research-led follow-up: linked evidence and cooperative composition

Reviewed [Google Research’s interactive gallery](https://generativeui.github.io/), including the live fractal explorer and its controls; inspected [json-render’s playground](https://json-render.dev/playground) and [experimental Jev integration](https://json-render.dev/docs/jev); reviewed [Tambo’s interactable component model](https://docs.tambo.co/concepts/generative-interfaces/interactable-components) and [A2UI’s local actions](https://a2ui.org/concepts/actions/). The useful pattern is a task-shaped interaction over shared state, with models choosing prepared capabilities. This portfolio needs traceable evidence and consistent control state; a new HTML-generating runtime would weaken those properties.

Implemented three reviewed cross-project connections in `portfolioConnections.ts`: making complexity usable, learning from people, and carrying ideas into practice. One Contribution/Process/Outcomes lens updates all three projects. Original passages expand in place. Exploring a project provides Back to connections, restoring the chosen thread and lens. The optional `connectionId` travels through schemas, tools, shared links and follow-ups. The 16-layout catalog remains intact; this extends an existing career surface. Content version v12 prevents older clients from silently stripping the new control.

Jev now provides optional closed-set evidence, experience-kind and connection advice to Mistral. It uses the existing server credential, a 750ms deadline, cancellation, bounded cache and process budget, and can be disabled with `JEV_COMPOSITION_ADVICE=off`. Mistral can disagree; failures proceed without advice. The current control state participates in both advisory context and cache identity. No provider writes facts or executable interface code. No framework or dependency migration was necessary.

This is an extensible baseline: add reviewed relationship records and source-backed interaction candidates to the shared catalog, rather than separate prompt-specific page templates. Further model freedom should first be evaluated against held-out visitor tasks for subject selection, evidence relevance, preserved controls and latency. No live comparison establishes that Jev advice improves quality yet.

Follow-up verification: 54 authored browser combinations (3 threads × 3 lenses × 3 widths × 2 themes), including expanded passages, had no horizontal overflow or uncaught page errors. Generated transport fixtures test both themes, local controls, sharing, cancellation and configuration races. See `connections-light.png` and `connections-dark.png` for the resulting surface. Provider calls remain mocked in tests; no live provider or deployment claim is made.

Final follow-up checks: 455 tests across 39 files, 13 generated/motion/photo browser scenarios, lint, TypeScript, server ESM import audit, and the production build pass. The build retains its existing large-bundle warning. Stale browser assertions were updated to target the existing Work and album native links. Other chats’ About, Beta Preview, navigation and overlay work remain preserved. Local preview stays available on port 8080; no publish or push was performed.


## Publish and second refinement series

Pushed baseline commit `776bc2f` to `origin/main`; Vercel deployment `dpl_EHJQzj54AENAk3c2UVgQJk8vwrNf` reached READY with `seiler.page` assigned. The live 22-case evaluation passed all 22 cases with 21 real Mistral compositions. Runtime logs independently showed Jev advisory evaluation followed by Mistral composition; the runtime error query returned no errors. Configuration GET alone was not used as provider-health evidence. Live evaluation payloads are recorded in `live-provider-evaluation.json`.

A fresh stress series reproduced and fixed three classes of issue: delayed clipboard outcomes mislabeled a changed view; pure photo requests containing professional vocabulary could reach providers; and natural connections/findings/follow-up questions could lose their subject or focus. Clipboard outcomes now check view identity and revision. The photo boundary distinguishes browsing photographs from actual work requests accompanied by images. Reviewed connections retain the full named subject set; research findings open published outcomes; short contextual follow-ups preserve the existing subject and controls. Providers still cannot invent claims.

Refined release snapshot: 534 unit tests across 42 files, 13 real-browser scenarios, TypeScript, lint, production build and import audit passed. Four fixed random seeds exercised 2,000 mixed portable-view edits/rejections with validation, immutability and share roundtrips. Expanded browser checks passed 48 connections→evidence→project→Back flows (528 interactions), 18 shared-link reloads, six delayed-stream/synthetic IME scenarios, 72 Undo/Redo roundtrips and 72 rejected stale-revision operations. No uncaught browser errors or overflow were observed in the completed suites. The older motion harness’s stale Back assertion was replaced with resize/state and fold checks; native-link/button navigation assertions work with both the release and concurrent local navigation changes.

The new local 71-question semantic corpus improved from 53 to 65 expected results. Remaining six: three unsupported comparisons between products inside one OpenAI project, and three local wording abstentions. They are not counted as successes. Live Mistral can interpret beyond local matching; that does not establish those six cases pass. Synthetic composition events cover event handling, not a physical keyboard/OS IME. One expanded-browser launch exceeded six seconds before Explore mounted; its clean rerun passed without reload or retries. No source-level history defect was reproduced from that launch timeout.

Concurrent About, navigation, photo, image-loading and overlay work remains in the owner's checkout and was excluded from the release snapshot, except compatible edits already within the shared GenUI files. No local provider secrets were restored. Port 8080 remains available for local review.

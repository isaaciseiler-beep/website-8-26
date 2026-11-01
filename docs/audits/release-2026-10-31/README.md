# Portfolio quality and suggestions release

Candidate content version: `canvas-2026-10-31-v10`.

Includes the audited answer-quality and photo-viewer improvements plus a revised local suggestions engine:

- 32 authored, routable questions covering actual portfolio responsibilities, methods, lessons, results and product feedback.
- Subject and question-aspect matching, bounded prefixes and one-edit/adjacent-transposition tolerance.
- Context-aware follow-ups for the displayed project or comparison; explicit new subjects take precedence.
- Unrelated and photography drafts do not produce misleading fallback suggestions. Freeform Enter remains available.
- Drafts are unchanged by highlighting. Arrow keys, Enter, Escape/Tab and IME behavior are retained. Typing and highlighting make no provider requests.
- The quiet homepage’s rotating questions share the curated starter set and existing measured footprint.

Assembled on mobile baseline `51cac96`, isolating the reviewed changes from unfinished motion work in the Desktop checkout. The latter is preserved. No provider keys were added or restored.

Pre-release checks: all 266 tests in 29 files, lint, typecheck and production build passed. The first lint attempt raced a transient Vite config file during dev startup; the rerun after startup passed. Build retains the existing large-bundle warning. The candidate passed 110 responsive browser checks and 24 suggestion checks in light/dark at desktop/narrow widths. Final visitor journeys and live acceptance evidence are saved alongside this file as completed.

Live release acceptance: verify deployment SHA and READY state, content version, the 20-question corpus, real provider responses, suggestion ranking/keyboard behavior, photo focus restoration and full visitor journeys. Do not equate local authored checks with live provider behavior.


## Published and verified

Final production commit: `e5ce7ed7ec8969dc091b84b490ffd9c16527ff15` on `main`.
Vercel deployment: `dpl_BHQ1Z5Yp9Rb4VZX7p1aU3Ekbd7uJ`, `READY`, assigned to https://seiler.page . Public content version: `canvas-2026-10-31-v10`.

All 267 tests in 29 files, lint, typecheck and build passed after the final code patch. The first live pass exposed comparison-aspect inheritance (17/20 acceptance cases); a shared reconciliation fix and regression test were added, rebuilt and redeployed. The final deployed pass passed **20/20 answer-quality acceptance cases**, **24/24 suggestion checks** and **20/20 complete visitor journeys**, including photo modal keyboard containment, Escape and opener focus restoration. The tested flows recorded no uncaught page errors or horizontal overflow.

The live suggestion checks confirm no POST to intent/compose while typing or highlighting, draft preservation, correct first suggestions, keyboard commit, exact published evidence, contextual follow-ups and light/dark desktop/narrow layouts. The live answer pass confirms all three comparison pairs start in Contribution while genuine outcome follow-ups remain supported.

Jev runtime request `d847632b-304e-4c4f-bd96-cbfe8a60ff9b` matched the career probe's returned request ID and was healthy on the final deployment. Mistral runtime logs on that same deployment recorded healthy `mistral-small-2603` composition responses. This establishes actual provider execution, beyond GET configuration checks. No local provider secrets were restored.

Evidence: [final acceptance](live/acceptance.json), [raw answer observations](live/results.json), [live suggestions](live-suggestions/results.json), [live journeys](live-journeys/results.json), [provider evidence](live-provider-evidence.txt). The first live pass is preserved in `live-initial/`. Earlier audit reports remain point-in-time records, superseded by this release result.

The Desktop checkout's main/index baseline was aligned to the published commits without overwriting any working-file contents. Separate unfinished motion work remains uncommitted and was excluded from production. Preview remains available at http://127.0.0.1:8081/ for the isolated release and http://127.0.0.1:8080/ for the active Desktop workspace. No claim of universal perfection or measured performance improvement is made.

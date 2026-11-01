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

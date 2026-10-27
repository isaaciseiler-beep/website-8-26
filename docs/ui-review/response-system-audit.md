# Response system audit and rebuild

Inspected the homepage composer, live intent/composition handlers, legacy chat, published content, and project/comparison/career/benchmark views. Repairs follow GUI.md and the Untitled theme snapshot, using the existing scoped tokens, Satoshi font, Lucide outlines, and site corners.

## How a request becomes a view

1. Typing edits a draft. Enter, the submit button, or a curated suggestion commits it.
2. A shared local interpreter identifies explicit subjects and prepares a useful authored result immediately. Greetings and photography never invoke providers.
3. Server-side Jev evaluates the requested experience, project, focus, and need for further composition. Accepted choices select known IDs. Low-probability decisions retain the local interpretation.
4. Mistral may compose a bounded arrangement of known modules and controls. It returns data, never executable HTML, invented prose, or new facts.
5. The server validates references and reconciles explicit subjects and current controls. The client rejects stale revisions and content versions. Manual changes cancel pending requests.
6. React renders source-controlled evidence and interactive views. Local tabs, filters, searches, and project selectors do not invoke a model.

Photography remains a permanent independent gallery and Photo Map. The government data is explicitly the August 2025 benchmark snapshot.

## Findings and repairs

| Impact | Location | Evidence and effect | Repair | Status |
| --- | --- | --- | --- | --- |
| High | src/lib/genui.ts; api/intent.ts; HomeExplore.tsx | Competing substring rules confused building in Taiwan with architecture, connections across work with contact, and current work with journalism. Visible suggestion text differed from submitted requests. | One shared semantic interpretation, separate task and focus decisions, exact suggestion submissions, explicit subject reconciliation. | Fixed |
| High | src/components/canvas/PortfolioViews.tsx; home-explore.css | Content was arranged like a controls demonstration, with repeated headings, selectors, and weak hierarchy. Comparisons stacked whole projects on mobile. | Editorial project lead with role and contribution, local contribution/process/outcomes/evidence tabs, aligned comparison rows, and a career explorer. Existing typography/spacing tokens replace additional filled containers. | Fixed |
| High | src/lib/portfolioEvidence.ts | The interface had project records but lacked a concise, source-checked account of individual responsibilities and published outcomes. | Six authored evidence records derived from existing case studies; models choose records rather than inventing answers. Office-wide outcomes are distinguished from individual contributions. | Fixed |
| High | genui.ts; BenchmarkExplorer.tsx; LayoutViews.tsx | Some controls lived only in component state and could disappear or reset on provider follow-ups. A live walkthrough also caught provider focus resetting a selected process tab. | Serialize role, focus, search, expansion, section, benchmark band/metric/region/state selections; current controls are authoritative for refinements. | Fixed |
| High | api/chat.ts; ChatOrb.tsx | The separate legacy chat could fall back to raw page metadata after provider failure. | Build a relevant published-source summary and label that fallback explicitly. | Fixed |
| High | server/; scripts/verify-server-imports.mjs | Deployment exposed the Hobby function count and Node ESM import failures that local development did not catch. | Move shared helpers out of API routes and verify runtime file extensions before every build. | Fixed |
| Medium | provider-observability.ts; evals/portfolio-cases.json | Configuration was being confused with health; rendered presets did not establish natural-language routing quality. | Hashed request IDs, sanitized failure reasons, observed process health, and a repeatable 22-question HTTP evaluation. | Fixed |
| High | api/compose.ts / Mistral service | The deployed key receives HTTP 429, including an isolated retry after a quiet period. No generated composition has been verified. | Keep authored results useful, preserve selections, report provider availability honestly, and record underlying status/type. Account limits were reviewed read-only; no credentials or billing settings were changed. | Provider issue remains |

## Verification

- 25 test files / 173 tests passed with two workers; lint, production build, Node ESM import checks, focused NodeNext API typecheck, and diff whitespace checks passed.
- Live HTTP evaluation on production content version canvas-2026-10-22-v7: 22/22 intended views, subjects, focuses, and guidance passed. Jev supplied 15 accepted routes; fallback or starting-point guidance handled the remaining cases. These are routing assertions, not a claim that all answers were model-generated.
- An actual Mistral composition probe failed with HTTP 429. Mocked streaming/schema tests passed; they do not establish live Mistral health.
- Browser review covered the resting homepage, Taiwan project, project comparison, career/current role, government benchmark, gallery navigation, light/dark modes, and a 390px mobile viewport. Containment and keyboard-accessible controls were checked. Appearance and viewport overrides were restored.
- The full app has pre-existing explicit TypeScript issues outside this change. The focused API typecheck passes. The package typecheck command is not evidence of a full app check.

## Delivery and remaining boundaries

Production deployment `dpl_2CTggmZEvgjaxVx8vPnsfjZc9Bk8` is READY with the seiler.page and isaacseiler.xyz aliases. Its source manifest SHA-256 is `0b6eb0ff2e28c44f937011e18147b99fa702b157aa79dc93d28cdbc1fa5e2ef5`. It uses the inspected working-tree source snapshot, not a new Git commit or push. The local preview stays available at http://127.0.0.1:8080. Existing unrelated edits were preserved. Release metadata records the source manifest and content version.

The main remaining issue is Mistral service availability for the deployed key. Durable distributed spending limits, broader usability sessions, and measured performance remain separate follow-up work. Process-local caches and quotas are bounded safeguards, not an organization-wide budget control.

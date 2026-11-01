# Portfolio audit fixes — October 31, 2026

This earlier pass is extended by the [cohesive audit and candidate verification](../cohesive-2026-10-31/README.md).

Implemented the seven priorities from the paused October 27 action plan in the Desktop checkout. This is a local implementation and verification record. The original production audit remains preserved with its original observations.

| Priority | Implementation |
| --- | --- |
| Exact evidence selection | Named products, the 100 Day Report, educator influence, lessons and research themes select the relevant published section. Provider reconciliation enforces the same section and focus. |
| Career relevance | Strengths questions receive a grounded synthesis across the government benchmark, Taiwan program and congressional communications work. Public service selects the House role and limits the role explorer to relevant service experience. Sources include the projects supporting the synthesis. |
| Conversational references | “Show me the second one” resolves against current composition order, including reordered comparisons. “Tell me more” opens process detail and expands reading while retaining the subject and manually selected section. |
| Findings, lessons and accomplishments | Lessons open the published reflections. Congressional accomplishments show the report’s existing team service totals and attribution. Journalism questions show documented research themes and explicitly distinguish those from detailed thesis conclusions, which are not in the supplied project summary. |
| Mobile hierarchy | Project imagery yields space to the answer and tabs on narrow screens. Selected passage and role detail precede their navigation. Comparison titles no longer occupy a separate repeated row on mobile. |
| Comparison synthesis | Authored explanations distinguish responsibilities, methods and outputs for policy/Taiwan, Congress/Boehringer and OpenAI/journalism; controls retain detailed evidence underneath. Other pairs receive a grounded role distinction. |
| Footer | Production Sources contains citations. Provider diagnostics and the redundant composition editor are development-only. Share and project controls remain available. |

The content version is now `canvas-2026-10-31-v8`, so stale compositions cannot overwrite the revised content contract. No provider keys were added or restored.

## Verification

- 138 tests passed across the required five focused suites plus intent API, portfolio quality, portable views, MCP, browser tools and shared-view integration.
- All 22 existing local API evaluation cases passed. Zero live Jev or Mistral responses were involved.
- `npm run build`, `npm run typecheck`, focused ESLint and `git diff --check` passed. Build retains its existing large-bundle warning.
- 86 real Chromium browser checks passed: light/dark, 1440/390/320px, idle state, eleven natural-language answer cases, second-project and more follow-ups, photo requests without provider calls, album navigation and Photo Map route. Checked document overflow and controls outside the panel, allowing intentionally clipped scroll navigation. Isolated browser contexts preserved the owner's appearance preference.
- Reviewed desktop comparison, narrow comparison and Taiwan screenshots in both themes. Existing Satoshi, theme spacing/type tokens and 7px corners are retained; no new theme or component runtime was added.
- Built production page restored a shared Taiwan lessons view, retained source links and omitted development diagnostics and Adjust view.
- Generated feed change was timestamp-only and was reverted; sitemap files were unchanged.

Reproduce browser checks with `node scripts/verify-portfolio-fixes.mjs` while the local dev server is running. The script expects unconfigured local providers and can use `PLAYWRIGHT_EXECUTABLE_PATH` when an existing Chromium binary is preferred. Browser observations are in `browser-results.json`; screenshots are beside this file.

## Release boundary

Preview: http://127.0.0.1:8080/ . Production build preview: http://127.0.0.1:4173/ . No push or deployment was performed. Both local provider configuration endpoints reported `configured: false`. Live provider behavior, provider-log correlation and the remaining October 27 production audit cases require a deployed version containing these changes; this report does not claim those checks are complete.

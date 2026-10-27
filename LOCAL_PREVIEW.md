# Adaptive portfolio local preview

Run `npm install` then `npm run dev -- --host 127.0.0.1 --port 8080`.

- `/`: adaptive canvas and permanent photographic gallery.
- `/classic`: previous homepage for comparison and rollback.
- `/about`, `/work`, `/photos`, and all existing project routes remain available.
- `/projects/adaptive-portfolio`: implementation notes and outstanding release gates.
- `/agents`: public interface guide.
- `/api/public/profile`, `/api/public/content`, `/api/public/search?q=Taiwan`, `/api/public/content/{id}`.
- `/api/public/albums`, `/api/public/albums/{folder}`.
- `/about.md`, `/work.md`, `/projects/{id}.md`, `/photos/{folder}.md`; the same local routes also negotiate `Accept: text/markdown`.
- `/mcp`: stateless SDK-backed read-only MCP endpoint.

## Optional live decisions

The owner keeps `TYPESAFE_API_KEY` and `MISTRAL_API_KEY` in Vercel. They are not available to this local preview. OpenAI and Typesafe keys were explicitly removed from `.env.local`; do not restore them without instruction.

Jev selects a known layout and content. Explicit submission can invoke Mistral when composition is useful. Local controls update immediately without a model. The homepage composer uses `mistral-small-2603` by default and has no OpenAI fallback. Local mode uses authored results. Production Jev routing has been verified; Mistral composition currently returns HTTP 429. Provider configuration alone is not a health check.

## Design and agent guide

Read `AGENTS.md` and `GUI.md`. The AI window uses the supplied theme tokens, Satoshi, and Lucide outlines. There are 16 live portfolio layouts; development-only `/?layouts` provides a review selector. All results expand beneath a vertically anchored composer. Typing edits the draft; Enter or a suggestion commits it. Greetings offer three starting points, and unknown requests do not inherit a benchmark. Opening a project from the work explorer supports Back. Photography is excluded from live AI; photo requests do not trigger a model call or a photography notice. Sources and evidence are secondary disclosures.

## Checks

The response compositions now lead with the requested contribution, process, outcome, or evidence. Published editorial records live in `src/lib/portfolioEvidence.ts`; `src/lib/portfolioIntent.ts` supplies one interpretation shared by local results and server routing. Comparisons use aligned questions and a distinct mobile arrangement. Project, role, search, comparison-focus, and benchmark selections are serialized in the composition. The ordinary visitor interface does not expose the development layout selector.

Run `npm run eval:portfolio` against the local server for the 22 visitor-question cases. To verify a deployment, use `PORTFOLIO_EVAL_URL=https://<deployment> PORTFOLIO_REQUIRE_LIVE=1 PORTFOLIO_EVAL_COMPOSE=1 npm run eval:portfolio`. This requires actual Jev responses and tests one actual Mistral composition by default; set PORTFOLIO_EVAL_COMPOSE_LIMIT=6 to test six. Requests are spaced by PORTFOLIO_EVAL_INTERVAL_MS (1100 by default). It does not count fallback responses as live model success.

The intent/composition endpoints log hashed question IDs, provider, accepted layout, duration, and sanitized failure categories. Their GET responses distinguish configuration from the last observed health result in that process. These observations are not a global uptime check or a distributed quota.

`npm run typecheck`

`npm run test -- src/test/canvas.test.ts`

The new tests exercise stale revision/content rejection, committed history, pins, reset, clear, and supported local layouts. The preview endpoints have also been exercised over HTTP, including all five MCP tool calls and HTML/Markdown Accept preference ordering.

## Preview boundaries

Vite development middleware supplies public representations and MCP locally. Production routing has been deployed and exercised. Static/server HTML migration, edge cache validation, durable distributed abuse/spend controls, provider comparison, responsive-image derivatives, recorded performance, uncoached usability sessions, and compatibility in two named MCP clients remain follow-up work. In-memory per-process limits are development safeguards, not a distributed spending cap. The preview command itself does not deploy. The response-system rebuild was separately published with owner authorization; see docs/ui-review/response-system-audit.md.

The original 16 album records and project source copy remain authoritative. Individual photo dates/GPS/scene tags are not inferred. Public content version identifies this preview; it is not a fabricated historical review date.

Photo navigation now lives in the two-column homepage gallery and `/photos/map`. Legacy `/photos?album=...` URLs redirect to `/?album=...`. British Columbia has four verified uploads and an album-level pin near Whistler; Washington State matches the bucket’s eleven current images. Both appear under North America. A Mapbox public token is required to render the globe locally.

# Isaac Seiler Portfolio

Personal portfolio for [Isaac Seiler](https://seiler.page), built to present work across AI, public technology, communications, journalism, research, and Fulbright projects.

![Isaac Seiler portfolio preview](public/webpreview-linkedin.png)

## What This Site Includes

- An interactive Explore window that selects authored views around a visitor's question, alongside the permanent photography gallery.
- Project case studies covering AI governance, local journalism, public-sector research, communications strategy, and reporting.
- Source-bound contributions, processes, outcomes, comparisons, and government benchmark views; shareable state and read-only MCP tools.
- A separate legacy page-aware chat assistant on `/classic`.
- Photo and map routes for visual work and location-based storytelling.
- SEO assets, sitemap files, Open Graph previews, `llms.txt`, and structured metadata.

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS and shadcn/ui primitives
- Framer Motion for interaction and page transitions
- Vercel Serverless Functions for API routes
- Mistral structured composition with optional Typesafe/Jev advice; OpenAI powers the separate legacy chat
- Mapbox GL for map experiences
- Supabase for optional shared Fulbright map persistence
- Vitest and Testing Library for focused tests

## Local Development

Install dependencies:

```bash
npm install
```

The core site and authored Explore views run without keys. Optional integrations are documented in `.env.example`; never replace an existing local environment file or restore keys removed by the owner. Production provider keys are kept in Vercel.

For a fresh checkout only, create an optional local environment file:

```bash
cp .env.example .env.local
```

Start the dev server:

```bash
npm run dev
```

Then open the local Vite URL printed in your terminal.

## Environment Variables

All provider credentials belong on the server, never in VITE-prefixed variables.

### Homepage Explore

```bash
MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-small-2603
TYPESAFE_API_KEY=
JEV_MODEL=jev-latest
COMPOSE_DAILY_CALL_LIMIT=250
INTENT_DAILY_CALL_LIMIT=1000
MCP_ENABLED=true
```

Typing, autocomplete, and manual controls remain local. Submitting a question produces an immediate authored preview. When configured, Mistral selects known layouts, public projects, section indices, and paragraph references; React renders the published evidence. Optional Jev advice is time-bounded and cannot block composition indefinitely. Jev also provides a routing fallback when Mistral is not configured. There is no OpenAI fallback for homepage composition.

All six published case studies and their 32 sections are available, including late passages, statistics, quotes, and source-only materials. Linked external documents are accessible as sources; their contents are not newly fetched or indexed. Photography and general-purpose classroom utilities are outside Explore.

Key files:

- `src/lib/siteContent.ts` and `portfolioEvidence.ts`: published content and reviewed editorial lenses.
- `src/lib/portfolioIntent.ts`, `portfolioRetrieval.ts`, and `genui.ts`: authored routing, passage selection, and validation.
- `server/composition-evidence.ts` and `composition-schema.ts`: complete provider context and constrained generation schema.
- `api/intent.ts` and `api/compose.ts`: routing, bounded provider work, and validated streamed compositions.
- `src/lib/portfolioView.ts`: portable view contract, sharing, and deterministic actions.

Manual edits cancel pending responses. Revision and content-version guards prevent stale responses from replacing them. Process-local caches and quotas are development safeguards, not distributed spending limits. API GET responses report configuration and process-local observations; they do not prove live provider health.

### Legacy Chat Assistant

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_CHAT_MODEL=gpt-5.6-sol
OPENAI_REASONING_EFFORT=high
OPENAI_VERIFIER_MODEL=gpt-5.6-luna
OPENAI_VERIFIER_EFFORT=low
OPENAI_ASSISTANT_VERIFY=true
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_EMBEDDING_DIMENSIONS=1024
```

These settings are optional because the API has the same defaults. `OPENAI_API` remains supported as a legacy key alias. Without a valid key, the assistant returns a deterministic answer from local evidence rather than failing.

The assistant uses Vercel Serverless Functions in `api/chat.ts`, builds evidence from the live case-study records, reads additional public grounding files from `knowledge/`, and receives structured context from the current rendered page. Useful local test prompts:

- `Who is Isaac?`
- `What is Isaac's AI work?`
- `How can I contact Isaac?`
- `Tell me about the Fulbright educator lab.`

### Strike Tracker

```bash
STRIKE_TRACKER_ACCESS_CODE=replace-this
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The Strike Tracker uses `api/strike-tracker.ts` for shared reads and writes. The page falls back to device-local counts when server storage is unavailable.

Assistant feedback can use the same Supabase project. Run `supabase/assistant_feedback.sql`, set `SUPABASE_SERVICE_ROLE_KEY`, and leave `ASSISTANT_STORE_CONTENT=false` to store hashes and operational metadata without raw questions or answers.

## Scripts

```bash
npm run dev       # Start local development
npm run build     # Build production assets and generated project previews
npm run check     # Run lint, typecheck, unit tests, build, and browser smoke tests
npm run preview   # Preview the production build
npm run typecheck # Run TypeScript without emitting files
npm run test:e2e  # Run Playwright smoke tests against the production preview
npm run test      # Run Vitest tests
npm run lint      # Run ESLint
npm run eval:assistant # Run the live 63-case assistant evaluation against ASSISTANT_EVAL_URL
npm run eval:portfolio # Offline authored routing evaluation; no model calls
npm run eval:portfolio -- --corpus=sections # Evaluate passage coverage across all public sections
```

## Deployment

The site is configured for Vercel and canonical domain `seiler.page`. Production deployments should include the relevant server-side variables above. Push and publish only when the owner requests them.

After deploying, verify:

- The homepage loads quickly on mobile and desktop.
- Project pages render their case-study content and preview assets.
- Explore reaches each published project and its contribution, process, outcomes, and source materials, rather than only the most common projects.
- Follow-ups preserve controls; manual edits survive delayed responses; shared views restore without generation.
- The chat summarizes the current page, cites the right case-study sources, and redirects private or sensitive questions.
- Mobile chat remains stable while the on-screen keyboard opens, resizes, and closes.
- `ASSISTANT_EVAL_URL=https://your-domain/api/chat npm run eval:assistant` passes its intent and evidence thresholds.

`npm run eval:portfolio -- --help` documents explicitly opted-in live evaluation and request budgets. Local authored tests and mocked provider contracts do not establish deployed model quality. See [the backend research and verification record](docs/audits/genui-backend-2026-11-02.md) for architecture decisions and limits.

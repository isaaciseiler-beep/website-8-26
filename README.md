# Isaac Seiler Portfolio

Personal portfolio for [Isaac Seiler](https://isaacseiler.xyz), built to present work across AI, public technology, communications, journalism, research, and Fulbright projects.

![Isaac Seiler portfolio preview](public/webpreview-linkedin.png)

## What This Site Includes

- A fast React portfolio homepage with animated sections and responsive navigation.
- Project case studies covering AI governance, local journalism, public-sector research, communications strategy, and reporting.
- A page-aware AI assistant with hybrid retrieval, visible sources, grounding verification, and privacy-safe feedback.
- Photo and map routes for visual work and location-based storytelling.
- SEO assets, sitemap files, Open Graph previews, `llms.txt`, and structured metadata.

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS and shadcn/ui primitives
- Framer Motion for interaction and page transitions
- Vercel Serverless Functions for API routes
- OpenAI API for the site assistant
- Mapbox GL for map experiences
- Supabase for optional shared Fulbright map persistence
- Vitest and Testing Library for focused tests

## Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start the dev server:

```bash
npm run dev
```

Then open the local Vite URL printed in your terminal.

## Environment Variables

The core portfolio runs without API keys. The AI assistant and map routes need optional environment variables.

### AI Assistant

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
```

## Deployment

The site is designed for Vercel. Production deployments should include the same environment variables listed above when AI assistant or shared map behavior is enabled.

After deploying, verify:

- The homepage loads quickly on mobile and desktop.
- Project pages render their case-study content and preview assets.
- The chat summarizes the current page, cites the right case-study sources, and redirects private or sensitive questions.
- Mobile chat remains stable while the on-screen keyboard opens, resizes, and closes.
- `ASSISTANT_EVAL_URL=https://your-domain/api/chat npm run eval:assistant` passes its intent and evidence thresholds.

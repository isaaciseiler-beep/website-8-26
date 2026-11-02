# Portfolio evaluations

`npm run eval:portfolio` evaluates the actual local authored planner with the existing routing corpus. It makes **zero network or model requests**, loads no environment files, and starts no HTTP/HMR server.

To evaluate the 32 published sections across all six public projects:

```sh
npm run eval:portfolio -- --corpus=sections
```

The shared, topic-rich corpus is `portfolio-section-cases.mjs`. The API contract tests use this same corpus with mocked correct provider selections to check that section and paragraph references survive reconciliation. Neither the offline planner nor mocked contracts establish real model quality.

## After reviewing and deploying the changes

One-case deployment smoke evaluation requires two explicit opt-ins and the target origin:

```sh
PORTFOLIO_EVAL_MODE=live \
PORTFOLIO_EVAL_ALLOW_MODEL_CALLS=1 \
PORTFOLIO_EVAL_URL=https://seiler.page \
npm run eval:portfolio -- --corpus=sections
```

This defaults to one case, at most two model-capable endpoint POSTs, no retries, and six seconds between cases. An endpoint POST is not the same as an upstream provider call: `/api/intent` may call Jev, while `/api/compose` can call both Mistral and optional Jev advice. The script does not read local provider keys.

Run the complete section corpus deliberately by setting the limit:

```sh
PORTFOLIO_EVAL_MODE=live \
PORTFOLIO_EVAL_ALLOW_MODEL_CALLS=1 \
PORTFOLIO_EVAL_URL=https://seiler.page \
PORTFOLIO_EVAL_LIMIT=32 \
PORTFOLIO_EVAL_OUTPUT=/private/tmp/portfolio-deployment-sections.json \
npm run eval:portfolio -- --corpus=sections
```

The script reads the deployment's public content version first and stops before any POST if it differs from the checkout. Configuration GETs are read-only checks and never count as provider health or execution evidence. `PORTFOLIO_EVAL_LIMIT=0` makes no deployment requests at all. Invalid limits fail closed instead of falling back to an unlimited run.

`PORTFOLIO_EVAL_MAX_POST_REQUESTS` can impose a lower total endpoint budget, and `PORTFOLIO_EVAL_COMPOSE_LIMIT` can reduce composition requests separately. `PORTFOLIO_REQUIRE_LIVE=1` rejects cached/authored outcomes as fresh execution; for section cases, routing-only Jev execution cannot satisfy a fresh composition requirement. It still requires the model-call opt-in.

## Reading the report

- `passed`/`sectionMatches` evaluate the project and section contract. Routing cases also check their specified focus, state, role, or guidance.
- `paragraphAnyMatches` records whether an excerpt contains any editorial paragraph target. `paragraphFullMatches` records all targets, while `strictMatches` combines the exact target checks. These are separate from the main pass count because the target list does not exhaust every semantically useful excerpt.
- `coverage` lists every project's expected, evaluated, and matched sections and paragraph references. Even a one-case smoke report shows the remaining unevaluated corpus.
- `providerReportedSections` and `providerReportedParagraphs` require a fresh composer result reported by the endpoint. Authored results, caches, routing-only choices, and mocked transports do not satisfy these fields.
- `provenance` distinguishes `local_authored`, `api_authored`, `configuration_only`, `router_provider_reported`, `router_cache`, `provider_reported`, `provider_cache`, `mocked_transport`, `unverified_response`, and unavailable/not-evaluated results. These are endpoint-supported claims, not independent proof of a provider's internal execution.
- Each evaluated row records supported/unsupported/unavailable status, selected IDs and references, routing/composition timing, and safe error categories. Stale revision/content-version events and invalid compositions cannot pass.

The report contains only the fixed evaluation corpus and controlled result metadata, not arbitrary visitor questions, provider credentials, or raw upstream error bodies. JSON is written to stdout and optionally to `PORTFOLIO_EVAL_OUTPUT`. Use `node scripts/evaluate-portfolio.mjs --help` for all options.

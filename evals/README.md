# Portfolio evaluations

`npm run eval:portfolio` evaluates the actual local authored planner with the existing routing corpus. It makes **zero network or model requests**, loads no environment files, and starts no HTTP/HMR server.

To evaluate the 32 published sections across all six public projects:

```sh
npm run eval:portfolio -- --corpus=sections
```

The shared, topic-rich corpus is `portfolio-section-cases.mjs`. The API contract tests use this same corpus with mocked correct provider selections to check that section and paragraph references survive reconciliation. Neither the offline planner nor mocked contracts establish real model quality.

`npm run eval:portfolio -- --corpus=smoke` runs eight fresh main-interface questions across all six projects, including two follow-ups. A case's `follows` field references an earlier case ID; its valid final composition becomes the current view in routing, composition and offline planning. Failed or stale cases cannot supply context. Missing context skips the follow-up instead of testing an unrelated initial state.

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
- `paragraphTargetCases` is the denominator for excerpt targets. `selectedModules` retains every returned module, including wrong subjects, while `selected` is the first module matching the requested subject and kind. Review all modules for relevance; a correct first module can coexist with an irrelevant second one.
- `coverage` lists every project's expected, evaluated, and matched sections and paragraph references. Even a one-case smoke report shows the remaining unevaluated corpus.
- `providerReportedSections` and `providerReportedParagraphs` require a fresh composer result reported by the endpoint. Authored results, caches, routing-only choices, and mocked transports do not satisfy these fields.
- `provenance` distinguishes `local_authored`, `api_authored`, `configuration_only`, `router_provider_reported`, `router_cache`, `provider_reported`, `provider_cache`, `mocked_transport`, `unverified_response`, and unavailable/not-evaluated results. These are endpoint-supported claims, not independent proof of a provider's internal execution.
- Each evaluated row records supported/unsupported/unavailable status, selected IDs and references, routing/composition timing, and safe error categories. Stale revision/content-version events and invalid compositions cannot pass.

The report contains only the fixed evaluation corpus and controlled result metadata, not arbitrary visitor questions, provider credentials, or raw upstream error bodies. JSON is written to stdout and optionally to `PORTFOLIO_EVAL_OUTPUT`. Use `node scripts/evaluate-portfolio.mjs --help` for all options.

## Visible-answer release gate

```sh
node scripts/evaluate-portfolio.mjs --corpus=release
```

The release corpus contains 21 fixed editorial questions, including a five-step product-to-source-to-new-product-to-source-to-new-project journey. It renders the actual portfolio components and checks independently named answer aspects against structural visible text. Button labels, unopened disclosure content and hidden regions cannot satisfy a required aspect. `qualityComplete` is separate from valid project/section IDs; the release gate fails when an answer omits a required aspect even if routing passes. Literal targets are reproducible regression checks, not proof of truth or a substitute for human relevance/readability review. After development use, this corpus is a regression set; create fresh unseen holdouts for the next independent assessment.

Stable answer-plan references count toward section/paragraph coverage only after the runtime resolves them against the current public registry. Reports retain `selectedEvidence` alongside the actual module's selected section. This prevents a correct multi-section plan from being penalized merely because the navigation starts on one section, while the visible-answer gate still checks what the reader actually sees.

`PORTFOLIO_EVAL_GATE=1` applies full-corpus/no-failure checks to other corpora. For release, gating is automatic. `PORTFOLIO_EVAL_BASELINE=/path/to/prior.json` additionally fails on regressions against matching case IDs; `PORTFOLIO_EVAL_MAX_P95_MS=5000` adds an optional total-request p95 budget. Invalid gate options and incompatible baseline corpora stop before any live calls. Fresh-provider provenance can be required with the existing explicit live options; local/cache/mock success never becomes live execution.

## Content inventory, impact and source health

```sh
node scripts/audit-portfolio-content.mjs --output=/private/tmp/content.json
node scripts/audit-portfolio-content.mjs --baseline=/path/to/prior-content.json --output=/private/tmp/impact.json
node scripts/audit-portfolio-content.mjs --check-links --link-limit=20 --output=/private/tmp/source-health.json
```

The default inventory makes zero network/model requests and reports all public projects, sections, stable evidence references, questions, source artifacts, and editorial coverage gaps. A baseline identifies changed evidence and affected project cases without inventing missing material. Source HEAD requests require `--check-links`, default to at most 20 URLs, run two at a time with five-second deadlines, and bound redirects. Refused HEAD, authentication, rate limits, DNS/network errors, and timeouts are unverified rather than automatically broken. Redirect destinations receive the same public HTTP URL check. No documents are downloaded and no local credentials are sent. HTTP status alone does not establish that a source is the right supporting artifact; human review remains necessary.

### Subject relevance contract

Every case with `projectId`/`project` implicitly requires that single project and permits only its requested module kind (story by default). Comparison `projects` requires exactly those named projects, with the existing ordered comparison check retained. Unrelated extra projects or module kinds fail `ok` and the release gate even when the requested first module and all visible answer aspects are correct. `selectedModules` always retains every actual module; `extraneousProjectIds`, `missingProjectIds`, `extraneousModules`, and `subjectMatch` expose relevance separately from section correctness. Summary reports count subject contracts and extraneous-subject cases.

For an intentionally mixed answer, use `expectedProjectIds` to require every intended project, `allowedProjectIds` to allow additional reviewed context subjects, and `allowedModuleKinds` for deliberately mixed output formats. A generic career/benchmark case without project IDs has no inferred project restriction; it can opt into an explicit empty or nonempty set. These are editorial corpus contracts, not production question-string rules. Release gates independently reject reported extraneous/missing subjects, so aggregate pass counters cannot hide them.

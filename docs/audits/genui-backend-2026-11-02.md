# Portfolio GenUI backend review — November 2, 2026

## Recommendation

Keep the existing authored-view architecture: the model selects public evidence IDs, section indices, and controlled layouts; React owns rendering and interaction. This is a good fit for a portfolio whose claims must remain attributable and whose controls must survive follow-up requests. A broader agent framework or vector database would add failure paths without solving the current coverage problem.

This recommendation is an engineering judgment based on this repository and the primary sources below. It is not a live model-quality measurement.

## What caused uneven coverage

All six public projects were already listed, but their provider context was uneven:

- Composition omitted each project's summary and kept only the first 650 characters of each section's paragraphs and bullets. Later methods and outcomes disappeared. Stats, pull quotes, media titles/captions, and published-source labels were omitted altogether.
- Source-only sections were present as empty evidence, including final products and program materials.
- Optional Jev passage advice described every section using its heading plus the same project-level contribution. It could not distinguish later details from the introductory passage.
- The fallback project's choice descriptions contained only the project title and role, losing useful topics such as newsletters and individual product experiments.

The public corpus has 32 sections, with approximately 17,500 characters of paragraph/bullet text. Supplying its complete text is practical here; retrieving only the top one or two projects would create avoidable coverage gaps. Hidden project records and gallery content remain excluded.

## Changes implemented

`server/composition-evidence.ts` derives one complete provider catalog from `publicProjects`, retaining project summaries, years, leads, every section, full paragraphs and bullets, statistics, pull quotes, source labels, and authored project-media titles, captions, and alternative text. URLs and image paths remain renderer-owned; the separate gallery/album data is excluded. Both providers share this evidence boundary.

Mistral receives the complete catalog. Paragraphs have explicit zero-based indices and section-level counts, allowing the provider to select the particular paragraphs that should be visible. Jev retains every public section candidate, with a compact excerpt selected from verbatim sentences anywhere in the section according to the visitor's terms. This is a lightweight advisory hint; it neither filters out projects nor replaces Mistral's evidence.

`server/composition-schema.ts` narrows the shared renderer schema with enums for public project IDs, government names, and career IDs. Runtime reconciliation remains responsible for subject matching, kind-specific constraints, and preserving user controls. Selection uses temperature zero and explicit instructions that source ordering is not a relevance ranking.

The composition endpoint now aborts an attempt reported as failed by the SDK's `onError`, even when a transport subsequently supplies an object or never closes. Failed attempts cannot become healthy cache entries. Failure classification recognizes structured-output failures and bounded nested causes, including wrapped rate limits, authentication errors, and timeouts. Visitors receive coarse categories rather than raw provider messages.

`server/provider-response.ts` adds byte-bounded upstream JSON reads and cancellation-aware waits. Jev routing stops after five seconds even if an adapter ignores its abort signal; advice remains optional with its shorter existing deadline. Composition has an 18-second deadline covering advice, chunk iteration, final structured output, and usage settlement. Response-close cancellation stops work promptly and cannot update routing cache or provider health. JSON responses are limited to 64 KB while reading, before parsing, and request bodies retain their 16 KB byte cap.

Provider diagnostics now include bounded, validated public project IDs, section indices, and authored layouts, with cached outcomes explicitly marked. Coverage fields are checked again at the final logging boundary, so unknown/hidden IDs and invalid indices cannot be logged even if a future caller bypasses the composition helper. Source text, search text, URLs, and raw visitor questions are excluded. Cache replay does not pretend to be a new provider health check.

Evaluation tooling defaults to offline authored execution with zero network/model requests. Deployment evaluation requires explicit live mode and a separate model-call opt-in, defaults to one case, validates deployed content compatibility before any model-capable POST, and records project/section/paragraph coverage, support status, safe errors, and timing. Caches, routing-only providers, local authored results, mocked transports, unverified metadata, and fresh endpoint-reported composer results remain separate. See `evals/README.md` for reviewed post-deployment commands and endpoint-call budgets.

## Primary-source findings

1. **Constrain generation to an application-owned catalog.** A2UI recommends custom catalogs to restrict agents to the components and visual language supported by an application, separating structure from content. The existing fixed layout IDs and source-bound renderer already follow this principle; this change strengthens the data-ID side of that contract. [A2UI components and catalogs](https://a2ui.org/concepts/components/)

2. **Use provider-native structured output, then validate meaning.** Mistral supports JSON Schema-based custom outputs and recommends explicit behavioral instructions. AI SDK accepts Zod schemas and validates final structured objects. The new provider schema derives from the existing live renderer schema rather than creating a second independent contract. [Mistral custom structured outputs](https://docs.mistral.ai/studio/conversations/structured-output/custom), [AI SDK structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)

3. **Treat partial JSON as provisional.** AI SDK warns that partial objects may not satisfy a full schema. The endpoint continues publishing only completed modules that pass runtime reconciliation, and marks them partial until the final result. There is no speculative HTML or arbitrary executable UI. [AI SDK structured streaming](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)

4. **Ground using identifiable passages.** Mistral's references documentation describes supplying source snippets with stable identifiers for attributable answers. This portfolio can go further: facts and links are loaded directly from the selected published source record, so the model need not generate either. Complete passage coverage is therefore more useful than another prose-generation stage. [Mistral citations and references](https://docs.mistral.ai/studio/conversations/citations)

5. **Handle stream errors and cancellation separately.** AI SDK documents streaming error events and abort handling; stream failures cannot be assumed to appear only as thrown exceptions. This change adds the missing failed-attempt guard. Existing visitor cancellation, no-retry policy, 18-second generation timeout, bounded caches, and process-local quotas remain. Those quotas are development safeguards, not distributed spending controls. [AI SDK error handling](https://ai-sdk.dev/docs/ai-sdk-core/error-handling)

## Verification and limits

Focused backend verification passed: 160 tests across composition evidence, provider schema, cache/failure policy, composition API, all-section coverage contracts, bounded provider responses, Jev advice, intent API, evaluator provenance/spending controls, and safe telemetry. These include every public project, every published paragraph/bullet, late-section text, source-only sections, exact paragraph references, unknown IDs, private-content exclusions, cancellation, stalled transports, upstream and request byte limits, unsupported requests, and failed-stream cache prevention. Targeted ESLint and Node ESM import checks passed.

The all-section corpus includes one authored, topic-rich paraphrase per public section. Its mocked correct provider selections initially exposed five runtime reconciliation defects where a focus lens or local heuristic replaced the selected passage. The corresponding shared-routing fixes now retain all 32 section selections and supplied paragraph indices. The canonical corpus is `evals/portfolio-section-cases.mjs`, re-exported by `src/test/fixtures/portfolioSectionQuestions.ts`; it is evaluation data rather than a production alias list.

Offline execution passes 22/22 routing cases and 32/32 project/section cases. Of the section cases, 24 select at least one editorial paragraph target and 12 select all targets. These excerpt metrics are intentionally separate from section correctness: the editorial list is not an exhaustive semantic gold standard. An additional exploratory check across all 32 current sections and 15 follow-up forms found no invalid compositions or out-of-range paragraph references.

No local provider keys were available; no live Mistral/Jev calls or deployed changes were made. Mocked tests establish catalog and contract behavior, not real model selection quality or immunity to semantic prompt injection. The catalog includes authored case-study evidence and labels for linked sources; the contents of external PDFs, spreadsheets, or Google Docs were not fetched or newly indexed.

A follow-up deployed evaluation should ask at least one contribution, process, outcomes, and sources question per public project, recording selected IDs/sections, support status, latency, and errors without raw visitor text. Include paraphrases, follow-up controls, and two-project comparisons. Compare coverage per project, rather than accepting a high aggregate score that could hide one neglected project.

The review also exposed that the original root type-check command did not traverse its referenced projects. The integrated changes corrected that command and resolved the existing declaration/library/test typing issues. `npm run typecheck` now traverses and passes both app and Node projects.

## Remaining work, in priority order

1. Run the supplied opt-in corpus evaluation against the configured deployment at seiler.page after reviewing and deploying these local changes. A passing local preview or mocked provider selection does not establish actual Mistral selection, latency, or availability. The tooling now scores section and paragraph references and rejects stale deployment content before model requests.
2. Repeat the completed local browser checks on the deployment, particularly follow-up refinements, compound subjects, and evidence selected outside an authored process/outcomes grouping. See `genui-2026-11-02.md` for the local interaction and viewport record.
3. Before a higher-traffic launch, decide whether distributed quotas and per-provider spend controls are needed. Existing process-local counters reset per instance and are intentionally not advertised as global limits. This review added no new service or dependency.

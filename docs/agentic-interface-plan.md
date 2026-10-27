# Agentic portfolio implementation plan

Build a shared, validated interaction system for the portfolio website, browser agents, and an MCP App. Isaac owns the content and upcoming project selection. This work adds technical capabilities using existing published material and preserves the quiet homepage, original photography, and current design system.

## Delivery sequence

1. **Shared actions and state.** Introduce a portable view format and pure action reducer. Validate known projects, layouts, controls, content versions, and revision guards. Support opening a project, comparisons, targeted control changes, bounded multi-module composition, and undo/redo. Manual actions cancel pending model responses.
2. **Shareable views.** Restore a validated view from a URL without a model call. Share the committed composition and its controls, excluding draft input and provider internals. Reject malformed, unsupported, and stale links with a useful message. Retain native browser history and album links.
3. **Portable MCP App.** Extend the existing read-only MCP endpoint with a portfolio catalog, view composition/action tools, and a bundled interactive UI resource. Reuse the website renderer and action system, honor host theme, and support continuing the same view on the website. Keep existing public tools compatible.
4. **Browser agent support.** Register feature-detected WebMCP tools for inspecting the current view and applying validated actions. Expose the same public catalog. Report the resulting state after the UI updates. Lifecycle cleanup prevents duplicate tools. Unsupported browsers keep normal behavior.
5. **Composition and project extension.** Allow agents to assemble up to three existing approved modules and apply focused changes without regenerating unaffected modules. Provide visible, discreet history/share controls only during exploration. Document the integration contract for future project modules and demos; do not fabricate projects or invent demo destinations.

## Architecture

Public content and module catalog → validated view/action contract → website renderer, MCP App renderer, and WebMCP tools. The MCP server creates portable state; browser tools act on the current page. Both use the same reference validation. All shared data comes from public records. Existing Jev/Mistral routing remains server-side and retains its request cancellation and content-version checks.

MCP resources use the official MCP Apps SDK with a bundled HTML resource and explicit content-security policy. The app includes no provider keys, arbitrary generated HTML, private integrations, or autonomous external writes. It can be inspected locally in a small host harness; real third-party client compatibility remains a separately recorded check.

## Verification and acceptance

- Unit tests: action atomicity, invalid IDs and mismatched layout kinds, stale revision/content rejection, reversible changes, URL bounds and Unicode, composition preservation, and WebMCP lifecycle.
- Integration tests: real HTTP MCP initialization, discovery, tool calls, resource loading, app bridge behavior, and meaningful error paths.
- Required repository checks: focused canvas/genui/Explore/compose tests and production build. Review generated feeds and sitemaps separately.
- Browser: idle homepage, comparison, Taiwan story, multiple modules, copy/restore links, undo/redo, photo navigation, narrow layouts, light/dark appearance, and actual browser-tool invocation if supported.
- Keep local preview available. No push or publication is included; repository instructions require a separate owner request for publication.

## Progress

- [x] Inspect current checkout and verify the existing local and public MCP server.
- [x] Shared action/state contract and tests.
- [x] Website integration, history, and shareable views.
- [x] MCP tools and portable interactive app.
- [x] WebMCP registration and verification.
- [x] Focused tests, production build, browser review, and implementation notes.

## Delivery evidence

99 tests passed across the required five suites and the new contract, browser-agent, MCP, website-integration and SEO suites. Production build and server import verification passed. The built app is 709.64 kB (193.74 kB gzip) and does not load its MCP SDK into the normal website. Targeted lint passes with no errors or warnings. The existing repository-wide TypeScript errors are recorded in the implementation notes.

Real browser checks confirmed shared-link restoration, preserved comparison controls when adding Taiwan, layout changes, Back/Forward, 390px layouts, both appearances, a working photo lightbox, browser-agent invocation and stale-revision rejection. The official SDK review host completed HTTP MCP → app render → manual context update → follow-up tool result without console errors in the final run. Mapbox rendering is unavailable locally without its token. No live-provider or third-party assistant-client result is claimed.

Generated sitemap and image sitemap were unchanged by the final build; the feed changed only its build timestamp. Separate concurrent gallery work was preserved.

See [integration notes](./agentic-interface.md) and the screenshots in [agentic-review](./agentic-review/). Both local previews remain available; deployment is outside this delivery.

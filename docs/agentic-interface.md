# Portfolio interfaces

Implemented locally on 27 October 2026. The public-content MCP server already existed; this work extends it with portable interactive views. No publication or push was performed. Isaac supplies and approves project content.

## Try it

- Website: `http://127.0.0.1:8080/`
- MCP endpoint: `http://127.0.0.1:8080/mcp` (Streamable HTTP, POST)
- MCP App review host: `http://127.0.0.1:8080/mcp-preview.html`
- Public integration guide: `/agents`, `/agents.md`, and `/llms.txt`

Try “Compare Michigan and California,” change the measure, then “Add the Taiwan project process.” Both modules remain editable in one expanding window. The collapsed **Adjust view** control changes layouts, adds a project, or reorders/removes modules. **Back**, **Forward**, and **Share** work on committed state.

The review host connects through real HTTP MCP and the official MCP Apps bridge. Its “Ask for outcomes” button uses the latest state received from the embedded app, calls the action tool, and returns the result to that app. It is a development fixture, excluded from the production Vite entrypoints. It does not emulate a particular third-party assistant.

## Shared contract

`src/lib/portfolioView.ts` owns the portable version-1 format, validation, action reducer, URL codec, public catalog, and bounded history. The view contains the existing content version and up to three authored modules. All facts remain in existing public records. No freeform model HTML is accepted.

Actions: `open_project`, `compare_projects`, `compose`, `update_module`, `move_module`, `remove_module`. Targeted updates leave other modules unchanged. A view must retain at least one module. Unknown IDs, incompatible layouts, photo/classroom modules, invalid controls, excessive module counts, and stale content versions are rejected.

Share links use `#view=` and contain committed controls only. They exclude the Explore draft, history, routing/provider metadata, and secrets. Restoration is local and requires no generation request. Invalid or outdated links show a quiet recovery message. URL fragments avoid sending the view to the HTTP server, but are ordinary shareable data, not encrypted private storage.

## MCP

The existing five public retrieval tools remain available. New tools:

| Tool | Result |
| --- | --- |
| `get_portfolio_catalog` | Exact project IDs, live layouts, roles and government names |
| `create_portfolio_view` | Validated state, website URL and interactive app metadata |
| `apply_portfolio_action` | New validated state, website URL and the encoded state it was based on |

Example arguments for `create_portfolio_view`:

```json
{"modules":[{"kind":"benchmark","layout":"benchmark-compare","states":["Michigan","California"],"metric":"preparednessScore"},{"kind":"story","projectIds":["fulbright-focus-group-sponsored-by-openai"],"focus":"process"}]}
```

Resources: `portfolio://catalog` and `ui://portfolio/explorer.html`. The app reuses `ExplorationCanvas`, follows host theme, reports manual state changes through `updateModelContext`, rejects stale tool results, and requests link opening through the host. Clients without MCP Apps still receive structured results and a link. Tools are stateless and read-only with respect to published content.

`npm run build:mcp` bundles the UI into `.mcp-build/mcp-app.html`; `npm run dev` and `npm run build` run it automatically. The server reads that artifact. The Vercel include glob packages it alongside the existing public knowledge files without overlapping function rules. Rebuild the app after changes to shared components before reviewing the embedded version. Client registration and the deployed function bundle must be checked on the eventual deployment.

Versions are pinned to MCP Apps SDK 1.1.2 and singlefile 2.0.3 for compatibility with this repository's MCP 1.x, Zod 3 and Vite 5 dependencies. Upgrading the protocol stack is a separate change. The resource CSP allows the site's public images and Satoshi font origins; the app makes no direct API requests or provider calls.

## Browser agents

`src/lib/portfolioWebMcp.ts` feature-detects the browser registry. The homepage registers four tools while mounted: catalog, view inspection, view change, history navigation. Browsers without support retain ordinary UI behavior. Changes require the current revision and content version; rejection returns the current state so an agent can retry deliberately. A successful call reports state after React has committed the change. Tools do not expose the unsubmitted Explore draft. Teardown unregisters tools and aborts their lifecycle signal.

WebMCP is an optional enhancement with evolving browser support, distinct from the remote MCP server. It was exercised directly in the Codex in-app browser.

## Adding Isaac's next projects

1. Add approved content, real dates and source links to `src/lib/siteContent.ts`.
2. Add concise role/contribution/outcome records and actual section mappings in `src/lib/portfolioEvidence.ts`.
3. Add project aliases in `src/lib/portfolioIntent.ts` and introductory questions in `src/lib/experiencePrompts.ts`.
4. Existing stories, comparisons, tools and share links then use the public project record. For a new interactive demo, add an authored component and bounded schema controls; register its layout and validate it before exposing it to agents.
5. Bump the content version when the meaning of saved IDs/controls changes. Never fabricate demo links or invent project outcomes to fill the UI.

## Verification record

Local tests cover action atomicity, references/layouts, Unicode links and version bounds, history, WebMCP lifecycle, website revision guards, draft exclusion, cancellation of delayed provider results, and real MCP SDK discovery/tool calls. Browser checks cover HTTP MCP → bundled app → manual context update → server follow-up; browser-agent actions and stale-revision rejection; comparison/Taiwan composition; share restoration; history; and light/dark layouts at desktop and 390px.

The new features were exercised with authored content. Local Jev/Mistral are unconfigured; this does not verify live generation or production behavior. Photo Map navigation reaches its route, but this local environment reports a missing Mapbox token. Repository-wide TypeScript checking still reports existing errors in App, SiteMetadata, SkullHome and older test files; the new files have no reported type errors. Publishing and third-party MCP-host compatibility remain unverified.

## Primary references

- [MCP Apps quickstart](https://apps.extensions.modelcontextprotocol.io/api/documents/Quickstart.html)
- [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps)
- [WebMCP browser documentation](https://developer.chrome.com/docs/ai/webmcp)
- [Vercel function file inclusion](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions)

The visual direction remains the site's Graphical theme, Satoshi typography, quiet original photography and human-authored evidence. New capabilities appear during exploration; the resting homepage gains no extra controls.

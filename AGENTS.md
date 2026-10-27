# Working on this portfolio

## Product direction

Keep the homepage quiet: the original header and sidebar, one centered Explore input, and a photographic gallery with small location labels revealed on hover or keyboard focus. On the initial frame, photography occupies no more than 30% of the viewport. Results stay inside one expanding AI window and use normal page scrolling. The gallery location ticker appears when photography occupies most of the viewport.

Interactive views are the main experience. Articles and external links belong in collapsed Sources or an explicitly requested reading view. Avoid automatic project lists, introductory marketing copy, repeated headings, repeated scores, nested cards, unnecessary controls, or persistent labels over photographs.

## Design

For UI work, follow GUI.md and the supplied graphical-ui, graphical-convert, and graphical-audit guides in docs/design/untitled-theme/skills/. The theme snapshot is preserved in docs/design/untitled-theme/GUI.md. Use its named tokens, the site's Satoshi font, and the user-approved Lucide outline icons.

Theme tokens are scoped to `.home-genui` in `src/components/canvas/ai-theme.css`; composition styles live in `home-explore.css`. Prefer spacing and typography over additional filled containers. Keep real keyboard focus visible, reduced-motion support, native labels, and accessible names on icon buttons. Keep the assistant focused on Isaac’s background, professional experience, project responsibilities, process, and published outcomes. Classroom utilities are excluded from live schemas, routing, suggestions, and provider output. Taiwan teaching requests open the actual project story.

Photography is excluded from live AI routing, schemas, suggestions, and local results. Keep the permanent homepage gallery and Photo Map functional. The gallery uses two columns in narrow panes and three when its available width is at least 960px. The sidebar links directly to Photo Map; /photos redirects to the homepage and preserves album query links. Photo requests in Explore should not trigger a model call or display a photography notice. Never add album data back to provider prompts.

## Visitor entry points

Homepage suggestions must make sense before a visitor knows the projects. Introduce a subject (AI in government, teaching in Taiwan, career, public service) before specific comparisons or technical controls. Keep the input purpose explicit and examples short. `/work` is a dedicated editorial index, linked directly from the sidebar: two images per row, alternating landscape/square and square/landscape. Hide the page heading and category tags; reveal title and year at the bottom left on hover or keyboard focus (visible on touch devices). Use existing content and known years; do not invent dates or reading times. Its images use `--site-corner-radius` and the site shell gutters, not the AI window radius.

## Implementation map

- `src/pages/PhotoHomePage.tsx`, `src/lib/photoAlbums.ts`, `src/lib/photoMap.ts`: homepage albums, North America filtering, and map placement.
- `src/pages/WorkPage.tsx`, `src/pages/work-page.css`: editorial Work index.
- `src/lib/layouts.ts`: the 16 live portfolio layout IDs, names, prompts, and kinds.
- `src/lib/genui.ts`: bounded schema, local composition, layout selection, reference validation.
- `src/lib/canvas.ts`: public project/album records, request revisions, content version, routing.
- `src/components/canvas/HomeExplore.tsx`: composer, request cancellation, history, streamed results.
- `ExplorationCanvas.tsx`, `BenchmarkExplorer.tsx`, `LayoutViews.tsx`: interactive views.
- `api/intent.ts`: Typesafe/Jev chooses content/layout and whether Mistral is useful.
- `api/compose.ts`: Mistral returns a validated composition, never executable UI code.
- `api/public-content.ts`, `api/mcp.ts`: public read-only representations and tools.

Models may choose known IDs and controls. They must not invent facts, scores, photo metadata, routes, or arbitrary HTML. Preserve current controls on follow-up requests. Manual edits cancel pending responses; stale revisions and mismatched content versions must never overwrite them. The government benchmark is an August 2025 snapshot, not current government activity. Never offer lesson planners, feedback generators, language practice, or other general-purpose teaching tools.

## Providers and secrets

The homepage uses server-side `TYPESAFE_API_KEY` and `MISTRAL_API_KEY`; optional `JEV_MODEL` and `MISTRAL_MODEL` select models. Current Mistral default: `mistral-small-2603`. No OpenAI fallback is used by the homepage composer. The separate legacy chat implementation is distinct.

The owner keeps provider keys in Vercel. OpenAI and Typesafe keys were explicitly removed from local `.env.local`; do not restore them without instruction. Never display secret values, put them in VITE-prefixed variables, commit them, or infer live service health from mere key presence. `/api/compose` GET reports configuration only.

Typing only edits the draft. Enter, the submit button, or a suggestion commits a request; Jev routes and Mistral may compose if needed. Greetings and unmatched requests offer starting points instead of inheriting a project. Keep the composer vertically anchored while results expand below it, preserve committed results while editing, and provide Back when opening a project from the work explorer. Local controls update without a model. Process-local caches and quotas are bounded development safeguards, not distributed spending limits. Local authored UI, mocked provider checks, live provider behavior, and deployed behavior are separate verification claims.

## Working and verifying

Use the Desktop checkout; inspect existing edits before changing files. Preserve unrelated work. Local preview: `npm run dev -- --host 127.0.0.1 --port 8080`. Reuse an existing server where possible. `/?layouts` is a development-only review selector for the 16 live portfolio presets.

Run focused tests:

```sh
npx vitest run src/test/canvas.test.ts src/test/genui.test.ts src/test/ExplorationCanvas.test.tsx src/test/HomeExplore.test.tsx src/test/composeApi.test.ts
npm run build
```

Check the idle homepage, an active comparison, Taiwan project exploration, photo navigation, and narrow layouts in a real browser. Confirm no horizontal overflow or controls escaping the AI window. Check both light and dark modes and restore the user's appearance afterward. A preset rendering successfully does not establish that natural-language routing selected it correctly.

The build generates public/feed.xml, public/sitemap.xml, and public/image-sitemap.xml; review generated changes separately. Publish or push only when the owner requests it. Keep the local preview available for review.

The AI window has a faint inset shadow that fades on hover/focus and remains during exploration. Use the panel well/shadow theme tokens; the input itself stays flat within that shared surface. No exterior halo, lift, pulsing light, or focus outline. Animate opacity only and honor reduced motion; pause suggestions when offscreen or the tab is hidden. Suggestion text shares a fixed measured footprint and crossfades without blank frames; pause cycling while its button is hovered or focused.

Album interiors use continuous alternating landscape/square pairs with the existing 3px seams and site corners. Shuffle album order and each album’s photos once per document load; preserve that order through filtering, opening, closing, and lightbox navigation. Reveal only the known location at the bottom left on hover/focus; never derive scene titles from filenames.

Header IIS/menu and the closed Search icon use white `mix-blend-mode: difference` layers portaled to document.body. This provides per-pixel inversion over photos, outside route transforms. Keep search forms and result panels outside those blend layers. Do not restore canvas luminance sampling or synchronized whole-header color switching.

Explore autocomplete uses curated portfolio questions in `src/lib/experiencePrompts.ts`, matched locally with prefixes, aliases, and bounded typo tolerance. Keep suggestions about Isaac’s actual experience. Arrow keys select, Enter commits, Escape/Tab dismiss; never replace a draft on highlight or call providers while typing. Preserve IME input and the freeform submit path. `ExperienceAutocomplete.tsx` owns the accessible combobox/listbox interaction.

AI result height follows a measured inner container, including project rollouts and view changes. Keep exiting content inert and hidden from assistive technology. On Clear, finish the vertical fold before releasing the expanded shell width. Preserve component state during resizing; do not scale text with layout transforms.

The resting Explore bar must be flat, with zero shadow/glow opacity. Before results, hover/focus depth is clipped to the compact input surface, never the surrounding padded window. Suggestions sit clearly below the input. Expanded results retain faint whole-panel inset depth.

Autocomplete expands in normal flow inside the composer form, sharing its surface and frame; never render it as a floating shadowed card. Hover uses a simple opacity fade with no sweep or colored glow. Honor reduced motion and preserve a flat resting state.

All portfolio interface corners now use `--site-corner-radius` (7px), including the AI panel and controls. Text uses a shared neutral dark gray in light mode and white in dark mode; solid control ink is black/white, never olive. Keep photo-overlay captions white. Sidebar Search is icon-only; About and meeting scheduling are absent. Only Light and Dark are offered, and stored Skull preferences migrate to the previous normal theme. The recess uses one faint shadow layer with a simple fade and no resting shadow.

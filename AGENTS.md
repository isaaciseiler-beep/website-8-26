# Working on this portfolio

## Product direction

Keep the homepage quiet: the original header and sidebar, one centered Explore input framed in the photographed Macintosh SE, and below it the photo strip, a level ribbon of stacked photographs inside a card aligned with the Macintosh base (modeled on devouringdetails.com Mantras) using the hand-picked `featuredPhotos`. Each photo shows only its leading edge. On hover, focus, click, or tap, that slice glides into a centered preview at the same height as the strip. The photographs on either side slide horizontally. Previews share one width and center-crop wide photographs. The location and View album link sit below the card, aligned with its edges. Hovering another visible slice opens it after a short dwell once the rail has mostly settled. The current preview stays open under the pointer and gives visitors time to move from its original slice to the center. Touch users can swipe the ribbon sideways with momentum. The strip drifts slowly, eases to a stop on hover, and resumes after the pointer leaves. It keeps the browsed position when a preview closes, pauses offscreen, and stays still under reduced motion. Strip images are local resized copies in `public/photo-strip` (420px strip, 1400px lifted); never load the R2 originals there. Results stay inside one expanding AI window and use normal page scrolling. Photo albums live on `/photos`, whose footer is the photo globe (`PhotoGlobeFooter`); the location ticker stays available until the globe's controls come into view. `/photos/map` redirects to `/photos#photo-globe`.

Interactive views are the main experience. Articles and external links belong in collapsed Sources or an explicitly requested reading view. Avoid automatic project lists, introductory marketing copy, repeated headings, repeated scores, nested cards, unnecessary controls, or persistent labels over photographs.

## Design

For UI work, follow GUI.md and the supplied graphical-ui, graphical-convert, and graphical-audit guides in docs/design/untitled-theme/skills/. The theme snapshot is preserved in docs/design/untitled-theme/GUI.md. Use its named tokens, the site's Satoshi font, and the user-approved Lucide outline icons.

Theme tokens are scoped to `.home-genui` in `src/components/canvas/ai-theme.css`; composition styles live in `home-explore.css`. Prefer spacing and typography over additional filled containers. Keep real keyboard focus visible, reduced-motion support, native labels, and accessible names on icon buttons. Keep the assistant focused on Isaac’s background, professional experience, project responsibilities, process, and published outcomes. Classroom utilities are excluded from live schemas, routing, suggestions, and provider output. Taiwan teaching requests open the actual project story.

Photography is excluded from live AI routing, schemas, suggestions, and local results. Keep the `/photos` gallery and photo globe functional. The gallery uses two columns in narrow panes and three when its available width is at least 960px. The sidebar links to Photos; the separate Photo Map page is retired. Album links use `/photos?album=…`; legacy `/?album=…` links redirect there. Photo requests in Explore should not trigger a model call or display a photography notice. Never add album data back to provider prompts.

## Visitor entry points

Homepage suggestions must make sense before a visitor knows the projects. Introduce a subject (AI in government, teaching in Taiwan, career, public service) before specific comparisons or technical controls. Keep the input purpose explicit and examples short. The sidebar’s Work link opens `/work`, an editorial index with two images per row, alternating landscape/square and square/landscape. Hide the page heading and category tags; reveal title and year at the bottom left on hover or keyboard focus (visible on touch devices). Use existing content and known years; do not invent dates or reading times. Its images use `--site-corner-radius` and the site shell gutters, not the AI window radius.

## Implementation map

- `src/components/PhotoStrip.tsx` and `photo-strip.css` own the homepage photo strip, including its card sizing and motion. The strip and preview share a front-facing plane. Leave breathing room between the Macintosh and the strip. Preview images keep the strip height and open by animating their horizontal transform and clip path. The click targets travel with the neighboring slices, and the preview owns its visible crop.
- `src/pages/PhotoHomePage.tsx` (`variant="home" | "photos"`), `PhotosPage.tsx`, `src/lib/photoAlbums.ts`, `src/lib/photoMap.ts`: homepage shell, `/photos` albums and globe footer, North America filtering, and map placement.
- `src/pages/WorkPage.tsx`, `src/pages/work-page.css`: editorial Work index.
- `src/lib/layouts.ts`: the 16 live portfolio layout IDs, names, prompts, and kinds.
- `src/lib/genui.ts`: bounded schema, local composition, layout selection, reference validation.
- `src/lib/portfolioConnections.ts`, `ConnectionsExplorer.tsx`: reviewed cross-project threads; one shared contribution/process/outcomes lens, published supporting passages, portable `connectionId` control.
- `server/jev-composition-advice.ts`: optional closed-set Jev hints for Mistral, with a 750ms deadline and fail-open behavior.
- `src/lib/canvas.ts`: public project/album records, request revisions, content version, routing.
- `src/components/canvas/HomeExplore.tsx`: composer, request cancellation, history, streamed results.
- `ExplorationCanvas.tsx`, `BenchmarkExplorer.tsx`, `LayoutViews.tsx`: interactive views.
- `api/intent.ts`: local preview and control routing; direct Mistral composition when configured, with Typesafe/Jev as the optional routing fallback.
- `api/compose.ts`: Mistral returns a validated composition, never executable UI code.
- `api/public-content.ts`, `api/mcp.ts`: public read-only representations and tools.

Models may choose known IDs and controls. They must not invent facts, scores, photo metadata, routes, or arbitrary HTML. Preserve current controls on follow-up requests. Manual edits cancel pending responses; stale revisions and mismatched content versions must never overwrite them. The government benchmark is an August 2025 snapshot, not current government activity. Never offer lesson planners, feedback generators, language practice, or other general-purpose teaching tools.

## Providers and secrets

The homepage uses server-side `TYPESAFE_API_KEY` and `MISTRAL_API_KEY`; optional `JEV_MODEL` and `MISTRAL_MODEL` select models. Current Mistral default: `mistral-large-4`. No OpenAI fallback is used by the homepage composer. The separate legacy chat implementation is distinct.

The owner keeps provider keys in Vercel. OpenAI and Typesafe keys were explicitly removed from local `.env.local`; do not restore them without instruction. Never display secret values, put them in VITE-prefixed variables, commit them, or infer live service health from mere key presence. `/api/compose` GET reports configuration only.

Typing only edits the draft. Enter, the submit button, or a suggestion commits a request. Local matching supplies an immediate preview; configured Mistral interprets and composes directly. Jev can supply optional, time-bounded advice on known evidence, experience kinds, and cross-project connections; Mistral may disagree and continues when that advice is unavailable. Jev provides optional routing when Mistral is not configured. Greetings and unmatched requests offer starting points instead of inheriting a project. Keep the composer vertically anchored while results expand below it, preserve committed results while editing, and provide Back when opening a project from the work explorer. Local controls update without a model. Process-local caches and quotas are bounded development safeguards, not distributed spending limits. Local authored UI, mocked provider checks, live provider behavior, and deployed behavior are separate verification claims.

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

Explore autocomplete uses curated portfolio questions in `src/lib/experiencePrompts.ts`, matched locally with prefixes, aliases, and bounded typo tolerance. Keep suggestions about Isaac’s actual experience. Arrow keys select, Enter commits, Escape/Tab dismiss; never replace a draft on highlight or call providers while typing. Preserve IME input and the freeform submit path. `ExperienceAutocomplete.tsx` owns a native multiline textbox with listbox suggestions. Keep its valid textbox semantics; do not assign a combobox role to a textarea. The same editable element stays mounted through focus, results, and help. A hidden copy measures wrapping for a bounded height animation, including width and font changes. Escape restores native vertical caret movement; Alt+Down reopens suggestions.

AI result height follows a measured inner container, including project rollouts and view changes. Keep exiting content inert and hidden from assistive technology. Expansion and retraction move the shell width, surface edges, and measured result height on one continuous curve. Autocomplete transfers its space directly into results, without folding first. Keep outgoing content laid out at its measured width until it exits. Preserve component state during resizing; do not scale text with layout transforms.

The resting Explore bar must be flat, with zero shadow/glow opacity. Before results, hover/focus depth is clipped to the compact input surface, never the surrounding padded window. Suggestions sit clearly below the input. Expanded results retain faint whole-panel inset depth.

Autocomplete expands in normal flow inside the composer form, sharing its surface and frame; never render it as a floating shadowed card. Hover uses a simple opacity fade with no sweep or colored glow. Honor reduced motion and preserve a flat resting state.

All portfolio interface corners now use `--site-corner-radius` (7px), including the AI panel and controls. Text uses a shared neutral dark gray in light mode and white in dark mode; solid control ink is black/white, never olive. Keep photo-overlay captions white. Sidebar Search is icon-only; About and meeting scheduling are absent. Only Light and Dark are offered, and stored Skull preferences migrate to the previous normal theme. The recess uses one faint shadow layer with a simple fade and no resting shadow.
